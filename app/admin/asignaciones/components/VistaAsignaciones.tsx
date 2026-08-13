'use client'

import { useState, useMemo } from 'react'
import type { AsignacionHistorial } from '../page'

type FiltroFecha = 'hoy' | 'semana' | 'mes' | 'semestre' | 'todos'

const OPCIONES_FECHA: { valor: FiltroFecha; etiqueta: string }[] = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: 'Última semana' },
  { valor: 'mes', etiqueta: 'Último mes' },
  { valor: 'semestre', etiqueta: 'Últimos 6 meses' },
  { valor: 'todos', etiqueta: 'Todos' },
]

function obtenerRangoFecha(filtro: FiltroFecha): { inicio: Date; fin: Date } {
  const hoy = new Date()
  const fin = new Date(hoy)

  let inicio = new Date(hoy)

  switch (filtro) {
    case 'hoy':
      inicio.setHours(0, 0, 0, 0)
      fin.setHours(23, 59, 59, 999)
      break
    case 'semana':
      inicio.setDate(hoy.getDate() - 7)
      break
    case 'mes':
      inicio.setMonth(hoy.getMonth() - 1)
      break
    case 'semestre':
      inicio.setMonth(hoy.getMonth() - 6)
      break
    case 'todos':
      inicio = new Date('2000-01-01')
      break
  }

  return { inicio, fin }
}

function asignacionEnRango(asignacion: AsignacionHistorial, filtro: FiltroFecha): boolean {
  const fecha = new Date(asignacion.fechaAsignacion)
  const { inicio, fin } = obtenerRangoFecha(filtro)
  return fecha >= inicio && fecha <= fin
}

export function VistaAsignaciones({ historialInicial }: { historialInicial: AsignacionHistorial[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('mes')
  const [filtroCocinera, setFiltroCocinera] = useState<number | null>(null)
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set())

  // Obtener lista única de cocineras
  const cocineras = useMemo(() => {
    const mapa = new Map<number, string>()
    historialInicial.forEach((a) => {
      if (!mapa.has(a.cocineraId)) {
        mapa.set(a.cocineraId, a.cocinera.name)
      }
    })
    return Array.from(mapa.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [historialInicial])

  // Filtrar asignaciones
  const asignacionesFiltradas = useMemo(() => {
    return historialInicial.filter((a) => {
      // Filtro de fecha
      if (!asignacionEnRango(a, filtroFecha)) return false

      // Filtro de cocinera
      if (filtroCocinera !== null && a.cocineraId !== filtroCocinera) return false

      // Filtro de búsqueda
      if (busqueda.trim()) {
        const termino = busqueda.toLowerCase()
        const coincideCocinera = a.cocinera.name.toLowerCase().includes(termino)
        const coincideUtensilio = a.utensilio.name.toLowerCase().includes(termino)
        const coincideSKU = a.utensilio.sku?.toLowerCase().includes(termino)
        return coincideCocinera || coincideUtensilio || coincideSKU
      }

      return true
    })
  }, [historialInicial, filtroFecha, filtroCocinera, busqueda])

  // Agrupar por cocinera
  const asignacionesAgrupadas = useMemo(() => {
    const agrupado = new Map<number, AsignacionHistorial[]>()
    asignacionesFiltradas.forEach((a) => {
      if (!agrupado.has(a.cocineraId)) {
        agrupado.set(a.cocineraId, [])
      }
      agrupado.get(a.cocineraId)!.push(a)
    })
    return Array.from(agrupado.entries()).sort((a, b) => a[0] - b[0])
  }, [asignacionesFiltradas])

  const toggleExpandida = (cocineraId: number) => {
    const nuevas = new Set(expandidas)
    if (nuevas.has(cocineraId)) {
      nuevas.delete(cocineraId)
    } else {
      nuevas.add(cocineraId)
    }
    setExpandidas(nuevas)
  }

  const totalUtensilios = asignacionesFiltradas.reduce((acc, a) => acc + a.cantidad, 0)
  const totalAsignaciones = asignacionesFiltradas.length

  return (
    <div className="space-y-6">
      {/* Resumen estadístico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-primary/20">
          <p className="text-on-surface-variant text-xs font-semibold mb-1">Total Asignaciones</p>
          <p className="text-on-surface font-bold text-3xl">{totalAsignaciones}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-secondary/20">
          <p className="text-on-surface-variant text-xs font-semibold mb-1">Total Unidades</p>
          <p className="text-on-surface font-bold text-3xl">{totalUtensilios}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-tertiary/20">
          <p className="text-on-surface-variant text-xs font-semibold mb-1">Cocineras Activas</p>
          <p className="text-on-surface font-bold text-3xl">{asignacionesAgrupadas.length}</p>
        </div>
      </div>

      {/* Controles de filtro */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 space-y-4">
        <div className="space-y-3">
          {/* Búsqueda */}
          <div>
            <label className="block text-on-surface text-sm font-semibold mb-2">Buscar</label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Cocinera, utensilio o SKU..."
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/20 bg-surface text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Filtro de fecha */}
            <div>
              <label className="block text-on-surface text-sm font-semibold mb-2">Período</label>
              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value as FiltroFecha)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/20 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {OPCIONES_FECHA.map((op) => (
                  <option key={op.valor} value={op.valor}>
                    {op.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de cocinera */}
            <div>
              <label className="block text-on-surface text-sm font-semibold mb-2">Cocinera</label>
              <select
                value={filtroCocinera ?? ''}
                onChange={(e) => setFiltroCocinera(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/20 bg-surface text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Todas las cocineras</option>
                {cocineras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de asignaciones */}
      <div className="space-y-3">
        {asignacionesAgrupadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl text-outline">search_off</span>
            </div>
            <p className="text-on-surface font-semibold">Sin resultados</p>
            <p className="text-on-surface-variant text-sm mt-1">No hay asignaciones que coincidan con tus filtros</p>
          </div>
        ) : (
          asignacionesAgrupadas.map(([cocineraId, asignaciones]) => {
            const cocinera = asignaciones[0].cocinera
            const esExpandida = expandidas.has(cocineraId)

            return (
              <div
                key={cocineraId}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden"
              >
                {/* Header de cocinera */}
                <button
                  onClick={() => toggleExpandida(cocineraId)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-container/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                      {cocinera.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-on-surface font-semibold">{cocinera.name}</p>
                      <p className="text-on-surface-variant text-xs">{asignaciones.length} asignación{asignaciones.length !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                      {asignaciones.reduce((acc, a) => acc + a.cantidad, 0)} unidades
                    </span>
                    <span className={`material-symbols-outlined transition-transform ${esExpandida ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Contenido expandible */}
                {esExpandida && (
                  <div className="border-t border-outline-variant/20 divide-y divide-outline-variant/20">
                    {asignaciones.map((asignacion) => (
                      <div
                        key={asignacion.id}
                        className="px-5 py-4 hover:bg-surface-container/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-on-surface font-semibold">{asignacion.utensilio.name}</p>
                              {asignacion.utensilio.sku && (
                                <span className="text-outline text-xs font-mono bg-surface px-2 py-0.5 rounded">
                                  {asignacion.utensilio.sku}
                                </span>
                              )}
                            </div>
                            <p className="text-on-surface-variant text-xs mb-2">
                              {new Date(asignacion.fechaAsignacion).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {asignacion.notas && (
                              <p className="text-on-surface-variant text-xs bg-surface px-3 py-2 rounded-lg border border-outline-variant/20">
                                <span className="font-semibold">Notas:</span> {asignacion.notas}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="bg-secondary/10 text-secondary font-bold px-3 py-1 rounded-full text-sm">
                              ×{asignacion.cantidad}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
