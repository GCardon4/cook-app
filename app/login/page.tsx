'use client'

import { useActionState, useState } from 'react'
import { accionLogin, type EstadoLogin } from './actions'
import InstallPWA from '@/components/pwa/InstallPWA'

export default function PaginaLogin() {
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [estado, accion, estaCargando] = useActionState<EstadoLogin, FormData>(
    accionLogin,
    null
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Panel izquierdo: Marca (solo desktop) */}
      <div className="hidden md:flex md:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-primary">
        {/* Patrón decorativo de fondo */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #009FE3 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #009FE3 0%, transparent 70%)',
            transform: 'translate(-30%, 30%)',
          }}
        />

        {/* Encabezado de marca */}
        <div className="relative z-10">
          <div className="mb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logotipo-proactivo.svg" alt="PROACTIVO" className="h-10 w-auto brightness-0 invert" />
          </div>

          <h2 className="text-white font-bold text-4xl leading-tight mb-4">
            Sistema de Gestión
            <br />
            de Cocinas
            <br />
            Industriales
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Control total del inventario de utensilios para cocinas
            industriales. Eficiente, preciso y accesible desde cualquier
            dispositivo.
          </p>
        </div>

        {/* Características del sistema */}
        <div className="relative z-10 space-y-4">
          {[
            { icono: 'qr_code_scanner', texto: 'Escaneo de códigos de barras' },
            { icono: 'mic', texto: 'Comandos de voz integrados' },
            { icono: 'inventory_2', texto: 'Inventario en tiempo real' },
            { icono: 'assignment_ind', texto: 'Asignación de utensilios' },
          ].map((item) => (
            <div key={item.icono} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white/90 text-[18px]">
                  {item.icono}
                </span>
              </div>
              <span className="text-white/80 text-sm font-medium">{item.texto}</span>
            </div>
          ))}

          <div className="pt-6 border-t border-white/20">
            <p className="text-white/50 text-xs">
              © 2026 PROACTIVO · Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho: Formulario de login */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-surface-container-lowest">
        {/* Logo móvil */}
        <div className="md:hidden flex items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logotipo-proactivo.svg" alt="PROACTIVO" className="h-9 w-auto" />
        </div>

        <div className="w-full max-w-md">
          {/* Encabezado del formulario */}
          <div className="mb-8">
            <h2 className="text-on-surface font-bold text-3xl mb-1">Bienvenido</h2>
            <p className="text-on-surface-variant text-base">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          <form action={accion} className="space-y-4">
            {/* Campo Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-on-surface text-sm font-medium mb-1.5"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label
                htmlFor="contrasena"
                className="block text-on-surface text-sm font-medium mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  id="contrasena"
                  name="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {mostrarContrasena ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mensaje de error */}
            {estado?.error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-error-container border border-error/20">
                <span className="material-symbols-outlined text-on-error-container text-[18px] icon-fill">
                  error
                </span>
                <p className="text-on-error-container text-sm">{estado.error}</p>
              </div>
            )}

            {/* Botón de ingreso */}
            <button
              type="submit"
              disabled={estaCargando}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-surface-tint active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {estaCargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px] icon-fill">login</span>
                  Ingresar al Sistema
                </>
              )}
            </button>
          </form>

          {/* Botón de instalación PWA */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30">
            <InstallPWA variante="login" />
          </div>
        </div>
      </div>
    </div>
  )
}
