import { createServer } from 'node:http';
import { handleVerdictRequest } from '../../frontend/verdict-engine/handler';

const PORT = 3001;

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/verdict') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf-8');

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const result = await handleVerdictRequest(body);
  res.writeHead(result.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result.body));
});

server.listen(PORT, () => {
  console.log(`Verdict worker dev server running on http://localhost:${PORT}`);
  console.log('POST /api/verdict');
  console.log('Required env: GEMINI_API_KEY and/or GROQ_API_KEY');
});
