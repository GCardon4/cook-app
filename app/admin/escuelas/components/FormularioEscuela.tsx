'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { EstadoFormularioEscuela } from '../actions'

interface Props {
  accion: (estado: EstadoFormularioEscuela, datos: FormData) => Promise<EstadoFormularioEscuela>
  valoresIniciales?: {
    nombre: string
    direccion: string
  }
  esEdicion?: boolean
}

const estadoInicial: EstadoFormularioEscuela = null

export default function FormularioEscuela({
  accion,
  valoresIniciales,
  esEdicion = false,
}: Props) {
  const [estado, accionFormulario, estaCargando] = useActionState(
    accion,
    estadoInicial
  )

  return (
    <form action={accionFormulario} className="space-y-6">
      {/* Mensaje de error */}
      {estado?.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error-container border border-error/20">
          <span className="material-symbols-outlined text-on-error-container text-[20px] icon-fill shrink-0 mt-0.5">
            error
          </span>
          <p className="text-on-error-container text-sm">{estado.error}</p>
        </div>
      )}

      {/* Nombre */}
      <div>
        <label
          htmlFor="nombre"
          className="block text-on-surface text-sm font-semibold mb-1.5"
        >
          Nombre de la Institución
          <span className="text-secondary ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={valoresIniciales?.nombre ?? ''}
            placeholder="Ej: Institución Educativa San José"
            maxLength={120}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <p className="text-outline text-xs mt-1.5">
          Nombre oficial de la institución o colegio.
        </p>
      </div>

      {/* Dirección */}
      <div>
        <label
          htmlFor="direccion"
          className="block text-on-surface text-sm font-semibold mb-1.5"
        >
          Dirección
          <span className="text-on-surface-variant text-xs font-normal ml-2">(Opcional)</span>
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-3.5 text-outline">
            <span className="material-symbols-outlined text-[20px]">location_on</span>
          </div>
          <textarea
            id="direccion"
            name="direccion"
            rows={2}
            defaultValue={valoresIniciales?.direccion ?? ''}
            placeholder="Calle, barrio, municipio..."
            maxLength={200}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
          />
        </div>
        <p className="text-outline text-xs mt-1.5">
          Dirección completa o referencia de ubicación de la sede.
        </p>
      </div>

      <div className="border-t border-outline-variant/30 pt-2" />

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Link
          href="/admin/escuelas"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={estaCargando}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint active:scale-[0.99] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {estaCargando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {esEdicion ? 'Guardando...' : 'Registrando...'}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px] icon-fill">
                {esEdicion ? 'save' : 'add_circle'}
              </span>
              {esEdicion ? 'Guardar Cambios' : 'Registrar Escuela'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
