import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev proxy for API routes (mirrors Vercel serverless functions)
function apiProxyPlugin() {
  let anthropicKey, inatToken, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret
  return {
    name: 'api-proxy',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, '')
      anthropicKey = env.ANTHROPIC_API_KEY
      inatToken = env.INAT_TOKEN
      cloudinaryCloudName = env.CLOUDINARY_CLOUD_NAME
      cloudinaryApiKey = env.CLOUDINARY_API_KEY
      cloudinaryApiSecret = env.CLOUDINARY_API_SECRET
    },
    configureServer(server) {
      // /api/claude → Anthropic Messages API
      server.middlewares.use('/api/claude', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = Buffer.concat(chunks).toString()

        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01'
            },
            body
          })
          const data = await response.text()
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = response.status
          res.end(data)
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to call Claude API' }))
        }
      })

      // /api/inat-identify → iNaturalist CV score_image
      server.middlewares.use('/api/inat-identify', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = Buffer.concat(chunks)

        try {
          const response = await fetch(
            'https://api.inaturalist.org/v1/computervision/score_image',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${inatToken}`,
                'Content-Type': req.headers['content-type']
              },
              body
            }
          )
          const data = await response.text()
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = response.status
          res.end(data)
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to call iNaturalist API' }))
        }
      })

      // /api/upload-photo → Cloudinary image upload
      server.middlewares.use('/api/upload-photo', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const { image } = JSON.parse(Buffer.concat(chunks).toString())

        if (!image) {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: 'Missing image field' }))
        }

        try {
          const crypto = await import('crypto')
          const timestamp = Math.floor(Date.now() / 1000)
          const folder = 'sightings'
          const signature = crypto.default
            .createHash('sha1')
            .update(`folder=${folder}&timestamp=${timestamp}${cloudinaryApiSecret}`)
            .digest('hex')

          const formData = new FormData()
          formData.append('file', image)
          formData.append('api_key', cloudinaryApiKey)
          formData.append('timestamp', timestamp.toString())
          formData.append('signature', signature)
          formData.append('folder', folder)

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
            { method: 'POST', body: formData }
          )
          const result = await response.json()

          res.setHeader('Content-Type', 'application/json')
          if (!response.ok) {
            res.statusCode = response.status
            return res.end(JSON.stringify(result))
          }
          res.statusCode = 200
          res.end(JSON.stringify({ url: result.secure_url, publicId: result.public_id }))
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to upload photo' }))
        }
      })

      // /api/inat-taxon?id=123 → iNaturalist taxa endpoint
      server.middlewares.use('/api/inat-taxon', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'Method not allowed' }))
        }
        const url = new URL(req.url, 'http://localhost')
        const id = url.searchParams.get('id')
        if (!id) {
          res.statusCode = 400
          return res.end(JSON.stringify({ error: 'Missing taxon id' }))
        }

        try {
          const response = await fetch(
            `https://api.inaturalist.org/v1/taxa/${encodeURIComponent(id)}`,
            { headers: { 'Authorization': `Bearer ${inatToken}` } }
          )
          const data = await response.text()
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = response.status
          res.end(data)
        } catch {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to call iNaturalist API' }))
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), apiProxyPlugin()],
  test: {
    // Load ALL .env variables (no VITE_ prefix filter) into process.env for tests
    env: loadEnv(mode, process.cwd(), ''),
  },
}))
