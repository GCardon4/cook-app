'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type EstadoFormularioUtensilio = { error?: string; exito?: string } | null

function validarCampos(datos: FormData) {
  const nombre = datos.get('nombre')?.toString().trim()
  const skuRaw = datos.get('sku')?.toString().trim()
  const descripcion = datos.get('descripcion')?.toString().trim() || null
  const stockRaw = datos.get('stock')?.toString().trim()

  if (!nombre || nombre.length < 2)
    return { error: 'El nombre debe tener al menos 2 caracteres.' }
  if (nombre.length > 100)
    return { error: 'El nombre no puede superar 100 caracteres.' }

  const sku = skuRaw || null
  if (sku && sku.length > 50)
    return { error: 'El SKU no puede superar 50 caracteres.' }

  const stock = stockRaw ? Number(stockRaw) : 0
  if (isNaN(stock) || stock < 0)
    return { error: 'El stock debe ser 0 o mayor.' }

  return { datos: { nombre, sku, descripcion, stock } }
}

function invalidarRutas() {
  revalidatePath('/inventarios/utensilios')
  revalidatePath('/admin/utensilios')
  revalidatePath('/admin')
}

// Crear nuevo utensilio desde el panel de inventarios
export async function crearUtensilioInventario(
  _estadoPrevio: EstadoFormularioUtensilio,
  datos: FormData
): Promise<EstadoFormularioUtensilio> {
  const validacion = validarCampos(datos)
  if (validacion.error) return { error: validacion.error }

  const { nombre, sku, descripcion, stock } = validacion.datos!
  const supabase = await crearClienteServidor()

  if (sku) {
    const { data: existente } = await supabase
      .from('utensils').select('id').eq('sku', sku).maybeSingle()
    if (existente) return { error: `Ya existe un utensilio con el SKU ${sku}.` }
  }

  const { error } = await supabase
    .from('utensils')
    .insert({ name: nombre, sku, description: descripcion, stock })

  if (error) return { error: 'No se pudo crear el utensilio. Intenta de nuevo.' }

  invalidarRutas()
  return { exito: `"${nombre}" registrado correctamente.` }
}

// Actualizar utensilio existente desde el panel de inventarios
export async function actualizarUtensilioInventario(
  id: number,
  _estadoPrevio: EstadoFormularioUtensilio,
  datos: FormData
): Promise<EstadoFormularioUtensilio> {
  const validacion = validarCampos(datos)
  if (validacion.error) return { error: validacion.error }

  const { nombre, sku, descripcion, stock } = validacion.datos!
  const supabase = await crearClienteServidor()

  if (sku) {
    const { data: existente } = await supabase
      .from('utensils').select('id').eq('sku', sku).neq('id', id).maybeSingle()
    if (existente) return { error: `El SKU ${sku} ya está en uso por otro utensilio.` }
  }

  const { error } = await supabase
    .from('utensils')
    .update({ name: nombre, sku, description: descripcion, stock, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: 'No se pudo actualizar el utensilio. Intenta de nuevo.' }

  invalidarRutas()
  return { exito: `"${nombre}" actualizado correctamente.` }
}

// Eliminar utensilio desde el panel de inventarios
export async function eliminarUtensilioInventario(id: number): Promise<EstadoFormularioUtensilio> {
  const supabase = await crearClienteServidor()

  const { count } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .eq('utensils_id', id)

  if ((count ?? 0) > 0)
    return { error: `No se puede eliminar: tiene ${count} asignación(es) activa(s). Libéralas primero.` }

  const { error } = await supabase.from('utensils').delete().eq('id', id)
  if (error) return { error: 'No se pudo eliminar. Intenta de nuevo.' }

  invalidarRutas()
  return { exito: 'Utensilio eliminado correctamente.' }
}
