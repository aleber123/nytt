import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Seo from '@/components/Seo';

const FAQPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>FAQ – Vanliga frågor | Legaliseringstjänst</title>
        <meta name="description" content="Vanliga frågor om apostille, notarisering, ambassadlegalisering, leverans och priser hos DOX Visumpartner AB." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Vad är en apostille?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Apostille är en internationell stämpel enligt Haagkonventionen som bekräftar ett dokuments äkthet så att det kan användas i andra anslutna länder.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'När behövs notarisering?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Notarisering används när ett dokument behöver bevittnas eller bestyrkas av notarius publicus, ofta inför apostille eller ambassadlegalisering.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Vad innebär ambassadlegalisering?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'För länder utanför Haagkonventionen krävs ofta legalisering via ambassad eller konsulat. Vi hanterar processen och kontakt med aktuell ambassad.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Hur lång är handläggningstiden?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Tiderna varierar beroende på tjänst och land, men standardintervall framgår på respektive tjänstsida och express kan ibland erbjudas.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Hur kan jag få tillbaka mina dokument?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Vi erbjuder retur via PostNord, DHL eller lokal budleverans. Välj alternativ i beställningen eller kontakta oss för rekommendation.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Vad kostar det?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Se sidan Priser för aktuella prisuppgifter. För komplexa ärenden eller större volymer lämnar vi offert.'
                  }
                }
              ]
            })
          }}
        />
      </Head>
      <Seo title="FAQ – Vanliga frågor | Legaliseringstjänst" description="Vanliga frågor om apostille, notarisering, ambassadlegalisering, leverans och priser hos DOX Visumpartner AB." />

      <div className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl font-heading font-bold text-gray-900 text-center mb-6">Vanliga frågor</h1>
        <p className="text-lg text-gray-600 text-center mb-8">Svar på de vanligaste frågorna om våra tjänster och processen</p>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Vad är en apostille?</h2>
            <p className="text-gray-700">Apostille är en internationell stämpel enligt Haagkonventionen som bekräftar ett dokuments äkthet så att det kan användas i andra anslutna länder.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">När behövs notarisering?</h2>
            <p className="text-gray-700">Notarisering används när ett dokument behöver bevittnas eller bestyrkas av notarius publicus. Det är vanligt för fullmakter, intyg och kopior.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Vad innebär ambassadlegalisering?</h2>
            <p className="text-gray-700">För länder utanför Haagkonventionen krävs ofta legalisering via ambassad eller konsulat. Vi hanterar processen och kontakt med aktuell ambassad.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Hur lång är handläggningstiden?</h2>
            <p className="text-gray-700">Tiderna varierar beroende på tjänst och land. Standardtider framgår på respektive tjänstsida. Behöver du snabbare hjälp kan vi ofta erbjuda expressalternativ.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Hur kan jag få tillbaka mina dokument?</h2>
            <p className="text-gray-700">Vi erbjuder retur via PostNord, DHL eller lokal budleverans. Du väljer alternativ i beställningen eller kontaktar oss för rekommendation.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Vad kostar det?</h2>
            <p className="text-gray-700">Se sidan Priser för aktuella prisuppgifter. För komplexa ärenden eller större volymer lämnar vi offert.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Vilka dokument kan ni hjälpa till med?</h2>
            <p className="text-gray-700">Vi hjälper privatpersoner och företag med bland annat intyg, examensbevis, fullmakter, registreringsbevis och handelsdokument.</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-heading font-bold text-gray-900 mb-2">Hur kommer jag igång?</h2>
            <p className="text-gray-700">Gå till Beställ och följ stegen. Är du osäker på vad som behövs för ditt mål-land så kontaktar du oss, så guidar vi dig.</p>
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

export default FAQPage;
