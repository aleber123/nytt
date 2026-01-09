import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Sample country data - in a real app, this would come from a database or API
const countries = [
  // Hague Convention countries (notarization + apostille)
  { 
    name: 'Albanien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Andorra', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Argentina', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Armenien', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Australien', 
    region: 'oceania',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Bahamas', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Belarus', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Belgien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Belize', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Bosnien Hercegovina', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Bulgarien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Brasilien', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Burkina Faso', 
    region: 'africa',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Chile', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Colombia', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Costa Rica', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Cypern', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Danmark', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Dominikanska Republiken', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Ecuador', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'El Salvador', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Estland', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Fiji', 
    region: 'oceania',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Finland', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Frankrike', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Gabon', 
    region: 'africa',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Georgien', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Grekland', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Guatemala', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Honduras', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Irland', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Island', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Israel', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Italien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Japan', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Kanada', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Kazakstan', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Kina', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Kroatien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Lettland', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Litauen', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Luxemburg', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Malta', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Marocko', 
    region: 'africa',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Mauritius', 
    region: 'africa',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Mexiko', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Moldavien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Monaco', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Montenegro', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Nederländerna', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Nicaragua', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Nordmakedonien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Norge', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Nya Zeeland', 
    region: 'oceania',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Panama', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Paraguay', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Peru', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Polen', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Portugal', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Republiken Korea', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Rumänien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Ryssland', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Saint Kitts and Nevis', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'San Marino', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Schweiz', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Serbien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Seychellerna', 
    region: 'africa',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Singapore', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Slovakien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Slovenien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Spanien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Sri Lanka', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Storbritannien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Sverige', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Sydafrika', 
    region: 'africa',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Thailand', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Tjeckien', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Trinidad och Tobago', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Turkiet', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Turkmenistan', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Tyskland', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Ukraina', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Ungern', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Uruguay', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'USA', 
    region: 'northAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents or certified copies required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney']
  },
  { 
    name: 'Uzbekistan', 
    region: 'asia',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Venezuela', 
    region: 'southAmerica',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Zimbabwe', 
    region: 'africa',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Österrike', 
    region: 'europe',
    isHagueConvention: true,
    process: 'Notarization + Apostille',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  
  // Non-Hague Convention countries (notarization + UD + embassy)
  { 
    name: 'Algeria', 
    region: 'africa',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney']
  },
  { 
    name: 'Angola', 
    region: 'africa',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Bangladesh', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Canada', 
    region: 'northAmerica',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney']
  },
  { 
    name: 'China', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney']
  },
  { 
    name: 'Egypt', 
    region: 'africa',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'India', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney']
  },
  { 
    name: 'Iran', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '14-21 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Iraq', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '14-21 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Jordan', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Kuwait', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Lebanon', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Malaysia', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Nigeria', 
    region: 'africa',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Pakistan', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Qatar', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Saudi Arabia', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '12-15 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney']
  },
  { 
    name: 'Sudan', 
    region: 'africa',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '14-21 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Syria', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '14-21 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'United Arab Emirates', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney']
  },
  { 
    name: 'Vietnam', 
    region: 'asia',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  },
  { 
    name: 'Djibouti', 
    region: 'africa',
    isHagueConvention: false,
    process: 'Notarization + UD + Embassy',
    services: ['notarization', 'ud', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents']
  }
];

export default function Countries() {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showHagueOnly, setShowHagueOnly] = useState(false);
  const [showNonHagueOnly, setShowNonHagueOnly] = useState(false);

  const regions = [
    { id: 'all', name: t('countries.allCountries') },
    { id: 'europe', name: t('countries.europe') },
    { id: 'asia', name: t('countries.asia') },
    { id: 'africa', name: t('countries.africa') },
    { id: 'northAmerica', name: t('countries.northAmerica') },
    { id: 'southAmerica', name: t('countries.southAmerica') },
    { id: 'oceania', name: t('countries.oceania') },
  ];

  const filteredCountries = countries.filter((country) => {
    const matchesSearch = country.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || country.region === selectedRegion;
    const matchesHagueFilter = 
      (!showHagueOnly && !showNonHagueOnly) || 
      (showHagueOnly && country.isHagueConvention) || 
      (showNonHagueOnly && !country.isHagueConvention);
    return matchesSearch && matchesRegion && matchesHagueFilter;
  });

  return (
    <>
      <Head>
        <title>{t('countries.title')} | Legaliseringstjänst</title>
        <meta name="description" content={t('countries.subtitle')} />
      </Head>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('countries.title')}
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              {t('countries.subtitle')}
            </p>
          </div>

          <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-4 lg:max-w-none">
            <div className="col-span-1">
              <div className="space-y-6">
                <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                      {t('countries.filterByRegion')}
                    </label>
                    <select
                      id="region"
                      name="region"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                    >
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                      {t('countries.search')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        id="search"
                        name="search"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder={t('countries.searchPlaceholder')}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700 mr-4">{t('countries.legalizationProcess')}:</span>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowHagueOnly(!showHagueOnly);
                        if (!showHagueOnly) setShowNonHagueOnly(false);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 border ${showHagueOnly ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-white border-gray-300 text-gray-700'} rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                    >
                      {t('countries.hagueConvention')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNonHagueOnly(!showNonHagueOnly);
                        if (!showNonHagueOnly) setShowHagueOnly(false);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 border ${showNonHagueOnly ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-white border-gray-300 text-gray-700'} rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                    >
                      {t('countries.nonHagueConvention')}
                    </button>
                    {(showHagueOnly || showNonHagueOnly) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowHagueOnly(false);
                          setShowNonHagueOnly(false);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {t('countries.clearFilters')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Regions filter */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('countries.filterByRegion')}</h3>
                  <div className="mt-2 space-y-2">
                    {regions.map((region) => (
                      <div key={region.id} className="flex items-center">
                        <input
                          id={`region-${region.id}`}
                          name="region"
                          type="radio"
                          checked={selectedRegion === region.id}
                          onChange={() => setSelectedRegion(region.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        />
                        <label htmlFor={`region-${region.id}`} className="ml-3 text-sm text-gray-600">
                          {region.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service types info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('countries.serviceTypes')}</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Apostille
                      </span>
                      <span className="ml-2 text-sm text-gray-500">{t('countries.apostilleCountries')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Embassy
                      </span>
                      <span className="ml-2 text-sm text-gray-500">{t('countries.embassyCountries')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCountries.map((country) => (
                  <div
                    key={country.name}
                    className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex flex-col space-y-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xl font-semibold text-gray-900">{country.name}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${country.isHagueConvention ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {country.isHagueConvention ? t('countries.hagueConvention') : t('countries.nonHagueConvention')}
                          </span>
                        </div>
                        
                        <div className="mt-2 mb-3">
                          <p className="text-sm font-medium text-gray-700">{t('countries.process')}:</p>
                          <p className="text-sm text-gray-900 font-semibold">{country.process}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {country.services.includes('notarization') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {t('services.notarization.title')}
                            </span>
                          )}
                          {country.services.includes('apostille') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t('services.apostille.title')}
                            </span>
                          )}
                          {country.services.includes('ud') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {t('services.ud.title')}
                            </span>
                          )}
                          {country.services.includes('embassy') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {t('services.embassy.title')}
                            </span>
                          )}
                          {country.services.includes('translation') && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {t('services.translation.title')}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500">{country.requirements}</p>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{t('countries.processingTime')}</p>
                          <p className="text-sm text-gray-900">{country.processingTime}</p>
                        </div>
                        <div>
                          <Link 
                            href={`/lander/${country.name.toLowerCase()}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-500"
                          >
                            {t('countries.learnMore')} <span aria-hidden="true">&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
