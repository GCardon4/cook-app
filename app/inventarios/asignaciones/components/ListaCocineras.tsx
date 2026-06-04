'use client'

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'
import type { CocineraConInventario, UtensilioDisponible } from '../page'
import {
  actualizarCantidadAsignacion,
  eliminarAsignacion,
  agregarUtensilioACocinera,
} from '../actions'

// ─── Formateadores ────────────────────────────────────────────────────────────
function formatearDoc(doc: number | null) {
  if (!doc) return null
  return doc.toLocaleString('es-CO')
}

// Construir URL de WhatsApp con listado de utensilios (sin cédula)
function construirUrlWhatsAppInventario(
  cocinera: CocineraConInventario,
  asignaciones: CocineraConInventario['asignaciones']
): string {
  const totalUnidades = asignaciones.reduce((acc, a) => acc + a.stockAsignado, 0)
  const lista =
    asignaciones.length > 0
      ? asignaciones.map((a) => `• ${a.utensilio.name} × ${a.stockAsignado}`).join('\n')
      : '• Sin utensilios asignados'

  const mensaje =
    `Hola ${cocinera.name}! 👋\n\n` +
    `Tus utensilios asignados:\n\n` +
    `${lista}\n\n` +
    `Total: ${asignaciones.length} tipo(s) · ${totalUnidades} unidad(es)\n\n` +
    `_PROACTIVO_ 🍽️`

  return `https://wa.me/57${cocinera.phone}?text=${encodeURIComponent(mensaje)}`
}

// ─── Panel de detalle de cocinera ─────────────────────────────────────────────
function PanelCocinera({
  cocinera,
  utensiliosDisponibles,
  onCerrar,
  onCambio,
}: {
  cocinera: CocineraConInventario
  utensiliosDisponibles: UtensilioDisponible[]
  onCerrar: () => void
  onCambio: () => void
}) {
  const [asignaciones, setAsignaciones] = useState(cocinera.asignaciones)
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)
  const [errores, setErrores] = useState<Record<number, string>>({})
  const [agregando, setAgregando] = useState(false)
  const [utensilioNuevo, setUtensilioNuevo] = useState<number | ''>('')
  const [cantidadNueva, setCantidadNueva] = useState(1)
  const [feedbackGlobal, setFeedbackGlobal] = useState<string | null>(null)
  const [stockLiberado, setStockLiberado] = useState<{ nombre: string; cantidad: number } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [destacadoId, setDestacadoId] = useState<number | null>(null)
  const [feedbackEscaner, setFeedbackEscaner] = useState<{ tipo: 'ok' | 'error'; msg: string } | null>(null)

  // Eliminar asignación y liberar stock
  const handleEliminar = (invId: number) => {
    const asig = asignaciones.find((a) => a.id === invId)
    startTransition(async () => {
      const resultado = await eliminarAsignacion(invId)
      if (resultado?.error) {
        setErrores((prev) => ({ ...prev, [invId]: resultado.error! }))
      } else {
        setAsignaciones((prev) => prev.filter((a) => a.id !== invId))
        setConfirmandoId(null)
        if (asig) {
          setStockLiberado({ nombre: asig.utensilio.name, cantidad: asig.stockAsignado })
          setTimeout(() => setStockLiberado(null), 3000)
        }
        onCambio()
      }
    })
  }

  // Procesar código escaneado: descuenta 1 unidad; si llega a 0, elimina la asignación
  const procesarEscaneo = useCallback((codigo: string) => {
    const skuNum = parseInt(codigo.replace(/\D/g, ''))
    if (!skuNum) {
      setFeedbackEscaner({ tipo: 'error', msg: 'Código no válido.' })
      setTimeout(() => setFeedbackEscaner(null), 2500)
      return
    }
    const asig = asignaciones.find((a) => a.utensilio.sku === skuNum)
    if (!asig) {
      setFeedbackEscaner({ tipo: 'error', msg: `SKU ${skuNum} no está en la lista de esta cocinera.` })
      setTimeout(() => setFeedbackEscaner(null), 3000)
      return
    }

    const nuevaCantidad = asig.stockAsignado - 1
    setDestacadoId(asig.id)
    setTimeout(() => setDestacadoId(null), 800)

    if (nuevaCantidad <= 0) {
      // Última unidad: eliminar asignación completa
      setFeedbackEscaner({ tipo: 'ok', msg: `Devuelto: ${asig.utensilio.name}` })
      setAsignaciones((prev) => prev.filter((a) => a.id !== asig.id))
      startTransition(async () => {
        const resultado = await eliminarAsignacion(asig.id)
        if (resultado?.error) {
          setAsignaciones((prev) => [...prev, asig])
          setFeedbackEscaner({ tipo: 'error', msg: resultado.error })
        } else {
          setStockLiberado({ nombre: asig.utensilio.name, cantidad: 1 })
          setTimeout(() => setStockLiberado(null), 3000)
          onCambio()
        }
        setTimeout(() => setFeedbackEscaner(null), 2500)
      })
    } else {
      // Decrementar en 1 con actualización optimista inmediata
      setFeedbackEscaner({ tipo: 'ok', msg: `${asig.utensilio.name}: ${asig.stockAsignado} → ${nuevaCantidad}` })
      setAsignaciones((prev) =>
        prev.map((a) => a.id === asig.id ? { ...a, stockAsignado: nuevaCantidad } : a)
      )
      startTransition(async () => {
        const resultado = await actualizarCantidadAsignacion(asig.id, nuevaCantidad)
        if (resultado?.error) {
          setAsignaciones((prev) =>
            prev.map((a) => a.id === asig.id ? { ...a, stockAsignado: asig.stockAsignado } : a)
          )
          setFeedbackEscaner({ tipo: 'error', msg: resultado.error })
        } else {
          onCambio()
        }
        setTimeout(() => setFeedbackEscaner(null), 2500)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asignaciones, onCambio])

  // Ref siempre apunta al procesarEscaneo con las asignaciones más recientes
  const procesarEscaneoRef = useRef(procesarEscaneo)
  useEffect(() => { procesarEscaneoRef.current = procesarEscaneo }, [procesarEscaneo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCerrar])

  // Escáner siempre activo: captura ráfaga de teclas del lector hardware (< 120ms entre chars)
  useEffect(() => {
    const buf = { chars: '', lastMs: 0 }
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const now = Date.now()
      if (e.key === 'Enter') {
        if (buf.chars.length > 2) procesarEscaneoRef.current(buf.chars)
        buf.chars = ''
        return
      }
      if (now - buf.lastMs > 120) buf.chars = ''
      buf.lastMs = now
      if (e.key.length === 1) buf.chars += e.key
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Actualizar cantidad con +/-
  const cambiarCantidad = (invId: number, delta: number) => {
    const actual = asignaciones.find((a) => a.id === invId)
    if (!actual) return
    const nueva = Math.max(1, actual.stockAsignado + delta)
    if (nueva === actual.stockAsignado) return

    setAsignaciones((prev) =>
      prev.map((a) => a.id === invId ? { ...a, stockAsignado: nueva } : a)
    )
    setErrores((prev) => { const n = { ...prev }; delete n[invId]; return n })

    startTransition(async () => {
      const resultado = await actualizarCantidadAsignacion(invId, nueva)
      if (resultado?.error) {
        setAsignaciones((prev) =>
          prev.map((a) => a.id === invId ? { ...a, stockAsignado: actual.stockAsignado } : a)
        )
        setErrores((prev) => ({ ...prev, [invId]: resultado.error! }))
      } else {
        onCambio()
      }
    })
  }

  // Agregar utensilio nuevo
  const handleAgregar = () => {
    if (!utensilioNuevo) return
    setFeedbackGlobal(null)
    startTransition(async () => {
      const resultado = await agregarUtensilioACocinera(cocinera.id, Number(utensilioNuevo), cantidadNueva)
      if (resultado?.error) {
        setFeedbackGlobal(resultado.error)
      } else {
        setAgregando(false)
        setUtensilioNuevo('')
        setCantidadNueva(1)
        onCambio()
        onCerrar()
      }
    })
  }

  const idsYaAsignados = new Set(asignaciones.map((a) => a.utensilio.id))
  const utensilioPorAgregar = utensiliosDisponibles.filter((u) => !idsYaAsignados.has(u.id))

  const totalUnidades = asignaciones.reduce((acc, a) => acc + a.stockAsignado, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />

      <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Asa (móvil) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-4 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-xl shrink-0">
              {cocinera.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-on-surface font-bold text-lg leading-tight truncate">
                {cocinera.name}
              </h3>
              <div className="flex items-center gap-3 mt-0.5">
                {cocinera.doc && (
                  <span className="text-outline text-xs">CC {formatearDoc(cocinera.doc)}</span>
                )}
                <span className="text-on-surface-variant text-xs">
                  {asignaciones.length} utensilio{asignaciones.length !== 1 ? 's' : ''} · {totalUnidades} unidad{totalUnidades !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>
            {cocinera.phone && (
              <a
                href={construirUrlWhatsAppInventario(cocinera, asignaciones)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-colors shrink-0"
                title="Enviar WhatsApp con listado"
              >
                <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            )}
            <button
              onClick={onCerrar}
              className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Toast feedback escáner */}
        {feedbackEscaner && (
          <div className={`mx-5 mt-3 flex items-center gap-2.5 px-4 py-3 rounded-xl shrink-0 ${
            feedbackEscaner.tipo === 'ok'
              ? 'bg-primary/10 border border-primary/20'
              : 'bg-error-container border border-error/20'
          }`}>
            <span className={`material-symbols-outlined text-[18px] icon-fill ${
              feedbackEscaner.tipo === 'ok' ? 'text-primary' : 'text-on-error-container'
            }`}>
              {feedbackEscaner.tipo === 'ok' ? 'barcode_reader' : 'error'}
            </span>
            <p className={`text-xs font-semibold truncate ${
              feedbackEscaner.tipo === 'ok' ? 'text-primary' : 'text-on-error-container'
            }`}>
              {feedbackEscaner.msg}
            </p>
          </div>
        )}

        {/* Toast stock liberado */}
        {stockLiberado && (
          <div className="mx-5 mt-3 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px] icon-fill">inventory_2</span>
            <div className="min-w-0">
              <p className="text-primary text-xs font-semibold truncate">{stockLiberado.nombre}</p>
              <p className="text-primary/70 text-[11px]">
                +{stockLiberado.cantidad} unidad{stockLiberado.cantidad !== 1 ? 'es' : ''} devuelta{stockLiberado.cantidad !== 1 ? 's' : ''} al stock
              </p>
            </div>
          </div>
        )}

        {/* Lista de utensilios — scroll */}
        <div className="flex-1 overflow-y-auto">
          {asignaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-5">
              <span className="material-symbols-outlined text-3xl text-outline mb-2">flatware</span>
              <p className="text-on-surface-variant text-sm">Sin utensilios asignados.</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/15">
              {asignaciones.map((asig) => {
                const maxCantidad = asig.utensilio.stockTotal
                const enConfirmacion = confirmandoId === asig.id
                const errorFila = errores[asig.id]

                return (
                  <li key={asig.id} className={`px-5 py-3.5 transition-colors ${destacadoId === asig.id ? 'bg-primary/8' : ''}`}>
                    <div className="flex items-center gap-3">
                      {/* Icono */}
                      <div className="w-9 h-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] icon-fill">flatware</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-on-surface text-sm font-semibold truncate">
                          {asig.utensilio.name}
                        </p>
                        {asig.utensilio.sku && (
                          <p className="text-outline text-[11px] font-mono">SKU {asig.utensilio.sku}</p>
                        )}
                        {errorFila && (
                          <p className="text-secondary text-[11px] mt-0.5">{errorFila}</p>
                        )}
                      </div>

                      {/* Controles */}
                      {enConfirmacion ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-on-surface-variant text-xs">¿Eliminar?</span>
                          <button
                            onClick={() => handleEliminar(asig.id)}
                            disabled={isPending}
                            className="px-2.5 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold disabled:opacity-50"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Selector de cantidad inline */}
                          <button
                            onClick={() => cambiarCantidad(asig.id, -1)}
                            disabled={asig.stockAsignado <= 1 || isPending}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                          </button>

                          <span className="w-7 text-center text-on-surface font-bold text-sm tabular-nums">
                            {asig.stockAsignado}
                          </span>

                          <button
                            onClick={() => cambiarCantidad(asig.id, +1)}
                            disabled={asig.stockAsignado >= maxCantidad || isPending}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>

                          <div className="w-px h-5 bg-outline-variant/40 mx-1" />

                          {/* Eliminar */}
                          <button
                            onClick={() => setConfirmandoId(asig.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary/10 transition-all"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Sub-panel: Agregar utensilio */}
          {agregando ? (
            <div className="px-5 py-4 border-t border-outline-variant/20 bg-surface-container/40">
              <p className="text-on-surface text-sm font-semibold mb-3">Agregar utensilio</p>

              {utensilioPorAgregar.length === 0 ? (
                <p className="text-outline text-xs italic">No hay utensilios con stock disponible para agregar.</p>
              ) : (
                <div className="space-y-3">
                  <select
                    value={utensilioNuevo}
                    onChange={(e) => { setUtensilioNuevo(e.target.value ? Number(e.target.value) : ''); setFeedbackGlobal(null) }}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">Selecciona un utensilio...</option>
                    {utensilioPorAgregar.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}{u.sku ? ` — SKU ${u.sku}` : ''} ({u.stockDisponible} disp.)
                      </option>
                    ))}
                  </select>

                  {/* Cantidad */}
                  <div className="flex items-center gap-3">
                    <span className="text-on-surface-variant text-sm flex-1">Cantidad:</span>
                    <div className="flex items-center gap-1 border border-outline-variant rounded-xl bg-surface-container-low px-2 py-1">
                      <button
                        type="button"
                        onClick={() => setCantidadNueva((v) => Math.max(1, v - 1))}
                        className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-on-surface tabular-nums">{cantidadNueva}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const max = utensiliosDisponibles.find((u) => u.id === Number(utensilioNuevo))?.stockDisponible ?? 99
                          setCantidadNueva((v) => Math.min(max, v + 1))
                        }}
                        className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>

                  {feedbackGlobal && (
                    <p className="text-secondary text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {feedbackGlobal}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleAgregar}
                      disabled={!utensilioNuevo || isPending}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors disabled:opacity-50"
                    >
                      {isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px] icon-fill">add_link</span>
                      )}
                      Agregar
                    </button>
                    <button
                      onClick={() => { setAgregando(false); setFeedbackGlobal(null) }}
                      className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-3 border-t border-outline-variant/15">
              <button
                onClick={() => setAgregando(true)}
                disabled={utensilioPorAgregar.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px] icon-fill">add</span>
                Agregar utensilio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Lista principal de cocineras ─────────────────────────────────────────────
interface Props {
  cocineras: CocineraConInventario[]
  utensiliosDisponibles: UtensilioDisponible[]
}

export default function ListaCocineras({ cocineras, utensiliosDisponibles }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [cocineraActiva, setCocineraActiva] = useState<CocineraConInventario | null>(null)
  const [version, setVersion] = useState(0)
  const [escuchando, setEscuchando] = useState(false)
  const [sinSoporte, setSinSoporte] = useState(false)
  const [errorVoz, setErrorVoz] = useState<string | null>(null)

  // Reconocimiento de voz — compatible con Chrome Android (webkitSpeechRecognition)
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
    rec.onend   = () => setEscuchando(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setEscuchando(false)
      if (e.error === 'not-allowed') {
        setErrorVoz('Permiso de micrófono denegado. Actívalo en la configuración del navegador.')
      } else if (e.error === 'no-speech') {
        setErrorVoz('No se detectó voz. Intenta de nuevo.')
      }
      setTimeout(() => setErrorVoz(null), 4000)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const texto: string = e.results[0][0].transcript.trim()
      setBusqueda(texto)
    }

    try { rec.start() } catch { setEscuchando(false) }
  }, [])

  const cocinerasFiltradas = cocineras.filter((c) =>
    busqueda === '' ||
    c.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.doc?.toString().includes(busqueda)
  )

  const conUtensilios = cocineras.filter((c) => c.asignaciones.length > 0).length
  const sinUtensilios = cocineras.filter((c) => c.asignaciones.length === 0).length

  return (
    <div key={version}>
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <p className="text-on-surface font-bold text-2xl">{cocineras.length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Total</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20 text-center">
          <p className="text-primary font-bold text-2xl">{conUtensilios}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Con utensilios</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-secondary/20 text-center">
          <p className="text-secondary font-bold text-2xl">{sinUtensilios}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Sin asignar</p>
        </div>
      </div>

      {/* Búsqueda + Voz */}
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

        {/* Botón limpiar */}
        {busqueda && !escuchando && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute right-11 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}

        {/* Botón micrófono */}
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
          <span className="material-symbols-outlined text-[20px] icon-fill">
            {escuchando ? 'mic' : 'mic'}
          </span>
        </button>
      </div>

      {/* Hint voz activa */}
      {escuchando && (
        <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-xl bg-primary/8 border border-primary/20">
          <div className="flex gap-0.5 items-end h-4">
            {[2, 4, 3, 5, 2].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span className="text-primary text-xs font-semibold">Di el nombre de la cocinera...</span>
        </div>
      )}

      {/* Error de voz */}
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
        <span className="text-primary font-medium">Toca una cocinera para ver su inventario</span>
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
          {cocinerasFiltradas.map((cocinera) => {
            const totalUnidades = cocinera.asignaciones.reduce((acc, a) => acc + a.stockAsignado, 0)
            const tieneAsignaciones = cocinera.asignaciones.length > 0
            const primerosUtensilios = cocinera.asignaciones.slice(0, 3)

            return (
              <button
                key={cocinera.id}
                onClick={() => setCocineraActiva(cocinera)}
                className="text-left bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 active:scale-[0.98] transition-all border border-surface-container-high/50 cursor-pointer group w-full"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-black text-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                    {cocinera.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface font-bold text-base truncate">{cocinera.name}</p>
                    {cocinera.doc && (
                      <p className="text-outline text-xs">CC {formatearDoc(cocinera.doc)}</p>
                    )}
                  </div>
                  {/* Badge */}
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                    tieneAsignaciones ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                  }`}>
                    {cocinera.asignaciones.length}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-surface-container rounded-xl px-3 py-2 text-center">
                    <p className="text-on-surface font-bold text-lg tabular-nums">{cocinera.asignaciones.length}</p>
                    <p className="text-outline text-[10px] uppercase tracking-wide">Tipos</p>
                  </div>
                  <div className="bg-surface-container rounded-xl px-3 py-2 text-center">
                    <p className={`font-bold text-lg tabular-nums ${tieneAsignaciones ? 'text-primary' : 'text-outline'}`}>
                      {totalUnidades}
                    </p>
                    <p className="text-outline text-[10px] uppercase tracking-wide">Unidades</p>
                  </div>
                </div>

                {/* Preview de utensilios */}
                {tieneAsignaciones ? (
                  <div className="space-y-1.5">
                    {primerosUtensilios.map((asig) => (
                      <div key={asig.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="material-symbols-outlined text-outline text-[14px]">flatware</span>
                          <span className="text-on-surface-variant text-xs truncate">{asig.utensilio.name}</span>
                        </div>
                        <span className="text-primary text-xs font-bold shrink-0">×{asig.stockAsignado}</span>
                      </div>
                    ))}
                    {cocinera.asignaciones.length > 3 && (
                      <p className="text-outline text-xs">+{cocinera.asignaciones.length - 3} más...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-outline">
                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                    <span className="text-xs">Sin utensilios asignados</span>
                  </div>
                )}

                {/* Hint hover */}
                <div className="mt-4 flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[14px] icon-fill">edit</span>
                  <span className="text-xs font-semibold">Ver y editar inventario</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Panel de detalle */}
      {cocineraActiva && (
        <PanelCocinera
          cocinera={cocineraActiva}
          utensiliosDisponibles={utensiliosDisponibles}
          onCerrar={() => setCocineraActiva(null)}
          onCambio={() => setVersion((v) => v + 1)}
        />
      )}
    </div>
  )
}
