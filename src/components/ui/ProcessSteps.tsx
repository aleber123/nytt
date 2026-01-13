import React from 'react';
import Head from 'next/head';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface ProcessStepsProps {
  title: string;
  subtitle: string;
  steps: Step[];
}

const ProcessSteps: React.FC<ProcessStepsProps> = ({ title, subtitle, steps }) => {
  // HowTo Schema for AI/Search engines
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Hur du legaliserar dokument i Sverige",
    "description": "Steg-för-steg guide för att legalisera svenska dokument för internationellt bruk via DOX Visumpartner",
    "totalTime": "P5D",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "SEK",
      "value": "695"
    },
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.title,
      "text": step.description,
      "url": "https://www.doxvl.se/bestall"
    }))
  };
  // Funktion för att rendera ikoner baserat på ikonnamn
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'form':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'payment':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'document':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'delivery':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      </Head>
      <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold mb-4">{title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <ol className="relative">
            {steps.map((step, index) => (
              <li 
                key={step.id} 
                className={`flex items-start ${
                  index < steps.length - 1 ? 'pb-12' : ''
                }`}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute h-full left-8 top-8 transform -translate-x-1/2 border-l-2 border-primary-200"></div>
                )}
                
                {/* Step circle */}
                <div className="relative flex items-center justify-center flex-shrink-0 w-16 h-16 bg-primary-100 rounded-full text-primary-700 z-10">
                  <span className="sr-only">Steg {step.id}:</span>
                  {renderIcon(step.icon)}
                </div>
                
                {/* Step content */}
                <div className="ml-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
    </>
  );
};

export default ProcessSteps;
