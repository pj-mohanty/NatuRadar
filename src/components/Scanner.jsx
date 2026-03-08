import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { identifySpecies } from '../services/inatAPI'

const BRACKETS = [
  { top: 10, left: 10, borderTop: '2px solid #fbbf24', borderLeft: '2px solid #fbbf24' },
  { top: 10, right: 10, borderTop: '2px solid #fbbf24', borderRight: '2px solid #fbbf24' },
  { bottom: 10, left: 10, borderBottom: '2px solid #fbbf24', borderLeft: '2px solid #fbbf24' },
  { bottom: 10, right: 10, borderBottom: '2px solid #fbbf24', borderRight: '2px solid #fbbf24' },
]

export default function Scanner({ onResult }) {
  const fileInput = useRef(null)
  const galleryInput = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null) // base64 of selected image
  const [webcamActive, setWebcamActive] = useState(false)
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  // Converts any image file to a JPEG data URL via canvas.
  // Ensures consistent format for iNat identify and Cloudinary upload.
  const toJpeg = (dataUrl) => new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = dataUrl
  })

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const jpeg = await toJpeg(ev.target.result)
        setPreview(jpeg)
        setScanning(true)
        const result = await identifySpecies(jpeg)
        if (result) onResult(result, jpeg)
        else setError('Could not identify — try a clearer photo')
      } catch (err) {
        setError(err.message || 'Failed to process image')
      } finally {
        setScanning(false)
        e.target.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      setWebcamActive(true)
    } catch {
      setError('Camera access denied or unavailable')
    }
  }

  const captureFrame = async () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const jpeg = canvas.toDataURL('image/jpeg', 0.85)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setWebcamActive(false)
    setError(null)
    try {
      setPreview(jpeg)
      setScanning(true)
      const result = await identifySpecies(jpeg)
      if (result) onResult(result, jpeg)
      else setError('Could not identify — try a clearer photo')
    } catch (err) {
      setError(err.message || 'Failed to process image')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Camera input — forces native camera on mobile */}
      <input ref={fileInput} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
      {/* Gallery input — opens file/photo picker */}
      <input ref={galleryInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {/* Viewport */}
      <div style={{
        position: 'relative', width: '100%', paddingBottom: '72%',
        background: '#020a06', overflow: 'hidden', borderRadius: 3,
        border: '1px solid rgba(52,211,153,0.12)',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>

          {/* Grid background */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(52,211,153,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          {/* Live webcam stream (desktop only) — always mounted so videoRef is never null */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: webcamActive ? 'block' : 'none' }}
          />

          {/* Preview or standby */}
          {preview ? (
            <img
              src={preview}
              alt="captured"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: scanning ? 0.5 : 0.88 }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[50, 80, 115].map((size, i) => (
                <motion.div key={i} style={{
                  position: 'absolute',
                  width: size, height: size,
                  border: `1px solid rgba(52,211,153,${0.35 - i * 0.08})`,
                  borderRadius: '50%',
                }} animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }} />
              ))}
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 38, filter: 'drop-shadow(0 0 10px #34d399)', zIndex: 1 }}
              >
                🌿
              </motion.div>
            </div>
          )}

          {/* Scan line */}
          <motion.div style={{
            position: 'absolute', left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.2) 15%, #34d399 50%, rgba(52,211,153,0.2) 85%, transparent 100%)',
            boxShadow: '0 0 6px #34d399, 0 0 18px rgba(52,211,153,0.35)',
          }}
            animate={{ top: ['8%', '92%', '8%'] }}
            transition={{ duration: scanning ? 0.9 : 2.8, repeat: Infinity, ease: 'linear' }}
          />

          {/* Pulse rings on scan */}
          <AnimatePresence>
            {scanning && [0, 0.45, 0.9].map((delay, i) => (
              <motion.div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 56, height: 56, marginLeft: -28, marginTop: -28,
                borderRadius: '50%', border: '2px solid #34d399', pointerEvents: 'none',
              }}
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 4.2, opacity: 0 }}
                transition={{ duration: 1.6, delay, repeat: Infinity }}
              />
            ))}
          </AnimatePresence>

          {/* Corner brackets */}
          {BRACKETS.map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 18, height: 18, ...style }} />
          ))}

          {/* Status label */}
          <div style={{
            position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center',
            fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
            color: scanning ? '#34d399' : 'rgba(52,211,153,0.35)',
            fontWeight: 600,
          }}>
            {scanning ? 'ANALYZING...' : preview ? 'READY' : 'STANDBY'}
          </div>

          {/* Top-left label */}
          <div style={{
            position: 'absolute', top: 8, left: 12,
            fontSize: 8, letterSpacing: 2, color: 'rgba(52,211,153,0.4)',
            textTransform: 'uppercase', fontWeight: 600,
          }}>
            SPECIES SCANNER
          </div>
        </div>
      </div>

      {/* Two buttons — camera and gallery */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => isMobile ? fileInput.current?.click() : (webcamActive ? captureFrame() : startWebcam())}
          disabled={scanning}
          style={{
            flex: 1, padding: '11px 0',
            background: scanning ? 'rgba(52,211,153,0.08)' : 'transparent',
            border: '1px solid #34d399', color: '#34d399',
            fontWeight: 700, fontSize: 12, letterSpacing: 2,
            textTransform: 'uppercase', cursor: scanning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            borderRadius: 2, opacity: scanning ? 0.4 : 1,
          }}
        >
          <span>{scanning ? '⟳' : '📷'}</span>
          {scanning ? 'SCANNING...' : webcamActive ? 'CAPTURE' : 'TAKE PHOTO'}
        </button>
        <button
          onClick={() => galleryInput.current?.click()}
          disabled={scanning}
          style={{
            flex: 1, padding: '11px 0',
            background: 'transparent',
            border: '1px solid rgba(52,211,153,0.4)', color: 'rgba(52,211,153,0.7)',
            fontWeight: 700, fontSize: 12, letterSpacing: 2,
            textTransform: 'uppercase', cursor: scanning ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            borderRadius: 2, opacity: scanning ? 0.4 : 1,
          }}
        >
          <span>📁</span> UPLOAD
        </button>
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  )
}
