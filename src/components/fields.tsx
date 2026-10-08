import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, Check, ChevronDown, PencilLine, X } from 'lucide-react'
import { LOTS, type Lot } from '../domain/extraction.ts'
import type { Participant } from '../domain/types.ts'
import { daysBetween, formatShort, todayIso } from '../lib/dates.ts'
import { initials, lotKey } from '../lib/report.ts'

// ---------------------------------------------------------------------------
// Texte éditable en place
// ---------------------------------------------------------------------------

interface EditableTextProps {
  value: string
  onSave: (value: string) => void
  label: string
  placeholder?: string
  className?: string
  /** Entrée valide la saisie ; en multiligne, Ctrl/⌘ + Entrée. */
  multiline?: boolean
  startEditing?: boolean
}

export function EditableText({
  value,
  onSave,
  label,
  placeholder = 'Saisir…',
  className = '',
  multiline = false,
  startEditing = false,
}: EditableTextProps) {
  const [editing, setEditing] = useState(startEditing)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const autosize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useLayoutEffect(() => {
    if (!editing || !ref.current) return
    autosize()
    ref.current.focus()
    const end = ref.current.value.length
    ref.current.setSelectionRange(end, end)
  }, [editing])

  const close = (commit: boolean) => {
    setEditing(false)
    if (commit) {
      const next = draft.replace(/\s+/g, ' ').trim()
      if (next !== value) onSave(next)
    } else {
      setDraft(value)
      if (!value) onSave('')
    }
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close(false)
    } else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault()
      close(true)
    }
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        className={`editable-input ${className}`}
        value={draft}
        rows={1}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => {
          setDraft(e.target.value)
          autosize()
        }}
        onBlur={() => close(true)}
        onKeyDown={onKeyDown}
      />
    )
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className={`editable ${className}`}
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      title="Cliquer pour modifier"
    >
      <span className="sr-only">{label} : </span>
      <span className={value ? undefined : 'editable-placeholder'}>{value || placeholder}</span>
      <PencilLine className="editable-icon" size={14} aria-hidden />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Responsable
// ---------------------------------------------------------------------------

interface OwnerFieldProps {
  value: string | null
  participants: Participant[]
  onChange: (value: string | null) => void
  label: string
}

export function OwnerField({ value, participants, onChange, label }: OwnerFieldProps) {
  const known = participants.find((p) => p.name === value)
  return (
    <label className={`picker owner ${value ? '' : 'is-empty'}`}>
      <span className="picker-display">
        {value ? (
          <>
            <span className="avatar" aria-hidden>{initials(value)}</span>
            <span className="owner-text">
              <span className="owner-name">{value}</span>
              {known && <span className="owner-role">{known.role}</span>}
            </span>
          </>
        ) : (
          <span className="owner-unassigned">À attribuer</span>
        )}
        <ChevronDown className="picker-chevron" size={14} aria-hidden />
      </span>
      <select
        className="picker-native"
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">À attribuer</option>
        {participants.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name} — {p.role}
          </option>
        ))}
        {value && !known && <option value={value}>{value}</option>}
      </select>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Échéance
// ---------------------------------------------------------------------------

function dueStatus(date: string | null, done: boolean) {
  if (!date || done) return { tone: 'neutral', label: null as string | null }
  const d = daysBetween(todayIso(), date)
  if (d < 0) return { tone: 'late', label: `En retard de ${-d} j` }
  if (d === 0) return { tone: 'soon', label: 'Aujourd’hui' }
  if (d === 1) return { tone: 'soon', label: 'Demain' }
  if (d <= 3) return { tone: 'soon', label: `Dans ${d} jours` }
  return { tone: 'neutral', label: `Dans ${d} jours` }
}

interface DueFieldProps {
  value: string | null
  hint: string | null
  done: boolean
  onChange: (value: string | null) => void
  label: string
}

export function DueField({ value, hint, done, onChange, label }: DueFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const status = dueStatus(value, done)

  const open = () => {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <div className={`due tone-${status.tone}`}>
      <div className="due-line">
        <button type="button" className="due-button" onClick={open} aria-label={`${label} : ${value ? formatShort(value) : 'non définie'}. Modifier`}>
          <CalendarDays size={14} aria-hidden />
          <span className={value ? 'due-date' : 'due-empty'}>{value ? formatShort(value) : 'Non définie'}</span>
        </button>
        {value && (
          <button type="button" className="icon-button icon-button--xs" onClick={() => onChange(null)} aria-label="Retirer l’échéance">
            <X size={12} aria-hidden />
          </button>
        )}
      </div>
      {(status.label || hint) && (
        <span className="due-meta">
          {status.label && <span className="due-status">{status.label}</span>}
          {hint && <span className="due-hint" title="Expression relevée dans les notes">« {hint} »</span>}
        </span>
      )}
      <input
        ref={inputRef}
        type="date"
        className="due-native"
        tabIndex={-1}
        aria-hidden
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lot
// ---------------------------------------------------------------------------

export function LotSelect({ value, onChange }: { value: Lot; onChange: (lot: Lot) => void }) {
  return (
    <label className="picker lot-tag" data-lot={lotKey(value)}>
      <span className="picker-display">
        <span className="lot-dot" aria-hidden />
        {value}
        <ChevronDown className="picker-chevron" size={12} aria-hidden />
      </span>
      <select className="picker-native" aria-label="Lot" value={value} onChange={(e) => onChange(e.target.value as Lot)}>
        {LOTS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Case à cocher
// ---------------------------------------------------------------------------

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className="checkbox"
      onClick={() => onChange(!checked)}
    >
      <Check size={13} strokeWidth={3} aria-hidden />
    </button>
  )
}
