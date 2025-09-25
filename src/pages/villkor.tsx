import React from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

const TermsAndConditionsPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Allmänna villkor - Legaliseringstjänst</title>
        <meta
          name="description"
          content="Läs våra allmänna villkor för att förstå villkoren för våra legaliseringstjänster."
        />
      </Head>

      <div className="bg-custom-page-header py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center">
            Allmänna villkor
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-gray-700">
              <p className="text-gray-600 mb-6">
                <em>Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</em>
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">1. Allmän information</h2>
              <p className="text-gray-700 mb-6">
                Dessa allmänna villkor ("Villkor") reglerar användningen av Legaliseringstjänst AB:s ("vi", "oss" eller "vårt") tjänster.
                Genom att använda våra tjänster accepterar du dessa villkor. Dessa villkor gäller från det att du accepterar dem innan beställning.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">2. Tjänstebeskrivning</h2>
              <p className="text-gray-700 mb-6">
                Vi erbjuder legaliseringstjänster för dokument som ska användas utomlands. Detta inkluderar hantering av dokument,
                kommunikation med relevanta myndigheter, ambassader och andra instanser samt transport av dokument.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">3. Kundens ansvar</h2>
              <p className="text-gray-700 mb-4">Som kund ansvarar du för:</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Att tillhandahålla korrekta och fullständiga dokument</li>
                <li>Att ange rätt destination och krav för legalisering</li>
                <li>Att betala för tjänsterna enligt överenskommelse</li>
                <li>Att kontrollera att alla uppgifter är korrekta innan beställning</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">4. Ansvarsbegränsning</h2>
              <p className="text-gray-700 mb-4">
                Vi ansvarar endast för de tjänster som vi har åtagit oss att utföra enligt dessa villkor.
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Vi ansvarar inte för förseningar orsakade av myndigheter eller tredje part</li>
                <li>Vårt ansvar begränsas till det belopp som betalats för tjänsten</li>
                <li>Vi ansvarar inte för indirekta skador eller följdskador</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">5. Prissättning</h2>
              <p className="text-gray-700 mb-6">
                Alla priser anges exklusive moms om inte annat anges. Priserna kan ändras med förvarning.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">6. Avbokning och återbetalning</h2>
              <p className="text-gray-700 mb-6">
                Beställningar kan avbokas kostnadsfritt inom 24 timmar från beställningstillfället.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">7. Force majeure</h2>
              <p className="text-gray-700 mb-6">
                Vi ansvarar inte för förseningar orsakade av omständigheter utanför vår kontroll.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">8. Tillämplig lag</h2>
              <p className="text-gray-700 mb-6">
                Dessa villkor regleras av svensk lag. Eventuella tvister ska lösas i svensk domstol.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">9. Ändringar av villkor</h2>
              <p className="text-gray-700 mb-6">
                Vi förbehåller oss rätten att ändra dessa villkor. Ändringar meddelas via vår webbplats.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">10. Kontaktinformation</h2>
              <p className="text-gray-700 mb-6">
                Vid frågor om dessa villkor, vänligen kontakta oss.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  <strong>Legaliseringstjänst AB</strong><br />
                  Kungsgatan 12<br />
                  111 43 Stockholm<br />
                  Sverige<br />
                  <br />
                  info@legaliseringstjanst.se<br />
                  +46 8 123 456 78
                </p>
              </div>
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

export default TermsAndConditionsPage;