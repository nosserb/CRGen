import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'info'
  action?: { label: string; run: () => void }
}

export type Notify = (message: string, options?: { tone?: Toast['tone']; action?: Toast['action']; duration?: number }) => void

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const notify = useCallback<Notify>(
    (message, options = {}) => {
      const id = ++seq.current
      setToasts((list) => [...list.slice(-2), { id, message, tone: options.tone ?? 'success', action: options.action }])
      setTimeout(() => dismiss(id), options.duration ?? (options.action ? 6000 : 3200))
    },
    [dismiss],
  )

  return { toasts, notify, dismiss }
}
