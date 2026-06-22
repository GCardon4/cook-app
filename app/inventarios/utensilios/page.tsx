import { crearClienteServidor } from '@/lib/supabase/server'
import GestorUtensilios from './components/GestorUtensilios'

function calcularNivelStock(disponible: number, total: number): 'normal' | 'bajo' | 'sin-stock' {
  if (total === 0) return 'normal'
  if (disponible === 0) return 'sin-stock'
  const umbral = Math.max(2, Math.floor(total * 0.2))
  return disponible <= umbral ? 'bajo' : 'normal'
}

// Obtener stock de todos los utensilios con sus asignaciones activas
async function obtenerStockUtensilios() {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('utensils')
    .select('id, name, sku, description, stock, inventory(id, stock)')
    .order('name', { ascending: true })

  if (error) return []

  return (data ?? []).map((u) => {
    const invRows = u.inventory as { id: number; stock: number | null }[]
    const stockTotal = (u.stock as number | null) ?? 0
    const stockAsignado = invRows.reduce((acc, inv) => acc + (inv.stock ?? 1), 0)
    const stockDisponible = Math.max(0, stockTotal - stockAsignado)
    return {
      id: u.id as number,
      name: u.name as string,
      sku: u.sku as string | null,
      description: u.description as string | null,
      stockTotal,
      stockAsignado,
      stockDisponible,
      nivel: calcularNivelStock(stockDisponible, stockTotal),
    }
  })
}

export default async function PaginaUtensiliosInventario() {
  const utensilios = await obtenerStockUtensilios()

  const totalTipos = utensilios.length
  const totalUnidades = utensilios.reduce((acc, u) => acc + u.stockTotal, 0)
  const totalDisponible = utensilios.reduce((acc, u) => acc + u.stockDisponible, 0)
  const alertas = utensilios.filter((u) => u.nivel !== 'normal')

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h2 className="text-on-surface font-bold text-2xl md:text-3xl">Stock de Utensilios</h2>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <p className="text-on-surface font-bold text-2xl">{totalTipos}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Tipos</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 text-center">
          <p className="text-on-surface font-bold text-2xl">{totalUnidades}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Stock Total</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-primary/20 text-center">
          <p className="text-primary font-bold text-2xl">{totalDisponible}</p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Disponibles</p>
        </div>
        <div
          className={`rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] text-center border ${
            alertas.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-surface-container-lowest border-surface-container-high/50'
          }`}
        >
          <p className={`font-bold text-2xl ${alertas.length > 0 ? 'text-amber-600' : 'text-on-surface'}`}>
            {alertas.length}
          </p>
          <p className="text-on-surface-variant text-xs font-medium mt-1">Alertas</p>
        </div>
      </div>

      {/* Lista interactiva con CRUD */}
      <GestorUtensilios utensilios={utensilios} />
    </div>
  )
}
