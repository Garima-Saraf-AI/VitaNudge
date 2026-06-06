// // import { useState, useEffect } from 'react'
// // import { useNavigate, useLocation } from 'react-router-dom'
// // import api from '../utils/api'

// // export default function ScanAdd() {
// //   const navigate  = useNavigate()
// //   const location  = useLocation()
// //   const editFood  = location.state?.edit || null

// //   const [imgSrc,   setImgSrc]   = useState(null)
// //   const [scanning, setScanning] = useState(false)
// //   const [scanErr,  setScanErr]  = useState('')
// //   const [scanRes,  setScanRes]  = useState(null)
// //   const [saving,   setSaving]   = useState(false)
// //   const [msg,      setMsg]      = useState('')

// //   const [form, setForm] = useState({
// //     name: '', category: 'custom', base_unit: 'g', base_amount: 100,
// //     serving: '', cal: '', protein_g: '', fiber_g: '', carbs_g: '', fat_g: '', gi: '', notes: ''
// //   })

// //   useEffect(() => {
// //     if (editFood) {
// //       setForm({
// //         name: editFood.name, category: editFood.category,
// //         base_unit: editFood.base_unit, base_amount: editFood.base_amount,
// //         serving: editFood.serving || '', cal: editFood.cal, protein_g: editFood.protein_g,
// //         fiber_g: editFood.fiber_g, carbs_g: editFood.carbs_g, fat_g: editFood.fat_g,
// //         gi: editFood.gi || '', notes: editFood.notes || ''
// //       })
// //     }
// //   }, [editFood])

// //   function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

// //   async function scanImage(file) {
// //     setScanErr(''); setScanRes(null); setScanning(true)
// //     const b64 = await new Promise((res, rej) => {
// //       const r = new FileReader()
// //       r.onload = () => res(r.result.split(',')[1])
// //       r.onerror = rej
// //       r.readAsDataURL(file)
// //     })
// //     try {
// //       const data = await api.post('/scan', { imageBase64: b64, mediaType: file.type || 'image/jpeg' })
// //       const r = data.result
// //       setScanRes(r)
// //       setForm(f => ({
// //         ...f,
// //         name:      r.name || f.name,
// //         serving:   r.serving_size || f.serving,
// //         cal:       r.calories ?? f.cal,
// //         protein_g: r.protein_g ?? f.protein_g,
// //         fiber_g:   r.fiber_g ?? f.fiber_g,
// //         carbs_g:   r.carbs_g ?? f.carbs_g,
// //         fat_g:     r.fat_g ?? f.fat_g,
// //         gi:        r.gi || f.gi,
// //         notes:     r.diabetic_note || f.notes,
// //       }))
// //     } catch (e) {
// //       setScanErr(e.error || 'Could not read label. Try a clearer photo or enter manually.')
// //     } finally {
// //       setScanning(false)
// //     }
// //   }

// //   function handleFile(e) {
// //     const file = e.target.files[0]; if (!file) return
// //     setImgSrc(URL.createObjectURL(file))
// //     scanImage(file)
// //     e.target.value = ''
// //   }

// //   function handleDrop(e) {
// //     e.preventDefault()
// //     e.currentTarget.classList.remove('drag')
// //     const file = e.dataTransfer.files[0]
// //     if (file && file.type.startsWith('image/')) { setImgSrc(URL.createObjectURL(file)); scanImage(file) }
// //   }

// //   async function save() {
// //     if (!form.name.trim()) return alert('Food name is required')
// //     setSaving(true)
// //     try {
// //       if (editFood) {
// //         await api.put(`/foods/${editFood.id}`, form)
// //         setMsg('Food updated!')
// //       } else {
// //         await api.post('/foods', form)
// //         setMsg('Food saved to library!')
// //       }
// //       setTimeout(() => navigate('/library'), 1200)
// //     } catch (e) {
// //       alert(e.error || 'Save failed')
// //     } finally {
// //       setSaving(false)
// //     }
// //   }

// //   const F = form

// //   return (
// //     <div>
// //       {msg && <div className="success-box">{msg}</div>}

// //       <div className="card">
// //         <div className="card-title">
// //           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
// //           {editFood ? `Edit: ${editFood.name}` : 'Scan nutrition label (AI-powered)'}
// //         </div>

// //         {!editFood && (
// //           <>
// //             <div className="warn-box">
// //               Scanning calls the AI through your local server. Make sure <code>GEMINI_API_KEY</code> is set in <code>backend/.env</code>.
// //             </div>

// //             <div
// //               className="scan-zone"
// //               onClick={() => document.getElementById('scanInput').click()}
// //               onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag') }}
// //               onDragLeave={e => e.currentTarget.classList.remove('drag')}
// //               onDrop={handleDrop}
// //             >
// //               {imgSrc ? (
// //                 <img src={imgSrc} alt="label" className="scan-img" />
// //               ) : (
// //                 <>
// //                   <div className="scan-icon">
// //                     <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
// //                   </div>
// //                   <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 4 }}>Tap to upload or drag &amp; drop a nutrition label photo</p>
// //                   <span style={{ fontSize: 11, color: 'var(--hint)' }}>Clear, well-lit photo of just the nutrition panel works best</span>
// //                 </>
// //               )}
// //             </div>
// //             <input id="scanInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

// //             {scanning && <div style={{ textAlign: 'center', padding: 16 }}><div className="spin" style={{ margin: '0 auto 8px' }} /><div style={{ fontSize: 13, color: 'var(--muted)' }}>Claude AI is reading your label…</div></div>}
// //             {scanErr && <div className="error-box">{scanErr}</div>}
// //             {scanRes && (
// //               <div className="success-box">
// //                 <strong>✓ Scanned successfully</strong> — {scanRes.name}<br />
// //                 {scanRes.diabetic_note && <span>{scanRes.diabetic_note}</span>}<br />
// //                 Confidence: {scanRes.confidence || 'medium'} · Values filled below — review and save.
// //               </div>
// //             )}

// //             <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', color: 'var(--hint)', fontSize: 12 }}>
// //               <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />or enter manually<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
// //             </div>
// //           </>
// //         )}

// //         {/* Manual form */}
// //         <div className="form-grid full"><div className="form-group"><label>Food name</label><input value={F.name} onChange={set('name')} placeholder="e.g. Amul Paneer 100g" /></div></div>
// //         <div className="form-grid">
// //           <div className="form-group">
// //             <label>Category</label>
// //             <select value={F.category} onChange={set('category')}>
// //               {['custom','dairy','legume','grain','veg','protein','fruit','snack','beverage'].map(c => <option key={c} value={c}>{c}</option>)}
// //             </select>
// //           </div>
// //           <div className="form-group">
// //             <label>Base unit (macros below are FOR this unit)</label>
// //             <select value={F.base_unit} onChange={set('base_unit')}>
// //               <option value="g">Per gram (g) — e.g. paneer, dal, rice</option>
// //               <option value="ml">Per ml — e.g. milk, curd, juice</option>
// //               <option value="piece">Per piece — e.g. egg, roti, almond</option>
// //             </select>
// //           </div>
// //         </div>
// //         <div className="form-grid">
// //           <div className="form-group">
// //             <label>Base amount</label>
// //             <input type="number" value={F.base_amount} onChange={set('base_amount')} min="1" placeholder="100" />
// //             <div className="hint-text">Macros below apply to this exact amount of the base unit</div>
// //           </div>
// //           <div className="form-group"><label>Serving label (display only)</label><input value={F.serving} onChange={set('serving')} placeholder="e.g. 1 cup / 100g / 1 egg" /></div>
// //         </div>
// //         <div className="form-grid">
// //           <div className="form-group"><label>Calories (kcal)</label><input type="number" value={F.cal} onChange={set('cal')} min="0" step="0.1" placeholder="0" /></div>
// //           <div className="form-group"><label>Protein (g)</label><input type="number" value={F.protein_g} onChange={set('protein_g')} min="0" step="0.1" placeholder="0" /></div>
// //         </div>
// //         <div className="form-grid">
// //           <div className="form-group"><label>Fibre (g)</label><input type="number" value={F.fiber_g} onChange={set('fiber_g')} min="0" step="0.1" placeholder="0" /></div>
// //           <div className="form-group"><label>Net carbs (g)</label><input type="number" value={F.carbs_g} onChange={set('carbs_g')} min="0" step="0.1" placeholder="0" /></div>
// //         </div>
// //         <div className="form-grid">
// //           <div className="form-group"><label>Fat (g)</label><input type="number" value={F.fat_g} onChange={set('fat_g')} min="0" step="0.1" placeholder="0" /></div>
// //           <div className="form-group"><label>GI rating</label><select value={F.gi} onChange={set('gi')}><option value="">Unknown</option><option value="low">Low GI</option><option value="med">Medium GI</option><option value="high">High GI</option></select></div>
// //         </div>
// //         <div className="form-grid full"><div className="form-group"><label>Notes</label><textarea value={F.notes} onChange={set('notes')} placeholder="e.g. diabetic-friendly, good post-workout..." /></div></div>
// //         <button className="btn btn-green btn-full" onClick={save} disabled={saving}>{saving ? 'Saving…' : editFood ? 'Update food' : 'Save to library'}</button>
// //       </div>
// //     </div>
// //   )
// // }



// import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import api from '../utils/api'
// import PlateScan from '../components/PlateScan'
// import { today } from '../utils/calc'

// // ── tabs ───────────────────────────────────────────────────────
// const TABS = [
//   { key: 'plate',  label: '📷 Scan plate',    desc: 'Photo of your food' },
//   { key: 'label',  label: '🏷️ Scan label',    desc: 'Nutrition label photo' },
//   { key: 'manual', label: '✏️ Add manually',  desc: 'Enter values yourself' },
// ]

// export default function ScanAdd() {
//   const navigate     = useNavigate()
//   const location     = useLocation()
//   const editFood     = location.state?.edit || null

//   const [tab,      setTab]      = useState(editFood ? 'manual' : 'plate')
//   const [saving,   setSaving]   = useState(false)
//   const [msg,      setMsg]      = useState('')

//   // ── label scan state ──────────────────────────────────────
//   const [lblImg,   setLblImg]   = useState(null)
//   const [lblFile,  setLblFile]  = useState(null)
//   const [lblScan,  setLblScan]  = useState(false)
//   const [lblRes,   setLblRes]   = useState(null)
//   const [lblErr,   setLblErr]   = useState('')

//   // ── manual form state ─────────────────────────────────────
//   const [form, setForm] = useState({
//     name: '', category: 'custom', base_unit: 'g', base_amount: 100,
//     serving: '', cal: '', protein_g: '', fiber_g: '',
//     carbs_g: '', fat_g: '', gi: '', notes: ''
//   })

//   // pre-fill form when editing
//   useEffect(() => {
//     if (editFood) {
//       setForm({
//         name:        editFood.name,
//         category:    editFood.category,
//         base_unit:   editFood.base_unit   || 'g',
//         base_amount: editFood.base_amount || 100,
//         serving:     editFood.serving     || '',
//         cal:         editFood.cal,
//         protein_g:   editFood.protein_g,
//         fiber_g:     editFood.fiber_g,
//         carbs_g:     editFood.carbs_g,
//         fat_g:       editFood.fat_g,
//         gi:          editFood.gi          || '',
//         notes:       editFood.notes       || ''
//       })
//     }
//   }, [editFood])

//   const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
//   const F   = form

//   // ── label scan handlers ───────────────────────────────────
//   function handleLabelFile(e) {
//     const file = e.target.files[0]
//     if (!file) return
//     setLblFile(file)
//     setLblImg(URL.createObjectURL(file))
//     setLblRes(null)
//     setLblErr('')
//     e.target.value = ''
//   }

//   function handleLabelDrop(e) {
//     e.preventDefault()
//     e.currentTarget.style.borderColor = 'var(--border2)'
//     e.currentTarget.style.background  = 'var(--surface2)'
//     const file = e.dataTransfer.files[0]
//     if (file && file.type.startsWith('image/')) {
//       setLblFile(file)
//       setLblImg(URL.createObjectURL(file))
//       setLblRes(null)
//       setLblErr('')
//     }
//   }

//   async function scanLabel() {
//     if (!lblFile) return
//     setLblScan(true)
//     setLblErr('')
//     setLblRes(null)
//     try {
//       const b64 = await new Promise((res, rej) => {
//         const r = new FileReader()
//         r.onload  = () => res(r.result.split(',')[1])
//         r.onerror = rej
//         r.readAsDataURL(lblFile)
//       })
//       const data = await api.post('/scan', { imageBase64: b64, mediaType: lblFile.type || 'image/jpeg' })
//       setLblRes(data.result)
//       // auto-fill manual form
//       setForm(f => ({
//         ...f,
//         name:      data.result.name        || f.name,
//         serving:   data.result.serving_size|| f.serving,
//         cal:       data.result.calories    ?? f.cal,
//         protein_g: data.result.protein_g   ?? f.protein_g,
//         fiber_g:   data.result.fiber_g     ?? f.fiber_g,
//         carbs_g:   data.result.carbs_g     ?? f.carbs_g,
//         fat_g:     data.result.fat_g       ?? f.fat_g,
//         gi:        data.result.gi          || f.gi,
//         notes:     data.result.diabetic_note || f.notes,
//       }))
//     } catch (e) {
//       setLblErr(e.error || e.message || 'Could not read label. Try a clearer photo or enter manually.')
//     } finally {
//       setLblScan(false)
//     }
//   }

//   // ── save food to library ──────────────────────────────────
//   async function saveFood() {
//     if (!F.name.trim()) return alert('Food name is required')
//     setSaving(true)
//     try {
//       if (editFood) {
//         await api.put(`/foods/${editFood.id}`, F)
//         setMsg('Food updated!')
//       } else {
//         await api.post('/foods', F)
//         setMsg('Saved to library!')
//       }
//       setTimeout(() => navigate('/library'), 1200)
//     } catch (e) {
//       alert(e.error || 'Save failed')
//     } finally {
//       setSaving(false)
//     }
//   }

//   // ── shared input style ────────────────────────────────────
//   const inp = {
//     width:        '100%',
//     padding:      '0 11px',
//     height:        38,
//     border:       '1px solid var(--border2)',
//     borderRadius: 'var(--rs)',
//     fontSize:      13,
//     background:   'var(--surface)',
//     color:        'var(--text)',
//     fontFamily:   "'Sora',sans-serif",
//     outline:      'none',
//   }
//   const lbl = {
//     fontSize:      10,
//     fontWeight:    600,
//     color:        'var(--muted)',
//     display:      'block',
//     marginBottom:  3,
//     textTransform:'uppercase',
//     letterSpacing:'.4px',
//   }

//   return (
//     <div>
//       {msg && (
//         <div style={{
//           background: 'var(--green-l)', border: '1px solid var(--green-b)',
//           borderRadius: 'var(--rs)', padding: '10px 13px', fontSize: 12,
//           color: 'var(--green)', marginBottom: 12,
//         }}>
//           ✅ {msg}
//         </div>
//       )}

//       {/* ── Tab switcher ── */}
//       <div style={{
//         display:      'flex',
//         background:   'var(--surface)',
//         border:       '1px solid var(--border)',
//         borderRadius: 'var(--rl)',
//         overflow:     'hidden',
//         marginBottom:  14,
//       }}>
//         {TABS.map((t, i) => (
//           <button
//             key={t.key}
//             onClick={() => setTab(t.key)}
//             style={{
//               flex:           1,
//               padding:       '11px 6px',
//               fontSize:       12,
//               fontWeight:     tab === t.key ? 700 : 500,
//               border:        'none',
//               borderRight:    i < TABS.length - 1 ? '1px solid var(--border)' : 'none',
//               background:     tab === t.key ? 'var(--green)' : 'transparent',
//               color:          tab === t.key ? '#fff' : 'var(--muted)',
//               cursor:        'pointer',
//               fontFamily:    "'Sora',sans-serif",
//               transition:    'all .15s',
//               display:       'flex',
//               flexDirection: 'column',
//               alignItems:    'center',
//               gap:            3,
//             }}
//           >
//             <span style={{ fontSize: 16 }}>{t.label.split(' ')[0]}</span>
//             <span style={{ fontSize: 11 }}>{t.label.split(' ').slice(1).join(' ')}</span>
//           </button>
//         ))}
//       </div>

//       {/* ══════════════════════════════════
//            TAB 1 — PLATE SCAN
//       ══════════════════════════════════ */}
//       {tab === 'plate' && (
//         <PlateScan date={today()} onLogged={() => navigate('/')} />
//       )}

//       {/* ══════════════════════════════════
//            TAB 2 — LABEL SCAN
//       ══════════════════════════════════ */}
//       {tab === 'label' && (
//         <div style={{
//           background:   'var(--surface)',
//           border:       '1px solid var(--border)',
//           borderRadius: 'var(--rl)',
//           overflow:     'hidden',
//           marginBottom:  14,
//         }}>
//           <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
//             <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Scan nutrition label</div>
//             <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
//               Photograph the nutrition facts panel — AI fills in all values
//             </div>
//           </div>

//           <div style={{ padding: '14px 16px' }}>
//             {/* Upload zone */}
//             <div
//               style={{
//                 border:        '2px dashed var(--border2)',
//                 borderRadius:  'var(--rl)',
//                 padding:       '26px 20px',
//                 textAlign:     'center',
//                 cursor:        'pointer',
//                 background:    'var(--surface2)',
//                 marginBottom:   12,
//                 transition:    'all .2s',
//               }}
//               onClick={() => document.getElementById('lblInput').click()}
//               onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-l)' }}
//               onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' }}
//               onDrop={handleLabelDrop}
//             >
//               {lblImg ? (
//                 <img src={lblImg} alt="label" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 'var(--rs)' }} />
//               ) : (
//                 <>
//                   <div style={{ fontSize: 38, marginBottom: 8 }}>🏷️</div>
//                   <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
//                     Tap to upload nutrition label photo
//                   </div>
//                   <div style={{ fontSize: 11, color: 'var(--hint)' }}>
//                     Clear photo of just the nutrition panel works best
//                   </div>
//                 </>
//               )}
//             </div>
//             <input id="lblInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLabelFile} />

//             {/* Scan button */}
//             {lblFile && !lblScan && !lblRes && (
//               <button
//                 onClick={scanLabel}
//                 style={{
//                   width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700,
//                   background: 'var(--blue)', border: 'none', borderRadius: 'var(--rs)',
//                   color: '#fff', cursor: 'pointer', fontFamily: "'Sora',sans-serif",
//                   marginBottom: 10,
//                 }}
//               >
//                 🔍 Read label with AI
//               </button>
//             )}

//             {/* Scanning spinner */}
//             {lblScan && (
//               <div style={{ textAlign: 'center', padding: '16px 0' }}>
//                 <div className="spin" style={{ margin: '0 auto 8px' }} />
//                 <div style={{ fontSize: 13, color: 'var(--muted)' }}>Reading label with AI…</div>
//               </div>
//             )}

//             {/* Error */}
//             {lblErr && (
//               <div style={{
//                 padding: '10px 13px', background: 'var(--red-l)', border: '1px solid var(--red-b)',
//                 borderRadius: 'var(--rs)', fontSize: 12, color: 'var(--red)', marginBottom: 10,
//               }}>
//                 {lblErr}
//               </div>
//             )}

//             {/* Scanned result */}
//             {lblRes && (
//               <div style={{
//                 padding: '12px 14px', background: 'var(--green-l)', border: '1px solid var(--green-b)',
//                 borderRadius: 'var(--rs)', marginBottom: 12,
//               }}>
//                 <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
//                   ✅ Scanned — values filled below. Review and save.
//                 </div>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, textAlign: 'center' }}>
//                   {[
//                     { v: lblRes.calories,  l: 'kcal' },
//                     { v: lblRes.protein_g, l: 'prot g' },
//                     { v: lblRes.fiber_g,   l: 'fibre g' },
//                     { v: lblRes.carbs_g,   l: 'carbs g' },
//                     { v: lblRes.fat_g,     l: 'fat g' },
//                   ].map(m => (
//                     <div key={m.l}>
//                       <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: "'JetBrains Mono',monospace" }}>{m.v ?? 0}</div>
//                       <div style={{ fontSize: 9, color: 'var(--green)', opacity: .8, textTransform: 'uppercase', letterSpacing: '.4px', marginTop: 2 }}>{m.l}</div>
//                     </div>
//                   ))}
//                 </div>
//                 {lblRes.diabetic_note && (
//                   <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 8, fontStyle: 'italic', opacity: .85 }}>
//                     {lblRes.diabetic_note}
//                   </div>
//                 )}
//                 <button
//                   onClick={() => setTab('manual')}
//                   style={{
//                     marginTop: 10, width: '100%', padding: '8px 0', fontSize: 12, fontWeight: 600,
//                     background: 'var(--green)', border: 'none', borderRadius: 'var(--rs)',
//                     color: '#fff', cursor: 'pointer', fontFamily: "'Sora',sans-serif",
//                   }}
//                 >
//                   Edit &amp; save to library →
//                 </button>
//               </div>
//             )}

//             {/* Tips */}
//             <div style={{
//               padding: '9px 13px', background: 'var(--amber-l)', border: '1px solid var(--amber-b)',
//               borderRadius: 'var(--rs)', fontSize: 11, color: 'var(--amber)', lineHeight: 1.6,
//             }}>
//               <strong>Tips for best results:</strong> shoot in good light · crop to just the nutrition table · avoid shadows · hold phone still
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════════════════════
//            TAB 3 — MANUAL ENTRY
//       ══════════════════════════════════ */}
//       {tab === 'manual' && (
//         <div style={{
//           background:   'var(--surface)',
//           border:       '1px solid var(--border)',
//           borderRadius: 'var(--rl)',
//           padding:      '14px 16px',
//           marginBottom:  14,
//         }}>
//           <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
//             {editFood ? `Edit: ${editFood.name}` : 'Add food to library'}
//           </div>

//           {/* name */}
//           <div style={{ marginBottom: 9 }}>
//             <label style={lbl}>Food name *</label>
//             <input style={inp} value={F.name} onChange={set('name')} placeholder="e.g. Amul Paneer" />
//           </div>

//           {/* category + base unit */}
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
//             <div>
//               <label style={lbl}>Category</label>
//               <select style={inp} value={F.category} onChange={set('category')}>
//                 {['custom','dairy','legume','grain','veg','protein','fruit','snack','beverage'].map(c =>
//                   <option key={c} value={c}>{c}</option>
//                 )}
//               </select>
//             </div>
//             <div>
//               <label style={lbl}>Base unit</label>
//               <select style={inp} value={F.base_unit} onChange={set('base_unit')}>
//                 <option value="g">Per gram (g)</option>
//                 <option value="ml">Per ml</option>
//                 <option value="piece">Per piece</option>
//               </select>
//             </div>
//           </div>

//           {/* base amount + serving label */}
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
//             <div>
//               <label style={lbl}>Base amount (macros are for this)</label>
//               <input style={inp} type="number" value={F.base_amount} onChange={set('base_amount')} min="1" placeholder="100" />
//             </div>
//             <div>
//               <label style={lbl}>Serving label (display)</label>
//               <input style={inp} value={F.serving} onChange={set('serving')} placeholder="e.g. 1 cup / 100g" />
//             </div>
//           </div>

//           {/* macros row 1 */}
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
//             <div>
//               <label style={lbl}>Calories (kcal)</label>
//               <input style={inp} type="number" value={F.cal} onChange={set('cal')} min="0" step="0.1" placeholder="0" />
//             </div>
//             <div>
//               <label style={lbl}>Protein (g)</label>
//               <input style={inp} type="number" value={F.protein_g} onChange={set('protein_g')} min="0" step="0.1" placeholder="0" />
//             </div>
//           </div>

//           {/* macros row 2 */}
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
//             <div>
//               <label style={lbl}>Fibre (g)</label>
//               <input style={inp} type="number" value={F.fiber_g} onChange={set('fiber_g')} min="0" step="0.1" placeholder="0" />
//             </div>
//             <div>
//               <label style={lbl}>Net carbs (g)</label>
//               <input style={inp} type="number" value={F.carbs_g} onChange={set('carbs_g')} min="0" step="0.1" placeholder="0" />
//             </div>
//           </div>

//           {/* macros row 3 */}
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 9 }}>
//             <div>
//               <label style={lbl}>Fat (g)</label>
//               <input style={inp} type="number" value={F.fat_g} onChange={set('fat_g')} min="0" step="0.1" placeholder="0" />
//             </div>
//             <div>
//               <label style={lbl}>GI rating</label>
//               <select style={inp} value={F.gi} onChange={set('gi')}>
//                 <option value="">Unknown</option>
//                 <option value="low">Low GI</option>
//                 <option value="med">Medium GI</option>
//                 <option value="high">High GI</option>
//               </select>
//             </div>
//           </div>

//           {/* notes */}
//           <div style={{ marginBottom: 14 }}>
//             <label style={lbl}>Notes</label>
//             <textarea
//               value={F.notes}
//               onChange={set('notes')}
//               placeholder="e.g. diabetic-friendly, good protein source..."
//               style={{
//                 ...inp,
//                 height:  56,
//                 padding: '8px 11px',
//                 resize: 'vertical',
//               }}
//             />
//           </div>

//           <button
//             onClick={saveFood}
//             disabled={saving}
//             style={{
//               width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700,
//               background: saving ? 'var(--border)' : 'var(--green)',
//               border: 'none', borderRadius: 'var(--rs)',
//               color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
//               fontFamily: "'Sora',sans-serif",
//             }}
//           >
//             {saving ? 'Saving…' : editFood ? '✓ Update food' : '+ Save to library'}
//           </button>
//         </div>
//       )}
//     </div>
//   )
// }

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'
import UpgradeModal from '../components/UpgradeModal'
import { today } from '../utils/calc'
import PageHero from '../components/PageHero'

// ── tabs ─────────────────────────────────────────────
const TABS = [
  { key: 'barcode',  label: 'Barcode',        desc: 'Scan or type barcode → save to library' },
  { key: 'label',    label: 'Label',          desc: 'Photo of nutrition panel → save to library' },
  { key: 'estimate', label: 'AI estimate',    desc: 'Type food name → get nutrition' },
  { key: 'manual',   label: 'Manual add',     desc: 'Enter nutrition yourself' },
]

const NUTRITION_FIELDS = ['cal', 'protein_g', 'fiber_g', 'carbs_g', 'fat_g']
const MISSING_NUTRITION_MESSAGE = 'Add all before saving. Use AI estimate if you do not know the values.'
const EMPTY_FORM = {
  name: '',
  category: 'custom',
  base_unit: 'g',
  base_amount: 100,
  serving: '',
  cal: '',
  protein_g: '',
  fiber_g: '',
  carbs_g: '',
  fat_g: '',
  gi: '',
  notes: ''
}

function hasCompleteNutrition(food) {
  return NUTRITION_FIELDS.every(key => {
    const value = food[key]
    return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0
  })
}

// ── BARCODE SCANNER COMPONENT ──────────────────────────
function BarcodeScanner({ onSaveToLibrary, saving }) {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  // Build product display name
  const productDisplayName = useMemo(() => {
    if (!product) return '';
    const name = product.product_name || product.name || product.food?.name || '';
    const brand = product.brands || product.brand || '';
    let displayName = name;

    if (!displayName && brand) {
      displayName = brand;
    } else if (brand && displayName && !displayName.toLowerCase().includes(brand.toLowerCase())) {
      displayName = `${brand} - ${displayName}`;
    }
    if (!displayName) {
      displayName = 'Product';
    }
    return displayName;
  }, [product])

  async function lookup(code = barcode) {
    const clean = String(code || '').replace(/\D/g, '')
    if (!clean) return
    setLoading(true)
    setError('')
    setProduct(null)
    try {
      const data = await api.get(`/barcode/${clean}`)
      setBarcode(clean)
      setProduct(data.product)
    } catch (e) {
      if (e.upgrade_required) { setShowUpgrade(true); return }
      setError(e.error || 'Product not found')
    } finally {
      setLoading(false)
    }
  }

  async function handleBarcodeImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!('BarcodeDetector' in window)) {
      setError('Barcode scanning not supported. Type the number instead.')
      return
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
      const image = await createImageBitmap(file)
      const codes = await detector.detect(image)
      if (!codes.length) return setError('No barcode detected')
      lookup(codes[0].rawValue)
    } catch {
      setError('Could not scan barcode')
    }
  }

  async function saveFromBarcode() {
    if (!product?.food) return

    // Create food object with computed display name
    const foodToSave = {
      ...product.food,
      name: productDisplayName
    };

    await onSaveToLibrary(foodToSave)
    setProduct(null)
    setBarcode('')
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--rl)',
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      {showUpgrade && <UpgradeModal feature="barcode" onClose={() => setShowUpgrade(false)} />}

      {/* Header */}
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
          background: 'var(--green-l)',
          border: '1px solid var(--green-b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 18,
        }}>
          📦
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>
            Barcode scanner
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>
            Scan or type the barcode number for instant verified nutrition data.
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>
            Barcode number
          </div>
          <input
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="e.g. 8901234567890"
            onKeyDown={e => e.key === 'Enter' && lookup()}
            style={{
              width: '100%',
              minHeight: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid var(--border2)',
              borderRadius: 'var(--rs)',
              background: 'var(--surface)',
              fontFamily: "'Sora', sans-serif",
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: product ? 16 : 0 }}>
          <button className="btn btn-green" onClick={() => lookup()} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Looking up...' : 'Look up'}
          </button>
          <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0, flex: 1 }}>
            📷 Scan photo
            <input type="file" accept="image/*" capture="environment" onChange={handleBarcodeImage} style={{ display: 'none' }} />
          </label>
        </div>

        {product && (
          <div style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--rs)',
            padding: 14,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text)' }}>
              {productDisplayName}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12, marginBottom: 12 }}>
              <div><strong>Calories:</strong> {product.food?.cal || 0}</div>
              <div><strong>Protein:</strong> {product.food?.protein_g || 0}g</div>
              <div><strong>Carbs:</strong> {product.food?.carbs_g || 0}g</div>
              <div><strong>Fat:</strong> {product.food?.fat_g || 0}g</div>
              <div><strong>Fiber:</strong> {product.food?.fiber_g || 0}g</div>
              <div><strong>Serving:</strong> {product.food?.serving || '100g'}</div>
            </div>
            <button className="btn btn-green" onClick={saveFromBarcode} disabled={saving} style={{ width: '100%' }}>
              {saving ? 'Saving...' : 'Save to library'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── LABEL SCANNER COMPONENT ──────────────────────────
function LabelScanner({ onSaveToLibrary, saving }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  function handleFileInput(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) {
      setError('Please choose a valid image file')
      return
    }
    setImgSrc(URL.createObjectURL(file))
    setResult(null)
    setError('')
    scanLabel(file)
  }

  async function scanLabel(file) {
    setScanning(true)
    setError('')
    setResult(null)
    try {
      const reader = new FileReader()
      const imageBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const data = await api.post('/scan', { imageBase64, mediaType: file.type || 'image/jpeg' })
      setResult(data.result)
    } catch (e) {
      if (e.upgrade_required) { setShowUpgrade(true); return }
      setError(e.error || 'Could not read label')
    } finally {
      setScanning(false)
    }
  }

  async function saveFromLabel() {
    if (!result) return
    const food = {
      name: result.name || '',
      category: 'custom',
      base_unit: 'g',
      base_amount: 100,
      serving: result.serving_size || '100g',
      cal: Number(result.calories) || 0,
      protein_g: Number(result.protein_g) || 0,
      fiber_g: Number(result.fiber_g) || 0,
      carbs_g: Number(result.carbs_g) || 0,
      fat_g: Number(result.fat_g) || 0,
      gi: result.gi || 'unknown',
      notes: result.diabetic_note || '',
    }
    await onSaveToLibrary(food)
    setImgSrc(null)
    setResult(null)
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--rl)',
      overflow: 'hidden',
      marginBottom: 14,
    }}>
      {showUpgrade && <UpgradeModal feature="label-scan" onClose={() => setShowUpgrade(false)} />}

      {/* Header */}
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
          background: 'var(--green-l)',
          border: '1px solid var(--green-b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 18,
        }}>
          📋
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)' }}>
            Nutrition label scanner
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>
            Take a photo of the nutrition facts panel. AI will read the values.
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}

        {/* Photo upload zone */}
        {!imgSrc ? (
          <>
            <div
              style={{
                border: '2px dashed var(--border2)',
                borderRadius: 'var(--rl)',
                padding: '28px 20px',
                textAlign: 'center',
                background: 'var(--surface2)',
                transition: 'all .2s',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                Capture or choose nutrition label photo
              </div>
              <div style={{ fontSize: 11, color: 'var(--hint)', marginBottom: 12 }}>
                Works best with clear, well-lit photos
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <label className="btn btn-green" style={{ cursor: 'pointer', margin: 0, flex: 1 }}>
                🖼️ Choose photo
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: 'none' }} />
              </label>
              <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0, flex: 1 }}>
                📷 Take photo
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} style={{ display: 'none' }} />
              </label>
            </div>
          </>
        ) : (
          <>
            <div style={{ position: 'relative', marginBottom: scanning || result ? 16 : 0 }}>
              <img src={imgSrc} alt="Label preview" style={{ width: '100%', borderRadius: 'var(--rs)', display: 'block' }} />
              <button
                onClick={() => { setImgSrc(null); setResult(null); setError('') }}
                className="btn btn-ghost btn-compact"
                style={{ position: 'absolute', top: 8, right: 8 }}
              >
                ✕ Clear
              </button>
            </div>

            {scanning && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
                Reading nutrition label...
              </div>
            )}

            {result && (
              <div style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--rs)',
                padding: 14,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>
                  Extracted nutrition
                </div>
                <div style={{ display: 'grid', gap: 6, fontSize: 12, marginBottom: 12 }}>
                  <div><strong>Name:</strong> {result.name || 'Not detected'}</div>
                  <div><strong>Serving:</strong> {result.serving_size || 'Not detected'}</div>
                  <div><strong>Calories:</strong> {result.calories || 0}</div>
                  <div><strong>Protein:</strong> {result.protein_g || 0}g</div>
                  <div><strong>Carbs:</strong> {result.carbs_g || 0}g</div>
                  <div><strong>Fiber:</strong> {result.fiber_g || 0}g</div>
                </div>
                <button className="btn btn-green" onClick={saveFromLabel} disabled={saving} style={{ width: '100%' }}>
                  {saving ? 'Saving...' : 'Save to library'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function ScanAdd() {
  const navigate = useNavigate()
  const location = useLocation()
  const editFood = location.state?.edit || null

  const [tab, setTab] = useState(editFood ? 'manual' : 'barcode')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [estimateServing, setEstimateServing] = useState('')
  const [estimateMeta, setEstimateMeta] = useState(null)
  const [estimateErr, setEstimateErr] = useState('')
  const [estimating, setEstimating] = useState(false)
  const [formErr, setFormErr] = useState('')
  const [labelScanKey, setLabelScanKey] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('scan')

  // ── form ───────────────────────────────────────────
  const [form, setForm] = useState({ ...EMPTY_FORM })

  // ── edit prefill ───────────────────────────────────
  useEffect(() => {
    if (editFood) {
      setForm({
        name: editFood.name,
        category: editFood.category,
        base_unit: editFood.base_unit || 'g',
        base_amount: editFood.base_amount || 100,
        serving: editFood.serving || '',
        cal: editFood.cal,
        protein_g: editFood.protein_g,
        fiber_g: editFood.fiber_g,
        carbs_g: editFood.carbs_g,
        fat_g: editFood.fat_g,
        gi: editFood.gi || '',
        notes: editFood.notes || ''
      })
    }
  }, [editFood])

  const set = (k) => (e) => {
    setFormErr('')
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  function switchScanTab(nextTab) {
    setFormErr('')
    setEstimateErr('')
    setMsg('')
    setTab(nextTab)
  }

  const setEstimateName = (e) => {
    setFormErr('')
    setEstimateErr('')
    setEstimateMeta(null)
    setForm((f) => ({
      ...f,
      name: e.target.value,
      serving: '',
      cal: '',
      protein_g: '',
      fiber_g: '',
      carbs_g: '',
      fat_g: '',
      gi: '',
      notes: '',
    }))
  }

  const setEstimatePortion = (e) => {
    setEstimateErr('')
    setEstimateMeta(null)
    setEstimateServing(e.target.value)
    setForm((f) => ({
      ...f,
      serving: '',
      cal: '',
      protein_g: '',
      fiber_g: '',
      carbs_g: '',
      fat_g: '',
      gi: '',
      notes: '',
    }))
  }

  const F = form

  // ── LABEL SCAN RESULT HANDLER ─────────────────────
  const handleLabelResult = (result) => {
    setForm((f) => ({
      ...f,
      name: result.name || f.name,
      serving: result.serving_size || f.serving,
      cal: result.calories ?? f.cal,
      protein_g: result.protein_g ?? f.protein_g,
      fiber_g: result.fiber_g ?? f.fiber_g,
      carbs_g: result.carbs_g ?? f.carbs_g,
      fat_g: result.fat_g ?? f.fat_g,
      gi: result.gi || f.gi,
      notes: result.diabetic_note || f.notes,
    }))
    setEstimateMeta(null)
  }

  function foodFromLabelResult(result) {
    if (!result) return F
    return {
      ...F,
      name: result.name || F.name,
      serving: result.serving || result.serving_size || F.serving,
      cal: result.cal ?? result.calories ?? F.cal,
      protein_g: result.protein_g ?? F.protein_g,
      fiber_g: result.fiber_g ?? F.fiber_g,
      carbs_g: result.carbs_g ?? F.carbs_g,
      fat_g: result.fat_g ?? F.fat_g,
      gi: result.gi || F.gi,
      notes: result.notes || result.diabetic_note || F.notes,
    }
  }

  function resetFoodCapture() {
    setForm({ ...EMPTY_FORM })
    setEstimateServing('')
    setEstimateMeta(null)
    setEstimateErr('')
    setFormErr('')
    setLabelScanKey(key => key + 1)
  }

  // ── AI ESTIMATE HANDLER ───────────────────────────
  async function estimateFood() {
    const name = F.name.trim()
    setEstimateErr('')
    setMsg('')

    if (!name) {
      setEstimateErr('Enter a food name first.')
      return
    }

    setForm((f) => ({
      ...f,
      serving: '',
      cal: '',
      protein_g: '',
      fiber_g: '',
      carbs_g: '',
      fat_g: '',
      gi: '',
      notes: '',
    }))
    setEstimating(true)
    try {
      const data = await api.post('/foods/estimate', {
        name,
        serving: estimateServing,
        categoryHint: F.category,
      })
      const estimatedFood = data.food || {}
      setForm((f) => ({
        ...f,
        ...estimatedFood,
        name: estimatedFood.name || f.name,
        notes: f.notes || 'Estimated nutrition from food name. Review before relying on it.',
      }))
      setEstimateMeta({
        provider: data.provider,
        confidence: data.confidence,
        assumptions: data.assumptions || [],
      })
    } catch (e) {
      if (e.upgrade_required) {
        setUpgradeFeature(e.feature || 'scan')
        setShowUpgrade(true)
        return
      }
      setEstimateErr(e.error || e.message || 'Could not estimate nutrition.')
    } finally {
      setEstimating(false)
    }
  }

  // ── SAVE ───────────────────────────────────────────
  async function saveFood(sourceOverride) {
    const source = sourceOverride?.preventDefault ? F : foodFromLabelResult(sourceOverride)
    setFormErr('')
    if (!source.name.trim()) {
      setFormErr('Food name is required.')
      return false
    }
    if (!hasCompleteNutrition(source)) {
      setFormErr(MISSING_NUTRITION_MESSAGE)
      return false
    }

    setSaving(true)
    try {
      const estimateNote = estimateMeta
        ? `Estimated nutrition from food name. Provider: ${estimateMeta.provider || 'unknown'}. Confidence: ${estimateMeta.confidence || 'unknown'}. Review before relying on it.`
        : ''
      const payload = {
        ...source,
        name: source.name.trim(),
        category: source.category || 'custom',
        base_unit: source.base_unit || 'g',
        base_amount: Number(source.base_amount) || 100,
        serving: source.serving || `${Number(source.base_amount) || 100}${source.base_unit || 'g'}`,
        cal: Number(source.cal) || 0,
        protein_g: Number(source.protein_g) || 0,
        fiber_g: Number(source.fiber_g) || 0,
        carbs_g: Number(source.carbs_g) || 0,
        fat_g: Number(source.fat_g) || 0,
        gi: source.gi || 'unknown',
        notes: [source.notes, estimateNote].filter(Boolean).join(' '),
      }

      if (editFood) {
        await api.put(`/foods/${editFood.id}`, payload)
        setMsg('Food updated!')
        setTimeout(() => navigate('/library'), 1200)
      } else {
        await api.post('/foods', payload)
        resetFoodCapture()
        setMsg('Saved to library!')
      }
      return true
    } catch (e) {
      setFormErr(e.error || 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  // ── styles ─────────────────────────────────────────
  const inp = {
    width: '100%',
    padding: '0 11px',
    height: 38,
    border: '1px solid var(--border2)',
    borderRadius: 'var(--rs)',
    fontSize: 13,
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: "'Sora',sans-serif",
    outline: 'none',
  }

  const lbl = {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--muted)',
    display: 'block',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: '.4px',
  }

  return (
    <div>
      {showUpgrade && <UpgradeModal feature={upgradeFeature} onClose={() => setShowUpgrade(false)} />}

      <PageHero
        eyebrow="Add food"
        title={editFood ? 'Update food details.' : 'Build your food library.'}
        copy="Scan a barcode, read a nutrition label, estimate by food name, or add food manually."
        metric="AI"
        metricLabel="food library"
      />

      {msg && <div className="success-box">{msg}</div>}
      {formErr && (
        <div className="error-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span>{formErr}</span>
          {tab !== 'estimate' && (
            <button className="btn btn-ghost btn-compact" type="button" onClick={() => switchScanTab('estimate')}>
              AI estimate
            </button>
          )}
        </div>
      )}

      {/* ── tabs ── */}
      <div className="scan-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => switchScanTab(t.key)}
            className={`scan-tab${tab === t.key ? ' active' : ''}`}
          >
            <span className="scan-tab-label">{t.label}</span>
            <span className="scan-tab-desc">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* ── BARCODE ─────────────────────────────── */}
      {tab === 'barcode' && (
        <BarcodeScanner onSaveToLibrary={saveFood} saving={saving} />
      )}

      {/* ── LABEL ─────────────────────────────── */}
      {tab === 'label' && (
        <LabelScanner onSaveToLibrary={saveFood} saving={saving} />
      )}

      {/* ── AI ESTIMATE ────────────────────────────── */}
      {tab === 'estimate' && (
        <div className="card">
          <div className="card-title">AI nutrition estimate</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 12 }}>
            Use this when the user knows the food name but does not know the nutrition values. AI estimates a practical serving, then you can review and save it to the food library.
          </div>

          {estimateErr && <div className="error-box">{estimateErr}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label>Food name</label>
              <input value={F.name} onChange={setEstimateName} placeholder="e.g. Paneer bhurji, chicken curry, avocado toast" />
            </div>
            <div className="form-group">
              <label>Portion hint</label>
              <input value={estimateServing} onChange={setEstimatePortion} placeholder="e.g. 1 bowl approx 250g, 2 pieces, 100g" />
            </div>
          </div>

          <div className="estimate-action-row" style={{ marginBottom: estimateMeta ? 12 : 0 }}>
            <button
              className={estimateMeta ? 'btn btn-ghost' : 'btn btn-green'}
              type="button"
              onClick={estimateFood}
              disabled={estimating || !!estimateMeta}
            >
              {estimating ? 'Extracting...' : estimateMeta ? 'Nutrition extracted' : 'Extract nutrition'}
            </button>
            {estimateMeta && (
              <>
                <button className="btn btn-blue" type="button" onClick={() => switchScanTab('manual')}>
                  Edit values
                </button>
                <button className="btn btn-green" type="button" onClick={saveFood} disabled={saving}>
                  {saving ? 'Saving...' : 'Save to library'}
                </button>
              </>
            )}
          </div>

          {estimateMeta && (
            <div className="estimate-result-card">
              <div className="estimate-result-head">
                <span>Estimated nutrition</span>
                <strong>{estimateMeta.confidence || 'medium'} confidence</strong>
              </div>
              <div className="estimate-serving-line">
                <span>Serving used</span>
                <strong>{F.serving || `${F.base_amount}${F.base_unit}`}</strong>
              </div>
              <div className="estimate-macro-grid">
                <div><span>Calories</span><strong>{F.cal || 0}</strong></div>
                <div><span>Protein</span><strong>{F.protein_g || 0}g</strong></div>
                <div><span>Carbs</span><strong>{F.carbs_g || 0}g</strong></div>
                <div><span>Fat</span><strong>{F.fat_g || 0}g</strong></div>
                <div><span>Fiber</span><strong>{F.fiber_g || 0}g</strong></div>
              </div>
              <div className="estimate-review-note">
                Review before saving. Home recipes, oil, brand, and portion size can change the numbers.
              </div>
              {estimateMeta.assumptions?.length > 0 && (
                <ul className="estimate-assumptions">
                  {estimateMeta.assumptions.map(item => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL ENTRY ───────────────────────────── */}
      {tab === 'manual' && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--rl)',
          padding: 14,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            {editFood ? `Edit: ${editFood.name}` : 'Add food'}
          </div>

          <label style={lbl}>Food name</label>
          <input style={inp} value={F.name} onChange={set('name')} />

          <div style={{ height: 10 }} />

          <label style={lbl}>Calories</label>
          <input style={inp} value={F.cal} onChange={set('cal')} />

          <div style={{ height: 10 }} />

          <label style={lbl}>Protein</label>
          <input style={inp} value={F.protein_g} onChange={set('protein_g')} />

          <div style={{ height: 10 }} />

          <label style={lbl}>Carbs</label>
          <input style={inp} value={F.carbs_g} onChange={set('carbs_g')} />

          <div style={{ height: 10 }} />

          <label style={lbl}>Fat</label>
          <input style={inp} value={F.fat_g} onChange={set('fat_g')} />

          <div style={{ height: 10 }} />

          <label style={lbl}>Fiber</label>
          <input style={inp} value={F.fiber_g} onChange={set('fiber_g')} />

          <div style={{ height: 14 }} />

          <button
            onClick={saveFood}
            disabled={saving}
            style={{
              width: '100%',
              padding: 11,
              background: 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            {saving ? 'Saving…' : editFood ? 'Update' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
