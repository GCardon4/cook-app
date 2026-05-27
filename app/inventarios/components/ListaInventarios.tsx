'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { UtensilioConInventario } from '@/lib/supabase/types'
import { asignarDesdeInventario } from '../actions'

const filtros = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'disponible', etiqueta: 'Con Stock' },
  { valor: 'asignados', etiqueta: 'En uso' },
  { valor: 'agotado', etiqueta: 'Agotado' },
]

interface Props {
  utensilios: UtensilioConInventario[]
  cocineras: { id: number; name: string }[]
}

function calcularStock(u: UtensilioConInventario) {
  const asignado = u.inventory.reduce((acc, inv) => acc + (inv.stock ?? 1), 0)
  const total = u.stock ?? 0
  const disponible = Math.max(0, total - asignado)
  const pct = total > 0 ? Math.round((disponible / total) * 100) : 0
  return { total, asignado, disponible, pct }
}

// ─── Panel de asignación (bottom sheet) ──────────────────────────────────────
function PanelAsignacion({
  utensilio,
  cocineras,
  onCerrar,
  onAsignado,
}: {
  utensilio: UtensilioConInventario
  cocineras: { id: number; name: string }[]
  onCerrar: () => void
  onAsignado: () => void
}) {
  const { total, asignado, disponible, pct } = calcularStock(utensilio)

  // Cocineras que aún no tienen este utensilio
  const yaAsignadas = new Set(utensilio.inventory.map((inv) => inv.cook_id))
  const cocinerasDisponibles = cocineras.filter((c) => !yaAsignadas.has(c.id))

  const [cocineraId, setCocineraId] = useState<number | ''>('')
  const [cantidad, setCantidad] = useState(1)
  const [procesando, setProcesando] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCerrar])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleAsignar = async () => {
    if (!cocineraId) return
    setProcesando(true)
    setFeedback(null)
    const resultado = await asignarDesdeInventario(utensilio.id, Number(cocineraId), cantidad)
    setProcesando(false)
    if (resultado?.exito) {
      setFeedback({ tipo: 'ok', texto: resultado.exito })
      setTimeout(() => { onAsignado(); onCerrar() }, 1100)
    } else {
      setFeedback({ tipo: 'error', texto: resultado?.error ?? 'Error desconocido.' })
    }
  }

  const barraColor = pct === 0 ? 'bg-secondary' : pct <= 25 ? 'bg-tertiary' : 'bg-primary'
  const stockColor = pct === 0 ? 'text-secondary' : pct <= 25 ? 'text-tertiary' : 'text-primary'

  const nombreCocinera = cocineraId
    ? cocinerasDisponibles.find((c) => c.id === Number(cocineraId))?.name?.split(' ')[0]
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />

      <div className="relative w-full sm:max-w-sm bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Asa (móvil) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px] icon-fill">flatware</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-on-surface font-bold text-base leading-tight truncate">
              {utensilio.name}
            </h3>
            {utensilio.sku && (
              <p className="text-outline text-xs font-mono">SKU {utensilio.sku}</p>
            )}
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Barra de stock */}
        <div className="px-5 pb-4 border-b border-outline-variant/20">
          <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barraColor}`}
              style={{ width: `${Math.max(pct, pct === 0 ? 0 : 4)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-on-surface font-bold text-lg tabular-nums">{total}</p>
              <p className="text-outline text-[10px] font-medium uppercase tracking-wide">Total</p>
            </div>
            <div>
              <p className={`font-bold text-lg tabular-nums ${stockColor}`}>{disponible}</p>
              <p className="text-outline text-[10px] font-medium uppercase tracking-wide">Disponible</p>
            </div>
            <div>
              <p className="text-on-surface font-bold text-lg tabular-nums">{asignado}</p>
              <p className="text-outline text-[10px] font-medium uppercase tracking-wide">Asignado</p>
            </div>
          </div>
          {pct > 0 && pct <= 25 && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-tertiary/8 border border-tertiary/20">
              <span className="material-symbols-outlined text-tertiary text-[16px] icon-fill">warning</span>
              <p className="text-tertiary text-xs font-medium">Stock bajo — {disponible} unidad{disponible !== 1 ? 'es' : ''} restante{disponible !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {/* Formulario de asignación */}
        <div className="px-5 py-4 space-y-4">
          {disponible === 0 ? (
            <div className="text-center py-3">
              <span className="material-symbols-outlined text-secondary text-3xl mb-2 block">inventory_2</span>
              <p className="text-secondary font-semibold text-sm">Stock agotado</p>
              <p className="text-on-surface-variant text-xs mt-1">
                Usa el escáner para registrar una recepción de stock.
              </p>
            </div>
          ) : cocinerasDisponibles.length === 0 ? (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
              <span className="material-symbols-outlined text-outline text-[20px] icon-fill shrink-0 mt-0.5">group</span>
              <p className="text-on-surface-variant text-sm">
                Todas las cocineras ya tienen este utensilio asignado.
              </p>
            </div>
          ) : (
            <>
              {/* Selector de cocinera */}
              <div>
                <label className="block text-on-surface text-sm font-semibold mb-1.5">
                  Cocinera
                  <span className="text-secondary ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <select
                    value={cocineraId}
                    onChange={(e) => { setCocineraId(e.target.value ? Number(e.target.value) : ''); setFeedback(null) }}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
                  >
                    <option value="">Selecciona una cocinera...</option>
                    {cocinerasDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-on-surface text-sm font-semibold">
                    Cantidad
                  </label>
                  <span className="text-outline text-xs">máx. {disponible}</span>
                </div>

                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low">
                  <button
                    type="button"
                    onClick={() => setCantidad((v) => Math.max(1, v - 1))}
                    disabled={cantidad <= 1}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[22px]">remove</span>
                  </button>

                  <div className="text-center">
                    <span className="text-on-surface font-black text-2xl tabular-nums">{cantidad}</span>
                    <p className="text-outline text-[10px]">unidad{cantidad !== 1 ? 'es' : ''}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCantidad((v) => Math.min(disponible, v + 1))}
                    disabled={cantidad >= disponible}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[22px]">add</span>
                  </button>
                </div>

                {/* Barra de cuánto queda */}
                <div className="mt-2 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${(cantidad / disponible) * 100}%` }}
                  />
                </div>
                <p className="text-outline text-[10px] mt-1 text-right">
                  Quedarán{' '}
                  <span className={`font-semibold ${disponible - cantidad === 0 ? 'text-secondary' : 'text-on-surface'}`}>
                    {disponible - cantidad}
                  </span>{' '}
                  disponibles
                </p>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`flex items-center gap-2.5 p-3 rounded-xl ${
                  feedback.tipo === 'ok'
                    ? 'bg-primary/8 border border-primary/20'
                    : 'bg-error-container border border-error/20'
                }`}>
                  <span className={`material-symbols-outlined text-[18px] icon-fill ${
                    feedback.tipo === 'ok' ? 'text-primary' : 'text-on-error-container'
                  }`}>
                    {feedback.tipo === 'ok' ? 'check_circle' : 'error'}
                  </span>
                  <p className={`text-sm font-medium ${
                    feedback.tipo === 'ok' ? 'text-primary' : 'text-on-error-container'
                  }`}>
                    {feedback.texto}
                  </p>
                </div>
              )}

              {/* Botón confirmar */}
              <button
                onClick={handleAsignar}
                disabled={!cocineraId || procesando || !!feedback}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-surface-tint active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {procesando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] icon-fill">add_link</span>
                    {nombreCocinera
                      ? `Asignar ${cantidad} a ${nombreCocinera}`
                      : `Asignar ${cantidad} unidad${cantidad !== 1 ? 'es' : ''}`}
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Link al escáner */}
        <div className="px-5 pb-5 pt-0">
          <Link
            href="/inventarios/escanear"
            onClick={onCerrar}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-medium hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Escáner — entregar, recibir stock o reasignar
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Lista principal ──────────────────────────────────────────────────────────
export default function ListaInventarios({ utensilios, cocineras }: Props) {
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [codigoManual, setCodigoManual] = useState('')
  const [utensilioActivo, setUtensilioActivo] = useState<UtensilioConInventario | null>(null)
  const [version, setVersion] = useState(0)

  const handleAsignado = useCallback(() => setVersion((v) => v + 1), [])

  const utensuiliosFiltrados = utensilios.filter((u) => {
    const { disponible } = calcularStock(u)
    const skuStr = u.sku?.toString() ?? ''
    const coincideBusqueda =
      textoBusqueda === '' ||
      u.name.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
      skuStr.includes(textoBusqueda) ||
      (u.description ?? '').toLowerCase().includes(textoBusqueda.toLowerCase())

    const coincideFiltro =
      filtroActivo === 'todos' ||
      (filtroActivo === 'disponible' && disponible > 0) ||
      (filtroActivo === 'asignados' && u.inventory.length > 0) ||
      (filtroActivo === 'agotado' && disponible === 0)

    return coincideBusqueda && coincideFiltro
  })

  const manejarBusquedaCodigo = (e: React.FormEvent) => {
    e.preventDefault()
    if (codigoManual.trim()) {
      setTextoBusqueda(codigoManual.trim())
      setCodigoManual('')
    }
  }

  const totalDisponible = utensilios.filter((u) => calcularStock(u).disponible > 0).length
  const totalAsignados = utensilios.filter((u) => u.inventory.length > 0).length
  const totalAgotado = utensilios.filter((u) => calcularStock(u).disponible === 0).length

  const contadorFiltro = (valor: string) =>
    valor === 'todos' ? utensilios.length :
    valor === 'disponible' ? totalDisponible :
    valor === 'asignados' ? totalAsignados :
    totalAgotado

  return (
    <div key={version}>
      {/* Encabezado */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-on-surface font-bold text-2xl md:text-3xl">Inventario Operativo</h2>
          <p className="text-on-surface-variant text-base mt-1">
            {utensilios.length} utensilio{utensilios.length !== 1 ? 's' : ''} ·{' '}
            {totalDisponible} con stock disponible
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-primary text-[18px] icon-fill">inventory_2</span>
            <span className="text-primary font-bold text-sm">{totalDisponible}</span>
            <span className="text-primary/70 text-xs">disponibles</span>
          </div>
          {totalAgotado > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/10">
              <span className="material-symbols-outlined text-secondary text-[18px] icon-fill">error</span>
              <span className="text-secondary font-bold text-sm">{totalAgotado}</span>
              <span className="text-secondary/70 text-xs">agotados</span>
            </div>
          )}
        </div>
      </div>

      {/* Módulo de código de barras */}
      <div className="mb-6 bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl icon-fill">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="text-on-surface font-semibold text-sm">Ingreso por Código de Barras</h3>
              <p className="text-on-surface-variant text-xs">Busca por SKU o usa la cámara</p>
            </div>
          </div>
          <form onSubmit={manejarBusquedaCodigo} className="flex flex-1 gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                <span className="material-symbols-outlined text-[18px]">barcode_reader</span>
              </div>
              <input
                type="number"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="SKU del utensilio..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shrink-0">
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span className="hidden sm:inline">Buscar</span>
            </button>
            <Link href="/inventarios/escanear" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors shrink-0">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span className="hidden sm:inline">Cámara</span>
            </Link>
          </form>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mb-4 relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={textoBusqueda}
          onChange={(e) => setTextoBusqueda(e.target.value)}
          placeholder="Buscar por nombre, SKU o descripción..."
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
        {textoBusqueda && (
          <button onClick={() => setTextoBusqueda('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {filtros.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltroActivo(f.valor)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filtroActivo === f.valor
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {f.etiqueta}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              filtroActivo === f.valor ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {contadorFiltro(f.valor)}
            </span>
          </button>
        ))}
      </div>

      <p className="text-on-surface-variant text-xs font-medium mb-4">
        {utensuiliosFiltrados.length} resultado{utensuiliosFiltrados.length !== 1 ? 's' : ''}
        {textoBusqueda && ` para "${textoBusqueda}"`}
        {' · '}
        <span className="text-primary font-medium">Toca una tarjeta para asignar</span>
      </p>

      {/* Grilla */}
      {utensuiliosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-outline">search_off</span>
          </div>
          <h3 className="text-on-surface font-semibold text-lg mb-1">Sin resultados</h3>
          <p className="text-on-surface-variant text-sm max-w-xs">No se encontraron utensilios con ese criterio.</p>
          <button
            onClick={() => { setTextoBusqueda(''); setFiltroActivo('todos') }}
            className="mt-4 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {utensuiliosFiltrados.map((utensilio) => {
            const { total, asignado, disponible, pct } = calcularStock(utensilio)
            const barraColor = pct === 0 ? 'bg-secondary' : pct <= 25 ? 'bg-tertiary' : 'bg-primary'
            const stockColor = pct === 0 ? 'text-secondary' : pct <= 25 ? 'text-tertiary' : 'text-primary'
            const badgeBg = pct === 0 ? 'bg-secondary/10 text-secondary' : pct <= 25 ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'

            const totalCocineras = utensilio.inventory.length

            return (
              <button
                key={utensilio.id}
                onClick={() => setUtensilioActivo(utensilio)}
                className="text-left bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 active:scale-[0.98] transition-all border border-surface-container-high/50 cursor-pointer group w-full"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <span className="material-symbols-outlined text-[22px] icon-fill">flatware</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeBg}`}>
                    {disponible}/{total}
                  </span>
                </div>

                {/* Nombre */}
                <h3 className="text-on-surface font-semibold text-base mb-0.5 leading-tight">{utensilio.name}</h3>
                {utensilio.sku && <p className="text-outline text-xs font-mono mb-1">SKU: {utensilio.sku}</p>}
                {utensilio.description && (
                  <p className="text-on-surface-variant text-xs mb-3 line-clamp-2">{utensilio.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 text-center my-3 gap-1">
                  <div className="bg-surface-container rounded-xl py-2">
                    <p className="text-on-surface font-bold text-base tabular-nums">{total}</p>
                    <p className="text-outline text-[9px] font-medium uppercase tracking-wide">Total</p>
                  </div>
                  <div className="bg-surface-container rounded-xl py-2">
                    <p className={`font-bold text-base tabular-nums ${stockColor}`}>{disponible}</p>
                    <p className="text-outline text-[9px] font-medium uppercase tracking-wide">Libre</p>
                  </div>
                  <div className="bg-surface-container rounded-xl py-2">
                    <p className="text-on-surface font-bold text-base tabular-nums">{asignado}</p>
                    <p className="text-outline text-[9px] font-medium uppercase tracking-wide">Asig.</p>
                  </div>
                </div>

                {/* Cocineras */}
                {totalCocineras > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-outline text-[14px]">people</span>
                    <span className="text-on-surface-variant text-xs">
                      {totalCocineras} cocinera{totalCocineras !== 1 ? 's' : ''} con este utensilio
                    </span>
                  </div>
                )}

                {/* Barra de stock */}
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barraColor}`}
                    style={{ width: `${Math.max(pct, pct === 0 ? 0 : 4)}%` }}
                  />
                </div>

                {/* Hint hover */}
                <div className="mt-3 flex items-center gap-1.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[14px] icon-fill">add_link</span>
                  <span className="text-xs font-semibold">
                    {pct === 0 ? 'Sin stock disponible' : 'Toca para asignar'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Panel bottom sheet */}
      {utensilioActivo && (
        <PanelAsignacion
          utensilio={utensilioActivo}
          cocineras={cocineras}
          onCerrar={() => setUtensilioActivo(null)}
          onAsignado={handleAsignado}
        />
      )}
    </div>
  )
}
