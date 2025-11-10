import React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Seo from '@/components/Seo';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: React.ReactNode;
}

const articles: Article[] = [
  {
    slug: 'vad-ar-apostille',
    title: 'Vad är en apostille? Komplett guide för svenska dokument',
    description:
      'Lär dig vad en apostille är, när du behöver den och hur processen går till för svenska dokument som ska användas utomlands.',
    date: '2025-11-06',
    tags: ['apostille', 'haagkonventionen', 'legalisering'],
    content: (
      <>
        <p className="text-gray-700 mb-4">
          En apostille är en internationell bestyrkning enligt Haagkonventionen som intygar äktheten av ett dokument
          så att det kan användas i andra anslutna länder. För svenska dokument utfärdas apostille av Notarius Publicus
          eller av behörig myndighet beroende på dokumenttyp.
        </p>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">När behövs apostille?</h3>
        <ul className="list-disc list-inside text-gray-700 mb-4">
          <li>Studier och arbete utomlands (examensbevis, intyg)</li>
          <li>Företagshandlingar (registreringsbevis, fullmakter)</li>
          <li>Civilrättsliga ärenden (vigselbevis, födelsebevis)</li>
        </ul>
        <p className="text-gray-700">
          Behöver du hjälp? Beställ enkelt via vår tjänst eller <Link href="/kontakt" className="text-custom-button hover:underline">kontakta oss</Link> för rådgivning.
        </p>
      </>
    ),
  },
  {
    slug: 'notarisering-guide',
    title: 'Notarisering i Sverige: så fungerar det',
    description:
      'Vi förklarar när notarisering krävs, vilka dokument som kan notarisera och hur du snabbast får det gjort.',
    date: '2025-11-06',
    tags: ['notarisering', 'notarius publicus', 'bestyrkning'],
    content: (
      <>
        <p className="text-gray-700 mb-4">
          Notarisering innebär att Notarius Publicus bevittnar underskrift, bestyrker kopior eller intygar uppgifter.
          Det används ofta inför apostille eller ambassadlegalisering.
        </p>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Exempel på notarietjänster</h3>
        <ul className="list-disc list-inside text-gray-700 mb-4">
          <li>Bestyrkta kopior av original</li>
          <li>Bevittning av underskrifter</li>
          <li>Intyganden av fakta (t.ex. fullmakt)</li>
        </ul>
        <p className="text-gray-700">Vi koordinerar notarisering och nästa steg åt dig för en smidig process.</p>
      </>
    ),
  },
  {
    slug: 'ambassadlegalisering',
    title: 'Ambassadlegalisering: när ditt dokument ska till land utanför Haag',
    description:
      'För länder utanför Haagkonventionen krävs ofta ambassadlegalisering. Här beskriver vi stegen och hur du undviker vanliga misstag.',
    date: '2025-11-06',
    tags: ['ambassad', 'legalisering', 'konsulat'],
    content: (
      <>
        <p className="text-gray-700 mb-4">
          Ambassadlegalisering innebär att dokumentet först hanteras av svenska myndigheter (t.ex. notarien/UD) och därefter
          legaliseras av landets ambassad eller konsulat. Kraven varierar mellan länder.
        </p>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Rekommenderad ordning</h3>
        <ol className="list-decimal list-inside text-gray-700 mb-4">
          <li>Notarisering (om tillämpligt)</li>
          <li>UD/Apostille (beroende på land)</li>
          <li>Ambassad/konsulat</li>
        </ol>
        <p className="text-gray-700">Vi hanterar hela kedjan och informerar om landsspecifika krav.</p>
      </>
    ),
  },
  {
    slug: 'auktoriserad-oversattning',
    title: 'Auktoriserad översättning: rätt språk, rätt stämpel',
    description:
      'När krävs auktoriserad översättning, hur lång tid tar det och vad kostar det? Vi berättar vad som är viktigt att tänka på.',
    date: '2025-11-06',
    tags: ['översättning', 'auktoriserad', 'språk'],
    content: (
      <>
        <p className="text-gray-700 mb-4">
          Auktoriserad översättning krävs när den utländska mottagaren behöver ett officiellt intyg på att översättningen är korrekt.
          Det gäller exempelvis juridiska handlingar, betyg och intyg.
        </p>
        <p className="text-gray-700">Vi samarbetar med auktoriserade översättare för korta ledtider och hög kvalitet.</p>
      </>
    ),
  },
  {
    slug: 'leverans-och-sparning',
    title: 'Leverans & spårning: PostNord, DHL eller lokalt bud',
    description:
      'Så väljer du rätt leveranssätt för dina legaliserade dokument och hur spårning fungerar.',
    date: '2025-11-06',
    tags: ['leverans', 'postnord', 'dhl', 'bud'],
    content: (
      <>
        <p className="text-gray-700 mb-4">
          Vi erbjuder PostNord, DHL och lokala bud för säkra leveranser. Spårningsnummer skickas när sändningen lämnar oss.
        </p>
        <p className="text-gray-700">Behöver du snabbast möjliga leverans i Stockholm? Välj bud – kontakta oss för tidsfönster.</p>
      </>
    ),
  },
];

const BlogPage: React.FC = () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doxvl-51a30.web.app';
  return (
    <>
      <Seo title="Blogg | DOX Visumpartner AB" description="Artiklar och guider om apostille, notarisering, ambassadlegalisering, auktoriserad översättning och leverans – DOX Visumpartner AB." />

      <div className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl font-heading font-bold text-gray-900 text-center mb-6">Blogg & guider</h1>
        <p className="text-lg text-gray-600 text-center mb-8">Praktiska råd och förklaringar om våra tjänster – för dig som vill göra rätt från början</p>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((a) => (
            <article key={a.slug} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <header className="mb-3">
                <h2 className="text-xl font-heading font-bold text-gray-900 mb-1">{a.title}</h2>
                <p className="text-sm text-gray-500">Publicerad {new Date(a.date).toLocaleDateString('sv-SE')}</p>
              </header>
              <p className="text-gray-700 mb-4">{a.description}</p>
              <div className="prose prose-sm max-w-none mb-4">
                {a.content}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {a.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">#{tag}</span>
                ))}
              </div>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'BlogPosting',
                    headline: a.title,
                    description: a.description,
                    datePublished: a.date,
                    author: {
                      '@type': 'Organization',
                      name: 'DOX Visumpartner AB'
                    },
                    publisher: {
                      '@type': 'Organization',
                      name: 'DOX Visumpartner AB',
                      logo: {
                        '@type': 'ImageObject',
                        url: `${baseUrl}/dox-logo.webp`
                      }
                    },
                    mainEntityOfPage: {
                      '@type': 'WebPage',
                      '@id': `${baseUrl}/blogg#${a.slug}`
                    }
                  })
                }}
              />
              <div className="flex justify-end">
                <Link href="/bestall" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90">Beställ</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default BlogPage;
