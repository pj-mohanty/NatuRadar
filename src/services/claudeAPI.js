const detailsCache = new Map()

export async function getSpeciesDetails(name, latin, status) {
  const cacheKey = (latin || name).toLowerCase()
  if (detailsCache.has(cacheKey)) return detailsCache.get(cacheKey)
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a biodiversity expert. Give a complete species report for "${name}" (${latin}), conservation status: ${status}.

Return ONLY a valid JSON object with exactly these fields:
{
  "description": "2-3 sentence ecological description",
  "habitat": "where it lives",
  "diet": "what it eats or how it gets nutrients",
  "lifespan": "typical lifespan",
  "size": "typical size/weight",
  "population": "estimated global population or trend description",
  "populationTrend": "Increasing or Stable or Decreasing",
  "threats": ["threat1", "threat2", "threat3"],
  "conservationActions": ["action1", "action2", "action3"],
  "howYouCanHelp": ["tip1", "tip2", "tip3"],
  "careGuide": "care tips if this is a common houseplant or pet, otherwise write N/A",
  "interestingFacts": ["fact1", "fact2", "fact3"],
  "nativeRegions": "continents or countries where native",
  "iucnCategory": "full IUCN category name",
  "scientificClassification": {
    "kingdom": "...",
    "phylum": "...",
    "class": "...",
    "order": "...",
    "family": "..."
  }
}

Return only the JSON, no other text.`
      }]
    })
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Anthropic error:', err)
    throw new Error(`API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.content[0].text.trim()
    .replace(/^```json\n?/, '')
    .replace(/\n?```$/, '')
  const parsed = JSON.parse(text)
  detailsCache.set(cacheKey, parsed)
  return parsed
}