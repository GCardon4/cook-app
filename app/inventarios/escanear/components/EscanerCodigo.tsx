'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  buscarPorSKU,
  asignarUtensilio,
  registrarEntrega,
  recibirStock,
} from '../actions'
import type { ResultadoScan, EstadoAsignacion } from '../actions'

type Modo = 'camara' | 'escaner'
type PanelActivo = 'asignar' | 'entrega' | 'recibir'

interface Props {
  cocineras: { id: number; name: string }[]
}

export default function EscanerCodigo({ cocineras }: Props) {
  const [modo, setModo] = useState<Modo>('camara')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoScan>(null)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)
  const [codigoInput, setCodigoInput] = useState('')
  const [panelActivo, setPanelActivo] = useState<PanelActivo>('asignar')

  // Estado: asignación
  const [cocineraSeleccionada, setCocineraSeleccionada] = useState<number | ''>('')
  const [cantidadAsignar, setCantidadAsignar] = useState(1)
  const [estadoAccion, setEstadoAccion] = useState<EstadoAsignacion>(null)
  const [procesando, setProcesando] = useState(false)

  // Estado: entrega
  const [entregaMap, setEntregaMap] = useState<Record<number, number>>({})

  // Estado: recibir stock
  const [cantidadRecibir, setCantidadRecibir] = useState(1)

  // Estado: cámara
  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [camaras, setCamaras] = useState<{ deviceId: string; label: string }[]>([])
  const [camaraSeleccionada, setCamaraSeleccionada] = useState<string | undefined>(undefined)
  const [ultimoEscaneado, setUltimoEscaneado] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const ultimoSKURef = useRef('')

  // Buscar utensilio por SKU y actualizar resultado
  const buscarUtensilio = useCallback(async (sku: string) => {
    const skuNum = parseInt(sku.replace(/\D/g, ''))
    if (!skuNum || skuNum < 1) return

    setBuscando(true)
    setResultado(null)
    setErrorBusqueda(null)
    setEstadoAccion(null)
    setCocineraSeleccionada('')
    setCantidadAsignar(1)
    setCantidadRecibir(1)
    setEntregaMap({})
    setPanelActivo('asignar')

    const res = await buscarPorSKU(skuNum)
    setBuscando(false)

    if (res) {
      setResultado(res)
      if (res.stockDisponible === 0) setPanelActivo('entrega')
    } else {
      setErrorBusqueda(`No se encontró ningún utensilio con SKU ${skuNum}.`)
    }
  }, [])

  // Refrescar resultado sin limpiar el panel activo
  const refrescarResultado = useCallback(async (sku: number) => {
    const res = await buscarPorSKU(sku)
    if (res) setResultado(res)
  }, [])

  // Iniciar escáner de cámara con ZXing
  const iniciarCamara = useCallback(async () => {
    if (!videoRef.current) return
    setErrorCamara(null)

    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()

      const dispositivos = await BrowserMultiFormatReader.listVideoInputDevices()
      setCamaras(
        dispositivos.map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Cámara ${d.deviceId.slice(0, 6)}`,
        }))
      )

      const trasera = dispositivos.find((d) => /back|rear|trasera|environment/i.test(d.label))
      const idCamara = camaraSeleccionada ?? trasera?.deviceId ?? dispositivos[0]?.deviceId

      const controls = await reader.decodeFromVideoDevice(
        idCamara,
        videoRef.current,
        (result) => {
          if (!result) return
          const texto = result.getText()
          if (texto === ultimoSKURef.current) return
          ultimoSKURef.current = texto
          setUltimoEscaneado(texto)
          buscarUtensilio(texto)
          setTimeout(() => { ultimoSKURef.current = '' }, 4000)
        }
      )

      controlsRef.current = controls
      setCamaraActiva(true)
    } catch {
      setErrorCamara('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
      setCamaraActiva(false)
    }
  }, [camaraSeleccionada, buscarUtensilio])

  const detenerCamara = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setCamaraActiva(false)
    ultimoSKURef.current = ''
  }, [])

  const cambiarModo = (nuevoModo: Modo) => {
    if (modo === 'camara') detenerCamara()
    setModo(nuevoModo)
    setResultado(null)
    setErrorBusqueda(null)
    setErrorCamara(null)
    setCodigoInput('')
    setEstadoAccion(null)
    setUltimoEscaneado(null)
  }

  useEffect(() => {
    if (modo === 'camara') iniciarCamara()
    return () => { if (modo === 'camara') detenerCamara() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, camaraSeleccionada])

  useEffect(() => {
    if (modo === 'escaner' && inputRef.current) inputRef.current.focus()
  }, [modo])

  const manejarEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && codigoInput.trim()) {
      buscarUtensilio(codigoInput.trim())
      setCodigoInput('')
    }
  }

  // Asignar utensilio a cocinera
  const handleAsignar = async () => {
    if (!resultado || !cocineraSeleccionada) return
    setProcesando(true)
    setEstadoAccion(null)
    const estado = await asignarUtensilio(resultado.id, Number(cocineraSeleccionada), cantidadAsignar)
    setEstadoAccion(estado)
    if (estado?.exito) {
      await refrescarResultado(resultado.sku!)
      setCocineraSeleccionada('')
      setCantidadAsignar(1)
    }
    setProcesando(false)
  }

  // Registrar entrega (devolución) de una cocinera
  const handleEntrega = async (inventarioId: number) => {
    const cantidad = entregaMap[inventarioId] ?? 1
    if (!resultado || cantidad < 1) return
    setProcesando(true)
    setEstadoAccion(null)
    const estado = await registrarEntrega(inventarioId, cantidad)
    setEstadoAccion(estado)
    if (estado?.exito) {
      await refrescarResultado(resultado.sku!)
      setEntregaMap((prev) => { const n = { ...prev }; delete n[inventarioId]; return n })
    }
    setProcesando(false)
  }

  // Recibir nuevas unidades (restock)
  const handleRecibirStock = async () => {
    if (!resultado || cantidadRecibir < 1) return
    setProcesando(true)
    setEstadoAccion(null)
    const estado = await recibirStock(resultado.id, cantidadRecibir)
    setEstadoAccion(estado)
    if (estado?.exito) {
      await refrescarResultado(resultado.sku!)
      setCantidadRecibir(1)
    }
    setProcesando(false)
  }

  const cocinerasDisponibles = cocineras.filter(
    (c) => !resultado?.asignaciones.some((a) => a.cocineraId === c.id)
  )

  const porcentajeStock = resultado
    ? resultado.stockTotal > 0
      ? Math.round((resultado.stockDisponible / resultado.stockTotal) * 100)
      : 0
    : 0

  return (
    <div className="max-w-lg mx-auto" onClick={() => { if (modo === 'escaner') inputRef.current?.focus() }}>

      {/* Selector de modo */}
      <div className="flex gap-2 p-1 bg-surface-container rounded-2xl mb-5">
        {[
          { valor: 'camara' as Modo, icono: 'photo_camera', etiqueta: 'Cámara' },
          { valor: 'escaner' as Modo, icono: 'barcode_reader', etiqueta: 'Escáner / Manual' },
        ].map((tab) => (
          <button
            key={tab.valor}
            onClick={() => cambiarModo(tab.valor)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              modo === tab.valor
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${modo === tab.valor ? 'icon-fill' : ''}`}>
              {tab.icono}
            </span>
            {tab.etiqueta}
          </button>
        ))}
      </div>

      {/* ─── Modo Cámara ─────────────────────────────────────────── */}
      {modo === 'camara' && (
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-surface-container-high/50 mb-4">
          <div className="relative bg-black aspect-[4/3] overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

            {camaraActiva && !errorCamara && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-56 h-40">
                  <div className="absolute top-0 left-0 w-7 h-7 border-primary" style={{ borderWidth: '3px 0 0 3px', borderRadius: '4px 0 0 0' }} />
                  <div className="absolute top-0 right-0 w-7 h-7 border-primary" style={{ borderWidth: '3px 3px 0 0', borderRadius: '0 4px 0 0' }} />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-primary" style={{ borderWidth: '0 0 3px 3px', borderRadius: '0 0 0 4px' }} />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-primary" style={{ borderWidth: '0 3px 3px 0', borderRadius: '0 0 4px 0' }} />
                  <div className="absolute inset-x-2 h-0.5 bg-primary/80 shadow-[0_0_8px_rgba(0,104,95,0.9)] animate-scan" />
                </div>
                <p className="absolute bottom-4 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                  Apunta al código de barras
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
                <button onClick={iniciarCamara} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold">
                  Reintentar
                </button>
              </div>
            )}

            {ultimoEscaneado && camaraActiva && (
              <div className="absolute top-3 left-3 right-3 flex items-center gap-2 bg-primary text-on-primary px-3 py-2 rounded-xl text-sm font-semibold shadow-lg">
                <span className="material-symbols-outlined text-[16px] icon-fill">check_circle</span>
                Detectado: {ultimoEscaneado}
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
                {camaras.map((c) => (
                  <option key={c.deviceId} value={c.deviceId}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ─── Modo Escáner Físico / Manual ────────────────────────── */}
      {modo === 'escaner' && (
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-primary/20 mb-4">
          <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15">
            <span className="material-symbols-outlined text-primary text-[18px] icon-fill shrink-0 mt-0.5">info</span>
            <p className="text-primary text-xs leading-relaxed">
              Con un <strong>escáner físico</strong> (USB/Bluetooth) simplemente apúntalo — envía Enter automáticamente.
              También puedes escribir el SKU manualmente.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              <span className="material-symbols-outlined text-[22px]">barcode_reader</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={manejarEnter}
              placeholder="Escanea o escribe el SKU..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-primary bg-primary/5 text-on-surface placeholder:text-outline text-base focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono tracking-wider"
              autoComplete="off"
            />
          </div>

          <button
            onClick={() => { buscarUtensilio(codigoInput); setCodigoInput('') }}
            disabled={!codigoInput.trim() || buscando}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buscando ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Buscando...</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">search</span>Buscar</>
            )}
          </button>

          <p className="text-outline text-xs text-center mt-2">
            El escáner físico envía Enter automáticamente
          </p>
        </div>
      )}

      {/* ─── Loading ─────────────────────────────────────────────── */}
      {buscando && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/30 mb-4">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
          <p className="text-on-surface-variant text-sm">Buscando utensilio...</p>
        </div>
      )}

      {/* ─── Error de búsqueda ───────────────────────────────────── */}
      {errorBusqueda && !buscando && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-error-container border border-error/20 mb-4">
          <span className="material-symbols-outlined text-on-error-container text-[20px] icon-fill shrink-0 mt-0.5">search_off</span>
          <div>
            <p className="text-on-error-container text-sm font-semibold">No encontrado</p>
            <p className="text-on-error-container/80 text-xs mt-0.5">{errorBusqueda}</p>
          </div>
        </div>
      )}

      {/* ─── Resultado del escaneo ───────────────────────────────── */}
      {resultado && !buscando && (
        <div className="rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-surface-container-high/50">

          {/* Header del utensilio */}
          <div className="bg-surface-container-lowest px-5 py-4 border-b border-outline-variant/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px] icon-fill">flatware</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-on-surface font-bold text-lg leading-tight truncate">
                  {resultado.name}
                </h3>
                {resultado.sku && (
                  <p className="text-outline text-xs font-mono mt-0.5">SKU: {resultado.sku}</p>
                )}
                {resultado.description && (
                  <p className="text-on-surface-variant text-xs mt-1 line-clamp-1">{resultado.description}</p>
                )}
              </div>
            </div>

            {/* Barra de stock */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-on-surface-variant text-xs font-medium">Stock disponible</span>
                <span className={`text-xs font-bold ${
                  resultado.stockDisponible === 0 ? 'text-secondary' :
                  resultado.stockDisponible <= 2 ? 'text-tertiary' : 'text-primary'
                }`}>
                  {resultado.stockDisponible} / {resultado.stockTotal}
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    porcentajeStock === 0 ? 'bg-secondary' :
                    porcentajeStock <= 25 ? 'bg-tertiary' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.max(porcentajeStock, 4)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-outline text-[10px]">Asignado: {resultado.stockAsignado}</span>
                <span className="text-outline text-[10px]">Total: {resultado.stockTotal}</span>
              </div>
            </div>
          </div>

          {/* Tabs de acciones */}
          <div className="flex border-b border-outline-variant/20 bg-surface-container/30">
            {([
              { val: 'asignar' as PanelActivo, icono: 'add_link', label: 'Asignar' },
              { val: 'entrega' as PanelActivo, icono: 'assignment_return', label: 'Entrega' },
              { val: 'recibir' as PanelActivo, icono: 'add_box', label: 'Recibir' },
            ] as { val: PanelActivo; icono: string; label: string }[]).map((tab) => (
              <button
                key={tab.val}
                onClick={() => { setPanelActivo(tab.val); setEstadoAccion(null) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${
                  panelActivo === tab.val
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${panelActivo === tab.val ? 'icon-fill' : ''}`}>
                  {tab.icono}
                </span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel: Asignar */}
          {panelActivo === 'asignar' && (
            <div className="bg-surface-container-lowest px-5 py-4 space-y-3">
              {cocinerasDisponibles.length === 0 ? (
                <p className="text-outline text-sm italic text-center py-2">
                  Todas las cocineras ya tienen este utensilio asignado.
                </p>
              ) : resultado.stockDisponible === 0 ? (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/8 border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-[16px] icon-fill shrink-0 mt-0.5">warning</span>
                  <p className="text-secondary text-xs">Stock agotado. Primero registra una entrega o recibe más unidades.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <select
                      value={cocineraSeleccionada}
                      onChange={(e) => setCocineraSeleccionada(e.target.value ? Number(e.target.value) : '')}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    >
                      <option value="">Selecciona cocinera...</option>
                      {cocinerasDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>

                    {/* Cantidad */}
                    <div className="flex items-center gap-1 border border-outline-variant rounded-xl bg-surface-container-low px-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCantidadAsignar((v) => Math.max(1, v - 1))}
                        className="text-on-surface-variant hover:text-primary transition-colors p-0.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-6 text-center text-on-surface font-bold text-sm">{cantidadAsignar}</span>
                      <button
                        type="button"
                        onClick={() => setCantidadAsignar((v) => Math.min(resultado.stockDisponible, v + 1))}
                        className="text-on-surface-variant hover:text-primary transition-colors p-0.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAsignar}
                    disabled={!cocineraSeleccionada || procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {procesando ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[18px] icon-fill">add_link</span>
                    )}
                    Asignar {cantidadAsignar} unidad{cantidadAsignar !== 1 ? 'es' : ''}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Panel: Entrega (devolución) */}
          {panelActivo === 'entrega' && (
            <div className="bg-surface-container-lowest px-5 py-4">
              {resultado.asignaciones.length === 0 ? (
                <p className="text-outline text-sm italic text-center py-2">
                  No hay asignaciones activas para registrar entrega.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-on-surface-variant text-xs mb-1">
                    Indica cuántas unidades devuelve cada cocinera:
                  </p>
                  {resultado.asignaciones.map((asig) => (
                    <div key={asig.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {asig.nombreCocinera.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-on-surface text-sm font-medium truncate">{asig.nombreCocinera}</p>
                        <p className="text-outline text-xs">{asig.stockAsignado} asignada{asig.stockAsignado !== 1 ? 's' : ''}</p>
                      </div>

                      {/* Selector de cantidad a devolver */}
                      <div className="flex items-center gap-1 border border-outline-variant rounded-xl bg-surface-container-low px-2 py-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEntregaMap((prev) => ({
                            ...prev,
                            [asig.id]: Math.max(1, (prev[asig.id] ?? 1) - 1),
                          }))}
                          className="text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="w-5 text-center text-on-surface font-bold text-xs">
                          {entregaMap[asig.id] ?? 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEntregaMap((prev) => ({
                            ...prev,
                            [asig.id]: Math.min(asig.stockAsignado, (prev[asig.id] ?? 1) + 1),
                          }))}
                          className="text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleEntrega(asig.id)}
                        disabled={procesando}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-surface-tint transition-colors disabled:opacity-50 shrink-0"
                      >
                        <span className="material-symbols-outlined text-[14px] icon-fill">assignment_return</span>
                        Entregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Panel: Recibir stock */}
          {panelActivo === 'recibir' && (
            <div className="bg-surface-container-lowest px-5 py-4 space-y-3">
              <p className="text-on-surface-variant text-xs">
                Registra unidades físicas recibidas. El stock total aumentará.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 border border-outline-variant rounded-xl bg-surface-container-low px-4 py-3">
                  <span className="material-symbols-outlined text-outline text-[18px]">add_box</span>
                  <span className="text-on-surface-variant text-sm">Cantidad recibida:</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setCantidadRecibir((v) => Math.max(1, v - 1))}
                      className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="w-8 text-center text-on-surface font-bold text-base">{cantidadRecibir}</span>
                    <button
                      type="button"
                      onClick={() => setCantidadRecibir((v) => v + 1)}
                      className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRecibirStock}
                disabled={procesando}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px] icon-fill">add_box</span>
                )}
                Confirmar recepción de {cantidadRecibir} unidad{cantidadRecibir !== 1 ? 'es' : ''}
              </button>
            </div>
          )}

          {/* Feedback de acciones */}
          {estadoAccion && (
            <div className={`px-5 py-3 flex items-center gap-2 border-t ${
              estadoAccion.exito
                ? 'bg-primary/5 border-primary/20'
                : 'bg-error-container border-error/20'
            }`}>
              <span className={`material-symbols-outlined text-[18px] icon-fill ${
                estadoAccion.exito ? 'text-primary' : 'text-on-error-container'
              }`}>
                {estadoAccion.exito ? 'check_circle' : 'error'}
              </span>
              <p className={`text-sm font-medium ${estadoAccion.exito ? 'text-primary' : 'text-on-error-container'}`}>
                {estadoAccion.exito ?? estadoAccion.error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío inicial */}
      {!resultado && !errorBusqueda && !buscando && (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl text-outline">
              {modo === 'camara' ? 'photo_camera' : 'barcode_reader'}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm">
            {modo === 'camara'
              ? 'Apunta la cámara a un código de barras'
              : 'Escanea o escribe un SKU para comenzar'}
          </p>
        </div>
      )}
    </div>
  )
}
