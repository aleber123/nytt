import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface ServiceSelectorProps {
  onSelect: (services: string[]) => void;
  initialServices?: string[];
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelect, initialServices = [] }) => {
  const { t } = useTranslation('common');
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServices);
  
  // Tjänstdata
  const services = [
    {
      id: 'apostille',
      title: t('services.apostille.title'),
      description: t('services.apostille.description'),
      icon: 'document-check',
      price: t('services.apostille.price'),
      timeframe: t('services.apostille.timeframe')
    },
    // Andra tjänster...
  ];
  
  // Funktion för att växla tjänster
  const toggleService = (serviceId: string) => {
    setSelectedServices(prevSelected => {
      if (prevSelected.includes(serviceId)) {
        return prevSelected.filter(id => id !== serviceId);
      } else {
        return [...prevSelected, serviceId];
      }
    });
  };
  
  // Fortsätt-funktion
  const handleContinue = () => {
    if (selectedServices.length > 0) {
      onSelect(selectedServices);
    }
  };

  return (
    <div>
      <h2>Välj tjänster</h2>
      <p>Välj en eller flera tjänster för samma dokument</p>
      
      {/* Lista över tjänster med checkboxar */}
      <div>
        {services.map(service => (
          <div 
            key={service.id} 
            onClick={() => toggleService(service.id)}
            className={selectedServices.includes(service.id) ? 'selected' : ''}
          >
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            {/* Visuell indikator för val */}
            {selectedServices.includes(service.id) ? "✓" : "○"}
          </div>
        ))}
      </div>
      
      {/* Fortsätt-knapp */}
      <button 
        onClick={handleContinue} 
        disabled={selectedServices.length === 0}
      >
        Fortsätt
      </button>
    </div>
  );
};

export default ServiceSelector;