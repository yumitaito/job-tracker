# Job Tracker

転職活動で見つけた求人情報と応募状況を一元管理する、求人応募管理アプリです。
Supabase Auth によるアカウント機能に対応しており、ユーザーごとに自分の求人データだけを管理できます。

## 目次

- [主な機能](#主な機能)
- [クイックスタート](#クイックスタート)
- [機能ごとの追加設定](#機能ごとの追加設定)
- [開発・テスト](#開発テスト)
- [画面構成](#画面構成)
- [使用技術](#使用技術)
- [ディレクトリ構成](#ディレクトリ構成)
- [データベース](#データベース)
- [URL 自動入力](#url-自動入力edge-function)
- [Web Push 通知](#web-push-通知)
- [セキュリティ](#セキュリティ)
- [Vercel へのデプロイ](#vercel-へのデプロイ)
- [E2E テスト（Playwright）](#e2e-テストplaywright)
- [開発フロー（Claude Code）](#開発フローclaude-code)
- [デザイン素材](#デザイン素材)

## 主な機能

### 認証・アカウント

- アカウント登録・ログイン・ログアウト・ログイン状態の保持（Supabase Auth）
- 設定画面（表示名・メールアドレスの変更、パスワード変更、面接リマインダー通知のオン/オフ、アカウント削除）

### 求人管理

- 求人の登録・一覧表示・詳細確認・編集・削除（Supabase と接続した CRUD、ログインユーザー単位）
- 9 段階の選考ステータス管理（未応募〜辞退）とステータス別絞り込み
- 志望度（高 / 中 / 低）の設定・表示
- 面接日時・面接入室 URL の記録（カジュアル / 一次 / 二次 / 最終）
- 一覧でのインライン編集（ステータス・志望度・面接日時など）
- ドラッグ&ドロップによる手動並び替え（カスタム順）
- 並び替え（カスタム順・面接日時が近い順・応募日・更新日・企業名）
- 使用技術のタグ入力（Enter で追加、Badge の × で削除）
- 応募先 URL 入力時の求人情報ベストエフォート自動入力（[詳細](#url-自動入力edge-function)）

### 面接リマインダー

- 面接開始 5 分前のアプリ内アラート（タブ表示中）
- Web Push 通知（ブラウザを閉じていても OS 通知、[詳細](#web-push-通知)）

### UI・UX

- Loading / Empty / Error / Not Found の各状態表示
- 削除時の確認ダイアログ（求人・アカウントとも）
- PC（テーブル表示）・スマートフォン（カード表示）のレスポンシブ対応

## クイックスタート

**前提**: Node.js 22 以上（CI と同じバージョン）、Supabase プロジェクト

```bash
npm install
cp .env.example .env
# .env に VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定（Dashboard → Project Settings → API）
npm run dev
```

**Supabase 側**（アプリを使う前に 1 回）:

1. SQL Editor で [`supabase/schema.sql`](supabase/schema.sql) を実行する
2. Authentication → Providers で **Email** プロバイダが有効になっていることを確認する
3. （任意）アカウント削除を使う場合: `supabase functions deploy delete-account --project-ref <project-ref>`

起動後 `http://localhost:5173` にアクセスします。未ログイン状態で `/` や `/jobs` にアクセスすると `/login` にリダイレクトされます。

> 既存環境からのアップグレード、URL 自動入力、Web Push など追加機能は [機能ごとの追加設定](#機能ごとの追加設定) を参照してください。

## 機能ごとの追加設定

| 機能 | DB（`schema.sql`） | Edge Function | 環境変数 / Secrets | その他 |
| --- | --- | --- | --- | --- |
| 基本 CRUD・認証 | 必須 | — | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | — |
| アカウント削除 | 含む | `delete-account`（必須） | — | [詳細](#アカウント削除) |
| URL 自動入力 | 含む | `fetch-job-metadata`（任意） | — | [詳細](#url-自動入力edge-function) |
| アプリ内リマインダー | 含む | — | — | タブ表示中のみ動作 |
| Web Push 通知 | 含む | `send-interview-reminders` | `VITE_VAPID_PUBLIC_KEY` + Supabase Secrets | pg_cron 設定が必要。[詳細](#web-push-通知) |

Edge Functions の一括デプロイ例:

```bash
supabase functions deploy delete-account --project-ref <project-ref>
supabase functions deploy fetch-job-metadata --project-ref <project-ref>   # 任意
supabase functions deploy send-interview-reminders --project-ref <project-ref>  # Web Push 利用時
```

## 開発・テスト

```bash
npm run dev          # 開発サーバー（http://localhost:5173）
npm run lint         # ESLint
npm run typecheck    # tsc -b
npm run test         # Vitest（vitest run）
npm run test:security # Secret・RLS・RPC・schema/migration契約の静的検査
npm run test:db      # Supabase local上のRLS/RPC統合テスト（要Docker/Supabase CLI）
npm run test:edge    # Edge Functionのfmt/check/test（要Deno）
npm run test:watch   # Vitest watch モード
npm run build        # 型チェック + 本番ビルド
npm run preview      # ビルド成果物のプレビュー
npm run test:e2e     # Playwright E2E（詳細は下記）
```

PR に対して GitHub Actions（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）でフロントエンド、DB/RLS/RPC、Edge Function、Public E2Eを独立して検査します。

### 品質ゲートとbranch protection

GitHubの Settings → Branches → Branch protection rules で`main`に「Require status checks to pass」を設定し、次の固定check名を必須にしてください。

- `Frontend Quality`
- `Backend Security Integration`
- `Edge Function Security`
- `Public E2E`

併せて「Require branches to be up to date before merging」と「Require conversation resolution」を有効にします。設定完了前はこれらのcheckはmergeを強制的には止めません。`.github/CODEOWNERS`はセキュリティ境界のレビュー依頼先を明示しますが、単独開発では自分自身のCode Owner approvalを付けられないため、「Require review from Code Owners」は必須化しません。review/test-agentのチェック欄はレビュー証跡であり、エージェント実行自体をCIが検証するものではありません。

DB統合テストはCI/ローカル専用bootstrapへgit履歴上の初期schemaを作成後、`0001`以降を再生します。bootstrapは通常のmigrationではないため、既存remoteのmigration履歴や本番適用には影響せず、migration repairも不要です。ローカル実行手順:

```bash
npm run setup:db:security
npm run test:db
supabase stop --no-backup
```

認証済みE2Eは`Backend Security Integration`内の同じSupabase stackへテストユーザーを自動作成して常時実行します。Secrets未設定による黙示的skipはセキュリティcheckとして扱いません。`Public E2E`は未認証ルートだけを明示的に担当します。

静的security contract検査は早期検知の補助です。実際のRLS・権限・RPCトランザクション性はSupabase local上のDB統合テストを正とします。CI actionはcommit SHAで固定し、Dependabot等で更新候補を確認して、提供元のreleaseとSHAを照合して更新してください。Supabase CLIとDenoもworkflow内で明示したバージョンを意図的に更新します。

## 画面構成

| 画面 | URL | 説明 | 認証 |
| --- | --- | --- | --- |
| ログイン | `/login` | メールアドレス・パスワードでログイン | 不要 |
| アカウント登録 | `/signup` | 表示名・メールアドレス・パスワードで新規登録 | 不要 |
| 求人一覧 | `/jobs` | 一覧表示・絞り込み・並び替え・削除 | 必要 |
| 求人登録 | `/jobs/new` | 新規求人の登録フォーム | 必要 |
| 求人詳細 | `/jobs/:id` | 求人情報の詳細確認・編集/削除への導線 | 必要 |
| 求人編集 | `/jobs/:id/edit` | 既存求人の編集フォーム | 必要 |
| 設定 | `/settings` | プロフィール変更、面接リマインダー通知、ログアウト、アカウント削除 | 必要 |

未ログイン状態で認証が必要な画面へアクセスすると `/login` へリダイレクトされ、ログイン後は元のページへ戻ります。

## 使用技術

- React 19 / TypeScript / Vite
- React Router（ルーティング・認証ガード）
- Supabase（`@supabase/supabase-js` — DB / Auth / Edge Functions）
- Tailwind CSS v4
- shadcn/ui 相当の UI プリミティブ（Radix UI + class-variance-authority）
- React Hook Form + Zod（フォーム管理・バリデーション）
- TanStack Query（サーバーステート管理）
- @dnd-kit（一覧のドラッグ&ドロップ並び替え）
- lucide-react（アイコン）
- Vitest + React Testing Library（ユニットテスト）
- Playwright（E2E スモークテスト）

## ディレクトリ構成

```text
src/
├── assets/                 デザイン提供素材（装飾画像・写真）
├── components/
│   ├── form/               FormField など認証系フォーム共通コンポーネント
│   ├── layout/             AppHeader / PageContainer など共通レイアウト
│   └── ui/                 shadcn/ui 相当の汎用 UI コンポーネント
├── features/
│   ├── auth/               認証（AuthProvider, ProtectedRoute, auth-api など）
│   ├── jobs/               求人ドメイン（JobForm, JobTable, jobs-api など）
│   └── notifications/      Web Push（PushNotificationSettings, push-subscriptions-api など）
├── lib/                    supabase クライアント, queryClient, cn, フォーマット関数
└── pages/                  ルーティングに対応する各画面
```

責務の分離方針: React コンポーネントから直接 Supabase を呼ばず、`features/*/api` に集約し、
`features/*/hooks` の TanStack Query フック経由でコンポーネントから利用します。
ログイン状態は `AuthProvider`（React Context）で一元管理し、`ProtectedRoute` が未ログイン時のリダイレクトを担当します。

## データベース

スキーマの正本は [`supabase/schema.sql`](supabase/schema.sql) です。主なテーブル:

| テーブル | 用途 |
| --- | --- |
| `jobs` | 求人情報（RLS でユーザー単位に分離） |
| `push_subscriptions` | Web Push 購読情報 |
| `interview_push_sent` | Push 送信済みログ（重複送信防止） |

### 選考ステータス（`jobs.status`）

| 値 | 表示ラベル |
| --- | --- |
| `not_applied` | 未応募 |
| `document_screening` | 書類選考中 |
| `casual_interview` | カジュアル面接 |
| `first_interview` | 一次面接 |
| `second_interview` | 二次面接 |
| `final_interview` | 最終面接 |
| `offer` | 内定 |
| `rejected` | 不採用 |
| `withdrawn` | 辞退 |

`updated_at` は更新のたびに DB 側の trigger で自動更新されます。

### RLS（Row Level Security）

`jobs` テーブルは RLS を有効化し、以下のポリシーで「自分が作成した求人だけ操作できる」状態にしています。

```sql
using (auth.uid() = user_id)       -- select / update / delete
with check (auth.uid() = user_id)  -- insert / update
```

### 既存環境からの migration

**新規セットアップ**は `schema.sql` のみで完結します。以下は既存 DB を段階的にアップグレードする場合のみ、番号順に必要なものを実行してください。

| # | ファイル | いつ必要か | 内容 |
| --- | --- | --- | --- |
| 0001 | [`0001_make_application_date_optional.sql`](supabase/migrations/0001_make_application_date_optional.sql) | 旧 schema で `application_date` が NOT NULL | 応募日を任意項目に |
| 0002 | [`0002_add_user_auth_and_rls.sql`](supabase/migrations/0002_add_user_auth_and_rls.sql) | 認証なし版から移行 | `user_id` 追加 + RLS |
| 0003 | [`0003_expand_job_status_stages.sql`](supabase/migrations/0003_expand_job_status_stages.sql) | 2 段階ステータス（`applied` あり） | 8 段階に拡張 |
| 0004 | [`0004_add_interview_datetimes.sql`](supabase/migrations/0004_add_interview_datetimes.sql) | 面接日時カラムなし | 一次/二次/最終面接日時 |
| 0005 | [`0005_add_push_subscriptions.sql`](supabase/migrations/0005_add_push_subscriptions.sql) | Push テーブルなし | Web Push 用テーブル |
| 0006 | [`0006_add_display_order.sql`](supabase/migrations/0006_add_display_order.sql) | `display_order` なし | 手動並び替え |
| 0007 | [`0007_add_desire_level.sql`](supabase/migrations/0007_add_desire_level.sql) | 志望度カラムなし | 志望度（高/中/低） |
| 0008 | [`0008_add_interview_urls.sql`](supabase/migrations/0008_add_interview_urls.sql) | 面接入室 URL カラムなし | 一次/二次/最終面接 URL |
| 0009 | [`0009_add_casual_interview.sql`](supabase/migrations/0009_add_casual_interview.sql) | 0003 実行済みでカジュアル面接なし | **9 段階**（カジュアル面接追加） |

0003 は破壊的変更を含むため、実行前にファイル内容を確認してください（`applied` → `document_screening` へ移行）。

### 認証なし版からのデータ移行

`0002` 実行直後は `user_id` が `NULL` の行が RLS により一時的に見えなくなります（データは削除されません）。サインアップ後、Supabase Dashboard で User UID を確認し、以下を実行してください。

```sql
update public.jobs set user_id = '<あなたの User UID>' where user_id is null;
```

### アカウント削除

Supabase Auth のユーザー本体（`auth.users`）削除には service_role key が必要なため、
`supabase/functions/delete-account` Edge Function 経由でのみ実行しています。

- フロントエンドはログイン中ユーザーのアクセストークンを添えて Edge Function を呼び出す
- Edge Function 側でトークンを検証し、**本人のアカウントのみ**削除可能
- `jobs.user_id` が `on delete cascade` のため、関連求人も DB レベルで自動削除
- service_role key は Supabase が Edge Function へ自動注入（手動登録不要）

## URL 自動入力（Edge Function）

求人登録・編集フォームの「応募先 URL」欄に URL を入力してフォーカスを外す（または横の 🪄 ボタンを押す）と、
`fetch-job-metadata` がそのページを取得し、空欄の項目にベストエフォートで自動入力します。

SSRF対策として、取得先はSupabase Secret `JOB_METADATA_ALLOWED_HOSTS` で明示したホストだけに制限されます。
完全一致は `example.com`、サブドメインのみ許可する場合は `*.example.com` とし、複数はカンマ区切りで指定してください。
未設定時はすべての取得を拒否します。DNS再束縛を避けるため、信頼できる求人媒体のホストだけを登録してください。

- 抽出方法: schema.org `JobPosting` 構造化データ（JSON-LD）→ OGP / `<title>` 等へフォールバック
- 既に入力済みの項目は上書きしない
- CORS 回避のため Edge Function 経由でサーバー側から取得
- サイトによっては取得できないことがある（正常な挙動）
- ローカルホストやプライベート IP への URL は拒否（簡易 SSRF 対策）

## Web Push 通知

面接開始 5 分前に、**ブラウザを閉じていても** OS 通知でリマインドします。
設定画面の「面接リマインダー通知」からオンにできます。面接入室 URL が登録されている場合は通知本文に含めます。

### 1. VAPID キーの生成

```bash
npx web-push generate-vapid-keys
```

- **Public Key** → `.env` の `VITE_VAPID_PUBLIC_KEY`
- **Private Key** → Supabase Secrets の `VAPID_PRIVATE_KEY`

### 2. Supabase Secrets の登録

Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | 値 |
| --- | --- |
| `VAPID_PUBLIC_KEY` | 上記 Public Key |
| `VAPID_PRIVATE_KEY` | 上記 Private Key |
| `VAPID_SUBJECT` | `mailto:あなたのメールアドレス` |
| `CRON_SECRET` | **必須**。長いランダム文字列（未設定時は Edge Function が全リクエストを拒否） |

### 3. Edge Function のデプロイ

```bash
supabase functions deploy send-interview-reminders --project-ref <あなたの project-ref>
```

### 4. 定期実行（1 分ごと）の設定

Database → Extensions で `pg_cron` と `pg_net` を有効化し、SQL Editor で cron ジョブを登録します。

```sql
select cron.schedule(
  'send-interview-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-interview-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <anon-key>',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 動作の前提

- **HTTPS**（本番）または **localhost**（開発）で動作
- Chrome / Edge / Firefox など Push 対応ブラウザが必要
- Safari は macOS/iOS の PWA 追加後など、環境によって制限あり
- タブ表示中は画面上部のアプリ内アラートも併用
- Service Worker（`public/sw.js`）が Push 受信と通知表示を担当

## セキュリティ

- Supabase Auth のセッション管理（`supabase-js` 標準機能）を利用。認証情報を独自に localStorage へ保存する実装は行っていない
- service_role key は Edge Function 内でのみ使用。フロントエンドのソースコード・環境変数（`VITE_*`）には含めない
- `jobs` テーブルは RLS により「本人の行のみ操作可能」
- メール確認（Confirm email）は Supabase プロジェクトの Authentication 設定に従う。デフォルトでは新規登録時に確認メールが送信され、認証完了までログインできない

## Vercel へのデプロイ

フロントエンドは Vercel へのデプロイを想定しています（`vercel.json` に SPA 用 rewrite 設定あり）。

1. Vercel プロジェクトを作成し、GitHub リポジトリと連携
2. Environment Variables に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` を設定
3. Web Push を使う場合は `VITE_VAPID_PUBLIC_KEY` も追加

GitHub 連携が有効な場合、PR ごとに Preview Deployment が生成され、`main` への merge 後に Production Deployment が自動実行されます。

## E2E テスト（Playwright）

[Playwright](https://playwright.dev/) による E2E スモークテストを `e2e/` に用意しています。
Vitest（`src/` 配下）とは別体系で、Chromium を起動してログイン画面・未ログイン時リダイレクト・404 などを確認します。

| ファイル | 内容 |
| --- | --- |
| `e2e/global-setup.ts` | 認証情報があれば UI 経由でログインし、セッションを `e2e/.auth/user.json` に保存 |
| `e2e/smoke/unauthenticated.spec.ts` | 未ログイン系（Secrets 不要、常時実行） |
| `e2e/smoke/authenticated.spec.ts` | ログイン後（認証情報必須、未設定時は skip） |

### GitHub Secrets（認証ありテスト用）

| Secret 名 | 内容 |
| --- | --- |
| `E2E_SUPABASE_URL` | E2E 用 Supabase プロジェクト URL |
| `E2E_SUPABASE_ANON_KEY` | 同プロジェクトの anon key |
| `E2E_TEST_USER_EMAIL` | E2E 専用アカウントのメール |
| `E2E_TEST_USER_PASSWORD` | E2E 専用アカウントのパスワード |

未登録でも CI は失敗しません（未ログイン系のみ実行、ログイン後テストは skip）。
**E2E 専用アカウント**を別途用意し、業務データを持つアカウントは使わないでください。

### ローカル実行

```bash
npx playwright install --with-deps chromium   # 初回のみ

npm run test:e2e                              # 未ログイン系のみ
E2E_TEST_USER_EMAIL=you+e2e@example.com \
E2E_TEST_USER_PASSWORD=xxxxxxxx \
  npm run test:e2e                            # ログイン後も含む

npm run test:e2e:ui                           # UI モード（デバッグ用）
```

`test:e2e` は内部で `npm run dev` を自動起動します（`playwright.config.ts` の `webServer` 設定）。

## 開発フロー（Claude Code）

`.claude/agents/` に product / architect / ui-ux / implement / review / test の専門サブエージェントを用意し、
依頼内容に応じて実装から Pull Request 作成まで進める運用にしています。詳細は [`CLAUDE.md`](CLAUDE.md) を参照してください。

## デザイン素材

`src/assets/decorations` と `src/assets/photos` には、提供されたデザイン画像内の装飾（吹き出し・スクリブル・波線など）と
人物写真を配置しています。ボタン・入力欄・カード・テーブル・Badge などの機能的な UI はすべて React/Tailwind で実装しており、
画像としては貼り付けていません。
