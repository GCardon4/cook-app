'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type EstadoAsignacion = { error?: string; exito?: string } | null

// Obtener colegios asignados a una cocinera
export async function obtenerEscuelasCocinera(
  cocineraId: number
): Promise<{ id: number; name: string }[]> {
  const supabase = await crearClienteServidor()

  const { data } = await supabase
    .from('cook_school')
    .select('school:school_id(id, name)')
    .eq('cook_id', cocineraId)

  return (data ?? []).map((row) => {
    const s = Array.isArray(row.school) ? row.school[0] : row.school
    return { id: (s as { id: number; name: string } | null)?.id ?? 0, name: (s as { id: number; name: string } | null)?.name ?? '' }
  }).filter((s) => s.id > 0)
}

// Resolver school_id de forma segura: validar que sea colegio actual, o usar el primero disponible
async function resolverSchoolIdActual(
  cocineraId: number,
  schoolIdSugerido?: number | null
): Promise<number | null> {
  const escuelas = await obtenerEscuelasCocinera(cocineraId)

  // Si se sugiere un school_id, validar que siga siendo asignado a esta cocinera
  if (schoolIdSugerido && escuelas.some((e) => e.id === schoolIdSugerido)) {
    return schoolIdSugerido
  }

  // Si no es válido, usar el primero disponible o null
  return escuelas.length > 0 ? escuelas[0].id : null
}

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
  utensilioId?: number
  movimientoId?: number
} | null

// Agregar 1 unidad al inventario de una cocinera escaneando por SKU
export async function agregarPorEscaneo(
  cocineraId: number,
  sku: string,
  schoolId?: number | null
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
      .update({ stock: (existente.stock ?? 1) + 1, return_date: null })
      .eq('id', existente.id)
    if (error) return { error: 'Error al actualizar asignación.' }
  } else {
    const { error } = await supabase
      .from('inventory')
      .insert({ utensils_id: utensilio.id, cook_id: cocineraId, stock: 1, add_date: new Date().toISOString() })
    if (error) return { error: 'Error al crear asignación.' }
  }

  // Resolver school_id actual de forma segura (validar que siga siendo válido)
  const schoolIdActual = await resolverSchoolIdActual(cocineraId, schoolId)

  // Registrar movimiento en el historial
  const { data: movimiento, error: errMovimiento } = await supabase
    .from('inventory_movements')
    .insert({
      cook_id: cocineraId,
      utensils_id: utensilio.id,
      school_id: schoolIdActual,
      type: 'agregado',
      quantity: 1,
    })
    .select('id')
    .single()

  if (errMovimiento) {
    console.error('Error registrando movimiento:', errMovimiento.message)
    // No retornar error, el movimiento es secundario
  }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/asignaciones')
  revalidatePath('/inventarios/utensilios')
  revalidatePath('/admin/asignaciones')
  return {
    exito: `+1 ${utensilio.name}`,
    utensilio: utensilio.name as string,
    inventarioId: existente?.id || 0,
    utensilioId: utensilio.id,
    movimientoId: (movimiento?.id as number) ?? 0,
  }
}

// Entregar (devolver) 1 unidad de una cocinera escaneando por SKU
export async function entregarPorEscaneo(
  cocineraId: number,
  sku: string,
  notas?: string,
  schoolId?: number | null
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
  const ahora = new Date().toISOString()

  if (stockActual <= 1) {
    // Última unidad: establecer return_date antes de eliminar
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ stock: 0, return_date: ahora })
      .eq('id', inv.id)
    if (updateError) return { error: 'Error al actualizar asignación.' }

    const { error: deleteError } = await supabase.from('inventory').delete().eq('id', inv.id)
    if (deleteError) return { error: 'Error al eliminar asignación.' }
  } else {
    const { error } = await supabase
      .from('inventory')
      .update({ stock: stockActual - 1, return_date: ahora })
      .eq('id', inv.id)
    if (error) return { error: 'Error al actualizar asignación.' }
  }

  // Resolver school_id actual de forma segura (validar que siga siendo válido)
  const schoolIdActual = await resolverSchoolIdActual(cocineraId, schoolId)

  // Registrar movimiento en el historial
  const { data: movimiento, error: errMovimiento } = await supabase
    .from('inventory_movements')
    .insert({
      cook_id: cocineraId,
      utensils_id: utensilio.id,
      school_id: schoolIdActual,
      type: 'entregado',
      quantity: 1,
      notes: notas ?? null,
    })
    .select('id')
    .single()

  if (errMovimiento) {
    console.error('Error registrando movimiento:', errMovimiento.message)
    // No retornar error, el movimiento es secundario
  }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/asignaciones')
  revalidatePath('/inventarios/utensilios')
  revalidatePath('/admin/asignaciones')
  return {
    exito: `-1 ${utensilio.name}`,
    utensilio: utensilio.name as string,
    inventarioId: inv.id,
    utensilioId: utensilio.id,
    movimientoId: (movimiento?.id as number) ?? 0,
  }
}

// Actualizar notas de un movimiento en el historial
export async function actualizarNotasMovimiento(
  movimientoId: number,
  notas: string
): Promise<EstadoAsignacion> {
  const supabase = await crearClienteServidor()

  const { error } = await supabase
    .from('inventory_movements')
    .update({ notes: notas })
    .eq('id', movimientoId)

  if (error) return { error: 'Error al guardar las notas.' }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/asignaciones')
  revalidatePath('/admin/asignaciones')
  return { exito: 'Notas guardadas correctamente.' }
}
