import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Crear cliente Supabase para el servidor (server components y actions)
export async function crearClienteServidor() {
  const almacenCookies = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacenCookies.getAll()
        },
        setAll(cookiesParaEstablecer) {
          try {
            cookiesParaEstablecer.forEach(({ name, value, options }) =>
              almacenCookies.set(name, value, options)
            )
          } catch {
            // Ignorado en Server Components sin capacidad de escritura
          }
        },
      },
    }
  )
}
