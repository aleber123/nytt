import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';
import LegaliseringCountrySEO from '@/components/SEO/LegaliseringCountrySEO';

export default function EgyptenLegaliseringPage() {
  const { t } = useTranslation('common');
  const countryKey = 'egypten';
  const cp = `countryPages.${countryKey}`;
  
  const country = { name: 'Egypten', nameEn: 'Egypt', countryCode: 'EG', color: '#C8102E', colorDark: '#9a0c23' };
  const embassy = {
    address: 'Strandvägen 35',
    postalCode: '114 56 Stockholm',
    phone: '+46 8 679 57 50',
    website: 'https://embassyofegypt.se'
  };

  const pageTitle = `${t(`${cp}.title`)} | DOX Visumpartner`;

  return (
    <>
      <LegaliseringCountrySEO
        countryName="Egypten"
        countryNameEn="Egypt"
        countryCode="EG"
        slug="egypten"
        title="Legalisering för Egypten - Egyptens ambassad Stockholm | DOX Visumpartner"
        titleEn="Document Legalization for Egypt - Embassy of Egypt Stockholm | DOX Visumpartner"
        description="Vi hjälper dig med legalisering av dokument för Egypten. Komplett service inkl. notarisering, UD och Egyptens ambassad i Stockholm. Fast pris, snabb hantering."
        descriptionEn="We help you with document legalization for Egypt. Complete service including notarization, MFA and Embassy of Egypt in Stockholm."
        keywords="Egypten legalisering, legalisering Egypten, Egyptens ambassad Stockholm, legalisera dokument Egypten, ambassadlegalisering Egypten, Kairo, dokumentlegalisering, UD legalisering Egypten"
        priceLow="1200"
        priceHigh="4500"
        faqItems={[
          { question: 'Hur legaliserar jag dokument för Egypten?', answer: 'Legaliseringsprocessen för Egypten inkluderar notarisering, UD-verifiering och slutlig legalisering vid Egyptens ambassad i Stockholm. DOX Visumpartner hanterar hela processen.' },
          { question: 'Hur lång tid tar legalisering för Egypten?', answer: 'Normalt 5-10 arbetsdagar beroende på dokumenttyp och handläggningstider vid Egyptens ambassad.' },
          { question: 'Vad kostar legalisering för Egypten?', answer: 'Kontakta oss för en kostnadsfri offert. Vi erbjuder fasta priser utan dolda avgifter.' },
        ]}
      />
      
      <main className="min-h-screen bg-gray-50">
        <section className="text-white py-16 md:py-24" style={{ background: `linear-gradient(to bottom right, ${country.color}, ${country.colorDark})` }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code={country.countryCode} size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">{t(`${cp}.title`)}</h1>
                <p className="text-xl text-white/80">{t(`${cp}.embassyName`)}</p>
              </div>
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
            <div>
              <h2 className="text-2xl font-bold mb-4">{t('countryPages.documentsFor', { country: country.name })}</h2>
              <p className="text-gray-700">{t('countryPages.documentsIntro', { country: country.name })}</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">{t('countryPages.commonDocuments')}</h3>
              <ul className="space-y-2">
                {(t(`${cp}.documents`, { returnObjects: true }) as string[]).map((doc, i) => (
                  <li key={i} className="flex items-start"><span className="mr-2" style={{ color: country.color }}>✓</span>{doc}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-4">{t('countryPages.contactInfo')}</h3>
              <p className="text-gray-700"><strong>{t('countryPages.address')}:</strong> {embassy.address}, {embassy.postalCode}</p>
              <p className="text-gray-700"><strong>{t('countryPages.phone')}:</strong> {embassy.phone}</p>
              <p className="text-gray-700"><strong>{t('countryPages.website')}:</strong> <a href={embassy.website} className="text-blue-600 hover:underline">{embassy.website}</a></p>
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
