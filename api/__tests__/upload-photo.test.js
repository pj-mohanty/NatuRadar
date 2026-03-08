import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockReq, mockRes } from './helpers.js'

const validJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgAB'
const validPng  = 'data:image/png;base64,iVBORw0KGgo='
const validWebp = 'data:image/webp;base64,UklGRg=='

function makeReq(body) {
  const json = JSON.stringify(body)
  return mockReq({ method: 'POST', chunks: [json] })
}

describe('POST /api/upload-photo', () => {
  let handler

  beforeEach(async () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'testcloud')
    vi.stubEnv('CLOUDINARY_API_KEY', 'testkey')
    vi.stubEnv('CLOUDINARY_API_SECRET', 'testsecret')
    // Re-import fresh module each time (env is read at call time so this is fine)
    handler = (await import('../upload-photo.js')).default
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('rejects non-POST requests', async () => {
    const req = mockReq({ method: 'GET' })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(405)
    expect(res._json.error).toMatch(/method not allowed/i)
  })

  it('returns 500 when Cloudinary credentials are missing', async () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '')
    const req = makeReq({ image: validJpeg })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(500)
    expect(res._json.error).toMatch(/credentials not configured/i)
  })

  it('returns 400 when image field is missing', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(undefined)
    const req = makeReq({})
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(400)
    expect(res._json.error).toMatch(/missing image/i)
  })

  it('rejects non-image data URLs (gif)', async () => {
    const req = makeReq({ image: 'data:image/gif;base64,R0lGODlh' })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(400)
    expect(res._json.error).toMatch(/only jpeg, png, or webp/i)
  })

  it('rejects plain strings that are not data URLs', async () => {
    const req = makeReq({ image: 'https://example.com/photo.jpg' })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(400)
  })

  it('rejects images over 5MB', async () => {
    // 6MB of base64 → >5MB binary
    const bigBase64 = 'A'.repeat(Math.ceil(6 * 1024 * 1024 / 0.75))
    const req = makeReq({ image: `data:image/jpeg;base64,${bigBase64}` })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(413)
    expect(res._json.error).toMatch(/5mb/i)
  })

  it('returns url and publicId on successful upload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/testcloud/image/upload/sightings/abc.jpg', public_id: 'sightings/abc' })
    })
    const req = makeReq({ image: validJpeg })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(200)
    expect(res._json.url).toContain('cloudinary.com')
    expect(res._json.publicId).toBe('sightings/abc')
  })

  it('accepts PNG images', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/testcloud/image/upload/sightings/def.png', public_id: 'sightings/def' })
    })
    const req = makeReq({ image: validPng })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(200)
  })

  it('accepts WebP images', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ secure_url: 'https://res.cloudinary.com/testcloud/image/upload/sightings/ghi.webp', public_id: 'sightings/ghi' })
    })
    const req = makeReq({ image: validWebp })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(200)
  })

  it('forwards upstream error status from Cloudinary', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid signature' } })
    })
    const req = makeReq({ image: validJpeg })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(401)
  })

  it('returns 500 when fetch throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network failure'))
    const req = makeReq({ image: validJpeg })
    const res = mockRes()
    await handler(req, res)
    expect(res._status).toBe(500)
    expect(res._json.error).toMatch(/failed to upload/i)
  })
})
