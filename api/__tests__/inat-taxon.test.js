import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from '../inat-taxon.js'
import { mockReq, mockRes } from './helpers.js'

describe('api/inat-taxon', () => {
  const originalEnv = process.env.INAT_TOKEN

  beforeEach(() => {
    process.env.INAT_TOKEN = 'test-inat-token'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    process.env.INAT_TOKEN = originalEnv
    vi.restoreAllMocks()
  })

  it('rejects non-GET requests with 405', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'POST' }), res)
    expect(res._status).toBe(405)
    expect(res._json).toEqual({ error: 'Method not allowed' })
  })

  it('returns 500 when INAT_TOKEN is missing', async () => {
    delete process.env.INAT_TOKEN
    const res = mockRes()
    await handler(mockReq({ method: 'GET', query: { id: '12345' } }), res)
    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'INAT_TOKEN not configured' })
  })

  it('returns 400 when taxon id is missing', async () => {
    const res = mockRes()
    await handler(mockReq({ method: 'GET', query: {} }), res)
    expect(res._status).toBe(400)
    expect(res._json).toEqual({ error: 'Missing taxon id' })
  })

  it('proxies request to iNaturalist taxa endpoint', async () => {
    const mockTaxon = {
      results: [{
        name: 'Danaus plexippus',
        preferred_common_name: 'Monarch Butterfly',
        observations_count: 500000
      }]
    }
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockTaxon)
    })

    const res = mockRes()
    await handler(mockReq({ method: 'GET', query: { id: '48662' } }), res)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.inaturalist.org/v1/taxa/48662',
      { headers: { 'Authorization': 'Bearer test-inat-token' } }
    )
    expect(res._status).toBe(200)
    expect(res._json).toEqual(mockTaxon)
  })

  it('forwards error status from iNaturalist', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' })
    })

    const res = mockRes()
    await handler(mockReq({ method: 'GET', query: { id: '99999999' } }), res)
    expect(res._status).toBe(404)
    expect(res._json).toEqual({ error: 'Not found' })
  })

  it('returns 500 when fetch throws', async () => {
    fetch.mockRejectedValue(new Error('Network error'))

    const res = mockRes()
    await handler(mockReq({ method: 'GET', query: { id: '123' } }), res)
    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'Failed to call iNaturalist API' })
  })

  it('encodes taxon id to prevent path traversal', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ results: [] })
    })

    const res = mockRes()
    await handler(mockReq({ method: 'GET', query: { id: '123/../../secret' } }), res)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.inaturalist.org/v1/taxa/123%2F..%2F..%2Fsecret',
      expect.any(Object)
    )
  })
})
