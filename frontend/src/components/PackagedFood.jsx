import { useState, useRef } from 'react'
import api from '../utils/api'
import { today } from '../utils/calc'
import UpgradeModal from './UpgradeModal'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const EMPTY_RESULT = {
  name: '',
  calories: '',
  protein_g: '',
  fiber_g: '',
  carbs_g: '',
  fat_g: '',
  serving_size: '',
  gi: '',
  diabetic_note: '',
}

export default function PackagedFood({ onSaveToLibrary, saving = false }) {
  const [mode, setMode] = useState('barcode') // 'barcode' or 'label'
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState(null)
  const [imgSrc, setImgSrc] = useState(null)
  const [imgFile, setImgFile] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const fileRef = useRef(null)
  const selectedFileRef = useRef(null)
  const previewUrlRef = useRef(null)

  // Barcode lookup
  async function lookupBarcode(code = barcode) {
    const clean = String(code || '').replace(/\D/g, '')
    if (!clean) return
    setScanning(true)
    setError('')
    setProduct(null)
    try {
      const data = await api.get(`/barcode/${clean}`)
      setBarcode(clean)
      setProduct(data.product)
    } catch (e) {
      if (e.upgrade_required) { setShowUpgrade(true); return }
      setError(e.error || 'Product not found. Try scanning the nutrition label instead.')
    } finally {
      setScanning(false)
    }
  }

  async function handleBarcodeImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!('BarcodeDetector' in window)) {
      setError('Barcode image scanning is not supported in this browser. Type the barcode number instead.')
      return
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
      const image = await createImageBitmap(file)
      const codes = await detector.detect(image)
      if (!codes.length) return setError('No barcode detected. Try typing the number or scan the nutrition label instead.')
      lookupBarcode(codes[0].rawValue)
    } catch (e2) {
      setError('Could not scan barcode. Try typing the number or scan the nutrition label instead.')
    }
  }

  async function saveFromBarcode() {
    if (!product?.food) return
    await onSaveToLibrary(product.food)
  }

  // Label scan
  function setSelectedFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please choose a valid image file.')
      return
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)

    const previewUrl = URL.createObjectURL(file)
    previewUrlRef.current = previewUrl
    selectedFileRef.current = file

    setImgFile(file)
    setImgSrc(previewUrl)
    setResult(null)
    setError('')
    setEditMode(false)
    setEditData(null)
  }

  function handleLabelFileInput(e) {
    setSelectedFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    e.currentTarget.style.borderColor = 'var(--border2)'
    e.currentTarget.style.background = 'var(--surface2)'
    setSelectedFile(e.dataTransfer.files?.[0])
  }

  async function scanLabel() {
    const file = selectedFileRef.current || imgFile
    if (!file || scanning) return

    setScanning(true)
    setError('')
    setResult(null)
    setEditMode(false)

    try {
      const imageBase64 = await fileToBase64(file)
      const data = await api.post('/scan', {
        imageBase64,
        mediaType: file.type || 'image/jpeg',
      })

      const nextResult = { ...EMPTY_RESULT, ...data.result }
      setResult(nextResult)
      setEditData(nextResult)
    } catch (e) {
      if (e.upgrade_required) { setShowUpgrade(true); return }
      setError(e.error || e.message || 'Could not read label. Try the barcode scanner instead.')
    } finally {
      setScanning(false)
    }
  }

  function resetLabel() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    selectedFileRef.current = null

    setImgSrc(null)
    setImgFile(null)
    setResult(null)
    setEditMode(false)
    setEditData(null)
    setError('')
  }

  function updateField(key, value) {
    setEditData(prev => ({ ...prev, [key]: value }))
  }

  function foodFromLabelResult(data = editData || result) {
    return {
      name: data.name || '',
      category: 'custom',
      base_unit: 'g',
      base_amount: 100,
      serving: data.serving_size || '100g',
      cal: Number(data.calories) || 0,
      protein_g: Number(data.protein_g) || 0,
      fiber_g: Number(data.fiber_g) || 0,
      carbs_g: Number(data.carbs_g) || 0,
      fat_g: Number(data.fat_g) || 0,
      gi: data.gi || 'unknown',
      notes: data.diabetic_note || '',
    }
  }

  async function saveFromLabel() {
    if (!result) return
    const food = foodFromLabelResult()
    await onSaveToLibrary(food)
    resetLabel()
  }

  return (
    <div>
      {showUpgrade && <UpgradeModal feature="barcode" onClose={() => setShowUpgrade(false)} />}

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={mode === 'barcode' ? 'btn btn-green' : 'btn btn-ghost'}
          onClick={() => setMode('barcode')}
          style={{ flex: 1 }}
        >
          📱 Scan barcode
        </button>
        <button
          className={mode === 'label' ? 'btn btn-green' : 'btn btn-ghost'}
          onClick={() => setMode('label')}
          style={{ flex: 1 }}
        >
          📋 Scan label
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

      {/* BARCODE MODE */}
      {mode === 'barcode' && (
        <div className="card">
          <div className="card-title">Barcode scanner</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 12 }}>
            Scan or type the barcode number for instant verified nutrition data from our product database.
          </div>

          <div className="form-group">
            <label>Barcode number</label>
            <input
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="e.g. 8901234567890"
              onKeyDown={e => e.key === 'Enter' && lookupBarcode()}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn btn-green" onClick={() => lookupBarcode()} disabled={scanning}>
              {scanning ? 'Looking up...' : 'Look up'}
            </button>
            <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0 }}>
              📷 Scan barcode photo
              <input type="file" accept="image/*" capture="environment" onChange={handleBarcodeImage} style={{ display: 'none' }} />
            </label>
          </div>

          {product && (
            <div className="card" style={{ background: 'var(--surface2)', marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--text)' }}>
                {product.product_name || 'Unknown product'}
              </div>
              {product.brands && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{product.brands}</div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                <div><strong>Calories:</strong> {product.food?.cal || 0}</div>
                <div><strong>Protein:</strong> {product.food?.protein_g || 0}g</div>
                <div><strong>Carbs:</strong> {product.food?.carbs_g || 0}g</div>
                <div><strong>Fat:</strong> {product.food?.fat_g || 0}g</div>
                <div><strong>Fiber:</strong> {product.food?.fiber_g || 0}g</div>
                <div><strong>Serving:</strong> {product.food?.serving || '100g'}</div>
              </div>
              <button className="btn btn-green" onClick={saveFromBarcode} disabled={saving} style={{ marginTop: 12, width: '100%' }}>
                {saving ? 'Saving...' : 'Save to library'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* LABEL MODE */}
      {mode === 'label' && (
        <div className="card">
          <div className="card-title">Nutrition label scanner</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 12 }}>
            Take a photo of the nutrition facts panel. AI will read the values for you.
          </div>

          <div
            className="scan-dropzone"
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'rgba(34,168,78,.05)' }}
            onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
          >
            {imgSrc ? (
              <div style={{ position: 'relative' }}>
                <img src={imgSrc} alt="Label preview" style={{ width: '100%', height: 'auto', borderRadius: 'var(--rs)' }} />
                <button
                  onClick={resetLabel}
                  className="btn btn-ghost btn-compact"
                  style={{ position: 'absolute', top: 8, right: 8 }}
                >
                  ✕ Clear
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                  Drop nutrition label photo here
                </div>
                <div style={{ fontSize: 11, color: 'var(--hint)', marginBottom: 12 }}>
                  or click below to choose a file
                </div>
                <label className="btn btn-green" style={{ cursor: 'pointer', margin: 0 }}>
                  📷 Choose photo
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleLabelFileInput}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>

          {imgSrc && !result && (
            <button className="btn btn-green" onClick={scanLabel} disabled={scanning} style={{ marginTop: 12, width: '100%' }}>
              {scanning ? 'Reading label...' : 'Read nutrition label'}
            </button>
          )}

          {result && (
            <div className="card" style={{ background: 'var(--surface2)', marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text)' }}>
                Extracted nutrition
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 12, marginBottom: 12 }}>
                <div><strong>Name:</strong> {result.name || 'Not detected'}</div>
                <div><strong>Serving:</strong> {result.serving_size || 'Not detected'}</div>
                <div><strong>Calories:</strong> {result.calories || 0}</div>
                <div><strong>Protein:</strong> {result.protein_g || 0}g</div>
                <div><strong>Carbs:</strong> {result.carbs_g || 0}g</div>
                <div><strong>Fat:</strong> {result.fat_g || 0}g</div>
                <div><strong>Fiber:</strong> {result.fiber_g || 0}g</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setEditMode(!editMode)} style={{ flex: 1 }}>
                  {editMode ? 'Hide' : 'Edit'} values
                </button>
                <button className="btn btn-green" onClick={saveFromLabel} disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save to library'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
