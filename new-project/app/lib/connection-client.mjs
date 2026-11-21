// Only this server talks to the private worker. The phone supplies neither the owner nor the worker key.
export function connectionClient(env) {
  if (!env.CONNECTION_WORKER_URL || !env.CONNECTION_WORKER_TOKEN) return null;
  const url = new URL(env.CONNECTION_WORKER_URL);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) {
    throw new Error('Use HTTPS or loopback for CONNECTION_WORKER_URL.');
  }
  return async (operation, fields) => {
    try {
      const res = await fetch(new URL('/' + operation, url), {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
        headers: { Authorization: 'Bearer ' + env.CONNECTION_WORKER_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok || res.status === 404) return res;
    } catch { /* The app returns a retryable error without exposing private worker details. */ }
    throw Object.assign(new Error('Connection worker unavailable.'), { status: 503 });
  };
}

export function connectionTarget(input) {
  if (typeof input !== 'string') return null;
  const match = /^https:\/\/(?:www\.)?linkedin\.com\/in\/([\p{L}\p{N}_%-]{1,150})\/?(?:[?#][^\s]*)?$/iu.exec(input.trim());
  if (!match) return null;
  try {
    const handle = decodeURIComponent(match[1]);
    if (/^[\p{L}\p{N}_-]+$/u.test(handle)) return 'https://www.linkedin.com/in/' + encodeURIComponent(handle.toLowerCase());
  } catch { /* Bad percent escape. */ }
  return null;
}
