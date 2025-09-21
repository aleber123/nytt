import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface ServiceSelectorProps {
  onSelect: (services: string[]) => void;
  initialServices?: string[];
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelect, initialServices = [] }) => {
  const { t } = useTranslation('common');
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServices);
  
  const services = [
    {
      id: 'apostille',
      title: t('services.apostille.title'),
      description: t('services.apostille.description'),
      icon: 'document-check',
      price: t('services.apostille.price'),
      timeframe: t('services.apostille.timeframe')
    },
    {
      id: 'notarisering',
      title: t('services.notarization.title'),
      description: t('services.notarization.description'),
      icon: 'seal',
      price: t('services.notarization.price'),
      timeframe: t('services.notarization.timeframe')
    },
    {
      id: 'ambassad',
      title: t('services.embassy.title'),
      description: t('services.embassy.description'),
      icon: 'building',
      price: t('services.embassy.price'),
      timeframe: t('services.embassy.timeframe')
    },
    {
      id: 'oversattning',
      title: t('services.translation.title'),
      description: t('services.translation.description'),
      icon: 'language',
      price: t('services.translation.price'),
      timeframe: t('services.translation.timeframe')
    },
    {
      id: 'utrikesdepartementet',
      title: 'Utrikesdepartementet',
      description: 'Legalisering av dokument hos Utrikesdepartementet för internationell användning',
      icon: 'government',
      price: '1500 kr - 3000 kr',
      timeframe: '3-5 arbetsdagar'
    }
  ];
  
  const toggleService = (serviceId: string) => {
    setSelectedServices(prevSelected => {
      if (prevSelected.includes(serviceId)) {
        return prevSelected.filter(id => id !== serviceId);
      } else {
        return [...prevSelected, serviceId];
      }
    });
  };
  
  const handleContinue = () => {
    if (selectedServices.length > 0) {
      onSelect(selectedServices);
    }
  };

  // Funktion för att rendera ikoner baserat på ikonnamn
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'document-check':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'seal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'building':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'language':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        );
      case 'government':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">{t('order.selectService')}</h2>
      <p className="text-gray-600 mb-8">Välj en eller flera tjänster för samma dokument</p>
      
      <div className="space-y-6">
        {services.map((service) => (
          <div
            key={service.id}
            className={`border rounded-lg p-6 transition-colors cursor-pointer ${
              selectedServices.includes(service.id) 
                ? 'bg-primary-50 border-primary-500' 
                : 'hover:bg-gray-50 hover:border-primary-300'
            }`}
            onClick={() => toggleService(service.id)}
            role="button"
            tabIndex={0}
            aria-label={`${t('accessibility.selectService')} ${service.title}`}
            aria-pressed={selectedServices.includes(service.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleService(service.id);
              }
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                {renderIcon(service.icon)}
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold">{service.title}</h3>
                <p className="text-gray-600 mt-1">{service.description}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="mr-4">
                    <span className="font-medium text-gray-900">{service.price}</span>
                  </span>
                  <span>
                    <span className="font-medium text-gray-900">{service.timeframe}</span>
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 mt-4 md:mt-0 md:ml-6">
                {selectedServices.includes(service.id) ? (
                  <div className="h-6 w-6 text-primary-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-6 w-6 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-between">
        <div>
          <span className="text-sm text-gray-500">
            {selectedServices.length === 0 
              ? 'Välj minst en tjänst för att fortsätta' 
              : `${selectedServices.length} tjänst(er) valda`}
          </span>
        </div>
        <button
          type="button"
          onClick={handleContinue}
          disabled={selectedServices.length === 0}
          className={`px-6 py-2 rounded-md font-medium ${
            selectedServices.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
};

export default ServiceSelector;
