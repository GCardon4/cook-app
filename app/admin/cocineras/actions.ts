'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type EstadoFormularioCocinera = {
  error?: string
  exito?: string
} | null

// Validar y sanear campos del formulario de cocinera
function validarCamposCocinera(datosFormulario: FormData) {
  const nombre = datosFormulario.get('nombre')?.toString().trim()
  const docRaw = datosFormulario.get('doc')?.toString().trim()
  const phoneRaw = datosFormulario.get('phone')?.toString().trim()

  if (!nombre || nombre.length < 2) {
    return { error: 'El nombre debe tener al menos 2 caracteres.' }
  }
  if (nombre.length > 100) {
    return { error: 'El nombre no puede superar los 100 caracteres.' }
  }

  const doc = docRaw ? Number(docRaw) : null
  if (docRaw && (isNaN(doc!) || doc! <= 0)) {
    return { error: 'La cédula debe ser un número positivo.' }
  }

  const phone = phoneRaw ? Number(phoneRaw) : null
  if (phoneRaw && (isNaN(phone!) || phone! <= 0)) {
    return { error: 'El teléfono debe ser un número válido.' }
  }

  return { datos: { nombre, doc, phone } }
}

// Crear nueva cocinera en Supabase
export async function crearCocinera(
  estadoPrevio: EstadoFormularioCocinera,
  datosFormulario: FormData
): Promise<EstadoFormularioCocinera> {
  const validacion = validarCamposCocinera(datosFormulario)
  if (validacion.error) return { error: validacion.error }

  const { nombre, doc, phone } = validacion.datos!
  const supabase = await crearClienteServidor()

  // Verificar cédula duplicada
  if (doc) {
    const { data: existente } = await supabase
      .from('cook')
      .select('id')
      .eq('doc', doc)
      .maybeSingle()

    if (existente) {
      return { error: `Ya existe una cocinera registrada con la cédula ${doc}.` }
    }
  }

  const { error } = await supabase.from('cook').insert({
    name: nombre,
    doc,
    phone,
  })

  if (error) {
    console.error('Error creando cocinera:', error.message)
    return { error: 'No se pudo registrar la cocinera. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/cocineras')
  redirect('/admin/cocineras')
}

// Actualizar cocinera existente en Supabase
export async function actualizarCocinera(
  id: number,
  estadoPrevio: EstadoFormularioCocinera,
  datosFormulario: FormData
): Promise<EstadoFormularioCocinera> {
  const validacion = validarCamposCocinera(datosFormulario)
  if (validacion.error) return { error: validacion.error }

  const { nombre, doc, phone } = validacion.datos!
  const supabase = await crearClienteServidor()

  // Verificar cédula duplicada excluyendo la cocinera actual
  if (doc) {
    const { data: existente } = await supabase
      .from('cook')
      .select('id')
      .eq('doc', doc)
      .neq('id', id)
      .maybeSingle()

    if (existente) {
      return { error: `La cédula ${doc} ya está registrada en otra cocinera.` }
    }
  }

  const { error } = await supabase
    .from('cook')
    .update({ name: nombre, doc, phone })
    .eq('id', id)

  if (error) {
    console.error('Error actualizando cocinera:', error.message)
    return { error: 'No se pudo actualizar la cocinera. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/cocineras')
  revalidatePath(`/admin/cocineras/${id}/editar`)
  redirect('/admin/cocineras')
}

// Sincronizar escuelas asignadas a una cocinera
export async function asignarEscuelasCocinera(
  cookId: number,
  schoolIds: number[]
): Promise<EstadoFormularioCocinera> {
  const supabase = await crearClienteServidor()

  const { error: deleteError } = await supabase
    .from('cook_school')
    .delete()
    .eq('cook_id', cookId)

  if (deleteError) {
    console.error('Error eliminando escuelas:', deleteError.message)
    return { error: 'No se pudieron actualizar las escuelas. Intenta de nuevo.' }
  }

  if (schoolIds.length > 0) {
    const { error: insertError } = await supabase
      .from('cook_school')
      .insert(schoolIds.map((schoolId) => ({ cook_id: cookId, school_id: schoolId })))

    if (insertError) {
      console.error('Error asignando escuelas:', insertError.message)
      return { error: 'No se pudieron asignar las escuelas. Intenta de nuevo.' }
    }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/cocineras')
  return { exito: 'Escuelas actualizadas correctamente.' }
}

// Eliminar cocinera de Supabase
export async function eliminarCocinera(id: number): Promise<EstadoFormularioCocinera> {
  const supabase = await crearClienteServidor()

  // Verificar escuelas asignadas
  const { count: countEscuelas } = await supabase
    .from('cook_school')
    .select('*', { count: 'exact', head: true })
    .eq('cook_id', id)

  if ((countEscuelas ?? 0) > 0) {
    return {
      error: `No se puede eliminar: la cocinera tiene ${countEscuelas} escuela(s) asignada(s). Libera las asignaciones primero.`,
    }
  }

  // Verificar utensilios en inventario
  const { count: countUtensilios } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .eq('cook_id', id)

  if ((countUtensilios ?? 0) > 0) {
    return {
      error: `No se puede eliminar: la cocinera tiene ${countUtensilios} utensilio(s) asignado(s) en inventario. Libera el inventario primero.`,
    }
  }

  const { error } = await supabase.from('cook').delete().eq('id', id)

  if (error) {
    console.error('Error eliminando cocinera:', error.message)
    return { error: 'No se pudo eliminar la cocinera. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/cocineras')
  return { exito: 'Cocinera eliminada correctamente.' }
}
