'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { accionCerrarSesion } from '@/app/login/actions'

// Elementos de navegación del panel de inventarios
const elementosNav = [
  { href: '/inventarios', icono: 'inventory_2', etiqueta: 'Inventario' },
  { href: '/inventarios/escanear', icono: 'qr_code_scanner', etiqueta: 'Escanear' },
  { href: '/inventarios/asignaciones', icono: 'assignment_ind', etiqueta: 'Mis Asignaciones' },
  { href: '/inventarios/historial', icono: 'history', etiqueta: 'Historial' },
]

export default function LayoutInventarios({
  children,
}: {
  children: React.ReactNode
}) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rutaActual = usePathname()

  // Verificar si el enlace de navegación está activo
  const esActivo = (href: string) =>
    href === '/inventarios'
      ? rutaActual === '/inventarios'
      : rutaActual.startsWith(href)

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Header superior para el panel de inventarios */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        {/* Logo + título */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg icon-fill">
              inventory_2
            </span>
          </div>
          <div>
            <h1 className="font-bold text-on-surface text-base leading-none">
              KitchenLogix
            </h1>
            <span className="text-outline text-[10px] font-semibold uppercase tracking-widest">
              Panel Inventarios
            </span>
          </div>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center gap-2">
          {/* Botón de voz */}
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-primary hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-[22px]">mic</span>
          </button>

          {/* Escanear rápido */}
          <Link
            href="/inventarios/escanear"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-surface-tint transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              qr_code_scanner
            </span>
            Escanear
          </Link>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px] icon-fill">
                person
              </span>
            </button>

            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/30">
                    <p className="text-on-surface font-semibold text-sm">
                      Cocinera
                    </p>
                    <p className="text-on-surface-variant text-xs">
                      Panel de Inventarios
                    </p>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      admin_panel_settings
                    </span>
                    Panel Admin
                  </Link>
                  <form action={accionCerrarSesion}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-secondary hover:bg-secondary/5 text-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      Cerrar Sesión
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navegación de pestañas (desktop) */}
      <div className="hidden md:block fixed top-16 left-0 right-0 z-30 bg-surface-container-lowest/80 backdrop-blur-sm border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {elementosNav.map((item) => {
            const activo = esActivo(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activo
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${activo ? 'icon-fill' : ''}`}
                >
                  {item.icono}
                </span>
                {item.etiqueta}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Contenido principal */}
      <main className="pt-16 md:pt-28 pb-20 md:pb-8 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Navegación inferior móvil */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center px-2 py-2 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {elementosNav.map((item) => {
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
