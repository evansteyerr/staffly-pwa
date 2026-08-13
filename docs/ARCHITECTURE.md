# CAGE LEGACY — Architecture & Plan de construction MVP

> Nom de code temporaire du projet : **Cage Legacy**. Toutes les chaînes de
> branding vivent dans `src/config/branding.ts` pour pouvoir renommer le jeu
> sans toucher au moteur.

Ce document répond à la commande passée en section 144 du cahier des charges :
architecture complète, boucle de gameplay, modèle de données, moteurs, et
découpage en versions — **avant** le code. Le code du MVP (vertical slice,
section 139-141) est développé juste après, dans le même commit initial.

---

## A. Architecture complète du jeu

Le jeu est une **PWA Next.js (App Router) mono-repo**, 100% côté client pour
le MVP (aucun backend requis pour jouer une carrière). Trois couches
strictement séparées :

```
┌─────────────────────────────────────────────────────────┐
│  UI (React / app/**)                                     │
│  - Écrans, animations, lecture du store, dispatch actions │
└───────────────▲───────────────────────────┬───────────────┘
                │ lit (selectors)            │ appelle des actions
┌───────────────┴───────────────────────────▼───────────────┐
│  STORE (Zustand) — src/store                              │
│  - CareerState unique, persisté (localStorage)             │
│  - Les actions du store ne font QUE déléguer au moteur      │
└───────────────▲───────────────────────────┬───────────────┘
                │ CareerState (lecture)       │ nouveau CareerState (pure)
┌───────────────┴───────────────────────────▼───────────────┐
│  GAME ENGINE (pur, sans dépendance React) — src/game       │
│  engine / events / fight / world / ranking / contracts /   │
│  progression / legacy / rng                                │
│  - Fonctions pures: (state, action) => state               │
│  - Déterministe: mêmes seed+choix => même résultat          │
└───────────────▲───────────────────────────┬───────────────┘
                │ lit (templates, roster)     │
┌───────────────┴───────────────────────────▼───────────────┐
│  DATA (contenu, pas de logique) — src/data                │
│  fighters / organizations / events / badges / quests /     │
│  perks / names (génération culturelle)                     │
└─────────────────────────────────────────────────────────┘
```

**Règle d'or (section 147/160)** : le moteur ne connaît jamais le contenu
d'un événement précis, seulement sa *forme* (EventTemplate). Ajouter 1000
événements ne touche jamais `src/game/`. Chaque info affichée à l'écran
(ranking, popularité, relation manager, career wear...) correspond à un vrai
champ du `CareerState` et a un effet réel sur au moins une fonction du moteur
(section 146 — interdiction des faux systèmes).

Le moteur est **pur et testable en isolation** (pas de DOM, pas de fetch) —
c'est ce qui permet `simulateCareers(10000)` en Node pour l'équilibrage
(section 83) et les tests de déterminisme (section 130).

---

## B. Boucle de gameplay

Boucle macro (une carrière) :

```
CRÉATION PERSONNAGE
   → snapshot du monde (worldState figé au databaseVersion)
   → CareerState initial (seed dédiée)
   ↓
┌─────────────── BOUCLE DE CARRIÈRE ───────────────┐
│  1. resolveDueEvent()                              │
│     → pioche pondérée dans le pool d'événements     │
│       éligibles (âge, org, flags, popularité...)    │
│  2. UI affiche l'event, joueur choisit un choix      │
│  3. applyChoice() → effets visibles + cachés +       │
│     flags + followUps programmés                    │
│  4. advanceWorld(days) → simule le monde en tâche    │
│     de fond (autres combattants, rankings, actus)    │
│  5. si un combat est dû (contrat/opportunité) :       │
│        écran Camp → Gameplan → simulateFight()        │
│        → résultat, stats, conséquences (popularité,   │
│          ranking, contrat, blessures, rivalités)       │
│  6. checkRetirement() → propose une sortie si          │
│     âge/usure/contrat le justifie                       │
│  7. si retraite acceptée → FICHE FINALE + PANTHÉON      │
│     sinon → retour à l'étape 1                          │
└──────────────────────────────────────────────────┘
```

Chaque itération de la boucle = **un "tick" de carrière**, pas une semaine
simulée jour par jour (section 96). Un tick fait avancer le temps de
quelques semaines à quelques mois selon l'événement. Objectif : une carrière
complète en 10-30 minutes (~40-80 ticks), sans les 150 clics à éviter
(section 2).

Le MODE RAPIDE réduit le nombre d'événements hors-combat et résume les
combats en un écran ; le MODE IMMERSIF (post-MVP) ajoute des sous-choix de
camp et un commentaire de combat détaillé round par round.

---

## C. Modèle de données TypeScript (extrait — voir `src/types/`)

```ts
// src/types/fighter.ts
export type Gender = "male" | "female";

export interface AttributeBlock {
  striking: number; boxing: number; kickboxing: number; kicks: number;
  power: number; speed: number; accuracy: number; strikingDefense: number;
  wrestling: number; takedownOffense: number; takedownDefense: number;
  bjj: number; submissionOffense: number; submissionDefense: number;
  groundControl: number; groundAndPound: number;
  cardio: number; strength: number; explosiveness: number;
  chin: number; durability: number; recovery: number;
  fightIQ: number; composure: number; aggression: number; discipline: number;
}

export interface Fighter {
  id: string;
  firstName: string; lastName: string; nickname?: string;
  gender: Gender; nationality: string; dateOfBirth: string;
  isPlayer: boolean;
  height: number; reach: number; stance: "orthodox" | "southpaw" | "switch";
  weightClass: string;
  organizationId: string | null;
  record: { wins: number; losses: number; draws: number; noContests: number };
  attributes: AttributeBlock;
  overall: number; // dérivé, jamais stocké comme source de vérité
  popularity: number; momentum: number; careerWear: number;
  hiddenPotential: number;      // jamais exposé à l'UI telle quelle
  primeStart: number; primeEnd: number; declineRate: number;
  hiddenTraits: string[];       // ex: "iron_chin", "injury_prone"
  source: "real" | "generated" | "player";
  lastVerifiedAt?: string;      // uniquement si source === "real"
}

// src/types/career.ts
export interface CareerState {
  careerId: string; seed: string; databaseVersion: string;
  worldDate: string; // ISO
  fighter: Fighter;
  contract: Contract | null;
  relationships: Record<string, number>;       // coach, manager, gym, promoter...
  rivalries: Record<string, number>;            // fighterId -> intensité
  flags: Set<string> | string[];                 // sérialisé en array
  activeEvent: ActiveEvent | null;
  pendingFollowUps: ScheduledEvent[];
  fightHistory: FightRecord[];
  careerHistory: CareerMoment[];
  titles: TitleReign[];
  awards: string[];
  finances: { careerEarnings: number; netWorth: number };
  narrative: { hunger: number; ego: number; stress: number;
               mediaPressure: number; coachTrust: number;
               promoterTrust: number; financialSecurity: number };
  worldState: WorldState;
  rngState: number; // état du PRNG, pour reprise déterministe
  retired: boolean;
}
```

Le détail complet (Organization, Contract, EventTemplate, FightResult,
WorldState, Badge, Quest, Perk) vit dans `src/types/*.ts`, un fichier par
domaine, tous ré-exportés par `src/types/index.ts`.

---

## D. Architecture des événements

Voir section 147-151 du brief. Un événement est **100% donnée** :

```ts
export interface EventChoice {
  id: string; label: string; description?: string;
  visibleEffects: Partial<EffectBag>;
  hiddenEffects?: Partial<EffectBag>;
  setFlags?: string[]; removeFlags?: string[];
  followUps?: { eventId: string; delayDays: [number, number] }[];
  timeAdvanceDays: [number, number]; // intervalle, résolu via RNG
  weight?: number; // pondère un tirage aléatoire du résultat de CE choix (ex: "négocier" peut échouer)
}

export interface EventTemplate {
  id: string; category: EventCategory; title: string; description: string;
  minAge?: number; maxAge?: number; careerPhase?: CareerPhase[];
  requiredOrganizationTier?: OrgTier[];
  requiredFlags?: string[]; forbiddenFlags?: string[];
  minPopularity?: number; maxPopularity?: number;
  minRanking?: number; maxRanking?: number;
  weight: number; cooldownDays: number; maxOccurrences?: number;
  choices: EventChoice[];
}
```

Le moteur (`src/game/events/engine.ts`) fait 3 choses seulement :
1. `getEligiblePool(state)` — filtre par conditions + cooldown + maxOccurrences.
2. `pickWeighted(pool, rng)` — tirage pondéré déterministe.
3. `applyChoice(state, event, choice)` — applique les effets, pose les flags,
   programme les `followUps` dans `pendingFollowUps`.

Le **templating** (`src/game/narrative/template.ts`) remplace
`{fighterName}`, `{opponentName}`, `{ranking}`, etc. dans les textes au
moment de l'affichage — jamais stocké en dur (section 150-151).

Le contenu (des dizaines puis des centaines d'événements) vit dans
`src/data/events/<categorie>/*.ts`, chaque fichier exportant un tableau
d'`EventTemplate`. Ajouter un fichier = ajouter du contenu, zéro changement
moteur.

---

## E. Architecture du moteur de combat

`src/game/fight/simulate.ts`. Jamais un simple `if (ovrA > ovrB)`.

**Étapes (par round, jusqu'à `maxRounds` ou finish) :**

1. **Contexte pré-combat** : matchup stylistique (striker vs wrestler,
   avantages/désavantages croisés), delta de forme/moral/confiance, cardio de
   camp, home advantage léger, gameplan des deux combattants.
2. **Phase debout** : jets pondérés par striking/power/accuracy/défense vs
   cardio/chin, produisent `damage`, `knockdownChance`.
3. **Phase de clinch/takedown** : tentative pondérée par
   takedownOffense/wrestling vs takedownDefense ; succès → position (control).
4. **Phase au sol** : groundControl/groundAndPound/submissionOffense vs
   submissionDefense/bjj → `damage` ou `submissionAttempt`.
5. **Mise à jour fatigue/moment** : cardio consommé, `momentum` déplacé vers
   le combattant dominant du round (influence le round suivant).
6. **Check de fin** : KO/TKO si `damage` cumulé + `chin`/`durability` roulés
   franchissent un seuil ; soumission si `submissionAttempt` réussit contre
   `submissionDefense` ; sinon on continue.
7. Si on atteint la limite de rounds → **3 juges** scorent round par round
   (10-9 / 10-8 selon écart, rare 10-7) → décision (unanime/split/majority).

Tout est piloté par le PRNG de la carrière (déterminisme). Un outsider (78)
peut battre un favori (90) — improbable mais pas impossible, car chaque jet
a une variance et le matchup stylistique peut inverser un avantage brut.

`simulateFight()` retourne un `FightResult` riche (méthode, round, temps,
stats significant strikes/takedowns/control time, performance rating,
knockdowns) consommé à la fois par l'UI (résumé rapide ou détaillé) et par
les systèmes de ranking/popularité/legacy.

---

## F. Architecture du world simulator

`src/game/world/tick.ts` — `advanceWorld(worldState, days, rng)`.

Pour rester performant avec des milliers de combattants (section 123), le
monde **hors joueur** n'est jamais simulé en détail : chaque combattant NPC a
un `matchupStrength` dérivé de ses attributs + forme, et un combat NPC vs NPC
est résolu par un jet unique pondéré (pas de simulation round par round).
Seuls les combats du joueur passent par le moteur détaillé (section E).

À chaque tick :
1. Combats NPC programmés → résolution rapide → mise à jour records/ranking.
2. Vieillissement : âge, application de la courbe prime/déclin par fighter.
3. Retraites : probabilité basée sur âge, série de défaites, usure.
4. Génération de prospects (section 9) quand la pyramide d'âge d'une
   nationalité/catégorie se creuse.
5. Génération d'actualités "MMA WORLD" (les faits marquants seulement —
   changement de champion, gros upset, signature) pour le fil d'actu.

`advanceWorld` est appelé par le moteur de carrière après chaque événement,
jamais par l'UI directement.

---

## G. Système de progression

`src/game/progression/`. Courbe non linéaire par attribut :

- 18-23 : progression rapide vers le potentiel caché.
- 24-29 : "prime" — proche du plafond, petites variations.
- 30-33 : plateau, variance individuelle (traits cachés type `late_bloomer`
  décalent cette fenêtre).
- 34+ : `declineRate` individuel érode progressivement les attributs
  physiques (moins les mentaux/techniques).

Chaque tick de camp/entraînement applique un delta borné vers
`hiddenPotential`, modulé par : qualité de gym, discipline, mode de vie,
blessures, `hunger`/`ego` narratifs. Le potentiel n'est pas un plafond
rigide — un environnement exceptionnel peut le dépasser légèrement, un
environnement toxique peut ne jamais l'atteindre.

---

## H. Système de rankings

`src/game/ranking/`. Par division (weight class × organisation) :
`score = f(qualityOfWins, recentActivity, finishRate, momentum, oldRank)`
avec popularité comme facteur mineur (jamais dominant — section 45). Recalcul
après chaque combat résolu (joueur ou NPC) dans la division concernée
uniquement (pas de recalcul global à chaque tick — perf).

Un `RankingBoard` expose top 15 + champion par division ; les combattants
hors top 15 ont un score caché utilisé pour le matchmaking mais jamais
affiché tel quel.

---

## I. Système de Legacy

`src/game/legacy/score.ts`. Pondération explicite et **isolée dans un seul
fichier** pour pouvoir la retoucher après simulation de masse (section 83) :

```ts
export const LEGACY_WEIGHTS = {
  proWin: 5, finish: 3, rankedWin: 15, top5Win: 30,
  winOverFormerChampion: 35, majorTitle: 150, titleDefense: 75,
  doubleChamp: 200, fightOfTheYear: 30, fighterOfTheYear: 50,
} as const;
```

`computeLegacy(state)` agrège aussi `strengthOfSchedule`, longévité,
popularité pic — une défaite ne détruit jamais le score brutalement. Le
score final mappe vers une classe (Journeyman → GOAT Territory, section 75),
seuils regroupés dans la même config pour un rééquilibrage facile.

---

## J. Sauvegarde et seeds

- `seed: string` généré à la création (ou fourni pour Daily Challenge/Duel).
- `src/game/rng/prng.ts` : mulberry32 (rapide, déterministe, sérialisable en
  un seul entier — `rngState`). Toute fonction moteur qui a besoin
  d'aléatoire reçoit le `rng` en paramètre, ne lit jamais `Math.random()`
  directement (garantit le rejouable/testable).
- **Autosave** : le store Zustand persiste `CareerState` (fighter + flags +
  `rngState` inclus) dans `localStorage` après chaque action via le
  middleware `persist`, MVP = 1 slot (`cage-legacy:v1:active-career`),
  architecture prête pour plusieurs slots et migration Supabase (juste
  changer l'implémentation du `storage` adapter du store).
- Un `Challenge Code` (Daily/Duel) encode `seed + startingProfile` en base64
  — reproductible sans backend pour le MVP.

---

## K. Structure des dossiers (MVP)

```
src/
  app/                        routes Next.js (écrans)
    page.tsx                  accueil
    new-career/*/page.tsx     création de personnage (wizard)
    career/page.tsx           hub de carrière (event / fight / résultat)
    retirement/page.tsx       fiche finale
    pantheon/page.tsx         panthéon local
  components/
    ui/                       boutons, cartes, barres de stats (génériques)
    fighter/                  carte combattant, avatar silhouette
    events/                   écran de choix d'événement
    fight/                    écran camp/gameplan/résultat de combat
    career/                   timeline, hub, header carrière
  game/
    rng/                      PRNG déterministe
    engine/                   orchestrateur de la boucle de carrière
    events/                   moteur d'événements (pas le contenu)
    fight/                    moteur de simulation de combat
    world/                    world simulator (tick, NPC, actus)
    ranking/                  calcul des classements
    contracts/                offres, négociation
    progression/              vieillissement, entraînement, camps
    legacy/                   score de fin de carrière, classes
    narrative/                templating de texte
  data/
    organizations/            orgs fictives (MVP) — voir section 128
    fighters/                 petit roster fictif de départ
    events/<categorie>/       contenu événementiel par catégorie
    names/                    génération de noms par nationalité
    badges/ quests/ perks/    contenu méta (post-MVP)
  store/                      Zustand store + persist
  types/                      modèle de données partagé
  config/                     branding, constantes d'équilibrage
docs/
  ARCHITECTURE.md             ce document
```

---

## L. Découpage du développement par versions

- **V0 — MVP (ce commit)** : verticale jouable complète (section 139) :
  accueil → création perso → boucle carrière (événements + combats
  simulés) → retraite → fiche finale → panthéon local → rejouer. Petit
  roster fictif, ~20 événements, 3 organisations fictives, 1 seed = 1
  carrière déterministe, sauvegarde localStorage.
- **V1** : contenu (100+ événements, chaînes narratives sur plusieurs
  années), quêtes, badges globaux, Fight Tokens, boutique de perks.
- **V2** : Défi du jour (seed partagée), duel entre amis (challenge code),
  export image de la carte finale.
- **V3** : comptes (Supabase Auth), leaderboard serveur, import du roster
  réel (UFC + scène française + autres organisations) via l'admin
  importer, mode Histoire scénarisé, mode What-If.
- **V4** : mode immersif complet (camps détaillés, commentaire combat
  approfondi), i18n (EN/ES/PT), simulation de masse pour rééquilibrage
  continu (`simulateCareers(10000)`).

Chaque version ajoute strictement des données et des écrans — le moteur
(section A) ne doit pas être réécrit entre les versions, seulement étendu.
