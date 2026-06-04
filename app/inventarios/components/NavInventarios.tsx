'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { accionCerrarSesion } from '@/app/login/actions'

// Tabs disponibles según el rol
const tabsAdmin = [
  { href: '/inventarios', icono: 'group', etiqueta: 'Cocineras' },
  { href: '/inventarios/escanear', icono: 'qr_code_scanner', etiqueta: 'Escanear' },
  { href: '/inventarios/asignaciones', icono: 'inventory_2', etiqueta: 'Detalle' },
]

const tabsInventarios = [
  { href: '/inventarios', icono: 'group', etiqueta: 'Cocineras' },
  { href: '/inventarios/escanear', icono: 'qr_code_scanner', etiqueta: 'Escanear' },
]

interface Props {
  esAdmin: boolean
  children: React.ReactNode
}

export default function NavInventarios({ esAdmin, children }: Props) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const rutaActual = usePathname()

  const elementosNav = esAdmin ? tabsAdmin : tabsInventarios

  // Verificar si el enlace de navegación está activo
  const esActivo = (href: string) =>
    href === '/inventarios'
      ? rutaActual === '/inventarios'
      : rutaActual.startsWith(href)

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Header superior */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-6 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
        {/* Logo */}
        <div className="flex flex-col justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotipo-proactivo.svg" alt="PROACTIVO" className="h-7 w-auto" />
          <span className="text-outline text-[9px] font-semibold uppercase tracking-widest mt-0.5">
            Panel Inventarios
          </span>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center gap-2">
          {/* Escanear rápido */}
          <Link
            href="/inventarios/escanear"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Escanear
          </Link>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <span className="material-symbols-outlined text-[22px] icon-fill">person</span>
            </button>

            {menuAbierto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)} />
                <div className="absolute right-0 top-11 z-50 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant/30">
                    <p className="text-on-surface font-semibold text-sm">
                      {esAdmin ? 'Administrador' : 'Cocinera'}
                    </p>
                    <p className="text-on-surface-variant text-xs">Panel de Inventarios</p>
                  </div>

                  {/* Solo admins pueden ir al panel admin */}
                  {esAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuAbierto(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                      Panel Admin
                    </Link>
                  )}

                  <form action={accionCerrarSesion}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-secondary hover:bg-secondary/5 text-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
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
                <span className={`material-symbols-outlined text-[18px] ${activo ? 'icon-fill' : ''}`}>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-end px-2 pb-2 pt-1 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {/* Primer tab */}
        {elementosNav.slice(0, 1).map((item) => {
          const activo = esActivo(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all ${
                activo ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activo ? 'icon-fill' : ''}`}>
                {item.icono}
              </span>
              <span className="text-[10px] font-semibold mt-0.5 tracking-wide">
                {item.etiqueta}
              </span>
            </Link>
          )
        })}

        {/* Botón Home central elevado */}
        <div className="flex flex-col items-center -mt-5 px-4">
          <Link
            href="/"
            className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_4px_16px_rgba(0,159,227,0.40)] hover:shadow-[0_6px_20px_rgba(0,159,227,0.55)] active:scale-95 transition-all"
            title="Inicio"
          >
            <span className="material-symbols-outlined text-[26px] icon-fill">home</span>
          </Link>
          <span className="text-[9px] font-semibold text-on-surface-variant mt-1 tracking-wide">Inicio</span>
        </div>

        {/* Tabs restantes */}
        {elementosNav.slice(1).map((item) => {
          const activo = esActivo(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center px-3 py-1.5 rounded-full transition-all ${
                activo ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${activo ? 'icon-fill' : ''}`}>
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
