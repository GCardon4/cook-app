import Link from 'next/link'
import { notFound } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { actualizarCocinera } from '../../actions'
import FormularioCocinera from '../../components/FormularioCocinera'

// Cargar cocinera con escuelas e inventario
async function obtenerCocinera(id: number) {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('cook')
    .select(`
      id, name, doc, phone, created_at,
      cook_school (
        id,
        school:school_id ( id, name )
      ),
      inventory (
        id,
        utensils:utensils_id ( id, name, sku )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaginaEditarCocinera({ params }: Props) {
  const { id: idStr } = await params
  const id = Number(idStr)

  if (isNaN(id)) notFound()

  const cocinera = await obtenerCocinera(id)
  if (!cocinera) notFound()

  const cookSchool = cocinera.cook_school as {
    id: number
    school: { id: number; name: string }[] | null
  }[]

  const inventario = cocinera.inventory as {
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

  const accionActualizar = actualizarCocinera.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Migas de pan */}
      <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
        <Link href="/admin" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <Link href="/admin/cocineras" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Cocineras
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium truncate max-w-[200px]">{cocinera.name}</span>
      </div>

      {/* Formulario */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
              {cocinera.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-on-surface font-bold text-xl">Editar Cocinera</h2>
              <p className="text-on-surface-variant text-sm mt-0.5 truncate max-w-[220px]">
                {cocinera.name}
              </p>
            </div>
          </div>
          {/* Métricas rápidas */}
          <div className="flex gap-2 shrink-0">
            <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
              escuelas.length > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
            }`}>
              <span className="material-symbols-outlined text-[14px] icon-fill">school</span>
              {escuelas.length}
            </span>
            <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
              utensilios.length > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
            }`}>
              <span className="material-symbols-outlined text-[14px]">flatware</span>
              {utensilios.length}
            </span>
          </div>
        </div>

        <div className="p-6">
          <FormularioCocinera
            accion={accionActualizar}
            esEdicion
            valoresIniciales={{
              nombre: cocinera.name,
              doc: cocinera.doc?.toString() ?? '',
              phone: cocinera.phone?.toString() ?? '',
            }}
          />
        </div>
      </div>

      {/* Panel de escuelas asignadas */}
      {escuelas.length > 0 && (
        <div className="mt-4 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] icon-fill">school</span>
              <h3 className="text-on-surface font-semibold text-sm">
                Escuelas Asignadas ({escuelas.length})
              </h3>
            </div>
          </div>
          <ul className="divide-y divide-outline-variant/15">
            {escuelas.map((e) => (
              <li key={e.id} className="px-6 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] icon-fill">school</span>
                </div>
                <span className="text-on-surface text-sm">{e.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Panel de utensilios en inventario */}
      {utensilios.length > 0 && (
        <div className="mt-4 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px] icon-fill">flatware</span>
            <h3 className="text-on-surface font-semibold text-sm">
              Utensilios en Inventario ({utensilios.length})
            </h3>
          </div>
          <ul className="divide-y divide-outline-variant/15">
            {utensilios.map((u) => (
              <li key={u.id} className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px]">flatware</span>
                  </div>
                  <span className="text-on-surface text-sm">{u.name}</span>
                </div>
                {u.sku && (
                  <span className="text-outline text-xs font-mono bg-surface-container px-2 py-0.5 rounded-lg shrink-0">
                    {u.sku}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="px-6 py-3 bg-surface-container/40 border-t border-outline-variant/20">
            <p className="text-on-surface-variant text-xs">
              Para eliminar esta cocinera debes liberar primero los utensilios del inventario y las escuelas asignadas.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
