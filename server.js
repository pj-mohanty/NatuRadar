import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(cors())
app.use(express.json())

const client = new Anthropic()

app.post('/api/species-details', async (req, res) => {
  const { name, latin, status } = req.body
  try {
    const message = await client.messages.create({
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
    const text = message.content[0].text.trim()
    res.json(JSON.parse(text))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

app.listen(3001, () => console.log('✅ Server running on port 3001'))