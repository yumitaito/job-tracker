## 変更内容

## 実装理由

## テスト内容

- [ ] `npm run lint` / `typecheck` / `test` / `build` が成功した
- [ ] test-agent が成功した（結果を下に記載）

test-agent 結果:

## セキュリティ確認

- [ ] RLS・ユーザー分離への影響を確認した（対象外の場合は理由を記載）
- [ ] 認証境界と匿名アクセスを確認した
- [ ] `SECURITY DEFINER` RPC の `search_path`・実行権限・所有者検証を確認した
- [ ] migration と `schema.sql` の重要契約が一致している
- [ ] Edge Function の認証・入力・SSRF・失敗時rollbackを確認した
- [ ] service role / private key を `VITE_*` やフロントエンドへ公開していない
- [ ] ユーザーA/B切替・越境アクセスを確認した
- [ ] review-agent の最終結果が Critical 0 / High 0 である

review-agent 最終結果: Critical __件 / High __件（差し戻し __回）

## 確認してほしい点
特になし / （確認事項を記載）
