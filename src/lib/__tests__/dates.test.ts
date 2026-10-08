import { describe, expect, it } from 'vitest'
import { findDue, stripDue } from '../dates.ts'

// Réunion un jeudi.
const REF = '2026-10-08'

describe('findDue', () => {
  it.each([
    ['vendredi', '2026-10-09'],
    ['vendredi matin', '2026-10-09'],
    ["d'ici jeudi", '2026-10-15'],
    ['demain', '2026-10-09'],
    ['après-demain', '2026-10-10'],
    ['pour le 23/10', '2026-10-23'],
    ['avant le 12 novembre', '2026-11-12'],
    ['sous huitaine', '2026-10-16'],
    ['en début de semaine prochaine', '2026-10-12'],
    ['la semaine prochaine', '2026-10-16'],
    ["d'ici la fin de semaine", '2026-10-09'],
    ['fin du mois', '2026-10-31'],
  ])('« %s » → %s', (expr, expected) => {
    expect(findDue(`Livrer la note ${expr}.`, REF)?.date).toBe(expected)
  })

  it('garde l’expression d’origine comme indice', () => {
    expect(findDue('Plans attendus vendredi matin', REF)?.hint).toBe('vendredi matin')
  })

  it('renvoie null sans échéance', () => {
    expect(findDue('Vérifier le dimensionnement thermique', REF)).toBeNull()
  })

  it('retire l’échéance du libellé', () => {
    expect(stripDue('Transmettre le plan VRD indicé B d’ici jeudi', REF)).toBe('Transmettre le plan VRD indicé B')
  })
})
