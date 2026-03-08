import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev proxy for /api/claude → Anthropic API
function claudeProxyPlugin() {
  let apiKey
  return {
    name: 'claude-proxy',
    configResolved(config) {
      apiKey = loadEnv(config.mode, config.root).ANTHROPIC_API_KEY
        || process.env.ANTHROPIC_API_KEY
    },
    configureServer(server) {
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
              'x-api-key': apiKey,
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
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), claudeProxyPlugin()],
})
