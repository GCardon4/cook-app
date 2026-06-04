import { crearClienteServidor } from '@/lib/supabase/server'
import NavInventarios from './components/NavInventarios'

// Obtener si el usuario autenticado es admin (role_id=1)
async function obtenerEsAdmin(): Promise<boolean> {
  const supabase = await crearClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: perfil } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', user.id)
    .single()
  return perfil?.role_id === 1
}

export default async function LayoutInventarios({
  children,
}: {
  children: React.ReactNode
}) {
  const esAdmin = await obtenerEsAdmin()
  return <NavInventarios esAdmin={esAdmin}>{children}</NavInventarios>
}
