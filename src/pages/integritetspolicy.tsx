import React from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Integritetspolicy - Legaliseringstjänst</title>
        <meta
          name="description"
          content="Läs vår integritetspolicy för att förstå hur vi hanterar dina personuppgifter och skyddar din integritet."
        />
      </Head>

      

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-gray-700">
              <p className="text-gray-600 mb-6">
                <em>Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</em>
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">1. Allmän information</h2>
              <p className="text-gray-700 mb-6">
                DOX Visumpartner AB ("vi", "oss" eller "vårt") respekterar din integritet och är engagerade i att skydda dina personuppgifter.
                Denna integritetspolicy förklarar hur vi samlar in, använder, lagrar och skyddar dina personuppgifter när du använder våra tjänster.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">2. Vilka uppgifter samlar vi in?</h2>
              <p className="text-gray-700 mb-4">Vi kan samla in följande typer av personuppgifter:</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li><strong>Kontaktuppgifter:</strong> Namn, e-postadress, telefonnummer</li>
                <li><strong>Beställningsuppgifter:</strong> Information om de dokument du vill legalisera</li>
                <li><strong>Kommunikationsuppgifter:</strong> Meddelanden du skickar till oss via kontaktformulär eller e-post</li>
                <li><strong>Teknisk information:</strong> IP-adress, webbläsartyp, enhetsinformation (automatiskt insamlad)</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">3. Hur använder vi dina uppgifter?</h2>
              <p className="text-gray-700 mb-4">Vi använder dina personuppgifter för att:</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Behandla och leverera våra legaliseringstjänster</li>
                <li>Kommunicera med dig om din beställning</li>
                <li>Svara på dina frågor och förfrågningar</li>
                <li>Förbättra våra tjänster och webbplats</li>
                <li>Uppfylla juridiska skyldigheter</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">4. Lagring och säkerhet</h2>
              <p className="text-gray-700 mb-6">
                Dina personuppgifter lagras säkert och endast så länge som det är nödvändigt för de ändamål de samlades in för,
                eller enligt gällande lagstiftning. Vi använder tekniska och organisatoriska säkerhetsåtgärder för att skydda dina uppgifter
                mot obehörig åtkomst, förlust eller förstörelse.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">5. Delning av uppgifter</h2>
              <p className="text-gray-700 mb-6">
                Vi delar inte dina personuppgifter med tredje part, förutom när det är nödvändigt för att tillhandahålla våra tjänster
                (t.ex. till ambassader eller myndigheter för legalisering) eller när det krävs enligt lag.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">6. Dina rättigheter</h2>
              <p className="text-gray-700 mb-4">Enligt GDPR har du rätt att:</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Få tillgång till dina personuppgifter</li>
                <li>Rätta felaktiga uppgifter</li>
                <li>Be om radering av dina uppgifter</li>
                <li>Invända mot behandling</li>
                <li>Begära dataportabilitet</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-700 mb-6">
                Vår webbplats använder cookies för att förbättra användarupplevelsen. Du kan kontrollera cookies genom dina webbläsarinställningar.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">8. Kontakt</h2>
              <p className="text-gray-700 mb-6">
                Om du har frågor om denna integritetspolicy eller vill utöva dina rättigheter, kontakta oss:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  <strong>DOX Visumpartner AB</strong><br />
                  Kungsgatan 12<br />
                  111 43 Stockholm<br />
                  Sverige<br />
                  <br />
                  E-post: info@doxvl.se<br />
                  Telefon: 08-409 419 00
                </p>
              </div>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">9. Ändringar av policyn</h2>
              <p className="text-gray-700 mb-6">
                Vi kan uppdatera denna integritetspolicy då och då. Eventuella ändringar kommer att publiceras på denna sida
                med ett uppdaterat datum.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link
                href="/kontakt"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Tillbaka till kontakt
              </Link>
            </div>
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

export default PrivacyPolicyPage;