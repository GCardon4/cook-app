import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import TablaCocineras from './components/TablaCocineras'

// Cargar cocineras con escuelas, utensilios e inventario desde Supabase
async function obtenerCocineras() {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('cook')
    .select(`
      id,
      name,
      doc,
      phone,
      created_at,
      cook_school (
        id,
        school:school_id ( id, name )
      ),
      inventory (
        id,
        utensils:utensils_id ( id, name, sku )
      )
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando cocineras:', error.message)
    return []
  }

  return (data ?? []).map((c) => {
    const cookSchool = c.cook_school as {
      id: number
      school: { id: number; name: string }[] | null
    }[]

    const inventario = c.inventory as {
      id: number
      utensils: { id: number; name: string; sku: number | null }[] | null
    }[]

    const escuelas = cookSchool
      .map((cs) => {
        const s = Array.isArray(cs.school) ? cs.school[0] : cs.school
        return s ? { id: s.id, name: s.name } : null
      })
      .filter(Boolean) as { id: number; name: string }[]

    const utensilios = inventario
      .map((inv) => {
        const u = Array.isArray(inv.utensils) ? inv.utensils[0] : inv.utensils
        return u ? { id: u.id, name: u.name, sku: u.sku } : null
      })
      .filter(Boolean) as { id: number; name: string; sku: number | null }[]

    return {
      id: c.id as number,
      name: c.name as string,
      doc: c.doc as number | null,
      phone: c.phone as number | null,
      created_at: c.created_at as string,
      escuelas,
      utensilios,
      totalUtensilios: inventario.length,
    }
  })
}

// Cargar todas las escuelas disponibles para el modal de asignación
async function obtenerTodasEscuelas() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('school')
    .select('id, name')
    .order('name', { ascending: true })
  return (data ?? []) as { id: number; name: string }[]
}

export default async function PaginaCocineras() {
  const [cocineras, todasEscuelas] = await Promise.all([
    obtenerCocineras(),
    obtenerTodasEscuelas(),
  ])

  const conEscuela = cocineras.filter((c) => c.escuelas.length > 0).length
  const sinEscuela = cocineras.filter((c) => c.escuelas.length === 0).length
  const totalUtensilios = cocineras.reduce((acc, c) => acc + c.totalUtensilios, 0)

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-on-surface-variant hover:text-on-surface text-sm transition-colors">
              Dashboard
            </Link>
            <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
            <span className="text-on-surface text-sm font-medium">Cocineras</span>
          </div>
          <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
            Gestión de Cocineras
          </h2>
          <p className="text-on-surface-variant text-base mt-1">
            {cocineras.length} registrada{cocineras.length !== 1 ? 's' : ''} ·{' '}
            {totalUtensilios} utensilio{totalUtensilios !== 1 ? 's' : ''} asignado{totalUtensilios !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/cocineras/nueva"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Nueva Cocinera
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[18px] icon-fill">soup_kitchen</span>
          </div>
          <p className="text-on-surface font-bold text-2xl">{cocineras.length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Total</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[18px] icon-fill">school</span>
          </div>
          <p className="text-primary font-bold text-2xl">{conEscuela}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Con Escuela</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-secondary/20 text-center">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
          </div>
          <p className="text-secondary font-bold text-2xl">{sinEscuela}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Sin Escuela</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[18px] icon-fill">flatware</span>
          </div>
          <p className="text-on-surface font-bold text-2xl">{totalUtensilios}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Utensilios</p>
        </div>
      </div>

      {/* Tabla interactiva */}
      <TablaCocineras cocineras={cocineras} todasEscuelas={todasEscuelas} />
    </div>
  )
}
