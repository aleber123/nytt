/**
 * USA DS-160 Visa Application Form Automation
 * 
 * This module handles data collection and potential automation for the DS-160
 * nonimmigrant visa application form used for US visa applications.
 * 
 * DS-160 Portal: https://ceac.state.gov/genniv/
 */

// ============================================================
// DS-160 DATA INTERFACE - SIMPLIFIED VERSION
// ============================================================

export interface DS160PersonalInfo {
  // Surnames
  surname: string;
  surnameNA: boolean; // Does Not Apply
  givenName: string;
  givenNameNA: boolean;
  fullNameNative: string;
  fullNameNativeNA: boolean;
  
  // Other names
  hasOtherNames: boolean;
  otherSurname?: string;
  otherGivenName?: string;
  
  // Telecode
  hasTelecodeNames: boolean;
  telecodeSurname?: string;
  telecodeGivenName?: string;
  
  // Basic info
  sex: 'M' | 'F';
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'COMMON_LAW';
  
  // Birth info
  dateOfBirth: string; // YYYY-MM-DD
  cityOfBirth: string;
  stateOfBirth: string;
  stateOfBirthNA: boolean;
  countryOfBirth: string;
  
  // Nationality
  nationality: string;
  hasOtherNationality: boolean;
  otherNationality?: string;
  otherNationalityPassportNumber?: string;
  
  // Permanent resident
  isPermanentResidentOtherCountry: boolean;
  permanentResidentCountry?: string;
  
  // National ID
  nationalIdNumber: string;
  nationalIdNumberNA: boolean;
  
  // US SSN
  hasUSSocialSecurityNumber: boolean;
  usSocialSecurityNumber?: string;
  
  // US Tax ID
  hasUSTaxpayerId: boolean;
  usTaxpayerId?: string;
}

export interface DS160PassportInfo {
  passportType: 'REGULAR' | 'OFFICIAL' | 'DIPLOMATIC' | 'LAISSEZ_PASSER' | 'OTHER';
  passportTypeOther?: string;
  passportNumber: string;
  passportBookNumber: string;
  passportBookNumberNA: boolean;
  passportIssuingCountry: string;
  passportIssuingCity: string;
  passportIssuingState: string;
  passportIssuingStateNA: boolean;
  passportIssuingCountryFull: string;
  passportIssueDate: string; // YYYY-MM-DD
  passportExpiryDate: string; // YYYY-MM-DD
  passportExpiryNA: boolean; // Does not expire
  
  // Lost/stolen passport
  hasLostPassport: boolean;
  lostPassportNumber?: string;
  lostPassportCountry?: string;
  lostPassportExplanation?: string;
}

export interface DS160TravelInfo {
  // Purpose
  purposeOfTrip: string; // Visa category code
  specificPurpose: string;
  
  // Travel plans
  hasSpecificTravelPlans: boolean;
  
  // If specific plans
  arrivalDate?: string;
  arrivalFlight?: string;
  arrivalCity?: string;
  departureDate?: string;
  departureFlight?: string;
  departureCity?: string;
  
  // If no specific plans
  intendedArrivalDate?: string;
  intendedStayLength?: string;
  intendedStayUnit?: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS';
  
  // Address in US
  usStreetAddress1: string;
  usStreetAddress2: string;
  usCity: string;
  usState: string;
  usZipCode: string;
  usZipCodeNA: boolean;
  
  // Who pays
  whoPaysTripCost: 'SELF' | 'OTHER_PERSON' | 'COMPANY' | 'US_PETITIONER' | 'OTHER';
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
  payerRelationship?: string;
  payerAddress?: string;
  payerSameAsYou?: boolean;
}

export interface DS160ContactInfo {
  // Home address
  homeStreetAddress1: string;
  homeStreetAddress2: string;
  homeCity: string;
  homeState: string;
  homeStateNA: boolean;
  homePostalCode: string;
  homePostalCodeNA: boolean;
  homeCountry: string;
  
  // Mailing address (if different)
  mailingAddressSameAsHome: boolean;
  mailingStreetAddress1?: string;
  mailingStreetAddress2?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingStateNA?: boolean;
  mailingPostalCode?: string;
  mailingPostalCodeNA?: boolean;
  mailingCountry?: string;
  
  // Phone
  primaryPhone: string;
  secondaryPhone: string;
  secondaryPhoneNA: boolean;
  workPhone: string;
  workPhoneNA: boolean;
  
  // Email
  email: string;
  
  // Social media
  socialMediaPlatforms: Array<{
    platform: string;
    identifier: string;
  }>;
  hasAdditionalSocialMedia: boolean;
  additionalSocialMedia?: string;
  hasAdditionalEmails: boolean;
  additionalEmails?: string;
  hasAdditionalPhones: boolean;
  additionalPhones?: string;
  hasAdditionalWebsites: boolean;
  additionalWebsites?: string;
}

export interface DS160USContactInfo {
  // Contact person in US
  contactName: string;
  contactOrganization: string;
  contactOrganizationNA: boolean;
  contactRelationship: string;
  contactStreetAddress1: string;
  contactStreetAddress2: string;
  contactCity: string;
  contactState: string;
  contactZipCode: string;
  contactZipCodeNA: boolean;
  contactPhone: string;
  contactEmail: string;
  contactEmailNA: boolean;
}

export interface DS160FamilyInfo {
  // Father
  fatherSurname: string;
  fatherSurnameNA: boolean;
  fatherGivenName: string;
  fatherGivenNameNA: boolean;
  fatherDateOfBirth: string;
  fatherDateOfBirthNA: boolean;
  isFatherInUS: boolean;
  fatherUSStatus?: string;
  
  // Mother
  motherSurname: string;
  motherSurnameNA: boolean;
  motherGivenName: string;
  motherGivenNameNA: boolean;
  motherDateOfBirth: string;
  motherDateOfBirthNA: boolean;
  isMotherInUS: boolean;
  motherUSStatus?: string;
  
  // Immediate relatives in US
  hasImmediateRelativesInUS: boolean;
  immediateRelatives?: Array<{
    surname: string;
    givenName: string;
    relationship: string;
    status: string;
  }>;
  
  // Other relatives in US
  hasOtherRelativesInUS: boolean;
  
  // Spouse (if married)
  spouseSurname?: string;
  spouseGivenName?: string;
  spouseDateOfBirth?: string;
  spouseNationality?: string;
  spouseCityOfBirth?: string;
  spouseCountryOfBirth?: string;
  spouseAddress?: string;
  spouseAddressSameAsYou?: boolean;
}

export interface DS160WorkEducationInfo {
  // Current occupation
  primaryOccupation: string;
  
  // Employer/School info
  employerName: string;
  employerNameNA: boolean;
  employerStreetAddress1: string;
  employerStreetAddress2: string;
  employerCity: string;
  employerState: string;
  employerStateNA: boolean;
  employerPostalCode: string;
  employerPostalCodeNA: boolean;
  employerCountry: string;
  employerPhone: string;
  employerStartDate: string;
  employerMonthlyIncome: string;
  employerMonthlyIncomeNA: boolean;
  jobDuties: string;
  
  // Previous employment
  wasPreviouslyEmployed: boolean;
  previousEmployers?: Array<{
    name: string;
    address: string;
    phone: string;
    jobTitle: string;
    supervisorName: string;
    startDate: string;
    endDate: string;
    duties: string;
  }>;
  
  // Education
  hasAttendedEducation: boolean;
  educationHistory?: Array<{
    institutionName: string;
    address: string;
    courseOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
}

export interface DS160PreviousUSTravel {
  // Previous US travel
  hasBeenToUS: boolean;
  previousUSVisits?: Array<{
    arrivalDate: string;
    stayLength: string;
  }>;
  
  // Previous US visa
  hasHadUSVisa: boolean;
  previousVisaIssueDate?: string;
  previousVisaNumber?: string;
  previousVisaSameType?: boolean;
  previousVisaSameCountry?: boolean;
  previousVisaTenPrinted?: boolean;
  previousVisaLost?: boolean;
  previousVisaLostYear?: string;
  previousVisaLostExplanation?: string;
  
  // Visa refusal/revocation
  hasBeenRefusedVisa: boolean;
  visaRefusalExplanation?: string;
  hasBeenRefusedEntry: boolean;
  entryRefusalExplanation?: string;
  hasHadVisaRevoked: boolean;
  visaRevokedExplanation?: string;
  
  // Immigration petition
  hasImmigrationPetition: boolean;
  immigrationPetitionExplanation?: string;
}

// ============================================================
// MAIN DS-160 DATA INTERFACE
// ============================================================

export interface DS160Data {
  // Application metadata
  applicationId?: string;
  consularPost: string; // Embassy/Consulate location
  
  // Form sections
  personalInfo: DS160PersonalInfo;
  passportInfo: DS160PassportInfo;
  travelInfo: DS160TravelInfo;
  contactInfo: DS160ContactInfo;
  usContactInfo: DS160USContactInfo;
  familyInfo: DS160FamilyInfo;
  workEducationInfo: DS160WorkEducationInfo;
  previousUSTravel: DS160PreviousUSTravel;
  
  // Security questions (simplified - these are yes/no with explanations)
  securityQuestions: {
    // Each security question is a boolean with optional explanation
    [key: string]: {
      answer: boolean;
      explanation?: string;
    };
  };
  
  // Photo
  photoBase64?: string;
}

// ============================================================
// VISA CATEGORIES FOR DS-160
// ============================================================

export const DS160_VISA_CATEGORIES = [
  { code: 'B1', label: 'Business (B1)', labelSv: 'Affärsvisum (B1)' },
  { code: 'B2', label: 'Tourism (B2)', labelSv: 'Turistvisum (B2)' },
  { code: 'B1/B2', label: 'Business/Tourism (B1/B2)', labelSv: 'Affärs-/Turistvisum (B1/B2)' },
  { code: 'F1', label: 'Student (F1)', labelSv: 'Studentvisum (F1)' },
  { code: 'J1', label: 'Exchange Visitor (J1)', labelSv: 'Utbytesbesökare (J1)' },
  { code: 'H1B', label: 'Specialty Occupation (H1B)', labelSv: 'Specialistarbete (H1B)' },
  { code: 'L1', label: 'Intracompany Transfer (L1)', labelSv: 'Företagsinternt (L1)' },
  { code: 'K1', label: 'Fiancé(e) (K1)', labelSv: 'Förlovad (K1)' },
  { code: 'C1/D', label: 'Transit/Crew (C1/D)', labelSv: 'Transit/Besättning (C1/D)' },
  { code: 'OTHER', label: 'Other', labelSv: 'Annat' },
] as const;

// ============================================================
// SECURITY QUESTIONS LIST
// ============================================================

export const DS160_SECURITY_QUESTIONS = [
  {
    id: 'communicableDisease',
    questionEn: 'Do you have a communicable disease of public health significance?',
    questionSv: 'Har du en smittsam sjukdom av betydelse för folkhälsan?',
  },
  {
    id: 'mentalDisorder',
    questionEn: 'Do you have a mental or physical disorder that poses a threat to yourself or others?',
    questionSv: 'Har du en psykisk eller fysisk störning som utgör ett hot mot dig själv eller andra?',
  },
  {
    id: 'drugAbuser',
    questionEn: 'Are you or have you been a drug abuser or addict?',
    questionSv: 'Är du eller har du varit drogmissbrukare eller beroende?',
  },
  {
    id: 'arrestedCrime',
    questionEn: 'Have you ever been arrested or convicted for any offense or crime?',
    questionSv: 'Har du någonsin blivit arresterad eller dömd för något brott?',
  },
  {
    id: 'violatedDrugLaw',
    questionEn: 'Have you ever violated any law related to controlled substances?',
    questionSv: 'Har du någonsin brutit mot lagar om kontrollerade substanser?',
  },
  {
    id: 'prostitution',
    questionEn: 'Are you coming to the US to engage in prostitution or unlawful commercialized vice?',
    questionSv: 'Kommer du till USA för att ägna dig åt prostitution eller olaglig kommersiell last?',
  },
  {
    id: 'moneyLaundering',
    questionEn: 'Have you ever been involved in money laundering?',
    questionSv: 'Har du någonsin varit inblandad i penningtvätt?',
  },
  {
    id: 'humanTrafficking',
    questionEn: 'Have you ever committed or conspired to commit human trafficking?',
    questionSv: 'Har du någonsin begått eller konspirerat för att begå människohandel?',
  },
  {
    id: 'helpedTrafficking',
    questionEn: 'Have you ever knowingly aided or assisted a trafficker?',
    questionSv: 'Har du någonsin medvetet hjälpt en människohandlare?',
  },
  {
    id: 'traffickingRelated',
    questionEn: 'Are you the spouse or child of a trafficker who has received benefits from trafficking?',
    questionSv: 'Är du make/maka eller barn till en människohandlare som har fått fördelar av människohandel?',
  },
  {
    id: 'espionage',
    questionEn: 'Do you seek to engage in espionage, sabotage, or export control violations?',
    questionSv: 'Försöker du ägna dig åt spionage, sabotage eller exportkontrollöverträdelser?',
  },
  {
    id: 'terroristActivity',
    questionEn: 'Do you seek to engage in terrorist activities or have you ever engaged in terrorist activities?',
    questionSv: 'Försöker du ägna dig åt terroristverksamhet eller har du någonsin ägnat dig åt terroristverksamhet?',
  },
  {
    id: 'financialAssistanceTerrorism',
    questionEn: 'Have you ever provided financial assistance to terrorists?',
    questionSv: 'Har du någonsin gett ekonomiskt stöd till terrorister?',
  },
  {
    id: 'terroristMember',
    questionEn: 'Are you a member of a terrorist organization?',
    questionSv: 'Är du medlem i en terroristorganisation?',
  },
  {
    id: 'genocide',
    questionEn: 'Have you ever committed, ordered, or participated in genocide?',
    questionSv: 'Har du någonsin begått, beordrat eller deltagit i folkmord?',
  },
  {
    id: 'torture',
    questionEn: 'Have you ever committed, ordered, or participated in torture?',
    questionSv: 'Har du någonsin begått, beordrat eller deltagit i tortyr?',
  },
  {
    id: 'extrajudicialKillings',
    questionEn: 'Have you ever committed, ordered, or participated in extrajudicial killings?',
    questionSv: 'Har du någonsin begått, beordrat eller deltagit i utomrättsliga avrättningar?',
  },
  {
    id: 'childSoldier',
    questionEn: 'Have you ever been involved in the recruitment or use of child soldiers?',
    questionSv: 'Har du någonsin varit inblandad i rekrytering eller användning av barnsoldater?',
  },
  {
    id: 'religiousFreedom',
    questionEn: 'Have you ever been responsible for violations of religious freedom?',
    questionSv: 'Har du någonsin varit ansvarig för kränkningar av religionsfriheten?',
  },
  {
    id: 'populationControls',
    questionEn: 'Have you ever been involved in coercive population control measures?',
    questionSv: 'Har du någonsin varit inblandad i tvingande befolkningskontrollåtgärder?',
  },
  {
    id: 'transplantOrgans',
    questionEn: 'Have you ever been involved in coercive transplantation of human organs?',
    questionSv: 'Har du någonsin varit inblandad i tvingande transplantation av mänskliga organ?',
  },
  {
    id: 'immigrationFraud',
    questionEn: 'Have you ever committed fraud to obtain a US visa?',
    questionSv: 'Har du någonsin begått bedrägeri för att få ett amerikanskt visum?',
  },
  {
    id: 'failedToAttendRemoval',
    questionEn: 'Have you ever failed to attend a removal proceeding?',
    questionSv: 'Har du någonsin underlåtit att närvara vid ett utvisningsförfarande?',
  },
  {
    id: 'unlawfulPresence',
    questionEn: 'Have you ever been unlawfully present in the US?',
    questionSv: 'Har du någonsin varit olagligt närvarande i USA?',
  },
  {
    id: 'deportedFromUS',
    questionEn: 'Have you ever been deported from the US?',
    questionSv: 'Har du någonsin blivit utvisad från USA?',
  },
  {
    id: 'childCustody',
    questionEn: 'Have you ever withheld custody of a US citizen child?',
    questionSv: 'Har du någonsin undanhållit vårdnad om ett amerikanskt medborgarbarn?',
  },
  {
    id: 'votedUnlawfully',
    questionEn: 'Have you ever voted in the US in violation of any law?',
    questionSv: 'Har du någonsin röstat i USA i strid med någon lag?',
  },
  {
    id: 'renounceToAvoidTax',
    questionEn: 'Have you ever renounced US citizenship to avoid taxation?',
    questionSv: 'Har du någonsin avsagt dig amerikanskt medborgarskap för att undvika beskattning?',
  },
] as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Creates an empty DS-160 data object with default values
 */
export function createEmptyDS160Data(): DS160Data {
  return {
    consularPost: '',
    personalInfo: {
      surname: '',
      surnameNA: false,
      givenName: '',
      givenNameNA: false,
      fullNameNative: '',
      fullNameNativeNA: false,
      hasOtherNames: false,
      hasTelecodeNames: false,
      sex: 'M',
      maritalStatus: 'SINGLE',
      dateOfBirth: '',
      cityOfBirth: '',
      stateOfBirth: '',
      stateOfBirthNA: false,
      countryOfBirth: '',
      nationality: '',
      hasOtherNationality: false,
      isPermanentResidentOtherCountry: false,
      nationalIdNumber: '',
      nationalIdNumberNA: false,
      hasUSSocialSecurityNumber: false,
      hasUSTaxpayerId: false,
    },
    passportInfo: {
      passportType: 'REGULAR',
      passportNumber: '',
      passportBookNumber: '',
      passportBookNumberNA: true,
      passportIssuingCountry: '',
      passportIssuingCity: '',
      passportIssuingState: '',
      passportIssuingStateNA: false,
      passportIssuingCountryFull: '',
      passportIssueDate: '',
      passportExpiryDate: '',
      passportExpiryNA: false,
      hasLostPassport: false,
    },
    travelInfo: {
      purposeOfTrip: 'B1/B2',
      specificPurpose: '',
      hasSpecificTravelPlans: false,
      usStreetAddress1: '',
      usStreetAddress2: '',
      usCity: '',
      usState: '',
      usZipCode: '',
      usZipCodeNA: false,
      whoPaysTripCost: 'SELF',
    },
    contactInfo: {
      homeStreetAddress1: '',
      homeStreetAddress2: '',
      homeCity: '',
      homeState: '',
      homeStateNA: false,
      homePostalCode: '',
      homePostalCodeNA: false,
      homeCountry: '',
      mailingAddressSameAsHome: true,
      primaryPhone: '',
      secondaryPhone: '',
      secondaryPhoneNA: true,
      workPhone: '',
      workPhoneNA: true,
      email: '',
      socialMediaPlatforms: [],
      hasAdditionalSocialMedia: false,
      hasAdditionalEmails: false,
      hasAdditionalPhones: false,
      hasAdditionalWebsites: false,
    },
    usContactInfo: {
      contactName: '',
      contactOrganization: '',
      contactOrganizationNA: false,
      contactRelationship: '',
      contactStreetAddress1: '',
      contactStreetAddress2: '',
      contactCity: '',
      contactState: '',
      contactZipCode: '',
      contactZipCodeNA: false,
      contactPhone: '',
      contactEmail: '',
      contactEmailNA: false,
    },
    familyInfo: {
      fatherSurname: '',
      fatherSurnameNA: false,
      fatherGivenName: '',
      fatherGivenNameNA: false,
      fatherDateOfBirth: '',
      fatherDateOfBirthNA: false,
      isFatherInUS: false,
      motherSurname: '',
      motherSurnameNA: false,
      motherGivenName: '',
      motherGivenNameNA: false,
      motherDateOfBirth: '',
      motherDateOfBirthNA: false,
      isMotherInUS: false,
      hasImmediateRelativesInUS: false,
      hasOtherRelativesInUS: false,
    },
    workEducationInfo: {
      primaryOccupation: '',
      employerName: '',
      employerNameNA: false,
      employerStreetAddress1: '',
      employerStreetAddress2: '',
      employerCity: '',
      employerState: '',
      employerStateNA: false,
      employerPostalCode: '',
      employerPostalCodeNA: false,
      employerCountry: '',
      employerPhone: '',
      employerStartDate: '',
      employerMonthlyIncome: '',
      employerMonthlyIncomeNA: false,
      jobDuties: '',
      wasPreviouslyEmployed: false,
      hasAttendedEducation: false,
    },
    previousUSTravel: {
      hasBeenToUS: false,
      hasHadUSVisa: false,
      hasBeenRefusedVisa: false,
      hasBeenRefusedEntry: false,
      hasHadVisaRevoked: false,
      hasImmigrationPetition: false,
    },
    securityQuestions: {},
  };
}

/**
 * Initialize security questions with default "No" answers
 */
export function initializeSecurityQuestions(): DS160Data['securityQuestions'] {
  const questions: DS160Data['securityQuestions'] = {};
  for (const q of DS160_SECURITY_QUESTIONS) {
    questions[q.id] = { answer: false };
  }
  return questions;
}
