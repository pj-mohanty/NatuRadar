const taxonCache = new Map()

export async function fetchTaxonData(taxonId) {
  if (!taxonId) return null
  if (taxonCache.has(taxonId)) return taxonCache.get(taxonId)
  try {
    const res = await fetch(`/api/inat-taxon?id=${taxonId}`)
    if (!res.ok) return null
    const data = await res.json()
    const taxon = data.results?.[0]
    if (!taxon) return null
    const result = {
      photos: (taxon.taxon_photos || []).slice(0, 6).map(p => p.photo?.medium_url).filter(Boolean),
      wikipedia_summary: taxon.wikipedia_summary || null,
      wikipedia_url: taxon.wikipedia_url || null,
      observations_count: taxon.observations_count || 0,
      iconic_taxon_name: taxon.iconic_taxon_name || null,
    }
    taxonCache.set(taxonId, result)
    return result
  } catch {
    return null
  }
}

export async function identifySpecies(base64Image) {
  try {
    const blob = await fetch(base64Image).then(r => r.blob())
    const formData = new FormData()
    formData.append('image', blob, 'photo.jpg')

    const res = await fetch('/api/inat-identify', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()
    if (!data.results?.length) return null

    const top = data.results[0]
    const rawScore = top.score ?? top.combined_score ?? 0

    if (rawScore < 0.4) {
      return {
        name: 'Species unclear',
        latin: '',
        confidence: (rawScore * 100).toFixed(1),
        status: 'Unknown',
        statusCode: '?',
        emoji: '🌱',
        hint: 'Try better lighting or move closer'
      }
    }

    return {
      name: top.taxon.preferred_common_name || top.taxon.name,
      latin: top.taxon.name,
      confidence: (rawScore * 100).toFixed(1),
      status: top.taxon.conservation_status?.status_name || 'Least Concern',
      statusCode: top.taxon.conservation_status?.status || 'LC',
      photo: top.taxon.default_photo?.medium_url || null,
      taxonId: top.taxon.id,
      emoji: getEmoji(top.taxon.iconic_taxon_name)
    }
  } catch (err) {
    console.error('identifySpecies error:', err)
    return null
  }
}

function getEmoji(iconicTaxon) {
  const map = {
    Plantae: '🌿', Animalia: '🐾', Aves: '🐦',
    Mammalia: '🦌', Insecta: '🦋', Reptilia: '🦎',
    Amphibia: '🐸', Actinopterygii: '🐟', Fungi: '🍄',
    Mollusca: '🐚', Arachnida: '🕷️'
  }
  return map[iconicTaxon] || '🌱'
}