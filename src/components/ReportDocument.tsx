import { useState, type CSSProperties, type Dispatch, type ReactNode } from 'react'
import { ArrowRight, Copy, FileDown, Plus, Printer, Quote, RotateCcw, Trash2 } from 'lucide-react'
import type { Project, Report } from '../domain/types.ts'
import type { ReportEvent } from '../state/reportReducer.ts'
import { formatLong } from '../lib/dates.ts'
import { copyRich, download, toHtml, toMarkdown, toPlainText } from '../lib/exporters.ts'
import { Checkbox, DueField, EditableText, LotSelect, OwnerField } from './fields.tsx'
import type { Notify } from '../hooks/useToasts.ts'

interface ReportDocumentProps {
  report: Report
  project: Project
  dispatch: Dispatch<ReportEvent>
  notify: Notify
  onClose: () => void
}

const pad = (n: number) => String(n).padStart(2, '0')
const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

function Section({
  index,
  title,
  total,
  aside,
  children,
}: {
  index: number
  title: string
  total?: number
  aside?: ReactNode
  children: ReactNode
}) {
  const id = `section-${index}`
  return (
    <section className="doc-section" aria-labelledby={id} style={{ '--i': index } as CSSProperties}>
      <header className="section-head">
        <span className="section-num">{pad(index)}</span>
        <h2 className="section-title" id={id}>
          {title}
        </h2>
        {total !== undefined && <span className="section-count">{total}</span>}
        {aside && <div className="section-aside">{aside}</div>}
      </header>
      {children}
    </section>
  )
}

function SourceNote({ text, show }: { text: string; show: boolean }) {
  if (!show || !text) return null
  return (
    <p className="source">
      <Quote size={12} aria-hidden />
      <span>{text}</span>
    </p>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="icon-button row-remove" aria-label={label} title={label} onClick={onClick}>
      <Trash2 size={15} aria-hidden />
    </button>
  )
}

export function ReportDocument({ report, project, dispatch, notify, onClose }: ReportDocumentProps) {
  const [showSources, setShowSources] = useState(false)
  const participants = project.participants
  const present = participants.filter((p) => report.meta.participantIds.includes(p.id))
  const done = report.actions.filter((a) => a.done).length
  const progress = report.actions.length ? done / report.actions.length : 0

  /** Suppression avec annulation : on garde un instantané du document. */
  const removeWithUndo = (event: ReportEvent, message: string) => {
    const snapshot = report
    dispatch(event)
    notify(message, { tone: 'info', action: { label: 'Annuler', run: () => dispatch({ type: 'load', report: snapshot }) } })
  }

  const copy = async () => {
    try {
      await copyRich(toPlainText(report, project), toHtml(report, project))
      notify('Compte-rendu copié — prêt à coller dans un e-mail ou un document.')
    } catch {
      notify('Copie impossible : le navigateur a refusé l’accès au presse-papiers.', { tone: 'info' })
    }
  }

  const exportMd = () => {
    download(`${report.reference}.md`, toMarkdown(report, project))
    notify('Export Markdown téléchargé.')
  }

  const time = new Date(report.generatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <article className="document" aria-label="Compte-rendu généré">
      <div className="doc-toolbar">
        <p className="doc-generated">
          Généré à <span className="doc-generated-time">{time}</span>
        </p>
        <div className="doc-actions">
          <label className="switch">
            <input type="checkbox" checked={showSources} onChange={(e) => setShowSources(e.target.checked)} />
            <span className="switch-track" aria-hidden />
            Sources
          </label>
          <span className="toolbar-sep" aria-hidden />
          <button type="button" className="btn btn--secondary btn--sm" onClick={copy}>
            <Copy size={14} aria-hidden />
            Copier
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={exportMd}>
            <FileDown size={14} aria-hidden />
            Markdown
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => window.print()} title="Imprimer ou enregistrer en PDF">
            <Printer size={14} aria-hidden />
            Imprimer
          </button>
          <span className="toolbar-sep" aria-hidden />
          <button type="button" className="btn btn--quiet btn--sm" onClick={onClose} title="Fermer ce compte-rendu et repartir d’une page vierge">
            <RotateCcw size={14} aria-hidden />
            Nouveau
          </button>
        </div>
      </div>

      <div className="sheet">
        <header className="doc-head">
          <p className="eyebrow">
            Compte-rendu de réunion <span className="eyebrow-sep">·</span> <span className="ref">{report.reference}</span>
          </p>
          <h1 className="doc-title">
            <EditableText
              value={report.meta.title}
              placeholder="Titre de la réunion"
              label="Titre du compte-rendu"
              onSave={(text) => dispatch({ type: 'title', text })}
            />
          </h1>
          <dl className="doc-meta">
            <div>
              <dt>Projet</dt>
              <dd>
                {project.name}
                <span>{project.scope}</span>
              </dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd className="capitalize">{formatLong(report.meta.date)}</dd>
            </div>
            <div>
              <dt>Phase</dt>
              <dd>{project.phase}</dd>
            </div>
            <div className="doc-meta-wide">
              <dt>Participants</dt>
              <dd>{present.length ? present.map((p) => p.name).join(', ') : '—'}</dd>
            </div>
          </dl>
          <p className="doc-stats">
            {count(report.decisions.length, 'décision', 'décisions')}
            <span aria-hidden>·</span>
            {count(report.actions.length, 'action', 'actions')}
            <span aria-hidden>·</span>
            {count(report.checks.length, 'point à vérifier', 'points à vérifier')}
            <span aria-hidden>·</span>
            {count(report.infos.length, 'information', 'informations')}
          </p>
        </header>

        <Section index={1} title="Résumé">
          <EditableText
            className="summary"
            value={report.summary}
            label="Résumé"
            multiline
            onSave={(text) => dispatch({ type: 'summary', text })}
          />
        </Section>

        <Section index={2} title="Décisions" total={report.decisions.length}>
          {report.decisions.length ? (
            <ol className="decisions">
              {report.decisions.map((d, i) => (
                <li key={d.id} className="decision">
                  <span className="item-ref">D{i + 1}</span>
                  <div className="item-body">
                    <EditableText
                      value={d.text}
                      label={`Décision D${i + 1}`}
                      onSave={(text) =>
                        text ? dispatch({ type: 'decision.update', id: d.id, patch: { text } }) : dispatch({ type: 'decision.remove', id: d.id })
                      }
                    />
                    <div className="item-meta">
                      <LotSelect value={d.lot} onChange={(lot) => dispatch({ type: 'decision.update', id: d.id, patch: { lot } })} />
                      {d.raisedBy && <span className="item-by">Soulevée par {d.raisedBy}</span>}
                    </div>
                    <SourceNote text={d.source} show={showSources} />
                  </div>
                  <RemoveButton
                    label={`Supprimer la décision D${i + 1}`}
                    onClick={() => removeWithUndo({ type: 'decision.remove', id: d.id }, 'Décision supprimée.')}
                  />
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-line">Aucune décision relevée dans les notes.</p>
          )}
        </Section>

        <Section
          index={3}
          title="Actions"
          total={report.actions.length}
          aside={
            report.actions.length > 0 && (
              <div className="progress-wrap">
                <span className="progress-label">
                  {done}/{report.actions.length} réalisée{done > 1 ? 's' : ''}
                </span>
                <span
                  className="progress"
                  role="progressbar"
                  aria-label="Avancement des actions"
                  aria-valuemin={0}
                  aria-valuemax={report.actions.length}
                  aria-valuenow={done}
                >
                  <span style={{ transform: `scaleX(${progress})` }} />
                </span>
              </div>
            )
          }
        >
          {report.actions.length > 0 && (
            <table className="actions-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <span className="sr-only">Réalisée</span>
                  </th>
                  <th className="col-ref">N°</th>
                  <th>Action</th>
                  <th className="col-owner">Responsable</th>
                  <th className="col-due">Échéance</th>
                  <th className="col-remove">
                    <span className="sr-only">Supprimer</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.actions.map((a, i) => (
                  <tr key={a.id} className={a.done ? 'is-done' : undefined}>
                    <td className="col-check">
                      <Checkbox
                        checked={a.done}
                        label={`Action A${i + 1} réalisée`}
                        onChange={(v) => dispatch({ type: 'action.update', id: a.id, patch: { done: v } })}
                      />
                    </td>
                    <td className="col-ref">
                      <span className="item-ref">A{i + 1}</span>
                    </td>
                    <td className="col-text">
                      <EditableText
                        value={a.text}
                        label={`Libellé de l’action A${i + 1}`}
                        placeholder="Décrire l’action…"
                        startEditing={a.text === ''}
                        onSave={(text) =>
                          text
                            ? dispatch({ type: 'action.update', id: a.id, patch: { text } })
                            : dispatch({ type: 'action.remove', id: a.id })
                        }
                      />
                      <div className="item-meta">
                        <LotSelect value={a.lot} onChange={(lot) => dispatch({ type: 'action.update', id: a.id, patch: { lot } })} />
                      </div>
                      <SourceNote text={a.source} show={showSources} />
                    </td>
                    <td className="col-owner" data-label="Responsable">
                      <OwnerField
                        value={a.owner}
                        participants={participants}
                        label={`Responsable de l’action A${i + 1}`}
                        onChange={(owner) => dispatch({ type: 'action.update', id: a.id, patch: { owner } })}
                      />
                    </td>
                    <td className="col-due" data-label="Échéance">
                      <DueField
                        value={a.dueDate}
                        hint={a.dueHint}
                        done={a.done}
                        label={`Échéance de l’action A${i + 1}`}
                        onChange={(dueDate) => dispatch({ type: 'action.update', id: a.id, patch: { dueDate } })}
                      />
                    </td>
                    <td className="col-remove">
                      <RemoveButton
                        label={`Supprimer l’action A${i + 1}`}
                        onClick={() => removeWithUndo({ type: 'action.remove', id: a.id }, `Action A${i + 1} supprimée.`)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button type="button" className="btn btn--ghost btn--sm add-row" onClick={() => dispatch({ type: 'action.add' })}>
            <Plus size={14} aria-hidden />
            Ajouter une action
          </button>
        </Section>

        <Section index={4} title="Points à vérifier" total={report.checks.length}>
          {report.checks.length ? (
            <ul className="checks">
              {report.checks.map((c, i) => (
                <li key={c.id} className="check">
                  <span className="check-mark" aria-hidden />
                  <div className="item-body">
                    <EditableText
                      value={c.text}
                      label={`Point à vérifier ${i + 1}`}
                      onSave={(text) =>
                        text ? dispatch({ type: 'check.update', id: c.id, patch: { text } }) : dispatch({ type: 'check.remove', id: c.id })
                      }
                    />
                    <div className="item-meta">
                      <LotSelect value={c.lot} onChange={(lot) => dispatch({ type: 'check.update', id: c.id, patch: { lot } })} />
                      <button
                        type="button"
                        className="btn btn--link"
                        onClick={() => {
                          dispatch({ type: 'check.promote', id: c.id })
                          notify('Point converti en action — attribuez-lui un responsable.')
                        }}
                      >
                        Convertir en action
                        <ArrowRight size={13} aria-hidden />
                      </button>
                    </div>
                    <SourceNote text={c.source} show={showSources} />
                  </div>
                  <RemoveButton
                    label={`Supprimer le point ${i + 1}`}
                    onClick={() => removeWithUndo({ type: 'check.remove', id: c.id }, 'Point supprimé.')}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-line">Aucun point en suspens.</p>
          )}
        </Section>

        <Section index={5} title="Informations importantes" total={report.infos.length}>
          {report.infos.length ? (
            <ul className="infos">
              {report.infos.map((n, i) => (
                <li key={n.id} className="info">
                  <div className="item-body">
                    <EditableText
                      value={n.text}
                      label={`Information ${i + 1}`}
                      onSave={(text) =>
                        text ? dispatch({ type: 'info.update', id: n.id, patch: { text } }) : dispatch({ type: 'info.remove', id: n.id })
                      }
                    />
                    <div className="item-meta">
                      <LotSelect value={n.lot} onChange={(lot) => dispatch({ type: 'info.update', id: n.id, patch: { lot } })} />
                    </div>
                    <SourceNote text={n.source} show={showSources} />
                  </div>
                  <RemoveButton
                    label={`Supprimer l’information ${i + 1}`}
                    onClick={() => removeWithUndo({ type: 'info.remove', id: n.id }, 'Information supprimée.')}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-line">Aucune information complémentaire.</p>
          )}
        </Section>

        <footer className="doc-foot">
          <span>Document de travail — à relire et valider avant diffusion.</span>
          <span>Prototype · données fictives</span>
        </footer>
      </div>
    </article>
  )
}
