import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';

const AboutPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('about.title') || 'Om oss - Legaliseringstjänst'}</title>
        <meta
          name="description"
          content={t('about.description') || 'Läs mer om Legaliseringstjänst och vårt arbete med dokumentlegalisering för internationell användning.'}
        />
      </Head>

      

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                {t('about.missionTitle') || 'Vårt uppdrag'}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('about.missionText') || 'Legaliseringstjänst är din pålitliga partner för dokumentlegalisering. Vi förenklar processen att få dina dokument giltiga för internationell användning genom att erbjuda professionella tjänster inom apostille, notarisering och ambassadlegalisering.'}
              </p>
              <p className="text-gray-700">
                {t('about.missionText2') || 'Vårt mål är att göra den ofta komplicerade legaliseringsprocessen så enkel och stressfri som möjligt för våra kunder, oavsett om du är en privatperson, företag eller organisation.'}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                {t('about.experienceTitle') || 'Vår erfarenhet'}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('about.experienceText') || 'Med många års erfarenhet inom dokumenthantering och internationell legalisering har vi hjälpt tusentals kunder att få sina dokument korrekt legaliserade för användning i över 100 länder världen över.'}
              </p>
              <p className="text-gray-700">
                {t('about.experienceText2') || 'Vårt team av experter har djup kunskap om olika länders krav och konventioner, vilket säkerställer att dina dokument blir korrekt behandlade enligt gällande internationella standarder.'}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                {t('about.qualityTitle') || 'Kvalitet och säkerhet'}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('about.qualityText') || 'Vi prioriterar alltid kvalitet och säkerhet i vårt arbete. Alla våra processer följer strikta kvalitetsstandarder och vi använder endast certifierade och auktoriserade tjänster för att säkerställa att dina dokument blir korrekt legaliserade.'}
              </p>
              <p className="text-gray-700">
                {t('about.qualityText2') || 'Din integritet och dokumentens säkerhet är av högsta prioritet för oss. Vi hanterar alla dokument med största omsorg och följer alla gällande dataskyddsregler.'}
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                {t('about.servicesTitle') || 'Våra tjänster'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.apostille.title') || 'Apostille'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('services.apostille.description') || 'För länder anslutna till Haagkonventionen'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.notarization.title') || 'Notarisering'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('services.notarization.description') || 'Juridisk bekräftelse av dokument'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.embassy.title') || 'Ambassadlegalisering'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('services.embassy.description') || 'För länder utanför Haagkonventionen'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.translation.title') || 'Auktoriserad översättning'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('services.translation.description') || 'Officiella översättningar'}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                {t('about.contactTitle') || 'Kontakta oss'}
              </h2>
              <p className="text-gray-700 mb-4">
                {t('about.contactText') || 'Har du frågor om våra tjänster eller behöver hjälp med legalisering av dina dokument? Tveka inte att kontakta oss.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/kontakt"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
                >
                  {t('about.contactButton') || 'Kontakta oss'}
                </Link>
                <Link
                  href="/bestall"
                  className="inline-flex items-center justify-center px-6 py-3 border border-custom-button text-base font-medium rounded-md text-custom-button bg-white hover:bg-custom-button/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
                >
                  {t('about.orderButton') || 'Beställ nu'}
                </Link>
              </div>
            </section>
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

export default AboutPage;