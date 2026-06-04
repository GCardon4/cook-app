import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Verificar sesión y proteger rutas privadas
export async function proxy(solicitud: NextRequest) {
  let respuestaSupabase = NextResponse.next({ request: solicitud })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return solicitud.cookies.getAll()
        },
        setAll(cookiesParaEstablecer) {
          cookiesParaEstablecer.forEach(({ name, value }) =>
            solicitud.cookies.set(name, value)
          )
          respuestaSupabase = NextResponse.next({ request: solicitud })
          cookiesParaEstablecer.forEach(({ name, value, options }) =>
            respuestaSupabase.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ruta = solicitud.nextUrl.pathname
  const esRutaLogin = ruta.startsWith('/login')
  const esRutaProtegida =
    ruta.startsWith('/admin') || ruta.startsWith('/inventarios')

  // Redirigir al login si no hay sesión activa
  if (!user && esRutaProtegida) {
    const url = solicitud.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirigir al admin si ya tiene sesión e intenta acceder al login
  if (user && esRutaLogin) {
    const url = solicitud.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return respuestaSupabase
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
