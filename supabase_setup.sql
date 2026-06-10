-- ============================================================
-- 悩み診断アプリ Supabase テーブル設定
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行
-- ============================================================

-- 1. フィードバック集計テーブル（タイプ別の当たり/外れカウント）
CREATE TABLE IF NOT EXISTS feedback_stats (
  id          SERIAL PRIMARY KEY,
  type_key    TEXT NOT NULL UNIQUE,   -- 'hinata', 'dance', 'chizu' など
  hit_count   INTEGER NOT NULL DEFAULT 0,
  miss_count  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ミスフィードバック詳細テーブル（外れと言ったときのフリーテキスト）
CREATE TABLE IF NOT EXISTS feedback_miss_log (
  id            SERIAL PRIMARY KEY,
  type_key      TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  answers_json  JSONB,               -- 回答ログも保存（診断改善用）
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 診断ログテーブル（誰がどのタイプになったか・改善分析用）
CREATE TABLE IF NOT EXISTS diagnosis_log (
  id           SERIAL PRIMARY KEY,
  type_key     TEXT NOT NULL,
  scores_json  JSONB,               -- タイプ別スコア
  axes_json    JSONB,               -- レーダー軸スコア
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS（Row Level Security）設定
-- anon keyからの読み書きを制限付きで許可
-- ============================================================

ALTER TABLE feedback_stats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_miss_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_log     ENABLE ROW LEVEL SECURITY;

-- feedback_stats: 誰でも読める・書ける（カウントアップのみ）
CREATE POLICY "allow_read_feedback_stats"
  ON feedback_stats FOR SELECT USING (true);

CREATE POLICY "allow_upsert_feedback_stats"
  ON feedback_stats FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_update_feedback_stats"
  ON feedback_stats FOR UPDATE USING (true);

-- feedback_miss_log: 誰でも書ける（管理者のみ読む）
CREATE POLICY "allow_insert_miss_log"
  ON feedback_miss_log FOR INSERT WITH CHECK (true);

-- diagnosis_log: 誰でも書ける（管理者のみ読む）
CREATE POLICY "allow_insert_diagnosis_log"
  ON diagnosis_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- 初期データ：ダミーシード値を投入
-- ============================================================
INSERT INTO feedback_stats (type_key, hit_count, miss_count) VALUES
  ('hinata',   82, 11),
  ('dance',    91, 14),
  ('chizu',    78,  9),
  ('madogawa', 69, 12),
  ('bbq',      74,  8),
  ('jihan',    88, 13)
ON CONFLICT (type_key) DO NOTHING;

-- ============================================================
-- インクリメント用RPC関数
-- ============================================================

CREATE OR REPLACE FUNCTION increment_hit(p_type_key TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO feedback_stats (type_key, hit_count, miss_count)
  VALUES (p_type_key, 1, 0)
  ON CONFLICT (type_key)
  DO UPDATE SET
    hit_count  = feedback_stats.hit_count + 1,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION increment_miss(p_type_key TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO feedback_stats (type_key, hit_count, miss_count)
  VALUES (p_type_key, 0, 1)
  ON CONFLICT (type_key)
  DO UPDATE SET
    miss_count = feedback_stats.miss_count + 1,
    updated_at = NOW();
END;
$$;

-- RPC関数のanonアクセスを許可
GRANT EXECUTE ON FUNCTION increment_hit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_miss(TEXT) TO anon;
