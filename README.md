# AI Academy LMS

Een volledig Learning Management System (LMS) gebouwd met Next.js 14, Supabase en Tailwind CSS.

## Features

- **Authenticatie**: Registreren, inloggen, wachtwoord vergeten, beveiligde routes
- **Dashboard**: Overzicht van 6 cursusmodules met voortgang
- **Module Pagina's**: Gamma presentaties met timer (minimaal 2 minuten bekijken)
- **Toetssysteem**: 5 multiple choice vragen per module, 70% vereist om te slagen
- **Certificaat**: PDF generatie met verificatiecode na succesvolle afronding
- **PWA**: Installeerbaar op telefoon/desktop, offline indicator

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authenticatie**: Supabase Auth
- **Styling**: Tailwind CSS
- **PDF**: jsPDF
- **PWA**: next-pwa

## Snelle Start

### 1. Clone de repository

```bash
git clone <repository-url>
cd ai-academy-lms
npm install
```

### 2. Supabase Setup

1. Maak een nieuw project aan op [supabase.com](https://supabase.com)
2. Ga naar Settings > API en kopieer:
   - Project URL
   - anon public key

3. Maak een `.env.local` bestand:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Voer het SQL schema uit in de Supabase SQL Editor:
   - Open `supabase/schema.sql`
   - Kopieer en plak de inhoud in de SQL Editor
   - Voer het uit

### 3. Start de development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Deployment naar Netlify

### Automatische Deployment

1. Push je code naar GitHub
2. Log in op [netlify.com](https://netlify.com)
3. Klik op "New site from Git"
4. Selecteer je repository
5. Build settings worden automatisch geladen uit `netlify.toml`
6. Voeg environment variabelen toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (je Netlify URL)

7. Klik op "Deploy site"

### Supabase Auth Configuratie voor Productie

1. Ga naar Supabase > Authentication > URL Configuration
2. Voeg je Netlify URL toe aan:
   - Site URL: `https://your-site.netlify.app`
   - Redirect URLs: `https://your-site.netlify.app/api/auth/callback`

## Projectstructuur

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (protected)/
│   │   ├── dashboard/
│   │   ├── module/[id]/
│   │   ├── quiz/[id]/
│   │   ├── certificate/
│   │   └── profile/
│   ├── api/auth/callback/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navigation.tsx
│   └── OfflineIndicator.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
└── types/
    └── database.ts
```

## Database Schema

### Tabellen

- **profiles**: Gebruikersprofielen (gekoppeld aan Supabase Auth)
- **modules**: 6 cursusmodules met Gamma embed URLs
- **questions**: 5 vragen per module
- **user_progress**: Voortgang per gebruiker per module
- **certificates**: Certificaten met verificatiecodes

### Row Level Security

Alle tabellen hebben RLS policies zodat gebruikers alleen hun eigen data kunnen zien/bewerken.

## Module Inhoud

1. **De Nieuwe Realiteit** - Waarom verandert ons vak en wat zijn de kansen?
2. **Onder de Motorkap** - Hoe werkt een taalmodel eigenlijk?
3. **Ethiek & Veiligheid** - AVG, EU AI Act en databeveiliging
4. **Prompt Engineering** - De kunst van vragen stellen
5. **AI in Actie** - Concrete toepassingen voor business
6. **Future Fit** - Van Chatbots naar autonome AI Agents

## Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Lint
npm run lint

# Generate PWA icons
node scripts/generate-icons.js
```

## Licentie

MIT
