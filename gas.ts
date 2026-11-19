export default async function handler(req: any, res: any) {
  const GAS_URL =
    'https://script.google.com/macros/s/AKfycbxLZh3AEON1wweJc3jBWjjWOTPltAmGIgVqRtFCqX9kmzz7JEeMoilTMG8u9X3RiU8_/exec';

  const query = new URLSearchParams(req.query as Record<string, string>).toString();
  const targetUrl = query ? `${GAS_URL}?${query}` : GAS_URL;

  try {
    const isPost = req.method === 'POST';
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: isPost ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
      body: isPost
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : undefined,
      redirect: 'follow',
    });
    const text = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', error: err?.message || 'Proxy error' });
  }
}
