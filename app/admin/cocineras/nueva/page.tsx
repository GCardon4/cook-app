import Link from 'next/link'
import { crearCocinera } from '../actions'
import FormularioCocinera from '../components/FormularioCocinera'

export default function PaginaNuevaCocinera() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Migas de pan */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/admin" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <Link href="/admin/cocineras" className="text-on-surface-variant hover:text-on-surface transition-colors">
          Cocineras
        </Link>
        <span className="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Nueva</span>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-container-high/50 overflow-hidden">
        {/* Encabezado */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] icon-fill">person_add</span>
          </div>
          <div>
            <h2 className="text-on-surface font-bold text-xl">Nueva Cocinera</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">
              Registra una nueva cocinera en el sistema
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6">
          <FormularioCocinera accion={crearCocinera} />
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
        <span className="material-symbols-outlined text-outline text-[18px] shrink-0 mt-0.5">info</span>
        <p className="text-on-surface-variant text-xs">
          Después de registrar la cocinera podrás asignarle escuelas e inventario de utensilios desde el módulo de <strong className="text-on-surface">Asignaciones</strong>.
        </p>
      </div>
    </div>
  )
}
