'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type EstadoAsignacion = { error?: string; exito?: string } | null

// Asignar utensilio a cocinera con la cantidad a descontar del stock
export async function asignarDesdeInventario(
  utensilioId: number,
  cocineraId: number,
  cantidad: number
): Promise<EstadoAsignacion> {
  const supabase = await crearClienteServidor()

  // Verificar si esta cocinera ya tiene este utensilio asignado
  const { data: existente } = await supabase
    .from('inventory')
    .select('id')
    .eq('utensils_id', utensilioId)
    .eq('cook_id', cocineraId)
    .maybeSingle()

  if (existente) {
    return { error: 'Esta cocinera ya tiene este utensilio asignado.' }
  }

  // Verificar stock disponible
  const { data: utensilio } = await supabase
    .from('utensils')
    .select('stock, inventory(stock)')
    .eq('id', utensilioId)
    .single()

  if (utensilio) {
    const stockTotal = (utensilio.stock as number | null) ?? 0
    const stockAsignado = (utensilio.inventory as { stock: number | null }[]).reduce(
      (acc, inv) => acc + (inv.stock ?? 1),
      0
    )
    const disponible = stockTotal - stockAsignado
    if (cantidad > disponible) {
      return { error: `Stock insuficiente. Solo hay ${disponible} unidad(es) disponible(s).` }
    }
  }

  const { error } = await supabase
    .from('inventory')
    .insert({ utensils_id: utensilioId, cook_id: cocineraId, stock: cantidad })

  if (error) return { error: 'No se pudo realizar la asignación. Intenta de nuevo.' }

  revalidatePath('/inventarios')
  return { exito: `${cantidad} unidad${cantidad !== 1 ? 'es' : ''} asignada${cantidad !== 1 ? 's' : ''} correctamente.` }
}
