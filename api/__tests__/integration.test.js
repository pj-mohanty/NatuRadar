/**
 * Integration tests — hit real APIs to verify credentials and connectivity.
 *
 * Run with: npm run test:integration
 *
 * These tests require valid env vars (ANTHROPIC_API_KEY, INAT_TOKEN).
 * They are skipped in `npm test` (unit tests only).
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Integration: iNaturalist API', () => {
  const token = process.env.INAT_TOKEN

  describe('Taxa endpoint', () => {
    it('fetches taxon data for Monarch Butterfly (id: 48662) WITH auth', async () => {
      if (!token) throw new Error('INAT_TOKEN not set — cannot run integration test')

      const res = await fetch('https://api.inaturalist.org/v1/taxa/48662', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.results).toBeDefined()
      expect(data.results.length).toBeGreaterThan(0)
      expect(data.results[0].name).toBe('Danaus plexippus')
      console.log('  Taxa (with auth): OK —', data.results[0].preferred_common_name)
    })

  })

  describe('Computer Vision endpoint', () => {
    it('identifies species from an image', async () => {
      if (!token) throw new Error('INAT_TOKEN not set — cannot run integration test')

      const imagePath = path.resolve(__dirname, '../../src/assets/guineapig.jpg')
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Test image not found at ${imagePath}`)
      }

      const imageBuffer = fs.readFileSync(imagePath)
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('image', blob, 'guineapig.jpg')

      const res = await fetch(
        'https://api.inaturalist.org/v1/computervision/score_image',
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        }
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.results).toBeDefined()
      expect(data.results.length).toBeGreaterThan(0)

      const top = data.results[0]
      console.log('  CV: OK —', top.taxon.preferred_common_name || top.taxon.name,
        `(score: ${(top.score * 100).toFixed(1)}%)`)
    })
  })
})

describe('Integration: Anthropic Claude API', () => {
  it('sends a simple message and gets a response', async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set — cannot run integration test')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Reply with just the word "pong"' }]
      })
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.content).toBeDefined()
    expect(data.content[0].text.toLowerCase()).toContain('pong')
    console.log('  Claude API: OK —', data.content[0].text.trim())
  })
})
