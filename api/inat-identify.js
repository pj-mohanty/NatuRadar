export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.INAT_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'INAT_TOKEN not configured' })
  }

  try {
    // Forward the raw multipart body to iNaturalist
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks)

    const response = await fetch(
      'https://api.inaturalist.org/v1/computervision/score_image',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': req.headers['content-type']
        },
        body
      }
    )

    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json(data)
    }
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to call iNaturalist API' })
  }
}
