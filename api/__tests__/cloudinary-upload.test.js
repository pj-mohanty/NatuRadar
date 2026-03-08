/**
 * Integration test for Cloudinary photo upload.
 *
 * Run with: npm run test:integration
 *
 * Uploads a real photo, verifies the URL works, then deletes it.
 * Requires CLOUDINARY_* env vars to be set.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Integration: Cloudinary photo upload', () => {
  it('uploads a photo, verifies URL is accessible, then deletes it', async () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('CLOUDINARY_* env vars not set — cannot run integration test')
    }

    // Read test image and convert to base64 data URL
    const imagePath = path.resolve(__dirname, '../../src/assets/guineapig.jpg')
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Test image not found at ${imagePath}`)
    }
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

    // Sign the upload request
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'test'
    const signature = crypto
      .createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex')

    // Upload via Cloudinary REST API
    const formData = new FormData()
    formData.append('file', base64Image)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('folder', folder)

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )
    const uploadResult = await uploadRes.json()

    expect(uploadRes.ok).toBe(true)
    expect(uploadResult.secure_url).toBeDefined()
    expect(uploadResult.secure_url).toContain('cloudinary')
    console.log('  Cloudinary upload: OK —', uploadResult.public_id)

    // Verify the URL is accessible
    const fetchRes = await fetch(uploadResult.secure_url)
    expect(fetchRes.status).toBe(200)
    expect(fetchRes.headers.get('content-type')).toContain('image')
    console.log('  Cloudinary fetch: OK — image accessible')

    // Clean up — delete the test file
    const publicId = uploadResult.public_id
    const deleteTimestamp = Math.floor(Date.now() / 1000)
    const deleteSignature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${deleteTimestamp}${apiSecret}`)
      .digest('hex')

    const deleteForm = new FormData()
    deleteForm.append('public_id', publicId)
    deleteForm.append('api_key', apiKey)
    deleteForm.append('timestamp', deleteTimestamp.toString())
    deleteForm.append('signature', deleteSignature)

    const deleteRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: 'POST', body: deleteForm }
    )
    const deleteResult = await deleteRes.json()

    expect(deleteResult.result).toBe('ok')
    console.log('  Cloudinary cleanup: OK — test file deleted')
  })
})
