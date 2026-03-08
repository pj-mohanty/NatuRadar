import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from '../inat-identify.js'
import { mockReq, mockRes } from './helpers.js'

describe('api/inat-identify', () => {
  const originalEnv = process.env.INAT_TOKEN

  beforeEach(() => {
    process.env.INAT_TOKEN = 'test-inat-token'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env.INAT_TOKEN = originalEnv
    vi.restoreAllMocks()
  })

  it('rejects non-POST requests with 405', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res._status).toBe(405)
    expect(res._json).toEqual({ error: 'Method not allowed' })
  })

  it('returns 500 when INAT_TOKEN is missing', async () => {
    delete process.env.INAT_TOKEN
    const res = mockRes()
    await handler(mockReq({ method: 'POST' }), res)
    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'INAT_TOKEN not configured' })
  })

  it('proxies multipart body to iNaturalist and returns response', async () => {
    const mockResult = { results: [{ taxon: { name: 'Danaus plexippus' }, score: 0.95 }] }
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResult)
    })

    const imageData = Buffer.from('fake-image-data')
    const res = mockRes()
    await handler(mockReq({
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=---abc' },
      chunks: [imageData]
    }), res)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.inaturalist.org/v1/computervision/score_image',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-inat-token',
          'Content-Type': 'multipart/form-data; boundary=---abc'
        },
        body: imageData
      }
    )
    expect(res._status).toBe(200)
    expect(res._json).toEqual(mockResult)
  })

  it('forwards error status from iNaturalist', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' })
    })

    const res = mockRes()
    await handler(mockReq({
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data' },
      chunks: [Buffer.from('data')]
    }), res)

    expect(res._status).toBe(401)
    expect(res._json).toEqual({ error: 'Unauthorized' })
  })

  it('returns 500 when fetch throws', async () => {
    fetch.mockRejectedValue(new Error('Network error'))

    const res = mockRes()
    await handler(mockReq({
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data' },
      chunks: [Buffer.from('data')]
    }), res)

    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'Failed to call iNaturalist API' })
  })
})
