// // const router = require('express').Router();
// // const { authMiddleware } = require('../middleware/auth');
// // const https = require('https');

// // // POST /api/scan  — body: { imageBase64, mediaType }
// // router.post('/', authMiddleware, async (req, res) => {
// //   const { imageBase64, mediaType } = req.body;
// //   if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

// //   const apiKey = process.env.ANTHROPIC_API_KEY;
// //   if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured on server' });

// //   const payload = JSON.stringify({
// //     model: 'claude-sonnet-4-20250514',
// //     max_tokens: 800,
// //     messages: [{
// //       role: 'user',
// //       content: [
// //         { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
// //         { type: 'text', text: `Extract nutrition data from this label. Return ONLY raw JSON no markdown.
// // Format exactly: {"name":"product name","serving_size":"e.g. 100g","calories":0,"protein_g":0,"fiber_g":0,"carbs_g":0,"fat_g":0,"sugar_g":0,"sodium_mg":0,"gi":"low","diabetic_note":"one sentence","confidence":"high"}
// // Use 0 for unclear values. If not a nutrition label return {"error":"not a nutrition label"}.` }
// //       ]
// //     }]
// //   });

// //   const options = {
// //     hostname: 'api.anthropic.com',
// //     path: '/v1/messages',
// //     method: 'POST',
// //     headers: {
// //       'Content-Type': 'application/json',
// //       'x-api-key': apiKey,
// //       'anthropic-version': '2023-06-01',
// //       'Content-Length': Buffer.byteLength(payload),
// //     }
// //   };

// //   const apiReq = https.request(options, (apiRes) => {
// //     let data = '';
// //     apiRes.on('data', chunk => data += chunk);
// //     apiRes.on('end', () => {
// //       try {
// //         const parsed = JSON.parse(data);
// //         if (parsed.error) return res.status(502).json({ error: parsed.error.message || 'API error' });
// //         const text = parsed.content?.filter(c => c.type === 'text').map(c => c.text).join('') || '';
// //         const clean = text.replace(/^```[a-z]*|```$/gm, '').trim();
// //         const result = JSON.parse(clean);
// //         if (result.error) return res.status(422).json({ error: result.error });
// //         res.json({ result });
// //       } catch (e) {
// //         res.status(502).json({ error: 'Failed to parse AI response' });
// //       }
// //     });
// //   });

// //   apiReq.on('error', (e) => res.status(502).json({ error: 'AI API unreachable: ' + e.message }));
// //   apiReq.write(payload);
// //   apiReq.end();
// // });

// // module.exports = router;



// const router = require('express').Router()
// const https  = require('https')
// const { authMiddleware } = require('../middleware/auth')

// // ─────────────────────────────────────────────────────────────
// //  POST /api/scan
// //  Body: { imageBase64: string, mediaType: string }
// //
// //  Supports multiple free/paid providers — set in .env:
// //    SCAN_PROVIDER=gemini        (default — free)
// //    SCAN_PROVIDER=claude        (paid)
// //    SCAN_PROVIDER=openai        (paid / free trial)
// //    SCAN_PROVIDER=ollama        (free, local)
// //
// //  Keys needed per provider:
// //    GEMINI_API_KEY              → https://aistudio.google.com/app/apikey
// //    ANTHROPIC_API_KEY           → https://console.anthropic.com
// //    OPENAI_API_KEY              → https://platform.openai.com
// //    OLLAMA_URL=http://localhost:11434  (no key needed)
// // ─────────────────────────────────────────────────────────────

// const PROMPT = `You are a nutrition label reader. Extract all nutrition data from this image.
// Return ONLY raw JSON — no markdown, no backticks, no explanation. Use exactly this format:
// {
//   "name": "product name or best guess",
//   "serving_size": "e.g. 100g or 1 cup",
//   "calories": 0,
//   "protein_g": 0,
//   "fiber_g": 0,
//   "carbs_g": 0,
//   "fat_g": 0,
//   "sugar_g": 0,
//   "sodium_mg": 0,
//   "gi": "low",
//   "diabetic_note": "one sentence about suitability for diabetics",
//   "confidence": "high"
// }
// Use 0 for any value you cannot clearly read.
// If this is NOT a nutrition label return: {"error": "not a nutrition label"}`

// // ── helpers ──────────────────────────────────────────────────

// function httpsPost(options, body) {
//   return new Promise((resolve, reject) => {
//     const req = https.request(options, res => {
//       let data = ''
//       res.on('data', chunk => data += chunk)
//       res.on('end', () => {
//         try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
//         catch (e) { resolve({ status: res.statusCode, body: data }) }
//       })
//     })
//     req.on('error', reject)
//     req.write(body)
//     req.end()
//   })
// }

// function parseResult(text) {
//   const clean = (text || '').replace(/^```[a-z]*\n?|```$/gm, '').trim()
//   const parsed = JSON.parse(clean)
//   if (parsed.error) throw new Error(parsed.error)
//   return parsed
// }

// // ── GEMINI (free — recommended) ──────────────────────────────
// async function scanWithGemini(imageBase64, mediaType) {
//   const apiKey = process.env.GEMINI_API_KEY
//   if (!apiKey) throw new Error('GEMINI_API_KEY not set in backend/.env')

//   // Use gemini-2.0-flash (newest free model) or gemini-1.5-flash
//   const model   = process.env.GEMINI_MODEL || 'Gemini 2.5 Flash TTS'
//   const payload  = JSON.stringify({
//     contents: [{
//       parts: [
//         { inline_data: { mime_type: mediaType || 'image/jpeg', data: imageBase64 } },
//         { text: PROMPT }
//       ]
//     }],
//     generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
//   })

//   const options = {
//     hostname: 'generativelanguage.googleapis.com',
//     path:     `/v1beta/models/${model}:generateContent?key=${apiKey}`,
//     method:   'POST',
//     headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
//   }

//   const { status, body } = await httpsPost(options, payload)
//   if (status !== 200) throw new Error(body?.error?.message || `Gemini error ${status}`)

//   const text = body?.candidates?.[0]?.content?.parts?.[0]?.text || ''
//   return parseResult(text)
// }

// // ── CLAUDE / ANTHROPIC (paid) ─────────────────────────────────
// async function scanWithClaude(imageBase64, mediaType) {
//   const apiKey = process.env.ANTHROPIC_API_KEY
//   if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in backend/.env')

//   const payload = JSON.stringify({
//     model:      process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
//     max_tokens: 512,
//     messages: [{
//       role: 'user',
//       content: [
//         { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
//         { type: 'text',  text: PROMPT }
//       ]
//     }]
//   })

//   const options = {
//     hostname: 'api.anthropic.com',
//     path:     '/v1/messages',
//     method:   'POST',
//     headers: {
//       'Content-Type':      'application/json',
//       'x-api-key':          apiKey,
//       'anthropic-version': '2023-06-01',
//       'Content-Length':     Buffer.byteLength(payload)
//     }
//   }

//   const { status, body } = await httpsPost(options, payload)
//   if (status !== 200) throw new Error(body?.error?.message || `Claude error ${status}`)

//   const text = body?.content?.filter(c => c.type === 'text').map(c => c.text).join('') || ''
//   return parseResult(text)
// }

// // ── OPENAI (paid / free trial credit) ────────────────────────
// async function scanWithOpenAI(imageBase64, mediaType) {
//   const apiKey = process.env.OPENAI_API_KEY
//   if (!apiKey) throw new Error('OPENAI_API_KEY not set in backend/.env')

//   const payload = JSON.stringify({
//     model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
//     max_tokens: 512,
//     messages: [{
//       role: 'user',
//       content: [
//         { type: 'image_url', image_url: { url: `data:${mediaType || 'image/jpeg'};base64,${imageBase64}` } },
//         { type: 'text', text: PROMPT }
//       ]
//     }]
//   })

//   const options = {
//     hostname: 'api.openai.com',
//     path:     '/v1/chat/completions',
//     method:   'POST',
//     headers: {
//       'Content-Type':  'application/json',
//       'Authorization': `Bearer ${apiKey}`,
//       'Content-Length': Buffer.byteLength(payload)
//     }
//   }

//   const { status, body } = await httpsPost(options, payload)
//   if (status !== 200) throw new Error(body?.error?.message || `OpenAI error ${status}`)

//   const text = body?.choices?.[0]?.message?.content || ''
//   return parseResult(text)
// }

// // ── OLLAMA (free, local — no API key needed) ──────────────────
// // Install Ollama from https://ollama.com then run:
// //   ollama pull llava        (or moondream, bakllava)
// async function scanWithOllama(imageBase64) {
//   const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
//   const model   = process.env.OLLAMA_MODEL || 'llava'

//   const payload = JSON.stringify({
//     model,
//     prompt:  PROMPT,
//     images:  [imageBase64],
//     stream:  false,
//     options: { temperature: 0.1 }
//   })

//   // Ollama uses http not https
//   const http = require('http')
//   const url  = new URL(baseUrl + '/api/generate')

//   return new Promise((resolve, reject) => {
//     const options = {
//       hostname: url.hostname,
//       port:     url.port || 11434,
//       path:     url.pathname,
//       method:   'POST',
//       headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
//     }
//     const req = http.request(options, res => {
//       let data = ''
//       res.on('data', chunk => data += chunk)
//       res.on('end', () => {
//         try {
//           const body = JSON.parse(data)
//           resolve(parseResult(body.response || ''))
//         } catch (e) { reject(new Error('Ollama parse error: ' + e.message)) }
//       })
//     })
//     req.on('error', e => reject(new Error('Ollama not reachable. Is it running? ' + e.message)))
//     req.write(payload)
//     req.end()
//   })
// }

// // ── ROUTE HANDLER ─────────────────────────────────────────────
// router.post('/', authMiddleware, async (req, res) => {
//   const { imageBase64, mediaType } = req.body
//   if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' })

//   const provider = (process.env.SCAN_PROVIDER || 'gemini').toLowerCase()

//   try {
//     let result
//     switch (provider) {
//       case 'gemini': result = await scanWithGemini(imageBase64, mediaType); break
//       case 'claude': result = await scanWithClaude(imageBase64, mediaType); break
//       case 'openai': result = await scanWithOpenAI(imageBase64, mediaType); break
//       case 'ollama': result = await scanWithOllama(imageBase64);            break
//       default:
//         return res.status(400).json({ error: `Unknown SCAN_PROVIDER "${provider}". Use: gemini, claude, openai, ollama` })
//     }
//     res.json({ result, provider })
//   } catch (e) {
//     console.error(`[scan] ${provider} error:`, e.message)
//     res.status(502).json({ error: e.message, provider })
//   }
// })

// // ── INFO endpoint — shows which provider is configured ────────
// router.get('/info', authMiddleware, (req, res) => {
//   const provider = (process.env.SCAN_PROVIDER || 'gemini').toLowerCase()
//   const configured = {
//     gemini: !!process.env.GEMINI_API_KEY,
//     claude: !!process.env.ANTHROPIC_API_KEY,
//     openai: !!process.env.OPENAI_API_KEY,
//     ollama: true,
//   }
//   res.json({
//     active_provider:  provider,
//     key_configured:   configured[provider] || false,
//     all_providers:    configured,
//     free_options:    ['gemini', 'ollama'],
//     paid_options:    ['claude', 'openai'],
//   })
// })

// module.exports = router


const router = require('express').Router()
const https  = require('https')
const { authMiddleware } = require('../middleware/auth')
const { checkScanLimit } = require('../middleware/tier')
const { getDb } = require('../database/db')
const { today } = require('../utils/date')

// ─────────────────────────────────────────────────────────────
//  Two scan modes:
//  POST /api/scan          → nutrition label scan
//  POST /api/scan/plate    → plate/food photo → identify items for review
// ─────────────────────────────────────────────────────────────

const LABEL_PROMPT = `You are a nutrition label reader. Extract nutrition data from this image.
Return ONLY a single valid JSON object. No markdown. No backticks. No explanation.
Start your response with { and end with }

Required format:
{"name":"product name","serving_size":"e.g. 100g","calories":0,"protein_g":0,"fiber_g":0,"carbs_g":0,"fat_g":0,"sugar_g":0,"sodium_mg":0,"gi":"low","diabetic_note":"one sentence about diabetic suitability","confidence":"high"}

Rules:
- Use 0 for any value you cannot read clearly
- gi must be one of: low, med, high
- confidence must be one of: high, medium, low
- If this is NOT a nutrition label return exactly: {"error":"not a nutrition label"}
- Do NOT wrap in markdown. Do NOT add text outside the JSON`

function buildPlatePrompt(foodContext) {
  return `You are a food recognition AI for a diabetic-friendly nutrition tracker.
Look carefully at this photo of food on a plate, in a bowl, or on a table.

FOOD LIBRARY (match items to these when possible):
${foodContext}

Your job:
1. Identify every food item visible in the photo
2. Estimate the portion size using visual cues (plate/bowl size, depth, fullness)
3. Match each item to the closest entry in the food library
4. Infer the meal type from the foods (dal+roti=lunch/dinner, oats/eggs=breakfast etc.)

Return ONLY a raw JSON array. No markdown. No backticks. No explanation.
Start with [ and end with ]

Format:
[{"food_id":"exact ID from library or null","food_name":"what you see","meal_type":"breakfast|lunch|dinner|snack","qty":1,"unit":"piece|g|ml|cup|tbsp|serving","confidence":"high|medium|low","portion_note":"how you estimated (e.g. approx 1 katori = 150g)"}]

Portion estimation guidelines for Indian food:
- Standard katori/bowl of dal or curry = 150-200g
- Standard roti on a plate = 1 piece (~30g each)
- Rice on a plate = 100-150g cooked
- Side salad/kachumber = 80-100g
- Glass of lassi/milk = 250ml
- Paneer cubes in curry = 60-80g
- Sabzi/dry vegetable = 100-150g
- Sprouts/salad bowl = 100g
- Oats porridge bowl = 150-200g cooked
- Egg on plate = count them (1 egg = 1 piece)
- Paratha = 1 piece (~60g each, larger than roti)

If the photo is blurry, not food, or too dark to identify, return: []`
}

// ── helpers ───────────────────────────────────────────────────
function extractJSON(text) {
  if (!text || typeof text !== 'string') throw new Error('Empty response from AI')
  let clean = text
    .replace(/^```json\s*/im, '').replace(/^```\s*/im, '').replace(/```\s*$/im, '').trim()
  try { return JSON.parse(clean) } catch (_) {}
  const as = clean.indexOf('['), ae = clean.lastIndexOf(']')
  if (as !== -1 && ae > as) { try { return JSON.parse(clean.slice(as, ae + 1)) } catch (_) {} }
  const os = clean.indexOf('{'), oe = clean.lastIndexOf('}')
  if (os !== -1 && oe > os) { try { return JSON.parse(clean.slice(os, oe + 1)) } catch (_) {} }
  const am = clean.match(/\[[\s\S]*\]/)
  if (am) { try { return JSON.parse(am[0]) } catch (_) {} }
  throw new Error('Could not parse AI response. Raw: ' + clean.slice(0, 300))
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

function httpsPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch (e) { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(body); req.end()
  })
}

function calcMacros(food, qty, unit) {
  const base = food.base_amount
  let mult = 0
  if      (unit === 'g' || unit === 'ml')         mult = qty / base
  else if (unit === 'piece' || unit === 'serving') mult = qty
  else if (unit === 'cup')                         mult = (qty * 240) / base
  else if (unit === 'tbsp')                        mult = (qty * 15)  / base
  else                                             mult = qty / base
  return {
    cal:       Math.round(food.cal       * mult),
    protein_g: Math.round(food.protein_g * mult * 10) / 10,
    fiber_g:   Math.round(food.fiber_g   * mult * 10) / 10,
    carbs_g:   Math.round(food.carbs_g   * mult * 10) / 10,
    fat_g:     Math.round(food.fat_g     * mult * 10) / 10,
    mult:      Math.round(mult * 1000) / 1000,
  }
}

function amtLabel(qty, unit, food) {
  if (unit === 'g')       return `${qty}g`
  if (unit === 'ml')      return `${qty}ml`
  if (unit === 'piece')   return `${qty} ${food.base_unit}${qty !== 1 ? 's' : ''}`
  if (unit === 'serving') return `${qty} srv`
  if (unit === 'cup')     return `${qty} cup`
  if (unit === 'tbsp')    return `${qty} tbsp`
  return `${qty}`
}

// ── Gemini with retry + fallback ──────────────────────────────
async function callGeminiVision(imageBase64, mediaType, promptText) {
  const apiKey        = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in backend/.env — get free key at https://aistudio.google.com/app/apikey')
  const primaryModel  = process.env.GEMINI_MODEL          || 'gemini-2.5-flash'
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite'

  async function tryModel(model) {
    const payload = JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: mediaType || 'image/jpeg', data: imageBase64 } },
          { text: promptText }
        ]
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048, responseMimeType: 'application/json' }  // Increased for complex plates
    })
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path:     `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }
    const { status, body } = await httpsPost(options, payload)
    if (status === 429 || status === 503) throw { retryable: true,  message: body?.error?.message || `HTTP ${status}` }
    if (status !== 200)                   throw { retryable: false, message: body?.error?.message || `Gemini error ${status}` }
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!text) throw { retryable: false, message: 'Gemini returned empty content' }
    return extractJSON(text)
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try { return await tryModel(primaryModel) }
    catch (err) {
      if (err.retryable && attempt === 1) { console.log(`[scan] ${primaryModel} busy, retrying in 3s…`); await sleep(3000); continue }
      if (err.retryable) { console.log(`[scan] trying fallback ${fallbackModel}…`); break }
      throw new Error(err.message || String(err))
    }
  }
  try { return await tryModel(fallbackModel) }
  catch (err) { throw new Error(`Both models busy. Wait 1 min and retry. (${err.message || ''})`) }
}

async function callClaudeVision(imageBase64, mediaType, promptText) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in backend/.env')
  const payload = JSON.stringify({
    model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001', max_tokens: 1024,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
      { type: 'text', text: promptText }
    ]}]
  })
  const options = {
    hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(payload) }
  }
  const { status, body } = await httpsPost(options, payload)
  if (status !== 200) throw new Error(body?.error?.message || `Claude error ${status}`)
  return extractJSON(body?.content?.filter(c => c.type === 'text').map(c => c.text).join('') || '')
}

async function callOpenAIVision(imageBase64, mediaType, promptText) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set in backend/.env')
  const payload = JSON.stringify({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini', max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: [
      { type: 'image_url', image_url: { url: `data:${mediaType || 'image/jpeg'};base64,${imageBase64}` } },
      { type: 'text', text: promptText }
    ]}]
  })
  const options = {
    hostname: 'api.openai.com', path: '/v1/chat/completions', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(payload) }
  }
  const { status, body } = await httpsPost(options, payload)
  if (status !== 200) throw new Error(body?.error?.message || `OpenAI error ${status}`)
  return extractJSON(body?.choices?.[0]?.message?.content || '')
}

async function callVisionAI(imageBase64, mediaType, promptText) {
  const provider = (process.env.SCAN_PROVIDER || 'gemini').toLowerCase()
  if (provider === 'gemini') return callGeminiVision(imageBase64, mediaType, promptText)
  if (provider === 'claude') return callClaudeVision(imageBase64, mediaType, promptText)
  if (provider === 'openai') return callOpenAIVision(imageBase64, mediaType, promptText)
  throw new Error(`Provider "${provider}" does not support image scanning. Use gemini, claude, or openai.`)
}

// ═══════════════════════════════════════════════════════════
//  ROUTE 1 — POST /api/scan  (nutrition label)
// ═══════════════════════════════════════════════════════════
router.post('/', authMiddleware, checkScanLimit, async (req, res) => {
  const { imageBase64, mediaType } = req.body
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' })
  try {
    const result = await callVisionAI(imageBase64, mediaType, LABEL_PROMPT)
    if (result?.error) return res.status(422).json({ error: result.error })
    res.json({ result, provider: process.env.SCAN_PROVIDER || 'gemini' })
  } catch (e) {
    console.error('[scan/label]', e.message)
    res.status(502).json({ error: e.message })
  }
})

// ═══════════════════════════════════════════════════════════
//  ROUTE 2 — POST /api/scan/plate  (food photo → identify for review)
// ═══════════════════════════════════════════════════════════
router.post('/plate', authMiddleware, checkScanLimit, async (req, res) => {
  const { imageBase64, mediaType, date, meal_type } = req.body
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' })

  const logDate = date || today()
  const db      = getDb()

  const foods = db.prepare(
    'SELECT * FROM foods WHERE is_default = 1 OR user_id = ? ORDER BY is_default DESC, name'
  ).all(req.userId)

  const foodContext = foods.map(f =>
    `ID:${f.id} | "${f.name}" | per ${f.base_amount}${f.base_unit} → ${f.cal}kcal P${f.protein_g}g F${f.fiber_g}g C${f.carbs_g}g`
  ).join('\n')

  let platePrompt = buildPlatePrompt(foodContext)
  if (meal_type && ['breakfast','lunch','dinner','snack'].includes(meal_type)) {
    platePrompt += `\n\nImportant: User confirmed this is their ${meal_type}. Set meal_type="${meal_type}" for ALL items.`
  }

  let items
  try {
    items = await callVisionAI(imageBase64, mediaType, platePrompt)
  } catch (e) {
    console.error('[scan/plate]', e.message)
    return res.status(502).json({ error: e.message })
  }

  if (!Array.isArray(items)) items = []
  if (items.length === 0) {
    return res.status(200).json({
      items: [],
      logged: [],
      message: 'Could not identify food in the photo. Tips: good lighting, shoot from above, ensure food is clearly visible.'
    })
  }

  const identified = []
  for (const item of items) {
    if (!item.food_name) continue
    const food     = item.food_id ? foods.find(f => f.id === item.food_id) : null
    const qty      = parseFloat(item.qty) || 1
    const unit     = item.unit || food?.base_unit || 'g'
    const macros   = food ? calcMacros(food, qty, unit) : { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0, fat_g: 0, mult: 1 }
    const mealType = meal_type || (['breakfast','lunch','dinner','snack'].includes(item.meal_type) ? item.meal_type : 'lunch')
    const amt      = food ? amtLabel(qty, unit, food) : `~${qty} ${unit}`

    identified.push({
      food_id:      food?.id || null,
      food_name:    food?.name || item.food_name,
      meal_type:    mealType,
      qty,
      unit,
      amt_label:    amt,
      cal:          macros.cal,
      protein_g:    macros.protein_g,
      fiber_g:      macros.fiber_g,
      carbs_g:      macros.carbs_g,
      fat_g:        macros.fat_g,
      matched:      !!food,
      confidence:   item.confidence   || 'medium',
      portion_note: item.portion_note || '',
    })
  }

  const totals = identified.reduce((t, e) => ({
    cal:       t.cal       + e.cal,
    protein_g: t.protein_g + e.protein_g,
    fiber_g:   t.fiber_g   + e.fiber_g,
    carbs_g:   t.carbs_g   + e.carbs_g,
  }), { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0 })

  res.json({ items: identified, logged: [], totals, date: logDate, items_detected: items.length })
})

router.get('/info', authMiddleware, (req, res) => {
  res.json({
    active_provider:  process.env.SCAN_PROVIDER          || 'gemini',
    primary_model:    process.env.GEMINI_MODEL            || 'gemini-2.5-flash',
    fallback_model:   process.env.GEMINI_FALLBACK_MODEL   || 'gemini-2.5-flash-lite',
    gemini_key_set:   !!process.env.GEMINI_API_KEY,
    features:        ['label_scan', 'plate_scan', 'natural_language'],
  })
})

module.exports = router
