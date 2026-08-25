// Supabase Edge Function: fetch-job-metadata
//
// 求人応募先URLを受け取り、サーバー側でページを取得して
// 企業名・職種・勤務地・雇用形態・年収・使用技術などをベストエフォートで抽出する。
// ブラウザから直接fetchするとCORSで失敗するため、このEdge Function経由で取得する。
//
// 抽出方法（優先順）：
//   1. schema.org の JobPosting 構造化データ（JSON-LD）
//   2. OGP / <title> などの一般的なメタタグ
//
// サイトによっては一部項目しか取得できない、または全く取得できないことがある。

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JobMetadata = {
  company_name?: string;
  position?: string;
  location?: string;
  employment_type?: string;
  min_salary?: number;
  max_salary?: number;
  technologies?: string[];
};

type FunctionResponse =
  | { ok: true; source: "structured" | "meta" | "none"; data: JobMetadata }
  | { ok: false; error: string };

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_LENGTH = 2_000_000;

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "正社員",
  CONTRACTOR: "業務委託",
  TEMPORARY: "契約社員",
  INTERN: "インターン",
  PART_TIME: "その他",
  VOLUNTEER: "その他",
  PER_DIEM: "その他",
  OTHER: "その他",
};

function jsonResponse(body: FunctionResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

/** 明らかにローカル/プライベートなホストへのリクエストを拒否する（簡易SSRF対策） */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "::1") return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

/** DNS解決結果を含め、ループバック・プライベート・リンクローカル等を拒否する */
function isBlockedIpAddress(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "");
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mapped) return isBlockedHost(mapped);
  const mappedHex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = Number.parseInt(mappedHex[1], 16);
    const low = Number.parseInt(mappedHex[2], 16);
    return isBlockedHost(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  if (ip.includes(".")) {
    if (isBlockedHost(ip)) return true;
    const first = Number(ip.split(".")[0]);
    return first === 0 || first >= 224;
  }
  return ip === "::" || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd")
    || /^fe[89ab]/.test(ip) || ip.startsWith("ff");
}

type DnsLookupResult =
  | { status: "records"; addresses: string[] }
  | { status: "no-records" }
  | { status: "error" };

async function resolveDnsRecords(
  hostname: string,
  recordType: "A" | "AAAA",
): Promise<DnsLookupResult> {
  try {
    const addresses = await Deno.resolveDns(hostname, recordType);
    return addresses.length > 0 ? { status: "records", addresses } : { status: "no-records" };
  } catch (error) {
    // Denoが明示するNotFoundだけを「その種類のレコードなし」として扱う。
    // timeout / SERVFAIL / PermissionDenied / NotSupported / 未知エラーは全て検査失敗。
    if (error instanceof Deno.errors.NotFound) return { status: "no-records" };
    return { status: "error" };
  }
}

async function assertSafeTarget(target: URL): Promise<void> {
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
    throw new Error("このURLは取得できません");
  }
  if (isBlockedHost(target.hostname) || isBlockedIpAddress(target.hostname)) {
    throw new Error("このURLは取得できません");
  }
  const allowedHosts = (Deno.env.get("JOB_METADATA_ALLOWED_HOSTS") ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const hostname = target.hostname.toLowerCase();
  const allowed = allowedHosts.some((pattern) =>
    pattern.startsWith("*.")
      ? hostname.endsWith(pattern.slice(1)) && hostname !== pattern.slice(2)
      : hostname === pattern
  );
  if (!allowed) throw new Error("このURLのホストは取得許可されていません");

  // Aのみ/AAAAのみのホストを許容しつつ、少なくとも一方で安全な実アドレスを確認する。
  // resolver自体が利用不能な場合など、両方を検査できなければ安全側に倒す。
  const dnsResults = await Promise.all([
    resolveDnsRecords(target.hostname, "A"),
    resolveDnsRecords(target.hostname, "AAAA"),
  ]);
  if (dnsResults.some((result) => result.status === "error")) {
    throw new Error("URLの安全性を確認できません");
  }
  const addresses = dnsResults.flatMap((result) =>
    result.status === "records" ? result.addresses : []
  );
  if (addresses.length === 0) throw new Error("URLの安全性を確認できません");
  if (addresses.some(isBlockedIpAddress)) throw new Error("このURLは取得できません");
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    "#39": "'",
    apos: "'",
    nbsp: " ",
  };
  return text
    .replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z0-9]+);/g, (match, entity: string) => {
      if (entity.startsWith("#x")) return String.fromCodePoint(parseInt(entity.slice(2), 16));
      if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(1), 10));
      return named[entity] ?? match;
    })
    .trim();
}

function extractMeta(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*/?>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["'][^>]*/?>`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1]);
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1]) : undefined;
}

// deno-lint-ignore no-explicit-any
function extractJobPosting(html: string): any | undefined {
  const scripts = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  for (const match of scripts) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const candidates = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.["@graph"])
          ? parsed["@graph"]
          : [parsed];
      for (const item of candidates) {
        const type = item?.["@type"];
        const isJobPosting =
          type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
        if (isJobPosting) return item;
      }
    } catch {
      // 不正なJSON-LDは無視して次を試す
    }
  }
  return undefined;
}

// deno-lint-ignore no-explicit-any
function stringifyLocation(jobLocation: any): string | undefined {
  const loc = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation;
  if (!loc) return undefined;
  if (typeof loc === "string") return loc;
  const address = loc.address ?? loc;
  if (typeof address === "string") return address;
  const parts = [address?.addressRegion, address?.addressLocality, address?.streetAddress].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join("") : undefined;
}

// deno-lint-ignore no-explicit-any
function extractEmploymentType(jobPosting: any): string | undefined {
  const raw = jobPosting.employmentType;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return undefined;
  return EMPLOYMENT_TYPE_MAP[value.toUpperCase()];
}

// deno-lint-ignore no-explicit-any
function extractSalary(jobPosting: any): { min?: number; max?: number } {
  const baseSalary = jobPosting.baseSalary;
  if (!baseSalary) return {};
  const currency = baseSalary.currency ?? baseSalary.value?.currency;
  if (currency && currency !== "JPY") return {};

  const value = baseSalary.value ?? baseSalary;
  const unit: string | undefined = value?.unitText;
  let min: number | undefined = typeof value?.minValue === "number" ? value.minValue : undefined;
  let max: number | undefined = typeof value?.maxValue === "number" ? value.maxValue : undefined;
  if (min === undefined && max === undefined && typeof value?.value === "number") {
    min = value.value;
    max = value.value;
  }
  if (min === undefined && max === undefined) return {};

  const multiplier = unit === "MONTH" ? 12 : unit === "YEAR" || !unit ? 1 : undefined;
  if (multiplier === undefined) return {}; // HOUR/DAYなどは年収換算できないため見送る

  const toManYen = (n?: number) => (n === undefined ? undefined : Math.round((n * multiplier) / 10000));
  return { min: toManYen(min), max: toManYen(max) };
}

// deno-lint-ignore no-explicit-any
function extractTechnologies(jobPosting: any): string[] | undefined {
  const raw: unknown = jobPosting.skills ?? jobPosting.qualifications;
  if (typeof raw !== "string") return undefined;
  const tokens = raw
    .split(/[,、,\n]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 30);
  return tokens.length > 0 ? tokens.slice(0, 10) : undefined;
}

function cleanPositionFromTitle(title: string, siteName?: string): string {
  const separators = ["｜", "|", " - ", " – ", "："];
  let cleaned = title;
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const [first, ...rest] = cleaned.split(sep);
      // サイト名が末尾に含まれる場合はタイトル側の先頭部分だけを採用する
      if (siteName && rest.join(sep).includes(siteName)) {
        cleaned = first;
        break;
      }
    }
  }
  return cleaned.trim();
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let target = new URL(url);
    let res: Response | null = null;
    for (let redirects = 0; redirects <= 5; redirects += 1) {
      await assertSafeTarget(target);
      res = await fetch(target, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JobTrackerBot/1.0)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ja,en;q=0.8",
        },
      });
      if (![301, 302, 303, 307, 308].includes(res.status)) break;
      const location = res.headers.get("location");
      if (!location || redirects === 5) throw new Error("リダイレクトが多すぎます");
      target = new URL(location, target);
    }
    if (!res) throw new Error("ページの取得に失敗しました");
    if (!res.ok) throw new Error(`ページの取得に失敗しました（HTTP ${res.status}）`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) throw new Error("HTMLページではありません");
    const declaredLength = Number(res.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_HTML_LENGTH) {
      throw new Error("ページのサイズが上限を超えています");
    }
    if (!res.body) return "";
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let totalBytes = 0;
    let html = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_HTML_LENGTH) {
        await reader.cancel();
        throw new Error("ページのサイズが上限を超えています");
      }
      html += decoder.decode(value, { stream: true });
    }
    return html + decoder.decode();
  } finally {
    clearTimeout(timer);
  }
}

function buildMetadata(html: string): { source: "structured" | "meta" | "none"; data: JobMetadata } {
  const jobPosting = extractJobPosting(html);
  const ogSiteName = extractMeta(html, "og:site_name");
  const ogTitle = extractMeta(html, "og:title");
  const title = extractTitle(html);

  const data: JobMetadata = {};
  let hasStructured = false;

  if (jobPosting) {
    if (typeof jobPosting.title === "string") {
      data.position = jobPosting.title.trim();
      hasStructured = true;
    }
    const orgName = jobPosting.hiringOrganization?.name;
    if (typeof orgName === "string") {
      data.company_name = orgName.trim();
      hasStructured = true;
    }
    const location = stringifyLocation(jobPosting.jobLocation);
    if (location) {
      data.location = location;
      hasStructured = true;
    }
    const employmentType = extractEmploymentType(jobPosting);
    if (employmentType) {
      data.employment_type = employmentType;
      hasStructured = true;
    }
    const { min, max } = extractSalary(jobPosting);
    if (min !== undefined) data.min_salary = min;
    if (max !== undefined) data.max_salary = max;
    if (min !== undefined || max !== undefined) hasStructured = true;

    const technologies = extractTechnologies(jobPosting);
    if (technologies) {
      data.technologies = technologies;
      hasStructured = true;
    }
  }

  if (!data.company_name && ogSiteName) {
    data.company_name = ogSiteName.trim();
  }
  if (!data.position) {
    const rawTitle = ogTitle ?? title;
    if (rawTitle) {
      data.position = cleanPositionFromTitle(rawTitle, data.company_name ?? ogSiteName);
    }
  }

  const hasAnyData = Object.values(data).some(
    (v) => v !== undefined && !(Array.isArray(v) && v.length === 0),
  );
  if (!hasAnyData) return { source: "none", data: {} };
  return { source: hasStructured ? "structured" : "meta", data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POSTメソッドのみ対応しています" }, 405);
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "リクエストボディが不正です" }, 400);
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return jsonResponse({ ok: false, error: "URLが指定されていません" }, 400);
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return jsonResponse({ ok: false, error: "URLの形式が正しくありません" }, 400);
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return jsonResponse({ ok: false, error: "httpまたはhttpsのURLのみ対応しています" }, 400);
  }
  if (isBlockedHost(target.hostname)) {
    return jsonResponse({ ok: false, error: "このURLは取得できません" }, 400);
  }

  try {
    const html = await fetchHtml(target.toString());
    const { source, data } = buildMetadata(html);
    return jsonResponse({ ok: true, source, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "求人情報の取得に失敗しました";
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
