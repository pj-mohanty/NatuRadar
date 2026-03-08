import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev proxy for API routes (mirrors Vercel serverless functions)
function apiProxyPlugin() {
  let anthropicKey, inatToken
  return {
    name: 'api-proxy',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root)
      anthropicKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
      inatToken = env.INAT_TOKEN || process.env.INAT_TOKEN
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
export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
})
