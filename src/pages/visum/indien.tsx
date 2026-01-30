import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement, VisaProduct } from '@/firebase/visaRequirementsService';

export default function IndienVisumPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const locale = router.locale || 'sv';
  const [visaProducts, setVisaProducts] = useState<VisaProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement('IN');
        if (requirement?.visaProducts && requirement.visaProducts.length > 0) {
          const activeProducts = requirement.visaProducts.filter((p: VisaProduct) => p.isActive);
          setVisaProducts(activeProducts);
          if (activeProducts.length > 0) {
            setSelectedProductId(activeProducts[0].id);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchRequirements();
  }, []);

  const selectedProduct = visaProducts.find(p => p.id === selectedProductId);
  const documentRequirements = selectedProduct?.documentRequirements?.filter((d: DocumentRequirement) => d.isActive) || [];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'tourist': return 'Turism';
      case 'business': return 'Affärer';
      case 'other': return 'Övrigt';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tourist': return 'bg-green-100 text-green-800';
      case 'business': return 'bg-blue-100 text-blue-800';
      case 'other': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE').format(price) + ' kr';
  };

  return (
    <>
      <Head>
        <title>Visum till Indien - Ansök om indiskt e-visum | DOX Visumpartner</title>
        <meta name="description" content="Behöver du visum till Indien? Vi hjälper dig med e-visum och visumansökan till Indien. Turistvisum, affärsvisum och medicinskt visum. Snabb handläggning online." />
        <meta name="keywords" content="Indien visum, visum Indien, indiskt visum, e-visum Indien, turistvisum Indien, affärsvisum Indien, India visa, visumansökan Indien" />
        
        <meta property="og:title" content="Visum till Indien - Ansök om indiskt e-visum | DOX Visumpartner" />
        <meta property="og:description" content="Vi hjälper dig med e-visum och visumansökan till Indien. Turistvisum, affärsvisum och medicinskt visum med snabb handläggning." />
        <meta property="og:url" content="https://www.doxvl.se/visum/indien" />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href="https://www.doxvl.se/visum/indien" />
        
        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Visum till Indien",
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se",
            "logo": "https://www.doxvl.se/images/dox-logo.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Livdjursgatan 4",
              "addressLocality": "Johanneshov",
              "postalCode": "121 62",
              "addressCountry": "SE"
            },
            "telephone": "+46-8-409-419-00"
          },
          "description": "E-visum och visumservice för Indien. Vi hjälper dig med ansökan om turistvisum, affärsvisum och medicinskt visum till Indien.",
          "areaServed": {
            "@type": "Country",
            "name": "Sweden"
          },
          "serviceType": "Visa Application Service",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "SEK",
            "lowPrice": "995",
            "highPrice": "2995",
            "offerCount": "5"
          }
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Hem",
              "item": "https://www.doxvl.se"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Visum",
              "item": "https://www.doxvl.se/visum"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": "Indien",
              "item": "https://www.doxvl.se/visum/indien"
            }
          ]
        })}} />

        {/* FAQPage Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Hur lång tid tar det att få e-visum till Indien?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "E-visum handläggs normalt inom 2-4 arbetsdagar. Vi rekommenderar att ansöka minst en vecka innan avresa för att ha marginal."
              }
            },
            {
              "@type": "Question",
              "name": "Kan jag använda e-visum vid alla gränsövergångar?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "E-visum är giltigt vid 28 utvalda flygplatser och 5 hamnar i Indien. De flesta internationella flygplatser accepterar e-visum, inklusive Delhi, Mumbai, Bangalore, Chennai och Kolkata."
              }
            },
            {
              "@type": "Question",
              "name": "Hur länge är e-visum giltigt?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "E-turistvisum finns i varianter på 30 dagar (dubbel inresa) och 1 år/5 år (multipla inresor). E-affärsvisum är giltigt i 1 år med multipla inresor."
              }
            },
            {
              "@type": "Question",
              "name": "Behöver jag vaccinationer för Indien?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Inga vaccinationer är obligatoriska för svenska medborgare, men hepatit A och B, tyfoid och malariatabletter rekommenderas. Kontakta en vaccinationsmottagning för personlig rådgivning."
              }
            }
          ]
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#FF9933] via-white to-[#138808] text-gray-900 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code="IN" size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum till Indien
                </h1>
                <p className="text-xl text-gray-600">E-visum online – snabbt och enkelt</p>
              </div>
            </div>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl">
              Planerar du att resa till Indien? Vi hjälper dig med e-visum som gör ansökan 
              enkel och smidig. Få ditt visum godkänt inom några dagar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/visum/bestall?destination=IN" className="bg-[#FF9933] hover:bg-[#E88A2D] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum till Indien
              </Link>
              <Link href="/kontakt" className="border-2 border-[#138808] hover:bg-[#138808] hover:text-white text-[#138808] font-semibold px-8 py-4 rounded-lg transition-colors">
                Kontakta oss för offert
              </Link>
            </div>
          </div>
        </section>

        {/* Visum Types Section - Interactive */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Typer av e-visum till Indien
            </h2>
            <p className="text-gray-600 mb-8">
              Klicka på en visumtyp för att se dokumentkrav och priser.
            </p>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933] mx-auto"></div>
                <p className="text-gray-500 mt-2">Laddar visumtyper...</p>
              </div>
            ) : visaProducts.length > 0 ? (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Visa Product List */}
                <div className="lg:col-span-1 space-y-3">
                  {visaProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedProductId === product.id
                          ? 'border-[#FF9933] bg-[#FF9933]/10 shadow-md'
                          : 'border-gray-200 bg-white hover:border-[#FF9933]/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${getCategoryColor(product.category)}`}>
                            {getCategoryLabel(product.category)}
                          </span>
                          <h3 className="font-semibold text-gray-900">
                            {locale === 'en' ? (product.nameEn || product.name) : product.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{product.validityDays} dagar</span>
                            <span>•</span>
                            <span>{product.entryType === 'multiple' ? 'Multipla inresor' : product.entryType === 'double' ? '2 inresor' : '1 inresa'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#FF9933]">{formatPrice(product.price)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Product Details */}
                <div className="lg:col-span-2">
                  {selectedProduct ? (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 sticky top-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${getCategoryColor(selectedProduct.category)}`}>
                            {getCategoryLabel(selectedProduct.category)}
                          </span>
                          <h3 className="text-xl font-bold text-gray-900">
                            {locale === 'en' ? (selectedProduct.nameEn || selectedProduct.name) : selectedProduct.name}
                          </h3>
                          {selectedProduct.description && (
                            <p className="text-gray-600 mt-1">
                              {locale === 'en' ? (selectedProduct.descriptionEn || selectedProduct.description) : selectedProduct.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-[#FF9933]">{formatPrice(selectedProduct.price)}</span>
                          <p className="text-xs text-gray-500">inkl. ambassadavgift</p>
                        </div>
                      </div>

                      {/* Product Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-4 border-y border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Giltighet</p>
                          <p className="font-semibold">{selectedProduct.validityDays} dagar</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Max vistelse</p>
                          <p className="font-semibold">{selectedProduct.stayDays} dagar</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Inresor</p>
                          <p className="font-semibold">{selectedProduct.entryType === 'multiple' ? 'Multipla' : selectedProduct.entryType === 'double' ? 'Dubbel' : 'Enkel'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Handläggning</p>
                          <p className="font-semibold">{selectedProduct.processingDays} dagar</p>
                        </div>
                      </div>

                      {/* Document Requirements */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-[#FF9933]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Dokument som krävs
                        </h4>
                        {documentRequirements.length > 0 ? (
                          <ul className="space-y-2">
                            {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                              <li key={doc.id} className="flex items-start bg-white p-3 rounded-lg border border-gray-100">
                                <span className={`mr-3 mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${doc.required ? 'bg-[#FF9933] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                  {doc.required ? '✓' : '○'}
                                </span>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">
                                    {locale === 'en' ? doc.nameEn : doc.name}
                                    {doc.required && <span className="text-[#FF9933] ml-1 text-xs">(obligatoriskt)</span>}
                                  </span>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {locale === 'en' ? doc.descriptionEn : doc.description}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">Inga specifika dokumentkrav angivna.</p>
                        )}
                      </div>

                      {/* CTA Button */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <Link 
                          href={`/visum/bestall?destination=IN&product=${selectedProduct.id}`}
                          className="block w-full bg-[#FF9933] hover:bg-[#E88A2D] text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center"
                        >
                          Beställ {locale === 'en' ? (selectedProduct.nameEn || selectedProduct.name) : selectedProduct.name}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
                      <p className="text-gray-500">Välj en visumtyp för att se detaljer</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Kunde inte ladda visumtyper. Försök igen senare.
              </div>
            )}
          </div>
        </section>

        {/* E-visa Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Vad är e-visum till Indien?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  Indien erbjuder elektroniskt visum (e-Visa) för svenska medborgare. Detta gör 
                  visumprocessen betydligt enklare då du inte behöver skicka in ditt pass eller 
                  besöka ambassaden.
                </p>
                <p className="text-gray-700 mb-4">
                  E-visum är giltigt för inresa via utvalda flygplatser och hamnar i Indien, 
                  inklusive Delhi, Mumbai, Chennai, Kolkata, Bangalore och Goa.
                </p>
                <p className="text-gray-700 mb-4">
                  Det finns flera typer av e-visum: turistvisum (30 dagar, 1 år eller 5 år), 
                  affärsvisum, medicinskt visum och konferensvisum. Handläggningstiden är normalt 
                  2-4 arbetsdagar.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Tips:</strong> Ansök om e-visum minst 4 dagar innan avresa. 
                    E-visum kan ansökas tidigast 120 dagar innan planerad inresa.
                  </p>
                </div>
              </div>
              <div className="bg-[#FF9933]/10 p-6 rounded-lg border border-[#FF9933]/30">
                <h3 className="font-semibold text-lg mb-4">Viktigt om Indien e-visum</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2 mt-1">✓</span>
                    <span><strong>Foto:</strong> Måste vara 50x50mm (inte standard 35x45mm)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2 mt-1">✓</span>
                    <span><strong>Pass:</strong> Giltigt minst 6 månader, 2 tomma sidor</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2 mt-1">✓</span>
                    <span><strong>Inresa:</strong> Via 28 flygplatser och 5 hamnar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2 mt-1">✓</span>
                    <span><strong>Max vistelse:</strong> 90 dagar per besök (turistvisum)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#FF9933] mr-2 mt-1">✓</span>
                    <span><strong>Förlängning:</strong> E-visum kan inte förlängas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Så fungerar e-visumprocessen
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Beställ online', desc: 'Fyll i vårt enkla formulär med dina uppgifter.' },
                { step: '2', title: 'Ladda upp dokument', desc: 'Skicka passkopia och foto digitalt.' },
                { step: '3', title: 'Vi ansöker', desc: 'Vi hanterar hela ansökan åt dig.' },
                { step: '4', title: 'E-visum klart', desc: 'Du får visumet via e-post inom 2-4 dagar.' },
              ].map((item) => (
                <div key={item.step} className="bg-gray-50 p-6 rounded-lg text-center">
                  <div className="w-12 h-12 bg-[#FF9933] text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              Populära resmål i Indien
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { city: 'Delhi', desc: 'Huvudstaden med historiska monument som Röda fortet och Taj Mahal (Agra).' },
                { city: 'Mumbai', desc: 'Indiens finansiella centrum och Bollywoods hemstad.' },
                { city: 'Goa', desc: 'Populärt för stränder, nattliv och portugisisk arkitektur.' },
                { city: 'Jaipur', desc: 'Den rosa staden med magnifika palats och fort.' },
                { city: 'Kerala', desc: 'Känd för bakvatten, ayurveda och tropisk natur.' },
                { city: 'Varanasi', desc: 'En av världens äldsta städer vid heliga Ganges.' },
              ].map((dest) => (
                <div key={dest.city} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg text-[#FF9933] mb-2">{dest.city}</h3>
                  <p className="text-gray-600 text-sm">{dest.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              Vanliga frågor om visum till Indien
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur lång tid tar det att få e-visum till Indien?</h3>
                <p className="text-gray-700">
                  E-visum handläggs normalt inom 2-4 arbetsdagar. Vi rekommenderar att ansöka 
                  minst en vecka innan avresa för att ha marginal.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Kan jag använda e-visum vid alla gränsövergångar?</h3>
                <p className="text-gray-700">
                  E-visum är giltigt vid 28 utvalda flygplatser och 5 hamnar i Indien. 
                  De flesta internationella flygplatser accepterar e-visum, inklusive Delhi, 
                  Mumbai, Bangalore, Chennai och Kolkata.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Hur länge är e-visum giltigt?</h3>
                <p className="text-gray-700">
                  E-turistvisum finns i varianter på 30 dagar (dubbel inresa) och 1 år/5 år 
                  (multipla inresor). E-affärsvisum är giltigt i 1 år med multipla inresor.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Behöver jag vaccinationer för Indien?</h3>
                <p className="text-gray-700">
                  Inga vaccinationer är obligatoriska för svenska medborgare, men hepatit A och B, 
                  tyfoid och malariatabletter rekommenderas. Kontakta en vaccinationsmottagning 
                  för personlig rådgivning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-[#FF9933] to-[#138808] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Redo att ansöka om visum till Indien?
            </h2>
            <p className="text-white/90 mb-8">
              Beställ ditt e-visum idag och få det godkänt inom några dagar. Vi gör processen enkel och smidig.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/visum/bestall?destination=IN" className="bg-white hover:bg-gray-100 text-[#FF9933] font-semibold px-8 py-4 rounded-lg transition-colors">
                Beställ visum nu
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-[#138808] text-white font-semibold px-8 py-4 rounded-lg transition-colors">
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
