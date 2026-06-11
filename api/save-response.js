// api/save-response.js
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, birth_date, blood_type, type_key, answers, scores, axes, ai_desc } = req.body;

  const supabaseUrl = new URL(process.env.SUPABASE_URL);
  const body = JSON.stringify({
    name,
    birth_date: birth_date || null,
    blood_type,
    type_key,
    answers_json: answers,
    scores_json: scores,
    axes_json: axes,
    ai_desc: ai_desc || '',
  });

  return new Promise((resolve) => {
    const options = {
      hostname: supabaseUrl.hostname,
      path: '/rest/v1/user_responses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
    };

    const req2 = https.request(options, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        res.status(200).json({ success: true });
        resolve();
      });
    });

    req2.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    req2.write(body);
    req2.end();
  });
};
