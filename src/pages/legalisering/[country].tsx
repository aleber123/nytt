/**
 * Dynamic legalization country page
 *
 * Programmatically generates /legalisering/[country] for all countries in the
 * data file. Static .tsx pages (qatar.tsx, etc.) take priority in Next.js routing.
 */

import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CountryFlag from '@/components/ui/CountryFlag';
import LegaliseringCountrySEO from '@/components/SEO/LegaliseringCountrySEO';
import {
  getAllLegaliseringSlugs,
  getLegaliseringCountry,
  type LegaliseringCountry,
} from '@/data/legaliseringCountries';

interface Props {
  country: LegaliseringCountry;
}

export default function LegaliseringCountryPage({ country }: Props) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const isEn = locale === 'en';

  const name = isEn ? country.nameEn : country.name;
  const embassyName = isEn ? country.embassy.nameEn : country.embassy.name;
  const reasons = isEn ? country.reasonsEn : country.reasons;
  const docs = isEn ? country.documentsEn : country.documents;
  const faqItems = country.faq.map(f => ({
    question: isEn ? f.qEn : f.q,
    answer: isEn ? f.aEn : f.a,
  }));

  const processSteps = isEn
    ? country.apostille
      ? [
          { step: '1', title: 'Notary Public', desc: 'Private documents are notarized first.' },
          { step: '2', title: 'Apostille', desc: 'The document receives an apostille stamp.' },
          { step: '3', title: 'Delivery', desc: 'Documents are sent to you.' },
        ]
      : [
          { step: '1', title: 'Notary Public', desc: 'Private documents are notarized first.' },
          { step: '2', title: 'Ministry for Foreign Affairs', desc: 'MFA verifies the document.' },
          { step: '3', title: embassyName, desc: `Final legalization for ${name}.` },
          { step: '4', title: 'Delivery', desc: 'Documents are sent to you.' },
        ]
    : country.apostille
      ? [
          { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.' },
          { step: '2', title: 'Apostille', desc: 'Dokumentet får en apostillestämpel.' },
          { step: '3', title: 'Leverans', desc: 'Dokumenten skickas till dig.' },
        ]
      : [
          { step: '1', title: 'Notarius Publicus', desc: 'Privata dokument notariseras först.' },
          { step: '2', title: 'Utrikesdepartementet', desc: 'UD verifierar dokumentets äkthet.' },
          { step: '3', title: country.embassy.name, desc: `Slutlig legalisering för ${country.name}.` },
          { step: '4', title: 'Leverans', desc: 'Dokumenten skickas till dig.' },
        ];

  return (
    <>
      <LegaliseringCountrySEO
        countryName={country.name}
        countryNameEn={country.nameEn}
        countryCode={country.countryCode}
        slug={country.slug}
        title={`Legalisering för ${country.name} – ${country.embassy.name} | DOX Visumpartner`}
        titleEn={`Document Legalization for ${country.nameEn} – ${country.embassy.nameEn} | DOX Visumpartner`}
        description={`Vi hjälper dig med legalisering av dokument för ${country.name}. Komplett service inkl. notarisering, UD och ${country.embassy.name}. Fast pris, snabb hantering.`}
        descriptionEn={`We help you with document legalization for ${country.nameEn}. Complete service including notarization, MFA and ${country.embassy.nameEn}. Fixed prices, fast handling.`}
        keywords={`${country.name} legalisering, legalisering ${country.name}, ${country.embassy.name}, legalisera dokument ${country.name}, ambassadlegalisering ${country.name}, dokumentlegalisering, UD legalisering ${country.name}${country.apostille ? `, apostille ${country.name}` : ''}`}
        keywordsEn={`${country.nameEn} legalization, document legalization ${country.nameEn}, ${country.embassy.nameEn}, ${country.nameEn} document attestation${country.apostille ? `, apostille ${country.nameEn}` : ''}`}
        ogDescription={`Komplett legaliseringsservice för ${country.name}. Vi hanterar hela processen – notarisering, UD och ambassad.`}
        schemaDescription={`Professionell dokumentlegaliseringstjänst för ${country.name}. Komplett service inkl. notarisering, UD-verifiering och ${country.apostille ? 'apostille' : 'ambassadlegalisering'}.`}
        priceLow={country.priceLow}
        priceHigh={country.priceHigh}
        faqItems={faqItems}
      />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section
          className="text-white py-16 md:py-24"
          style={{ background: `linear-gradient(to bottom right, ${country.heroColor}, ${country.heroColorDark})` }}
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <CountryFlag code={country.countryCode} size={64} />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  {isEn ? `Document Legalization for ${name}` : `Legalisering för ${name}`}
                </h1>
                <p className="text-xl text-white/80">{embassyName}</p>
              </div>
            </div>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              {isEn
                ? `Need documents legalized for ${name}? We handle the complete process – from notarization to ${country.apostille ? 'apostille' : 'embassy stamp'}.`
                : `Ska du arbeta, studera eller göra affärer i ${name}? Vi hjälper dig med komplett legalisering av dina dokument – från notarisering till ${country.apostille ? 'apostille' : 'ambassadstämpel'}.`
              }
            </p>

            {country.apostille && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 mb-6">
                <span className="text-lg">✓</span>
                <span className="font-medium">
                  {isEn ? 'Hague Apostille Convention member' : 'Medlem i Haagkonventionen – apostille accepteras'}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-colors" style={{ color: country.heroColor }}>
                {isEn ? 'Order legalization' : 'Beställ legalisering'}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white text-white hover:text-gray-900 font-semibold px-8 py-4 rounded-lg transition-colors">
                {isEn ? 'Contact us' : 'Kontakta oss'}
              </Link>
            </div>
          </div>
        </section>

        {/* Why Section */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {isEn ? `Why is legalization needed for ${name}?` : `Varför behövs legalisering för ${name}?`}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                {reasons.map((r, i) => (
                  <p key={i} className="text-gray-700 mb-4">{r}</p>
                ))}
                <p className="text-gray-700">
                  {isEn
                    ? `We handle the entire process for you so you can focus on your plans in ${name}.`
                    : `Vi hanterar hela processen åt dig så att du kan fokusera på dina planer i ${name}.`
                  }
                </p>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: `${country.heroColor}08`, borderColor: `${country.heroColor}30` }}>
                <h3 className="font-semibold text-lg mb-4">
                  {isEn ? `Common documents for ${name}:` : `Vanliga dokument för ${name}:`}
                </h3>
                <ul className="space-y-2 text-gray-700">
                  {docs.map((d, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2" style={{ color: country.heroColor }}>✓</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {isEn ? `Legalization process for ${name}` : `Legaliseringsprocessen för ${name}`}
            </h2>
            <div className={`grid md:grid-cols-${processSteps.length} gap-6`}>
              {processSteps.map((item) => (
                <div key={item.step} className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div
                    className="w-12 h-12 text-white font-bold text-xl rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: country.heroColor }}
                  >
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
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              {embassyName}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">{isEn ? 'Contact details' : 'Kontaktuppgifter'}</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <strong>{isEn ? 'City' : 'Stad'}:</strong> {country.embassy.city}
                      {country.embassy.address && <><br />{country.embassy.address}</>}
                    </div>
                  </li>
                  {country.embassy.phone && (
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-3">📞</span>
                      <div><strong>{isEn ? 'Phone' : 'Telefon'}:</strong><br />{country.embassy.phone}</div>
                    </li>
                  )}
                  {country.embassy.email && (
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-3">✉️</span>
                      <div><strong>{isEn ? 'Email' : 'E-post'}:</strong><br />{country.embassy.email}</div>
                    </li>
                  )}
                  {country.embassy.website && (
                    <li className="flex items-start">
                      <span className="text-gray-400 mr-3">🌐</span>
                      <div><strong>{isEn ? 'Website' : 'Webbplats'}:</strong><br />
                        <a href={country.embassy.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{country.embassy.website}</a>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
              <div className="p-6 rounded-lg border" style={{ backgroundColor: `${country.heroColor}08`, borderColor: `${country.heroColor}30` }}>
                <h3 className="font-semibold text-lg mb-4">
                  {isEn ? 'Let us handle the contact' : 'Låt oss sköta kontakten'}
                </h3>
                <p className="text-gray-700 mb-4">
                  {isEn
                    ? "You don't need to visit the embassy yourself. We handle all contact and ensure your documents are correctly legalized."
                    : 'Du behöver inte besöka ambassaden själv. Vi hanterar all kontakt och ser till att dina dokument blir korrekt legaliserade.'
                  }
                </p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  {(isEn
                    ? ['We submit your documents', 'We collect them when ready', 'We send them to you']
                    : ['Vi lämnar in dina dokument', 'Vi hämtar ut dem när de är klara', 'Vi skickar dem till dig']
                  ).map((item, i) => (
                    <li key={i} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{isEn ? 'Processing time' : 'Handläggningstid'}:</span>
                    <span className="font-medium">{country.processingDays} {isEn ? 'working days' : 'arbetsdagar'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{isEn ? 'Price from' : 'Pris från'}:</span>
                    <span className="font-medium">{country.priceLow} SEK</span>
                  </div>
                </div>
                <Link
                  href="/bestall"
                  className="block w-full text-white font-semibold py-3 rounded-lg transition-colors text-center mt-6 hover:opacity-90"
                  style={{ backgroundColor: country.heroColor }}
                >
                  {isEn ? 'Order now' : 'Beställ nu'}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              {isEn ? `Frequently asked questions about legalization for ${name}` : `Vanliga frågor om legalisering för ${name}`}
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <details key={i} className="bg-white rounded-lg shadow-sm group">
                  <summary className="px-6 py-4 cursor-pointer font-medium text-gray-900 hover:text-blue-700 list-none flex items-center justify-between">
                    {faq.question}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-4 text-gray-700">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-white" style={{ backgroundColor: country.heroColor }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {isEn ? `Ready to legalize your documents for ${name}?` : `Redo att legalisera dina dokument för ${name}?`}
            </h2>
            <p className="text-white/80 mb-8">
              {isEn
                ? `We have helped hundreds of customers with legalization for ${name}. Order online or contact us for advice.`
                : `Vi har hjälpt hundratals kunder med legalisering för ${name}. Beställ online eller kontakta oss för rådgivning.`
              }
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/bestall" className="bg-white hover:bg-gray-100 font-semibold px-8 py-4 rounded-lg transition-colors" style={{ color: country.heroColor }}>
                {isEn ? 'Order legalization' : 'Beställ legalisering'}
              </Link>
              <Link href="/kontakt" className="border-2 border-white hover:bg-white hover:text-gray-900 text-white font-semibold px-8 py-4 rounded-lg transition-colors">
                {isEn ? 'Contact us' : 'Kontakta oss'}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllLegaliseringSlugs();
  const paths: { params: { country: string }; locale: string }[] = [];
  for (const slug of slugs) {
    paths.push({ params: { country: slug }, locale: 'sv' });
    paths.push({ params: { country: slug }, locale: 'en' });
  }
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params, locale }) => {
  const country = getLegaliseringCountry(params?.country as string);
  if (!country) return { notFound: true };

  return {
    props: {
      country,
      ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
    },
  };
};
