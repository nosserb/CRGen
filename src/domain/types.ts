import type { Lot } from './extraction.ts'

export type { Lot }

export interface Participant {
  id: string
  name: string
  role: string
  company: string
}

export interface Project {
  id: string
  code: string
  name: string
  scope: string
  phase: string
  location: string
  participants: Participant[]
}

export interface Decision {
  id: string
  text: string
  lot: Lot
  raisedBy: string | null
  source: string
}

export interface ActionItem {
  id: string
  text: string
  owner: string | null
  dueDate: string | null
  dueHint: string | null
  lot: Lot
  done: boolean
  source: string
}

export interface CheckPoint {
  id: string
  text: string
  lot: Lot
  owner: string | null
  source: string
}

export interface KeyInfo {
  id: string
  text: string
  lot: Lot
  source: string
}

export interface MeetingMeta {
  projectId: string
  title: string
  date: string
  participantIds: string[]
}

export interface Report {
  id: string
  reference: string
  meta: MeetingMeta
  summary: string
  decisions: Decision[]
  actions: ActionItem[]
  checks: CheckPoint[]
  infos: KeyInfo[]
  generatedAt: string
}
