// api/auto-learn.js
// miss_logを読んでAIに改善点を分析させる

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 未処理のmiss_logを取得（最新50件）
    const logsRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/feedback_miss_log?select=type_key,feedback_text,answers_json&order=created_at.desc&limit=50`,
      {
        headers: {
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
      }
    );

    const logs = await logsRes.json();
    if (!logs || logs.length === 0) {
      return res.status(200).json({ message: 'No miss logs to process' });
    }

    // miss数を集計
    const missCount = logs.length;
    const logSummary = logs.map(l =>
      `タイプ:${l.type_key} / フィードバック:「${l.feedback_text}」`
    ).join('\n');

    // AIに改善点を分析させる
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'あなたはお金グセ診断の精度改善の専門家です。',
        messages: [{
          role: 'user',
          content: `以下は「診断が外れた」と言ったユーザーのフィードバック${missCount}件です。

${logSummary}

このフィードバックを分析して、診断精度を上げるための具体的な改善提案を3点挙げてください。
・どのタイプの診断がズレているか
・質問や回答の選択肢で改善すべき点
・AIの診断文で変えるべき表現

改善提案のみ返してください。`
        }],
      }),
    });

    const aiData = await aiRes.json();
    const improvement = aiData.content?.[0]?.text || '';

    // 改善内容をSupabaseに保存
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/prompt_improvements`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ miss_count: missCount, improvement }),
      }
    );

    return res.status(200).json({ success: true, improvement });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
