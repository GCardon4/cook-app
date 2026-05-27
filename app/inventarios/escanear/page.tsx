import { crearClienteServidor } from '@/lib/supabase/server'
import EscanerCodigo from './components/EscanerCodigo'

// Cargar lista de cocineras para el selector de asignación
async function obtenerCocineras() {
  const supabase = await crearClienteServidor()
  const { data } = await supabase
    .from('cook')
    .select('id, name')
    .order('name', { ascending: true })
  return (data ?? []) as { id: number; name: string }[]
}

export default async function PaginaEscanear() {
  const cocineras = await obtenerCocineras()

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-on-surface font-bold text-2xl md:text-3xl">
          Escanear Utensilio
        </h2>
        <p className="text-on-surface-variant text-base mt-1">
          Usa la cámara o un escáner físico para identificar utensilios al instante
        </p>
      </div>

      <EscanerCodigo cocineras={cocineras} />
    </div>
  )
}
