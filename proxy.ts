import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Verificar sesión, rol y proteger rutas privadas
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
  const esRutaAdmin = ruta.startsWith('/admin')
  const esRutaProtegida = esRutaAdmin || ruta.startsWith('/inventarios')

  // Sin sesión → redirigir al login
  if (!user && esRutaProtegida) {
    const url = solicitud.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en rutas que requieren chequeo de rol
  if (user && (esRutaAdmin || esRutaLogin)) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', user.id)
      .single()

    const esAdmin = perfil?.role_id === 1

    // role_id=2 intenta entrar al panel admin → redirigir a inventarios
    if (esRutaAdmin && !esAdmin) {
      const url = solicitud.nextUrl.clone()
      url.pathname = '/inventarios'
      return NextResponse.redirect(url)
    }

    // Ya tiene sesión e intenta acceder al login → redirigir al panel correcto
    if (esRutaLogin) {
      const url = solicitud.nextUrl.clone()
      url.pathname = esAdmin ? '/admin' : '/inventarios'
      return NextResponse.redirect(url)
    }
  }

  return respuestaSupabase
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
