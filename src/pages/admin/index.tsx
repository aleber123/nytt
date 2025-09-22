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
      color: 'bg-primary-600 hover:bg-primary-700',
      icon: 'building',
      badge: '10+ länder'
    },
    {
      title: 'Standardpriser',
      description: 'Konfigurera priser för grundläggande tjänster',
      href: '/admin/standard-services-prices',
      color: 'bg-primary-600 hover:bg-primary-700',
      icon: 'calculator',
      badge: '6 tjänster'
    },
    {
      title: 'Frakt & Leverans',
      description: 'Hantera fraktpriser och leveransalternativ',
      href: '/admin/shipping-services',
      color: 'bg-primary-600 hover:bg-primary-700',
      icon: 'truck',
      badge: '3 leverantörer'
    },
    {
      title: 'Beställningar',
      description: 'Se och hantera kundbeställningar',
      href: '/admin/orders',
      color: 'bg-primary-600 hover:bg-primary-700',
      badge: 'Alla ordrar',
      icon: 'clipboard-list'
    },
    {
      title: 'Fakturor',
      description: 'Se och hantera kundfakturor',
      href: '/admin/invoices',
      color: 'bg-primary-600 hover:bg-primary-700',
      badge: 'Alla fakturor',
      icon: 'receipt'
    }
  ];

  return (
    <ProtectedRoute>
      <Head>
        <title>Admin Panel - Legaliseringstjänst</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-primary-600 mb-2">10+</div>
              <div className="text-sm text-gray-600">Länder med ambassadpriser</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-primary-600 mb-2">6</div>
              <div className="text-sm text-gray-600">Olika tjänster</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-primary-600 mb-2">∞</div>
              <div className="text-sm text-gray-600">Möjliga priskombinationer</div>
            </div>
          </div>

          {/* Admin Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminPages.map((page, index) => (
              <Link key={index} href={page.href}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col">
                  <div className="flex items-start flex-1">
                    <div className="flex-shrink-0 mr-4">
                      {renderIcon(page.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {page.title}
                        </h3>
                        {page.badge && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
                            {page.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4 text-sm flex-1">
                        {page.description}
                      </p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-white ${page.color} transition-colors mt-auto`}>
                    Öppna →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Snabba åtgärder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => window.open('/admin/simple-embassy-prices', '_blank')}
                className="flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Uppdatera ambassadpriser
              </button>
              <button
                onClick={() => window.open('/priser', '_blank')}
                className="flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Förhandsgranska priser
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
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
                <h4 className="font-medium text-gray-800 mb-1">Beställningar</h4>
                <p className="text-gray-600">Se och hantera kundbeställningar</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Fakturor</h4>
                <p className="text-gray-600">Se och hantera kundfakturor, uppdatera status och ladda ner PDF</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Tips:</strong> Om Firebase inte fungerar används alltid standardpriser som fallback
              </p>
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
