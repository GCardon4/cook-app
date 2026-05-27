import Link from 'next/link'
import { notFound } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/server'
import { actualizarUtensilio } from '../../actions'
import FormularioUtensilio from '../../components/FormularioUtensilio'

// Cargar datos del utensilio para pre-poblar el formulario
async function obtenerUtensilio(id: number) {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('utensils')
    .select('id, name, sku, description, stock, created_at, inventory(id, stock)')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaginaEditarUtensilio({ params }: Props) {
  const { id: idStr } = await params
  const id = Number(idStr)

  if (isNaN(id)) notFound()

  const utensilio = await obtenerUtensilio(id)
  if (!utensilio) notFound()

  const invRows = utensilio.inventory as { id: number; stock: number | null }[]
  const totalAsignaciones = invRows.length
  const stockAsignado = invRows.reduce((acc, inv) => acc + (inv.stock ?? 1), 0)
  const stockTotal = (utensilio.stock as number | null) ?? 0

  // Vincular la acción con el id del utensilio actual
  const accionActualizar = actualizarUtensilio.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Migas de pan */}
      <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
        <Link href="/admin" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <Link href="/admin/utensilios" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Utensilios
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium truncate max-w-[200px]">{utensilio.name}</span>
      </div>

      {/* Tarjeta del formulario */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] icon-fill">edit</span>
            </div>
            <div>
              <h2 className="text-on-surface font-bold text-xl">Editar Utensilio</h2>
              <p className="text-on-surface-variant text-sm mt-0.5">
                Modifica la información del utensilio
              </p>
            </div>
          </div>

          {/* Badges de stock y asignaciones */}
          <div className="flex flex-col gap-1.5 shrink-0 items-end">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              stockTotal - stockAsignado === 0
                ? 'bg-secondary/10 text-secondary'
                : 'bg-primary/10 text-primary'
            }`}>
              <span className="material-symbols-outlined text-[14px] icon-fill">inventory_2</span>
              {stockTotal - stockAsignado}/{stockTotal} disp.
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">link</span>
              {totalAsignaciones} asig.
            </div>
          </div>
        </div>

        {/* Info adicional */}
        {utensilio.sku && (
          <div className="px-6 py-3 bg-surface-container/50 border-b border-outline-variant/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[16px]">
              barcode_reader
            </span>
            <span className="text-on-surface-variant text-xs">
              SKU actual: <span className="font-mono font-semibold text-on-surface">{utensilio.sku}</span>
            </span>
          </div>
        )}

        {/* Formulario */}
        <div className="p-6">
          <FormularioUtensilio
            accion={accionActualizar}
            esEdicion
            valoresIniciales={{
              nombre: utensilio.name,
              sku: utensilio.sku?.toString() ?? '',
              descripcion: utensilio.description ?? '',
              stock: stockTotal.toString(),
            }}
          />
        </div>
      </div>

      {/* Advertencia si tiene asignaciones */}
      {totalAsignaciones > 0 && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline text-[18px] shrink-0 mt-0.5">
            info
          </span>
          <p className="text-on-surface-variant text-xs">
            Este utensilio tiene <span className="font-semibold text-on-surface">{totalAsignaciones} asignación{totalAsignaciones !== 1 ? 'es' : ''}</span> activa{totalAsignaciones !== 1 ? 's' : ''}.
            Puedes editar su nombre y descripción sin afectar las asignaciones.
          </p>
        </div>
      )}
    </div>
  )
}
