import { crearClienteServidor } from '@/lib/supabase/server'
import VistaInventarios from './components/VistaInventarios'
import type { CocineraResumen } from './components/VistaInventarios'

// Cargar cocineras con conteo de tipos, unidades y teléfono
async function obtenerCocineras(): Promise<CocineraResumen[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('cook')
    .select('id, name, doc, phone, inventory(stock)')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando cocineras:', error.message)
    return []
  }

  return (data ?? []).map((c) => {
    const invRows = c.inventory as { stock: number | null }[]
    return {
      id: c.id as number,
      name: c.name as string,
      doc: c.doc as number | null,
      phone: c.phone as number | null,
      totalTipos: invRows.length,
      totalUnidades: invRows.reduce((acc, inv) => acc + (inv.stock ?? 1), 0),
    }
  })
}

export default async function PaginaInventarios() {
  const cocineras = await obtenerCocineras()
  return <VistaInventarios cocineras={cocineras} />
}
