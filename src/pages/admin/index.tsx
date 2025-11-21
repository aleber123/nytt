import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function AdminIndexPage() {
  const renderIcon = (iconName: string) => {
    const iconClasses = "h-8 w-8 text-primary-600";

    switch (iconName) {
      case 'building':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'calculator':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'truck':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'car':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'clipboard-list':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'receipt':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const adminPages = [
    {
      title: 'Ambassadpriser',
      description: 'Hantera priser för ambassadlegalisering per land',
      href: '/admin/simple-embassy-prices',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: 'building',
      badge: '10+ länder',
      category: 'pricing'
    },
    {
      title: 'Standardpriser',
      description: 'Konfigurera priser för grundläggande tjänster',
      href: '/admin/standard-services-prices',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: 'calculator',
      badge: '6 tjänster',
      category: 'pricing'
    },
    {
      title: 'Frakt & Leverans',
      description: 'Hantera fraktpriser och leveransalternativ',
      href: '/admin/shipping-services',
      color: 'bg-green-600 hover:bg-green-700',
      icon: 'truck',
      badge: '3 leverantörer',
      category: 'operations'
    },
    {
      title: 'Chaufför',
      description: 'Dagliga körningar - lämna in och hämta dokument från myndigheter',
      href: '/admin/driver',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      icon: 'car',
      badge: 'Dagliga uppgifter',
      category: 'operations'
    },
    {
      title: 'Beställningar',
      description: 'Se och hantera kundbeställningar',
      href: '/admin/orders',
      color: 'bg-orange-600 hover:bg-orange-700',
      badge: 'Alla ordrar',
      icon: 'clipboard-list',
      category: 'orders'
    },
    {
      title: 'Fakturor',
      description: 'Se och hantera kundfakturor',
      href: '/admin/invoices',
      color: 'bg-purple-600 hover:bg-purple-700',
      badge: 'Alla fakturor',
      icon: 'receipt',
      category: 'billing'
    },
    {
      title: 'Profil',
      description: 'Uppdatera namn och telefon för ditt admin-konto',
      href: '/admin/profile',
      color: 'bg-gray-700 hover:bg-gray-800',
      badge: 'Konto',
      icon: 'clipboard-list',
      category: 'operations'
    },
    {
      title: 'Statistik',
      description: 'Analysera försäljning och prestation',
      href: '/admin/stats',
      color: 'bg-red-600 hover:bg-red-700',
      badge: 'Analytics',
      icon: 'calculator',
      category: 'analytics'
    }
  ];

  return (
    <ProtectedRoute>
      <Head>
        <title>Admin Panel - Legaliseringstjänst</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Admin Panel
            </h1>
            <p className="text-xl text-gray-600">
              Hantera priser, beställningar och allt annat för din legaliseringstjänst
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 text-center hover:shadow-lg hover:border-primary-200 transition-all duration-300">
              <div className="p-3 bg-primary-100 rounded-lg w-fit mx-auto mb-3">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">10+</div>
              <div className="text-sm text-gray-600">Länder med ambassadpriser</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 text-center hover:shadow-lg hover:border-primary-200 transition-all duration-300">
              <div className="p-3 bg-custom-button/10 rounded-lg w-fit mx-auto mb-3">
                <svg className="h-6 w-6 text-custom-button" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">6</div>
              <div className="text-sm text-gray-600">Olika tjänster</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-primary-100 p-6 text-center hover:shadow-lg hover:border-primary-200 transition-all duration-300">
              <div className="p-3 bg-secondary-100 rounded-lg w-fit mx-auto mb-3">
                <svg className="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-2">∞</div>
              <div className="text-sm text-gray-600">Möjliga priskombinationer</div>
            </div>
          </div>

          {/* Admin Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminPages.map((page, index) => (
              <Link key={index} href={page.href}>
                <div className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col ${
                  page.category === 'pricing' ? 'border-blue-100 hover:border-blue-200' :
                  page.category === 'operations' ? 'border-green-100 hover:border-green-200' :
                  page.category === 'orders' ? 'border-orange-100 hover:border-orange-200' :
                  page.category === 'billing' ? 'border-purple-100 hover:border-purple-200' :
                  'border-red-100 hover:border-red-200'
                }`}>
                  <div className="flex items-start flex-1">
                    <div className={`flex-shrink-0 mr-4 p-3 rounded-lg group-hover:opacity-80 transition-colors ${
                      page.category === 'pricing' ? 'bg-blue-50' :
                      page.category === 'operations' ? 'bg-green-50' :
                      page.category === 'orders' ? 'bg-orange-50' :
                      page.category === 'billing' ? 'bg-purple-50' :
                      'bg-red-50'
                    }`}>
                      {renderIcon(page.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-semibold text-gray-900 transition-colors ${
                          page.category === 'pricing' ? 'group-hover:text-blue-700' :
                          page.category === 'operations' ? 'group-hover:text-green-700' :
                          page.category === 'orders' ? 'group-hover:text-orange-700' :
                          page.category === 'billing' ? 'group-hover:text-purple-700' :
                          'group-hover:text-red-700'
                        }`}>
                          {page.title}
                        </h3>
                        {page.badge && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            page.category === 'pricing' ? 'bg-blue-100 text-blue-800' :
                            page.category === 'operations' ? 'bg-green-100 text-green-800' :
                            page.category === 'orders' ? 'bg-orange-100 text-orange-800' :
                            page.category === 'billing' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {page.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 text-sm flex-1">
                        {page.description}
                      </p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white ${page.color} transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 mt-auto`}>
                    Öppna →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-primary-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Snabba åtgärder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => window.open('/admin/simple-embassy-prices', '_blank')}
                className="flex items-center justify-center px-4 py-3 bg-custom-button hover:bg-custom-button/90 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Uppdatera ambassadpriser
              </button>
              <button
                onClick={() => window.open('/priser', '_blank')}
                className="flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Förhandsgranska priser
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Behöver du hjälp?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Ambassadpriser</h4>
                <p className="text-gray-600">Använd "Ambassadpriser" för att snabbt uppdatera priser per land</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Standardpriser</h4>
                <p className="text-gray-600">Använd när du vill spara priser permanent i systemet</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Frakt & Leverans</h4>
                <p className="text-gray-600">Hantera priser för PostNord, DHL och lokala budtjänster</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Chaufför</h4>
                <p className="text-gray-600">Se dagliga körningar och hantera inlämning/hämtning av dokument</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Beställningar</h4>
                <p className="text-gray-600">Se och hantera kundbeställningar</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Fakturor</h4>
                <p className="text-gray-600">Se och hantera kundfakturor, uppdatera status och ladda ner PDF</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl border border-blue-200">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                  <strong>Tips:</strong> Om Firebase inte fungerar används alltid standardpriser som fallback
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default AdminIndexPage;
