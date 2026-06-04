'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ResultadoEscaneo = {
  exito?: string
  error?: string
  utensilio?: string
} | null

// Agregar 1 unidad al inventario de una cocinera escaneando por SKU
export async function agregarPorEscaneo(
  cocineraId: number,
  sku: number
): Promise<ResultadoEscaneo> {
  const supabase = await crearClienteServidor()

  const { data: utensilio, error: errBusqueda } = await supabase
    .from('utensils')
    .select('id, name, stock, inventory(stock)')
    .eq('sku', sku)
    .maybeSingle()

  if (errBusqueda || !utensilio) return { error: `SKU ${sku} no encontrado.` }

  const stockTotal = (utensilio.stock as number | null) ?? 0
  const stockAsignado = (utensilio.inventory as { stock: number | null }[])
    .reduce((acc, inv) => acc + (inv.stock ?? 1), 0)

  if (stockTotal - stockAsignado <= 0)
    return { error: `${utensilio.name}: sin stock disponible.` }

  const { data: existente } = await supabase
    .from('inventory')
    .select('id, stock')
    .eq('utensils_id', utensilio.id)
    .eq('cook_id', cocineraId)
    .maybeSingle()

  if (existente) {
    const { error } = await supabase
      .from('inventory')
      .update({ stock: (existente.stock ?? 1) + 1 })
      .eq('id', existente.id)
    if (error) return { error: 'Error al actualizar asignación.' }
  } else {
    const { error } = await supabase
      .from('inventory')
      .insert({ utensils_id: utensilio.id, cook_id: cocineraId, stock: 1 })
    if (error) return { error: 'Error al crear asignación.' }
  }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/asignaciones')
  return { exito: `+1 ${utensilio.name}`, utensilio: utensilio.name as string }
}

// Entregar (devolver) 1 unidad de una cocinera escaneando por SKU
export async function entregarPorEscaneo(
  cocineraId: number,
  sku: number
): Promise<ResultadoEscaneo> {
  const supabase = await crearClienteServidor()

  const { data: utensilio, error: errBusqueda } = await supabase
    .from('utensils')
    .select('id, name')
    .eq('sku', sku)
    .maybeSingle()

  if (errBusqueda || !utensilio) return { error: `SKU ${sku} no encontrado.` }

  const { data: inv } = await supabase
    .from('inventory')
    .select('id, stock')
    .eq('utensils_id', utensilio.id)
    .eq('cook_id', cocineraId)
    .maybeSingle()

  if (!inv) return { error: `${utensilio.name}: no asignado a esta cocinera.` }

  const stockActual = inv.stock ?? 1
  if (stockActual <= 1) {
    const { error } = await supabase.from('inventory').delete().eq('id', inv.id)
    if (error) return { error: 'Error al eliminar asignación.' }
  } else {
    const { error } = await supabase
      .from('inventory')
      .update({ stock: stockActual - 1 })
      .eq('id', inv.id)
    if (error) return { error: 'Error al actualizar asignación.' }
  }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/asignaciones')
  return { exito: `-1 ${utensilio.name}`, utensilio: utensilio.name as string }
}
