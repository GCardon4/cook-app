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
  revalidatePath('/inventarios/utensilios')
  return { exito: `${cantidad} unidad${cantidad !== 1 ? 'es' : ''} asignada${cantidad !== 1 ? 's' : ''} correctamente.` }
}

export type ItemInventarioCocinera = {
  inventarioId: number
  nombre: string
  sku: string | null
  cantidad: number
}

// Obtener el inventario actual asignado a una cocinera
export async function obtenerInventarioCocinera(
  cocineraId: number
): Promise<ItemInventarioCocinera[]> {
  const supabase = await crearClienteServidor()

  const { data } = await supabase
    .from('inventory')
    .select('id, stock, utensils:utensils_id(id, name, sku)')
    .eq('cook_id', cocineraId)
    .order('id')

  return (data ?? []).map((row) => {
    const u = Array.isArray(row.utensils) ? row.utensils[0] : row.utensils
    return {
      inventarioId: row.id as number,
      nombre: (u as { name: string } | null)?.name ?? 'Desconocido',
      sku: (u as { sku: string | null } | null)?.sku ?? null,
      cantidad: (row.stock as number | null) ?? 1,
    }
  })
}

export type ResultadoEscaneo = {
  exito?: string
  error?: string
  utensilio?: string
  inventarioId?: number
} | null

// Agregar 1 unidad al inventario de una cocinera escaneando por SKU
export async function agregarPorEscaneo(
  cocineraId: number,
  sku: string
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
  revalidatePath('/inventarios/utensilios')
  return { exito: `+1 ${utensilio.name}`, utensilio: utensilio.name as string }
}

// Entregar (devolver) 1 unidad de una cocinera escaneando por SKU
export async function entregarPorEscaneo(
  cocineraId: number,
  sku: string,
  notas?: string
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
  const updateData = notas ? { stock: stockActual - 1, notes: notas } : { stock: stockActual - 1 }

  if (stockActual <= 1) {
    const { error } = await supabase.from('inventory').delete().eq('id', inv.id)
    if (error) return { error: 'Error al eliminar asignación.' }
  } else {
    const { error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', inv.id)
    if (error) return { error: 'Error al actualizar asignación.' }
  }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/asignaciones')
  revalidatePath('/inventarios/utensilios')
  return { exito: `-1 ${utensilio.name}`, utensilio: utensilio.name as string, inventarioId: inv.id }
}

// Actualizar notas de un registro de inventario
export async function actualizarNotasInventario(
  inventarioId: number,
  notas: string
): Promise<EstadoAsignacion> {
  const supabase = await crearClienteServidor()

  const { error } = await supabase
    .from('inventory')
    .update({ notes: notas })
    .eq('id', inventarioId)

  if (error) return { error: 'Error al guardar las notas.' }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/asignaciones')
  revalidatePath('/inventarios/utensilios')
  return { exito: 'Notas guardadas correctamente.' }
}
