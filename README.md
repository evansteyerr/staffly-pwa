# Cage Legacy

Un jeu web de carriere MMA narrative — cree ton combattant, vis des annees
de decisions et de combats, et decouvre l'histoire unique que ta carriere
va ecrire. Voir `docs/ARCHITECTURE.md` pour l'architecture complete, la
boucle de gameplay et le plan de developpement par versions.

L'univers utilise les noms de vraies organisations (Cage Warriors, KSW,
PFL, UFC) comme decor, mais le roster de combattants, les classements et
toutes les statistiques sont entierement simules — aucune donnee
officielle, aucun combattant reel, aucun visuel proprietaire. Voir la
section 5/128 de `docs/ARCHITECTURE.md`.

## Demarrer

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # serveur de developpement
npm run build    # build de production
npm run lint     # eslint
npm run test     # tests unitaires (vitest) — RNG, moteur de combat, moteur de carriere
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Zustand (state + persist
localStorage) · Zod · Vitest.

## Structure

- `src/game/` — moteur pur (RNG deterministe, evenements, combat, monde,
  rankings, contrats, progression, legacy). Aucune dependance React.
- `src/data/` — contenu (organisations, combattants, evenements, options de
  creation de personnage). Ajouter du contenu ne touche jamais au moteur.
- `src/store/` — store Zustand qui relie le moteur a l'UI et persiste la
  carriere active + le Pantheon local.
- `src/app/`, `src/components/` — ecrans et composants React.
- `docs/ARCHITECTURE.md` — architecture complete et decoupage en versions.
