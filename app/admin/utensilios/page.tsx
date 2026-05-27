import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import TablaUtensilios from './components/TablaUtensilios'

// Cargar todos los utensilios con conteo de asignaciones
async function obtenerUtensilios() {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('utensils')
    .select(`
      id,
      name,
      sku,
      description,
      stock,
      created_at,
      inventory(id, stock)
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando utensilios:', error.message)
    return []
  }

  return (data ?? []).map((u) => {
    const invRows = u.inventory as { id: number; stock: number | null }[]
    const stockAsignado = invRows.reduce((acc, inv) => acc + (inv.stock ?? 1), 0)
    const stockTotal = (u.stock as number | null) ?? 0
    return {
      id: u.id as number,
      name: u.name as string,
      sku: u.sku as number | null,
      description: u.description as string | null,
      stock: stockTotal,
      stockAsignado,
      stockDisponible: Math.max(0, stockTotal - stockAsignado),
      created_at: u.created_at as string,
      asignaciones: invRows.length,
    }
  })
}

export default async function PaginaUtensilios() {
  const utensilios = await obtenerUtensilios()

  const totalAsignados = utensilios.filter((u) => u.asignaciones > 0).length
  const totalSinAsignar = utensilios.filter((u) => u.asignaciones === 0).length
  const stockTotalGeneral = utensilios.reduce((acc, u) => acc + u.stock, 0)
  const stockDisponibleGeneral = utensilios.reduce((acc, u) => acc + u.stockDisponible, 0)

  return (
    <div>
      {/* Encabezado de sección */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
            >
              Dashboard
            </Link>
            <span className="material-symbols-outlined text-outline text-[16px]">
              chevron_right
            </span>
            <span className="text-on-surface text-sm font-medium">Utensilios</span>
          </div>
          <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
            Gestión de Utensilios
          </h2>
          <p className="text-on-surface-variant text-base mt-1">
            {utensilios.length} registrado{utensilios.length !== 1 ? 's' : ''} ·{' '}
            {stockTotalGeneral} unidad{stockTotalGeneral !== 1 ? 'es' : ''} en total ·{' '}
            {stockDisponibleGeneral} disponible{stockDisponibleGeneral !== 1 ? 's' : ''}
          </p>
        </div>

        <Link
          href="/admin/utensilios/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Utensilio
        </Link>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <p className="text-on-surface font-bold text-2xl">{utensilios.length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Tipos</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <p className="text-on-surface font-bold text-2xl">{stockTotalGeneral}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Stock Total</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20 text-center">
          <p className="text-primary font-bold text-2xl">{stockDisponibleGeneral}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Disponible</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-secondary/20 text-center">
          <p className="text-secondary font-bold text-2xl">{totalSinAsignar}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Sin Asignar</p>
        </div>
      </div>

      {/* Tabla interactiva */}
      <TablaUtensilios utensilios={utensilios} />
    </div>
  )
}
