# Job Tracker

転職活動で見つけた求人情報と応募状況を一元管理する、求人応募管理アプリです。
Supabase Authによるアカウント機能に対応しており、ユーザーごとに自分の求人データだけを管理できます。

## 主な機能

- アカウント登録・ログイン・ログアウト・ログイン状態の保持（Supabase Auth）
- 設定画面（表示名・メールアドレスの変更、パスワード変更、アカウント削除）
- 求人の登録・一覧表示・詳細確認・編集・削除（Supabaseと接続したCRUD、ログインユーザー単位）
- 応募ステータス（`未応募` / `応募済み`）による絞り込み
- 応募日・更新日・企業名での並び替え
- 使用技術のタグ入力（Enterで追加、Badgeの×で削除）
- 応募先URL入力時の求人情報ベストエフォート自動入力（Supabase Edge Function、詳細は下記）
- Loading / Empty / Error / Not Found の各状態表示
- 削除時の確認ダイアログ（求人・アカウントとも）
- PC（テーブル表示）・スマートフォン（カード表示）のレスポンシブ対応

## 使用技術

- React 19 / TypeScript / Vite
- React Router（ルーティング・認証ガード）
- Supabase（`@supabase/supabase-js` — DB / Auth / Edge Functions）
- Tailwind CSS v4
- shadcn/ui相当のUIプリミティブ（Radix UI + class-variance-authority）
- React Hook Form + Zod（フォーム管理・バリデーション）
- TanStack Query（サーバーステート管理）
- lucide-react（アイコン）
- Vitest + React Testing Library（テスト）

## ディレクトリ構成

```text
src/
├── assets/                 デザイン提供素材（装飾画像・写真）
├── components/
│   ├── form/                 FormField など認証系フォーム共通コンポーネント
│   ├── layout/                AppHeader / PageContainer など共通レイアウト
│   └── ui/                    shadcn/ui相当の汎用UIコンポーネント
├── features/
│   ├── auth/
│   │   ├── api/                 Supabase Authへのアクセス関数（auth-api.ts）
│   │   ├── components/          ProtectedRoute / AuthLayout / DeleteAccountDialog
│   │   ├── context/              AuthProvider（ログイン状態のグローバル管理）
│   │   ├── hooks/                 TanStack Queryの認証系ミューテーションフック
│   │   ├── lib/                    Supabaseのエラーメッセージ日本語化
│   │   ├── schemas/                Zodバリデーションスキーマ
│   │   └── types/                   AuthUser型
│   └── jobs/
│       ├── api/              Supabaseへのアクセス関数（jobs-api.ts）
│       ├── components/       求人ドメイン固有のコンポーネント（JobForm, JobTable など）
│       ├── hooks/             TanStack Queryのカスタムフック
│       ├── lib/                フォーム値⇔エンティティの変換など
│       ├── schemas/           Zodバリデーションスキーマ
│       └── types/              Job / Database などの型定義
├── lib/                      supabaseクライアント, queryClient, cn, フォーマット関数
└── pages/                    ルーティングに対応する各画面
```

責務の分離方針：Reactコンポーネントから直接Supabaseを呼ばず、`features/*/api` に集約し、
`features/*/hooks` のTanStack Queryフック経由でコンポーネントから利用します。
ログイン状態は `AuthProvider`（React Context）で一元管理し、`ProtectedRoute` が未ログイン時のリダイレクトを担当します。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの準備

1. [Supabase](https://supabase.com) でプロジェクトを作成します。
2. Supabaseダッシュボードの SQL Editor で以下を実行します。
   - 新規プロジェクトの場合：[`supabase/schema.sql`](supabase/schema.sql)
   - 既に個人利用版（認証なし）の `jobs` テーブルが存在する場合：
     [`supabase/migrations/0001_make_application_date_optional.sql`](supabase/migrations/0001_make_application_date_optional.sql) →
     [`supabase/migrations/0002_add_user_auth_and_rls.sql`](supabase/migrations/0002_add_user_auth_and_rls.sql) の順に実行
     （詳細は「複数ユーザー対応（Supabase Auth）について」を参照）。
   - 既に `supabase/schema.sql`（旧・2段階ステータス版）を実行済みの環境で選考ステータスを8段階に拡張する場合：
     [`supabase/migrations/0003_expand_job_status_stages.sql`](supabase/migrations/0003_expand_job_status_stages.sql) を実行
     （詳細は「ステータスの多段階化」を参照）。
   - 既に `jobs` テーブルを作成済みの環境で面接日時の記録に対応する場合：
     [`supabase/migrations/0004_add_interview_datetimes.sql`](supabase/migrations/0004_add_interview_datetimes.sql) を実行
     （新規セットアップの場合は `supabase/schema.sql` に反映済みのため実行不要）。
   - Web Push 通知を使う場合：
     [`supabase/migrations/0005_add_push_subscriptions.sql`](supabase/migrations/0005_add_push_subscriptions.sql) を実行
     （新規セットアップの場合は `supabase/schema.sql` に反映済みのため実行不要）。
3. Project Settings → API から `Project URL` と `anon public key` を控えます。
4. Authentication → Providers で **Email** プロバイダが有効になっていることを確認します（デフォルトで有効）。
5. Edge Functionsをデプロイします（[Supabase CLI](https://supabase.com/docs/guides/cli)が必要）。

   ```bash
   supabase functions deploy delete-account --project-ref <あなたのproject-ref>
   supabase functions deploy fetch-job-metadata --project-ref <あなたのproject-ref>
   supabase functions deploy send-interview-reminders --project-ref <あなたのproject-ref>
   ```

   - `delete-account`：アカウント削除機能に必須です。デプロイしない場合、設定画面の「アカウントを削除」が動作しません。
   - `fetch-job-metadata`：任意（URL自動入力機能）。デプロイしなくても他の機能には影響しません。
   - `send-interview-reminders`：Web Push 通知に必須です（[Web Push 通知について](#web-push-通知について)を参照）。

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、値を設定します。

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_VAPID_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Web Push を使う場合は `VITE_VAPID_PUBLIC_KEY` も必要です（生成方法は [Web Push 通知について](#web-push-通知について) を参照）。

`.env` はGit管理対象外です（`.gitignore`で除外済み）。**service_role keyはフロントエンドのどこにも配置しないでください。**
Edge Function内でのみ、Supabaseが自動的に注入する環境変数として使用しています。

### 4. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:5173` で起動します。未ログイン状態で `/` や `/jobs` にアクセスすると `/login` にリダイレクトされます。

### 5. Lint・型チェック・テスト

```bash
npm run lint       # ESLint
npm run typecheck  # tsc -b（型チェックのみ）
npm run test       # Vitest（vitest run）
npm run test:watch # Vitestをwatchモードで実行
```

### 6. ビルド

```bash
npm run build
npm run preview
```

## 開発フロー（Claude Codeでの機能追加・修正）

このリポジトリでは `.claude/agents/` にproduct/architect/ui-ux/implement/review/testの
専門サブエージェントを用意し、依頼内容に応じて自動的に適切なエージェントを組み合わせて
実装からPull Request作成までを進める運用にしています。詳細は [`CLAUDE.md`](CLAUDE.md) を参照してください。

PRに対しては GitHub Actions（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）で
`lint` / `typecheck` / `test` / `build`（`quality`ジョブ）と、Playwrightによる
E2Eスモークテスト（`e2e`ジョブ、並列実行）を自動実行します。

## E2Eテスト（Playwright）

[Playwright](https://playwright.dev/) による最小限のE2Eスモークテストを `e2e/` ディレクトリに用意しています。
`src/` 配下のユニットテスト（Vitest）とは別体系で、ブラウザ（Chromiumのみ）を実際に起動して
ログイン画面・未ログイン時のリダイレクト・404ページなどの主要な導線を確認します。

- `e2e/global-setup.ts`：テスト用アカウントの認証情報が設定されていれば、実際に `/login`
  フォームからUI経由でログインし、認証済みセッションを `e2e/.auth/user.json`（Git管理対象外）に保存します。
- `e2e/smoke/unauthenticated.spec.ts`：未ログイン状態で完結するテスト（Secrets不要、常時実行）。
- `e2e/smoke/authenticated.spec.ts`：ログイン後のテスト（テスト用アカウントの認証情報が必須）。
  未設定の場合は `test.skip()` されるため、Secrets未設定でもCIは失敗しません。

### 必要なGitHub Secrets

`e2e`ジョブ・および認証ありのE2Eテストを実行するには、リポジトリに以下のSecretsを登録します
（Settings → Secrets and variables → Actions）。未登録でも `quality`/`e2e` ジョブ自体は失敗しません
（未ログイン系のテストのみ実行され、ログイン後のテストはskipされます）。

| Secret名 | 内容 |
| --- | --- |
| `E2E_SUPABASE_URL` | E2Eテストで使用するSupabaseプロジェクトのURL |
| `E2E_SUPABASE_ANON_KEY` | 同プロジェクトのanon key |
| `E2E_TEST_USER_EMAIL` | E2Eテスト専用アカウントのメールアドレス |
| `E2E_TEST_USER_PASSWORD` | E2Eテスト専用アカウントのパスワード |

**注意**：E2Eテスト専用のアカウントを別途用意し、実際の業務データを持つアカウントは使用しないでください。
E2Eテストはこのアカウントで求人データを作成しない設計になっていますが、念のため専用アカウントを推奨します。

### ローカルでの実行方法

`.env`（`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`）に加えて、認証ありのテストを実行する場合は
環境変数 `E2E_TEST_USER_EMAIL` / `E2E_TEST_USER_PASSWORD` にテスト専用アカウントの認証情報を設定してください。

```bash
# 初回のみ：Playwright用のChromiumをインストール
npx playwright install --with-deps chromium

# 未ログイン系のテストのみ実行する場合（Secrets不要）
npm run test:e2e

# ログイン後のテストも実行する場合
E2E_TEST_USER_EMAIL=you+e2e@example.com E2E_TEST_USER_PASSWORD=xxxxxxxx npm run test:e2e

# UIモードで実行（デバッグ用）
npm run test:e2e:ui
```

`test:e2e` は内部で開発サーバー（`npm run dev`）を自動起動します（`playwright.config.ts` の `webServer` 設定）。
ビルドは行わないため、`.env` が未設定でもプレースホルダー値で起動しますが、その場合は未ログイン系のテストのみ意味を持ちます。

## 画面構成

| 画面 | URL | 説明 | 認証 |
| --- | --- | --- | --- |
| ログイン | `/login` | メールアドレス・パスワードでログイン | 不要 |
| アカウント登録 | `/signup` | 表示名・メールアドレス・パスワードで新規登録 | 不要 |
| 求人一覧 | `/jobs` | 一覧表示・絞り込み・並び替え・削除 | 必要 |
| 求人登録 | `/jobs/new` | 新規求人の登録フォーム | 必要 |
| 求人詳細 | `/jobs/:id` | 求人情報の詳細確認・編集/削除への導線 | 必要 |
| 求人編集 | `/jobs/:id/edit` | 既存求人の編集フォーム | 必要 |
| 設定 | `/settings` | 表示名・メールアドレス変更、パスワード変更、ログアウト、アカウント削除 | 必要 |

未ログイン状態で「認証」が必要な画面へアクセスすると `/login` へリダイレクトされ、ログイン後は元のページへ戻ります。

## jobsテーブル構成

```sql
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  company_name text not null,
  position text not null,
  employment_type text,
  application_url text,
  application_date date, -- 任意項目（未入力可）
  status text not null default 'not_applied', -- 選考ステータス（8段階、下記参照）
  first_interview_at timestamptz, -- 一次面接日時（任意項目）
  second_interview_at timestamptz, -- 二次面接日時（任意項目）
  final_interview_at timestamptz, -- 最終面接日時（任意項目）
  location text,
  technologies text[],
  notes text,
  min_salary integer,
  max_salary integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_status_check check (status in (
    'not_applied',
    'document_screening',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
    'withdrawn'
  )),
  constraint jobs_salary_range_check check (
    min_salary is null or max_salary is null or min_salary <= max_salary
  )
);
```

`status` は選考の進行順に以下の8段階を取ります。

| 値 | 表示ラベル |
| --- | --- |
| `not_applied` | 未応募 |
| `document_screening` | 書類選考中 |
| `first_interview` | 一次面接 |
| `second_interview` | 二次面接 |
| `final_interview` | 最終面接 |
| `offer` | 内定 |
| `rejected` | 不採用 |
| `withdrawn` | 辞退 |

`updated_at` は更新のたびにDB側のtriggerで自動更新されます（詳細は `supabase/schema.sql` を参照）。

### ステータスの多段階化（2026年8月〜）

以前は `not_applied` / `applied` の2段階でしたが、選考の進み具合を追えるよう8段階に拡張しました。
既に `supabase/schema.sql` を実行済みの環境（＝旧2段階のCHECK制約が入っている環境）では、
`supabase/migrations/0003_expand_job_status_stages.sql` をSupabase SQL Editorで実行してください。
このmigrationは、旧CHECK制約の削除・既存データの移行（`applied` → `document_screening`）・新CHECK制約の追加を行います。
新規セットアップの場合は `supabase/schema.sql` に8段階のCHECK制約が反映済みのため、このmigrationの実行は不要です。

## 複数ユーザー対応（Supabase Auth）について

各ユーザーは `auth.users` にアカウントを持ち、`jobs.user_id` で自分の求人データと紐付けられます。
`user_id` の初期値は `default auth.uid()` のため、登録時にアプリ側から明示的に指定する必要はありません。

### RLS（Row Level Security）

`jobs` テーブルはRLSを有効化し、以下のポリシーで「自分が作成した求人だけ操作できる」状態にしています。

```sql
using (auth.uid() = user_id)       -- select / update / delete
with check (auth.uid() = user_id)  -- insert / update
```

フロントエンド側のフィルタリングだけでなく、DBレベルでユーザー間のデータ分離を保証しています。

### 既存データ（認証なし版）からの移行

個人利用版（認証なし）で登録した求人データがある場合、`0002_add_user_auth_and_rls.sql` 実行直後は
`user_id` が `NULL` のため、RLSにより一時的にどのユーザーからも見えなくなります（データは削除されません）。
自分のアカウントに引き継ぐには、サインアップ後にSupabaseダッシュボードで自分の User UID を確認し、
以下のSQLを実行してください（`0002_add_user_auth_and_rls.sql` の末尾にも同じ手順を記載しています）。

```sql
update public.jobs set user_id = '<あなたのUser UID>' where user_id is null;
```

### アカウント削除について

Supabase Authのユーザー本体（`auth.users`）を削除するには管理者権限（service_role key）が必要です。
service_role keyをフロントエンドに置くことはできないため、`supabase/functions/delete-account` という
Edge Functionをサーバー側に用意し、そこでのみ使用しています。

- フロントエンドは、ログイン中ユーザー自身のアクセストークンを添えてEdge Functionを呼び出します。
- Edge Function側でトークンを検証し、**本人のアカウントのみ**削除できるようにしています。
- `jobs.user_id` が `on delete cascade` のため、アカウント削除と同時に、そのユーザーが登録した
  求人データもDBレベルで自動的に削除されます。
- service_role keyはSupabaseが各Edge Functionへ自動的に環境変数として注入するため、
  手動でのシークレット登録は不要です。

## URL自動入力機能（Edge Function）について

求人登録・編集フォームの「応募先URL」欄にURLを入力してフォーカスを外す（または横の🪄ボタンを押す）と、
`supabase/functions/fetch-job-metadata` がそのページを取得し、空欄の項目にベストエフォートで自動入力します。

- 抽出方法：まずページ内の schema.org `JobPosting` 構造化データ（JSON-LD）を探し、なければ
  OGP/`<title>`などの一般的なメタ情報にフォールバックします。
- 既に入力済みの項目は上書きしません。
- ブラウザから直接外部サイトへfetchするとCORSでブロックされるため、Edge Function経由でサーバー側から取得しています。
- サイトによっては取得できる情報が少ない、または全く取得できないことがあります（正常な挙動です）。
- ローカルホストやプライベートIPへのURLはサーバー側で拒否されます（簡易SSRF対策）。

## Web Push 通知について

面接開始5分前に、**ブラウザを閉じていても** OS 通知でリマインドする機能です。
設定画面の「面接リマインダー通知」からオンにできます。

### 1. VAPID キーの生成

```bash
npx web-push generate-vapid-keys
```

- **Public Key** → `.env` の `VITE_VAPID_PUBLIC_KEY`
- **Private Key** → Supabase Secrets の `VAPID_PRIVATE_KEY`

### 2. Supabase Secrets の登録

Supabase Dashboard → Project Settings → Edge Functions → Secrets に以下を追加します。

| Secret | 値 |
| --- | --- |
| `VAPID_PUBLIC_KEY` | 上記 Public Key |
| `VAPID_PRIVATE_KEY` | 上記 Private Key |
| `VAPID_SUBJECT` | `mailto:あなたのメールアドレス` |
| `CRON_SECRET` | **必須**。長いランダム文字列（cron 呼び出し認証用）。未設定の場合、Edge Functionは全リクエストを拒否します |

### 3. Edge Function のデプロイ

```bash
supabase functions deploy send-interview-reminders --project-ref <あなたのproject-ref>
```

### 4. 定期実行（1分ごと）の設定

Supabase Dashboard → Database → Extensions で `pg_cron` と `pg_net` を有効化し、
SQL Editor で以下のような cron ジョブを登録します（URL・キーは自分のプロジェクトに合わせて置き換え）。

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

- **HTTPS**（本番）または **localhost**（開発）で動作します
- Chrome / Edge / Firefox など Push 対応ブラウザが必要です
- Safari は macOS/iOS の PWA 追加後など、環境によって制限があります
- アプリのタブを開いている間は、従来どおり画面上部のアラートも表示されます

## セキュリティについて

- Supabase Authのセッション管理（`supabase-js`標準機能）をそのまま利用しており、認証情報を独自にlocalStorageへ
  保存するような実装は行っていません。
- service_role keyはEdge Function内でのみ使用し、フロントエンドのソースコード・環境変数には含まれません。
- `jobs`テーブルはRLSにより「本人の行のみ操作可能」に制限されています。
- メールアドレスの確認（Confirm email）は、Supabaseプロジェクトの Authentication → Sign In / Providers の
  設定に従います。デフォルトでは新規登録時に確認メールが送信され、認証が完了するまでログインできません。

## デザイン素材について

`src/assets/decorations` と `src/assets/photos` には、提供されたデザイン画像内の装飾（吹き出し・スクリブル・波線など）と
人物写真を配置しています。ボタン・入力欄・カード・テーブル・Badgeなどの機能的なUIはすべてReact/Tailwindで実装しており、
画像としては貼り付けていません。
