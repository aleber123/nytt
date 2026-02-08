import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  featuredImage?: string;
}

const ArticlesPage: React.FC = () => {
  const { t } = useTranslation('common');

  const articles: Article[] = [
    {
      id: '1',
      title: 'Vad är Apostille och när behöver du det?',
      excerpt: 'Lär dig allt om apostille-stämpeln och när den krävs för dina internationella dokument.',
      content: 'Apostille är en internationell legalisering som används för dokument som ska användas i länder som är anslutna till Haagkonventionen...',
      slug: 'vad-ar-apostille',
      date: '2024-01-15',
      readTime: '5 min',
      category: 'Legaliseringsguide',
      tags: ['apostille', 'haagkonventionen', 'internationella dokument'],
      seoTitle: 'Vad är Apostille? Guide till internationell legalisering 2024',
      seoDescription: 'Komplett guide om apostille-stämpeln. Lär dig när du behöver apostille, vilka länder som kräver det och hur processen fungerar.'
    },
    {
      id: '2',
      title: 'Notarisering av dokument - Steg för steg guide',
      excerpt: 'Allt du behöver veta om att notarisera dina viktiga dokument inför legalisering.',
      content: 'Notarisering är det första steget i många legaliseringsprocesser. Här förklarar vi vad en notarius publicus gör...',
      slug: 'notarisering-steg-for-steg',
      date: '2024-01-10',
      readTime: '4 min',
      category: 'Processguide',
      tags: ['notarisering', 'notarius publicus', 'dokument'],
      seoTitle: 'Notarisering av dokument - Steg för steg guide 2024',
      seoDescription: 'Steg för steg guide till notarisering av dokument. Lär dig vad som krävs och hur du förbereder dina dokument för legalisering.'
    },
    {
      id: '3',
      title: 'Ambassadlegalisering - För länder utanför Haagkonventionen',
      excerpt: 'Guide till ambassadlegalisering för dokument som ska användas i Asien, Mellanöstern och andra regioner.',
      content: 'För länder som inte är anslutna till Haagkonventionen krävs ofta ambassadlegalisering...',
      slug: 'ambassadlegalisering-guide',
      date: '2024-01-05',
      readTime: '6 min',
      category: 'Länderguide',
      tags: ['ambassad', 'asien', 'mellanöstern', 'icke-haagländer'],
      seoTitle: 'Ambassadlegalisering - Guide för länder utanför Haagkonventionen',
      seoDescription: 'Komplett guide till ambassadlegalisering. Lär dig vilka länder som kräver detta och hur processen fungerar för Asien och Mellanöstern.'
    },
    {
      id: '4',
      title: 'Auktoriserad översättning - Krav och process',
      excerpt: 'Allt om auktoriserade översättningar för officiella dokument och legalisering.',
      content: 'Auktoriserade översättningar krävs ofta för dokument som ska legaliseras...',
      slug: 'auktoriserad-oversattning',
      date: '2024-01-01',
      readTime: '5 min',
      category: 'Översättning',
      tags: ['översättning', 'auktoriserad', 'språk', 'dokument'],
      seoTitle: 'Auktoriserad översättning - Krav och process för legalisering',
      seoDescription: 'Guide till auktoriserade översättningar. Lär dig vilka dokument som kräver översättning och hur du hittar rätt översättare.'
    },
    {
      id: '5',
      title: 'Dokumenthämtning - Praktisk tjänst för företag',
      excerpt: 'Lär dig om vår dokumenthämtningstjänst som sparar tid och förenklar legaliseringsprocessen.',
      content: 'Vår dokumenthämtningstjänst är perfekt för företag och privatpersoner som vill spara tid...',
      slug: 'dokumenthamtning-tjanst',
      date: '2023-12-28',
      readTime: '3 min',
      category: 'Tjänster',
      tags: ['dokumenthämtning', 'företag', 'express', 'logistik'],
      seoTitle: 'Dokumenthämtning Stockholm - Snabb och säker tjänst',
      seoDescription: 'Professionell dokumenthämtning i Stockholm. Spar tid och förenkla din legaliseringsprocess med vår pålitliga hämtningstjänst.'
    },
    {
      id: '6',
      title: 'Vanliga frågor om dokumentlegalisering',
      excerpt: 'Svar på de vanligaste frågorna om apostille, legalisering och dokumentprocesser.',
      content: 'Här besvarar vi de vanligaste frågorna vi får om dokumentlegalisering...',
      slug: 'faq-dokumentlegalisering',
      date: '2023-12-20',
      readTime: '7 min',
      category: 'FAQ',
      tags: ['faq', 'frågor', 'svar', 'kundservice'],
      seoTitle: 'FAQ Dokumentlegalisering - Svar på vanliga frågor',
      seoDescription: 'Vanliga frågor och svar om dokumentlegalisering. Få svar på allt från apostille till leveranstider och priser.'
    },
    {
      id: '7',
      title: 'Skillnaden mellan Apostille och Ambassadlegalisering',
      excerpt: 'Förstå när du behöver apostille och när full ambassadlegalisering krävs för dina dokument.',
      content: 'Apostille och ambassadlegalisering är två olika sätt att legalisera dokument för internationellt bruk. Apostille används för länder som är anslutna till Haagkonventionen (över 120 länder), medan ambassadlegalisering krävs för länder utanför konventionen som Saudiarabien, UAE, Kina och Qatar. Apostille är snabbare och billigare, medan ambassadlegalisering kräver flera steg: Notarius Publicus, Handelskammare, UD och slutligen ambassaden.',
      slug: 'skillnad-apostille-ambassadlegalisering',
      date: '2026-01-25',
      readTime: '6 min',
      category: 'Legaliseringsguide',
      tags: ['apostille', 'ambassadlegalisering', 'haagkonventionen', 'jämförelse'],
      seoTitle: 'Skillnaden mellan Apostille och Ambassadlegalisering 2026',
      seoDescription: 'Lär dig skillnaden mellan apostille och ambassadlegalisering. När behöver du vilken typ av legalisering? Komplett guide med priser och handläggningstider.'
    },
    {
      id: '8',
      title: 'Hur legaliserar man dokument för Saudiarabien?',
      excerpt: 'Komplett guide för att legalisera svenska dokument för användning i Saudiarabien.',
      content: 'Saudiarabien är inte anslutet till Haagkonventionen, vilket innebär att full ambassadlegalisering krävs. Processen inkluderar: 1) Notarius Publicus verifierar dokumentet, 2) Handelskammaren bekräftar notariens underskrift, 3) Utrikesdepartementet (UD) stämplar dokumentet, 4) Saudiarabiens ambassad i Stockholm legaliserar slutligt. Handläggningstiden är vanligtvis 2-3 veckor. Vi rekommenderar att även översätta dokumentet till arabiska.',
      slug: 'legalisera-dokument-saudiarabien',
      date: '2026-01-20',
      readTime: '8 min',
      category: 'Länderguide',
      tags: ['saudiarabien', 'mellanöstern', 'ambassadlegalisering', 'arabiska'],
      seoTitle: 'Legalisera dokument för Saudiarabien - Komplett guide 2026',
      seoDescription: 'Steg-för-steg guide för att legalisera dokument för Saudiarabien. Priser, handläggningstider och krav för svenska dokument.'
    },
    {
      id: '9',
      title: 'Vanliga misstag vid visumansökan',
      excerpt: 'Undvik dessa vanliga misstag som försenar eller avslår din visumansökan.',
      content: 'Många visumansökningar avslås eller försenas på grund av enkla misstag. De vanligaste är: 1) Ofullständiga dokument - saknade bilagor eller intyg, 2) Fel foto - fel storlek eller bakgrund, 3) Utgångna dokument - pass eller intyg som snart går ut, 4) Felaktig information - stavfel eller inkonsekventa uppgifter, 5) Saknad legalisering - dokument som inte är korrekt legaliserade. Vi hjälper dig undvika dessa misstag genom att granska din ansökan innan inlämning.',
      slug: 'vanliga-misstag-visumansökan',
      date: '2026-01-15',
      readTime: '5 min',
      category: 'Processguide',
      tags: ['visum', 'ansökan', 'misstag', 'tips'],
      seoTitle: 'Vanliga misstag vid visumansökan - Så undviker du dem 2026',
      seoDescription: 'Undvik vanliga misstag som försenar din visumansökan. Expertråd om dokument, foton och legalisering för en smidig process.'
    },
    {
      id: '10',
      title: 'Checklista: Dokument för arbete i UAE',
      excerpt: 'Komplett checklista för alla dokument du behöver för att arbeta i Förenade Arabemiraten.',
      content: 'För att arbeta i UAE behöver du flera legaliserade dokument: 1) Examensbevis/diplom - legaliserat och översatt till arabiska, 2) Arbetsgivarintyg - från tidigare arbetsgivare, 3) Straffregisterutdrag - max 3 månader gammalt, 4) Läkarintyg - utfärdat i UAE, 5) Passfoton - enligt UAE:s krav. Alla svenska dokument måste genomgå full ambassadlegalisering via Notarius, Handelskammare, UD och UAE:s ambassad.',
      slug: 'checklista-dokument-arbete-uae',
      date: '2026-01-10',
      readTime: '7 min',
      category: 'Länderguide',
      tags: ['uae', 'dubai', 'arbete', 'checklista', 'dokument'],
      seoTitle: 'Checklista: Dokument för arbete i UAE/Dubai 2026',
      seoDescription: 'Komplett checklista för dokument du behöver för att arbeta i UAE. Examensbevis, intyg och legalisering - allt du behöver veta.'
    },
    {
      id: '11',
      title: 'Hur lång tid tar dokumentlegalisering?',
      excerpt: 'Översikt över handläggningstider för olika typer av legalisering och länder.',
      content: 'Handläggningstiden varierar beroende på typ av legalisering: Apostille tar vanligtvis 5-7 arbetsdagar. Full ambassadlegalisering tar 2-4 veckor beroende på land. Expresstjänst kan korta tiden till 2-3 dagar för apostille. Faktorer som påverkar tiden: ambassadens handläggningstid, dokumenttyp, och om översättning behövs. Vi rekommenderar att planera minst 3-4 veckor i förväg för ambassadlegalisering.',
      slug: 'hur-lang-tid-dokumentlegalisering',
      date: '2026-01-05',
      readTime: '4 min',
      category: 'Processguide',
      tags: ['handläggningstid', 'leveranstid', 'express', 'planering'],
      seoTitle: 'Hur lång tid tar dokumentlegalisering? Guide 2026',
      seoDescription: 'Översikt över handläggningstider för apostille och ambassadlegalisering. Planera rätt med vår tidsguide.'
    }
  ];

  const categories = ['Alla', 'Legaliseringsguide', 'Processguide', 'Länderguide', 'Översättning', 'Tjänster', 'FAQ'];
  const [selectedCategory, setSelectedCategory] = React.useState('Alla');

  const filteredArticles = selectedCategory === 'Alla'
    ? articles
    : articles.filter(article => article.category === selectedCategory);
  return (
    <>
      <Head>
        <title>Artiklar om Dokumentlegalisering | Legaliseringstjänst</title>
        <meta
          name="description"
          content="Läs våra artiklar om apostille, legalisering, översättning och dokumentprocesser. Expertkunskap och guider för internationella dokument."
        />
        <meta name="keywords" content="apostille, legalisering, dokument, översättning, ambassad, notarisering, internationella dokument" />
        <meta property="og:title" content="Artiklar om Dokumentlegalisering | Legaliseringstjänst" />
        <meta property="og:description" content="Expertartiklar om apostille, legalisering och internationella dokumentprocesser." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://doxvl.se/artiklar" />
      </Head>

      <div className="bg-custom-page-header py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center">
            Kunskapsbank
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Expertartiklar om dokumentlegalisering
          </h2>
          <p className="text-lg text-gray-600">
            Lär dig allt om apostille, legalisering och internationella dokumentprocesser
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-custom-button text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-custom-button/10 hover:text-custom-button'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredArticles.map((article) => (
            <article key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-custom-button bg-custom-button/10 px-2 py-1 rounded-full">
                  {article.category}
                </span>
                <span className="text-xs text-gray-500">{article.readTime} läsning</span>
              </div>

              <h2 className="text-xl font-heading font-bold text-gray-900 mb-3 line-clamp-2">
                <Link href={`/artiklar/${article.slug}`} className="hover:text-custom-button transition-colors">
                  {article.title}
                </Link>
              </h2>

              <p className="text-gray-600 mb-4 line-clamp-3">
                {article.excerpt}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {article.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(article.date).toLocaleDateString('sv-SE')}
                </span>
                <Link
                  href={`/artiklar/${article.slug}`}
                  className="text-custom-button hover:text-custom-button/80 font-medium text-sm"
                >
                  Läs mer →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            {t('articles.ctaTitle') || 'Behöver du hjälp med dokumentlegalisering?'}
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('articles.ctaText') || 'Kontakta oss för kostnadsfri rådgivning om dina dokumentbehov'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center px-6 py-3 border border-custom-button text-base font-medium rounded-md text-custom-button bg-white hover:bg-custom-button/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
            >
              {t('articles.contact') || 'Kontakta oss'}
            </Link>
            <Link
              href="/bestall"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
            >
              {t('articles.startOrder') || 'Starta beställning'}
            </Link>
          </div>
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

export default ArticlesPage;