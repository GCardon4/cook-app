import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'

// Cargar todas las métricas del dashboard en paralelo
async function obtenerMetricasDashboard() {
  const supabase = await crearClienteServidor()

  const [
    { count: totalColegios },
    { count: totalCocineras },
    { count: totalUtensilios },
    { count: totalInventario },
    { data: utensuiliosSinAsignar },
    { data: recientesUtensilios },
  ] = await Promise.all([
    supabase.from('school').select('*', { count: 'exact', head: true }),
    supabase.from('cook').select('*', { count: 'exact', head: true }),
    supabase.from('utensils').select('*', { count: 'exact', head: true }),
    supabase.from('inventory').select('*', { count: 'exact', head: true }),
    supabase
      .from('utensils')
      .select('id, name, sku, inventory(id)')
      .order('name'),
    supabase
      .from('utensils')
      .select('id, name, sku, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const sinAsignar = (utensuiliosSinAsignar ?? []).filter(
    (u: { inventory: unknown[] }) => u.inventory.length === 0
  )

  return {
    totalColegios: totalColegios ?? 0,
    totalCocineras: totalCocineras ?? 0,
    totalUtensilios: totalUtensilios ?? 0,
    totalInventario: totalInventario ?? 0,
    sinAsignar,
    recientesUtensilios: recientesUtensilios ?? [],
  }
}

// Acciones rápidas del panel admin
const accionesRapidas = [
  { href: '/admin/utensilios/nuevo', icono: 'add_circle', texto: 'Nuevo Utensilio', desc: 'Registrar utensilio en el sistema' },
  { href: '/admin/utensilios', icono: 'flatware', texto: 'Gestionar Utensilios', desc: 'Ver, editar y eliminar utensilios' },
  { href: '/admin/asignaciones', icono: 'assignment_ind', texto: 'Asignaciones', desc: 'Utensilios asignados a cocineras' },
  { href: '/inventarios', icono: 'inventory_2', texto: 'Panel Inventarios', desc: 'Vista operativa de inventario' },
]

export default async function PaginaAdmin() {
  const {
    totalColegios,
    totalCocineras,
    totalUtensilios,
    totalInventario,
    sinAsignar,
    recientesUtensilios,
  } = await obtenerMetricasDashboard()

  const estadisticas = [
    {
      titulo: 'Colegios Asociados',
      valor: totalColegios.toLocaleString('es-CO'),
      icono: 'school',
      colorIcono: 'text-primary',
      bgIcono: 'bg-primary/10',
      etiqueta: 'Activos',
      bgEtiqueta: 'bg-surface-container-high text-on-surface-variant',
    },
    {
      titulo: 'Cocineras Registradas',
      valor: totalCocineras.toLocaleString('es-CO'),
      icono: 'soup_kitchen',
      colorIcono: 'text-secondary',
      bgIcono: 'bg-secondary/10',
      etiqueta: 'Total',
      bgEtiqueta: 'bg-surface-container-high text-on-surface-variant',
    },
    {
      titulo: 'Utensilios Totales',
      valor: totalUtensilios.toLocaleString('es-CO'),
      icono: 'flatware',
      colorIcono: 'text-primary',
      bgIcono: 'bg-primary/10',
      etiqueta: 'Registrados',
      bgEtiqueta: 'bg-primary/10 text-primary',
    },
    {
      titulo: 'Sin Asignar',
      valor: sinAsignar.length.toLocaleString('es-CO'),
      icono: 'warning',
      colorIcono: 'text-tertiary',
      bgIcono: 'bg-tertiary/10',
      etiqueta: sinAsignar.length > 0 ? 'Revisión' : 'OK',
      bgEtiqueta:
        sinAsignar.length > 0
          ? 'bg-error-container text-on-error-container'
          : 'bg-primary/10 text-primary',
    },
  ]

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
            Resumen Operativo
          </h2>
          <p className="text-on-surface-variant text-base mt-1">
            {totalInventario} asignaciones activas · {totalUtensilios} utensilios registrados
          </p>
        </div>
        <Link
          href="/admin/utensilios/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Utensilio
        </Link>
      </div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {estadisticas.map((stat) => (
          <div
            key={stat.titulo}
            className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-shadow border border-surface-container-high/50"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgIcono} ${stat.colorIcono}`}>
                <span className="material-symbols-outlined text-[22px]">{stat.icono}</span>
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${stat.bgEtiqueta}`}>
                {stat.etiqueta}
              </span>
            </div>
            <p className="text-on-surface-variant text-xs font-medium mb-1">{stat.titulo}</p>
            <p className="text-on-surface font-bold text-3xl">{stat.valor}</p>
          </div>
        ))}
      </div>

      {/* Área principal: Sin Asignar + Acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">

        {/* Utensilios sin asignar */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-error-container/40">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-on-surface text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary icon-fill text-[22px]">warning</span>
              Utensilios Sin Asignar
            </h3>
            <Link href="/admin/utensilios" className="text-primary text-xs font-semibold hover:underline">
              Ver Todos
            </Link>
          </div>

          {sinAsignar.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-2xl icon-fill">check_circle</span>
              </div>
              <p className="text-on-surface font-semibold text-sm">¡Todo asignado!</p>
              <p className="text-on-surface-variant text-xs mt-1">Todos los utensilios tienen cocinera asignada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(sinAsignar as { id: number; name: string; sku: number | null }[])
                .slice(0, 6)
                .map((u, idx) => {
                  const porcentaje = Math.max(10, 100 - (idx + 1) * 15)
                  return (
                    <div key={u.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <span className="text-on-surface font-medium text-sm">{u.name}</span>
                          {u.sku && (
                            <span className="text-outline text-xs font-mono ml-2">SKU: {u.sku}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-secondary uppercase tracking-wider">Sin Asignar</span>
                          <Link
                            href={`/admin/utensilios/${u.id}/editar`}
                            className="text-[10px] font-semibold text-primary hover:underline"
                          >
                            Gestionar
                          </Link>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary/40 rounded-full"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              {sinAsignar.length > 6 && (
                <p className="text-on-surface-variant text-xs text-center pt-2">
                  y {sinAsignar.length - 6} más sin asignar...
                  <Link href="/admin/utensilios" className="text-primary font-semibold ml-1 hover:underline">Ver todos</Link>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50">
          <h3 className="font-semibold text-on-surface text-lg mb-5">Accesos Rápidos</h3>
          <div className="space-y-2.5">
            {accionesRapidas.map((accion) => (
              <Link
                key={accion.href}
                href={accion.href}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-surface hover:bg-surface-container-high transition-colors border border-outline-variant/30 group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{accion.icono}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-medium text-sm">{accion.texto}</p>
                  <p className="text-on-surface-variant text-xs truncate">{accion.desc}</p>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-[18px] group-hover:text-on-surface-variant transition-colors">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Utensilios registrados recientemente */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-on-surface text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">schedule</span>
            Registrados Recientemente
          </h3>
          <Link href="/admin/utensilios/nuevo" className="flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Agregar
          </Link>
        </div>

        {recientesUtensilios.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-on-surface-variant text-sm">No hay utensilios registrados aún.</p>
            <Link href="/admin/utensilios/nuevo" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-surface-tint transition-colors">
              <span className="material-symbols-outlined text-[16px]">add</span>
              Registrar el primero
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {(recientesUtensilios as { id: number; name: string; sku: number | null; created_at: string }[]).map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">flatware</span>
                  </div>
                  <div>
                    <p className="text-on-surface font-medium text-sm">{u.name}</p>
                    {u.sku && <p className="text-outline text-xs font-mono">SKU: {u.sku}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-on-surface-variant text-xs hidden sm:block">
                    {new Date(u.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </span>
                  <Link
                    href={`/admin/utensilios/${u.id}/editar`}
                    className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
