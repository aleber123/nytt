import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

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
          {/* Team Members Section */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-heading font-bold text-gray-900 mb-3">
                {t('about.teamTitle') || 'Möt vårt team'}
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                {t('about.teamSubtitle') || 'Engagerade experter som hjälper dig med dokumentlegalisering och visum – snabbt, enkelt och professionellt.'}
              </p>
            </div>

            {/* Row 1: Group photo members */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8">
              <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square relative overflow-hidden">
                  <Image src="/images/staff-bo.png" alt="Bo Lundberg" width={600} height={600} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold">Bo Lundberg</h3>
                    <p className="text-sm text-white/80">{t('about.boRole') || 'Ekonomi & Ambassadrelationer'}</p>
                  </div>
                </div>
                <div className="p-5"><p className="text-gray-600 text-sm leading-relaxed">{t('about.boBio') || ''}</p></div>
              </div>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square relative overflow-hidden">
                  <Image src="/images/staff-henrik.png" alt="Henrik Oinas" width={600} height={600} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold">Henrik Oinas</h3>
                    <p className="text-sm text-white/80">{t('about.henrikRole') || 'Operations Manager & Partner'}</p>
                  </div>
                </div>
                <div className="p-5"><p className="text-gray-600 text-sm leading-relaxed">{t('about.henrikBio') || ''}</p></div>
              </div>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square relative overflow-hidden">
                  <Image src="/images/staff-alexander.png" alt="Alexander Bergqvist" width={600} height={600} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold">Alexander Bergqvist</h3>
                    <p className="text-sm text-white/80">{t('about.alexanderRole') || 'Fullstack-utvecklare'}</p>
                  </div>
                </div>
                <div className="p-5"><p className="text-gray-600 text-sm leading-relaxed">{t('about.alexanderBio') || ''}</p></div>
              </div>
            </div>
            {/* Row 2: Göran & Saema */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Göran */}
              <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src="/images/staff-goran.png"
                    alt="Göran Andersson – VD & Partner"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold">Göran Andersson</h3>
                    <p className="text-sm text-white/80">{t('about.goranRole') || 'VD & Partner'}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {t('about.goranBio') || 'Göran leder DOX Visumpartner med lång erfarenhet inom internationell dokumenthantering. Med ett starkt engagemang för kvalitet och kundnöjdhet driver han företagets vision att förenkla legalisering för alla.'}
                  </p>
                </div>
              </div>

              {/* Saema */}
              <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src="/images/staff-saema.png"
                    alt="Saema Jafar – Operations Manager Sverige/Danmark"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="text-lg font-bold">Saema Jafar</h3>
                    <p className="text-sm text-white/80">{t('about.saemaRole') || 'Operations Manager – Sverige & Danmark'}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {t('about.saemaBio') || 'Saema ansvarar för den dagliga verksamheten i Sverige och Danmark. Med sin operativa skicklighet och kundfokus säkerställer hon att varje ärende hanteras effektivt och korrekt.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.apostille.title') || 'Apostille'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('about.serviceApostilleDesc') || 'Legalisering av dokument för användning i länder som är anslutna till Haagkonventionen.'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.notarization.title') || 'Notarisering'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('about.serviceNotarizationDesc') || 'Notarisering av dokument av notarius publicus för juridisk giltighet.'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.embassy.title') || 'Ambassadlegalisering'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('about.serviceEmbassyDesc') || 'Legalisering av dokument via ambassad eller konsulat för användning i specifika länder.'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('services.translation.title') || 'Auktoriserad översättning'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('about.serviceTranslationDesc') || 'Översättning av dokument av auktoriserade översättare för officiellt bruk.'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('about.serviceVisaTitle') || 'Visum'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('about.serviceVisaDesc') || 'Visumansökningar och rådgivning för resor till ett stort antal länder världen över.'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('about.serviceCooTitle') || 'Ursprungsintyg (COO)'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('about.serviceCooDesc') || 'Certificate of Origin via Handelskammaren för internationell handel och export.'}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('about.serviceCppTitle') || 'CPP – Certificate of Pharmaceutical Product'}
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {t('about.serviceCppDesc') || 'Intyg för läkemedelsprodukter för export och internationell registrering.'}
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
                  {t('about.orderLegalization') || 'Beställ legalisering'}
                </Link>
                <Link
                  href="/visum/bestall"
                  className="inline-flex items-center justify-center px-6 py-3 border border-custom-button text-base font-medium rounded-md text-custom-button bg-white hover:bg-custom-button/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
                >
                  {t('about.orderVisa') || 'Beställ visum'}
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