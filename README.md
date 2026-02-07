# Fitness Trainer App

Webova aplikace pro kondicni trenery umoznujici spravu cviku, tvorbu trenikovych planu a sdileni s klienty.

## Pozadavky

- Node.js 18+
- Supabase ucet (zdarma na supabase.com)

## Instalace

### 1. Instalace Node.js

Pokud nemate Node.js, nainstalujte jej:

**macOS (Homebrew):**
```bash
brew install node
```

**Nebo stahnte z:** https://nodejs.org/

### 2. Instalace zavislosti

```bash
cd fitness-trainer-app
npm install
```

### 3. Nastaveni Supabase

1. Jdete na https://supabase.com a vytvorte novy projekt
2. V SQL Editor spustte obsah souboru `supabase/schema.sql`
3. V Settings > API zkopirujte:
   - Project URL
   - anon public klic

### 4. Konfigurace prostedi

Vytvorte soubor `.env.local`:

```bash
cp .env.local.example .env.local
```

Vyplnte sve Supabase udaje:

```
NEXT_PUBLIC_SUPABASE_URL=https://vas-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=vas-anon-klic
```

### 5. Spusteni aplikace

```bash
npm run dev
```

Aplikace bezi na http://localhost:3000

## Funkce

### Pro trenery:
- Sprava databaze cviku s YouTube videi
- Tvorba trenikovych planu
- Prirazovani planu klientum
- Kod pro registraci klientu

### Pro klienty:
- Zobrazeni prirazenych planu
- Sledovani cviku s video navody

## Struktura projektu

```
fitness-trainer-app/
├── app/                    # Next.js App Router stranky
│   ├── (auth)/            # Prihlaseni a registrace
│   ├── (dashboard)/       # Dashboard pro trenery
│   └── client/            # Pohled pro klienty
├── components/            # React komponenty
├── lib/                   # Utility a Supabase klient
├── types/                 # TypeScript typy
└── supabase/             # Databazove schema
```

## Nasazeni na Vercel

1. Pushnete kod na GitHub
2. Importujte projekt na vercel.com
3. Pridejte environment variables (Supabase URL a key)
4. Deploy!

## Licence

MIT
