'use client'

import { useState, useEffect, useCallback, useRef, useTransition } from 'react'
import { agregarPorEscaneo, entregarPorEscaneo } from '../actions'

type Vista = 'cocineras' | 'accion' | 'agregar' | 'entrega'

export type CocineraResumen = {
  id: number
  name: string
  doc: number | null
  totalTipos: number
  totalUnidades: number
}

type ToastInfo = { tipo: 'ok' | 'error'; msg: string } | null
type ItemHistorial = { nombre: string; modo: 'agregar' | 'entrega' }

// Formatear cédula con separadores de miles
function formatearDoc(doc: number | null) {
  if (!doc) return null
  return doc.toLocaleString('es-CO')
}

export default function VistaInventarios({ cocineras }: { cocineras: CocineraResumen[] }) {
  const [vista, setVista] = useState<Vista>('cocineras')
  const [cocineraActiva, setCocineraActiva] = useState<CocineraResumen | null>(null)

  // Búsqueda y voz
  const [busqueda, setBusqueda] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const [errorVoz, setErrorVoz] = useState<string | null>(null)
  const [sinSoporte, setSinSoporte] = useState(false)

  // Escáner: feedback y sesión
  const [toast, setToast] = useState<ToastInfo>(null)
  const [historial, setHistorial] = useState<ItemHistorial[]>([])
  const [isPending, startTransition] = useTransition()

  // Cámara
  const [camaraAbierta, setCamaraAbierta] = useState(false)
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [camaras, setCamaras] = useState<{ deviceId: string; label: string }[]>([])
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const ultimoSKURef = useRef('')

  // Ref con la función de procesar siempre actualizada (captura vista y cocineraActiva frescos)
  const procesarRef = useRef<(codigo: string) => void>(() => {})

  // Reconocimiento de voz para buscar cocineras
  const iniciarVoz = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSinSoporte(true); return }
    setErrorVoz(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR()
    rec.lang = 'es-CO'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setEscuchando(true)
    rec.onend = () => setEscuchando(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setEscuchando(false)
      if (e.error === 'not-allowed') setErrorVoz('Permiso de micrófono denegado. Actívalo en configuración.')
      else if (e.error === 'no-speech') setErrorVoz('No se detectó voz. Intenta de nuevo.')
      setTimeout(() => setErrorVoz(null), 4000)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => setBusqueda(e.results[0][0].transcript.trim())
    try { rec.start() } catch { setEscuchando(false) }
  }, [])

  const mostrarToast = useCallback((tipo: 'ok' | 'error', msg: string) => {
    setToast({ tipo, msg })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Procesar código escaneado según el modo activo
  const procesarEscaneo = useCallback((codigo: string, modo: 'agregar' | 'entrega', cocinera: CocineraResumen) => {
    const skuNum = parseInt(codigo.replace(/\D/g, ''))
    if (!skuNum) { mostrarToast('error', 'Código no válido.'); return }

    startTransition(async () => {
      const resultado = modo === 'agregar'
        ? await agregarPorEscaneo(cocinera.id, skuNum)
        : await entregarPorEscaneo(cocinera.id, skuNum)

      if (resultado?.exito) {
        mostrarToast('ok', resultado.exito)
        if (resultado.utensilio) {
          setHistorial(prev => [
            { nombre: resultado.utensilio!, modo },
            ...prev.slice(0, 9),
          ])
        }
      } else if (resultado?.error) {
        mostrarToast('error', resultado.error)
      }
    })
  }, [mostrarToast])

  // Actualizar ref en cada render para que el listener siempre use valores frescos
  useEffect(() => {
    if (!cocineraActiva) return
    const modoActual = vista as 'agregar' | 'entrega'
    procesarRef.current = (codigo: string) => procesarEscaneo(codigo, modoActual, cocineraActiva)
  })

  // Escáner hardware: detecta ráfaga de teclas < 120ms del lector USB/Bluetooth
  useEffect(() => {
    if (vista !== 'agregar' && vista !== 'entrega') return
    const buf = { chars: '', lastMs: 0 }
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const now = Date.now()
      if (e.key === 'Enter') {
        if (buf.chars.length > 2) procesarRef.current(buf.chars)
        buf.chars = ''
        return
      }
      if (now - buf.lastMs > 120) buf.chars = ''
      buf.lastMs = now
      if (e.key.length === 1) buf.chars += e.key
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [vista])

  // Iniciar cámara con ZXing
  const iniciarCamara = useCallback(async () => {
    if (!videoRef.current) return
    setErrorCamara(null)
    try {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ])
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)
      const reader = new BrowserMultiFormatReader(hints)
      const dispositivos = await BrowserMultiFormatReader.listVideoInputDevices()
      setCamaras(dispositivos.map(d => ({
        deviceId: d.deviceId,
        label: d.label || `Cámara ${d.deviceId.slice(0, 6)}`,
      })))
      const trasera = dispositivos.find(d => /back|rear|trasera|environment/i.test(d.label))
      const idCamara = camaraSeleccionada ?? trasera?.deviceId ?? dispositivos[0]?.deviceId
      const controls = await reader.decodeFromVideoDevice(idCamara, videoRef.current, (result) => {
        if (!result) return
        const texto = result.getText()
        if (texto === ultimoSKURef.current) return
        ultimoSKURef.current = texto
        procesarRef.current(texto)
        setTimeout(() => { ultimoSKURef.current = '' }, 4000)
      })
      controlsRef.current = controls
      setCamaraActiva(true)
    } catch {
      setErrorCamara('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
      setCamaraActiva(false)
    }
  }, [camaraSeleccionada])

  const detenerCamara = useCallback(() => {
    controlsRef.current?.stop?.()
    controlsRef.current = null
    setCamaraActiva(false)
    ultimoSKURef.current = ''
  }, [])

  useEffect(() => {
    if (camaraAbierta) iniciarCamara()
    return () => { detenerCamara() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camaraAbierta, camaraSeleccionada])

  // Navegación entre vistas
  const irAAccion = (cocinera: CocineraResumen) => {
    setCocineraActiva(cocinera)
    setVista('accion')
    setHistorial([])
    setToast(null)
  }

  const irAModo = (modo: 'agregar' | 'entrega') => {
    setHistorial([])
    setToast(null)
    setVista(modo)
  }

  const volverAAccion = () => {
    setCamaraAbierta(false)
    setToast(null)
    setHistorial([])
    setVista('accion')
  }

  const volverACocineras = () => {
    setCamaraAbierta(false)
    setCocineraActiva(null)
    setToast(null)
    setHistorial([])
    setVista('cocineras')
  }

  const cocinerasFiltradas = cocineras.filter(c =>
    busqueda === '' ||
    c.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.doc?.toString().includes(busqueda)
  )

  const esAgregar = vista === 'agregar'
  const esEntrega = vista === 'entrega'

  // ─── VISTA: Lista de cocineras ────────────────────────────────────────────────
  if (vista === 'cocineras') return (
    <div>
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <p className="text-on-surface font-bold text-2xl">{cocineras.length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Total</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20 text-center">
          <p className="text-primary font-bold text-2xl">{cocineras.filter(c => c.totalTipos > 0).length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Con utensilios</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-secondary/20 text-center">
          <p className="text-secondary font-bold text-2xl">{cocineras.filter(c => c.totalTipos === 0).length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Sin asignar</p>
        </div>
      </div>

      {/* Buscador + voz */}
      <div className="mb-5 relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={escuchando ? 'Escuchando...' : 'Buscar por nombre o cédula...'}
          className={`w-full pl-11 pr-20 py-3 rounded-xl border text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 transition-all bg-surface-container-lowest ${
            escuchando
              ? 'border-primary ring-2 ring-primary/20 placeholder:text-primary'
              : 'border-outline-variant focus:ring-primary focus:border-primary'
          }`}
        />
        {busqueda && !escuchando && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute right-11 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
        <button
          onClick={iniciarVoz}
          disabled={escuchando}
          title={sinSoporte ? 'Tu navegador no soporta reconocimiento de voz' : 'Buscar por voz'}
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
            escuchando
              ? 'text-primary bg-primary/10 animate-pulse cursor-default'
              : sinSoporte
              ? 'text-outline/40 cursor-not-allowed'
              : 'text-outline hover:text-primary hover:bg-primary/10'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] icon-fill">mic</span>
        </button>
      </div>

      {/* Animación escucha activa */}
      {escuchando && (
        <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-xl bg-primary/8 border border-primary/20">
          <div className="flex gap-0.5 items-end h-4">
            {[2, 4, 3, 5, 2].map((h, i) => (
              <div key={i} className="w-1 bg-primary rounded-full animate-pulse" style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <span className="text-primary text-xs font-semibold">Di el nombre de la cocinera...</span>
        </div>
      )}

      {errorVoz && (
        <div className="flex items-start gap-2 mb-4 py-2.5 px-4 rounded-xl bg-error-container border border-error/20">
          <span className="material-symbols-outlined text-on-error-container text-[16px] icon-fill shrink-0 mt-0.5">mic_off</span>
          <p className="text-on-error-container text-xs">{errorVoz}</p>
        </div>
      )}

      <p className="text-on-surface-variant text-xs font-medium mb-4">
        {cocinerasFiltradas.length} resultado{cocinerasFiltradas.length !== 1 ? 's' : ''}
        {busqueda && ` para "${busqueda}"`}
        {' · '}
        <span className="text-primary font-medium">Toca una cocinera para gestionar</span>
      </p>

      {/* Grid de cocineras */}
      {cocinerasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-outline">search_off</span>
          </div>
          <p className="text-on-surface font-semibold">Sin resultados</p>
          <button onClick={() => setBusqueda('')} className="mt-3 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cocinerasFiltradas.map((cocinera) => (
            <button
              key={cocinera.id}
              onClick={() => irAAccion(cocinera)}
              className="text-left bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 active:scale-[0.98] transition-all border border-surface-container-high/50 cursor-pointer group w-full"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                  {cocinera.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-bold text-base truncate">{cocinera.name}</p>
                  {cocinera.doc && <p className="text-outline text-xs">CC {formatearDoc(cocinera.doc)}</p>}
                </div>
                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                  cocinera.totalTipos > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-outline'
                }`}>
                  {cocinera.totalTipos}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-surface-container rounded-xl px-3 py-2 text-center">
                  <p className="text-on-surface font-bold text-lg tabular-nums">{cocinera.totalTipos}</p>
                  <p className="text-outline text-[10px] uppercase tracking-wide">Tipos</p>
                </div>
                <div className="bg-surface-container rounded-xl px-3 py-2 text-center">
                  <p className={`font-bold text-lg tabular-nums ${cocinera.totalTipos > 0 ? 'text-primary' : 'text-outline'}`}>
                    {cocinera.totalUnidades}
                  </p>
                  <p className="text-outline text-[10px] uppercase tracking-wide">Unidades</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[14px] icon-fill">qr_code_scanner</span>
                <span className="text-xs font-semibold">Agregar · Entrega</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ─── VISTA: Botones AGREGAR / ENTREGA ─────────────────────────────────────────
  if (vista === 'accion' && cocineraActiva) return (
    <div className="max-w-sm mx-auto">
      <button
        onClick={volverACocineras}
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span className="text-sm font-medium">Cocineras</span>
      </button>

      {/* Perfil de la cocinera */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        <div className="w-16 h-16 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-2xl shrink-0">
          {cocineraActiva.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-on-surface font-bold text-xl leading-tight">{cocineraActiva.name}</p>
          {cocineraActiva.doc && (
            <p className="text-outline text-sm mt-0.5">CC {formatearDoc(cocineraActiva.doc)}</p>
          )}
          <p className="text-on-surface-variant text-xs mt-1">
            {cocineraActiva.totalTipos} tipo{cocineraActiva.totalTipos !== 1 ? 's' : ''} ·{' '}
            {cocineraActiva.totalUnidades} unidad{cocineraActiva.totalUnidades !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      {/* Botones grandes */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => irAModo('agregar')}
          className="flex items-center gap-5 p-6 rounded-2xl bg-primary text-on-primary shadow-[0_8px_30px_rgba(0,104,95,0.30)] hover:shadow-[0_12px_40px_rgba(0,104,95,0.40)] hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[36px] icon-fill">add_circle</span>
          </div>
          <div className="text-left flex-1">
            <p className="font-black text-2xl tracking-wide">AGREGAR</p>
            <p className="text-on-primary/80 text-sm mt-0.5">Escanea para asignar utensilios</p>
          </div>
          <span className="material-symbols-outlined text-[24px] text-on-primary/60 group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </button>

        <button
          onClick={() => irAModo('entrega')}
          className="flex items-center gap-5 p-6 rounded-2xl bg-secondary text-on-secondary shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.20)] hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[36px] icon-fill">assignment_return</span>
          </div>
          <div className="text-left flex-1">
            <p className="font-black text-2xl tracking-wide">ENTREGA</p>
            <p className="text-on-secondary/80 text-sm mt-0.5">Escanea para registrar devoluciones</p>
          </div>
          <span className="material-symbols-outlined text-[24px] text-on-secondary/60 group-hover:translate-x-1 transition-transform">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  )

  // ─── VISTA: Modo escáner AGREGAR o ENTREGA ────────────────────────────────────
  if ((esAgregar || esEntrega) && cocineraActiva) return (
    <div className="max-w-md mx-auto">
      <button
        onClick={volverAAccion}
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-5 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span className="text-sm font-medium">Volver</span>
      </button>

      {/* Banner del modo activo */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-2xl mb-5 ${
        esAgregar ? 'bg-primary text-on-primary' : 'bg-secondary text-on-secondary'
      }`}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] icon-fill">
            {esAgregar ? 'add_circle' : 'assignment_return'}
          </span>
          <div>
            <p className="font-black text-lg leading-tight">
              {esAgregar ? 'AGREGAR' : 'ENTREGA'}
            </p>
            <p className={`text-sm ${esAgregar ? 'text-on-primary/80' : 'text-on-secondary/80'}`}>
              {cocineraActiva.name}
            </p>
          </div>
        </div>

        {/* Botón cámara secundario */}
        <button
          onClick={() => setCamaraAbierta(v => !v)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            camaraAbierta ? 'bg-white/30' : 'bg-white/15 hover:bg-white/25'
          }`}
          title={camaraAbierta ? 'Cerrar cámara' : 'Abrir cámara'}
        >
          <span className="material-symbols-outlined text-[22px] icon-fill">
            {camaraAbierta ? 'no_photography' : 'photo_camera'}
          </span>
        </button>
      </div>

      {/* Toast de feedback del escáner */}
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 ${
          toast.tipo === 'ok'
            ? esAgregar
              ? 'bg-primary/10 border border-primary/20'
              : 'bg-secondary/10 border border-secondary/20'
            : 'bg-error-container border border-error/20'
        }`}>
          <span className={`material-symbols-outlined text-[20px] icon-fill ${
            toast.tipo === 'ok'
              ? esAgregar ? 'text-primary' : 'text-secondary'
              : 'text-on-error-container'
          }`}>
            {toast.tipo === 'ok' ? 'barcode_reader' : 'error'}
          </span>
          <p className={`text-sm font-semibold flex-1 ${
            toast.tipo === 'ok'
              ? esAgregar ? 'text-primary' : 'text-secondary'
              : 'text-on-error-container'
          }`}>
            {toast.msg}
          </p>
          {isPending && (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin shrink-0" />
          )}
        </div>
      )}

      {/* Panel de cámara (expandible) */}
      {camaraAbierta && (
        <div className="mb-5 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-outline-variant/20">
          <div className="relative bg-black aspect-[4/3] overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

            {camaraActiva && !errorCamara && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  <div className="absolute top-0 left-0 w-8 h-8 border-white" style={{ borderWidth: '3px 0 0 3px', borderRadius: '4px 0 0 0' }} />
                  <div className="absolute top-0 right-0 w-8 h-8 border-white" style={{ borderWidth: '3px 3px 0 0', borderRadius: '0 4px 0 0' }} />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-white" style={{ borderWidth: '0 0 3px 3px', borderRadius: '0 0 0 4px' }} />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-white" style={{ borderWidth: '0 3px 3px 0', borderRadius: '0 0 4px 0' }} />
                  <div className="absolute inset-x-2 h-0.5 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-scan" />
                </div>
                <p className="absolute bottom-4 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                  Apunta al código del utensilio
                </p>
              </div>
            )}

            {!camaraActiva && !errorCamara && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white text-sm">Activando cámara...</p>
              </div>
            )}

            {errorCamara && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6 text-center">
                <span className="material-symbols-outlined text-secondary text-4xl icon-fill">no_photography</span>
                <p className="text-white text-sm">{errorCamara}</p>
                <button
                  onClick={iniciarCamara}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>

          {camaras.length > 1 && (
            <div className="px-4 py-3 border-t border-outline-variant/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-outline text-[18px]">flip_camera_android</span>
              <select
                value={camaraSeleccionada ?? ''}
                onChange={(e) => setCamaraSeleccionada(e.target.value)}
                className="flex-1 text-sm text-on-surface bg-transparent focus:outline-none"
              >
                {camaras.map(c => (
                  <option key={c.deviceId} value={c.deviceId}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones del escáner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/20 mb-5">
        <span className="material-symbols-outlined text-outline text-[20px] icon-fill shrink-0 mt-0.5">
          barcode_reader
        </span>
        <div>
          <p className="text-on-surface text-sm font-semibold">Escáner listo</p>
          <p className="text-on-surface-variant text-xs mt-0.5">
            {esAgregar
              ? 'Cada escaneo agrega 1 unidad del utensilio a esta cocinera.'
              : 'Cada escaneo descuenta 1 unidad entregada por esta cocinera.'}
          </p>
        </div>
      </div>

      {/* Historial de la sesión actual */}
      {historial.length > 0 && (
        <div>
          <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-2">
            Esta sesión
          </p>
          <ul className="space-y-2">
            {historial.map((item, i) => (
              <li
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
                  item.modo === 'agregar'
                    ? 'bg-primary/5 border-primary/15'
                    : 'bg-secondary/5 border-secondary/15'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] icon-fill ${
                  item.modo === 'agregar' ? 'text-primary' : 'text-secondary'
                }`}>
                  {item.modo === 'agregar' ? 'add_circle' : 'assignment_return'}
                </span>
                <p className={`text-sm font-semibold ${
                  item.modo === 'agregar' ? 'text-primary' : 'text-secondary'
                }`}>
                  {item.modo === 'agregar' ? '+1' : '-1'} {item.nombre}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Estado vacío inicial */}
      {historial.length === 0 && !toast && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl text-outline">
              {esAgregar ? 'add_circle' : 'assignment_return'}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm">
            {esAgregar
              ? 'Escanea el código de barras de un utensilio'
              : 'Escanea el código de barras del utensilio a devolver'}
          </p>
        </div>
      )}
    </div>
  )

  return null
}
