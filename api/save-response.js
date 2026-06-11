// api/save-response.js
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, birth_date, blood_type, type_key, answers, scores, axes, ai_desc } = req.body;

    let safeBirthDate = null;
    if (birth_date) {
      const normalized = String(birth_date).replace(/\//g, '-').replace(/[^0-9-]/g, '');
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) safeBirthDate = normalized;
    }

    const supabaseUrl = new URL(process.env.SUPABASE_URL);
    const body = JSON.stringify({
      name: String(name || ''),
      birth_date: safeBirthDate,
      blood_type: String(blood_type || ''),
      type_key: String(type_key || ''),
      answers_json: answers || [],
      scores_json: scores || {},
      axes_json: axes || {},
      ai_desc: String(ai_desc || ''),
    });

    await new Promise((resolve, reject) => {
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
          if (res2.statusCode >= 400) {
            reject(new Error(`Supabase ${res2.statusCode}: ${data}`));
          } else {
            resolve();
          }
        });
      });

      req2.on('error', reject);
      req2.write(body);
      req2.end();
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('save-response error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
