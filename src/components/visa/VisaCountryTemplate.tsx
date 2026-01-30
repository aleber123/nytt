/**
 * VisaCountryTemplate - Reusable template for visa country pages
 * 
 * This component provides a consistent layout and functionality for all visa country pages,
 * reducing code duplication and ensuring consistent UX across the site.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CountryFlag from '@/components/ui/CountryFlag';
import { getVisaRequirement, DocumentRequirement, VisaProduct } from '@/firebase/visaRequirementsService';

export interface VisaCountryConfig {
  countryCode: string;
  countryName: string;
  countryNameEn: string;
  slug: string;
  heroGradient: string;
  primaryColor: string;
  primaryColorHover: string;
  secondaryColor?: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
  };
  faq: Array<{
    question: string;
    answer: string;
  }>;
  priceRange: {
    low: number;
    high: number;
    offerCount: number;
  };
  infoSection?: {
    title: string;
    paragraphs: string[];
    tips?: string;
    highlights?: Array<{
      label: string;
      value: string;
    }>;
  };
}

interface VisaCountryTemplateProps {
  config: VisaCountryConfig;
}

// Utility functions
export const getCategoryLabel = (category: string, locale: string = 'sv') => {
  const labels: Record<string, Record<string, string>> = {
    tourist: { sv: 'Turism', en: 'Tourism' },
    business: { sv: 'Affärer', en: 'Business' },
    other: { sv: 'Övrigt', en: 'Other' },
  };
  return labels[category]?.[locale] || category;
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'tourist': return 'bg-green-100 text-green-800';
    case 'business': return 'bg-blue-100 text-blue-800';
    case 'other': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('sv-SE').format(price) + ' kr';
};

export default function VisaCountryTemplate({ config }: VisaCountryTemplateProps) {
  const router = useRouter();
  const locale = router.locale || 'sv';
  const [visaProducts, setVisaProducts] = useState<VisaProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const requirement = await getVisaRequirement(config.countryCode);
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
  }, [config.countryCode]);

  const selectedProduct = visaProducts.find(p => p.id === selectedProductId);
  const documentRequirements = selectedProduct?.documentRequirements?.filter((d: DocumentRequirement) => d.isActive) || [];

  const countryDisplayName = locale === 'en' ? config.countryNameEn : config.countryName;
  const canonicalUrl = `https://www.doxvl.se/visum/${config.slug}`;

  return (
    <>
      <Head>
        <title>{config.seo.title}</title>
        <meta name="description" content={config.seo.description} />
        <meta name="keywords" content={config.seo.keywords} />
        
        <meta property="og:title" content={config.seo.ogTitle} />
        <meta property="og:description" content={config.seo.ogDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Service Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": `Visum till ${config.countryName}`,
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
          "description": config.seo.description,
          "areaServed": { "@type": "Country", "name": "Sweden" },
          "serviceType": "Visa Application Service",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "SEK",
            "lowPrice": config.priceRange.low.toString(),
            "highPrice": config.priceRange.high.toString(),
            "offerCount": config.priceRange.offerCount.toString()
          }
        })}} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://www.doxvl.se" },
            { "@type": "ListItem", "position": 2, "name": "Visum", "item": "https://www.doxvl.se/visum" },
            { "@type": "ListItem", "position": 3, "name": config.countryName, "item": canonicalUrl }
          ]
        })}} />

        {/* FAQPage Schema */}
        {config.faq.length > 0 && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": config.faq.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })}} />
        )}
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className={`${config.heroGradient} text-gray-900 py-16 md:py-24`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code={config.countryCode} size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Visum till {countryDisplayName}
                </h1>
                <p className="text-xl text-gray-600">E-visum online – snabbt och enkelt</p>
              </div>
            </div>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl">
              Planerar du att resa till {countryDisplayName}? Vi hjälper dig med e-visum som gör ansökan 
              enkel och smidig. Få ditt visum godkänt inom några dagar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href={`/visum/bestall?destination=${config.countryCode}`} 
                className={`${config.primaryColor} hover:${config.primaryColorHover} text-white font-semibold px-8 py-4 rounded-lg transition-colors`}
                style={{ backgroundColor: config.primaryColor.replace('bg-[', '').replace(']', '') }}
              >
                Beställ visum till {countryDisplayName}
              </Link>
              <Link 
                href="/kontakt" 
                className={`border-2 hover:text-white font-semibold px-8 py-4 rounded-lg transition-colors`}
                style={{ 
                  borderColor: config.secondaryColor || config.primaryColor.replace('bg-[', '').replace(']', ''),
                  color: config.secondaryColor || config.primaryColor.replace('bg-[', '').replace(']', '')
                }}
              >
                Kontakta oss för offert
              </Link>
            </div>
          </div>
        </section>

        {/* Visa Types Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Typer av e-visum till {countryDisplayName}
            </h2>
            <p className="text-gray-600 mb-8">
              Klicka på en visumtyp för att se dokumentkrav och priser.
            </p>
            
            {loading ? (
              <div className="text-center py-8">
                <div 
                  className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                  style={{ borderColor: config.primaryColor.replace('bg-[', '').replace(']', '') }}
                ></div>
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
                          ? 'border-current bg-opacity-10 shadow-md'
                          : 'border-gray-200 bg-white hover:border-opacity-50 hover:shadow-sm'
                      }`}
                      style={selectedProductId === product.id ? { 
                        borderColor: config.primaryColor.replace('bg-[', '').replace(']', ''),
                        backgroundColor: `${config.primaryColor.replace('bg-[', '').replace(']', '')}10`
                      } : {}}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded mb-2 ${getCategoryColor(product.category)}`}>
                            {getCategoryLabel(product.category, locale)}
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
                          <span 
                            className="font-bold"
                            style={{ color: config.primaryColor.replace('bg-[', '').replace(']', '') }}
                          >
                            {formatPrice(product.price)}
                          </span>
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
                            {getCategoryLabel(selectedProduct.category, locale)}
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
                          <span 
                            className="text-2xl font-bold"
                            style={{ color: config.primaryColor.replace('bg-[', '').replace(']', '') }}
                          >
                            {formatPrice(selectedProduct.price)}
                          </span>
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
                          <svg className="w-5 h-5 mr-2" style={{ color: config.primaryColor.replace('bg-[', '').replace(']', '') }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Dokument som krävs
                        </h4>
                        {documentRequirements.length > 0 ? (
                          <ul className="space-y-2">
                            {documentRequirements.sort((a, b) => a.order - b.order).map((doc) => (
                              <li key={doc.id} className="flex items-start bg-white p-3 rounded-lg border border-gray-100">
                                <span 
                                  className={`mr-3 mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${doc.required ? 'text-white' : 'bg-gray-200 text-gray-600'}`}
                                  style={doc.required ? { backgroundColor: config.primaryColor.replace('bg-[', '').replace(']', '') } : {}}
                                >
                                  {doc.required ? '✓' : '○'}
                                </span>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">
                                    {locale === 'en' ? doc.nameEn : doc.name}
                                    {doc.required && (
                                      <span 
                                        className="ml-1 text-xs"
                                        style={{ color: config.primaryColor.replace('bg-[', '').replace(']', '') }}
                                      >
                                        (obligatoriskt)
                                      </span>
                                    )}
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
                          href={`/visum/bestall?destination=${config.countryCode}&product=${selectedProduct.id}`}
                          className="block w-full text-white font-semibold px-6 py-3 rounded-lg transition-colors text-center"
                          style={{ backgroundColor: config.primaryColor.replace('bg-[', '').replace(']', '') }}
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

        {/* Info Section */}
        {config.infoSection && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                {config.infoSection.title}
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  {config.infoSection.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-gray-700 mb-4">
                      {paragraph}
                    </p>
                  ))}
                  {config.infoSection.tips && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <p className="text-blue-800 text-sm">
                        <strong>Tips:</strong> {config.infoSection.tips}
                      </p>
                    </div>
                  )}
                </div>
                {config.infoSection.highlights && (
                  <div 
                    className="p-6 rounded-lg border"
                    style={{ 
                      backgroundColor: `${config.primaryColor.replace('bg-[', '').replace(']', '')}10`,
                      borderColor: `${config.primaryColor.replace('bg-[', '').replace(']', '')}30`
                    }}
                  >
                    <h3 className="font-semibold text-lg mb-4">Viktigt om visum till {countryDisplayName}</h3>
                    <ul className="space-y-3 text-gray-700">
                      {config.infoSection.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start">
                          <span 
                            className="mr-2 mt-1"
                            style={{ color: config.primaryColor.replace('bg-[', '').replace(']', '') }}
                          >
                            ✓
                          </span>
                          <span><strong>{highlight.label}:</strong> {highlight.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        {config.faq.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                Vanliga frågor om visum till {countryDisplayName}
              </h2>
              <div className="space-y-4">
                {config.faq.map((item, index) => (
                  <details key={index} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden group">
                    <summary className="p-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-100 transition-colors flex items-center justify-between">
                      {item.question}
                      <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 pt-0 text-gray-700 border-t border-gray-200">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section 
          className="py-16"
          style={{ backgroundColor: config.primaryColor.replace('bg-[', '').replace(']', '') }}
        >
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Redo att beställa visum till {countryDisplayName}?
            </h2>
            <p className="text-white/80 mb-8">
              Låt oss hjälpa dig med din visumansökan. Snabbt, enkelt och professionellt.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href={`/visum/bestall?destination=${config.countryCode}`}
                className="bg-white font-semibold px-8 py-4 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: config.primaryColor.replace('bg-[', '').replace(']', '') }}
              >
                Beställ visum nu
              </Link>
              <Link 
                href="/kontakt"
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg transition-colors hover:bg-white/10"
              >
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
