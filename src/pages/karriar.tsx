import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

const CareersPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Karriär | DOX Visumpartner AB</title>
        <meta name="description" content="Jobba hos DOX Visumpartner AB. Vi söker drivna personer inom kundservice, administration och dokumenthantering." />
      </Head>

      <div className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl font-heading font-bold text-gray-900 text-center mb-6">Karriär</h1>
        <p className="text-lg text-gray-600 text-center mb-8">Vill du vara med och förenkla legalisering och visum för våra kunder?</p>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Om DOX */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">Om DOX Visumpartner</h2>
            <p className="text-gray-700">Vi hjälper privatpersoner och företag med apostille, notarisering, ambassadlegalisering och relaterade dokumenttjänster. Vi växer och vill stärka teamet med serviceinriktade och noggranna medarbetare.</p>
          </div>

          {/* Roller vi letar efter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Roller vi ofta söker</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Kundservice & rådgivning (svenska/engelska)</li>
              <li>Administratör – dokumenthantering och kvalitetssäkring</li>
              <li>Operativ samordnare – process & logistik</li>
              <li>Affärsstöd – offert & fakturering</li>
            </ul>
          </div>

          {/* Vårt erbjudande */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Vi erbjuder</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Möjlighet att påverka och utveckla effektiva processer</li>
              <li>Team med högt kundfokus och kvalitetsarbete</li>
              <li>Flexibla arbetssätt och tydliga mål</li>
            </ul>
          </div>

          {/* Spontanansökan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">Spontanansökan</h2>
            <p className="text-gray-700 mb-4">Skicka CV och en kort presentation om varför du vill arbeta hos oss.</p>
            <a href="mailto:info@doxvl.se?subject=Spontanans%C3%B6kan%20-%20DOX%20Visumpartner" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button">Skicka ansökan</a>
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

export default CareersPage;
