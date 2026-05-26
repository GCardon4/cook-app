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
      created_at,
      inventory(id)
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando utensilios:', error.message)
    return []
  }

  return (data ?? []).map((u) => ({
    id: u.id as number,
    name: u.name as string,
    sku: u.sku as number | null,
    description: u.description as string | null,
    created_at: u.created_at as string,
    asignaciones: (u.inventory as { id: number }[]).length,
  }))
}

export default async function PaginaUtensilios() {
  const utensilios = await obtenerUtensilios()

  const totalAsignados = utensilios.filter((u) => u.asignaciones > 0).length
  const totalSinAsignar = utensilios.filter((u) => u.asignaciones === 0).length

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
            {totalAsignados} asignado{totalAsignados !== 1 ? 's' : ''} ·{' '}
            {totalSinAsignar} sin asignar
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
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <p className="text-on-surface font-bold text-2xl">{utensilios.length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Total</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20 text-center">
          <p className="text-primary font-bold text-2xl">{totalAsignados}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Asignados</p>
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
