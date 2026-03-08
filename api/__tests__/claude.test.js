import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from '../claude.js'
import { mockReq, mockRes } from './helpers.js'

describe('api/claude', () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv
    vi.restoreAllMocks()
  })

  it('rejects non-POST requests with 405', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res._status).toBe(405)
    expect(res._json).toEqual({ error: 'Method not allowed' })
  })

  it('returns 500 when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const res = mockRes()
    await handler(mockReq({ method: 'POST', body: {} }), res)
    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'ANTHROPIC_API_KEY not configured' })
  })

  it('proxies request to Anthropic API and returns response', async () => {
    const mockData = { content: [{ text: '{"description": "A bird"}' }] }
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData)
    })

    const body = { model: 'claude-sonnet-4-20250514', messages: [{ role: 'user', content: 'hi' }] }
    const res = mockRes()
    await handler(mockReq({ method: 'POST', body }), res)

    expect(fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })
    expect(res._status).toBe(200)
    expect(res._json).toEqual(mockData)
  })

  it('forwards error status from Anthropic API', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Invalid API key' } })
    })

    const res = mockRes()
    await handler(mockReq({ method: 'POST', body: {} }), res)
    expect(res._status).toBe(401)
    expect(res._json).toEqual({ error: { message: 'Invalid API key' } })
  })

  it('returns 500 when fetch throws', async () => {
    fetch.mockRejectedValue(new Error('Network error'))

    const res = mockRes()
    await handler(mockReq({ method: 'POST', body: {} }), res)
    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'Failed to call Claude API' })
  })
})
