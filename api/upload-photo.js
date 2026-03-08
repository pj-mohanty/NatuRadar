export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary credentials not configured' })
  }

  try {
    // Read raw body (base64 JSON)
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const { image } = JSON.parse(Buffer.concat(chunks).toString())

    if (!image) {
      return res.status(400).json({ error: 'Missing image field' })
    }

    // Validate image type (must be a data:image/* base64 URL)
    if (typeof image !== 'string' || !image.match(/^data:image\/(jpeg|png|webp);base64,/)) {
      return res.status(400).json({ error: 'Only JPEG, PNG, or WebP images are allowed' })
    }

    // Validate size (5MB max, base64 is ~33% larger than binary)
    const base64Data = image.split(',')[1] || ''
    const sizeBytes = Math.ceil(base64Data.length * 0.75)
    if (sizeBytes > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image exceeds 5MB limit' })
    }

    // Generate signature for signed upload
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'sightings'
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`

    // Use Web Crypto to create SHA-1 signature
    const encoder = new TextEncoder()
    const data = encoder.encode(paramsToSign)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Upload to Cloudinary
    const formData = new FormData()
    formData.append('file', image)
    formData.append('api_key', apiKey)
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)
    formData.append('folder', folder)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    )

    const result = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(result)
    }

    return res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to upload photo' })
  }
}
