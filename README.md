# Comptes-rendus — générateur de comptes-rendus de réunion

Prototype d'outil interne pour un bureau d'études (économie de la construction, CVC, thermique, VRD).
On colle des notes brutes de réunion ; l'application produit un compte-rendu structuré et modifiable :
résumé, décisions, actions avec responsable et échéance, points à vérifier, informations importantes.

> Prototype de démonstration réalisé dans le cadre d'une candidature. Les projets, personnes et
> chiffres sont **entièrement fictifs**. Rien ne provient d'Économie 80.

## Lancer le projet

```bash
npm install
npm run dev          # http://localhost:5173
```

Aucune configuration ni clé n'est nécessaire : tout fonctionne en local, dans le navigateur.

| Script              | Rôle                                        |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Serveur de développement                    |
| `npm run build`     | Vérification TypeScript + build de prod     |
| `npm run preview`   | Sert le build de production                 |
| `npm test`          | Tests unitaires (dates, moteur d'extraction)|
| `npm run lint`      | oxlint                                      |

## Fonctionnalités

- Sélection du projet, nom et date de réunion, participants présents.
- Grande zone de notes, exemples de notes fictives intégrés, raccourci `Ctrl + Entrée`.
- Indicateur de traitement par étapes.
- Compte-rendu au format document : référence (`CR-CHSA-B-20261008`), métadonnées, sections numérotées.
- Tableau des actions : libellé, lot, responsable, échéance — tout est **modifiable en place**.
- Case « réalisée » avec barre d'avancement ; échéances en retard / proches signalées.
- L'expression d'origine de l'échéance est conservée (« vendredi matin ») à côté de la date résolue.
- Interrupteur **Sources** : chaque élément affiche l'extrait de notes dont il provient (traçabilité).
- Conversion d'un point à vérifier en action ; suppression avec **annulation**.
- Copie (texte + HTML riche, prêt pour un e-mail), export Markdown, impression / PDF (mise en page A4).
- Brouillon et compte-rendu conservés localement (rechargement sans perte).
- Responsive (le tableau devient une liste de fiches sur mobile), navigation clavier, `prefers-reduced-motion`.

## Architecture

```
src/
  domain/
    extraction.ts    Format du résultat d'extraction (décisions, actions, points, infos)
    types.ts         Modèle du document (compte-rendu, projet, participants)
  lib/
    extractor.ts     Extraction des notes par règles linguistiques
    dates.ts         Résolution des échéances en français (« sous huitaine », « jeudi », « 23/10 »…)
    report.ts        Extraction → document (ids, rattachement des responsables)
    exporters.ts     Texte, Markdown, HTML
  state/reportReducer.ts  Toutes les modifications du document (reducer pur)
  components/        Interface
  data/projects.ts   Projets et notes fictifs
```

### Extraction des notes

L'extracteur analyse réellement les notes saisies, via des règles sur les tournures courantes des
réunions de maîtrise d'œuvre — « X doit… », « X transmettra… », « X attend… », « … doit être
modifiée car… », « Il est décidé de… », « Il faut vérifier… », « X indique que… » — avec détection
du lot par mots-clés, résolution des échéances relatives à partir de la date de réunion et une
coréférence simple (« cette modification » → « la modification de la CTA du bâtiment B »).
Il donne de bons résultats sur des notes rédigées en phrases.

## Direction artistique

Analyse du site economie80.fr reprise dans les grandes lignes, sans en copier la structure :

- **Couleurs** : blancs francs, anthracite (`#2f2f2f`), accent prune (`#79146a`) utilisé avec parcimonie
  (actions principales, numérotation, décisions).
- **Typographie** : Lato, capitales espacées pour les intitulés ; un serif (Source Serif 4) réservé
  au document produit, pour le distinguer de l'outil.
- **Formes** : angles vifs, filets fins, pas de dégradés ni d'ombres marquées ; une seule « feuille »
  blanche posée sur un fond chaud.
- **Rythme** : beaucoup d'espace, sections numérotées comme un document technique, micro-interactions
  courtes (140–220 ms).

## Pistes

- Brancher un modèle de langage derrière le même format d'extraction pour les notes très libres.
- Historique des comptes-rendus par projet et suivi des actions d'une réunion à l'autre.
- Export `.docx` au gabarit maison, envoi aux participants.
- Saisie vocale / transcription de réunion en entrée.
