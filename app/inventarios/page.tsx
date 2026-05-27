import { crearClienteServidor } from '@/lib/supabase/server'
import type { UtensilioConInventario } from '@/lib/supabase/types'
import ListaInventarios from './components/ListaInventarios'

async function obtenerInventario(): Promise<UtensilioConInventario[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('utensils')
    .select(`
      id, name, sku, description, stock, created_at, updated_at,
      inventory (
        id, cook_id, stock, created_at,
        cook:cook_id ( id, name )
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando inventario:', error.message)
    return []
  }

  return (data ?? []) as unknown as UtensilioConInventario[]
}

async function obtenerCocineras() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('cook')
    .select('id, name')
    .order('name', { ascending: true })
  return (data ?? []) as { id: number; name: string }[]
}

export default async function PaginaInventarios() {
  const [utensilios, cocineras] = await Promise.all([
    obtenerInventario(),
    obtenerCocineras(),
  ])

  return <ListaInventarios utensilios={utensilios} cocineras={cocineras} />
}
