/**
 * Creates a mock Vercel-style request object.
 */
export function mockReq({ method = 'GET', body = null, headers = {}, query = {}, chunks = [] } = {}) {
  return {
    method,
    body,
    headers,
    query,
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
        yield typeof chunk === 'string' ? Buffer.from(chunk) : chunk
      }
    }
  }
}

/**
 * Creates a mock Vercel-style response object.
 * Tracks status and json data for assertions.
 */
export function mockRes() {
  const res = {
    _status: 200,
    _json: null,
  }
  res.status = (code) => { res._status = code; return res }
  res.json = (data) => { res._json = data; return res }
  return res
}
