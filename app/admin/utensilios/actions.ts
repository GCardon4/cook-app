'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type EstadoFormulario = {
  error?: string
  exito?: string
} | null

// Validar y sanear campos del formulario de utensilio
function validarCamposUtensilio(datosFormulario: FormData) {
  const nombre = datosFormulario.get('nombre')?.toString().trim()
  const skuRaw = datosFormulario.get('sku')?.toString().trim()
  const descripcion = datosFormulario.get('descripcion')?.toString().trim() || null

  if (!nombre || nombre.length < 2) {
    return { error: 'El nombre del utensilio debe tener al menos 2 caracteres.' }
  }
  if (nombre.length > 100) {
    return { error: 'El nombre no puede superar los 100 caracteres.' }
  }

  const sku = skuRaw ? Number(skuRaw) : null
  if (skuRaw && (isNaN(sku!) || sku! <= 0)) {
    return { error: 'El código SKU debe ser un número positivo.' }
  }

  return { datos: { nombre, sku, descripcion } }
}

// Crear nuevo utensilio en Supabase
export async function crearUtensilio(
  estadoPrevio: EstadoFormulario,
  datosFormulario: FormData
): Promise<EstadoFormulario> {
  const validacion = validarCamposUtensilio(datosFormulario)
  if (validacion.error) return { error: validacion.error }

  const { nombre, sku, descripcion } = validacion.datos!
  const supabase = await crearClienteServidor()

  // Verificar que el SKU no exista ya
  if (sku) {
    const { data: existente } = await supabase
      .from('utensils')
      .select('id')
      .eq('sku', sku)
      .maybeSingle()

    if (existente) {
      return { error: `Ya existe un utensilio con el SKU ${sku}.` }
    }
  }

  const { error } = await supabase.from('utensils').insert({
    name: nombre,
    sku,
    description: descripcion,
  })

  if (error) {
    console.error('Error creando utensilio:', error.message)
    return { error: 'No se pudo crear el utensilio. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/utensilios')
  redirect('/admin/utensilios')
}

// Actualizar utensilio existente en Supabase
export async function actualizarUtensilio(
  id: number,
  estadoPrevio: EstadoFormulario,
  datosFormulario: FormData
): Promise<EstadoFormulario> {
  const validacion = validarCamposUtensilio(datosFormulario)
  if (validacion.error) return { error: validacion.error }

  const { nombre, sku, descripcion } = validacion.datos!
  const supabase = await crearClienteServidor()

  // Verificar SKU duplicado (excluyendo el utensilio actual)
  if (sku) {
    const { data: existente } = await supabase
      .from('utensils')
      .select('id')
      .eq('sku', sku)
      .neq('id', id)
      .maybeSingle()

    if (existente) {
      return { error: `El SKU ${sku} ya está en uso por otro utensilio.` }
    }
  }

  const { error } = await supabase
    .from('utensils')
    .update({
      name: nombre,
      sku,
      description: descripcion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error actualizando utensilio:', error.message)
    return { error: 'No se pudo actualizar el utensilio. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/utensilios')
  revalidatePath(`/admin/utensilios/${id}/editar`)
  redirect('/admin/utensilios')
}

// Eliminar utensilio de Supabase
export async function eliminarUtensilio(id: number): Promise<EstadoFormulario> {
  const supabase = await crearClienteServidor()

  // Verificar si el utensilio tiene asignaciones activas
  const { count } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .eq('utensils_id', id)

  if ((count ?? 0) > 0) {
    return {
      error: `No se puede eliminar: este utensilio tiene ${count} asignación(es) activa(s). Libera las asignaciones primero.`,
    }
  }

  const { error } = await supabase.from('utensils').delete().eq('id', id)

  if (error) {
    console.error('Error eliminando utensilio:', error.message)
    return { error: 'No se pudo eliminar el utensilio. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/utensilios')
  return { exito: 'Utensilio eliminado correctamente.' }
}
