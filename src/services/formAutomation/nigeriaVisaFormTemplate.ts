/**
 * Nigeria e-Visa Form Template Definition
 *
 * Defines form fields collected from customers for Nigeria e-visa applications.
 * Based on the official form at https://evisa.immigration.gov.ng
 *
 * Fields map to the Nigeria e-visa form steps:
 * - Step 2: Biodata (personal + passport)
 * - Step 3: Travel Information
 * - Step 4: Contact/Hotel details in Nigeria
 * - Steps 5-7 are handled by the admin (document uploads, travel history, security)
 */

import { FormField, FormFieldGroup } from '../../firebase/visaFormService';

// ============================================================
// FIELD GROUPS
// ============================================================

export const NIGERIA_FIELD_GROUPS: FormFieldGroup[] = [
  {
    id: 'personal',
    label: 'Personuppgifter',
    labelEn: 'Personal Information',
    icon: 'user',
    sortOrder: 1,
  },
  {
    id: 'passport',
    label: 'Passuppgifter',
    labelEn: 'Passport Information',
    icon: 'id-card',
    sortOrder: 2,
  },
  {
    id: 'travel',
    label: 'Reseinformation',
    labelEn: 'Travel Information',
    icon: 'plane',
    sortOrder: 3,
  },
  {
    id: 'contact',
    label: 'Kontakt/Hotell i Nigeria',
    labelEn: 'Contact/Hotel in Nigeria',
    icon: 'phone',
    sortOrder: 4,
  },
];

// ============================================================
// FORM FIELDS — PERSONAL INFORMATION (Step 2: Biodata)
// ============================================================

const PERSONAL_FIELDS: FormField[] = [
  {
    id: 'title',
    label: 'Titel',
    labelEn: 'Title',
    type: 'select',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 1,
    options: [
      { value: 'Mr', label: 'Mr', labelEn: 'Mr' },
      { value: 'Mrs', label: 'Mrs', labelEn: 'Mrs' },
      { value: 'Miss', label: 'Miss', labelEn: 'Miss' },
      { value: 'Dr', label: 'Dr', labelEn: 'Dr' },
    ],
  },
  {
    id: 'lastName',
    label: 'Efternamn (som i passet)',
    labelEn: 'Surname (as in passport)',
    type: 'text',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 2,
    prefillFrom: 'travelers[i].lastName',
  },
  {
    id: 'firstName',
    label: 'Förnamn (som i passet)',
    labelEn: 'First Name (as in passport)',
    type: 'text',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 3,
    prefillFrom: 'travelers[i].firstName',
  },
  {
    id: 'middleName',
    label: 'Mellannamn',
    labelEn: 'Middle Name',
    type: 'text',
    required: false,
    group: 'personal',
    perTraveler: true,
    sortOrder: 4,
  },
  {
    id: 'dateOfBirth',
    label: 'Födelsedatum',
    labelEn: 'Date of Birth',
    type: 'date',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 5,
  },
  {
    id: 'placeOfBirth',
    label: 'Födelseort',
    labelEn: 'Place of Birth',
    type: 'text',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 6,
    placeholder: 'T.ex. Stockholm',
    placeholderEn: 'E.g. Stockholm',
  },
  {
    id: 'gender',
    label: 'Kön',
    labelEn: 'Gender',
    type: 'select',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 7,
    options: [
      { value: 'Male', label: 'Man', labelEn: 'Male' },
      { value: 'Female', label: 'Kvinna', labelEn: 'Female' },
    ],
  },
  {
    id: 'maritalStatus',
    label: 'Civilstånd',
    labelEn: 'Marital Status',
    type: 'select',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 8,
    options: [
      { value: 'Single', label: 'Ogift', labelEn: 'Single' },
      { value: 'Married', label: 'Gift', labelEn: 'Married' },
      { value: 'Divorced', label: 'Skild', labelEn: 'Divorced' },
      { value: 'Widowed', label: 'Änka/Änkling', labelEn: 'Widowed' },
    ],
  },
];

// ============================================================
// FORM FIELDS — PASSPORT INFORMATION (Step 2: Biodata)
// ============================================================

const PASSPORT_FIELDS: FormField[] = [
  {
    id: 'passportNumber',
    label: 'Passnummer',
    labelEn: 'Passport Number',
    type: 'text',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 10,
    prefillFrom: 'travelers[i].passportNumber',
  },
  {
    id: 'passportExpiryDate',
    label: 'Pass giltighetstid',
    labelEn: 'Passport Expiry Date',
    type: 'date',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 11,
    helpText: 'Passet måste vara giltigt minst 6 månader efter ankomst',
    helpTextEn: 'Passport must be valid for at least 6 months after arrival',
  },
];

// ============================================================
// FORM FIELDS — TRAVEL INFORMATION (Step 3)
// ============================================================

const TRAVEL_FIELDS: FormField[] = [
  {
    id: 'purposeOfJourney',
    label: 'Syfte med resan',
    labelEn: 'Purpose of Journey',
    type: 'text',
    required: true,
    group: 'travel',
    perTraveler: false,
    sortOrder: 20,
    placeholder: 'T.ex. Affärsmöte, Konferens',
    placeholderEn: 'E.g. Business meeting, Conference',
  },
  {
    id: 'travelCarrier',
    label: 'Flygbolag/transportör',
    labelEn: 'Travel Carrier (Airline)',
    type: 'text',
    required: false,
    group: 'travel',
    perTraveler: false,
    sortOrder: 21,
    placeholder: 'T.ex. Turkish Airlines',
    placeholderEn: 'E.g. Turkish Airlines',
  },
  {
    id: 'flightNumber',
    label: 'Flygnummer',
    labelEn: 'Flight Number',
    type: 'text',
    required: false,
    group: 'travel',
    perTraveler: false,
    sortOrder: 22,
    placeholder: 'T.ex. TK1793',
    placeholderEn: 'E.g. TK1793',
  },
  {
    id: 'departureDate',
    label: 'Avresedatum',
    labelEn: 'Date of Departure',
    type: 'date',
    required: true,
    group: 'travel',
    perTraveler: false,
    sortOrder: 23,
    prefillFrom: 'departureDate',
  },
  {
    id: 'arrivalDate',
    label: 'Ankomstdatum till Nigeria',
    labelEn: 'Date of Arrival in Nigeria',
    type: 'date',
    required: true,
    group: 'travel',
    perTraveler: false,
    sortOrder: 24,
  },
  {
    id: 'durationOfStay',
    label: 'Antal dagar i Nigeria',
    labelEn: 'Duration of Stay (days)',
    type: 'text',
    required: true,
    group: 'travel',
    perTraveler: false,
    sortOrder: 25,
    placeholder: 'T.ex. 14',
    placeholderEn: 'E.g. 14',
  },
  {
    id: 'portOfEntry',
    label: 'Ankomstflygplats',
    labelEn: 'Port of Entry',
    type: 'select',
    required: true,
    group: 'travel',
    perTraveler: false,
    sortOrder: 26,
    options: [
      { value: 'Murtala Mohammed Airport, Lagos', label: 'Murtala Mohammed Airport, Lagos', labelEn: 'Murtala Mohammed Airport, Lagos' },
      { value: 'Nnamdi Azikiwe International Airport, Abuja', label: 'Nnamdi Azikiwe International Airport, Abuja', labelEn: 'Nnamdi Azikiwe International Airport, Abuja' },
      { value: 'Mallam Aminu Kano Airport, Kano', label: 'Mallam Aminu Kano Airport, Kano', labelEn: 'Mallam Aminu Kano Airport, Kano' },
      { value: 'Margret Ekpo Airport, Calabar', label: 'Margret Ekpo Airport, Calabar', labelEn: 'Margret Ekpo Airport, Calabar' },
      { value: 'PortHarcourt International Airport, Rivers', label: 'Port Harcourt International Airport, Rivers', labelEn: 'Port Harcourt International Airport, Rivers' },
      { value: 'Akanu Ibiam International Airport, Enugu', label: 'Akanu Ibiam International Airport, Enugu', labelEn: 'Akanu Ibiam International Airport, Enugu' },
    ],
  },
];

// ============================================================
// FORM FIELDS — CONTACT/HOTEL IN NIGERIA (Step 4)
// ============================================================

const CONTACT_FIELDS: FormField[] = [
  {
    id: 'contactName',
    label: 'Kontaktperson/Hotellnamn i Nigeria',
    labelEn: 'Contact Name / Hotel Name in Nigeria',
    type: 'text',
    required: true,
    group: 'contact',
    perTraveler: false,
    sortOrder: 30,
  },
  {
    id: 'contactPhone',
    label: 'Telefonnummer i Nigeria',
    labelEn: 'Contact Phone Number in Nigeria',
    type: 'phone',
    required: true,
    group: 'contact',
    perTraveler: false,
    sortOrder: 31,
    placeholder: 'T.ex. 8012345678 (utan +234)',
    placeholderEn: 'E.g. 8012345678 (without +234)',
  },
  {
    id: 'contactAddress',
    label: 'Adress i Nigeria',
    labelEn: 'Address in Nigeria',
    type: 'textarea',
    required: true,
    group: 'contact',
    perTraveler: false,
    sortOrder: 32,
  },
  {
    id: 'contactCity',
    label: 'Stad',
    labelEn: 'City / Town',
    type: 'text',
    required: true,
    group: 'contact',
    perTraveler: false,
    sortOrder: 33,
  },
  {
    id: 'contactState',
    label: 'Delstat',
    labelEn: 'State',
    type: 'text',
    required: true,
    group: 'contact',
    perTraveler: false,
    sortOrder: 34,
    placeholder: 'T.ex. Lagos, Abuja',
    placeholderEn: 'E.g. Lagos, Abuja',
  },
  {
    id: 'contactEmail',
    label: 'E-post (kontakt i Nigeria)',
    labelEn: 'Contact Email',
    type: 'email',
    required: false,
    group: 'contact',
    perTraveler: false,
    sortOrder: 35,
  },
];

// ============================================================
// COMBINED TEMPLATE
// ============================================================

export const NIGERIA_EVISA_FIELDS: FormField[] = [
  ...PERSONAL_FIELDS,
  ...PASSPORT_FIELDS,
  ...TRAVEL_FIELDS,
  ...CONTACT_FIELDS,
];

/**
 * Full template object ready to be saved to Firestore via the admin UI
 * or programmatically via saveFormTemplate().
 */
export const NIGERIA_EVISA_TEMPLATE: Omit<import('../../firebase/visaFormService').VisaFormTemplate, 'createdAt' | 'updatedAt' | 'updatedBy'> = {
  id: 'nigeria-evisa',
  name: 'Nigeria e-Visa',
  nameEn: 'Nigeria e-Visa',
  countryCode: 'NG',
  visaCategory: 'all',
  visaProductId: 'all',
  groups: NIGERIA_FIELD_GROUPS,
  fields: NIGERIA_EVISA_FIELDS,
  enabled: true,
};
