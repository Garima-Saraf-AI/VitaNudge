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

const LABEL_PROMPT = `You are a nutrition label reader. Your job is to ONLY read nutrition labels/facts panels.

CRITICAL VALIDATION:
1. Check if this image shows a NUTRITION LABEL/FACTS PANEL with printed nutrition information
2. If you see actual food, a meal plate, groceries, or any non-label photo: {"error":"not a nutrition label"}
3. Only proceed if you see a printed label with calories, protein, carbs, etc.

If this IS a nutrition label, extract the data:
Return ONLY a single valid JSON object. No markdown. No backticks. No explanation.
Start your response with { and end with }

Required format:
{"name":"product name","serving_size":"e.g. 100g","calories":0,"protein_g":0,"fiber_g":0,"carbs_g":0,"fat_g":0,"sugar_g":0,"sodium_mg":0,"gi":"low","diabetic_note":"one sentence about diabetic suitability","confidence":"high"}

Rules:
- Use 0 for any value you cannot read clearly
- gi must be one of: low, med, high
- confidence must be one of: high, medium, low
- If this is NOT a nutrition label (e.g., meal photo, food plate): {"error":"not a nutrition label"}
- Do NOT wrap in markdown. Do NOT add text outside the JSON`

function buildPlatePrompt(foodContext) {
  return `You are a food recognition AI. Identify ALL visible foods in this photo.

Return ONLY a compact JSON object. NO markdown. NO backticks. NO text outside JSON.
Start with { and end with }

CRITICAL: Keep response under 1000 characters. Use SHORT food names.

Format (REQUIRED):
{"items":[{"name":"food name","grams":150,"cal":200,"protein":8,"carbs":30,"fiber":2,"conf":"high"}]}

- name: SHORT common name (e.g. "rice" not "basmati rice cooked")
- grams: estimated weight (use visual cues: plate size, bowl depth)
- cal: estimated calories for this portion (REQUIRED - use nutrition knowledge)
- protein: estimated protein in grams (REQUIRED)
- carbs: estimated carbs in grams (REQUIRED)
- fiber: estimated fiber in grams (REQUIRED)
- conf: "high", "med", or "low"
- MAX 10 items (if more foods, pick the 10 largest portions)

IMPORTANT: Provide calorie/macro estimates for EVERY food. Use standard nutrition data.

Estimation guide:
- Bowl of rice/dal = 150g
- Roti/chapati = 30g each
- Curry bowl = 180g
- Egg = 50g each
- Paratha = 60g each
- Salad bowl = 100g

If photo unclear or no food, return: {"items":[]}
`
}

// ── Food matching with aliases ───────────────────────────────
const FOOD_ALIASES = {
  // Grains & Rice
  'rice': ['cooked rice', 'brown rice', 'white rice', 'basmati', 'jeera rice', 'steamed rice', 'boiled rice', 'fried rice'],
  'roti': ['chapati', 'phulka', 'wheat roti', 'whole wheat roti', 'indian bread'],
  'naan': ['butter naan', 'garlic naan', 'plain naan'],
  'bread': ['white bread', 'wheat bread', 'whole grain bread', 'toast'],
  'quinoa': ['cooked quinoa', 'boiled quinoa'],

  // Lentils & Legumes
  'dal': ['lentils', 'daal', 'yellow dal', 'masoor dal', 'dal makhani', 'dal tadka', 'dal fry', 'toor dal'],
  'beans': ['black beans', 'kidney beans', 'pinto beans', 'chickpeas', 'garbanzo beans'],

  // Dairy
  'yogurt': ['curd', 'dahi', 'greek yogurt', 'plain yogurt'],
  'paneer': ['cottage cheese', 'paneer cubes', 'paneer tikka', 'grilled paneer'],
  'milk': ['whole milk', 'skim milk', '2% milk', 'low fat milk'],

  // Proteins
  'chicken': ['chicken breast', 'grilled chicken', 'chicken curry', 'roasted chicken', 'chicken tikka', 'tandoori chicken', 'fried chicken'],
  'whole egg': ['egg', 'eggs', 'boiled egg', 'hard-boiled egg', 'soft-boiled egg', 'scrambled eggs', 'omelette', 'fried egg', 'poached egg'],
  'fish': ['grilled fish', 'fried fish', 'baked fish', 'salmon', 'tuna'],
  'salmon': ['grilled salmon', 'baked salmon', 'smoked salmon', 'salmon fillet'],
  'tofu': ['fried tofu', 'grilled tofu', 'soft tofu'],

  // Vegetables
  'broccoli': ['broccoli florets', 'steamed broccoli', 'roasted broccoli'],
  'spinach': ['palak', 'spinach leaves', 'cooked spinach', 'sauteed spinach'],
  'potato': ['potatoes', 'boiled potato', 'mashed potato', 'roasted potato', 'baked potato', 'french fries'],
  'tomato': ['tomatoes', 'cherry tomatoes', 'sliced tomato'],
  'cucumber': ['sliced cucumber', 'cucumber slices'],
  'carrot': ['carrots', 'sliced carrot', 'boiled carrot', 'baby carrots'],
  'onion': ['onions', 'sliced onion', 'red onion', 'white onion'],
  'pepper': ['bell pepper', 'green pepper', 'red pepper', 'capsicum'],
}

function matchFoodByName(name, foods) {
  if (!name || !foods) return null
  const lower = name.toLowerCase().trim()

  // Exact match
  let match = foods.find(f => f.name.toLowerCase() === lower)
  if (match) return match

  // Partial match
  match = foods.find(f => f.name.toLowerCase().includes(lower) || lower.includes(f.name.toLowerCase()))
  if (match) return match

  // Alias match
  for (const [canonical, aliases] of Object.entries(FOOD_ALIASES)) {
    if (aliases.some(a => a === lower || lower.includes(a) || a.includes(lower))) {
      match = foods.find(f => f.name.toLowerCase().includes(canonical))
      if (match) return match
    }
  }

  return null
}

// ── helpers ───────────────────────────────────────────────────
function extractJSON(text) {
  if (!text || typeof text !== 'string') throw new Error('Empty response from AI')
  let clean = text
    .replace(/^```json\s*/im, '').replace(/^```\s*/im, '').replace(/```\s*$/im, '').trim()

  // Try direct parse first
  try { return JSON.parse(clean) } catch (_) {}

  // Try to find complete JSON array
  const as = clean.indexOf('['), ae = clean.lastIndexOf(']')
  if (as !== -1 && ae > as) { try { return JSON.parse(clean.slice(as, ae + 1)) } catch (_) {} }

  // Try to find complete JSON object
  const os = clean.indexOf('{'), oe = clean.lastIndexOf('}')
  if (os !== -1 && oe > os) { try { return JSON.parse(clean.slice(os, oe + 1)) } catch (_) {} }

  // PARTIAL RECOVERY: Try to extract truncated items array
  const itemsMatch = clean.match(/"items"\s*:\s*\[([^\]]*)/i)
  if (itemsMatch) {
    try {
      // Attempt to parse whatever we have, even if incomplete
      const partialItems = JSON.parse('[' + itemsMatch[1] + ']')
      console.warn('[scan] Partial recovery: extracted', partialItems.length, 'items from truncated response')
      return { items: partialItems, _truncated: true }
    } catch (_) {}
  }

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
  let retryAttempted = false
  try {
    items = await callVisionAI(imageBase64, mediaType, platePrompt)
  } catch (e) {
    console.error('[scan/plate] First attempt failed:', e.message)

    // Retry once with compact repair prompt if parsing failed
    if (e.message.includes('parse') && !retryAttempted) {
      console.log('[scan/plate] Retrying with compact prompt...')
      retryAttempted = true
      const compactPrompt = `Identify foods in this photo. Return ONLY: {"items":[{"name":"food","grams":100,"conf":"high"}]} Keep under 500 chars. NO markdown.`
      try {
        items = await callVisionAI(imageBase64, mediaType, compactPrompt)
      } catch (retryError) {
        console.error('[scan/plate] Retry failed:', retryError.message)
        return res.status(502).json({ error: 'AI response could not be parsed after retry. Try a clearer photo.' })
      }
    } else {
      return res.status(502).json({ error: e.message })
    }
  }

  // Handle new compact format: {"items":[{name,grams,conf}]}
  let itemsArray = Array.isArray(items) ? items : (items?.items || [])

  if (itemsArray.length === 0) {
    return res.status(200).json({
      items: [],
      logged: [],
      message: 'Could not identify food in the photo. Tips: good lighting, shoot from above, ensure food is clearly visible.'
    })
  }

  const identified = []
  for (const item of itemsArray) {
    const foodName = item.name || item.food_name
    if (!foodName) continue

    // Fuzzy match food name against library (with aliases)
    const matched = matchFoodByName(foodName, foods)

    let qty  = parseFloat(item.grams || item.qty) || 100
    let unit = 'g' // AI provides grams

    // BUGFIX: Handle unit mismatch (AI gives grams, library uses pieces)
    // Example: AI detects "100g egg white" but library has "Egg white (1 piece = 33g)"
    if (matched && matched.base_unit === 'piece') {
      // Convert grams to pieces: 100g ÷ 33g/piece = 3.03 pieces
      const gramsPerPiece = matched.base_amount || 100
      qty = qty / gramsPerPiece
      unit = 'piece'
    }

    // BUGFIX: Use AI estimates for unmatched foods (don't save with zero nutrition)
    let macros
    if (matched) {
      macros = calcMacros(matched, qty, unit)
    } else {
      // Use AI-provided nutrition estimates
      macros = {
        cal:       Math.round(item.cal || item.calories || 0),
        protein_g: Math.round((item.protein || item.protein_g || 0) * 10) / 10,
        fiber_g:   Math.round((item.fiber || item.fiber_g || 0) * 10) / 10,
        carbs_g:   Math.round((item.carbs || item.carbs_g || 0) * 10) / 10,
        fat_g:     Math.round((item.fat || item.fat_g || 0) * 10) / 10,
        mult:      1,
      }
    }

    const mealType = meal_type || 'lunch' // Use user-provided meal_type or default to lunch
    const amt      = matched ? amtLabel(qty, unit, matched) : `~${qty}g`
    const conf     = item.conf || item.confidence || 'medium'

    identified.push({
      food_id:      matched?.id || null,
      food_name:    matched?.name || foodName,
      meal_type:    mealType,
      qty,
      unit,
      amt_label:    amt,
      cal:          macros.cal,
      protein_g:    macros.protein_g,
      fiber_g:      macros.fiber_g,
      carbs_g:      macros.carbs_g,
      fat_g:        macros.fat_g,
      matched:      !!matched,
      confidence:   conf === 'high' ? 'high' : conf === 'low' ? 'low' : 'medium',
      match_note:   matched ? `Matched: ${matched.name}` : 'AI estimate - review before saving',
    })
  }

  const totals = identified.reduce((t, e) => ({
    cal:       t.cal       + e.cal,
    protein_g: t.protein_g + e.protein_g,
    fiber_g:   t.fiber_g   + e.fiber_g,
    carbs_g:   t.carbs_g   + e.carbs_g,
  }), { cal: 0, protein_g: 0, fiber_g: 0, carbs_g: 0 })

  // Check if response was truncated
  const wasTruncated = items?._truncated || false
  const message = wasTruncated
    ? 'Some foods may not have been detected due to AI response limit. Scan complex plates separately.'
    : undefined

  res.json({
    items: identified,
    logged: [],
    totals,
    date: logDate,
    items_detected: identified.length,
    message,
    _truncated: wasTruncated
  })
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
