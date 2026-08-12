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
3. Project Settings → API から `Project URL` と `anon public key` を控えます。
4. Authentication → Providers で **Email** プロバイダが有効になっていることを確認します（デフォルトで有効）。
5. Edge Functionsをデプロイします（[Supabase CLI](https://supabase.com/docs/guides/cli)が必要）。

   ```bash
   supabase functions deploy delete-account --project-ref <あなたのproject-ref>
   supabase functions deploy fetch-job-metadata --project-ref <あなたのproject-ref>
   ```

   - `delete-account`：アカウント削除機能に必須です。デプロイしない場合、設定画面の「アカウントを削除」が動作しません。
   - `fetch-job-metadata`：任意（URL自動入力機能）。デプロイしなくても他の機能には影響しません。

### 3. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、値を設定します。

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`.env` はGit管理対象外です（`.gitignore`で除外済み）。**service_role keyはフロントエンドのどこにも配置しないでください。**
Edge Function内でのみ、Supabaseが自動的に注入する環境変数として使用しています。

### 4. 開発サーバーの起動

```bash
npm run dev
```

`http://localhost:5173` で起動します。未ログイン状態で `/` や `/jobs` にアクセスすると `/login` にリダイレクトされます。

### 5. 型チェック・Lint

```bash
npm run lint
```

### 6. ビルド

```bash
npm run build
npm run preview
```

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
  status text not null default 'not_applied', -- 'not_applied' | 'applied'
  location text,
  technologies text[],
  notes text,
  min_salary integer,
  max_salary integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_status_check check (status in ('not_applied', 'applied')),
  constraint jobs_salary_range_check check (
    min_salary is null or max_salary is null or min_salary <= max_salary
  )
);
```

`updated_at` は更新のたびにDB側のtriggerで自動更新されます（詳細は `supabase/schema.sql` を参照）。

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
