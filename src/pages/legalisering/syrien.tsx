import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';

export default function SyrienLegaliseringPage() {
  const { t } = useTranslation('common');
  const countryKey = 'syrien';
  const cp = `countryPages.${countryKey}`;
  
  const country = { name: 'Syrien', countryCode: 'SY', color: '#CE1126', colorDark: '#9e0d1d' };
  const embassy = { address: 'Vendevägen 90, 5:e våningen', postalCode: '182 32 Danderyd', phone: '+46 8 622 18 70' };

  return (
    <>
      <Head>
        <title>{t(`${cp}.title`)} | DOX Visumpartner</title>
        <meta name="description" content={t(`${cp}.metaDescription`)} />
              </Head>
      
      <main className="min-h-screen bg-gray-50">
        <section className="text-white py-16 md:py-24" style={{ background: `linear-gradient(to bottom right, ${country.color}, ${country.colorDark})` }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code={country.countryCode} size={64} />
              <div><h1 className="text-3xl md:text-5xl font-bold">{t(`${cp}.title`)}</h1><p className="text-xl text-white/80">{t(`${cp}.embassyName`)}</p></div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">{t(`${cp}.heroText`)}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg" style={{ color: country.color }}>{t('countryPages.orderLegalization')}</Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg">{t('countryPages.contactUs')}</Link>
            </div>
          </div>
        </section>
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div><h2 className="text-2xl font-bold mb-4">{t('countryPages.documentsFor', { country: country.name })}</h2><p className="text-gray-700">{t('countryPages.documentsIntro', { country: country.name })}</p></div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">{t('countryPages.commonDocuments')}</h3>
              <ul className="space-y-2">{(t(`${cp}.documents`, { returnObjects: true }) as string[]).map((d, i) => <li key={i} className="flex items-start"><span className="mr-2" style={{ color: country.color }}>✓</span>{d}</li>)}</ul>
            </div>
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">{t('countryPages.contactInfo')}</h3>
              <p className="text-gray-700"><strong>{t('countryPages.address')}:</strong> {embassy.address}, {embassy.postalCode}</p>
              <p className="text-gray-700"><strong>{t('countryPages.phone')}:</strong> {embassy.phone}</p>
            </div>
            <div className="p-6 rounded-lg" style={{ backgroundColor: `${country.color}10` }}>
              <h3 className="font-semibold mb-4">{t('countryPages.weHandleEverything')}</h3>
              <Link href="/bestall" className="block w-full text-white font-semibold py-3 rounded-lg text-center" style={{ backgroundColor: country.color }}>{t('countryPages.orderNow')}</Link>
            </div>
          </div>
        </section>
        <section className="py-16 text-white" style={{ backgroundColor: country.color }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('countryPages.readyToLegalize')}</h2>
            <Link href="/bestall" className="bg-white font-semibold px-8 py-4 rounded-lg inline-block" style={{ color: country.color }}>{t('countryPages.orderNow')}</Link>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await serverSideTranslations(locale ?? 'sv', ['common'])) },
});
