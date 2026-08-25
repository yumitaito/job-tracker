export type DnsLookupResult =
  | { status: "records"; addresses: string[] }
  | { status: "no-records" }
  | { status: "error" };

export function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "::1") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  return false;
}

export function isBlockedIpAddress(address: string): boolean {
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
  return ip === "::" || ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") ||
    /^fe[89ab]/.test(ip) || ip.startsWith("ff");
}

export function isAllowedHost(hostname: string, patterns: string[]): boolean {
  const host = hostname.toLowerCase();
  return patterns.some((raw) => {
    const pattern = raw.trim().toLowerCase();
    return pattern.startsWith("*.")
      ? host.endsWith(pattern.slice(1)) && host !== pattern.slice(2)
      : host === pattern;
  });
}

export async function assertSafeTarget(
  target: URL,
  allowedHosts: string[],
  resolve: (hostname: string, type: "A" | "AAAA") => Promise<DnsLookupResult>,
): Promise<void> {
  if (
    !["http:", "https:"].includes(target.protocol) || target.username || target.password ||
    isBlockedHost(target.hostname) || isBlockedIpAddress(target.hostname)
  ) {
    throw new Error("このURLは取得できません");
  }
  if (!isAllowedHost(target.hostname, allowedHosts)) {
    throw new Error("このURLのホストは取得許可されていません");
  }
  const results = await Promise.all([
    resolve(target.hostname, "A"),
    resolve(target.hostname, "AAAA"),
  ]);
  if (results.some((result) => result.status === "error")) {
    throw new Error("URLの安全性を確認できません");
  }
  const addresses = results.flatMap((result) =>
    result.status === "records" ? result.addresses : []
  );
  if (!addresses.length) throw new Error("URLの安全性を確認できません");
  if (addresses.some(isBlockedIpAddress)) throw new Error("このURLは取得できません");
}
