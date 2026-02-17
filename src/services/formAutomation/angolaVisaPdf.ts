/**
 * Angola Visa PDF Form Filler
 * 
 * Uses pdf-lib to fill the official Angola visa application PDF form
 * at /documents/angola-visa-application-form.pdf
 * 
 * The PDF has 89 fillable fields (text fields + checkboxes) across 3 pages:
 * - Page 1: Personal details, passport, address, family, lodging in Angola
 * - Page 2: Tourist section (reason, activity, dates) + Short Duration section + Complementary info
 * - Page 3: Legal text (no fields to fill)
 * 
 * The admin clicks "Generate PDF" → filled PDF is downloaded → printed and submitted to embassy.
 */

import { PDFDocument } from 'pdf-lib';

// ============================================================
// DATA TYPE — All fields on the Angola visa application form
// ============================================================

export type AngolaVisaType = 'tourist' | 'short_duration' | 'transit';

export interface AngolaVisaData {
  // === Visa type (checkbox at top) ===
  visaType: AngolaVisaType;

  // === Personal Details ===
  name: string;                       // Full name
  civilStatus: string;                // e.g. "Single", "Married"
  sex: string;                        // e.g. "M" or "F"
  dateOfBirth: string;                // DD/MM/YYYY
  placeOfBirth: string;
  countryOfBirth: string;
  nationalityAtBirth: string;
  presentNationality: string;

  // === Passport ===
  passportNumber: string;
  issuedIn: string;                   // Place of issue
  passportIssuedDate: string;         // DD/MM/YYYY
  passportValidUntil: string;         // DD/MM/YYYY

  // === Profession ===
  profession: string;
  postOccupied: string;               // Job title / position
  placeOfWork: string;

  // === Address ===
  placeOfResidenceState: string;
  city: string;
  road: string;
  postalCode: string;
  telefax: string;
  emailAddress: string;
  telephoneNr: string;

  // === Family ===
  fathersName: string;
  fathersNationality: string;
  mothersName: string;
  mothersNationality: string;

  // === Lodging in Angola ===
  placeOfLodgingInAngola: string;     // Hotel name or address
  lodgingCity: string;
  lodgingRoad: string;
  lodgingHouseNr: string;
  responsiblePersonOrOrg: string;     // Person/org responsible for stay
  province: string;
  municipality: string;
  district: string;
  responsibleRoad: string;
  responsibleHouseNr: string;

  // === Previous entry ===
  dateOfLastEntryInAngola?: string;   // DD/MM/YYYY
  borderUsed?: string;
  personOrOrgApplyingForVisa?: string;

  // === TOURIST VISA SECTION ===
  // Contact in Angola
  contactInAngolaTourist?: string;
  // Reason for visit (mark one)
  reasonRecreation?: boolean;
  reasonSportsEvent?: boolean;
  reasonCulturalEvent?: boolean;
  // Activity
  activityToBePerformed?: string;
  activityStartDate?: string;         // DD/MM/YYYY
  activityEndDate?: string;           // DD/MM/YYYY
  dateOfEntryInAngolaTourist?: string; // DD/MM/YYYY
  borderToBeUsedTourist?: string;

  // === SHORT DURATION VISA SECTION ===
  contactInAngolaShortDuration?: string;
  reasonsForVisa?: string;
  howLongWillYouStay?: string;        // e.g. "7"
  dateOfArrivalShortDuration?: string; // DD/MM/YYYY
  borderToBeUsedShortDuration?: string;
  dateOfLeavingShortDuration?: string; // DD/MM/YYYY

  // === COMPLEMENTARY INFORMATION (checkboxes) ===
  everTravelledToAngola?: boolean;
  hasResidentialCard?: boolean;
  hasWorkPermit?: boolean;
  everDeniedEntryVisa?: boolean;
  everExpelledFromAngola?: boolean;
}

// ============================================================
// PDF FIELD MAPPING
// ============================================================

/**
 * Split a DD/MM/YYYY date string into [DD, MM, YYYY] parts.
 * Returns ['', '', ''] if invalid.
 */
function splitDate(date: string | undefined): [string, string, string] {
  if (!date) return ['', '', ''];
  const parts = date.split('/');
  if (parts.length === 3) return [parts[0], parts[1], parts[2]];
  // Try YYYY-MM-DD format
  const isoParts = date.split('-');
  if (isoParts.length === 3) return [isoParts[2], isoParts[1], isoParts[0]];
  return ['', '', ''];
}

/**
 * Fill the Angola visa application PDF with the provided data.
 * Returns the filled PDF as a Uint8Array (ready for download).
 */
export async function fillAngolaVisaPdf(data: AngolaVisaData): Promise<Uint8Array> {
  // Fetch the blank PDF template
  const pdfUrl = '/documents/angola-visa-application-form.pdf';
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`Failed to fetch PDF template: ${response.status}`);
  const pdfBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Helper to safely set a text field
  const setText = (fieldName: string, value: string | undefined) => {
    if (!value) return;
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch {
      // Field not found — skip silently
    }
  };

  // Helper to safely check a checkbox
  const setCheck = (fieldName: string, checked: boolean | undefined) => {
    if (checked === undefined) return;
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) field.check();
      else field.uncheck();
    } catch {
      // Field not found — skip silently
    }
  };

  // === Visa type checkboxes (top of page 1) ===
  setCheck('Check Box2', data.visaType === 'tourist');
  setCheck('Check Box3', data.visaType === 'short_duration');
  setCheck('Check Box4', data.visaType === 'transit');

  // === Personal Details ===
  setText('Name', data.name);
  setText('Civil status', data.civilStatus);
  setText('Sex', data.sex);
  setText('Place of birth', data.placeOfBirth);
  setText('Country of birth', data.countryOfBirth);
  setText('Nationality at birth', data.nationalityAtBirth);
  setText('Present nationality', data.presentNationality);

  // Date of birth — split into 3 fields: Text5 (DD), Text6 (MM), Text7 (YYYY)
  const [dobDD, dobMM, dobYYYY] = splitDate(data.dateOfBirth);
  setText('Text5', dobDD);
  setText('Text6', dobMM);
  setText('Text7', dobYYYY);

  // === Passport ===
  setText('Passport  N', data.passportNumber);
  setText('Issued in', data.issuedIn);

  // Passport issued date — Text8 (DD), Text9 (MM), Text10 (YYYY)
  const [piDD, piMM, piYYYY] = splitDate(data.passportIssuedDate);
  setText('Text8', piDD);
  setText('Text9', piMM);
  setText('Text10', piYYYY);

  // Passport valid until — Text11 (DD), Text12 (MM), Text13 (YYYY)
  const [pvDD, pvMM, pvYYYY] = splitDate(data.passportValidUntil);
  setText('Text11', pvDD);
  setText('Text12', pvMM);
  setText('Text13', pvYYYY);

  // === Profession ===
  setText('Profession', data.profession);
  setText('Post occupied', data.postOccupied);
  setText('Place of work', data.placeOfWork);

  // === Address ===
  setText('Place of residence State', data.placeOfResidenceState);
  setText('City', data.city);
  setText('Road', data.road);
  setText('Postal code', data.postalCode);
  setText('Telefax', data.telefax);
  setText('Email address', data.emailAddress);
  setText('Telephone nr', data.telephoneNr);

  // === Family ===
  setText('Fathers name', data.fathersName);
  setText('Fathers nationality', data.fathersNationality);
  setText('Mothers name', data.mothersName);
  setText('Mothers nationality', data.mothersNationality);

  // === Lodging in Angola ===
  setText('Place of lodging in Angola', data.placeOfLodgingInAngola);
  setText('City_2', data.lodgingCity);
  setText('Road_2', data.lodgingRoad);
  setText('House nr', data.lodgingHouseNr);
  setText('Name of the person or Organization responsible for your stay', data.responsiblePersonOrOrg);
  setText('Province', data.province);
  setText('Municipality', data.municipality);
  setText('District', data.district);
  setText('Road_3', data.responsibleRoad);
  setText('House nr_2', data.responsibleHouseNr);

  // === Previous entry ===
  const [leDD, leMM, leYYYY] = splitDate(data.dateOfLastEntryInAngola);
  setText('Text14', leDD);
  setText('Text15', leMM);
  setText('Text16', leYYYY);
  setText('Border used', data.borderUsed);
  setText('Name of the person or Organization applying for the visa', data.personOrOrgApplyingForVisa);

  // === TOURIST VISA SECTION (Page 2 top) ===
  if (data.visaType === 'tourist') {
    setText('Name of the person or Organization to be contacted in Angola', data.contactInAngolaTourist);
    setText('Recreation', data.reasonRecreation ? 'X' : '');
    setText('Sports event', data.reasonSportsEvent ? 'X' : '');
    setText('Cultural event', data.reasonCulturalEvent ? 'X' : '');
    setText('Activity to be performed', data.activityToBePerformed);

    // Activity start date — Date it will start (DD), undefined_2 (MM), undefined_3 (YYYY)
    const [asDD, asMM, asYYYY] = splitDate(data.activityStartDate);
    setText('Date it will start', asDD);
    setText('undefined_2', asMM);
    setText('undefined_3', asYYYY);

    // Activity end date — Date it will end (DD), undefined_4 (MM), undefined_5 (YYYY)
    const [aeDD, aeMM, aeYYYY] = splitDate(data.activityEndDate);
    setText('Date it will end', aeDD);
    setText('undefined_4', aeMM);
    setText('undefined_5', aeYYYY);

    // Date of entry — Text30 (DD), Text31 (MM), Text32 (YYYY)
    const [teDD, teMM, teYYYY] = splitDate(data.dateOfEntryInAngolaTourist);
    setText('Text30', teDD);
    setText('Text31', teMM);
    setText('Text32', teYYYY);

    setText('Border to be used', data.borderToBeUsedTourist);
  }

  // === SHORT DURATION VISA SECTION (Page 2 middle) ===
  if (data.visaType === 'short_duration') {
    setText('Name of the person or Organization to be contacted in Angola_2', data.contactInAngolaShortDuration);
    setText('Reasons for the need to obtain the visa', data.reasonsForVisa);
    setText('How long will you stay', data.howLongWillYouStay);

    // Date of arrival — Text17 (DD), Text18 (MM), Text19 (YYYY)
    const [daDD, daMM, daYYYY] = splitDate(data.dateOfArrivalShortDuration);
    setText('Text17', daDD);
    setText('Text18', daMM);
    setText('Text19', daYYYY);

    setText('Border to be used_2', data.borderToBeUsedShortDuration);

    // Date of leaving — Date of leaving Angola (DD), undefined_6 (MM), undefined_7 (YYYY)
    const [dlDD, dlMM, dlYYYY] = splitDate(data.dateOfLeavingShortDuration);
    setText('Date of leaving Angola', dlDD);
    setText('undefined_6', dlMM);
    setText('undefined_7', dlYYYY);
  }

  // === COMPLEMENTARY INFORMATION (checkboxes — YES/NO pairs) ===
  // Check Box20 = YES travelled, Check Box21 = NO travelled
  setCheck('Check Box20', data.everTravelledToAngola === true);
  setCheck('Check Box21', data.everTravelledToAngola === false);

  // Check Box22 = YES residential card, Check Box23 = NO
  setCheck('Check Box22', data.hasResidentialCard === true);
  setCheck('Check Box23', data.hasResidentialCard === false);

  // Check Box24 = YES work permit, Check Box25 = NO
  setCheck('Check Box24', data.hasWorkPermit === true);
  setCheck('Check Box25', data.hasWorkPermit === false);

  // Check Box26 = YES denied visa, Check Box27 = NO
  setCheck('Check Box26', data.everDeniedEntryVisa === true);
  setCheck('Check Box27', data.everDeniedEntryVisa === false);

  // Check Box28 = YES expelled, Check Box29 = NO
  setCheck('Check Box28', data.everExpelledFromAngola === true);
  setCheck('Check Box29', data.everExpelledFromAngola === false);

  // Flatten the form so fields are not editable (looks cleaner for embassy)
  form.flatten();

  return pdfDoc.save();
}

// ============================================================
// BUILD FROM ORDER DATA
// ============================================================

/**
 * Build AngolaVisaData from order data + form submission data + passport data.
 * Priority: formSubmission > passport scan > order data
 */
export function buildAngolaVisaDataFromOrder(
  order: any,
  travelerIndex: number,
  formSubmissionData?: Record<string, string>
): AngolaVisaData | null {
  const travelers = order.travelers || [];
  const traveler = travelers[travelerIndex];
  if (!traveler) return null;

  const fd = formSubmissionData || {};
  const passport = traveler.passportData || {};
  const customer = order.customerInfo || {};

  // Helper: check both indexed and non-indexed keys
  const get = (fieldId: string) => fd[`${fieldId}_${travelerIndex}`] || fd[fieldId] || '';

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const toDMY = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Detect visa type from order
  const orderCategory = (order.selectedVisaProduct?.category || order.visaCategory || '').toLowerCase();
  let visaType: AngolaVisaType = 'tourist';
  if (orderCategory.includes('transit')) visaType = 'transit';
  else if (orderCategory.includes('business') || orderCategory.includes('short') || orderCategory.includes('kort') || orderCategory.includes('affär')) visaType = 'short_duration';

  const fullName = `${(get('givenName') || get('firstName') || passport.givenNames || traveler.firstName || '').toUpperCase()} ${(get('surname') || get('lastName') || passport.surname || traveler.lastName || '').toUpperCase()}`.trim();

  // "Person or Organization applying for the visa":
  // Tourist → traveler's own name, Business → company name or traveler's employer
  const applyingPersonOrOrg = get('personOrOrgApplyingForVisa')
    || (visaType === 'short_duration'
      ? (get('placeOfWork') || get('employerName') || customer.companyName || fullName)
      : fullName)
    || fullName;

  return {
    visaType,

    // Personal
    name: get('name') || fullName,
    civilStatus: get('civilStatus') || get('maritalStatus') || '',
    sex: (get('sex') || get('gender') || passport.gender || '').charAt(0).toUpperCase(), // M or F
    dateOfBirth: toDMY(get('dateOfBirth') || passport.dateOfBirth || traveler.dateOfBirth || ''),
    placeOfBirth: get('placeOfBirth') || get('townCityOfBirth') || '',
    countryOfBirth: get('countryOfBirth') || passport.issuingCountry || '',
    nationalityAtBirth: get('nationalityAtBirth') || get('presentNationality') || passport.nationality || '',
    presentNationality: get('presentNationality') || passport.nationality || '',

    // Passport
    passportNumber: (get('passportNumber') || passport.passportNumber || traveler.passportNumber || '').toUpperCase(),
    issuedIn: get('issuedIn') || get('placeOfIssue') || '',
    passportIssuedDate: toDMY(get('passportIssuedDate') || get('dateOfIssue') || ''),
    passportValidUntil: toDMY(get('passportValidUntil') || get('dateOfExpiry') || passport.expiryDate || traveler.passportExpiry || ''),

    // Profession
    profession: get('profession') || get('presentOccupation') || '',
    postOccupied: get('postOccupied') || get('jobTitle') || '',
    placeOfWork: get('placeOfWork') || get('employerName') || '',

    // Address
    placeOfResidenceState: get('placeOfResidenceState') || get('state') || '',
    city: get('city') || customer.city || '',
    road: get('road') || get('streetAddress') || get('houseNoStreet') || customer.address || '',
    postalCode: get('postalCode') || customer.postalCode || '',
    telefax: get('telefax') || '',
    emailAddress: get('emailAddress') || get('email') || customer.email || '',
    telephoneNr: get('telephoneNr') || get('phone') || get('phoneNo') || customer.phone || '',

    // Family
    fathersName: get('fathersName') || get('fatherName') || '',
    fathersNationality: get('fathersNationality') || get('fatherNationality') || '',
    mothersName: get('mothersName') || get('motherName') || '',
    mothersNationality: get('mothersNationality') || get('motherNationality') || '',

    // Lodging in Angola
    placeOfLodgingInAngola: get('placeOfLodgingInAngola') || get('hotelName') || '',
    lodgingCity: get('lodgingCity') || get('hotelCity') || '',
    lodgingRoad: get('lodgingRoad') || get('hotelAddress') || '',
    lodgingHouseNr: get('lodgingHouseNr') || '',
    responsiblePersonOrOrg: get('responsiblePersonOrOrg') || get('referenceName') || '',
    province: get('province') || '',
    municipality: get('municipality') || '',
    district: get('district') || '',
    responsibleRoad: get('responsibleRoad') || '',
    responsibleHouseNr: get('responsibleHouseNr') || '',

    // Previous entry
    dateOfLastEntryInAngola: toDMY(get('dateOfLastEntryInAngola') || ''),
    borderUsed: get('borderUsed') || '',
    personOrOrgApplyingForVisa: applyingPersonOrOrg,

    // Tourist section
    contactInAngolaTourist: get('contactInAngolaTourist') || get('referenceName') || '',
    reasonRecreation: get('reasonForVisit') === 'recreation' || get('reasonRecreation') === 'true' || visaType === 'tourist',
    reasonSportsEvent: get('reasonForVisit') === 'sports' || get('reasonSportsEvent') === 'true',
    reasonCulturalEvent: get('reasonForVisit') === 'cultural' || get('reasonCulturalEvent') === 'true',
    activityToBePerformed: get('activityToBePerformed') || (visaType === 'tourist' ? 'Tourism / Sight-seeing' : ''),
    activityStartDate: toDMY(get('activityStartDate') || get('expectedDateOfArrival') || order.departureDate || ''),
    activityEndDate: toDMY(get('activityEndDate') || get('expectedDateOfDeparture') || order.returnDateVisa || ''),
    dateOfEntryInAngolaTourist: toDMY(get('dateOfEntryInAngolaTourist') || get('expectedDateOfArrival') || order.departureDate || ''),
    borderToBeUsedTourist: get('borderToBeUsedTourist') || get('borderToBeUsed') || '',

    // Short duration section
    contactInAngolaShortDuration: get('contactInAngolaShortDuration') || get('referenceName') || '',
    reasonsForVisa: get('reasonsForVisa') || '',
    howLongWillYouStay: get('howLongWillYouStay') || '',
    dateOfArrivalShortDuration: toDMY(get('dateOfArrivalShortDuration') || order.departureDate || ''),
    borderToBeUsedShortDuration: get('borderToBeUsedShortDuration') || '',
    dateOfLeavingShortDuration: toDMY(get('dateOfLeavingShortDuration') || order.returnDateVisa || ''),

    // Complementary info
    everTravelledToAngola: get('everTravelledToAngola') === 'true' || get('everTravelledToAngola') === 'Yes' ? true : get('everTravelledToAngola') === 'false' || get('everTravelledToAngola') === 'No' ? false : false,
    hasResidentialCard: get('hasResidentialCard') === 'true' || get('hasResidentialCard') === 'Yes' ? true : false,
    hasWorkPermit: get('hasWorkPermit') === 'true' || get('hasWorkPermit') === 'Yes' ? true : false,
    everDeniedEntryVisa: get('everDeniedEntryVisa') === 'true' || get('everDeniedEntryVisa') === 'Yes' ? true : false,
    everExpelledFromAngola: get('everExpelledFromAngola') === 'true' || get('everExpelledFromAngola') === 'Yes' ? true : false,
  };
}

/**
 * Trigger download of a filled Angola visa PDF in the browser.
 */
export async function downloadFilledAngolaVisaPdf(data: AngolaVisaData, filename?: string): Promise<void> {
  const pdfBytes = await fillAngolaVisaPdf(data);
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `angola-visa-${data.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
