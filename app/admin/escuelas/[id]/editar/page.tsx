import Link from 'next/link'
import { notFound } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { actualizarEscuela } from '../../actions'
import FormularioEscuela from '../../components/FormularioEscuela'

// Cargar escuela con cocineras asignadas
async function obtenerEscuela(id: number) {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('school')
    .select(`
      id,
      name,
      address,
      created_at,
      cook_school (
        id,
        cook:cook_id ( id, name )
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

export default async function PaginaEditarEscuela({ params }: Props) {
  const { id: idStr } = await params
  const id = Number(idStr)

  if (isNaN(id)) notFound()

  const escuela = await obtenerEscuela(id)
  if (!escuela) notFound()

  const cookSchool = escuela.cook_school as {
    id: number
    cook: { id: number; name: string }[] | null
  }[]

  const totalCocineras = cookSchool.length

  const accionActualizar = actualizarEscuela.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Migas de pan */}
      <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
        <Link href="/admin" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <Link href="/admin/escuelas" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Escuelas
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium truncate max-w-[220px]">{escuela.name}</span>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] icon-fill">edit</span>
            </div>
            <div>
              <h2 className="text-on-surface font-bold text-xl">Editar Escuela</h2>
              <p className="text-on-surface-variant text-sm mt-0.5">
                Modifica la información de la institución
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              totalCocineras > 0
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary/10 text-secondary'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] icon-fill">soup_kitchen</span>
            {totalCocineras} cocinera{totalCocineras !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Formulario */}
        <div className="p-6">
          <FormularioEscuela
            accion={accionActualizar}
            esEdicion
            valoresIniciales={{
              nombre: escuela.name,
              direccion: escuela.address ?? '',
            }}
          />
        </div>
      </div>

      {/* Panel de cocineras asignadas */}
      {totalCocineras > 0 && (
        <div className="mt-4 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">
              soup_kitchen
            </span>
            <h3 className="text-on-surface font-semibold text-sm">
              Cocineras en esta Escuela ({totalCocineras})
            </h3>
          </div>
          <ul className="divide-y divide-outline-variant/15">
            {cookSchool.map((cs) => {
              const cocinera = Array.isArray(cs.cook) ? cs.cook[0] : cs.cook
              return (
                <li key={cs.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[14px] icon-fill">
                      person
                    </span>
                  </div>
                  <span className="text-on-surface text-sm">
                    {cocinera?.name ?? 'Sin nombre'}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="px-6 py-3 bg-surface-container/40 border-t border-outline-variant/20">
            <p className="text-on-surface-variant text-xs">
              Para eliminar esta escuela, primero debes liberar las asignaciones de cocineras.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
