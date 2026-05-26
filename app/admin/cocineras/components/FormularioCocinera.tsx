'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { EstadoFormularioCocinera } from '../actions'

interface Props {
  accion: (estado: EstadoFormularioCocinera, datos: FormData) => Promise<EstadoFormularioCocinera>
  valoresIniciales?: {
    nombre: string
    doc: string
    phone: string
  }
  esEdicion?: boolean
}

const estadoInicial: EstadoFormularioCocinera = null

export default function FormularioCocinera({
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
      {/* Error */}
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
        <label htmlFor="nombre" className="block text-on-surface text-sm font-semibold mb-1.5">
          Nombre Completo <span className="text-secondary ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </div>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            defaultValue={valoresIniciales?.nombre ?? ''}
            placeholder="Nombre y apellido de la cocinera"
            maxLength={100}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <p className="text-outline text-xs mt-1.5">
          Nombre completo tal como aparece en el documento de identidad.
        </p>
      </div>

      {/* Cédula y Teléfono en fila */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Cédula */}
        <div>
          <label htmlFor="doc" className="block text-on-surface text-sm font-semibold mb-1.5">
            Cédula
            <span className="text-on-surface-variant text-xs font-normal ml-2">(Opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <input
              id="doc"
              name="doc"
              type="number"
              defaultValue={valoresIniciales?.doc ?? ''}
              placeholder="Número de cédula"
              min={1}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="text-outline text-xs mt-1.5">Debe ser único en el sistema.</p>
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="phone" className="block text-on-surface text-sm font-semibold mb-1.5">
            Teléfono / Contacto
            <span className="text-on-surface-variant text-xs font-normal ml-2">(Opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
              <span className="material-symbols-outlined text-[20px]">phone</span>
            </div>
            <input
              id="phone"
              name="phone"
              type="number"
              defaultValue={valoresIniciales?.phone ?? ''}
              placeholder="Número de contacto"
              min={1}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <p className="text-outline text-xs mt-1.5">Celular o fijo de contacto.</p>
        </div>
      </div>

      <div className="border-t border-outline-variant/30 pt-2" />

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Link
          href="/admin/cocineras"
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
                {esEdicion ? 'save' : 'person_add'}
              </span>
              {esEdicion ? 'Guardar Cambios' : 'Registrar Cocinera'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
