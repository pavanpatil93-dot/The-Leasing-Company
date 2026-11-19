import type { IncomingMessage, ServerResponse } from 'node:http';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbxLZh3AEON1wweJc3jBWjjWOTPltAmGIgVqRtFCqX9kmzz7JEeMoilTMG8u9X3RiU8_/exec';

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readBody(req: VercelRequest): Promise<string> {
  if (typeof req.body === 'string') return req.body;
  if (req.body !== undefined && req.body !== null) {
    return JSON.stringify(req.body);
  }

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 2_000_000) throw new Error('Request body exceeds 2 MB');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { status: 'error', message: 'Method not allowed' });
  }

  try {
    const incoming = new URL(req.url || '/api/gas', 'https://localhost');
    const params = new URLSearchParams(incoming.search);
    // Some Vercel runtimes supply parsed query parameters separately.
    for (const [key, value] of Object.entries(req.query || {})) {
      if (!params.has(key) && typeof value === 'string') params.set(key, value);
    }

    const init: RequestInit = { method: req.method, redirect: 'follow' };
    if (req.method === 'POST') {
      const raw = await readBody(req);
      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch {
        return send(res, 400, { status: 'error', message: 'Invalid JSON payload' });
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return send(res, 400, { status: 'error', message: 'Expected a JSON object' });
      }
      const body = payload as Record<string, unknown>;
      if (!params.has('tabName') && typeof body.tabName === 'string') {
        params.set('tabName', body.tabName);
      }
      if (!params.has('action') && typeof body.action === 'string') {
        params.set('action', body.action);
      }
      init.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
      init.body = JSON.stringify(body);
    }

    if (!params.get('tabName')) {
      return send(res, 400, { status: 'error', message: 'tabName is required' });
    }

    const upstreamUrl = GAS_URL + '?' + params.toString();
    const upstream = await fetch(upstreamUrl, init);
    const rawResponse = await upstream.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      return send(res, 502, {
        status: 'error',
        message: 'Google Apps Script returned a non-JSON response',
        upstreamStatus: upstream.status,
      });
    }
    return send(res, upstream.status, parsed);
  } catch (error) {
    console.error('GAS proxy failed:', error);
    return send(res, 502, {
      status: 'error',
      message: 'Unable to reach Google Apps Script',
    });
  }
}
