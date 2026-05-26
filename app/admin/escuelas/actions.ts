'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type EstadoFormularioEscuela = {
  error?: string
  exito?: string
} | null

// Validar y sanear campos del formulario de escuela
function validarCamposEscuela(datosFormulario: FormData) {
  const nombre = datosFormulario.get('nombre')?.toString().trim()
  const direccion = datosFormulario.get('direccion')?.toString().trim() || null

  if (!nombre || nombre.length < 2) {
    return { error: 'El nombre de la escuela debe tener al menos 2 caracteres.' }
  }
  if (nombre.length > 120) {
    return { error: 'El nombre no puede superar los 120 caracteres.' }
  }
  if (direccion && direccion.length > 200) {
    return { error: 'La dirección no puede superar los 200 caracteres.' }
  }

  return { datos: { nombre, direccion } }
}

// Crear nueva escuela en Supabase
export async function crearEscuela(
  estadoPrevio: EstadoFormularioEscuela,
  datosFormulario: FormData
): Promise<EstadoFormularioEscuela> {
  const validacion = validarCamposEscuela(datosFormulario)
  if (validacion.error) return { error: validacion.error }

  const { nombre, direccion } = validacion.datos!
  const supabase = await crearClienteServidor()

  // Verificar que no exista ya una escuela con el mismo nombre
  const { data: existente } = await supabase
    .from('school')
    .select('id')
    .ilike('name', nombre)
    .maybeSingle()

  if (existente) {
    return { error: `Ya existe una escuela con el nombre "${nombre}".` }
  }

  const { error } = await supabase.from('school').insert({
    name: nombre,
    address: direccion,
  })

  if (error) {
    console.error('Error creando escuela:', error.message)
    return { error: 'No se pudo registrar la escuela. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/escuelas')
  redirect('/admin/escuelas')
}

// Actualizar escuela existente en Supabase
export async function actualizarEscuela(
  id: number,
  estadoPrevio: EstadoFormularioEscuela,
  datosFormulario: FormData
): Promise<EstadoFormularioEscuela> {
  const validacion = validarCamposEscuela(datosFormulario)
  if (validacion.error) return { error: validacion.error }

  const { nombre, direccion } = validacion.datos!
  const supabase = await crearClienteServidor()

  // Verificar nombre duplicado excluyendo la escuela actual
  const { data: existente } = await supabase
    .from('school')
    .select('id')
    .ilike('name', nombre)
    .neq('id', id)
    .maybeSingle()

  if (existente) {
    return { error: `Ya existe otra escuela con el nombre "${nombre}".` }
  }

  const { error } = await supabase
    .from('school')
    .update({ name: nombre, address: direccion })
    .eq('id', id)

  if (error) {
    console.error('Error actualizando escuela:', error.message)
    return { error: 'No se pudo actualizar la escuela. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/escuelas')
  revalidatePath(`/admin/escuelas/${id}/editar`)
  redirect('/admin/escuelas')
}

// Eliminar escuela de Supabase
export async function eliminarEscuela(id: number): Promise<EstadoFormularioEscuela> {
  const supabase = await crearClienteServidor()

  // Verificar si tiene cocineras asignadas
  const { count } = await supabase
    .from('cook_school')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', id)

  if ((count ?? 0) > 0) {
    return {
      error: `No se puede eliminar: esta escuela tiene ${count} cocinera(s) asignada(s). Libera las asignaciones primero.`,
    }
  }

  const { error } = await supabase.from('school').delete().eq('id', id)

  if (error) {
    console.error('Error eliminando escuela:', error.message)
    return { error: 'No se pudo eliminar la escuela. Intenta de nuevo.' }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/escuelas')
  return { exito: 'Escuela eliminada correctamente.' }
}
