import React from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function AdminIndexPage() {
  const { signOut, hasPermission } = useAuth();
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
      case 'users':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

  const allAdminPages = [
    // Orders section - unified for both legalization and visa
    {
      title: 'All Orders',
      description: 'View and manage all orders (legalization & visa)',
      href: '/admin/orders',
      color: 'bg-blue-600 hover:bg-blue-700',
      badge: 'All orders',
      icon: 'clipboard-list',
      category: 'orders',
      permission: null, // visible to all roles (viewers get read-only)
    },
    {
      title: 'My Tasks',
      description: 'Your assigned orders, reminders and deadlines',
      href: '/admin/my-tasks',
      color: 'bg-primary-600 hover:bg-primary-700',
      badge: 'Personal',
      icon: 'clipboard-list',
      category: 'orders',
      permission: null, // visible to all roles
    },
    // Legalization section
    {
      title: 'Embassy Prices',
      description: 'Manage prices for embassy legalization per country',
      href: '/admin/simple-embassy-prices',
      color: 'bg-orange-500 hover:bg-orange-600',
      icon: 'building',
      badge: '10+ countries',
      category: 'legalization',
      permission: 'canManagePricing' as const,
    },
    {
      title: 'Standard Prices',
      description: 'Configure prices for legalization services (notarization, apostille, etc.)',
      href: '/admin/standard-services-prices',
      color: 'bg-orange-400 hover:bg-orange-500',
      icon: 'calculator',
      badge: '6 services',
      category: 'legalization',
      permission: 'canManagePricing' as const,
    },
    // Visa section
    {
      title: 'Visa Products & Pricing',
      description: 'Manage visa types (e-visa/sticker), products and prices per country',
      href: '/admin/visa-requirements',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      icon: 'building',
      badge: 'Products',
      category: 'visa',
      permission: 'canManageVisaRequirements' as const,
    },
    {
      title: 'Document Requirements',
      description: 'Manage required documents for each visa product',
      href: '/admin/visa-document-requirements',
      color: 'bg-emerald-400 hover:bg-emerald-500',
      icon: 'clipboard-list',
      badge: 'Checklist',
      category: 'visa',
      permission: 'canManageVisaRequirements' as const,
    },
    {
      title: 'Add-on Services',
      description: 'Manage add-on services for visa orders (photo, registration, etc.)',
      href: '/admin/visa-addons',
      color: 'bg-emerald-300 hover:bg-emerald-400',
      icon: 'receipt',
      badge: 'Addons',
      category: 'visa',
      permission: 'canManageVisaRequirements' as const,
    },
    {
      title: 'Form Templates',
      description: 'Configure data collection forms per visa type (fields, groups, rules)',
      href: '/admin/visa-form-templates',
      color: 'bg-purple-400 hover:bg-purple-500',
      icon: 'clipboard-list',
      badge: 'Forms',
      category: 'visa',
      permission: 'canManageVisaRequirements' as const,
    },
    {
      title: 'Photo Editor',
      description: 'Edit passport/visa photos — remove background, resize and print',
      href: '/admin/photo-editor',
      color: 'bg-pink-500 hover:bg-pink-600',
      icon: 'receipt',
      badge: 'Photos',
      category: 'visa',
      permission: 'canManageOrders' as const,
    },
    // Customers & Sales
    {
      title: 'Sales CRM',
      description: 'Track leads, follow-ups and sales pipeline',
      href: '/admin/crm',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      badge: 'Sales',
      icon: 'chart',
      category: 'customers',
      permission: 'canManageCustomers' as const,
    },
    {
      title: 'Customer Registry',
      description: 'Manage business customers, contacts and terms',
      href: '/admin/customers',
      color: 'bg-teal-600 hover:bg-teal-700',
      badge: 'CRM',
      icon: 'users',
      category: 'customers',
      permission: 'canManageCustomers' as const,
    },
    {
      title: 'Portal Customers',
      description: 'Manage customer portal accounts for enterprise clients',
      href: '/admin/portal-customers',
      color: 'bg-cyan-600 hover:bg-cyan-700',
      badge: 'Portal',
      icon: 'users',
      category: 'customers',
      permission: 'canManageCustomers' as const,
    },
    // Operations
    {
      title: 'Driver',
      description: 'Daily runs - drop off and pick up documents from authorities',
      href: '/admin/driver',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      icon: 'car',
      badge: 'Daily tasks',
      category: 'operations',
      permission: 'canManageOrders' as const,
    },
    {
      title: 'Shipping & Delivery',
      description: 'Manage shipping prices and delivery options',
      href: '/admin/shipping-services',
      color: 'bg-green-600 hover:bg-green-700',
      icon: 'truck',
      badge: '3 providers',
      category: 'operations',
      permission: 'canManageShipping' as const,
    },
    {
      title: 'Shipping Settings',
      description: 'Configure max prices for DHL bookings',
      href: '/admin/shipping-settings',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      badge: 'DHL',
      icon: 'truck',
      category: 'operations',
      permission: 'canManageShipping' as const,
    },
    {
      title: 'Profile',
      description: 'Update name and phone for your admin account',
      href: '/admin/profile',
      color: 'bg-gray-700 hover:bg-gray-800',
      badge: 'Account',
      icon: 'clipboard-list',
      category: 'operations',
      permission: null, // visible to all roles
    },
    {
      title: 'Security',
      description: 'Manage two-factor authentication (TOTP) for your account',
      href: '/admin/security',
      color: 'bg-gray-600 hover:bg-gray-700',
      badge: 'MFA',
      icon: 'clipboard-list',
      category: 'operations',
      permission: null, // visible to all roles
    },
    {
      title: 'Email Templates',
      description: 'View and edit all automated emails sent to customers — with process flow map',
      href: '/admin/email-templates',
      color: 'bg-pink-600 hover:bg-pink-700',
      badge: 'Mail',
      icon: 'receipt',
      category: 'operations',
      permission: 'canManageOrders' as const,
    },
    {
      title: 'GDPR Management',
      description: 'Manage data retention, anonymization and customer data requests',
      href: '/admin/gdpr',
      color: 'bg-slate-600 hover:bg-slate-700',
      badge: 'Privacy',
      icon: 'clipboard-list',
      category: 'operations',
      permission: 'canManageGdpr' as const,
    },
    {
      title: 'User Management',
      description: 'Manage admin users and their access levels',
      href: '/admin/users',
      color: 'bg-violet-600 hover:bg-violet-700',
      badge: 'Access',
      icon: 'users',
      category: 'operations',
      permission: 'canManageUsers' as const,
    },
    // Billing
    {
      title: 'Invoices',
      description: 'View and manage customer invoices',
      href: '/admin/invoices',
      color: 'bg-purple-600 hover:bg-purple-700',
      badge: 'All invoices',
      icon: 'receipt',
      category: 'billing',
      permission: 'canViewReports' as const,
    },
    {
      title: 'Statistics',
      description: 'Analyze sales and performance',
      href: '/admin/stats',
      color: 'bg-red-600 hover:bg-red-700',
      badge: 'Analytics',
      icon: 'calculator',
      category: 'analytics',
      permission: 'canViewReports' as const,
    }
  ];

  // Filter pages based on user permissions
  const adminPages = allAdminPages.filter(
    page => page.permission === null || hasPermission(page.permission)
  );

  // Group pages by category
  const categories = [
    { id: 'orders', title: '📋 Orders', pages: adminPages.filter(p => p.category === 'orders') },
    { id: 'legalization', title: '📜 Legalization Pricing', pages: adminPages.filter(p => p.category === 'legalization') },
    { id: 'visa', title: '🛂 Visa Configuration', pages: adminPages.filter(p => p.category === 'visa') },
    { id: 'customers', title: '👥 Customers', pages: adminPages.filter(p => p.category === 'customers') },
    { id: 'operations', title: '⚙️ Operations', pages: adminPages.filter(p => p.category === 'operations') },
    { id: 'billing', title: '💰 Billing & Analytics', pages: adminPages.filter(p => p.category === 'billing' || p.category === 'analytics') },
  ];

  return (
    <ProtectedRoute>
      <Head>
        <title>Admin Panel - Legalization Service</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900">
              Admin Panel
            </h1>
          </div>

          {/* Top actions (including Sign Out) */}
          <div className="flex justify-end mb-8">
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
            >
              Sign Out
            </button>
          </div>

          {/* Admin Pages Grid - Grouped by Category */}
          {categories.map((category) => (
            category.pages.length > 0 && (
              <div key={category.id} className="mb-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{category.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.pages.map((page, index) => (
                    <Link key={`${category.id}-${index}`} href={page.href}>
                      <div className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col ${
                        page.category === 'orders' ? 'border-blue-100 hover:border-blue-200' :
                        page.category === 'legalization' ? 'border-orange-100 hover:border-orange-200' :
                        page.category === 'visa' ? 'border-emerald-100 hover:border-emerald-200' :
                        page.category === 'operations' ? 'border-green-100 hover:border-green-200' :
                        page.category === 'billing' ? 'border-purple-100 hover:border-purple-200' :
                        page.category === 'customers' ? 'border-teal-100 hover:border-teal-200' :
                        page.category === 'analytics' ? 'border-red-100 hover:border-red-200' :
                        'border-gray-100 hover:border-gray-200'
                      }`}>
                        <div className="flex items-start flex-1">
                          <div className={`flex-shrink-0 mr-4 p-3 rounded-lg group-hover:opacity-80 transition-colors ${
                            page.category === 'orders' ? 'bg-blue-50' :
                            page.category === 'legalization' ? 'bg-orange-50' :
                            page.category === 'visa' ? 'bg-emerald-50' :
                            page.category === 'operations' ? 'bg-green-50' :
                            page.category === 'billing' ? 'bg-purple-50' :
                            page.category === 'customers' ? 'bg-teal-50' :
                            page.category === 'analytics' ? 'bg-red-50' :
                            'bg-gray-50'
                          }`}>
                            {renderIcon(page.icon)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className={`text-lg font-semibold text-gray-900 transition-colors ${
                                page.category === 'orders' ? 'group-hover:text-blue-700' :
                                page.category === 'legalization' ? 'group-hover:text-orange-700' :
                                page.category === 'visa' ? 'group-hover:text-emerald-700' :
                                page.category === 'operations' ? 'group-hover:text-green-700' :
                                page.category === 'customers' ? 'group-hover:text-teal-700' :
                                page.category === 'billing' ? 'group-hover:text-purple-700' :
                                page.category === 'analytics' ? 'group-hover:text-red-700' :
                                'group-hover:text-gray-700'
                              }`}>
                                {page.title}
                              </h3>
                              {page.badge && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  page.category === 'orders' ? 'bg-blue-100 text-blue-800' :
                                  page.category === 'legalization' ? 'bg-orange-100 text-orange-800' :
                                  page.category === 'visa' ? 'bg-emerald-100 text-emerald-800' :
                                  page.category === 'operations' ? 'bg-green-100 text-green-800' :
                                  page.category === 'customers' ? 'bg-teal-100 text-teal-800' :
                                  page.category === 'billing' ? 'bg-purple-100 text-purple-800' :
                                  page.category === 'analytics' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
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
                          Open →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          ))}

        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Admin pages always use English
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
};

export default AdminIndexPage;
