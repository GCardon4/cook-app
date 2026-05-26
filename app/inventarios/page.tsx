import { crearClienteServidor } from '@/lib/supabase/server'
import type { UtensilioConInventario } from '@/lib/supabase/types'
import ListaInventarios from './components/ListaInventarios'

// Cargar inventario completo con relaciones desde Supabase
async function obtenerInventario(): Promise<UtensilioConInventario[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('utensils')
    .select(`
      id,
      name,
      sku,
      description,
      created_at,
      updated_at,
      inventory (
        id,
        cook_id,
        created_at,
        cook:cook_id (
          id,
          name
        )
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando inventario:', error.message)
    return []
  }

  return (data ?? []) as unknown as UtensilioConInventario[]
}

export default async function PaginaInventarios() {
  const utensilios = await obtenerInventario()

  return <ListaInventarios utensilios={utensilios} />
}
