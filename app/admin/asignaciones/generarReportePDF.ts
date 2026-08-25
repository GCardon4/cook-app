import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AsignacionHistorial } from './page'

type ColorRGB = [number, number, number]

const COLOR_PRIMARIO: ColorRGB = [0, 159, 227] // #009FE3
const COLOR_SECUNDARIO: ColorRGB = [239, 125, 0] // #EF7D00
const COLOR_ERROR: ColorRGB = [186, 26, 26] // #BA1A1A
const COLOR_ERROR_CONTENEDOR: ColorRGB = [255, 218, 214] // #FFDAD6
const COLOR_TEXTO: ColorRGB = [25, 28, 30]
const COLOR_TEXTO_SUAVE: ColorRGB = [61, 73, 71]
const COLOR_FILA_ALTERNA: ColorRGB = [242, 244, 246]

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Generar el informe PDF de inventario (agregados, entregas, estado y notas) de una cocinera
export function generarReportePDFCocinera(
  cocinera: { id: number; name: string },
  movimientos: AsignacionHistorial[]
) {
  const doc = new jsPDF()
  const anchoPagina = doc.internal.pageSize.getWidth()
  const altoPagina = doc.internal.pageSize.getHeight()

  // ── Encabezado ──────────────────────────────────────────────
  doc.setFillColor(...COLOR_PRIMARIO)
  doc.rect(0, 0, anchoPagina, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('PROACTIVO · Informe de Inventario', 14, 12)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(cocinera.name, 14, 20)
  doc.setFontSize(8)
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, anchoPagina - 14, 20, { align: 'right' })

  let cursorY = 38

  const movimientosOrdenados = [...movimientos].sort(
    (a, b) => new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
  )
  const agregados = movimientosOrdenados.filter((m) => m.tipo === 'agregado')
  const entregados = movimientosOrdenados.filter((m) => m.tipo === 'entregado')
  const enMalEstado = entregados.filter((m) => !m.status)

  // ── Resumen ─────────────────────────────────────────────────
  doc.setTextColor(...COLOR_TEXTO)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Resumen', 14, cursorY)
  cursorY += 5

  const tarjetas: { etiqueta: string; valor: number; color: ColorRGB }[] = [
    { etiqueta: 'Agregados', valor: agregados.length, color: COLOR_PRIMARIO },
    { etiqueta: 'Entregados', valor: entregados.length, color: COLOR_SECUNDARIO },
    { etiqueta: 'En mal estado', valor: enMalEstado.length, color: COLOR_ERROR },
  ]
  const anchoTarjeta = (anchoPagina - 28 - 12) / 3
  tarjetas.forEach((tarjeta, i) => {
    const x = 14 + i * (anchoTarjeta + 6)
    doc.setDrawColor(...tarjeta.color)
    doc.roundedRect(x, cursorY, anchoTarjeta, 18, 2, 2, 'S')
    doc.setTextColor(...tarjeta.color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(String(tarjeta.valor), x + 6, cursorY + 11)
    doc.setTextColor(...COLOR_TEXTO_SUAVE)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(tarjeta.etiqueta, x + 6, cursorY + 16)
  })
  cursorY += 26

  // ── Utensilios en mal estado (resaltados) ──────────────────
  if (enMalEstado.length > 0) {
    doc.setTextColor(...COLOR_ERROR)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Utensilios entregados en mal estado', 14, cursorY)
    cursorY += 4

    autoTable(doc, {
      startY: cursorY,
      head: [['Utensilio', 'SKU', 'Fecha', 'Colegio', 'Notas']],
      body: enMalEstado.map((m) => [
        m.utensilio.name,
        m.utensilio.sku ?? '-',
        formatearFecha(m.fechaAsignacion),
        m.colegio?.name ?? '-',
        m.notas ?? '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLOR_ERROR, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fillColor: COLOR_ERROR_CONTENEDOR, textColor: COLOR_TEXTO, fontSize: 8 },
      margin: { left: 14, right: 14 },
    })

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // ── Historial completo ──────────────────────────────────────
  doc.setTextColor(...COLOR_TEXTO)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Historial completo de movimientos', 14, cursorY)
  cursorY += 4

  autoTable(doc, {
    startY: cursorY,
    head: [['Fecha', 'Tipo', 'Utensilio', 'SKU', 'Cant.', 'Colegio', 'Estado', 'Notas']],
    body: movimientosOrdenados.map((m) => [
      formatearFecha(m.fechaAsignacion),
      m.tipo === 'agregado' ? 'Agregado' : 'Entregado',
      m.utensilio.name,
      m.utensilio.sku ?? '-',
      String(m.cantidad),
      m.colegio?.name ?? '-',
      m.tipo === 'entregado' ? (m.status ? 'Bueno' : 'Malo') : '-',
      m.notas ?? '-',
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLOR_PRIMARIO, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: COLOR_TEXTO },
    alternateRowStyles: { fillColor: COLOR_FILA_ALTERNA },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const fila = movimientosOrdenados[data.row.index]
      if (fila && fila.tipo === 'entregado' && !fila.status) {
        data.cell.styles.fillColor = COLOR_ERROR_CONTENEDOR
        data.cell.styles.textColor = COLOR_ERROR
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  // ── Pie de página (número de página en todas las páginas) ──
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_TEXTO_SUAVE)
    doc.text('PROACTIVO 🍽️', 14, altoPagina - 8)
    doc.text(`Página ${i} de ${totalPaginas}`, anchoPagina - 14, altoPagina - 8, { align: 'right' })
  }

  const nombreArchivo = `informe-inventario-${cocinera.name.replace(/\s+/g, '_').toLowerCase()}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`
  doc.save(nombreArchivo)
}
