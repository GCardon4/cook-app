import { crearClienteServidor } from '@/lib/supabase/server'
import VistaInventarios from './components/VistaInventarios'
import type { CocineraResumen } from './components/VistaInventarios'

// Cargar cocineras con conteo de tipos, unidades, teléfono y colegios
async function obtenerCocineras(): Promise<CocineraResumen[]> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('cook')
    .select('id, name, doc, phone, inventory(stock), cook_school(school:school_id(id, name))')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando cocineras:', error.message)
    return []
  }

  return (data ?? []).map((c) => {
    const invRows = c.inventory as { stock: number | null }[]
    const escuelasRaw = c.cook_school as { school: { id: number; name: string } | { id: number; name: string }[] | null }[]
    const escuelas = escuelasRaw
      .map((cs) => {
        const s = Array.isArray(cs.school) ? cs.school[0] : cs.school
        return s as { id: number; name: string } | null
      })
      .filter((s) => s !== null) as { id: number; name: string }[]

    return {
      id: c.id as number,
      name: c.name as string,
      doc: c.doc as number | null,
      phone: c.phone as number | null,
      totalTipos: invRows.length,
      totalUnidades: invRows.reduce((acc, inv) => acc + (inv.stock ?? 1), 0),
      escuelas,
    }
  })
}

export default async function PaginaInventarios() {
  const cocineras = await obtenerCocineras()
  return <VistaInventarios cocineras={cocineras} />
}
