import Link from 'next/link'

// Datos de estadísticas del dashboard administrativo
const estadisticas = [
  {
    titulo: 'Colegios Asociados',
    valor: '42',
    icono: 'school',
    colorIcono: 'text-primary',
    bgIcono: 'bg-primary/10',
    etiqueta: 'Activos',
    bgEtiqueta: 'bg-surface-container-high text-on-surface-variant',
  },
  {
    titulo: 'Cocineras Operativas',
    valor: '128',
    icono: 'soup_kitchen',
    colorIcono: 'text-secondary',
    bgIcono: 'bg-secondary/10',
    etiqueta: 'Turno Actual',
    bgEtiqueta: 'bg-surface-container-high text-on-surface-variant',
  },
  {
    titulo: 'Utensilios Totales',
    valor: '1,847',
    icono: 'flatware',
    colorIcono: 'text-primary',
    bgIcono: 'bg-primary/10',
    etiqueta: 'En stock',
    bgEtiqueta: 'bg-primary/10 text-primary',
  },
  {
    titulo: 'Mantenimiento Pendiente',
    valor: '15',
    icono: 'build',
    colorIcono: 'text-tertiary',
    bgIcono: 'bg-tertiary/10',
    etiqueta: 'Revisión',
    bgEtiqueta: 'bg-error-container text-on-error-container',
  },
]

// Alertas de stock bajo
const alertasStock = [
  { nombre: 'Ollas Grandes (30L)', sede: 'Sede Norte', cantidad: '3 unidades', porcentaje: 15, nivel: 'Crítico' },
  { nombre: 'Sartenes Antiadherentes', sede: 'Sede Sur', cantidad: '5 unidades', porcentaje: 25, nivel: 'Bajo' },
  { nombre: 'Tablas de Corte', sede: 'Sede Central', cantidad: '8 unidades', porcentaje: 40, nivel: 'Moderado' },
]

// Acciones rápidas del panel admin
const accionesRapidas = [
  { href: '/admin/utensilios', icono: 'add_circle', texto: 'Registrar Utensilio', desc: 'Agregar nuevo utensilio al sistema' },
  { href: '/admin/asignaciones', icono: 'assignment_ind', texto: 'Asignar Turno', desc: 'Asignar utensilios a cocineras' },
  { href: '/admin/escuelas', icono: 'school', texto: 'Gestionar Escuelas', desc: 'Administrar colegios y sedes' },
  { href: '/inventarios', icono: 'inventory_2', texto: 'Ver Inventario', desc: 'Panel de inventario operativo' },
]

export default function PaginaAdmin() {
  return (
    <div>
      {/* Encabezado de la sección */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
            Resumen Operativo
          </h2>
          <p className="text-on-surface-variant text-base mt-1">
            Monitoreo general de recursos e inventario · Mayo 2026
          </p>
        </div>
        <Link
          href="/admin/utensilios/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nuevo Registro
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
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgIcono} ${stat.colorIcono}`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {stat.icono}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${stat.bgEtiqueta}`}
              >
                {stat.etiqueta}
              </span>
            </div>
            <p className="text-on-surface-variant text-xs font-medium mb-1">
              {stat.titulo}
            </p>
            <p className="text-on-surface font-bold text-3xl">{stat.valor}</p>
          </div>
        ))}
      </div>

      {/* Área principal: Alertas + Acciones rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        {/* Alertas de Stock Bajo */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-error-container/40">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-on-surface text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary icon-fill text-[22px]">
                warning
              </span>
              Alertas de Stock Bajo
            </h3>
            <Link
              href="/admin/utensilios"
              className="text-primary text-xs font-semibold hover:underline"
            >
              Ver Todo
            </Link>
          </div>
          <div className="space-y-5">
            {alertasStock.map((alerta) => {
              const colorBarra =
                alerta.nivel === 'Crítico'
                  ? 'bg-secondary'
                  : alerta.nivel === 'Bajo'
                    ? 'bg-tertiary'
                    : 'bg-primary'
              const colorEtiqueta =
                alerta.nivel === 'Crítico'
                  ? 'text-secondary'
                  : alerta.nivel === 'Bajo'
                    ? 'text-tertiary'
                    : 'text-primary'
              return (
                <div key={alerta.nombre}>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <h4 className="text-on-surface font-medium text-sm">
                        {alerta.nombre}
                      </h4>
                      <p className="text-on-surface-variant text-xs">
                        {alerta.sede} · Quedan {alerta.cantidad}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${colorEtiqueta}`}
                    >
                      {alerta.nivel}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorBarra} rounded-full transition-all duration-500`}
                      style={{ width: `${alerta.porcentaje}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50">
          <h3 className="font-semibold text-on-surface text-lg mb-5">
            Accesos Rápidos
          </h3>
          <div className="space-y-2.5">
            {accionesRapidas.map((accion) => (
              <Link
                key={accion.href}
                href={accion.href}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-surface hover:bg-surface-container-high transition-colors border border-outline-variant/30 group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    {accion.icono}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface font-medium text-sm">
                    {accion.texto}
                  </p>
                  <p className="text-on-surface-variant text-xs truncate">
                    {accion.desc}
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-[18px] group-hover:text-on-surface-variant transition-colors">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Módulo de ingreso por código */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-3xl icon-fill">
              qr_code_scanner
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-on-surface text-lg">
              Módulo de Ingreso por Código de Barras
            </h3>
            <p className="text-on-surface-variant text-sm mt-0.5">
              Escanea o ingresa el código del utensilio para registrar su
              entrada al inventario de forma rápida.
            </p>
          </div>
          <Link
            href="/inventarios"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[18px]">
              qr_code_scanner
            </span>
            Abrir Escáner
          </Link>
        </div>
      </div>
    </div>
  )
}
