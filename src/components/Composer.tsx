import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, BookOpenText, ChevronDown, Eraser } from 'lucide-react'
import { PROJECTS, SAMPLES, findProject, type NoteSample } from '../data/projects.ts'
import type { MeetingMeta } from '../domain/types.ts'
import { initials } from '../lib/report.ts'

export interface ComposerState extends MeetingMeta {
  notes: string
}

interface ComposerProps {
  value: ComposerState
  onChange: (next: ComposerState) => void
  onGenerate: () => void
  busy: boolean
}

function SamplesMenu({ projectId, onPick }: { projectId: string; onPick: (s: NoteSample) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const ordered = [...SAMPLES].sort((a, b) => Number(b.projectId === projectId) - Number(a.projectId === projectId))

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <BookOpenText size={14} aria-hidden />
        Exemples
        <ChevronDown size={13} aria-hidden className={open ? 'rotate' : undefined} />
      </button>
      {open && (
        <div className="menu-panel" id={menuId} role="menu">
          <p className="menu-caption">Notes de démonstration (fictives)</p>
          {ordered.map((s) => (
            <button
              key={s.id}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                onPick(s)
                setOpen(false)
              }}
            >
              <span className="menu-item-title">{s.label}</span>
              <span className="menu-item-sub">
                {findProject(s.projectId).name} · {s.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Composer({ value, onChange, onGenerate, busy }: ComposerProps) {
  const project = findProject(value.projectId)
  const set = (patch: Partial<ComposerState>) => onChange({ ...value, ...patch })
  const words = value.notes.trim() ? value.notes.trim().split(/\s+/).length : 0
  const canGenerate = value.notes.trim().length > 0 && !busy

  const toggleParticipant = (id: string) =>
    set({
      participantIds: value.participantIds.includes(id)
        ? value.participantIds.filter((p) => p !== id)
        : [...value.participantIds, id],
    })

  return (
    <aside className="composer" aria-labelledby="composer-title">
      <div className="composer-head">
        <p className="eyebrow">Nouveau compte-rendu</p>
        <h1 id="composer-title" className="composer-title">
          Notes de réunion
        </h1>
        <p className="composer-lead">
          Collez vos notes brutes. Décisions, actions, responsables et échéances sont extraits puis mis en forme.
        </p>
      </div>

      <form
        className="composer-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (canGenerate) onGenerate()
        }}
      >
        <div className="field">
          <label className="field-label" htmlFor="project">
            Projet
          </label>
          <div className="select">
            <select
              id="project"
              value={value.projectId}
              onChange={(e) => {
                const next = findProject(e.target.value)
                set({ projectId: next.id, participantIds: next.participants.map((p) => p.id) })
              }}
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.code}
                </option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden className="select-chevron" />
          </div>
          <p className="field-help">
            <span className="phase-chip">{project.phase}</span>
            {project.scope}
          </p>
        </div>

        <div className="field-row">
          <div className="field field--grow">
            <label className="field-label" htmlFor="title">
              Réunion
            </label>
            <input
              id="title"
              className="input"
              value={value.title}
              placeholder="Ex. Réunion de synthèse n°7"
              onChange={(e) => set({ title: e.target.value })}
            />
          </div>
          <div className="field field--date">
            <label className="field-label" htmlFor="date">
              Date
            </label>
            <input
              id="date"
              type="date"
              className="input"
              value={value.date}
              onChange={(e) => set({ date: e.target.value })}
              required
            />
          </div>
        </div>

        <fieldset className="field">
          <legend className="field-label">
            Participants <span className="field-count">{value.participantIds.length}/{project.participants.length}</span>
          </legend>
          <div className="chips">
            {project.participants.map((p) => {
              const on = value.participantIds.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`chip ${on ? 'is-on' : ''}`}
                  aria-pressed={on}
                  title={`${p.name} — ${p.role}`}
                  onClick={() => toggleParticipant(p.id)}
                >
                  <span className="chip-avatar" aria-hidden>
                    {initials(p.name)}
                  </span>
                  {p.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="field field--notes">
          <div className="field-label-row">
            <label className="field-label" htmlFor="notes">
              Notes brutes
            </label>
            <div className="field-tools">
              <SamplesMenu
                projectId={value.projectId}
                onPick={(s) => {
                  const p = findProject(s.projectId)
                  set({
                    projectId: p.id,
                    title: s.title,
                    notes: s.notes,
                    participantIds: p.participants.map((x) => x.id),
                  })
                }}
              />
              <button
                type="button"
                className="btn btn--quiet btn--sm"
                onClick={() => set({ notes: '' })}
                disabled={!value.notes}
              >
                <Eraser size={14} aria-hidden />
                Effacer
              </button>
            </div>
          </div>
          <div className="notes-box">
            <textarea
              id="notes"
              className="notes"
              value={value.notes}
              spellCheck
              placeholder={'Jean indique que la CTA du bâtiment B doit être modifiée…\nMarie doit vérifier le coût de la nouvelle CTA pour vendredi…'}
              onChange={(e) => set({ notes: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canGenerate) {
                  e.preventDefault()
                  onGenerate()
                }
              }}
            />
            <div className="notes-foot">
              <span>{words.toLocaleString('fr-FR')} mots</span>
              <span className="notes-hint">Une idée par phrase donne les meilleurs résultats</span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={!canGenerate} aria-busy={busy}>
          {busy ? (
            <>
              <span className="bars bars--light" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              Analyse des notes…
            </>
          ) : (
            <>
              Générer le compte-rendu
              <ArrowRight size={17} aria-hidden className="btn-arrow" />
            </>
          )}
        </button>
        <p className="composer-shortcut">
          <kbd>Ctrl</kbd> + <kbd>Entrée</kbd> depuis la zone de notes
        </p>
      </form>
    </aside>
  )
}
