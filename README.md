# 悩み診断アプリ デプロイ手順

## 1. Supabase セットアップ

1. Supabaseダッシュボード → SQL Editor
2. `supabase_setup.sql` の内容を全部貼り付けて実行
3. テーブル3つ＋RPC関数2つが作成される

## 2. GitHubにプッシュ

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/nayami-shindan.git
git push -u origin main
```

## 3. Vercelにデプロイ

1. vercel.com → 「New Project」
2. GitHubリポジトリを選択
3. **Environment Variables** に以下を追加：
   ```
   ANTHROPIC_API_KEY = sk-ant-xxxxxxxx（あなたのAPIキー）
   ```
4. Deploy！

## 4. 完成

- フロント：`https://あなたのプロジェクト.vercel.app`
- APIキーはVercelの環境変数に隠れる
- フィードバックはSupabaseに自動蓄積
- 「当たってない」のテキストはSupabase → `feedback_miss_log` テーブルで確認可能

## データの確認方法

Supabaseダッシュボード → Table Editor で：
- `feedback_stats`：タイプ別の当たり/外れ集計
- `feedback_miss_log`：「違います」と言った人の詳細コメント
- `diagnosis_log`：誰がどのタイプになったかのログ
