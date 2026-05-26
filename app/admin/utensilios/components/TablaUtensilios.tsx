'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { eliminarUtensilio } from '../actions'

type FilaUtensilio = {
  id: number
  name: string
  sku: number | null
  description: string | null
  created_at: string
  asignaciones: number
}

interface Props {
  utensilios: FilaUtensilio[]
}

export default function TablaUtensilios({ utensilios }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)
  const [mensajeGlobal, setMensajeGlobal] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filtrar utensilios por nombre, SKU o descripción
  const utensuiliosFiltrados = utensilios.filter((u) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.sku?.toString().includes(q) ||
      (u.description ?? '').toLowerCase().includes(q)
    )
  })

  // Ejecutar eliminación con confirmación inline
  const manejarEliminar = (id: number) => {
    setMensajeGlobal(null)
    startTransition(async () => {
      const resultado = await eliminarUtensilio(id)
      setConfirmandoId(null)
      if (resultado?.error) {
        setMensajeGlobal({ tipo: 'error', texto: resultado.error })
      } else if (resultado?.exito) {
        setMensajeGlobal({ tipo: 'exito', texto: resultado.exito })
      }
    })
  }

  return (
    <div>
      {/* Mensaje global de feedback */}
      {mensajeGlobal && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl mb-5 text-sm ${
            mensajeGlobal.tipo === 'error'
              ? 'bg-error-container text-on-error-container'
              : 'bg-primary/10 text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] icon-fill">
            {mensajeGlobal.tipo === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="flex-1">{mensajeGlobal.texto}</span>
          <button onClick={() => setMensajeGlobal(null)}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Barra de búsqueda + botón nuevo */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, SKU o descripción..."
            className="w-full pl-11 pr-10 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
        <Link
          href="/admin/utensilios/nuevo"
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo Utensilio
        </Link>
      </div>

      {/* Contador */}
      <p className="text-on-surface-variant text-xs font-medium mb-4">
        {utensuiliosFiltrados.length} de {utensilios.length} utensilio
        {utensilios.length !== 1 ? 's' : ''}
        {busqueda && ` · filtrado por "${busqueda}"`}
      </p>

      {/* Tabla / Lista */}
      {utensuiliosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/50">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl text-outline">
              {busqueda ? 'search_off' : 'flatware'}
            </span>
          </div>
          <h3 className="text-on-surface font-semibold text-base mb-1">
            {busqueda ? 'Sin resultados' : 'No hay utensilios'}
          </h3>
          <p className="text-on-surface-variant text-sm max-w-xs">
            {busqueda
              ? 'No hay utensilios que coincidan con tu búsqueda.'
              : 'Registra el primer utensilio del sistema.'}
          </p>
          {busqueda ? (
            <button
              onClick={() => setBusqueda('')}
              className="mt-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-colors"
            >
              Limpiar búsqueda
            </button>
          ) : (
            <Link
              href="/admin/utensilios/nuevo"
              className="mt-4 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Registrar utensilio
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Vista tabla (desktop) */}
          <div className="hidden md:block bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                    Utensilio
                  </th>
                  <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                    SKU
                  </th>
                  <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline hidden lg:table-cell">
                    Descripción
                  </th>
                  <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                    Asignaciones
                  </th>
                  <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline hidden xl:table-cell">
                    Registrado
                  </th>
                  <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {utensuiliosFiltrados.map((utensilio) => (
                  <tr
                    key={utensilio.id}
                    className="border-b border-outline-variant/15 hover:bg-surface-container-low/50 transition-colors last:border-0"
                  >
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px] icon-fill">flatware</span>
                        </div>
                        <span className="text-on-surface font-medium text-sm">{utensilio.name}</span>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-4">
                      {utensilio.sku ? (
                        <span className="text-outline text-xs font-mono bg-surface-container px-2 py-1 rounded-lg">
                          {utensilio.sku}
                        </span>
                      ) : (
                        <span className="text-outline text-xs italic">—</span>
                      )}
                    </td>

                    {/* Descripción */}
                    <td className="px-4 py-4 hidden lg:table-cell max-w-xs">
                      <span className="text-on-surface-variant text-xs line-clamp-2">
                        {utensilio.description || <span className="italic text-outline">Sin descripción</span>}
                      </span>
                    </td>

                    {/* Asignaciones */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full text-xs font-bold px-2 ${
                          utensilio.asignaciones === 0
                            ? 'bg-secondary/10 text-secondary'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {utensilio.asignaciones}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <span className="text-on-surface-variant text-xs">
                        {new Date(utensilio.created_at).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      {confirmandoId === utensilio.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-on-surface-variant text-xs">¿Eliminar?</span>
                          <button
                            onClick={() => manejarEliminar(utensilio.id)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50"
                          >
                            {isPending ? '...' : 'Sí'}
                          </button>
                          <button
                            onClick={() => setConfirmandoId(null)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            href={`/admin/utensilios/${utensilio.id}/editar`}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>
                          <button
                            onClick={() => setConfirmandoId(utensilio.id)}
                            className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista tarjetas (móvil) */}
          <div className="md:hidden space-y-3">
            {utensuiliosFiltrados.map((utensilio) => (
              <div
                key={utensilio.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] icon-fill">flatware</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-on-surface font-semibold text-sm truncate">{utensilio.name}</p>
                      {utensilio.sku && (
                        <p className="text-outline text-xs font-mono">SKU: {utensilio.sku}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
                      utensilio.asignaciones === 0
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {utensilio.asignaciones} asig.
                  </span>
                </div>

                {utensilio.description && (
                  <p className="text-on-surface-variant text-xs mb-3 line-clamp-2">
                    {utensilio.description}
                  </p>
                )}

                {confirmandoId === utensilio.id ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant text-xs flex-1">¿Confirmar eliminación?</span>
                    <button
                      onClick={() => manejarEliminar(utensilio.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold disabled:opacity-50"
                    >
                      {isPending ? '...' : 'Eliminar'}
                    </button>
                    <button
                      onClick={() => setConfirmandoId(null)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                    <Link
                      href={`/admin/utensilios/${utensilio.id}/editar`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Editar
                    </Link>
                    <button
                      onClick={() => setConfirmandoId(utensilio.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary/10 text-secondary text-xs font-semibold hover:bg-secondary/15 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
