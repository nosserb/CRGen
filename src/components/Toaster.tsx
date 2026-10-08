import { CircleAlert, CircleCheck } from 'lucide-react'
import type { Toast } from '../hooks/useToasts.ts'

export function Toaster({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.tone === 'success' ? <CircleCheck size={16} aria-hidden /> : <CircleAlert size={16} aria-hidden />}
          <span className="toast-message">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                t.action?.run()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
