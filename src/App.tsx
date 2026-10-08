import { useEffect, useReducer, useRef, useState } from 'react'
import { Composer, type ComposerState } from './components/Composer.tsx'
import { ReportDocument } from './components/ReportDocument.tsx'
import { EmptyState, ProcessingState } from './components/StageStates.tsx'
import { Toaster } from './components/Toaster.tsx'
import { useToasts } from './hooks/useToasts.ts'
import { TopBar } from './components/TopBar.tsx'
import { SAMPLES, findProject } from './data/projects.ts'
import type { Report } from './domain/types.ts'
import { todayIso } from './lib/dates.ts'
import { extractReport } from './lib/extractor.ts'
import { buildReport } from './lib/report.ts'
import { load, save } from './lib/storage.ts'
import { reportReducer } from './state/reportReducer.ts'

const FORM_KEY = 'cr.form.v1'
const REPORT_KEY = 'cr.report.v1'

function initialForm(): ComposerState {
  const sample = SAMPLES[0]
  const project = findProject(sample.projectId)
  return {
    projectId: project.id,
    title: sample.title,
    date: todayIso(),
    participantIds: project.participants.map((p) => p.id),
    notes: sample.notes,
  }
}

export default function App() {
  const [form, setForm] = useState<ComposerState>(() => load(FORM_KEY, initialForm()))
  const [report, dispatch] = useReducer(reportReducer, null, () => load<Report | null>(REPORT_KEY, null))
  const [busy, setBusy] = useState(false)
  const { toasts, notify, dismiss } = useToasts()
  const stageRef = useRef<HTMLElement>(null)

  useEffect(() => save(FORM_KEY, form), [form])
  useEffect(() => save(REPORT_KEY, report), [report])

  const generate = async () => {
    const project = findProject(form.projectId)
    const { notes, ...meta } = form
    setBusy(true)
    if (window.matchMedia('(max-width: 1080px)').matches) {
      stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    try {
      const date = meta.date || todayIso()
      const extracted = extractReport({
        notes,
        meeting: {
          title: meta.title,
          date,
          participants: project.participants
            .filter((p) => meta.participantIds.includes(p.id))
            .map((p) => ({ name: p.name, role: p.role })),
        },
      })
      // L'extraction est instantanée : un court délai laisse lire l'indicateur de traitement.
      await new Promise((resolve) => setTimeout(resolve, 1600))
      dispatch({ type: 'load', report: buildReport(extracted, { ...meta, date }, project) })
    } catch {
      notify('La génération a échoué. Vérifiez vos notes et réessayez.', { tone: 'info' })
    } finally {
      setBusy(false)
    }
  }

  const reportProject = report ? findProject(report.meta.projectId) : null

  return (
    <>
      <a className="skip-link" href="#stage">
        Aller au compte-rendu
      </a>
      <TopBar />
      <main className="workspace">
        <Composer value={form} onChange={setForm} onGenerate={generate} busy={busy} />

        <section className="stage" id="stage" ref={stageRef} aria-live="polite" aria-label="Compte-rendu">
          <div className="stage-body" key={busy ? 'busy' : report?.id ?? 'empty'}>
            {busy ? (
              <ProcessingState />
            ) : report && reportProject ? (
              <ReportDocument
                report={report}
                project={reportProject}
                dispatch={dispatch}
                notify={notify}
                onClose={() => {
                  const snapshot = report
                  dispatch({ type: 'load', report: null })
                  notify('Compte-rendu fermé.', {
                    tone: 'info',
                    action: { label: 'Rouvrir', run: () => dispatch({ type: 'load', report: snapshot }) },
                  })
                }}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </main>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  )
}
