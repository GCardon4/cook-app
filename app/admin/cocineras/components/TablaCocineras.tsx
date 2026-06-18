'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { eliminarCocinera, asignarEscuelasCocinera } from '../actions'

type EscuelaAsignada = { id: number; name: string }
type UtensilioAsignado = { id: number; name: string; sku: string | null }

type FilaCocinera = {
  id: number
  name: string
  doc: number | null
  phone: number | null
  created_at: string
  escuelas: EscuelaAsignada[]
  utensilios: UtensilioAsignado[]
  totalUtensilios: number
}

interface Props {
  cocineras: FilaCocinera[]
  todasEscuelas: { id: number; name: string }[]
}

// Formatear número de cédula con puntos de miles
function formatearDoc(doc: number | null): string {
  if (!doc) return '—'
  return doc.toLocaleString('es-CO')
}

// Formatear número de teléfono colombiano
function formatearPhone(phone: number | null): string {
  if (!phone) return '—'
  const str = phone.toString()
  if (str.length === 10) return `${str.slice(0, 3)} ${str.slice(3, 6)} ${str.slice(6)}`
  return str
}

// Construir URL de WhatsApp con listado de utensilios asignados
function construirUrlWhatsApp(cocinera: FilaCocinera): string {
  const listaUtensilios =
    cocinera.utensilios.length > 0
      ? cocinera.utensilios
          .map((u) => `• ${u.name}${u.sku ? ` (Ref: ${u.sku})` : ''}`)
          .join('\n')
      : '• Sin utensilios asignados'

  const escuelas =
    cocinera.escuelas.length > 0
      ? cocinera.escuelas.map((e) => e.name).join(', ')
      : 'Sin escuela asignada'

  const mensaje =
    `Hola ${cocinera.name}! 👋\n\n` +
    `Aquí está tu listado de utensilios asignados:\n\n` +
    `${listaUtensilios}\n\n` +
    `Total: ${cocinera.totalUtensilios} utensilio(s)\n` +
    `Escuela(s): ${escuelas}\n\n` +
    `_PROACTIVO_ 🍽️`

  return `https://wa.me/57${cocinera.phone}?text=${encodeURIComponent(mensaje)}`
}

export default function TablaCocineras({ cocineras, todasEscuelas }: Props) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)
  const [mensajeGlobal, setMensajeGlobal] = useState<{
    tipo: 'error' | 'exito'
    texto: string
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Estado del modal de asignación de escuelas
  const [modalEscuelasId, setModalEscuelasId] = useState<number | null>(null)
  const [escuelasSeleccionadas, setEscuelasSeleccionadas] = useState<Set<number>>(new Set())
  const [guardandoEscuelas, setGuardandoEscuelas] = useState(false)

  // Filtrar por nombre, cédula o escuela
  const cocinerasFiltradas = cocineras.filter((c) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.doc?.toString().includes(q) ||
      c.escuelas.some((e) => e.name.toLowerCase().includes(q))
    )
  })

  // Abrir modal con escuelas actuales de la cocinera preseleccionadas
  const abrirModalEscuelas = (cocinera: FilaCocinera) => {
    setEscuelasSeleccionadas(new Set(cocinera.escuelas.map((e) => e.id)))
    setModalEscuelasId(cocinera.id)
  }

  // Guardar asignación de escuelas y refrescar datos
  const guardarEscuelas = async () => {
    if (!modalEscuelasId) return
    setGuardandoEscuelas(true)
    const resultado = await asignarEscuelasCocinera(
      modalEscuelasId,
      Array.from(escuelasSeleccionadas)
    )
    setGuardandoEscuelas(false)
    setModalEscuelasId(null)
    if (resultado?.error) {
      setMensajeGlobal({ tipo: 'error', texto: resultado.error })
    } else {
      setMensajeGlobal({ tipo: 'exito', texto: resultado?.exito ?? 'Escuelas actualizadas.' })
      router.refresh()
    }
  }

  // Ejecutar eliminación con confirmación inline
  const manejarEliminar = (id: number) => {
    setMensajeGlobal(null)
    startTransition(async () => {
      const resultado = await eliminarCocinera(id)
      setConfirmandoId(null)
      if (resultado?.error) {
        setMensajeGlobal({ tipo: 'error', texto: resultado.error })
      } else if (resultado?.exito) {
        setMensajeGlobal({ tipo: 'exito', texto: resultado.exito })
      }
    })
  }

  const cocineraEnModal = cocineras.find((c) => c.id === modalEscuelasId)

  return (
    <div>
      {/* Feedback global */}
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
            placeholder="Buscar por nombre, cédula o escuela..."
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
          href="/admin/cocineras/nueva"
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Nueva Cocinera
        </Link>
      </div>

      {/* Contador */}
      <p className="text-on-surface-variant text-xs font-medium mb-4">
        {cocinerasFiltradas.length} de {cocineras.length} cocinera
        {cocineras.length !== 1 ? 's' : ''}
        {busqueda && ` · filtrado por "${busqueda}"`}
      </p>

      {/* Sin resultados */}
      {cocinerasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/50">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-2xl text-outline">
              {busqueda ? 'search_off' : 'soup_kitchen'}
            </span>
          </div>
          <h3 className="text-on-surface font-semibold text-base mb-1">
            {busqueda ? 'Sin resultados' : 'No hay cocineras registradas'}
          </h3>
          <p className="text-on-surface-variant text-sm max-w-xs">
            {busqueda
              ? 'Ninguna cocinera coincide con tu búsqueda.'
              : 'Registra la primera cocinera del sistema.'}
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
              href="/admin/cocineras/nueva"
              className="mt-4 flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Registrar cocinera
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden lg:block bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                    Cocinera
                  </th>
                  <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                    Cédula
                  </th>
                  <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline hidden xl:table-cell">
                    Teléfono
                  </th>
                  <th className="text-left px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                    Escuelas
                  </th>
                  <th className="text-center px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline">
                    Utensilios
                  </th>
                  <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-outline text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {cocinerasFiltradas.map((cocinera) => (
                  <tr
                    key={cocinera.id}
                    className="border-b border-outline-variant/15 hover:bg-surface-container-low/50 transition-colors last:border-0"
                  >
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                          {cocinera.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-on-surface font-medium text-sm">{cocinera.name}</p>
                          <p className="text-outline text-xs">
                            {new Date(cocinera.created_at).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cédula */}
                    <td className="px-4 py-4">
                      <span className="text-on-surface-variant text-sm font-mono">
                        {formatearDoc(cocinera.doc)}
                      </span>
                    </td>

                    {/* Teléfono */}
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <span className="text-on-surface-variant text-sm">
                        {formatearPhone(cocinera.phone)}
                      </span>
                    </td>

                    {/* Escuelas con botón editar inline */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {cocinera.escuelas.length === 0 ? (
                          <span className="text-xs text-secondary bg-secondary/10 px-2.5 py-1 rounded-full font-semibold">
                            Sin asignar
                          </span>
                        ) : (
                          <>
                            {cocinera.escuelas.slice(0, 2).map((e) => (
                              <span
                                key={e.id}
                                className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full max-w-[140px] truncate"
                                title={e.name}
                              >
                                {e.name}
                              </span>
                            ))}
                            {cocinera.escuelas.length > 2 && (
                              <span className="text-[10px] font-semibold text-outline bg-surface-container px-2.5 py-1 rounded-full">
                                +{cocinera.escuelas.length - 2}
                              </span>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => abrirModalEscuelas(cocinera)}
                          className="p-1 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Asignar escuelas"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                        </button>
                      </div>
                    </td>

                    {/* Utensilios */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full text-xs font-bold px-2 ${
                          cocinera.totalUtensilios === 0
                            ? 'bg-surface-container text-on-surface-variant'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {cocinera.totalUtensilios}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4">
                      {confirmandoId === cocinera.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-on-surface-variant text-xs">¿Eliminar?</span>
                          <button
                            onClick={() => manejarEliminar(cocinera.id)}
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
                          {cocinera.phone && (
                            <a
                              href={construirUrlWhatsApp(cocinera)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <IconoWhatsApp />
                            </a>
                          )}
                          <Link
                            href={`/admin/cocineras/${cocinera.id}/editar`}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>
                          <button
                            onClick={() => setConfirmandoId(cocinera.id)}
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

          {/* Tarjetas móvil / tablet */}
          <div className="lg:hidden space-y-3">
            {cocinerasFiltradas.map((cocinera) => (
              <div
                key={cocinera.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-base">
                    {cocinera.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface font-semibold text-base leading-tight truncate">
                      {cocinera.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {cocinera.doc && (
                        <span className="flex items-center gap-1 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-[14px]">badge</span>
                          {formatearDoc(cocinera.doc)}
                        </span>
                      )}
                      {cocinera.phone && (
                        <span className="flex items-center gap-1 text-on-surface-variant text-xs">
                          <span className="material-symbols-outlined text-[14px]">phone</span>
                          {formatearPhone(cocinera.phone)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      cocinera.totalUtensilios > 0
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">flatware</span>
                    {cocinera.totalUtensilios}
                  </span>
                </div>

                {/* Escuelas asignadas */}
                <div className="mb-3">
                  {cocinera.escuelas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {cocinera.escuelas.map((e) => (
                        <span
                          key={e.id}
                          className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full max-w-full truncate"
                        >
                          <span className="material-symbols-outlined text-[12px]">school</span>
                          {e.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-secondary">Sin escuela asignada</p>
                  )}
                </div>

                {/* Confirmación o acciones */}
                {confirmandoId === cocinera.id ? (
                  <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant text-xs flex-1">
                      ¿Confirmar eliminación?
                    </span>
                    <button
                      onClick={() => manejarEliminar(cocinera.id)}
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
                  <div className="flex gap-2 pt-3 border-t border-outline-variant/20">
                    <button
                      onClick={() => abrirModalEscuelas(cocinera)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-semibold hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] icon-fill">school</span>
                      Escuelas
                    </button>
                    {cocinera.phone && (
                      <a
                        href={construirUrlWhatsApp(cocinera)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] text-xs font-semibold hover:bg-[#25D366]/20 transition-colors"
                      >
                        <IconoWhatsApp className="w-[14px] h-[14px]" />
                        WhatsApp
                      </a>
                    )}
                    <Link
                      href={`/admin/cocineras/${cocinera.id}/editar`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Editar
                    </Link>
                    <button
                      onClick={() => setConfirmandoId(cocinera.id)}
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

      {/* Modal de asignación de escuelas */}
      {modalEscuelasId !== null && cocineraEnModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {cocineraEnModal.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-on-surface font-semibold text-sm leading-tight">
                    Asignar Escuelas
                  </h3>
                  <p className="text-outline text-xs truncate max-w-[180px]">
                    {cocineraEnModal.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEscuelasId(null)}
                className="p-1.5 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Lista de escuelas */}
            <div className="flex-1 overflow-y-auto py-2">
              {todasEscuelas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <span className="material-symbols-outlined text-3xl text-outline mb-2">school</span>
                  <p className="text-on-surface-variant text-sm">No hay escuelas registradas.</p>
                  <Link
                    href="/admin/escuelas/nueva"
                    className="mt-3 text-primary text-xs font-semibold hover:underline"
                  >
                    Registrar primera escuela →
                  </Link>
                </div>
              ) : (
                todasEscuelas.map((escuela) => {
                  const seleccionada = escuelasSeleccionadas.has(escuela.id)
                  return (
                    <button
                      key={escuela.id}
                      onClick={() => {
                        const siguiente = new Set(escuelasSeleccionadas)
                        if (seleccionada) siguiente.delete(escuela.id)
                        else siguiente.add(escuela.id)
                        setEscuelasSeleccionadas(siguiente)
                      }}
                      className={`w-full flex items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-surface-container-low ${
                        seleccionada ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          seleccionada
                            ? 'bg-primary border-primary'
                            : 'border-outline-variant bg-surface-container-lowest'
                        }`}
                      >
                        {seleccionada && (
                          <span className="material-symbols-outlined text-on-primary text-[14px] font-bold">
                            check
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="material-symbols-outlined text-[16px] text-primary shrink-0 icon-fill">
                          school
                        </span>
                        <span className="text-on-surface text-sm truncate">{escuela.name}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex gap-3 shrink-0 bg-surface-container/40">
              <button
                onClick={() => setModalEscuelasId(null)}
                disabled={guardandoEscuelas}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEscuelas}
                disabled={guardandoEscuelas}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {guardandoEscuelas ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px] icon-fill">save</span>
                    Guardar ({escuelasSeleccionadas.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IconoWhatsApp({ className = 'w-[18px] h-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
