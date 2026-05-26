'use client'

import { useState } from 'react'
import Link from 'next/link'

// Categorías de utensilios en el inventario
const categorias = ['Todos', 'Ollas', 'Sartenes', 'Cuchillos', 'Tablas', 'Utensilios Menores']

// Datos de muestra del inventario de utensilios
const utensilios = [
  { id: 1, nombre: 'Olla Grande 30L', sku: '001-OG-30', categoria: 'Ollas', cantidad: 3, estado: 'Crítico', cocinera: 'María García' },
  { id: 2, nombre: 'Sartén Antiadherente 40cm', sku: '002-SA-40', categoria: 'Sartenes', cantidad: 5, estado: 'Bajo', cocinera: 'Ana López' },
  { id: 3, nombre: 'Cuchillo Chef 30cm', sku: '003-CC-30', categoria: 'Cuchillos', cantidad: 18, estado: 'Estable', cocinera: 'Carmen Ruiz' },
  { id: 4, nombre: 'Tabla de Corte Grande', sku: '004-TC-GR', categoria: 'Tablas', cantidad: 8, estado: 'Bajo', cocinera: 'Rosa Martínez' },
  { id: 5, nombre: 'Espátula de Madera', sku: '005-EM-01', categoria: 'Utensilios Menores', cantidad: 24, estado: 'Estable', cocinera: 'Laura Jiménez' },
  { id: 6, nombre: 'Colador Fino 28cm', sku: '006-CF-28', categoria: 'Utensilios Menores', cantidad: 12, estado: 'Estable', cocinera: 'María García' },
  { id: 7, nombre: 'Olla Mediana 15L', sku: '007-OM-15', categoria: 'Ollas', cantidad: 7, estado: 'Estable', cocinera: 'Ana López' },
  { id: 8, nombre: 'Sartén Wok 36cm', sku: '008-SW-36', categoria: 'Sartenes', cantidad: 2, estado: 'Crítico', cocinera: 'Carmen Ruiz' },
]

// Configuración visual de estados
const configEstado: Record<string, { color: string; bg: string; icono: string }> = {
  Crítico: { color: 'text-secondary', bg: 'bg-secondary/10', icono: 'error' },
  Bajo: { color: 'text-tertiary', bg: 'bg-tertiary/10', icono: 'warning' },
  Estable: { color: 'text-primary', bg: 'bg-primary/10', icono: 'check_circle' },
}

export default function PaginaInventarios() {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [codigoManual, setCodigoManual] = useState('')

  // Filtrar utensilios por categoría y búsqueda
  const utensuiliosFiltrados = utensilios.filter((u) => {
    const coincideCategoria =
      categoriaActiva === 'Todos' || u.categoria === categoriaActiva
    const coincideBusqueda =
      textoBusqueda === '' ||
      u.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
      u.sku.toLowerCase().includes(textoBusqueda.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

  // Manejar búsqueda por código de barras manual
  const manejarBusquedaCodigo = (e: React.FormEvent) => {
    e.preventDefault()
    if (codigoManual.trim()) {
      setTextoBusqueda(codigoManual.trim())
      setCodigoManual('')
    }
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
          Inventario Operativo
        </h2>
        <p className="text-on-surface-variant text-base mt-1">
          Control y seguimiento de utensilios de cocina
        </p>
      </div>

      {/* Módulo de ingreso por código de barras */}
      <div className="mb-6 bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl icon-fill">
                qr_code_scanner
              </span>
            </div>
            <div>
              <h3 className="text-on-surface font-semibold text-base">
                Ingreso por Código de Barras
              </h3>
              <p className="text-on-surface-variant text-xs">
                Escanea o ingresa el código SKU del utensilio
              </p>
            </div>
          </div>

          <form
            onSubmit={manejarBusquedaCodigo}
            className="flex flex-1 gap-2 min-w-0"
          >
            <div className="relative flex-1 min-w-0">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                <span className="material-symbols-outlined text-[18px]">
                  barcode_reader
                </span>
              </div>
              <input
                type="text"
                value={codigoManual}
                onChange={(e) => setCodigoManual(e.target.value)}
                placeholder="Código SKU (ej: 001-OG-30)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                search
              </span>
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

      {/* Barra de búsqueda y filtros */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        {/* Búsqueda por texto */}
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
            <span className="material-symbols-outlined text-[20px]">
              search
            </span>
          </div>
          <input
            type="text"
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {textoBusqueda && (
            <button
              onClick={() => setTextoBusqueda('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          )}
        </div>

        {/* Botón de voz */}
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">mic</span>
          <span className="hidden sm:inline">Buscar por voz</span>
        </button>
      </div>

      {/* Filtro por categorías */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              categoriaActiva === cat
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Contador de resultados */}
      <p className="text-on-surface-variant text-xs font-medium mb-4">
        {utensuiliosFiltrados.length} utensilio
        {utensuiliosFiltrados.length !== 1 ? 's' : ''} encontrado
        {utensuiliosFiltrados.length !== 1 ? 's' : ''}
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
            No se encontraron utensilios con ese criterio de búsqueda.
          </p>
          <button
            onClick={() => {
              setTextoBusqueda('')
              setCategoriaActiva('Todos')
            }}
            className="mt-4 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {utensuiliosFiltrados.map((utensilio) => {
            const estadoConfig = configEstado[utensilio.estado]
            return (
              <div
                key={utensilio.id}
                className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all border border-surface-container-high/50 cursor-pointer group"
              >
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px] icon-fill">
                      flatware
                    </span>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estadoConfig.bg} ${estadoConfig.color}`}
                  >
                    <span className="material-symbols-outlined text-[12px] icon-fill">
                      {estadoConfig.icono}
                    </span>
                    {utensilio.estado}
                  </span>
                </div>

                {/* Info del utensilio */}
                <h3 className="text-on-surface font-semibold text-base mb-1 leading-tight">
                  {utensilio.nombre}
                </h3>
                <p className="text-outline text-xs font-mono mb-3">
                  {utensilio.sku}
                </p>

                {/* Detalles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-xs">
                      Cantidad
                    </span>
                    <span className="text-on-surface font-bold text-lg">
                      {utensilio.cantidad}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-xs">
                      Cocinera
                    </span>
                    <span className="text-on-surface text-xs font-medium">
                      {utensilio.cocinera}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-xs">
                      Categoría
                    </span>
                    <span className="text-primary text-xs font-semibold bg-primary/8 px-2 py-0.5 rounded-full">
                      {utensilio.categoria}
                    </span>
                  </div>
                </div>

                {/* Barra de cantidad visual */}
                <div className="mt-4 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      utensilio.estado === 'Crítico'
                        ? 'bg-secondary'
                        : utensilio.estado === 'Bajo'
                          ? 'bg-tertiary'
                          : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min((utensilio.cantidad / 30) * 100, 100)}%`,
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
