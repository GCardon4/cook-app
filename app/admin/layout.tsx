'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { accionCerrarSesion } from '@/app/login/actions'

// Elementos de navegación del panel admin
const elementosNav = [
  { href: '/admin', icono: 'dashboard', etiqueta: 'Dashboard' },
  { href: '/admin/escuelas', icono: 'school', etiqueta: 'Escuelas' },
  { href: '/admin/cocineras', icono: 'soup_kitchen', etiqueta: 'Cocineras' },
  { href: '/admin/utensilios', icono: 'flatware', etiqueta: 'Utensilios' },
  { href: '/admin/asignaciones', icono: 'assignment_ind', etiqueta: 'Asignaciones' },
  { href: '/admin/reportes', icono: 'bar_chart', etiqueta: 'Reportes' },
  { href: '/admin/configuracion', icono: 'settings', etiqueta: 'Configuración' },
]

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const rutaActual = usePathname()

  // Verificar si el enlace de navegación está activo
  const esActivo = (href: string) =>
    href === '/admin' ? rutaActual === '/admin' : rutaActual.startsWith(href)

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Overlay móvil para cerrar sidebar */}
      {sidebarAbierto && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      {/* Sidebar de navegación (desktop fijo, mobile deslizable) */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-surface-container-lowest shadow-xl rounded-r-2xl transition-transform duration-300 md:translate-x-0 ${
          sidebarAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo y perfil en el sidebar */}
        <div className="px-6 py-6 border-b border-outline-variant/40">
          <div className="mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logotipo-proactivo.svg" alt="PROACTIVO" className="h-8 w-auto" />
            <span className="block text-outline text-[10px] font-semibold uppercase tracking-widest mt-1">
              Panel Admin
            </span>
          </div>

          {/* Info del usuario */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container">
            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] icon-fill">
                person
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-on-surface font-medium text-sm truncate">
                Administrador
              </p>
              <p className="text-on-surface-variant text-xs truncate">
                Sede Central
              </p>
            </div>
          </div>
        </div>

        {/* Lista de navegación */}
        <ul className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {elementosNav.map((item) => {
            const activo = esActivo(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarAbierto(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activo
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${activo ? 'icon-fill' : ''}`}
                  >
                    {item.icono}
                  </span>
                  <span className="text-sm">{item.etiqueta}</span>
                  {activo && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Botón cerrar sesión */}
        <div className="px-3 py-4 border-t border-outline-variant/40">
          <form action={accionCerrarSesion}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-secondary/5 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[22px]">
                logout
              </span>
              Cerrar Sesión
            </button>
          </form>
        </div>
      </nav>

      {/* Header superior */}
      <header className="fixed top-0 left-0 right-0 z-30 md:left-72 flex items-center justify-between px-6 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="hidden md:block">
            <h2 className="text-on-surface font-semibold text-base leading-none">
              Panel de Administración
            </h2>
            <p className="text-on-surface-variant text-xs mt-0.5">
              PROACTIVO · Sistema de Gestión
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de voz */}
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-[22px]">mic</span>
          </button>
          {/* Notificaciones */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
          </button>
          {/* Ir a inventarios */}
          <Link
            href="/inventarios"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              inventory_2
            </span>
            Inventarios
          </Link>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="pt-16 md:pl-72 min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Navegación inferior móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {elementosNav.slice(0, 4).map((item) => {
          const activo = esActivo(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all ${
                activo
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${activo ? 'icon-fill' : ''}`}
              >
                {item.icono}
              </span>
              <span className="text-[10px] font-semibold mt-0.5 tracking-wide">
                {item.etiqueta}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
