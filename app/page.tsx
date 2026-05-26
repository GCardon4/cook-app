import { redirect } from 'next/navigation'

// Redirigir la raíz al login
export default function PaginaRaiz() {
  redirect('/login')
}
