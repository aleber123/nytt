import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement } from '@/firebase/visaRequirementsService';

export default function KenyaVisumPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement('KE');
        if (requirement?.visaProducts && requirement.visaProducts.length > 0) {
          const firstProduct = requirement.visaProducts[0];
          setSelectedProductName(locale === 'en' ? (firstProduct.nameEn || firstProduct.name) : firstProduct.name);
          if (firstProduct.documentRequirements) {
            setDocumentRequirements(firstProduct.documentRequirements.filter((d: DocumentRequirement) => d.isActive));
          }
        }
      } catch {
        // Silent fail
      }
    };
    fetchRequirements();
  }, [locale]);

  const visumTypes = [
    {
      name: 'E-Turistvisum',
      duration: '90 dagar',
      description: 'Elektroniskt visum för turism och safari'
    },
    {
      name: 'E-Affärsvisum',
      duration: '90 dagar',
      description: 'För affärsmöten och konferenser'
    },
    {
      name: 'Transitvisum',
      duration: '72 timmar',
      description: 'För genomresa till annat land'
    },
    {
      name: 'East Africa Visa',
      duration: '90 dagar',
      description: 'Giltigt i Kenya, Uganda och Rwanda'
    }
  ];

  const requiredDocuments = [
    'Giltigt pass (minst 6 månaders giltighet)',
    'Digital passkopia (skannad)',
    'Passfoto i digital form',
    'Bekräftad flygbokning',
    'Hotellbokning eller safari-bokning',
    'Gul febervaccinationsintyg (rekommenderas)'
  ];

  return (
    <>
      <Head>
        <title>Visum till Kenya - Ansök om kenyanskt e-visum | DOX Visumpartner</title>
        <meta name="description" content="Behöver du visum till Kenya? Vi hjälper dig med e-visum för safari och turism. Besök Masai Mara, Amboseli och Kenyas vackra stränder. Snabb handläggning online." />
        <meta name="keywords" content="Kenya visum, visum Kenya, kenyanskt visum, e-visum Kenya, turistvisum Kenya, safari visum, Masai Mara, Amboseli, Mombasa" />
        
        <meta property="og:title" content="Visum till Kenya - Ansök om kenyanskt e-visum | DOX Visumpartner" />
        <meta property="og:description" content="Vi hjälper dig med e-visum till Kenya för safari och turism. Besök Masai Mara och upplev Afrikas vilda djur." />
        <meta property="og:url" content="https://www.doxvl.se/visum/kenya" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://www.doxvl.se/visum/kenya" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visum till Kenya",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se"
          },
          "description": "E-visum och visumservice för Kenya. Vi hjälper dig med ansökan om turistvisum och affärsvisum till Kenya.",
          "areaServed": ["SE"],
          "serviceType": "Visa Application Service"
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-black via-[#BB0000] to-[#006600] text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="KE" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum till Kenya
                </h1>
                <p className="text-xl text-white/80">E-visum för safari och äventyr</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Upplev Afrikas mest spektakulära safari i Masai Mara, se den stora migrationen 
              eller slappa på Mombasas stränder. Vi hjälper dig med e-visum till Kenya.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/visum/bestall?destination=KE" className="bg-white hover:bg-gray-100 text-[#BB0000] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum till Kenya
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#006600] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss för offert
              </Link>
            </div>
          </div>
        </section>

        {/* Visum Types Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Typer av visum till Kenya
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visumTypes.map((visum) => (
                <div key={visum.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-[#BB0000] mb-2">{visum.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{visum.duration}</p>
                  <p className="text-gray-700">{visum.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* E-visa Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              E-visum till Kenya
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Kenya kräver visum för svenska medborgare. Sedan 2015 erbjuder Kenya 
                  elektroniskt visum (e-Visa) vilket gör ansökan enkel och smidig.
                </p>
                <p className="text-gray-700 mb-4">
                  E-visum är giltigt för inresa via alla internationella flygplatser och 
                  gränsövergångar, inklusive Jomo Kenyatta (Nairobi), Moi International 
                  (Mombasa) och Wilson Airport.
                </p>
                <p className="text-gray-700 mb-4">
                  Handläggningstiden är normalt 2-3 arbetsdagar. Vi rekommenderar att 
                  ansöka minst 1-2 veckor innan avresa.
                </p>
                
                {/* East Africa Visa Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-green-800 mb-2">East Africa Tourist Visa</h4>
                  <p className="text-green-700 text-sm">
                    Planerar du att besöka flera länder? East Africa Visa är giltigt i Kenya, 
                    Uganda och Rwanda i 90 dagar. Perfekt för en kombinerad safari!
                  </p>
                </div>
              </div>
              <div className="bg-[#BB0000]/10 p-6 rounded-lg border border-[#BB0000]/30">
                <h3 className="font-semibold text-lg mb-4">
                  {documentRequirements.length > 0 && selectedProductName
                    ? `Dokument som krävs för ${selectedProductName}:`
                    : 'Dokument som krävs för e-visum:'}
                </h3>
                {documentRequirements.length > 0 ? (
                  <ul className="space-y-3 text-gray-700">
                    {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                      <li key={doc.id} className="flex items-start">
                        <span className={`mr-2 flex-shrink-0 ${doc.required ? 'text-[#BB0000]' : 'text-gray-400'}`}>
                          {doc.required ? '✓' : '○'}
                        </span>
                        <div>
                          <span className="font-medium">
                            {locale === 'en' ? doc.nameEn : doc.name}
                            {doc.required && <span className="text-[#BB0000] ml-1">*</span>}
                          </span>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {locale === 'en' ? doc.descriptionEn : doc.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-gray-700">
                    {requiredDocuments.map((doc, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#BB0000] mr-2">✓</span>
                        {doc}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-500 mt-4">* = Obligatoriskt</p>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Populära resmål i Kenya
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Masai Mara', desc: 'Världsberömd nationalpark – upplev den stora migrationen och "Big Five".' },
                { name: 'Amboseli', desc: 'Spektakulär utsikt över Kilimanjaro och stora elefanthjordar.' },
                { name: 'Mombasa', desc: 'Historisk kuststad med vackra stränder och swahili-kultur.' },
                { name: 'Nairobi', desc: 'Huvudstaden med nationalpark, elefantbarnhem och giraff-center.' },
                { name: 'Lake Nakuru', desc: 'Känd för sina miljontals flamingos och noshörningar.' },
                { name: 'Diani Beach', desc: 'Prisbelönt strand med turkost vatten och vit sand.' },
              ].map((dest) => (
                <div key={dest.name} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg text-[#BB0000] mb-2">{dest.name}</h3>
                  <p className="text-gray-600 text-sm">{dest.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Så fungerar e-visumprocessen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Beställ online', desc: 'Fyll i vårt enkla formulär med dina uppgifter.' },
                { step: '2', title: 'Ladda upp dokument', desc: 'Skicka passkopia och foto digitalt.' },
                { step: '3', title: 'Vi ansöker', desc: 'Vi hanterar hela ansökan åt dig.' },
                { step: '4', title: 'E-visum klart', desc: 'Du får visumet via e-post inom 2-3 dagar.' },
              ].map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg text-center shadow-sm">
                  <div className="w-12 h-12 bg-[#BB0000] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor om visum till Kenya
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar det att få e-visum?</h3>
                <p className="text-gray-700">
                  E-visum handläggs normalt inom 2-3 arbetsdagar. Vi rekommenderar att ansöka 
                  minst 1-2 veckor innan avresa för att ha marginal.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Behöver jag gul febervaccination?</h3>
                <p className="text-gray-700">
                  Gul febervaccination rekommenderas starkt och kan krävas vid inresa, särskilt 
                  om du reser från eller via ett land där gula febern förekommer. Kontakta en 
                  vaccinationsmottagning för rådgivning.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Vad är East Africa Tourist Visa?</h3>
                <p className="text-gray-700">
                  East Africa Tourist Visa är ett gemensamt visum som är giltigt i Kenya, Uganda 
                  och Rwanda i 90 dagar. Det kostar lite mer men är perfekt om du planerar att 
                  besöka flera länder.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">När är bästa tiden för safari i Kenya?</h3>
                <p className="text-gray-700">
                  Den stora migrationen sker juli-oktober i Masai Mara. Torrperioderna 
                  (januari-februari och juni-oktober) är generellt bäst för safari då djuren 
                  samlas vid vattenhål.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-black via-[#BB0000] to-[#006600] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo för safari i Kenya?
            </h2>
            <p className="text-white/90 mb-8">
              Beställ ditt e-visum idag och börja planera ditt afrikanska äventyr. Vi gör processen enkel.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/visum/bestall?destination=KE" className="bg-white hover:bg-gray-100 text-[#BB0000] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#006600] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss
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
