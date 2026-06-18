import { crearClienteServidor } from '@/lib/supabase/server'
import ListaCocineras from './components/ListaCocineras'

export type CocineraConInventario = {
  id: number
  name: string
  doc: number | null
  phone: number | null
  asignaciones: {
    id: number
    stockAsignado: number
    utensilio: {
      id: number
      name: string
      sku: string | null
      stockTotal: number
    }
  }[]
}

export type UtensilioDisponible = {
  id: number
  name: string
  sku: string | null
  stockDisponible: number
}

async function obtenerCocineras(): Promise<CocineraConInventario[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('cook')
    .select(`
      id, name, doc, phone,
      inventory (
        id, stock,
        utensils:utensils_id ( id, name, sku, stock )
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando cocineras:', error.message)
    return []
  }

  return (data ?? []).map((c) => {
    const invRows = c.inventory as {
      id: number
      stock: number | null
      utensils: { id: number; name: string; sku: string | null; stock: number | null } | { id: number; name: string; sku: string | null; stock: number | null }[] | null
    }[]

    const asignaciones = invRows
      .map((inv) => {
        const u = Array.isArray(inv.utensils) ? inv.utensils[0] : inv.utensils
        if (!u) return null
        return {
          id: inv.id,
          stockAsignado: inv.stock ?? 1,
          utensilio: {
            id: u.id,
            name: u.name,
            sku: u.sku,
            stockTotal: u.stock ?? 0,
          },
        }
      })
      .filter(Boolean) as CocineraConInventario['asignaciones']

    return {
      id: c.id as number,
      name: c.name as string,
      doc: c.doc as number | null,
      phone: c.phone as number | null,
      asignaciones,
    }
  })
}

// Utensilios con stock disponible para el selector de agregar
async function obtenerUtensiliosDisponibles(): Promise<UtensilioDisponible[]> {
  const supabase = await crearClienteServidor()

  const { data } = await supabase
    .from('utensils')
    .select('id, name, sku, stock, inventory(stock)')
    .order('name', { ascending: true })

  return (data ?? [])
    .map((u) => {
      const asignado = (u.inventory as { stock: number | null }[]).reduce(
        (acc, inv) => acc + (inv.stock ?? 1), 0
      )
      return {
        id: u.id as number,
        name: u.name as string,
        sku: u.sku != null ? String(u.sku) : null,
        stockDisponible: Math.max(0, ((u.stock as number | null) ?? 0) - asignado),
      }
    })
    .filter((u) => u.stockDisponible > 0)
}

export default async function PaginaAsignaciones() {
  const [cocineras, utensiliosDisponibles] = await Promise.all([
    obtenerCocineras(),
    obtenerUtensiliosDisponibles(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-on-surface font-bold text-2xl md:text-3xl">Cocineras</h2>
        <p className="text-on-surface-variant text-base mt-1">
          {cocineras.length} cocinera{cocineras.length !== 1 ? 's' : ''} ·{' '}
          {cocineras.filter((c) => c.asignaciones.length > 0).length} con utensilios asignados
        </p>
      </div>

      <ListaCocineras cocineras={cocineras} utensiliosDisponibles={utensiliosDisponibles} />
    </div>
  )
}
