import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement, VisaProduct } from '@/firebase/visaRequirementsService';
import type { VisaCountryData } from '@/data/visaCountries';

interface VisaCountryPageProps {
  country: VisaCountryData;
  children?: React.ReactNode;
}

const translations = {
  sv: {
    visumTill: 'Visum till',
    bestall: 'Beställ',
    bestallVisum: 'Beställ visum till',
    kontaktOss: 'Kontakta oss för offert',
    typerAvVisum: 'Typer av visum till',
    klickaPa: 'Klicka på en visumtyp för att se dokumentkrav och priser.',
    laddarVisum: 'Laddar visumtyper...',
    turism: 'Turism',
    affarer: 'Affärer',
    ovrigt: 'Övrigt',
    dagar: 'dagar',
    multiplaInresor: 'Multipla inresor',
    dubbelInresa: '2 inresor',
    enkelInresa: '1 inresa',
    inklAmbassad: 'inkl. ambassadavgift',
    giltighet: 'Giltighet',
    maxVistelse: 'Max vistelse',
    inresor: 'Inresor',
    handlaggning: 'Handläggning',
    multipla: 'Multipla',
    dubbel: 'Dubbel',
    enkel: 'Enkel',
    dokumentSomKravs: 'Dokument som krävs',
    obligatoriskt: 'obligatoriskt',
    laddaNerFormular: 'Ladda ner formulär',
    ingaDokumentkrav: 'Inga specifika dokumentkrav angivna.',
    valjVisumtyp: 'Välj en visumtyp för att se detaljer',
    viktigInfo: 'Viktig information',
    laddaNerAnsokan: 'Ladda ner visumansökan (PDF)',
    popularaResmal: 'Populära resmål i',
    saFungerar: 'Så fungerar visumprocessen',
    kontaktuppgifter: 'Kontaktuppgifter',
    adress: 'Adress',
    oppettider: 'Öppettider',
    obs: 'Obs:',
    kontakta: 'Kontakta oss',
    vanligaFragor: 'Vanliga frågor om visum till',
    bestallVisumNu: 'Beställ visum nu',
    forNorska: 'För norska kunder:',
  },
  en: {
    visumTill: 'Visa for',
    bestall: 'Order',
    bestallVisum: 'Order visa for',
    kontaktOss: 'Contact us for a quote',
    typerAvVisum: 'Types of visa for',
    klickaPa: 'Click on a visa type to see document requirements and prices.',
    laddarVisum: 'Loading visa types...',
    turism: 'Tourism',
    affarer: 'Business',
    ovrigt: 'Other',
    dagar: 'days',
    multiplaInresor: 'Multiple entries',
    dubbelInresa: '2 entries',
    enkelInresa: '1 entry',
    inklAmbassad: 'incl. embassy fee',
    giltighet: 'Validity',
    maxVistelse: 'Max stay',
    inresor: 'Entries',
    handlaggning: 'Processing',
    multipla: 'Multiple',
    dubbel: 'Double',
    enkel: 'Single',
    dokumentSomKravs: 'Required documents',
    obligatoriskt: 'required',
    laddaNerFormular: 'Download form',
    ingaDokumentkrav: 'No specific document requirements listed.',
    valjVisumtyp: 'Select a visa type to see details',
    viktigInfo: 'Important information',
    laddaNerAnsokan: 'Download visa application form (PDF)',
    popularaResmal: 'Popular destinations in',
    saFungerar: 'How the visa process works',
    kontaktuppgifter: 'Contact details',
    adress: 'Address',
    oppettider: 'Opening hours',
    obs: 'Note:',
    kontakta: 'Contact us',
    vanligaFragor: 'Frequently asked questions about visa for',
    bestallVisumNu: 'Order visa now',
    forNorska: 'For Norwegian customers:',
  },
  nb: {
    visumTill: 'Visum til',
    bestall: 'Bestill',
    bestallVisum: 'Bestill visum til',
    kontaktOss: 'Kontakt oss for tilbud',
    typerAvVisum: 'Visumtyper til',
    klickaPa: 'Klikk på en visumtype for å se dokumentkrav og priser.',
    laddarVisum: 'Laster visumtyper...',
    turism: 'Turisme',
    affarer: 'Forretning',
    ovrigt: 'Annet',
    dagar: 'dager',
    multiplaInresor: 'Flere innreiser',
    dubbelInresa: '2 innreiser',
    enkelInresa: '1 innreise',
    inklAmbassad: 'inkl. ambassadeavgift',
    giltighet: 'Gyldighet',
    maxVistelse: 'Maks opphold',
    inresor: 'Innreiser',
    handlaggning: 'Behandlingstid',
    multipla: 'Flere',
    dubbel: 'Dobbel',
    enkel: 'Enkel',
    dokumentSomKravs: 'Dokumenter som kreves',
    obligatoriskt: 'obligatorisk',
    laddaNerFormular: 'Last ned skjema',
    ingaDokumentkrav: 'Ingen spesifikke dokumentkrav angitt.',
    valjVisumtyp: 'Velg en visumtype for å se detaljer',
    viktigInfo: 'Viktig informasjon',
    laddaNerAnsokan: 'Last ned visumsøknad (PDF)',
    popularaResmal: 'Populære reisemål i',
    saFungerar: 'Slik fungerer visumprosessen',
    kontaktuppgifter: 'Kontaktinformasjon',
    adress: 'Adresse',
    oppettider: 'Åpningstider',
    obs: 'Merk:',
    kontakta: 'Kontakt oss',
    vanligaFragor: 'Vanlige spørsmål om visum til',
    bestallVisumNu: 'Bestill visum nå',
    forNorska: 'For norske kunder:',
  },
};

export default function VisaCountryPage({ country, children }: VisaCountryPageProps) {
  const router = useRouter();
  const locale = router.locale || 'sv';
  const isNo = country.slug === 'angola-no';
  const lang = isNo ? 'nb' : (locale === 'en' ? 'en' : 'sv');
  const t = translations[lang as keyof typeof translations] || translations.sv;
  const isEn = lang === 'en';
  const enData = country.en;
  const countryName = (isEn && enData?.countryName) || country.countryName;
  const heroSubtitle = (isEn && enData?.heroSubtitle) || country.heroSubtitle;
  const heroDescription = (isEn && enData?.heroDescription) || country.heroDescription;
  const infoTitle = (isEn && enData?.infoTitle) || country.infoTitle;
  const infoTexts = (isEn && enData?.infoTexts) || country.infoTexts;
  const infoBoxData = country.infoBox ? {
    ...country.infoBox,
    title: (isEn && enData?.infoBox?.title) || country.infoBox.title,
    text: (isEn && enData?.infoBox?.text) || country.infoBox.text,
  } : null;
  const requiredDocuments = (isEn && enData?.requiredDocuments) || country.requiredDocuments;
  const destinations = (isEn && enData?.destinations) || country.destinations;
  const faqItems = (isEn && enData?.faq) || country.faq;
  const ctaTitle = (isEn && enData?.ctaTitle) || country.ctaTitle;
  const ctaDescription = (isEn && enData?.ctaDescription) || country.ctaDescription;
  const processSteps = (isEn && enData?.processSteps) || country.processSteps;
  const visumTypes = (isEn && enData?.visumTypes) || country.visumTypes;
  const visaFreeInfoData = country.visaFreeInfo ? {
    title: (isEn && enData?.visaFreeInfo?.title) || country.visaFreeInfo.title,
    text: (isEn && enData?.visaFreeInfo?.text) || country.visaFreeInfo.text,
  } : undefined;
  const embassyHelpTitle = (isEn && enData?.embassyInfo?.helpTitle) || country.embassyInfo?.helpTitle;
  const embassyHelpText = (isEn && enData?.embassyInfo?.helpText) || country.embassyInfo?.helpText;
  const embassyHelpItems = (isEn && enData?.embassyInfo?.helpItems) || country.embassyInfo?.helpItems;
  const embassyExtraNote = (isEn && enData?.embassyInfo?.extraNote) || country.embassyInfo?.extraNote;
  const [visaProducts, setVisaProducts] = useState<VisaProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement(country.countryCode);
        if (requirement?.visaProducts && requirement.visaProducts.length > 0) {
          const activeProducts = requirement.visaProducts.filter((p: VisaProduct) => p.isActive);
          setVisaProducts(activeProducts);
          if (activeProducts.length > 0) {
            setSelectedProductId(activeProducts[0].id);
          }
        }
      } catch {
        // Silent fail - use static fallback
      } finally {
        setLoading(false);
      }
    };
    fetchRequirements();
  }, [country.countryCode]);

  const selectedProduct = visaProducts.find(p => p.id === selectedProductId);
  const documentRequirements = selectedProduct?.documentRequirements?.filter((d: DocumentRequirement) => d.isActive) || [];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'tourist': return t.turism;
      case 'business': return t.affarer;
      case 'other': return t.ovrigt;
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

  const getGradientStyle = (twGradient: string): string => {
    const dirMap: Record<string, string> = {
      'to-br': 'to bottom right', 'to-bl': 'to bottom left',
      'to-tr': 'to top right', 'to-tl': 'to top left',
      'to-r': 'to right', 'to-l': 'to left',
      'to-t': 'to top', 'to-b': 'to bottom',
    };
    const dirMatch = twGradient.match(/gradient-(to-\w+)/);
    const dir = dirMatch ? (dirMap[dirMatch[1]] || 'to bottom right') : 'to bottom right';
    const fromMatch = twGradient.match(/from-\[([^\]]+)\]/);
    const viaMatch = twGradient.match(/via-\[([^\]]+)\]/);
    const toMatch = twGradient.match(/to-\[([^\]]+)\]/);
    const from = fromMatch?.[1] || '#1a1a2e';
    const via = viaMatch?.[1];
    const to = toMatch?.[1] || from;
    if (via) {
      return `linear-gradient(${dir}, ${from}, ${via}, ${to})`;
    }
    return `linear-gradient(${dir}, ${from}, ${to})`;
  };

  const c = country;
  const heroTextClass = c.heroTextColor || 'text-white';
  const isLightHero = heroTextClass.includes('gray-900');

  return (
    <>
      <Head>
        <title>{c.seo.title}</title>
        <meta name="description" content={c.seo.description} />
        <meta name="keywords" content={c.seo.keywords} />

        <meta property="og:title" content={c.seo.ogTitle} />
        <meta property="og:description" content={c.seo.ogDescription} />
        <meta property="og:url" content={`https://www.doxvl.se/visum/${c.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="DOX Visumpartner" />
        <meta property="og:image" content="https://www.doxvl.se/dox-logo-new.png" />
        {isNo && <meta property="og:locale" content="nb_NO" />}

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={c.seo.ogTitle} />
        <meta name="twitter:description" content={c.seo.ogDescription} />

        <link rel="canonical" href={`https://www.doxvl.se/visum/${c.slug}`} />
        <link rel="alternate" hrefLang="sv" href={`https://www.doxvl.se/visum/${c.slug}`} />
        <link rel="alternate" hrefLang="en" href={`https://www.doxvl.se/en/visum/${c.slug}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://www.doxvl.se/visum/${c.slug}`} />
        {isNo && (
          <>
            <link rel="alternate" hrefLang="sv" href="https://www.doxvl.se/visum/angola" />
            <link rel="alternate" hrefLang="nb" href="https://www.doxvl.se/visum/angola-no" />
          </>
        )}

        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": `Visum till ${c.countryName}`,
          "provider": {
            "@type": "Organization",
            "name": "DOX Visumpartner AB",
            "url": "https://www.doxvl.se",
            "logo": "https://www.doxvl.se/dox-logo-new.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Livdjursgatan 4",
              "addressLocality": "Johanneshov",
              "postalCode": "121 62",
              "addressCountry": "SE"
            },
            "telephone": "+46-8-409-419-00"
          },
          "description": c.seo.schemaDescription,
          "areaServed": isNo
            ? ["NO", "SE"]
            : { "@type": "Country", "name": "Sweden" },
          "serviceType": "Visa Application Service",
          ...(!isNo ? {
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "SEK",
              "lowPrice": c.seo.priceLow,
              "highPrice": c.seo.priceHigh,
              "offerCount": c.seo.offerCount
            }
          } : {})
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://www.doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Visum", "item": "https://www.doxvl.se/visum" },
            { "@type": "ListItem", "position": 3, "name": c.countryName, "item": `https://www.doxvl.se/visum/${c.slug}` }
          ]
        })}} />

        {/* FAQPage Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": c.faq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
          }))
        })}} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className={`${heroTextClass} py-16 md:py-24`} style={{ background: getGradientStyle(c.heroGradient) }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code={c.countryCode} size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  {t.visumTill} {countryName}
                </h1>
                <p className={`text-xl ${isLightHero ? 'text-gray-600' : 'text-white/80'}`}>{heroSubtitle}</p>
              </div>
            </div>
            <p className={`text-xl ${isLightHero ? 'text-gray-700' : 'text-white/90'} mb-8 max-w-2xl`}>
              {heroDescription}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/visum/bestall?destination=${c.countryCode}`}
                className="bg-white hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-colors"
                style={{ color: c.accentColor }}
              >
                {t.bestallVisum} {countryName}
              </Link>
              <Link
                href="/kontakt"
                className={`border-2 border-white hover:bg-white text-white font-semibold px-8 py-4 rounded-lg transition-colors`}
                style={{ ['--tw-hover-text' as string]: c.accentColor }}
              >
                {t.kontaktOss}
              </Link>
            </div>
          </div>
        </section>

        {/* Legalization Link Banner (Thailand) */}
        {c.legalizationLink && (
          <section className="py-4 text-white" style={{ backgroundColor: c.accentColor }}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <span>{c.legalizationLink.text}</span>
                </p>
                <Link href={c.legalizationLink.href} className="bg-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap" style={{ color: c.accentColor }}>
                  {c.legalizationLink.buttonText}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Visa Free Info (Thailand) */}
        {visaFreeInfoData && (
          <section className="py-8 bg-blue-50 border-y border-blue-200">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-start gap-4">
                <span className="text-3xl">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-blue-900">{visaFreeInfoData.title}</h3>
                  <p className="text-blue-800">{visaFreeInfoData.text}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Interactive Visa Products Section (India-style) */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {t.typerAvVisum} {countryName}
            </h2>
            <p className="text-gray-600 mb-8">
              {t.klickaPa}
            </p>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: c.accentColor }}></div>
                <p className="text-gray-500 mt-2">{t.laddarVisum}</p>
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
                          ? 'shadow-md'
                          : 'border-gray-200 bg-white hover:shadow-sm'
                      }`}
                      style={selectedProductId === product.id ? {
                        borderColor: c.accentColor,
                        backgroundColor: `${c.accentColor}10`,
                      } : undefined}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${getCategoryColor(product.category)}`}>
                            {getCategoryLabel(product.category)}
                          </span>
                          <h3 className="font-semibold text-gray-900">
                            {isEn ? (product.nameEn || product.name) : product.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{product.validityDays} {t.dagar}</span>
                            <span>•</span>
                            <span>{product.entryType === 'multiple' ? t.multiplaInresor : product.entryType === 'double' ? t.dubbelInresa : t.enkelInresa}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold" style={{ color: c.accentColor }}>{formatPrice(product.price)}</span>
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
                            {isEn ? (selectedProduct.nameEn || selectedProduct.name) : selectedProduct.name}
                          </h3>
                          {selectedProduct.description && (
                            <p className="text-gray-600 mt-1">
                              {isEn ? (selectedProduct.descriptionEn || selectedProduct.description) : selectedProduct.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold" style={{ color: c.accentColor }}>{formatPrice(selectedProduct.price)}</span>
                          <p className="text-xs text-gray-500">{t.inklAmbassad}</p>
                        </div>
                      </div>

                      {/* Product Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-4 border-y border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">{t.giltighet}</p>
                          <p className="font-semibold">{selectedProduct.validityDays} {t.dagar}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">{t.maxVistelse}</p>
                          <p className="font-semibold">{selectedProduct.stayDays} {t.dagar}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">{t.inresor}</p>
                          <p className="font-semibold">{selectedProduct.entryType === 'multiple' ? t.multipla : selectedProduct.entryType === 'double' ? t.dubbel : t.enkel}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">{t.handlaggning}</p>
                          <p className="font-semibold">{selectedProduct.processingDays} {t.dagar}</p>
                        </div>
                      </div>

                      {/* Document Requirements */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <svg className="w-5 h-5 mr-2" style={{ color: c.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {t.dokumentSomKravs}
                        </h4>
                        {documentRequirements.length > 0 ? (
                          <ul className="space-y-2">
                            {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                              <li key={doc.id} className="flex items-start bg-white p-3 rounded-lg border border-gray-100">
                                <span
                                  className={`mr-3 mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${doc.required ? 'text-white' : 'bg-gray-200 text-gray-600'}`}
                                  style={doc.required ? { backgroundColor: c.accentColor } : undefined}
                                >
                                  {doc.required ? '✓' : '○'}
                                </span>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">
                                    {isEn ? doc.nameEn : doc.name}
                                    {doc.required && <span className="ml-1 text-xs" style={{ color: c.accentColor }}>({t.obligatoriskt})</span>}
                                  </span>
                                  <p className="text-sm text-gray-500 mt-0.5">
                                    {isEn ? doc.descriptionEn : doc.description}
                                  </p>
                                  {doc.templateUrl && (
                                    <a href={doc.templateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                                      📎 {t.laddaNerFormular}
                                    </a>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 italic">{t.ingaDokumentkrav}</p>
                        )}
                      </div>

                      {/* CTA Button */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <Link
                          href={`/visum/bestall?destination=${c.countryCode}&product=${selectedProduct.id}`}
                          className="block w-full text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center hover:opacity-90"
                          style={{ backgroundColor: c.accentColor }}
                        >
                          {t.bestall} {isEn ? (selectedProduct.nameEn || selectedProduct.name) : selectedProduct.name}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
                      <p className="text-gray-500">{t.valjVisumtyp}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Fallback to static visa types if Firebase has no products */
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {visumTypes.map((visum) => (
                  <div key={visum.name} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg mb-2" style={{ color: c.accentColor }}>{visum.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{visum.duration}</p>
                    <p className="text-gray-700">{visum.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {infoTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {infoTexts.map((text, i) => (
                  <p key={i} className="text-gray-700 mb-4">{text}</p>
                ))}
                {infoBoxData && (
                  <div className={`${infoBoxData.color} border ${infoBoxData.borderColor} rounded-lg p-4 mt-4`}>
                    {infoBoxData.title && (
                      <h4 className={`font-semibold ${infoBoxData.titleColor || infoBoxData.textColor} mb-2`}>{infoBoxData.title}</h4>
                    )}
                    <p className={`${infoBoxData.textColor} text-sm`}>
                      {!infoBoxData.title && <strong>{'Obs! '}</strong>}
                      {infoBoxData.text}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: `${c.accentColor}10`, borderColor: `${c.accentColor}30` }}>
                <h3 className="font-semibold text-lg mb-4">
                  {t.viktigInfo}
                </h3>
                <ul className="space-y-3 text-gray-700">
                  {requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2" style={{ color: c.accentColor }}>✓</span>
                      {doc}
                    </li>
                  ))}
                </ul>

                {c.applicationFormUrl && (
                  <div className="mt-6 pt-4" style={{ borderTopColor: `${c.accentColor}30`, borderTopWidth: '1px' }}>
                    <a
                      href={c.applicationFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: c.accentColor }}
                    >
                      📄 {t.laddaNerAnsokan}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Extra children (e.g. Thailand pensionärsvisum section) */}
        {children}

        {/* Popular Destinations */}
        {c.destinations.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                {t.popularaResmal} {countryName}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {destinations.map((dest) => (
                  <div key={dest.name} className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2" style={{ color: c.accentColor }}>{dest.name}</h3>
                    <p className="text-gray-600 text-sm">{dest.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Process Section */}
        <section className={`py-16 ${c.destinations.length > 0 ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t.saFungerar}
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {processSteps.map((item) => (
                <div key={item.step} className={`${c.destinations.length > 0 ? 'bg-white shadow-sm' : 'bg-gray-50'} p-6 rounded-lg text-center`}>
                  <div className="w-12 h-12 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: c.accentColor }}>
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
        {c.embassyInfo && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                {c.embassyInfo.name}
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">
                    {t.kontaktuppgifter}
                  </h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-3">📍</span>
                      <div>
                        <strong>{t.adress}:</strong><br />
                        {c.embassyInfo.address}<br />
                        {c.embassyInfo.postalCode}
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-3">📞</span>
                      <div>
                        <strong>Telefon:</strong><br />
                        {c.embassyInfo.phone}
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-3">🕐</span>
                      <div>
                        <strong>{t.oppettider}:</strong><br />
                        {c.embassyInfo.openingHours}
                      </div>
                    </li>
                  </ul>
                  {embassyExtraNote && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>{isNo ? t.forNorska : t.obs}</strong> {embassyExtraNote}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-6 rounded-lg border" style={{ backgroundColor: `${c.accentColor}08`, borderColor: `${c.accentColor}33` }}>
                  <h3 className="font-semibold text-lg mb-4">{embassyHelpTitle}</h3>
                  <p className="text-gray-700 mb-4">{embassyHelpText}</p>
                  <ul className="space-y-2 text-gray-700 mb-6">
                    {(embassyHelpItems || []).map((item, i) => (
                      <li key={i} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/kontakt" className="block w-full text-white font-semibold py-3 rounded-lg transition-colors text-center" style={{ backgroundColor: c.accentColor }}>
                    {t.kontakta}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className={`py-16 ${c.embassyInfo ? 'bg-white' : c.destinations.length > 0 ? 'bg-white' : 'bg-gray-50'}`}>
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {t.vanligaFragor} {countryName}
            </h2>
            <div className="space-y-6">
              {faqItems.map((item, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                  <p className="text-gray-700">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-white" style={{ background: getGradientStyle(c.ctaGradient) }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {ctaTitle}
            </h2>
            <p className="text-white/90 mb-8">
              {ctaDescription}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/visum/bestall?destination=${c.countryCode}`}
                className="bg-white hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-colors"
                style={{ color: c.accentColor }}
              >
                {t.bestallVisumNu}
              </Link>
              <Link
                href="/kontakt"
                className="border-2 border-white hover:bg-white text-white font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                {t.kontakta}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
