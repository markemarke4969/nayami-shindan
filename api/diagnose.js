// api/diagnose.js
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system, max_tokens } = req.body;
  if (!messages || !system) return res.status(400).json({ error: 'Missing required fields' });

  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: max_tokens || 700,
    system,
    messages,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    };

    const req2 = https.request(options, (res2) => {
      let data = '';
      res2.on('data', chunk => data += chunk);
      res2.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.status(res2.statusCode).json(parsed);
        } catch(e) {
          res.status(500).json({ error: 'Parse error', raw: data.slice(0, 200) });
        }
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
