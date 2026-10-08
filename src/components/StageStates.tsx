import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

const SECTIONS = [
  ['Résumé', 'L’essentiel de la réunion en quelques lignes.'],
  ['Décisions', 'Les choix actés, avec leur origine.'],
  ['Actions', 'Qui fait quoi, et pour quand.'],
  ['Points à vérifier', 'Incertitudes et impacts à confirmer.'],
  ['Informations importantes', 'Chiffres, jalons et faits à retenir.'],
] as const

export function EmptyState() {
  return (
    <div className="sheet sheet--empty">
      <p className="eyebrow">Aperçu</p>
      <p className="empty-title">Le compte-rendu structuré apparaîtra ici.</p>
      <ol className="empty-outline">
        {SECTIONS.map(([title, text], i) => (
          <li key={title}>
            <span className="empty-num">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <span className="empty-name">{title}</span>
              <span className="empty-text">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="empty-foot">Chaque élément reste modifiable et rattaché à l’extrait de notes dont il provient.</p>
    </div>
  )
}

const STEPS = [
  'Lecture des notes',
  'Repérage des décisions',
  'Extraction des actions et des responsables',
  'Résolution des échéances',
  'Mise en forme du compte-rendu',
]

export function ProcessingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 360)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="sheet sheet--processing" aria-busy="true">
      <div className="processing-head">
        <span className="bars" aria-hidden>
          <span />
          <span />
          <span />
        </span>
        <div>
          <p className="eyebrow">Traitement en cours</p>
          <p className="processing-title">{STEPS[step]}…</p>
        </div>
      </div>
      <ol className="steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'is-done' : i === step ? 'is-active' : undefined}>
            <span className="step-mark" aria-hidden>
              {i < step && <Check size={11} strokeWidth={3} />}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <div className="skeleton" aria-hidden>
        <span style={{ width: '38%' }} />
        <span style={{ width: '92%' }} />
        <span style={{ width: '84%' }} />
        <span style={{ width: '61%' }} />
      </div>
    </div>
  )
}
