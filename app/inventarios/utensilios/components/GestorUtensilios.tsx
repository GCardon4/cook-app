'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteNavegador } from '@/lib/supabase/client'
import BarcodeViewer from '@/components/BarcodeViewer'
import {
  crearUtensilioInventario,
  actualizarUtensilioInventario,
  eliminarUtensilioInventario,
} from '../actions'

type ItemUtensilio = {
  id: number
  name: string
  sku: string | null
  description: string | null
  stockTotal: number
  stockAsignado: number
  stockDisponible: number
  nivel: 'normal' | 'bajo' | 'sin-stock'
}

interface Props {
  utensilios: ItemUtensilio[]
}

const nivelConfig = {
  normal: {
    icono: 'check_circle',
    etiqueta: 'Normal',
    colorTexto: 'text-tertiary',
    colorBg: 'bg-tertiary/10',
    colorBarra: 'bg-tertiary',
  },
  bajo: {
    icono: 'warning',
    etiqueta: 'Bajo stock',
    colorTexto: 'text-amber-600',
    colorBg: 'bg-amber-50',
    colorBarra: 'bg-amber-500',
  },
  'sin-stock': {
    icono: 'error',
    etiqueta: 'Sin stock',
    colorTexto: 'text-error',
    colorBg: 'bg-error/10',
    colorBarra: 'bg-error',
  },
}

export default function GestorUtensilios({ utensilios }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [utensilioEditando, setUtensilioEditando] = useState<ItemUtensilio | null>(null)
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null)
  const [mensajeGlobal, setMensajeGlobal] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const [skuValor, setSkuValor] = useState('')
  const [generandoSKU, setGenerandoSKU] = useState(false)
  const [errorSKU, setErrorSKU] = useState<string | null>(null)

  const esEdicion = !!utensilioEditando

  // Filtrar lista por nombre o SKU
  const utensuiliosFiltrados = utensilios.filter((u) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.sku?.toLowerCase().includes(q) ||
      (u.description ?? '').toLowerCase().includes(q)
    )
  })

  // Abrir modal vacío para crear
  const abrirModalCrear = () => {
    setUtensilioEditando(null)
    setSkuValor('')
    setErrorModal(null)
    setErrorSKU(null)
    setModalAbierto(true)
  }

  // Abrir modal con datos del utensilio a editar
  const abrirModalEditar = (u: ItemUtensilio) => {
    setUtensilioEditando(u)
    setSkuValor(u.sku ?? '')
    setErrorModal(null)
    setErrorSKU(null)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (isPending) return
    setModalAbierto(false)
    setUtensilioEditando(null)
    setErrorModal(null)
  }

  // Generar siguiente SKU disponible consultando Supabase
  const generarSKU = async () => {
    setGenerandoSKU(true)
    setErrorSKU(null)
    try {
      const supabase = crearClienteNavegador()
      const { data } = await supabase
        .from('utensils')
        .select('sku')
        .not('sku', 'is', null)
        .order('sku', { ascending: false })
        .limit(1)
        .maybeSingle()
      const lastSku = data?.sku ?? ''
      const match = lastSku.match(/^(.*?)(\d+)$/)
      const nuevoSKU = match
        ? `${match[1]}${(parseInt(match[2], 10) + 1).toString().padStart(match[2].length, '0')}`
        : 'PRO-0001'
      setSkuValor(nuevoSKU)
    } catch {
      setErrorSKU('No se pudo generar. Ingrésalo manualmente.')
    } finally {
      setGenerandoSKU(false)
    }
  }

  // Enviar formulario de creación o edición
  const manejarSubmit = (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setErrorModal(null)
    startTransition(async () => {
      const resultado = esEdicion
        ? await actualizarUtensilioInventario(utensilioEditando!.id, null, formData)
        : await crearUtensilioInventario(null, formData)

      if (resultado?.error) {
        setErrorModal(resultado.error)
        return
      }
      setMensajeGlobal({ tipo: 'exito', texto: resultado?.exito ?? 'Guardado.' })
      setModalAbierto(false)
      router.refresh()
    })
  }

  // Eliminar utensilio con confirmación inline
  const manejarEliminar = (id: number) => {
    setMensajeGlobal(null)
    startTransition(async () => {
      const resultado = await eliminarUtensilioInventario(id)
      setConfirmandoId(null)
      if (resultado?.error) {
        setMensajeGlobal({ tipo: 'error', texto: resultado.error })
      } else {
        setMensajeGlobal({ tipo: 'exito', texto: resultado?.exito ?? 'Eliminado.' })
        router.refresh()
      }
    })
  }

  return (
    <div>
      {/* Feedback global */}
      {mensajeGlobal && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl mb-5 text-sm ${
            mensajeGlobal.tipo === 'error' ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'
          }`}
        >
          <span className={`material-symbols-outlined text-[20px] icon-fill`}>
            {mensajeGlobal.tipo === 'error' ? 'error' : 'check_circle'}
          </span>
          <span className="flex-1">{mensajeGlobal.texto}</span>
          <button onClick={() => setMensajeGlobal(null)}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Búsqueda + botón nuevo */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">
            search
          </span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
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
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors shadow-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      {busqueda && (
        <p className="text-on-surface-variant text-xs mb-4">
          {utensuiliosFiltrados.length} de {utensilios.length} · &quot;{busqueda}&quot;
        </p>
      )}

      {/* Lista de utensilios */}
      {utensuiliosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-3 block">
            {busqueda ? 'search_off' : 'kitchen'}
          </span>
          <p className="font-medium">
            {busqueda ? 'Sin resultados para esta búsqueda' : 'No hay utensilios registrados'}
          </p>
          {!busqueda && (
            <button
              onClick={abrirModalCrear}
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Registrar utensilio
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {utensuiliosFiltrados.map((u) => {
            const config = nivelConfig[u.nivel]
            const porcentajeDisponible =
              u.stockTotal > 0 ? Math.round((u.stockDisponible / u.stockTotal) * 100) : 0

            return (
              <div
                key={u.id}
                className={`bg-surface-container-lowest rounded-2xl p-4 border shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${
                  u.nivel === 'sin-stock'
                    ? 'border-error/30'
                    : u.nivel === 'bajo'
                    ? 'border-amber-200'
                    : 'border-surface-container-high/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-on-surface font-semibold text-sm">{u.name}</p>
                      {u.sku !== null && (
                        <span className="text-[10px] font-mono bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                          SKU {u.sku}
                        </span>
                      )}
                    </div>
                    {u.description && (
                      <p className="text-on-surface-variant text-xs mt-0.5 line-clamp-1">{u.description}</p>
                    )}

                    {/* Barra de stock */}
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full rounded-full ${config.colorBarra}`}
                          style={{ width: `${porcentajeDisponible}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[11px] text-on-surface-variant">
                        <span>{u.stockDisponible} disponible{u.stockDisponible !== 1 ? 's' : ''}</span>
                        <span>
                          {u.stockAsignado} asignado{u.stockAsignado !== 1 ? 's' : ''} · {u.stockTotal} total
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badge de nivel */}
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0 ${config.colorBg}`}>
                    <span className={`material-symbols-outlined text-[14px] icon-fill ${config.colorTexto}`}>
                      {config.icono}
                    </span>
                    <span className={`text-[11px] font-semibold ${config.colorTexto}`}>
                      {config.etiqueta}
                    </span>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                {confirmandoId === u.id ? (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/20">
                    <span className="text-on-surface-variant text-xs flex-1">¿Eliminar este utensilio?</span>
                    <button
                      onClick={() => manejarEliminar(u.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg bg-error text-on-error text-xs font-semibold disabled:opacity-50 transition-colors"
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
                  <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant/20">
                    <button
                      onClick={() => abrirModalEditar(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmandoId(u.id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-error/10 text-error text-xs font-semibold hover:bg-error/15 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal / Bottom Sheet de creación y edición */}
      {modalAbierto && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={cerrarModal} />

          <div className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:bottom-auto md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 z-50 bg-surface-container-lowest rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Handle bar (solo móvil) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>

            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] icon-fill">
                    {esEdicion ? 'edit' : 'add_circle'}
                  </span>
                </div>
                <div>
                  <h3 className="text-on-surface font-bold text-base">
                    {esEdicion ? 'Editar Utensilio' : 'Nuevo Utensilio'}
                  </h3>
                  {esEdicion && (
                    <p className="text-on-surface-variant text-xs">{utensilioEditando!.name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={cerrarModal}
                disabled={isPending}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Formulario */}
            <form
              key={utensilioEditando?.id ?? 'nuevo'}
              onSubmit={manejarSubmit}
              className="p-5 space-y-5"
            >
              {errorModal && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/20">
                  <span className="material-symbols-outlined text-error text-[20px] icon-fill shrink-0">error</span>
                  <p className="text-error text-sm">{errorModal}</p>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-on-surface text-sm font-semibold mb-1.5">
                  Nombre <span className="text-secondary ml-0.5">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  defaultValue={utensilioEditando?.name ?? ''}
                  placeholder="Olla Grande, Cuchillo Chef..."
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              {/* SKU con generador */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="sku" className="text-on-surface text-sm font-semibold">
                    SKU{' '}
                    <span className="text-on-surface-variant text-xs font-normal">(Opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={generarSKU}
                    disabled={generandoSKU}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 disabled:opacity-60 transition-all"
                  >
                    {generandoSKU ? (
                      <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">barcode_2</span>
                    )}
                    Generar código
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">
                    barcode_reader
                  </span>
                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    value={skuValor}
                    onChange={(e) => setSkuValor(e.target.value.toUpperCase())}
                    placeholder="Ej: PRO-0010..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                {errorSKU && <p className="text-amber-600 text-xs mt-1.5">{errorSKU}</p>}
                {skuValor && <BarcodeViewer sku={skuValor} />}
              </div>

              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-on-surface text-sm font-semibold mb-1.5">
                  Stock Total <span className="text-secondary ml-0.5">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">
                    inventory_2
                  </span>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    required
                    min={0}
                    defaultValue={utensilioEditando?.stockTotal ?? 0}
                    placeholder="Cantidad total de unidades..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {esEdicion && utensilioEditando!.stockAsignado > 0 && (
                  <p className="text-on-surface-variant text-xs mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">info</span>
                    {utensilioEditando!.stockAsignado} unidad{utensilioEditando!.stockAsignado !== 1 ? 'es' : ''} ya
                    asignada{utensilioEditando!.stockAsignado !== 1 ? 's' : ''} a cocineras.
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-on-surface text-sm font-semibold mb-1.5">
                  Descripción{' '}
                  <span className="text-on-surface-variant text-xs font-normal">(Opcional)</span>
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={3}
                  defaultValue={utensilioEditando?.description ?? ''}
                  placeholder="Material, capacidad, uso específico..."
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pb-safe pt-1">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-sm font-semibold hover:bg-surface-container-high transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-surface-tint active:scale-[0.99] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {esEdicion ? 'Guardando...' : 'Registrando...'}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px] icon-fill">
                        {esEdicion ? 'save' : 'add_circle'}
                      </span>
                      {esEdicion ? 'Guardar Cambios' : 'Registrar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
