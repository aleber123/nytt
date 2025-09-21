import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Breadcrumbs from '../ui/Breadcrumbs';
import { useTranslation } from 'next-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation('common');
  
  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-primary-700 focus:text-white focus:z-50">
        {t('accessibility.skipToContent')}
      </a>
      
      <Header />
      
      <div className="container mx-auto px-4">
        <Breadcrumbs />
      </div>
      
      <div id="main-content" className="flex-grow">
        {children}
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;
