/**
 * ESTA Form Template Definition
 *
 * This file defines the form fields that will be displayed to customers
 * when filling out the ESTA (Electronic System for Travel Authorization) application.
 * Based on the official ESTA form at https://esta.cbp.dhs.gov
 */

import { FormField, FormFieldGroup } from '../../firebase/visaFormService';

// ============================================================
// FIELD GROUPS
// ============================================================

export const ESTA_FIELD_GROUPS: FormFieldGroup[] = [
  {
    id: 'passport',
    label: 'Pass- och personuppgifter',
    labelEn: 'Passport / Applicant Information',
    icon: 'id-card',
    sortOrder: 1,
  },
  {
    id: 'citizenship',
    label: 'Medborgarskap',
    labelEn: 'Citizenship',
    icon: 'globe',
    sortOrder: 2,
  },
  {
    id: 'contact',
    label: 'Kontaktuppgifter',
    labelEn: 'Contact Information',
    icon: 'phone',
    sortOrder: 3,
  },
  {
    id: 'socialMedia',
    label: 'Sociala medier',
    labelEn: 'Social Media',
    icon: 'share',
    sortOrder: 4,
  },
  {
    id: 'geNexus',
    label: 'GE/NEXUS/SENTRI',
    labelEn: 'GE/NEXUS/SENTRI Membership',
    icon: 'credit-card',
    sortOrder: 5,
  },
  {
    id: 'parents',
    label: 'Föräldrars uppgifter',
    labelEn: 'Parents',
    icon: 'users',
    sortOrder: 6,
  },
  {
    id: 'employment',
    label: 'Anställning',
    labelEn: 'Employment Information',
    icon: 'briefcase',
    sortOrder: 7,
  },
  {
    id: 'travel',
    label: 'Reseinformation',
    labelEn: 'Travel Information',
    icon: 'plane',
    sortOrder: 8,
  },
  {
    id: 'emergencyContact',
    label: 'Nödkontakt',
    labelEn: 'Emergency Contact',
    icon: 'alert-circle',
    sortOrder: 9,
  },
  {
    id: 'eligibility',
    label: 'Behörighetsfrågor',
    labelEn: 'Eligibility Questions',
    icon: 'shield',
    sortOrder: 10,
  },
];

// ============================================================
// FORM FIELDS - PASSPORT / APPLICANT INFORMATION
// ============================================================

const PASSPORT_FIELDS: FormField[] = [
  {
    id: 'familyName',
    label: 'Efternamn (som i passet)',
    labelEn: 'Family Name (as in passport)',
    type: 'text',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 1,
    prefillFrom: 'travelers[i].lastName',
  },
  {
    id: 'firstName',
    label: 'Förnamn (som i passet)',
    labelEn: 'First (Given) Name (as in passport)',
    type: 'text',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 2,
    prefillFrom: 'travelers[i].firstName',
  },
  {
    id: 'passportNumber',
    label: 'Passnummer',
    labelEn: 'Passport Number',
    type: 'text',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 3,
    prefillFrom: 'travelers[i].passportNumber',
  },
  {
    id: 'issuingCountry',
    label: 'Utfärdandeland',
    labelEn: 'Issuing Country',
    type: 'text',
    required: true,
    helpText: 'Landet som utfärdat ditt pass',
    helpTextEn: 'The country that issued your passport',
    group: 'passport',
    perTraveler: true,
    sortOrder: 4,
  },
  {
    id: 'passportIssuanceDate',
    label: 'Utfärdandedatum för pass',
    labelEn: 'Passport Issuance Date',
    type: 'date',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 5,
  },
  {
    id: 'passportExpirationDate',
    label: 'Passens utgångsdatum',
    labelEn: 'Passport Expiration Date',
    type: 'date',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 6,
    prefillFrom: 'travelers[i].passportExpiry',
  },
  {
    id: 'countryOfCitizenship',
    label: 'Medborgarskapsland',
    labelEn: 'Country of Citizenship / Nationality',
    type: 'text',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 7,
    prefillFrom: 'nationality',
  },
  {
    id: 'nationalIdNumber',
    label: 'Nationellt ID-nummer (personnummer)',
    labelEn: 'National Identification Number',
    type: 'personnummer',
    required: false,
    helpText: 'Svenskt personnummer eller motsvarande. Ange "UNKNOWN" om ej tillämpligt.',
    helpTextEn: 'Swedish personal number or equivalent. Enter "UNKNOWN" if not applicable.',
    group: 'passport',
    perTraveler: true,
    sortOrder: 8,
  },
  {
    id: 'personalIdNumber',
    label: 'Personligt ID-nummer',
    labelEn: 'Personal Identification Number',
    type: 'text',
    required: false,
    helpText: 'Om ditt land har ett separat personligt ID-nummer utöver personnummer. Ange "UNKNOWN" om ej tillämpligt.',
    helpTextEn: 'If your country has a separate personal ID number. Enter "UNKNOWN" if not applicable.',
    group: 'passport',
    perTraveler: true,
    sortOrder: 9,
  },
  {
    id: 'sex',
    label: 'Kön',
    labelEn: 'Sex',
    type: 'select',
    required: true,
    options: [
      { value: 'M', label: 'Man', labelEn: 'Male' },
      { value: 'F', label: 'Kvinna', labelEn: 'Female' },
    ],
    group: 'passport',
    perTraveler: true,
    sortOrder: 10,
  },
  {
    id: 'dateOfBirth',
    label: 'Födelsedatum',
    labelEn: 'Date of Birth',
    type: 'date',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 11,
    prefillFrom: 'travelers[i].dateOfBirth',
  },
  {
    id: 'cityOfBirth',
    label: 'Födelseort',
    labelEn: 'City of Birth',
    type: 'text',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 12,
  },
  {
    id: 'countryOfBirth',
    label: 'Födelseland',
    labelEn: 'Country of Birth',
    type: 'text',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 13,
  },
  {
    id: 'email',
    label: 'E-postadress',
    labelEn: 'E-mail Address',
    type: 'email',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 14,
    prefillFrom: 'customerInfo.email',
  },
  {
    id: 'emailConfirm',
    label: 'Bekräfta e-postadress',
    labelEn: 'Confirm E-mail Address',
    type: 'email',
    required: true,
    group: 'passport',
    perTraveler: true,
    sortOrder: 15,
  },
];

// ============================================================
// FORM FIELDS - CITIZENSHIP
// ============================================================

const CITIZENSHIP_FIELDS: FormField[] = [
  {
    id: 'isCurrentCitizenOtherCountry',
    label: 'Är du för närvarande medborgare i något annat land?',
    labelEn: 'Are you now a citizen or national of any other country?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'citizenship',
    perTraveler: true,
    sortOrder: 20,
  },
  {
    id: 'currentOtherCitizenshipCountry',
    label: 'Vilket annat land är du medborgare i?',
    labelEn: 'Which other country are you a citizen of?',
    type: 'text',
    required: false,
    helpText: 'Fyll i om du svarat ja ovan',
    helpTextEn: 'Fill in if you answered yes above',
    group: 'citizenship',
    perTraveler: true,
    sortOrder: 21,
  },
  {
    id: 'wasPreviousCitizenOtherCountry',
    label: 'Har du någonsin varit medborgare i något annat land?',
    labelEn: 'Have you ever been a citizen or national of any other country?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'citizenship',
    perTraveler: true,
    sortOrder: 22,
  },
  {
    id: 'previousOtherCitizenshipCountry',
    label: 'Vilket annat land var du medborgare i?',
    labelEn: 'Which other country were you a citizen of?',
    type: 'text',
    required: false,
    helpText: 'Fyll i om du svarat ja ovan',
    helpTextEn: 'Fill in if you answered yes above',
    group: 'citizenship',
    perTraveler: true,
    sortOrder: 23,
  },
  {
    id: 'hasOtherPassport',
    label: 'Har du någonsin fått pass eller nationellt ID-kort för resor utfärdat av något annat land?',
    labelEn: 'Have you ever been issued a passport or national identity card for travel by any other country?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'citizenship',
    perTraveler: true,
    sortOrder: 24,
  },
  {
    id: 'otherPassportCountry',
    label: 'Vilket land utfärdade det andra passet?',
    labelEn: 'Which country issued the other passport?',
    type: 'text',
    required: false,
    group: 'citizenship',
    perTraveler: true,
    sortOrder: 25,
  },
  {
    id: 'otherPassportNumber',
    label: 'Passnummer för det andra passet',
    labelEn: 'Passport number of the other passport',
    type: 'text',
    required: false,
    group: 'citizenship',
    perTraveler: true,
    sortOrder: 26,
  },
];

// ============================================================
// FORM FIELDS - CONTACT INFORMATION
// ============================================================

const CONTACT_FIELDS: FormField[] = [
  {
    id: 'addressLine1',
    label: 'Gatuadress rad 1',
    labelEn: 'Address Line 1',
    type: 'text',
    required: true,
    group: 'contact',
    perTraveler: true,
    sortOrder: 30,
  },
  {
    id: 'addressLine2',
    label: 'Gatuadress rad 2',
    labelEn: 'Address Line 2',
    type: 'text',
    required: false,
    group: 'contact',
    perTraveler: true,
    sortOrder: 31,
  },
  {
    id: 'apartmentNumber',
    label: 'Lägenhetsnummer',
    labelEn: 'Apartment Number',
    type: 'text',
    required: false,
    group: 'contact',
    perTraveler: true,
    sortOrder: 32,
  },
  {
    id: 'city',
    label: 'Stad',
    labelEn: 'City',
    type: 'text',
    required: true,
    group: 'contact',
    perTraveler: true,
    sortOrder: 33,
  },
  {
    id: 'stateProvinceRegion',
    label: 'Län/Region',
    labelEn: 'State/Province/Region',
    type: 'text',
    required: false,
    group: 'contact',
    perTraveler: true,
    sortOrder: 34,
  },
  {
    id: 'country',
    label: 'Land',
    labelEn: 'Country',
    type: 'text',
    required: true,
    group: 'contact',
    perTraveler: true,
    sortOrder: 35,
  },
  {
    id: 'phoneType',
    label: 'Typ av telefonnummer',
    labelEn: 'Telephone Type',
    type: 'select',
    required: true,
    options: [
      { value: 'HOME', label: 'Hem', labelEn: 'Home' },
      { value: 'MOBILE', label: 'Mobil', labelEn: 'Mobile' },
      { value: 'WORK', label: 'Arbete', labelEn: 'Work' },
    ],
    group: 'contact',
    perTraveler: true,
    sortOrder: 36,
  },
  {
    id: 'phoneCountryCode',
    label: 'Landskod telefon',
    labelEn: 'Phone Country Code',
    type: 'text',
    required: true,
    placeholder: '+46',
    placeholderEn: '+46',
    group: 'contact',
    perTraveler: true,
    sortOrder: 37,
  },
  {
    id: 'phoneNumber',
    label: 'Telefonnummer',
    labelEn: 'Phone Number',
    type: 'phone',
    required: true,
    group: 'contact',
    perTraveler: true,
    sortOrder: 38,
    prefillFrom: 'customerInfo.phone',
  },
];

// ============================================================
// FORM FIELDS - SOCIAL MEDIA (Optional)
// ============================================================

const SOCIAL_MEDIA_FIELDS: FormField[] = [
  {
    id: 'facebookPageId',
    label: 'Facebook sida/profil-ID',
    labelEn: 'Facebook Page ID',
    type: 'text',
    required: false,
    helpText: 'Valfritt – ditt Facebook-användarnamn eller profil-ID',
    helpTextEn: 'Optional – your Facebook username or profile ID',
    group: 'socialMedia',
    perTraveler: true,
    sortOrder: 40,
  },
  {
    id: 'linkedinProfileLink',
    label: 'LinkedIn profillänk',
    labelEn: 'LinkedIn Profile Link',
    type: 'text',
    required: false,
    group: 'socialMedia',
    perTraveler: true,
    sortOrder: 41,
  },
  {
    id: 'twitterUserId',
    label: 'Twitter/X användar-ID',
    labelEn: 'Twitter User ID',
    type: 'text',
    required: false,
    group: 'socialMedia',
    perTraveler: true,
    sortOrder: 42,
  },
  {
    id: 'instagramUserId',
    label: 'Instagram användar-ID',
    labelEn: 'Instagram User ID',
    type: 'text',
    required: false,
    group: 'socialMedia',
    perTraveler: true,
    sortOrder: 43,
  },
  {
    id: 'noOnlinePresence',
    label: 'Jag har ingen närvaro online',
    labelEn: 'I do not have an online presence',
    type: 'checkbox',
    required: false,
    group: 'socialMedia',
    perTraveler: true,
    sortOrder: 44,
  },
];

// ============================================================
// FORM FIELDS - GE/NEXUS/SENTRI
// ============================================================

const GE_NEXUS_FIELDS: FormField[] = [
  {
    id: 'isGeMember',
    label: 'Är du medlem i CBP Global Entry/NEXUS/SENTRI?',
    labelEn: 'Are you a member of the CBP Global Entry/NEXUS/SENTRI Program?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'geNexus',
    perTraveler: true,
    sortOrder: 50,
  },
  {
    id: 'geMembershipNumber',
    label: 'Medlemsnummer (PASSID)',
    labelEn: 'Membership Number (PASSID)',
    type: 'text',
    required: false,
    helpText: 'Fyll i om du svarat ja ovan',
    helpTextEn: 'Fill in if you answered yes above',
    group: 'geNexus',
    perTraveler: true,
    sortOrder: 51,
  },
];

// ============================================================
// FORM FIELDS - PARENTS
// ============================================================

const PARENTS_FIELDS: FormField[] = [
  {
    id: 'parent1FamilyName',
    label: 'Förälder 1 – Efternamn',
    labelEn: 'Parent 1 – Family Name',
    type: 'text',
    required: true,
    helpText: 'Alla sökande måste fylla i detta avsnitt',
    helpTextEn: 'All applicants are required to fill out this section',
    group: 'parents',
    perTraveler: true,
    sortOrder: 60,
  },
  {
    id: 'parent1FirstName',
    label: 'Förälder 1 – Förnamn',
    labelEn: 'Parent 1 – First (Given) Name',
    type: 'text',
    required: true,
    group: 'parents',
    perTraveler: true,
    sortOrder: 61,
  },
  {
    id: 'parent2FamilyName',
    label: 'Förälder 2 – Efternamn',
    labelEn: 'Parent 2 – Family Name',
    type: 'text',
    required: true,
    group: 'parents',
    perTraveler: true,
    sortOrder: 62,
  },
  {
    id: 'parent2FirstName',
    label: 'Förälder 2 – Förnamn',
    labelEn: 'Parent 2 – First (Given) Name',
    type: 'text',
    required: true,
    group: 'parents',
    perTraveler: true,
    sortOrder: 63,
  },
];

// ============================================================
// FORM FIELDS - EMPLOYMENT INFORMATION
// ============================================================

const EMPLOYMENT_FIELDS: FormField[] = [
  {
    id: 'hasEmployer',
    label: 'Har du en nuvarande eller tidigare arbetsgivare?',
    labelEn: 'Do you have a current or previous employer?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'employment',
    perTraveler: true,
    sortOrder: 70,
  },
  {
    id: 'employerName',
    label: 'Arbetsgivare/företagsnamn',
    labelEn: 'Employer/Company Name',
    type: 'text',
    required: false,
    helpText: 'Fyll i om du svarat ja ovan',
    helpTextEn: 'Fill in if you answered yes above',
    group: 'employment',
    perTraveler: true,
    sortOrder: 71,
  },
  {
    id: 'employerTitle',
    label: 'Titel/befattning',
    labelEn: 'Job Title',
    type: 'text',
    required: false,
    group: 'employment',
    perTraveler: true,
    sortOrder: 72,
  },
  {
    id: 'employerAddressLine1',
    label: 'Arbetsgivarens adress rad 1',
    labelEn: 'Employer Address Line 1',
    type: 'text',
    required: false,
    group: 'employment',
    perTraveler: true,
    sortOrder: 73,
  },
  {
    id: 'employerCity',
    label: 'Arbetsgivarens stad',
    labelEn: 'Employer City',
    type: 'text',
    required: false,
    group: 'employment',
    perTraveler: true,
    sortOrder: 74,
  },
  {
    id: 'employerCountry',
    label: 'Arbetsgivarens land',
    labelEn: 'Employer Country',
    type: 'text',
    required: false,
    group: 'employment',
    perTraveler: true,
    sortOrder: 75,
  },
  {
    id: 'employerPhoneCountryCode',
    label: 'Arbetsgivarens landskod telefon',
    labelEn: 'Employer Phone Country Code',
    type: 'text',
    required: false,
    placeholder: '+46',
    placeholderEn: '+46',
    group: 'employment',
    perTraveler: true,
    sortOrder: 76,
  },
  {
    id: 'employerPhoneNumber',
    label: 'Arbetsgivarens telefonnummer',
    labelEn: 'Employer Phone Number',
    type: 'text',
    required: false,
    group: 'employment',
    perTraveler: true,
    sortOrder: 77,
  },
];

// ============================================================
// FORM FIELDS - TRAVEL INFORMATION
// ============================================================

const TRAVEL_FIELDS: FormField[] = [
  {
    id: 'isInTransit',
    label: 'Reser du genom USA på väg till ett annat land?',
    labelEn: 'Is your travel to the US occurring in transit to another country?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'travel',
    perTraveler: false,
    sortOrder: 80,
  },
];

// ============================================================
// FORM FIELDS - EMERGENCY CONTACT
// ============================================================

const EMERGENCY_CONTACT_FIELDS: FormField[] = [
  {
    id: 'emergencyFamilyName',
    label: 'Nödkontakt – Efternamn',
    labelEn: 'Emergency Contact – Family Name',
    type: 'text',
    required: true,
    helpText: 'Kontaktperson i eller utanför USA vid nödsituation',
    helpTextEn: 'Contact person in or outside the US in case of emergency',
    group: 'emergencyContact',
    perTraveler: true,
    sortOrder: 90,
  },
  {
    id: 'emergencyFirstName',
    label: 'Nödkontakt – Förnamn',
    labelEn: 'Emergency Contact – First (Given) Name',
    type: 'text',
    required: true,
    group: 'emergencyContact',
    perTraveler: true,
    sortOrder: 91,
  },
  {
    id: 'emergencyEmail',
    label: 'Nödkontakt – E-postadress',
    labelEn: 'Emergency Contact – E-mail Address',
    type: 'email',
    required: false,
    group: 'emergencyContact',
    perTraveler: true,
    sortOrder: 92,
  },
  {
    id: 'emergencyPhoneCountryCode',
    label: 'Nödkontakt – Landskod telefon',
    labelEn: 'Emergency Contact – Phone Country Code',
    type: 'text',
    required: true,
    placeholder: '+46',
    placeholderEn: '+46',
    group: 'emergencyContact',
    perTraveler: true,
    sortOrder: 93,
  },
  {
    id: 'emergencyPhoneNumber',
    label: 'Nödkontakt – Telefonnummer',
    labelEn: 'Emergency Contact – Phone Number',
    type: 'phone',
    required: true,
    group: 'emergencyContact',
    perTraveler: true,
    sortOrder: 94,
  },
];

// ============================================================
// FORM FIELDS - ELIGIBILITY QUESTIONS
// ============================================================

const ELIGIBILITY_FIELDS: FormField[] = [
  {
    id: 'eligibility1Disease',
    label: '1) Har du en fysisk eller psykisk sjukdom, eller är du drogmissbrukare, eller har du någon av följande sjukdomar: kolera, difteri, tuberkulos, pest, smittkoppor, gula febern, virala hemorragiska febrar, svåra luftvägssjukdomar?',
    labelEn: '1) Do you have a physical or mental disorder; or are you a drug abuser or addict; or do you currently have any communicable diseases (cholera, diphtheria, tuberculosis, plague, smallpox, yellow fever, viral hemorrhagic fevers, severe acute respiratory illnesses)?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 100,
  },
  {
    id: 'eligibility2Arrested',
    label: '2) Har du någonsin blivit gripen eller dömd för ett brott som resulterade i allvarlig skada på egendom, person eller myndighet?',
    labelEn: '2) Have you ever been arrested or convicted for a crime that resulted in serious damage to property, or serious harm to another person or government authority?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 101,
  },
  {
    id: 'eligibility3Drugs',
    label: '3) Har du någonsin brutit mot lagar relaterade till innehav, användning eller distribution av illegala droger?',
    labelEn: '3) Have you ever violated any law related to possessing, using, or distributing illegal drugs?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 102,
  },
  {
    id: 'eligibility4Terrorism',
    label: '4) Söker du delta i, eller har du någonsin deltagit i, terroristverksamhet, spionage, sabotage eller folkmord?',
    labelEn: '4) Do you seek to engage in or have you ever engaged in terrorist activities, espionage, sabotage, or genocide?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 103,
  },
  {
    id: 'eligibility5Fraud',
    label: '5) Har du någonsin begått bedrägeri eller lämnat felaktiga uppgifter för att få visum eller inresa till USA?',
    labelEn: '5) Have you ever committed fraud or misrepresented yourself or others to obtain, or assist others to obtain, a visa or entry into the United States?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 104,
  },
  {
    id: 'eligibility6Employment',
    label: '6) Söker du arbete i USA, eller har du tidigare arbetat i USA utan tillstånd?',
    labelEn: '6) Are you currently seeking employment in the United States or were you previously employed in the United States without prior permission from the U.S. government?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 105,
  },
  {
    id: 'eligibility7Denied',
    label: '7) Har du någonsin nekats visum till USA, eller nekats inresa vid en amerikansk gränsövergång?',
    labelEn: '7) Have you ever been denied a U.S. visa or been refused admission to the United States or withdrawn your application for admission at a U.S. port of entry?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 106,
  },
  {
    id: 'eligibility8Overstay',
    label: '8) Har du någonsin stannat i USA längre än den beviljade perioden?',
    labelEn: '8) Have you ever stayed in the United States longer than the admission period granted to you by the U.S. government?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 107,
  },
  {
    id: 'eligibility9RestrictedCountries',
    label: '9) Har du rest till, eller vistats i, Kuba, Iran, Irak, Libyen, Nordkorea, Somalia, Sudan, Syrien eller Jemen den 1 mars 2011 eller senare?',
    labelEn: '9) Have you traveled to, or been present in Cuba, Iran, Iraq, Libya, North Korea, Somalia, Sudan, Syria or Yemen on or after March 1, 2011?',
    type: 'select',
    required: true,
    options: [
      { value: 'no', label: 'Nej', labelEn: 'No' },
      { value: 'yes', label: 'Ja', labelEn: 'Yes' },
    ],
    group: 'eligibility',
    perTraveler: true,
    sortOrder: 108,
  },
];

// ============================================================
// COMBINED FORM FIELDS
// ============================================================

export const ESTA_FORM_FIELDS: FormField[] = [
  ...PASSPORT_FIELDS,
  ...CITIZENSHIP_FIELDS,
  ...CONTACT_FIELDS,
  ...SOCIAL_MEDIA_FIELDS,
  ...GE_NEXUS_FIELDS,
  ...PARENTS_FIELDS,
  ...EMPLOYMENT_FIELDS,
  ...TRAVEL_FIELDS,
  ...EMERGENCY_CONTACT_FIELDS,
  ...ELIGIBILITY_FIELDS,
];

// ============================================================
// TEMPLATE CREATION HELPER
// ============================================================

export function createESTAFormTemplate(): {
  name: string;
  nameEn: string;
  countryCode: string;
  visaCategory: string;
  visaProductId: string;
  groups: FormFieldGroup[];
  fields: FormField[];
} {
  return {
    name: 'USA ESTA-ansökan',
    nameEn: 'USA ESTA Application',
    countryCode: 'US',
    visaCategory: 'esta',
    visaProductId: 'all',
    groups: ESTA_FIELD_GROUPS,
    fields: ESTA_FORM_FIELDS,
  };
}
