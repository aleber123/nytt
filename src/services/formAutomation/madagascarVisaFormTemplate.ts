/**
 * Madagascar Visa Form Template Definition
 *
 * Defines form fields collected from customers for Madagascar visa applications.
 * Based on the official e-visa form at the Madagascar visa portal.
 */

import { FormField, FormFieldGroup } from '../../firebase/visaFormService';

// ============================================================
// FIELD GROUPS
// ============================================================

export const MADAGASCAR_FIELD_GROUPS: FormFieldGroup[] = [
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
    label: 'Kontaktuppgifter',
    labelEn: 'Contact Information',
    icon: 'phone',
    sortOrder: 4,
  },
];

// ============================================================
// FORM FIELDS - PERSONAL INFORMATION
// ============================================================

const PERSONAL_FIELDS: FormField[] = [
  {
    id: 'lastName',
    label: 'Efternamn (som i passet)',
    labelEn: 'Last Name (as in passport)',
    type: 'text',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 1,
    prefillFrom: 'travelers[i].lastName',
  },
  {
    id: 'firstName',
    label: 'Förnamn (som i passet)',
    labelEn: 'First Name(s) (as in passport)',
    type: 'text',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 2,
    prefillFrom: 'travelers[i].firstName',
  },
  {
    id: 'dateOfBirth',
    label: 'Födelsedatum',
    labelEn: 'Date of Birth',
    type: 'date',
    required: true,
    group: 'personal',
    perTraveler: true,
    sortOrder: 3,
    prefillFrom: 'travelers[i].dateOfBirth',
  },
  {
    id: 'nativeCountry',
    label: 'Hemland (på franska)',
    labelEn: 'Native Country (in French)',
    type: 'text',
    required: true,
    helpText: 'Ange på franska, t.ex. "SUÈDE" för Sverige',
    helpTextEn: 'Enter in French, e.g. "SUÈDE" for Sweden',
    group: 'personal',
    perTraveler: true,
    sortOrder: 4,
  },
  {
    id: 'gender',
    label: 'Kön',
    labelEn: 'Gender',
    type: 'select',
    required: true,
    options: [
      { value: 'M', label: 'Man', labelEn: 'Male' },
      { value: 'F', label: 'Kvinna', labelEn: 'Female' },
    ],
    group: 'personal',
    perTraveler: true,
    sortOrder: 5,
  },
];

// ============================================================
// FORM FIELDS - PASSPORT
// ============================================================

const PASSPORT_FIELDS: FormField[] = [
  {
    id: 'passportType',
    label: 'Passtyp',
    labelEn: 'Type of Passport',
    type: 'select',
    required: true,
    options: [
      { value: 'O', label: 'Ordinärt', labelEn: 'Ordinary' },
      { value: 'D', label: 'Diplomatiskt', labelEn: 'Diplomatic' },
      { value: 'S', label: 'Tjänstepass', labelEn: 'Service' },
    ],
    group: 'passport',
    perTraveler: true,
    sortOrder: 10,
  },
  {
    id: 'passportIssuingCountry',
    label: 'Land som utfärdat passet (på franska)',
    labelEn: 'Country that issued the passport (in French)',
    type: 'text',
    required: true,
    helpText: 'Ange på franska, t.ex. "SUÈDE" för Sverige',
    helpTextEn: 'Enter in French, e.g. "SUÈDE" for Sweden',
    group: 'passport',
    perTraveler: true,
    sortOrder: 11,
  },
  {
    id: 'passportNumber',
    label: 'Passnummer',
    labelEn: 'Passport Number',
    type: 'text',
    required: true,
    helpText: 'Max 9 tecken, utan landskod',
    helpTextEn: 'Max 9 characters, without nation code',
    group: 'passport',
    perTraveler: true,
    sortOrder: 12,
    prefillFrom: 'travelers[i].passportNumber',
  },
  {
    id: 'passportNationality',
    label: 'Nationalitet enligt passet (på franska)',
    labelEn: 'Nationality indicated on passport (in French)',
    type: 'text',
    required: true,
    helpText: 'Ange på franska, t.ex. "SUÉDOIS" för svensk',
    helpTextEn: 'Enter in French, e.g. "SUÉDOIS" for Swedish',
    group: 'passport',
    perTraveler: true,
    sortOrder: 13,
  },
  {
    id: 'passportIssueDate',
    label: 'Passens utfärdandedatum',
    labelEn: 'Passport Issue Date',
    type: 'date',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 14,
  },
  {
    id: 'passportExpiryDate',
    label: 'Passens utgångsdatum',
    labelEn: 'Passport Expiry Date',
    type: 'date',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 15,
    prefillFrom: 'travelers[i].passportExpiry',
  },
];

// ============================================================
// FORM FIELDS - TRAVEL
// ============================================================

const TRAVEL_FIELDS: FormField[] = [
  {
    id: 'arrivalDate',
    label: 'Planerat ankomstdatum till Madagaskar',
    labelEn: 'Expected date of arrival in Madagascar',
    type: 'date',
    required: true,
    group: 'travel',
    perTraveler: false,
    sortOrder: 20,
  },
  {
    id: 'departureDate',
    label: 'Planerat avresedatum från Madagaskar',
    labelEn: 'Expected date of departure from Madagascar',
    type: 'date',
    required: true,
    group: 'travel',
    perTraveler: false,
    sortOrder: 21,
  },
  {
    id: 'pointOfEntry',
    label: 'Inresepunkt',
    labelEn: 'Point of Entry',
    type: 'select',
    required: true,
    options: [
      { value: 'TNR', label: 'Antananarivo', labelEn: 'Antananarivo' },
      { value: 'NOS', label: 'Nosy Be', labelEn: 'Nosy Be' },
      { value: 'DIE', label: 'Antsiranana', labelEn: 'Antsiranana' },
      { value: 'MJN', label: 'Mahajanga', labelEn: 'Mahajanga' },
      { value: 'SMS', label: 'Sainte Marie', labelEn: 'Sainte Marie' },
      { value: 'TMM', label: 'Toamasina', labelEn: 'Toamasina' },
      { value: 'TLE', label: 'Toliara', labelEn: 'Toliara' },
      { value: 'FTU', label: 'Taolagnaro', labelEn: 'Taolagnaro' },
    ],
    group: 'travel',
    perTraveler: false,
    sortOrder: 22,
  },
  {
    id: 'visaDuration',
    label: 'Visum önskas',
    labelEn: 'Visa Requested',
    type: 'select',
    required: true,
    options: [
      { value: '15', label: 'Turistvisum 15 dagar', labelEn: 'Tourist visa 15 days' },
      { value: '30', label: 'Turistvisum 30 dagar', labelEn: 'Tourist visa 30 days' },
      { value: '60', label: 'Turistvisum 60 dagar', labelEn: 'Tourist visa 60 days' },
      { value: '90', label: 'Turistvisum 90 dagar', labelEn: 'Tourist visa 90 days' },
    ],
    group: 'travel',
    perTraveler: false,
    sortOrder: 23,
  },
];

// ============================================================
// FORM FIELDS - CONTACT
// ============================================================

const CONTACT_FIELDS: FormField[] = [
  {
    id: 'phoneNumber',
    label: 'Telefonnummer',
    labelEn: 'Phone Number',
    type: 'phone',
    required: true,
    group: 'contact',
    perTraveler: false,
    sortOrder: 30,
    prefillFrom: 'customerInfo.phone',
  },
  {
    id: 'email',
    label: 'E-postadress',
    labelEn: 'Email',
    type: 'email',
    required: true,
    group: 'contact',
    perTraveler: false,
    sortOrder: 31,
    prefillFrom: 'customerInfo.email',
  },
];

// ============================================================
// COMBINED
// ============================================================

export const MADAGASCAR_FORM_FIELDS: FormField[] = [
  ...PERSONAL_FIELDS,
  ...PASSPORT_FIELDS,
  ...TRAVEL_FIELDS,
  ...CONTACT_FIELDS,
];

export function createMadagascarFormTemplate(): {
  name: string;
  nameEn: string;
  countryCode: string;
  visaCategory: string;
  visaProductId: string;
  groups: FormFieldGroup[];
  fields: FormField[];
} {
  return {
    name: 'Madagaskar turistvisum',
    nameEn: 'Madagascar Tourist Visa',
    countryCode: 'MG',
    visaCategory: 'tourist',
    visaProductId: 'all',
    groups: MADAGASCAR_FIELD_GROUPS,
    fields: MADAGASCAR_FORM_FIELDS,
  };
}
