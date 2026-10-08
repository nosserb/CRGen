/**
 * Données de démonstration — entièrement fictives.
 * Projets, personnes et chiffres sont inventés pour illustrer l'outil.
 */
import type { Project } from '../domain/types.ts'

export const PROJECTS: Project[] = [
  {
    id: 'chsa',
    code: 'CHSA-B',
    name: 'Centre hospitalier Saint-Aurèle',
    scope: 'Extension du pôle médico-technique — Bâtiment B',
    phase: 'PRO',
    location: 'Projet fictif',
    participants: [
      { id: 'jean', name: 'Jean Lemaire', role: 'Ingénieur CVC', company: 'BET fluides' },
      { id: 'marie', name: 'Marie Dufresne', role: 'Économiste', company: 'Économie' },
      { id: 'paul', name: 'Paul Garnier', role: 'Coordination architecte', company: 'Maîtrise d’œuvre' },
      { id: 'sophie', name: 'Sophie Marchand', role: 'Thermicienne', company: 'BET thermique' },
      { id: 'karim', name: 'Karim Benali', role: 'Ingénieur VRD', company: 'BET VRD' },
      { id: 'claire', name: 'Claire Rousseau', role: 'Représentante MOA', company: 'Maîtrise d’ouvrage' },
    ],
  },
  {
    id: 'cdh',
    code: 'CDH-R',
    name: 'Clinique des Hêtres',
    scope: 'Réhabilitation énergétique des hospitalisations',
    phase: 'APD',
    location: 'Projet fictif',
    participants: [
      { id: 'lucie', name: 'Lucie Perrin', role: 'Cheffe de projet', company: 'Maîtrise d’œuvre' },
      { id: 'thomas', name: 'Thomas Vasseur', role: 'Ingénieur CVC', company: 'BET fluides' },
      { id: 'nadia', name: 'Nadia Chevallier', role: 'Économiste', company: 'Économie' },
      { id: 'hugo', name: 'Hugo Lambert', role: 'Thermicien', company: 'BET thermique' },
      { id: 'anne', name: 'Anne Morel', role: 'Directrice technique', company: 'Maîtrise d’ouvrage' },
    ],
  },
  {
    id: 'ehpad',
    code: 'TRV-N',
    name: 'EHPAD Les Trois Rives',
    scope: 'Construction neuve — 84 lits',
    phase: 'DCE',
    location: 'Projet fictif',
    participants: [
      { id: 'olivier', name: 'Olivier Fontaine', role: 'Économiste', company: 'Économie' },
      { id: 'julie', name: 'Julie Berthelot', role: 'Ingénieure VRD', company: 'BET VRD' },
      { id: 'marc', name: 'Marc Delattre', role: 'Ingénieur électricité', company: 'BET électricité' },
      { id: 'ines', name: 'Inès Garcia', role: 'Architecte', company: 'Maîtrise d’œuvre' },
    ],
  },
]

export interface NoteSample {
  id: string
  projectId: string
  title: string
  label: string
  notes: string
}

export const SAMPLES: NoteSample[] = [
  {
    id: 'cta',
    projectId: 'chsa',
    title: 'Point CVC — CTA bâtiment B',
    label: 'Point CVC court',
    notes:
      "Jean indique que la CTA du bâtiment B doit être modifiée car le débit prévu n'est plus suffisant. Marie doit vérifier le coût de la nouvelle CTA et pense pouvoir avoir le prix vendredi. Paul attend toujours les nouveaux plans architecte, qui devraient arriver vendredi matin. Il faut également vérifier si cette modification a un impact sur le dimensionnement thermique.",
  },
  {
    id: 'synthese',
    projectId: 'chsa',
    title: 'Réunion de synthèse technique n°7',
    label: 'Synthèse technique complète',
    notes: `CVC : Jean indique que la CTA du bâtiment B doit être modifiée car le débit prévu n'est plus suffisant. Marie doit vérifier le coût de la nouvelle CTA et pense pouvoir avoir le prix vendredi.
Paul attend toujours les nouveaux plans architecte, qui devraient arriver vendredi matin.
Thermique : Sophie précise que le calcul RE2020 est conforme sur le Bbio mais en limite sur le Cep. Il faut vérifier si la modification de la CTA a un impact sur le dimensionnement thermique.
VRD : Karim confirme que le raccordement EU sera déplacé côté rue des Tilleuls suite au relevé du concessionnaire. Il est décidé de conserver le bassin de rétention enterré. Karim transmettra le plan VRD indicé B d'ici jeudi.
Économie : Marie indique que l'estimation PRO s'établit à 18,4 M€ HT, soit +3,2 % par rapport à l'APD. Marie doit mettre à jour la DPGF du lot CVC pour le 23/10.
Claire rappelle que le passage en commission de sécurité est prévu le 12 novembre.
Paul enverra les coupes mises à jour en début de semaine prochaine.`,
  },
  {
    id: 'rehab',
    projectId: 'cdh',
    title: 'Réunion APD — stratégie énergétique',
    label: 'Réhabilitation énergétique',
    notes: `Thomas indique que les PAC air/eau seront remplacées par une solution géothermique sur sondes. Anne valide le principe de la géothermie sous réserve du surcoût.
Nadia doit chiffrer la variante géothermie avant le 30/10.
Hugo précise que l'ITE en laine de bois permet de gagner 38 % sur les besoins de chauffage.
Il faut vérifier la faisabilité des forages avec l'étude de sol G2.
Lucie se charge d'organiser une visite du site avec le foreur la semaine prochaine.
Thomas va reprendre le schéma de principe de la chaufferie sous huitaine.
Anne rappelle que l'établissement reste en activité pendant toute la durée des travaux.`,
  },
  {
    id: 'dce',
    projectId: 'ehpad',
    title: 'Revue DCE — lots techniques',
    label: 'Revue DCE',
    notes: `Olivier indique que l'enveloppe travaux reste à 9,6 M€ HT après la revue des quantitatifs.
Il est décidé de passer les enrobés du parking en béton drainant.
Julie doit reprendre le profil en long du réseau EP et le carnet de détails VRD pour lundi.
Marc fournira la note de calcul du groupe électrogène demain.
Il faut confirmer avec le bureau de contrôle le classement ERP type J.
Inès enverra le CCTP architecture mis à jour d'ici la fin de semaine.
Olivier précise que la mise en ligne du DCE est prévue le 16 novembre.`,
  },
]

export const findProject = (id: string) => PROJECTS.find((p) => p.id === id) ?? PROJECTS[0]
