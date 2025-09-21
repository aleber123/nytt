# Legaliseringstjänst

En modern, tillgänglig och användarvänlig webbplats för legaliseringstjänster med fokus på enkelhet, tillgänglighet enligt WCAG-riktlinjer och internationell skalbarhet.

## Funktioner

- Responsiv design med Tailwind CSS
- Flerspråksstöd (svenska och engelska) med next-i18next
- Tillgänglig enligt WCAG-riktlinjer
- Enkel beställningsprocess i flera steg
- Moderna UI-komponenter
- Formulärvalidering med React Hook Form
- Anpassad för internationell expansion

## Teknisk stack

- **Frontend**: Next.js med TypeScript
- **Styling**: Tailwind CSS
- **Formulärhantering**: React Hook Form
- **Internationalisering**: next-i18next
- **Tillgänglighet**: ARIA-attribut och semantisk HTML

## Projektstruktur

```
legaliseringstjanst/
├── public/
│   ├── images/
│   └── locales/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── ui/
│   ├── locales/
│   │   ├── en/
│   │   └── sv/
│   ├── pages/
│   ├── styles/
│   └── utils/
├── .gitignore
├── next-i18next.config.js
├── next.config.js
├── package.json
├── README.md
├── tailwind.config.js
└── tsconfig.json
```

## Installation

1. Klona projektet:

```bash
git clone https://github.com/yourusername/legaliseringstjanst.git
cd legaliseringstjanst
```

2. Installera beroenden:

```bash
npm install
# eller
yarn install
```

3. Starta utvecklingsservern:

```bash
npm run dev
# eller
yarn dev
```

4. Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Bygga för produktion

```bash
npm run build
# eller
yarn build
```

För att starta produktionsversionen:

```bash
npm start
# eller
yarn start
```

## Internationalisering

Projektet använder next-i18next för flerspråksstöd. Översättningsfiler finns i `src/locales/` för varje språk.

För att lägga till ett nytt språk:

1. Skapa en ny mapp under `src/locales/` med språkkoden (t.ex. `de` för tyska)
2. Kopiera `common.json` från en befintlig språkmapp och översätt innehållet
3. Lägg till språkkoden i `next-i18next.config.js` under `locales`-arrayen

## Tillgänglighet

Projektet följer WCAG-riktlinjerna för tillgänglighet:

- Semantisk HTML-struktur
- ARIA-attribut för interaktiva element
- Fokushantering för tangentbordsnavigering
- Tillräcklig färgkontrast
- Skip-to-content länk
- Responsiv design för alla enheter

## Utveckling

### Lägga till nya komponenter

1. Skapa en ny fil i lämplig mapp under `src/components/`
2. Importera komponenten där den behövs

### Lägga till nya sidor

1. Skapa en ny fil i `src/pages/`
2. Använd Layout-komponenten för konsekvent utseende
3. Lägg till nödvändiga översättningar i språkfilerna

## Licens

Detta projekt är licensierat under [MIT-licensen](LICENSE).
