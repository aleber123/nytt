import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  link: string;
  id: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, description, icon, link, id }) => {
  const { t } = useTranslation('common');
  return (
    <Link href={link} className="block group h-full">
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 group-hover:shadow-md group-hover:border-primary-200 flex flex-col h-full">
        <div className="mb-4 relative h-48 w-full overflow-hidden rounded-lg">
          <img 
            src={`/images/${id}.jpg`} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 flex-grow">{description}</p>
        <div className="mt-4 flex items-center text-primary-600 font-medium group-hover:text-primary-700">
          <span>{t('common.readMore')}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
