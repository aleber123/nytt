import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';

const DeliveryTimesPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Leveranstider | Legaliseringstjänst</title>
        <meta name="description" content="Information om leveranstider och leveranssätt hos DOX Visumpartner AB – PostNord, DHL och lokala bud." />
      </Head>

      <div className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl font-heading font-bold text-gray-900 text-center mb-6">Leveranstider</h1>
        <p className="text-lg text-gray-600 text-center mb-8">Översikt över handläggningstider och leveransalternativ för dina dokument</p>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Handläggningstider */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Handläggningstider</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Standard</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Apostille: 5–7 arbetsdagar</li>
                  <li>Notarisering: ca 8 arbetsdagar</li>
                  <li>Ambassadlegalisering: ca 15 arbetsdagar</li>
                  <li>Auktoriserad översättning: ca 10 arbetsdagar</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Express (om möjligt)</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Apostille/Notarisering: Försök till snabbare handläggning</li>
                  <li>Ambassadlegalisering: Begränsad möjlighet, beror på ambassad</li>
                  <li>Översättning: Prioriterad hantering vid behov</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">Observera att tiderna är uppskattningar och kan variera beroende på myndigheter och ambassader.</p>
          </div>

          {/* Leveranssätt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Leveranssätt</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">PostNord</h3>
                <p className="text-gray-700 text-sm">Spårbar leverans inom Sverige. Standard- eller expressalternativ beroende på ort.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">DHL</h3>
                <p className="text-gray-700 text-sm">Snabb och spårbar leverans, lämplig för brådskande eller internationella sändningar.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Lokal budleverans</h3>
                <p className="text-gray-700 text-sm">Kurir/bud inom Stockholmsområdet för snabb och säker leverans direkt till dörren.</p>
              </div>
            </div>
          </div>

          {/* Spårning & avisering */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">Spårning och avisering</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Spårningsnummer skickas via e-post så snart försändelsen har lämnats till transportör.</li>
              <li>Vid kurirleverans får du avisering om planerad utlämning och eventuell legitimering.</li>
              <li>Behöver du ändra leveranssätt? Kontakta oss så hjälper vi dig.</li>
            </ul>
          </div>

          {/* Kontakt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-heading font-bold text-gray-900 mb-3">Frågor om leveranser?</h2>
            <p className="text-gray-700 mb-4">Kontakta DOX Visumpartner AB – vi hjälper dig att välja rätt leveransalternativ för dina behov.</p>
            <a href="/kontakt" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button">Kontakta oss</a>
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

export default DeliveryTimesPage;
