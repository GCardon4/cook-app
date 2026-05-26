import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import TablaEscuelas from './components/TablaEscuelas'

// Cargar todas las escuelas con conteo de cocineras asignadas
async function obtenerEscuelas() {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('school')
    .select(`
      id,
      name,
      address,
      created_at,
      cook_school (id)
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando escuelas:', error.message)
    return []
  }

  return (data ?? []).map((e) => ({
    id: e.id as number,
    name: e.name as string,
    address: e.address as string | null,
    created_at: e.created_at as string,
    totalCocineras: (e.cook_school as { id: number }[]).length,
  }))
}

export default async function PaginaEscuelas() {
  const escuelas = await obtenerEscuelas()

  const conCocineras = escuelas.filter((e) => e.totalCocineras > 0).length
  const sinCocineras = escuelas.filter((e) => e.totalCocineras === 0).length
  const totalCocineras = escuelas.reduce((acc, e) => acc + e.totalCocineras, 0)

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-on-surface-variant hover:text-on-surface text-sm transition-colors"
            >
              Dashboard
            </Link>
            <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
            <span className="text-on-surface text-sm font-medium">Escuelas</span>
          </div>
          <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
            Gestión de Escuelas
          </h2>
          <p className="text-on-surface-variant text-base mt-1">
            {escuelas.length} institución{escuelas.length !== 1 ? 'es' : ''} registrada{escuelas.length !== 1 ? 's' : ''} ·{' '}
            {totalCocineras} cocinera{totalCocineras !== 1 ? 's' : ''} asignada{totalCocineras !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/escuelas/nueva"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Escuela
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[18px] icon-fill">school</span>
          </div>
          <p className="text-on-surface font-bold text-2xl">{escuelas.length}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Total Escuelas</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[18px] icon-fill">soup_kitchen</span>
          </div>
          <p className="text-primary font-bold text-2xl">{conCocineras}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Con Cocineras</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-secondary/20 text-center">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
          </div>
          <p className="text-secondary font-bold text-2xl">{sinCocineras}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-0.5">Sin Cocineras</p>
        </div>
      </div>

      {/* Tabla interactiva */}
      <TablaEscuelas escuelas={escuelas} />
    </div>
  )
}
