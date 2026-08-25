import { crearClienteServidor } from '@/lib/supabase/server'
import { VistaAsignaciones } from './components/VistaAsignaciones'

export type AsignacionHistorial = {
  id: number
  cocineraId: number
  cocinera: { id: number; name: string }
  utensilioId: number
  utensilio: { id: number; name: string; sku: string | null }
  cantidad: number
  tipo: 'agregado' | 'entregado'
  fechaAsignacion: string
  notas: string | null
  status: boolean
  colegio: { id: number; name: string } | null
}

async function obtenerHistorialAsignaciones(): Promise<AsignacionHistorial[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('inventory_movements')
    .select(
      `
      id,
      cook_id,
      cook:cook_id(id, name),
      utensils_id,
      utensils:utensils_id(id, name, sku),
      quantity,
      type,
      created_at,
      notes,
      status,
      school:school_id(id, name)
    `
    )
    .order('created_at', { ascending: false })

  if (error) return []

  return (data ?? []).map((row: any) => {
    const school = Array.isArray(row.school) ? row.school[0] : row.school
    return {
      id: row.id,
      cocineraId: row.cook_id,
      cocinera: row.cook,
      utensilioId: row.utensils_id,
      utensilio: row.utensils,
      cantidad: row.quantity ?? 1,
      tipo: row.type as 'agregado' | 'entregado',
      fechaAsignacion: row.created_at,
      notas: row.notes,
      status: row.status ?? true,
      colegio: school as { id: number; name: string } | null,
    }
  })
}

export default async function PaginaAsignaciones() {
  const historial = await obtenerHistorialAsignaciones()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-on-surface font-bold text-2xl md:text-3xl">Historial de Asignaciones</h2>
        <p className="text-on-surface-variant text-base mt-1">
          Seguimiento completo de utensilios asignados a cocineras
        </p>
      </div>

      <VistaAsignaciones historialInicial={historial} />
    </div>
  )
}
