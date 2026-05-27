'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type AsignacionDetalle = {
  id: number
  cocineraId: number
  nombreCocinera: string
  stockAsignado: number
}

export type ResultadoScan = {
  id: number
  name: string
  sku: number | null
  description: string | null
  stockTotal: number
  stockAsignado: number
  stockDisponible: number
  asignaciones: AsignacionDetalle[]
} | null

export type EstadoAsignacion = { error?: string; exito?: string } | null

// Buscar utensilio por código SKU con detalle de stock
export async function buscarPorSKU(sku: number): Promise<ResultadoScan> {
  const supabase = await crearClienteServidor()

  const { data, error } = await supabase
    .from('utensils')
    .select(`
      id, name, sku, description, stock,
      inventory (
        id,
        cook_id,
        stock,
        cook:cook_id ( id, name )
      )
    `)
    .eq('sku', sku)
    .maybeSingle()

  if (error || !data) return null

  const invRows = data.inventory as {
    id: number
    cook_id: number
    stock: number | null
    cook: { id: number; name: string }[] | { id: number; name: string } | null
  }[]

  const asignaciones: AsignacionDetalle[] = invRows.map((inv) => {
    const cook = Array.isArray(inv.cook) ? inv.cook[0] : inv.cook
    return {
      id: inv.id,
      cocineraId: inv.cook_id,
      nombreCocinera: cook?.name ?? 'Desconocida',
      stockAsignado: inv.stock ?? 1,
    }
  })

  const stockTotal = (data.stock as number | null) ?? 0
  const stockAsignado = asignaciones.reduce((acc, a) => acc + a.stockAsignado, 0)

  return {
    id: data.id as number,
    name: data.name as string,
    sku: data.sku as number | null,
    description: data.description as string | null,
    stockTotal,
    stockAsignado,
    stockDisponible: Math.max(0, stockTotal - stockAsignado),
    asignaciones,
  }
}

// Asignar utensilio a cocinera con cantidad especificada
export async function asignarUtensilio(
  utensilioId: number,
  cocineraId: number,
  cantidad: number
): Promise<EstadoAsignacion> {
  const supabase = await crearClienteServidor()

  // Verificar si ya está asignado a esta cocinera
  const { data: existente } = await supabase
    .from('inventory')
    .select('id, stock')
    .eq('utensils_id', utensilioId)
    .eq('cook_id', cocineraId)
    .maybeSingle()

  if (existente) {
    return { error: 'Este utensilio ya está asignado a esa cocinera.' }
  }

  // Verificar stock disponible
  const { data: utensilio } = await supabase
    .from('utensils')
    .select(`stock, inventory(stock)`)
    .eq('id', utensilioId)
    .single()

  if (utensilio) {
    const totalStock = (utensilio.stock as number | null) ?? 0
    const asignado = (utensilio.inventory as { stock: number | null }[]).reduce(
      (acc, inv) => acc + (inv.stock ?? 1),
      0
    )
    const disponible = totalStock - asignado
    if (cantidad > disponible) {
      return {
        error: `Stock insuficiente. Disponible: ${disponible} unidad(es).`,
      }
    }
  }

  const { error } = await supabase
    .from('inventory')
    .insert({ utensils_id: utensilioId, cook_id: cocineraId, stock: cantidad })

  if (error) return { error: 'No se pudo realizar la asignación. Intenta de nuevo.' }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/escanear')
  return { exito: `${cantidad} unidad(es) asignada(s) correctamente.` }
}

// Registrar entrega (devolución parcial o total de una cocinera)
export async function registrarEntrega(
  inventarioId: number,
  cantidadDevuelta: number
): Promise<EstadoAsignacion> {
  const supabase = await crearClienteServidor()

  const { data: inv } = await supabase
    .from('inventory')
    .select('stock')
    .eq('id', inventarioId)
    .single()

  if (!inv) return { error: 'No se encontró la asignación.' }

  const stockActual = (inv.stock as number | null) ?? 1
  const nuevoStock = stockActual - cantidadDevuelta

  if (nuevoStock <= 0) {
    // Eliminar asignación si devuelve todo
    const { error } = await supabase.from('inventory').delete().eq('id', inventarioId)
    if (error) return { error: 'No se pudo registrar la entrega.' }
  } else {
    const { error } = await supabase
      .from('inventory')
      .update({ stock: nuevoStock })
      .eq('id', inventarioId)
    if (error) return { error: 'No se pudo registrar la entrega.' }
  }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/escanear')
  return {
    exito:
      nuevoStock <= 0
        ? 'Entrega completa registrada. Asignación liberada.'
        : `Entrega de ${cantidadDevuelta} unidad(es) registrada.`,
  }
}

// Recibir nuevas unidades (aumentar stock total del utensilio)
export async function recibirStock(
  utensilioId: number,
  cantidad: number
): Promise<EstadoAsignacion> {
  const supabase = await crearClienteServidor()

  const { data: utensilio } = await supabase
    .from('utensils')
    .select('stock')
    .eq('id', utensilioId)
    .single()

  if (!utensilio) return { error: 'Utensilio no encontrado.' }

  const stockActual = (utensilio.stock as number | null) ?? 0
  const nuevoStock = stockActual + cantidad

  const { error } = await supabase
    .from('utensils')
    .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
    .eq('id', utensilioId)

  if (error) return { error: 'No se pudo actualizar el stock.' }

  revalidatePath('/inventarios')
  revalidatePath('/inventarios/escanear')
  revalidatePath('/admin/utensilios')
  return { exito: `Stock actualizado: +${cantidad} unidad(es). Total: ${nuevoStock}.` }
}
