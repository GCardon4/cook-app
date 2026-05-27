'use client'

import { useActionState, useState, useMemo } from 'react'
import Link from 'next/link'
import { crearClienteNavegador } from '@/lib/supabase/client'
import type { EstadoFormulario } from '../actions'

interface Props {
  accion: (estado: EstadoFormulario, datos: FormData) => Promise<EstadoFormulario>
  valoresIniciales?: {
    nombre: string
    sku: string
    descripcion: string
    stock: string
  }
  esEdicion?: boolean
}

// Generar barras visuales del código de barras de forma determinista desde el número SKU
function usarBarrasBarcode(sku: string) {
  return useMemo(() => {
    if (!sku) return []
    const num = parseInt(sku) || 0
    const barras: { ancho: number; oscuro: boolean }[] = []

    // Guardias de inicio
    barras.push({ ancho: 1, oscuro: true }, { ancho: 1, oscuro: false }, { ancho: 1, oscuro: true })

    // Codificar dígitos usando LCG determinista para reproducibilidad
    let semilla = num
    for (let i = 0; i < 42; i++) {
      semilla = (semilla * 1664525 + 1013904223) >>> 0
      const ancho = (semilla % 3) + 1
      barras.push({ ancho, oscuro: i % 2 === 0 })
    }

    // Guardias de fin
    barras.push({ ancho: 1, oscuro: false }, { ancho: 1, oscuro: true }, { ancho: 1, oscuro: false }, { ancho: 1, oscuro: true })

    return barras
  }, [sku])
}

// Vista previa del código de barras generado
function VistaPreviaBarcode({ sku, esNuevo }: { sku: string; esNuevo: boolean }) {
  const barras = usarBarrasBarcode(sku)
  if (!barras.length) return null

  return (
    <div
      className={`mt-3 rounded-xl border overflow-hidden transition-all duration-300 ${
        esNuevo
          ? 'border-primary/30 shadow-[0_4px_20px_rgba(0,104,95,0.08)]'
          : 'border-outline-variant/40'
      }`}
    >
      {/* Área de código de barras */}
      <div className="bg-white px-6 py-5 flex flex-col items-center gap-3">
        {/* Barras SVG-like con divs */}
        <div className="flex items-stretch gap-[1.5px] h-14 w-full max-w-xs">
          {barras.map((barra, i) => (
            <div
              key={i}
              className={`rounded-[0.5px] ${barra.oscuro ? 'bg-on-surface' : 'bg-transparent'}`}
              style={{ width: `${barra.ancho * 3}px`, flexShrink: 0 }}
            />
          ))}
        </div>

        {/* Número del código */}
        <p className="font-mono font-bold text-on-surface tracking-[0.25em] text-base select-all">
          {sku}
        </p>
      </div>

      {/* Pie de la preview */}
      {esNuevo && (
        <div className="bg-primary/5 border-t border-primary/15 px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[16px] icon-fill">
            check_circle
          </span>
          <p className="text-primary text-xs font-medium">
            Código único generado · verificado en el sistema
          </p>
        </div>
      )}
    </div>
  )
}

const estadoInicial: EstadoFormulario = null

export default function FormularioUtensilio({
  accion,
  valoresIniciales,
  esEdicion = false,
}: Props) {
  const [estado, accionFormulario, estaCargando] = useActionState(
    accion,
    estadoInicial
  )

  // Control del campo SKU y generación de código
  const [skuValor, setSkuValor] = useState(valoresIniciales?.sku ?? '')
  const [generandoSKU, setGenerandoSKU] = useState(false)
  const [errorSKU, setErrorSKU] = useState<string | null>(null)
  const [codigoRecienGenerado, setCodigoRecienGenerado] = useState(false)

  // Consultar Supabase y generar el siguiente código SKU disponible
  const generarCodigoSKU = async () => {
    setGenerandoSKU(true)
    setErrorSKU(null)
    setCodigoRecienGenerado(false)

    try {
      const supabase = crearClienteNavegador()

      const { data } = await supabase
        .from('utensils')
        .select('sku')
        .not('sku', 'is', null)
        .order('sku', { ascending: false })
        .limit(1)
        .maybeSingle()

      const maxSKU = data?.sku ? Number(data.sku) : 10000
      const nuevoSKU = (maxSKU + 1).toString()

      setSkuValor(nuevoSKU)
      setCodigoRecienGenerado(true)
    } catch {
      setErrorSKU('No se pudo generar el código. Ingrésalo manualmente.')
    } finally {
      setGenerandoSKU(false)
    }
  }

  return (
    <form action={accionFormulario} className="space-y-6">
      {/* Mensaje de error global */}
      {estado?.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-error-container border border-error/20">
          <span className="material-symbols-outlined text-on-error-container text-[20px] icon-fill shrink-0 mt-0.5">
            error
          </span>
          <p className="text-on-error-container text-sm">{estado.error}</p>
        </div>
      )}

      {/* Campo Nombre */}
      <div>
        <label htmlFor="nombre" className="block text-on-surface text-sm font-semibold mb-1.5">
          Nombre del Utensilio
          <span className="text-secondary ml-1">*</span>
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={valoresIniciales?.nombre ?? ''}
          placeholder="Ej: Olla Grande 30L, Cuchillo Chef..."
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
        <p className="text-outline text-xs mt-1.5">
          Nombre claro y descriptivo para identificar fácilmente el utensilio.
        </p>
      </div>

      {/* Campo SKU con generador de código */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="sku" className="block text-on-surface text-sm font-semibold">
            Código SKU
            <span className="text-on-surface-variant text-xs font-normal ml-2">(Opcional)</span>
          </label>
          {/* Botón generar código */}
          <button
            type="button"
            onClick={generarCodigoSKU}
            disabled={generandoSKU}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            title="Generar código de barras automáticamente"
          >
            {generandoSKU ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">
                  barcode_2
                </span>
                Generar código
              </>
            )}
          </button>
        </div>

        {/* Input SKU */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
            <span className="material-symbols-outlined text-[20px]">
              barcode_reader
            </span>
          </div>
          <input
            id="sku"
            name="sku"
            type="number"
            value={skuValor}
            onChange={(e) => {
              setSkuValor(e.target.value)
              setCodigoRecienGenerado(false)
            }}
            placeholder="Código numérico o usa el botón para generarlo..."
            min={1}
            className={`w-full pl-11 pr-4 py-3 rounded-xl border text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              codigoRecienGenerado
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant bg-surface-container-low'
            }`}
          />
          {/* Indicador de código recién generado */}
          {codigoRecienGenerado && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-primary">
              <span className="material-symbols-outlined text-[20px] icon-fill">
                check_circle
              </span>
            </div>
          )}
        </div>

        {/* Error de generación */}
        {errorSKU && (
          <p className="text-secondary text-xs mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            {errorSKU}
          </p>
        )}

        {/* Hint de ayuda */}
        {!codigoRecienGenerado && (
          <p className="text-outline text-xs mt-1.5">
            Número único del código de barras. Usa el botón &quot;Generar código&quot; para asignarlo automáticamente.
          </p>
        )}

        {/* Vista previa del código de barras */}
        {skuValor && (
          <VistaPreviaBarcode sku={skuValor} esNuevo={codigoRecienGenerado} />
        )}
      </div>

      {/* Campo Stock Inicial */}
      <div>
        <label htmlFor="stock" className="block text-on-surface text-sm font-semibold mb-1.5">
          Stock
          <span className="text-secondary ml-1">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline">
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          </div>
          <input
            id="stock"
            name="stock"
            type="number"
            required
            min={0}
            defaultValue={valoresIniciales?.stock ?? '0'}
            placeholder="Cantidad de unidades disponibles..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <p className="text-outline text-xs mt-1.5">
          {esEdicion
            ? 'Ajusta el stock total disponible. No afecta las asignaciones existentes.'
            : 'Cantidad inicial de unidades físicas de este utensilio en el sistema.'}
        </p>
      </div>

      {/* Campo Descripción */}
      <div>
        <label htmlFor="descripcion" className="block text-on-surface text-sm font-semibold mb-1.5">
          Descripción
          <span className="text-on-surface-variant text-xs font-normal ml-2">(Opcional)</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={valoresIniciales?.descripcion ?? ''}
          placeholder="Material, capacidad, características especiales..."
          className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
        />
        <p className="text-outline text-xs mt-1.5">
          Detalles adicionales: material, tamaño, uso específico, etc.
        </p>
      </div>

      <div className="border-t border-outline-variant/30 pt-2" />

      {/* Botones de acción */}
      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Link
          href="/admin/utensilios"
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
              {esEdicion ? 'Guardar Cambios' : 'Registrar Utensilio'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
