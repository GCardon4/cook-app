'use client'

import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'

interface Props {
  sku: string
  esNuevo?: boolean
}

// Componente de vista previa y exportación de código de barras en SVG
export default function BarcodeViewer({ sku, esNuevo = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!sku || !svgRef.current) return
    setError(false)
    try {
      JsBarcode(svgRef.current, sku, {
        format: 'CODE128',
        width: 2,
        height: 70,
        displayValue: true,
        fontSize: 14,
        fontOptions: 'bold',
        textMargin: 6,
        margin: 12,
        background: '#ffffff',
        lineColor: '#000000',
      })
    } catch {
      setError(true)
    }
  }, [sku])

  // Exportar el SVG como archivo descargable
  const descargarSVG = () => {
    if (!svgRef.current) return
    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `codigo-${sku}.svg`
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    URL.revokeObjectURL(url)
  }

  if (!sku) return null

  return (
    <div
      className={`mt-3 rounded-xl border overflow-hidden transition-all duration-300 ${
        esNuevo
          ? 'border-primary/30 shadow-[0_4px_20px_rgba(0,104,95,0.08)]'
          : 'border-outline-variant/40'
      }`}
    >
      {/* Área de previsualización */}
      <div className="bg-white px-6 py-5 flex justify-center">
        {error ? (
          <div className="h-24 flex items-center justify-center text-outline text-xs text-center">
            No se pudo generar el código de barras
          </div>
        ) : (
          <svg ref={svgRef} className="max-w-full" />
        )}
      </div>

      {/* Barra inferior: SKU + botón descarga */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-t ${
          esNuevo
            ? 'bg-primary/5 border-primary/15'
            : 'bg-surface-container border-outline-variant/20'
        }`}
      >
        <div className="flex items-center gap-2">
          {esNuevo && (
            <span className="material-symbols-outlined text-primary text-[16px] icon-fill">
              check_circle
            </span>
          )}
          <p className="font-mono font-bold text-on-surface tracking-wider text-sm select-all">
            {sku}
          </p>
        </div>

        <button
          type="button"
          onClick={descargarSVG}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:bg-surface-container-highest hover:text-on-surface transition-colors"
          title="Descargar código de barras SVG para impresión"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Descargar SVG
        </button>
      </div>
    </div>
  )
}
