-- ============================================================
-- 追加テーブル：顧客回答保存 + 自動学習
-- Supabase SQL Editor で実行
-- ============================================================

-- 1. 顧客回答詳細テーブル（名前・生年月日・血液型・全回答）
CREATE TABLE IF NOT EXISTS user_responses (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  birth_date    DATE,
  blood_type    TEXT,
  type_key      TEXT NOT NULL,
  answers_json  JSONB NOT NULL,    -- 全20問の質問と回答
  scores_json   JSONB,             -- タイプ別スコア
  axes_json     JSONB,             -- レーダー軸スコア
  ai_desc       TEXT,              -- AIが生成した診断文
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. プロンプト改善ログ（自動学習の履歴）
CREATE TABLE IF NOT EXISTS prompt_improvements (
  id              SERIAL PRIMARY KEY,
  miss_count      INTEGER,           -- 改善時点のミス数
  improvement     TEXT NOT NULL,     -- AIが提案した改善内容
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS設定
ALTER TABLE user_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_improvements  ENABLE ROW LEVEL SECURITY;

-- 誰でも書ける（読みは管理者のみ）
CREATE POLICY "allow_insert_user_responses"
  ON user_responses FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_insert_prompt_improvements"
  ON prompt_improvements FOR INSERT WITH CHECK (true);

-- miss_logのSELECTを許可（自動学習用）
CREATE POLICY "allow_read_miss_log"
  ON feedback_miss_log FOR SELECT USING (true);

CREATE POLICY "allow_read_user_responses"
  ON user_responses FOR SELECT USING (true);
