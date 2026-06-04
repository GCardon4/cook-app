'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type EstadoAsignacion = { error?: string; exito?: string } | null

// Asignar utensilio a cocinera desde la vista de inventario
export async function asignarDesdeInventario(
  utensilioId: number,
  cocineraId: number,
  cantidad: number
): Promise<EstadoAsignacion> {
  const supabase = await crearClienteServidor()

  const { data: existente } = await supabase
    .from('inventory')
    .select('id')
    .eq('utensils_id', utensilioId)
    .eq('cook_id', cocineraId)
    .maybeSingle()

  if (existente) return { error: 'Esta cocinera ya tiene este utensilio asignado.' }

  const { data: utensilio } = await supabase
    .from('utensils')
    .select('stock, inventory(stock)')
    .eq('id', utensilioId)
    .single()

  if (utensilio) {
    const stockTotal = (utensilio.stock as number | null) ?? 0
    const stockAsignado = (utensilio.inventory as { stock: number | null }[]).reduce(
      (acc, inv) => acc + (inv.stock ?? 1), 0
    )
    if (cantidad > stockTotal - stockAsignado)
      return { error: `Stock insuficiente. Solo hay ${stockTotal - stockAsignado} unidad(es) disponible(s).` }
  }

  const { error } = await supabase
    .from('inventory')
    .insert({ utensils_id: utensilioId, cook_id: cocineraId, stock: cantidad })

  if (error) return { error: 'No se pudo realizar la asignación. Intenta de nuevo.' }

  revalidatePath('/inventarios')
  return { exito: `${cantidad} unidad${cantidad !== 1 ? 'es' : ''} asignada${cantidad !== 1 ? 's' : ''} correctamente.` }
}

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
