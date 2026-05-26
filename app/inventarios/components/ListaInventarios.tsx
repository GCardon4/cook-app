'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { UtensilioConInventario } from '@/lib/supabase/types'

// Configuración visual según estado de asignación
const configEstado = {
  asignado: {
    label: 'Asignado',
    color: 'text-primary',
    bg: 'bg-primary/10',
    icono: 'check_circle',
    barraColor: 'bg-primary',
  },
  sin_asignar: {
    label: 'Sin Asignar',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    icono: 'error',
    barraColor: 'bg-secondary',
  },
}

// Filtros rápidos disponibles
const filtros = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'asignados', etiqueta: 'Asignados' },
  { valor: 'sin_asignar', etiqueta: 'Sin Asignar' },
]

interface Props {
  utensilios: UtensilioConInventario[]
}

export default function ListaInventarios({ utensilios }: Props) {
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [codigoManual, setCodigoManual] = useState('')

  // Filtrar utensilios según búsqueda y filtro activo
  const utensuiliosFiltrados = utensilios.filter((u) => {
    const skuStr = u.sku?.toString() ?? ''
    const coincideBusqueda =
      textoBusqueda === '' ||
      u.name.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
      skuStr.includes(textoBusqueda) ||
      (u.description ?? '').toLowerCase().includes(textoBusqueda.toLowerCase())

    const tieneAsignacion = u.inventory.length > 0
    const coincideFiltro =
      filtroActivo === 'todos' ||
      (filtroActivo === 'asignados' && tieneAsignacion) ||
      (filtroActivo === 'sin_asignar' && !tieneAsignacion)

    return coincideBusqueda && coincideFiltro
  })

  // Buscar por código de barras ingresado manualmente
  const manejarBusquedaCodigo = (e: React.FormEvent) => {
    e.preventDefault()
    if (codigoManual.trim()) {
      setTextoBusqueda(codigoManual.trim())
      setCodigoManual('')
    }
  }

  // Contadores para los filtros
  const totalAsignados = utensilios.filter((u) => u.inventory.length > 0).length
  const totalSinAsignar = utensilios.filter((u) => u.inventory.length === 0).length

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
            Inventario Operativo
          </h2>
          <p className="text-on-surface-variant text-base mt-1">
            {utensilios.length} utensilio{utensilios.length !== 1 ? 's' : ''}{' '}
            registrado{utensilios.length !== 1 ? 's' : ''} · {totalAsignados}{' '}
            asignado{totalAsignados !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Resumen rápido */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10">
            <span className="material-symbols-outlined text-primary text-[18px] icon-fill">
              check_circle
            </span>
            <span className="text-primary font-bold text-sm">{totalAsignados}</span>
            <span className="text-primary/70 text-xs">asignados</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/10">
            <span className="material-symbols-outlined text-secondary text-[18px] icon-fill">
              error
            </span>
            <span className="text-secondary font-bold text-sm">{totalSinAsignar}</span>
            <span className="text-secondary/70 text-xs">sin asignar</span>
          </div>
        </div>
      </div>

      {/* Módulo de ingreso por código de barras */}
      <div className="mb-6 bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl icon-fill">
                qr_code_scanner
              </span>
            </div>
            <div>
              <h3 className="text-on-surface font-semibold text-sm">
                Ingreso por Código de Barras
              </h3>
              <p className="text-on-surface-variant text-xs">
                Ingresa el SKU numérico del utensilio
              </p>
            </div>
          </div>

          <form onSubmit={manejarBusquedaCodigo} className="flex flex-1 gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                <span className="material-symbols-outlined text-[18px]">
                  barcode_reader
                </span>
              </div>
              <input
                type="number"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="SKU numérico del utensilio..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span className="hidden sm:inline">Buscar</span>
            </button>
            <Link
              href="/inventarios/escanear"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-sm font-medium hover:bg-surface-container-high transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                photo_camera
              </span>
              <span className="hidden sm:inline">Cámara</span>
            </Link>
          </form>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
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
            <button
              onClick={() => setTextoBusqueda('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Botón de voz */}
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">mic</span>
          <span className="hidden sm:inline">Voz</span>
        </button>
      </div>

      {/* Filtros rápidos */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {filtros.map((f) => {
          const contador =
            f.valor === 'todos'
              ? utensilios.length
              : f.valor === 'asignados'
                ? totalAsignados
                : totalSinAsignar
          return (
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
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  filtroActivo === f.valor
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {contador}
              </span>
            </button>
          )
        })}
      </div>

      {/* Contador de resultados */}
      <p className="text-on-surface-variant text-xs font-medium mb-4">
        {utensuiliosFiltrados.length} resultado
        {utensuiliosFiltrados.length !== 1 ? 's' : ''}
        {textoBusqueda && ` para "${textoBusqueda}"`}
      </p>

      {/* Lista de utensilios */}
      {utensuiliosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-outline">
              search_off
            </span>
          </div>
          <h3 className="text-on-surface font-semibold text-lg mb-1">
            Sin resultados
          </h3>
          <p className="text-on-surface-variant text-sm max-w-xs">
            No se encontraron utensilios con ese criterio.
          </p>
          <button
            onClick={() => {
              setTextoBusqueda('')
              setFiltroActivo('todos')
            }}
            className="mt-4 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {utensuiliosFiltrados.map((utensilio) => {
            const tieneAsignacion = utensilio.inventory.length > 0
            const estado = tieneAsignacion
              ? configEstado.asignado
              : configEstado.sin_asignar

            // Nombres únicos de cocineras asignadas (cook puede ser array por inferencia de Supabase)
            const cocineras = [
              ...new Set(
                utensilio.inventory
                  .map((inv) => {
                    const cook = Array.isArray(inv.cook) ? inv.cook[0] : inv.cook
                    return cook?.name
                  })
                  .filter(Boolean) as string[]
              ),
            ]

            return (
              <div
                key={utensilio.id}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all border border-surface-container-high/50"
              >
                {/* Header de tarjeta */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px] icon-fill">
                      flatware
                    </span>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estado.bg} ${estado.color}`}
                  >
                    <span className="material-symbols-outlined text-[12px] icon-fill">
                      {estado.icono}
                    </span>
                    {estado.label}
                  </span>
                </div>

                {/* Nombre y SKU */}
                <h3 className="text-on-surface font-semibold text-base mb-1 leading-tight">
                  {utensilio.name}
                </h3>
                {utensilio.sku && (
                  <p className="text-outline text-xs font-mono mb-1">
                    SKU: {utensilio.sku}
                  </p>
                )}
                {utensilio.description && (
                  <p className="text-on-surface-variant text-xs mb-3 line-clamp-2">
                    {utensilio.description}
                  </p>
                )}

                {/* Detalles */}
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-xs">
                      Asignaciones
                    </span>
                    <span className="text-on-surface font-bold text-lg">
                      {utensilio.inventory.length}
                    </span>
                  </div>

                  {cocineras.length > 0 ? (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-on-surface-variant text-xs shrink-0">
                        Cocinera{cocineras.length > 1 ? 's' : ''}
                      </span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {cocineras.slice(0, 2).map((nombre) => (
                          <span
                            key={nombre}
                            className="text-on-surface text-xs font-medium bg-surface-container px-2 py-0.5 rounded-full"
                          >
                            {nombre}
                          </span>
                        ))}
                        {cocineras.length > 2 && (
                          <span className="text-outline text-xs px-2 py-0.5 rounded-full bg-surface-container">
                            +{cocineras.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-on-surface-variant text-xs">
                        Cocinera
                      </span>
                      <span className="text-outline text-xs italic">
                        Sin asignar
                      </span>
                    </div>
                  )}
                </div>

                {/* Barra indicadora de asignación */}
                <div className="mt-4 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${estado.barraColor}`}
                    style={{
                      width: tieneAsignacion
                        ? `${Math.min((utensilio.inventory.length / 5) * 100, 100)}%`
                        : '8%',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
