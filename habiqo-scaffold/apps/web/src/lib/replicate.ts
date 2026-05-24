// lib/replicate.ts
// Destinazione: apps/web/src/lib/replicate.ts
// ─────────────────────────────────────────────────────────────────

// ── Prompt per stile ──────────────────────────────────────────────

const STYLE_PROMPTS: Record<string, string> = {
  modern_italian: [
    'modern Italian luxury interior design, clean architectural lines,',
    'Calacatta marble surfaces, warm travertine floors,',
    'designer furniture by Poltrona Frau or B&B Italia,',
    'soft warm ambient lighting, neutral palette of cream ivory and warm gray,',
    'ultra-realistic interior photography, 8K, RAW photo',
  ].join(' '),

  mediterranean_luxury: [
    'Mediterranean luxury villa interior design,',
    'arched doorways and windows, natural terracotta tiles,',
    'linen and cotton textiles, warm golden sunlight, rustic wood beams,',
    'local stone textures, olive and warm terracotta color palette,',
    'authentic Italian coastal lifestyle, ultra-realistic interior photography, 8K',
  ].join(' '),

  minimal_warm: [
    'warm minimalist Japandi interior design,',
    'natural oak wood accents, smooth plaster walls in off-white,',
    'natural linen and wool textiles, subtle warm earth tones,',
    'warm indirect lighting, uncluttered space, quality Italian craftsmanship,',
    'ultra-realistic architectural photography, 8K, RAW photo',
  ].join(' '),
}

const ROOM_LABELS: Record<string, string> = {
  living_room:  'luxury living room',
  bedroom:      'luxury master bedroom',
  kitchen:      'modern luxury kitchen',
  bathroom:     'luxury bathroom',
  office:       'modern home office',
  dining_room:  'luxury dining room',
}

const NEGATIVE_PROMPT = [
  'lowres, bad quality, blurry, watermark, text, logo,',
  'people, person, face, body, deformed anatomy,',
  'extra furniture, clutter, poorly lit, overexposed,',
  'unrealistic proportions, distorted perspective',
].join(' ')

// ── Types ─────────────────────────────────────────────────────────

export interface StartRenderParams {
  imageUrl:   string
  roomType:   string
  style:      string
  webhookUrl: string
}

export interface ReplicatePrediction {
  id:     string
  status: string
  output?: string[]
  error?:  string
}

// ── Main function ─────────────────────────────────────────────────

export async function startRenovationRender(
  params: StartRenderParams
): Promise<ReplicatePrediction> {
  const { imageUrl, roomType, style, webhookUrl } = params

  const roomLabel   = ROOM_LABELS[roomType]   ?? 'luxury room'
  const stylePrompt = STYLE_PROMPTS[style]     ?? STYLE_PROMPTS.modern_italian
  const prompt      = `${roomLabel}, ${stylePrompt}`

  const modelVersion = process.env.REPLICATE_MODEL_VERSION
  if (!modelVersion) {
    throw new Error('REPLICATE_MODEL_VERSION non configurata — vedi env-vars.txt')
  }

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method:  'POST',
    headers: {
      Authorization:  `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelVersion,
      input: {
        image:              imageUrl,
        prompt,
        negative_prompt:    NEGATIVE_PROMPT,
        num_inference_steps: 30,
        guidance_scale:     15,
        strength:           0.8,
        seed:               42,
      },
      // Il webhook riceve la callback quando il render è pronto
      webhook:               webhookUrl,
      webhook_events_filter: ['completed'],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Replicate API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<ReplicatePrediction>
}
