import Link from 'next/link'
import { crearEscuela } from '../actions'
import FormularioEscuela from '../components/FormularioEscuela'

export default function PaginaNuevaEscuela() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Migas de pan */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <Link href="/admin/escuelas" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Escuelas
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Nueva</span>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] icon-fill">add_circle</span>
          </div>
          <div>
            <h2 className="text-on-surface font-bold text-xl">Nueva Escuela</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">
              Registra una nueva institución en el sistema
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6">
          <FormularioEscuela accion={crearEscuela} />
        </div>
      </div>
    </div>
  )
}
