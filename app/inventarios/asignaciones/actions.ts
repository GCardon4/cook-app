'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type EstadoAccion = { error?: string; exito?: string } | null

// Actualizar la cantidad asignada de un utensilio a una cocinera
export async function actualizarCantidadAsignacion(
  inventarioId: number,
  nuevaCantidad: number
): Promise<EstadoAccion> {
  if (nuevaCantidad < 1) return { error: 'La cantidad mínima es 1.' }

  const supabase = await crearClienteServidor()

  // Verificar que no supere el stock total disponible
  const { data: inv } = await supabase
    .from('inventory')
    .select('stock, utensils_id, cook_id')
    .eq('id', inventarioId)
    .single()

  if (!inv) return { error: 'Asignación no encontrada.' }

  const { data: utensilio } = await supabase
    .from('utensils')
    .select('stock, inventory(id, stock)')
    .eq('id', inv.utensils_id)
    .single()

  if (utensilio) {
    const stockTotal = (utensilio.stock as number | null) ?? 0
    const stockOtros = (utensilio.inventory as { id: number; stock: number | null }[])
      .filter((i) => i.id !== inventarioId)
      .reduce((acc, i) => acc + (i.stock ?? 1), 0)
    const disponibleParaEsta = stockTotal - stockOtros
    if (nuevaCantidad > disponibleParaEsta) {
      return { error: `Stock insuficiente. Máximo disponible: ${disponibleParaEsta}.` }
    }
  }

  const { error } = await supabase
    .from('inventory')
    .update({ stock: nuevaCantidad })
    .eq('id', inventarioId)

  if (error) return { error: 'No se pudo actualizar la cantidad.' }

  revalidatePath('/inventarios/asignaciones')
  return { exito: 'Cantidad actualizada.' }
}

// Eliminar asignación de un utensilio a una cocinera
export async function eliminarAsignacion(inventarioId: number): Promise<EstadoAccion> {
  const supabase = await crearClienteServidor()

  const { error } = await supabase.from('inventory').delete().eq('id', inventarioId)

  if (error) return { error: 'No se pudo eliminar la asignación.' }

  revalidatePath('/inventarios/asignaciones')
  revalidatePath('/inventarios')
  return { exito: 'Asignación eliminada.' }
}

// Agregar un utensilio nuevo a una cocinera desde el panel de detalle
export async function agregarUtensilioACocinera(
  cocineraId: number,
  utensilioId: number,
  cantidad: number
): Promise<EstadoAccion> {
  const supabase = await crearClienteServidor()

  const { data: existente } = await supabase
    .from('inventory')
    .select('id')
    .eq('cook_id', cocineraId)
    .eq('utensils_id', utensilioId)
    .maybeSingle()

  if (existente) return { error: 'Esta cocinera ya tiene ese utensilio asignado.' }

  const { data: utensilio } = await supabase
    .from('utensils')
    .select('stock, inventory(stock)')
    .eq('id', utensilioId)
    .single()

  if (utensilio) {
    const stockTotal = (utensilio.stock as number | null) ?? 0
    const stockAsignado = (utensilio.inventory as { stock: number | null }[]).reduce(
      (acc, i) => acc + (i.stock ?? 1), 0
    )
    const disponible = stockTotal - stockAsignado
    if (cantidad > disponible) {
      return { error: `Stock insuficiente. Solo hay ${disponible} unidad(es) disponible(s).` }
    }
  }

  const { error } = await supabase
    .from('inventory')
    .insert({ cook_id: cocineraId, utensils_id: utensilioId, stock: cantidad })

  if (error) return { error: 'No se pudo agregar el utensilio.' }

  revalidatePath('/inventarios/asignaciones')
  revalidatePath('/inventarios')
  return { exito: 'Utensilio agregado correctamente.' }
}
