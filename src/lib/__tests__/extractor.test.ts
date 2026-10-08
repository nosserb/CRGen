import { describe, expect, it } from 'vitest'
import { extractReport } from '../extractor.ts'
import { LOTS } from '../../domain/extraction.ts'
import { PROJECTS, SAMPLES } from '../../data/projects.ts'

const project = PROJECTS[0]
const meeting = {
  title: 'Point CVC',
  date: '2026-10-08',
  participants: project.participants.map((p) => ({ name: p.name, role: p.role })),
}

describe('extracteur de notes', () => {
  const report = extractReport({ notes: SAMPLES[0].notes, meeting })

  it('attribue un lot connu à chaque élément', () => {
    const items = [...report.decisions, ...report.actions, ...report.checks, ...report.key_infos]
    expect(items.every((i) => LOTS.includes(i.lot))).toBe(true)
  })

  it('identifie la décision et son origine', () => {
    expect(report.decisions).toHaveLength(1)
    expect(report.decisions[0].text).toMatch(/^Modification de la CTA du bâtiment B/)
    expect(report.decisions[0].raised_by).toBe('Jean')
    expect(report.decisions[0].lot).toBe('CVC')
  })

  it('extrait les actions, responsables et échéances', () => {
    expect(report.actions.map((a) => [a.text, a.owner, a.due_date])).toEqual([
      ['Vérifier le coût de la nouvelle CTA', 'Marie', '2026-10-09'],
      ['Suivre la réception des nouveaux plans architecte', 'Paul', '2026-10-09'],
    ])
    expect(report.actions[1].due_hint).toBe('vendredi matin')
  })

  it('classe la vérification thermique en point à vérifier, avec coréférence résolue', () => {
    expect(report.checks).toHaveLength(1)
    expect(report.checks[0].text).toContain('la modification de la CTA du bâtiment B')
    expect(report.checks[0].lot).toBe('Thermique')
  })

  it('traite tous les jeux de notes fournis', () => {
    for (const sample of SAMPLES) {
      const p = PROJECTS.find((x) => x.id === sample.projectId)!
      const r = extractReport({
        notes: sample.notes,
        meeting: { ...meeting, participants: p.participants.map((x) => ({ name: x.name, role: x.role })) },
      })
      expect(r.summary.length).toBeGreaterThan(0)
      expect(r.actions.length).toBeGreaterThan(0)
      expect(r.actions.every((a) => a.owner)).toBe(true)
    }
  })
})
