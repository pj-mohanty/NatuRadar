export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.INAT_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'INAT_TOKEN not configured' })
  }

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Missing taxon id' })
  }

  try {
    const response = await fetch(
      `https://api.inaturalist.org/v1/taxa/${encodeURIComponent(id)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
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
