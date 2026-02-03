# SF Formation — Plateforme Hygiène Alimentaire (QUALIOPI)

Plateforme web mobile-first pour la gestion des formations Hygiène alimentaire, conforme au label QUALIOPI.

## Stack

- **Frontend** : Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend / BDD** : Supabase (sans Supabase Auth)
- **Auth** : JWT + cookies (bcrypt pour les mots de passe)
- **Hébergement** : Vercel

## Prérequis

- Node.js 18+
- Compte Supabase

## Installation

1. Cloner le projet et installer les dépendances :

```bash
cd sf-formation
npm install
```

2. Créer un fichier `.env.local` à la racine (voir `.env.local.example`) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
JWT_SECRET=une-cle-secrete-min-32-caracteres
```

3. Exécuter le schéma SQL Supabase : ouvrir le fichier `supabase/schema.sql` dans l’éditeur SQL de votre projet Supabase et exécuter tout le script.  
   **Base déjà existante** : si vous aviez exécuté une ancienne version du schéma, exécutez en plus `supabase/migration_formation_documents.sql` pour ajouter les documents par formation et les questions par formation.

4. Créer le compte admin directement en BDD Supabase :

   - Générer un hash bcrypt pour un mot de passe (ex. avec un outil en ligne ou un script Node).
   - Dans la table `users`, insérer une ligne :  
     `username` = votre identifiant admin,  
     `password_hash` = le hash,  
     `role` = `admin`,  
     `first_login_done` = `true`.

5. Lancer le serveur de développement :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Rôles et parcours

- **Admin** : crée les sessions, stagiaires, formateurs ; inscrit les stagiaires (avec analyse des besoins) ; exporte les PDF par document par stagiaire.
- **Formateur** : pilote la session (heures de créneaux, déclenchement des étapes) ; demande les émargements par créneau.
- **Stagiaire** : reçoit les étapes en popup (test pré-formation, émargement avec signature, points clés, test fin, enquête de satisfaction) ; définit son mot de passe à la première connexion.

## Documents QUALIOPI

- Analyse des besoins (saisie par l’admin à l’inscription)
- Feuille d’émargement (signature + date/heure par créneau)
- Test de pré-formation, Test Points clés, Test de fin de formation (questions en BDD)
- Enquête de satisfaction (questions en BDD, échelles / texte libre)
- Bilan final (rempli par le formateur, questions en BDD)

Les questions des tests et enquêtes se gèrent depuis l’admin : **Formations** → choisir une formation → modifier le nom des documents (tests) et gérer les questions par document (libellé, format de réponse : QCM, texte libre, liste, échelle, options).

## Structure des espaces

- `/` — Choix du rôle (Admin / Formateur / Stagiaire)
- `/admin` — Tableau de bord admin
- `/admin/sessions`, `/admin/formations`, `/admin/stagiaires`, `/admin/formateurs` — CRUD
- `/admin/formations/[id]` — Documents (tests) et questions par formation
- `/admin/sessions/[id]` — Détail session, inscriptions, analyse des besoins
- `/admin/sessions/[id]/pdf` — Export PDF par stagiaire et par document
- `/formateur` — Sessions du formateur
- `/formateur/sessions/[id]` — Piloter la session (créneaux, déclencher étapes)
- `/stagiaire` — Espace stagiaire (popup d’étape quand le formateur déclenche)

## Déploiement (Vercel)

1. Connecter le dépôt à Vercel.
2. Ajouter les variables d’environnement (Supabase URL, anon key, JWT_SECRET).
3. Déployer.

---

**SF FORMATION** — Hygiène alimentaire, QUALIOPI.
