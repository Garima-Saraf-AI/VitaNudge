import { useRef, useState } from 'react'
import api from '../utils/api'

const TIPS = [
  'Crop to only the nutrition facts panel',
  'Use good lighting and avoid shadows',
  'Keep the full label visible',
  'Avoid blur or tilted photos',
  'Works best on packaged foods',
]

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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function LabelScan({ onResult, onSave, onSaveToLibrary, saving = false }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [imgFile, setImgFile] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState(null)
  const [tipIndex, setTipIndex] = useState(0)

  const fileRef = useRef(null)
  const selectedFileRef = useRef(null)
  const previewUrlRef = useRef(null)

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

  function handleFileInput(e) {
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
      onResult?.(nextResult)
    } catch (e) {
      setError(e.error || e.message || 'Could not read label. Try a clearer photo.')
    } finally {
      setScanning(false)
    }
  }

  function reset() {
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

  async function saveEditedResult() {
    const nextResult = { ...EMPTY_RESULT, ...editData }
    setResult(nextResult)
    setEditData(nextResult)
    setError('') // Clear any previous errors when saving
    onResult?.(nextResult)

    if (onSaveToLibrary) {
      await onSaveToLibrary(nextResult)
      return
    }

    setEditMode(false)
    onSave?.(nextResult)
  }

  function openCamera() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = handleFileInput
    input.click()
  }

  const actionButton = {
    flex: 1,
    minHeight: 44,
    padding: '0 12px',
    border: 'none',
    borderRadius: 'var(--rs)',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: "'Sora',sans-serif",
    fontSize: 13,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }

  const uploadButton = {
    minHeight: 44,
    minWidth: 152,
    padding: '0 16px',
    fontSize: 13,
    fontWeight: 800,
    border: 'none',
    borderRadius: 'var(--rs)',
    color: '#fff',
    cursor: 'pointer',
    fontFamily: "'Sora',sans-serif",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--rl)',
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--blue-l)',
          border: '1px solid var(--blue-b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 18,
        }}>
          🏷️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Scan nutrition label
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
            AI extracts calories and macros automatically
          </div>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {!imgSrc ? (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = 'var(--blue)'
                e.currentTarget.style.background = 'var(--blue-l)'
              }}
              onDragLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border2)'
                e.currentTarget.style.background = 'var(--surface2)'
              }}
              style={{
                border: '2px dashed var(--border2)',
                borderRadius: 'var(--rl)',
                padding: '26px 16px',
                textAlign: 'center',
                background: 'var(--surface2)',
                cursor: 'pointer',
                transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'var(--blue-l)',
                border: '1px solid var(--blue-b)',
                color: 'var(--blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <UploadIcon />
              </div>

              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>
                Tap or drag & drop photo
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>
                Choose or take a clear nutrition label photo
              </div>

              <div style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: 14,
              }}>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    fileRef.current?.click()
                  }}
                  style={{ ...uploadButton, background: 'var(--green)' }}
                >
                  <FolderIcon />
                  Choose Photo
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    openCamera()
                  }}
                  style={{ ...uploadButton, background: 'var(--blue)' }}
                >
                  <CameraIcon />
                  Take Photo
                </button>
              </div>
            </div>

            <div style={{
              marginTop: 10,
              padding: '9px 13px',
              background: 'var(--blue-l)',
              border: '1px solid var(--blue-b)',
              borderRadius: 'var(--rs)',
              fontSize: 12,
              color: 'var(--blue)',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}>
              <span style={{ flexShrink: 0, lineHeight: 1 }}>
                <TipIcon />
              </span>
              <div>
                <strong>Tip {tipIndex + 1}/5:</strong> {TIPS[tipIndex]}
                <span
                  onClick={() => setTipIndex(i => (i + 1) % TIPS.length)}
                  style={{ marginLeft: 8, cursor: 'pointer', opacity: .7, fontSize: 11 }}
                >
                  next tip →
                </span>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--rl)',
            padding: 10,
          }}>
            <div style={{
              position: 'relative',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--rs)',
              overflow: 'hidden',
            }}>
              <img
                src={imgSrc}
                alt="Nutrition label preview"
                style={{
                  width: '100%',
                  maxHeight: 310,
                  objectFit: 'contain',
                  display: 'block',
                  background: 'var(--surface)',
                }}
              />

              {scanning && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,.62)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#fff',
                  gap: 8,
                }}>
                  <div className="spin" style={{ margin: 0, borderTopColor: '#fff' }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    Reading nutrition label...
                  </div>
                </div>
              )}

              {!scanning && (
                <button
                  onClick={reset}
                  title="Remove photo"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,.68)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            {!scanning && !result && (
              <button
                onClick={scanLabel}
                style={{
                  ...actionButton,
                  width: '100%',
                  flex: 'unset',
                  marginTop: 10,
                  background: 'var(--blue)',
                  minHeight: 46,
                  fontSize: 13,
                }}
              >
                <ScanIcon />
                Read Nutrition Label
              </button>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {error && (
          <div style={{
            marginTop: 10,
            padding: '10px 12px',
            background: 'var(--red-l)',
            border: '1px solid var(--red-b)',
            borderRadius: 'var(--rs)',
            color: 'var(--red)',
            fontSize: 12,
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {result && !editMode && (
          <div style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--green-l)',
            borderRadius: 'var(--rs)',
            border: '1px solid var(--green-b)',
          }}>
            <div style={{ fontWeight: 900, color: 'var(--green)', marginBottom: 10 }}>
              Nutrition label scanned
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 8,
              textAlign: 'center',
              marginBottom: 10,
            }}>
              {[
                ['calories', 'kcal'],
                ['protein_g', 'protein'],
                ['carbs_g', 'carbs'],
                ['fat_g', 'fat'],
                ['fiber_g', 'fiber'],
              ].map(([key, label]) => (
                <div key={key}>
                  <div style={{
                    color: 'var(--green)',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 15,
                    fontWeight: 900,
                  }}>
                    {result[key] || 0}
                  </div>
                  <div style={{
                    color: 'var(--green)',
                    fontSize: 9,
                    opacity: .78,
                    textTransform: 'uppercase',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 10 }}>
              {result.name || 'Food name not detected'}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: onSaveToLibrary ? '1fr 1fr' : '1fr',
              gap: 8,
            }}>
              {onSaveToLibrary && (
                <button
                  onClick={() => onSaveToLibrary(result)}
                  disabled={saving}
                  style={{
                    ...actionButton,
                    width: '100%',
                    flex: 'unset',
                    background: saving ? 'var(--border2)' : 'var(--green)',
                    minHeight: 40,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <SaveIcon />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              )}
              <button
                onClick={() => setEditMode(true)}
                style={{
                  ...actionButton,
                  width: '100%',
                  flex: 'unset',
                  background: 'var(--blue)',
                  minHeight: 40,
                }}
              >
                <EditIcon />
                Edit values
              </button>
            </div>
          </div>
        )}

        {editMode && editData && (
          <div style={{
            marginTop: 12,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--rs)',
            padding: 12,
          }}>
            {['name', 'serving_size', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'].map(key => (
              <div key={key} style={{ marginBottom: 8 }}>
                <label style={{
                  display: 'block',
                  color: 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  marginBottom: 5,
                  textTransform: 'uppercase',
                }}>
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  value={editData[key] ?? ''}
                  onChange={e => updateField(key, e.target.value)}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: '0 10px',
                    borderRadius: 'var(--rs)',
                    border: '1px solid var(--border2)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontFamily: key === 'name' || key === 'serving_size' ? "'Sora',sans-serif" : "'JetBrains Mono',monospace",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
              </div>
            ))}

            <button
              onClick={saveEditedResult}
              disabled={saving}
              style={{
                ...actionButton,
                width: '100%',
                flex: 'unset',
                background: saving ? 'var(--border2)' : 'var(--blue)',
                minHeight: 42,
                marginTop: 4,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <SaveIcon />
              {saving ? 'Saving...' : onSaveToLibrary ? 'Save' : 'Save reviewed values'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M20 16.5A4.5 4.5 0 0 1 15.5 21h-7A5.5 5.5 0 0 1 7 10.2" />
    </svg>
  )
}

function TipIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h7l2 2h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h4" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3" />
      <path d="M7 12h10" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  )
}
