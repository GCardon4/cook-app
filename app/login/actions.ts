'use server'

import { crearClienteServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type EstadoLogin = {
  error?: string
} | null

// Acción de autenticación con Supabase para ingreso al sistema
export async function accionLogin(
  estadoPrevio: EstadoLogin,
  datosFormulario: FormData
): Promise<EstadoLogin> {
  const email = datosFormulario.get('email') as string
  const contrasena = datosFormulario.get('contrasena') as string

  if (!email || !contrasena) {
    return { error: 'Por favor ingresa tu email y contraseña.' }
  }

  const supabase = await crearClienteServidor()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: contrasena,
  })

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Email o contraseña incorrectos.' }
    }
    return { error: 'Error al iniciar sesión. Intenta de nuevo.' }
  }

  // Obtener el rol del usuario para redirigir al panel correcto
  const { data: perfil } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', data.user.id)
    .single()

  // role_id 1 = Admin, cualquier otro = Inventarios
  if (perfil?.role_id === 1) {
    redirect('/admin')
  } else {
    redirect('/inventarios')
  }
}

// Acción de cierre de sesión
export async function accionCerrarSesion() {
  const supabase = await crearClienteServidor()
  await supabase.auth.signOut()
  redirect('/login')
}
