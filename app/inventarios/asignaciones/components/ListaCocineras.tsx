'use client'

import { useState, useEffect, useTransition } from 'react'
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
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCerrar])

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

    // Optimista
    setAsignaciones((prev) =>
      prev.map((a) => a.id === invId ? { ...a, stockAsignado: nueva } : a)
    )
    setErrores((prev) => { const n = { ...prev }; delete n[invId]; return n })

    startTransition(async () => {
      const resultado = await actualizarCantidadAsignacion(invId, nueva)
      if (resultado?.error) {
        // Revertir
        setAsignaciones((prev) =>
          prev.map((a) => a.id === invId ? { ...a, stockAsignado: actual.stockAsignado } : a)
        )
        setErrores((prev) => ({ ...prev, [invId]: resultado.error! }))
      } else {
        onCambio()
      }
    })
  }

  // Eliminar asignación
  const handleEliminar = (invId: number) => {
    startTransition(async () => {
      const resultado = await eliminarAsignacion(invId)
      if (resultado?.error) {
        setErrores((prev) => ({ ...prev, [invId]: resultado.error! }))
      } else {
        setAsignaciones((prev) => prev.filter((a) => a.id !== invId))
        setConfirmandoId(null)
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
        // El servidor revalidó, recargamos datos locales desde props no es posible aquí
        // así que cerramos el sub-panel y notificamos al padre para refrescar
        setAgregando(false)
        setUtensilioNuevo('')
        setCantidadNueva(1)
        onCambio()
        onCerrar() // Cierra el panel para que el Server Component recargue los datos
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
            <button
              onClick={onCerrar}
              className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

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
                  <li key={asig.id} className="px-5 py-3.5">
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

      {/* Búsqueda */}
      <div className="mb-5 relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cocinera por nombre o cédula..."
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

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
