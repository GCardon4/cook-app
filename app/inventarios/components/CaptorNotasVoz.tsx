'use client'

import { useState, useCallback } from 'react'

type CaptorNotasVozProps = {
  onGuardarNotas: (notas: string) => void
  deshabilitado?: boolean
  tieneNotas?: boolean
  nombreUtensilio?: string
  utensilioId?: number
}

export function CaptorNotasVoz({
  onGuardarNotas,
  deshabilitado = false,
  tieneNotas = false,
  nombreUtensilio = '',
  utensilioId,
}: CaptorNotasVozProps) {
  const [notas, setNotas] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const [errorVoz, setErrorVoz] = useState<string | null>(null)
  const [mostrandoForm, setMostrandoForm] = useState(false)

  // Iniciar captura de voz
  const iniciarCaptura = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setErrorVoz('Tu navegador no soporta reconocimiento de voz')
      return
    }

    setErrorVoz(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR()
    rec.lang = 'es-CO'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setEscuchando(true)
    rec.onend = () => setEscuchando(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setEscuchando(false)
      if (e.error === 'not-allowed') setErrorVoz('Permiso de micrófono denegado')
      else if (e.error === 'no-speech') setErrorVoz('No se detectó voz. Intenta de nuevo')
      setTimeout(() => setErrorVoz(null), 3000)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const texto = e.results[0][0].transcript.trim()
      setNotas((prev) => (prev ? `${prev} ${texto}` : texto))
    }

    try {
      rec.start()
    } catch {
      setEscuchando(false)
    }
  }, [])

  const guardarNotas = useCallback(() => {
    onGuardarNotas(notas)
    setMostrandoForm(false)
  }, [notas, onGuardarNotas])

  const limpiarNotas = useCallback(() => {
    setNotas('')
    setErrorVoz(null)
  }, [])

  if (!mostrandoForm) {
    return (
      <button
        onClick={() => setMostrandoForm(true)}
        disabled={deshabilitado}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          deshabilitado
            ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
            : 'bg-surface-container-lowest border border-outline-variant/20 text-on-surface hover:border-secondary hover:text-secondary'
        }`}
        title={tieneNotas ? 'Editar notas de devolución' : 'Agregar notas de devolución'}
      >
        <span className="material-symbols-outlined text-[18px] icon-fill">mic</span>
        {tieneNotas ? 'Editar notas' : 'Agregar notas'}
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] sm:max-h-[80vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
          <div>
            <p className="text-on-surface font-bold text-base sm:text-lg">Notas de devolución</p>
            {nombreUtensilio && (
              <p className="text-on-surface-variant text-xs sm:text-sm mt-0.5">
                Utensilio: <span className="font-semibold text-secondary">{nombreUtensilio}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setMostrandoForm(false)
              limpiarNotas()
            }}
            className="text-outline hover:text-on-surface transition-colors p-1"
            title="Cerrar"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Área de texto */}
          <div>
            <label className="block text-on-surface text-sm font-semibold mb-2">
              Describe cómo se entregó el utensilio
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Se entregó en buen estado, sin daños visibles..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-outline-variant/20 bg-surface-container text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary resize-none"
              rows={3}
            />
          </div>

          {/* Botón de micrófono */}
          <div>
            <p className="text-on-surface-variant text-xs font-semibold mb-2">Captura por voz</p>
            <button
              onClick={iniciarCaptura}
              disabled={escuchando}
              className={`w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                escuchando
                  ? 'bg-secondary text-on-secondary animate-pulse'
                  : 'bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/30'
              }`}
              title="Presiona para hablar"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px] icon-fill">
                {escuchando ? 'mic' : 'mic_none'}
              </span>
              <span className="hidden sm:inline">{escuchando ? 'Escuchando...' : 'Presiona para hablar'}</span>
              <span className="sm:hidden">{escuchando ? 'Escuchando...' : 'Hablar'}</span>
            </button>
          </div>

          {/* Mensaje de error */}
          {errorVoz && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error-container border border-error/20">
              <span className="material-symbols-outlined text-on-error-container text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <p className="text-on-error-container text-xs">{errorVoz}</p>
            </div>
          )}

          {/* Indicador de escucha */}
          {escuchando && (
            <div className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-secondary/8 border border-secondary/20">
              <div className="flex gap-0.5 items-end h-4">
                {[2, 4, 3, 5, 2].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-secondary rounded-full animate-pulse"
                    style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-secondary text-xs font-semibold ml-1">Capturando...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
          <button
            onClick={limpiarNotas}
            title="Limpiar notas"
            className="py-2 sm:py-2.5 px-2 rounded-lg border border-outline-variant/20 text-on-surface font-semibold text-xs sm:text-sm hover:bg-surface-container transition-all"
          >
            <span className="hidden sm:inline">Limpiar</span>
            <span className="sm:hidden">Limpiar</span>
          </button>
          <button
            onClick={() => {
              setMostrandoForm(false)
              limpiarNotas()
            }}
            title="Cancelar sin guardar"
            className="py-2 sm:py-2.5 px-2 rounded-lg bg-surface-container text-on-surface font-semibold text-xs sm:text-sm hover:bg-surface-container-high transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={guardarNotas}
            disabled={!notas.trim()}
            title="Guardar notas de devolución"
            className="py-2 sm:py-2.5 px-2 rounded-lg bg-secondary text-on-secondary font-semibold text-xs sm:text-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
