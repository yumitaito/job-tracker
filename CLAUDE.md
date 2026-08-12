# Job Tracker 開発ガイド（Claude Code向け）

このファイルはClaude Codeがこのリポジトリで作業する際の運用ルールです。
アプリの機能・技術構成・セットアップ方法は [`README.md`](README.md) を参照してください。

## サブエージェント構成

このプロジェクトには `.claude/agents/` に6つの専門サブエージェントを用意しています。
依頼内容に応じて必要なエージェントだけを使い、毎回すべてを実行する必要はありません。

| エージェント | 役割 |
| --- | --- |
| `product-agent` | 新機能の企画・ユーザー価値の確認・要件整理・完了条件の定義 |
| `architect-agent` | 技術設計・DB設計・API設計・既存コードへの影響調査・実装方針決定 |
| `ui-ux-agent` | UI/UX設計・既存デザインとの統一・レスポンシブ・loading/empty/error状態・アクセシビリティ |
| `implement-agent` | React/TypeScript/Supabaseの実装（DB migration・Edge Function含む） |
| `review-agent` | コードレビュー（バグ・型安全性・セキュリティ・パフォーマンス・保守性・要件とのズレ） |
| `test-agent` | 正常系・異常系・境界値・回帰テスト（Vitest / React Testing Library） |

各エージェントの詳細な役割・レビュー観点・出力フォーマットは、それぞれの `.claude/agents/*.md` を参照。

## 依頼内容に応じたエージェント選択フロー

ユーザーから自然言語で機能追加・修正の依頼を受けたら、以下のいずれに該当するか判断し、
対応するエージェントを**順番に**呼び出す。

| 依頼の種類 | フロー |
| --- | --- |
| 新機能 | `product-agent` → `architect-agent` → `ui-ux-agent` → `implement-agent` → `review-agent` → `test-agent` |
| UI変更 | `ui-ux-agent` → `implement-agent` → `review-agent` → `test-agent` |
| バグ修正 | `implement-agent` → `review-agent` → `test-agent` |
| リファクタリング | `architect-agent` → `implement-agent` → `review-agent` → `test-agent` |
| 小規模修正（タイポ・文言・軽微な調整） | `implement-agent` → `review-agent` |

判断に迷う場合は、依頼の影響範囲が広いほど手前の工程（product/architect/ui-ux）を厚めに使う。
依頼内容から明らかに単純な変更だと判断できる場合は、過剰に工程を挟まず `implement-agent` から始めてよい。

### エージェント呼び出し時の注意
- `Agent` ツールで `subagent_type` に上記のエージェント名を指定して呼び出す。
- **同じ作業ディレクトリ・同じブランチ上で作業させるため、`isolation: "worktree"` は指定しない**
  （前工程の変更を後工程が参照できる必要があるため）。
- 各エージェントは基本的に**同期実行**（`run_in_background: false`）し、報告を読んでから次のエージェントへ
  必要な情報（前工程の出力の要約）を渡す。憶測で次工程を進めない。
- `review-agent` が **Critical/High** の問題を報告した場合は、その内容を `implement-agent` に渡して修正させ、
  再度 `review-agent` でレビューする。問題がなくなるまで繰り返す（自己判断で止めない）。
- `test-agent` でテストが失敗した場合も同様に `implement-agent` に差し戻し、修正後に再テストする。

## Git運用

1. **作業開始時**：`main` から作業ブランチを作成する。直接 `main` で作業・commitしない。
   - 新機能・UI変更：`feature/<内容が分かる短い英語スラッグ>`
   - バグ修正：`fix/<内容が分かる短い英語スラッグ>`
   - リファクタリング・ツール整備：`chore/<内容が分かる短い英語スラッグ>`
2. **実装完了後**：`git diff` / `git status` で変更差分を必ず確認する。
3. **品質確認**（すべて成功することを確認してからcommitする）：
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
   存在しないscriptを勝手に想定せず、`package.json` の `scripts` を都度確認すること。
4. **commit**：意味のある単位でcommitする。メッセージ末尾に以下を付与する。
   ```
   Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
   ```
5. **push**：作業ブランチをリモート（`origin`）へpushする。
6. **Pull Request作成**：`gh pr create` でPRを作成する。タイトル・本文は自動生成し、本文には以下を含める。
   ```
   ## 変更内容
   ## 実装理由
   ## テスト内容
   ## 確認してほしい点
   ```
   （末尾に `🤖 Generated with [Claude Code](https://claude.com/claude-code)` を付与する）
7. **作成したPRのURLをユーザーに提示して停止する。**

新機能・UI変更・バグ修正・リファクタリングの依頼に対しては、ブランチ作成からPR作成まで、
致命的な仕様不明点がない限りユーザーへの確認を挟まず自律的に進めてよい。
仕様によって設計が大きく変わる／既存データやセキュリティに関わる重大な判断が必要な場合のみ、
作業を止めてユーザーに確認する。

## 禁止事項（絶対に行わないこと）

- Pull Requestのmerge
- `main` ブランチへの直接push・直接commit
- Production環境（Vercel）への直接デプロイ（`vercel --prod` 等をこのフローの中で実行しない）
- 本番Supabase DBへの破壊的変更の直接実行（`DROP`, 既存データを消す`DELETE`/`UPDATE`、破壊的な`ALTER`等）
  - DB変更が必要な場合は `supabase/migrations/` にSQLファイルを作成し、**ユーザー自身がSQL Editorで実行する**
- Production環境のSecrets・環境変数の変更
- `service_role key` をフロントエンドコード・環境変数（`VITE_`プレフィックス）に含めること

PR作成後は必ず停止する。最終的なPRレビュー・merge・Production反映はユーザーが行う。

## 品質確認コマンド一覧

| コマンド | 内容 |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b`（型チェックのみ、出力なし） |
| `npm run test` | Vitest（`vitest run`、CI相当） |
| `npm run test:watch` | Vitestをwatchモードで実行（開発用） |
| `npm run build` | 型チェック + 本番ビルド |

## CI（GitHub Actions）

`.github/workflows/ci.yml` で、PR作成・更新時に `lint` / `typecheck` / `test` / `build` を自動実行する。
CIが失敗する状態でPRを作成しないこと（作成前にローカルで上記コマンドを必ず確認する）。

## Vercelデプロイ構成

- `vercel.json` にSPA用のrewrite設定あり（React Router対応）。
- GitHub連携（Vercel Project Settings → Git）が設定されていれば、PRごとにPreview Deploymentが自動生成され、
  `main` へのmerge後にProduction Deploymentが自動実行される。この場合、CLIでの手動デプロイは不要。
- GitHub連携が未設定の場合、Production反映は引き続きユーザーが手動で `vercel --prod` を実行する
  （このフローの中でClaude Codeが実行することはない）。
