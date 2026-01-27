import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement } from '@/firebase/visaRequirementsService';

export default function AngolaVisumPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement('AO');
        if (requirement?.visaProducts && requirement.visaProducts.length > 0) {
          // Get the first product's document requirements
          const firstProduct = requirement.visaProducts[0];
          setSelectedProductName(locale === 'en' ? (firstProduct.nameEn || firstProduct.name) : firstProduct.name);
          if (firstProduct.documentRequirements) {
            setDocumentRequirements(firstProduct.documentRequirements.filter((d: DocumentRequirement) => d.isActive));
          }
        }
      } catch {
        // Silent fail - use static list as fallback
      }
    };
    fetchRequirements();
  }, [locale]);

  const embassyInfo = {
    name: 'Angolas ambassad i Stockholm',
    address: 'Ulriksdals Slottsväg 4',
    postalCode: '170 79 Solna',
    phone: '+46 8 655 00 70',
    email: 'embassy@angolaemb.se',
    openingHours: 'Måndag-Fredag 09:00-16:00'
  };

  const visumTypes = [
    {
      name: 'Turistvisum',
      duration: 'Upp till 30 dagar',
      description: 'För turism och besök hos familj/vänner'
    },
    {
      name: 'Affärsvisum',
      duration: 'Upp till 90 dagar',
      description: 'För affärsmöten, konferenser och företagsbesök'
    },
    {
      name: 'Arbetsvisum',
      duration: 'Varierar',
      description: 'För anställning hos angolanskt företag'
    },
    {
      name: 'Transitvisum',
      duration: 'Upp till 5 dagar',
      description: 'För genomresa till annat land'
    }
  ];

  const requiredDocuments = [
    'Giltigt pass (minst 6 månaders giltighet)',
    'Ifylld visumansökan',
    'Passfoto (2 st, 35x45mm)',
    'Inbjudningsbrev eller hotellbokning',
    'Returbiljett eller resplan',
    'Bevis på ekonomiska medel',
    'Gul febervaccinationsintyg',
    'Reseförsäkring'
  ];

  return (
    <>
      <Head>
        <title>Visum till Angola - Ansök om angolanskt visum | DOX Visumpartner</title>
        <meta name="description" content="Behöver du visum till Angola? Vi hjälper dig med visumansökan till Angola. Turistvisum, affärsvisum och arbetsvisum. Snabb handläggning via Angolas ambassad i Stockholm." />
        <meta name="keywords" content="Angola visum, visum Angola, angolanskt visum, turistvisum Angola, affärsvisum Angola, arbetsvisum Angola, Angolas ambassad Stockholm, visumansökan Angola" />
        
        <meta property="og:title" content="Visum till Angola - Ansök om angolanskt visum | DOX Visumpartner" />
        <meta property="og:description" content="Vi hjälper dig med visumansökan till Angola. Turistvisum, affärsvisum och arbetsvisum via Angolas ambassad i Stockholm." />
        <meta property="og:url" content="https://www.doxvl.se/visum/angola" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://www.doxvl.se/visum/angola" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visum till Angola",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se"
          },
          "description": "Visumservice för Angola. Vi hjälper dig med ansökan om turistvisum, affärsvisum och arbetsvisum till Angola.",
          "areaServed": ["SE"],
          "serviceType": "Visa Application Service"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#CE1126] to-[#A00D1E] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="AO" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum till Angola
                </h1>
                <p className="text-xl text-white/80">Angolas ambassad i Stockholm</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Planerar du att resa till Angola? Vi hjälper dig med hela visumprocessen – 
              från ansökan till godkänt visum. Kontakta oss för personlig rådgivning.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/kontakt" className="bg-white hover:bg-gray-100 text-[#CE1126] font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss för offert
              </Link>
              <a href="tel:+46812345678" className="border-2 border-white hover:bg-white hover:text-[#CE1126] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Ring oss
              </a>
            </div>
          </div>
        </section>

        {/* Visum Types Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Typer av visum till Angola
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visumTypes.map((visum) => (
                <div key={visum.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-[#CE1126] mb-2">{visum.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{visum.duration}</p>
                  <p className="text-gray-700">{visum.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Angola Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Varför behövs visum till Angola?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Angola kräver visum för svenska medborgare som vill besöka landet. 
                  Oavsett om du reser för turism, affärer eller arbete behöver du ett giltigt visum 
                  innan avresa.
                </p>
                <p className="text-gray-700 mb-4">
                  Visumansökan görs via Angolas ambassad i Stockholm. Processen kan vara 
                  tidskrävande och kräver korrekta dokument. Vi hjälper dig att undvika 
                  vanliga misstag och säkerställer att din ansökan blir godkänd.
                </p>
                <p className="text-gray-700">
                  Angola är ett land med stora möjligheter inom olja, diamanter och jordbruk. 
                  Många svenska företag har verksamhet i landet, vilket gör affärsvisum till 
                  en vanlig förfrågan.
                </p>
              </div>
              <div className="bg-[#CE1126]/5 p-6 rounded-lg border border-[#CE1126]/20">
                <h3 className="font-semibold text-lg mb-4">
                  {documentRequirements.length > 0 && selectedProductName
                    ? `Dokument som krävs för ${selectedProductName}:`
                    : 'Dokument som krävs:'}
                </h3>
                {documentRequirements.length > 0 ? (
                  <ul className="space-y-3 text-gray-700">
                    {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                      <li key={doc.id} className="flex items-start">
                        <span className={`mr-2 flex-shrink-0 ${doc.required ? 'text-[#CE1126]' : 'text-gray-400'}`}>
                          {doc.required ? '✓' : '○'}
                        </span>
                        <div>
                          <span className="font-medium">
                            {locale === 'en' ? doc.nameEn : doc.name}
                            {doc.required && <span className="text-[#CE1126] ml-1">*</span>}
                          </span>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {locale === 'en' ? doc.descriptionEn : doc.description}
                          </p>
                          {doc.templateUrl && (
                            <a 
                              href={doc.templateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
                            >
                              📎 {locale === 'en' ? 'Download form' : 'Ladda ner formulär'}
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-gray-700">
                    {requiredDocuments.map((doc, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#CE1126] mr-2">✓</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-500 mt-4">* = Obligatoriskt</p>
                
                {/* Download application form */}
                <div className="mt-6 pt-4 border-t border-[#CE1126]/20">
                  <a 
                    href="/documents/angola-visa-application-form.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#CE1126] hover:bg-[#A00D1E] text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    📄 {locale === 'en' ? 'Download Visa Application Form (PDF)' : 'Ladda ner visumansökan (PDF)'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Så fungerar visumprocessen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Kontakta oss', desc: 'Berätta om din resa så ger vi dig en offert.' },
                { step: '2', title: 'Skicka dokument', desc: 'Vi berättar exakt vilka dokument som behövs.' },
                { step: '3', title: 'Vi ansöker', desc: 'Vi lämnar in din ansökan till ambassaden.' },
                { step: '4', title: 'Visum klart', desc: 'Du får ditt visum levererat hem.' },
              ].map((item) => (
                <div key={item.step} className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="w-12 h-12 bg-[#CE1126] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Embassy Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Angolas ambassad i Stockholm
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Kontaktuppgifter</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <strong>Adress:</strong><br />
                      {embassyInfo.address}<br />
                      {embassyInfo.postalCode}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📞</span>
                    <div>
                      <strong>Telefon:</strong><br />
                      {embassyInfo.phone}
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">🕐</span>
                    <div>
                      <strong>Öppettider:</strong><br />
                      {embassyInfo.openingHours}
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-[#CE1126]/5 p-6 rounded-lg border border-[#CE1126]/20">
                <h3 className="font-semibold text-lg mb-4">Låt oss hjälpa dig</h3>
                <p className="text-gray-700 mb-4">
                  Visumansökan till Angola kan vara komplicerad. Vi har erfarenhet av att 
                  hjälpa både privatpersoner och företag med angolanska visum.
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Personlig rådgivning
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Granskning av dokument
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Inlämning till ambassaden
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Uppföljning och leverans
                  </li>
                </ul>
                <Link href="/kontakt" className="block w-full bg-[#CE1126] hover:bg-[#A00D1E] text-white font-semibold py-3 rounded-lg transition-colors text-center">
                  Kontakta oss
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor om visum till Angola
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar det att få visum till Angola?</h3>
                <p className="text-gray-700">
                  Handläggningstiden varierar men är normalt 5-10 arbetsdagar. Vi rekommenderar 
                  att ansöka minst 3-4 veckor innan planerad avresa.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Behöver jag gul febervaccination?</h3>
                <p className="text-gray-700">
                  Ja, Angola kräver gul febervaccinationsintyg för alla resenärer. 
                  Vaccinationen måste vara gjord minst 10 dagar innan inresa.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Kan jag förlänga mitt visum i Angola?</h3>
                <p className="text-gray-700">
                  Ja, det är möjligt att förlänga visum i Angola genom att kontakta 
                  immigrationsmyndigheten (SME) i Luanda innan ditt nuvarande visum går ut.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad kostar visum till Angola?</h3>
                <p className="text-gray-700">
                  Kostnaden varierar beroende på visumtyp och handläggningstid. 
                  Kontakta oss för en exakt offert baserad på dina behov.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#CE1126] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Behöver du visum till Angola?
            </h2>
            <p className="text-white/80 mb-8">
              Kontakta oss idag för personlig rådgivning och en offert. Vi hjälper dig genom hela visumprocessen.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/kontakt" className="bg-white hover:bg-gray-100 text-[#CE1126] font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
              </Link>
              <Link href="/legalisering/angola" className="border-2 border-white hover:bg-white hover:text-[#CE1126] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Behöver du legalisering?
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
    },
  };
};
