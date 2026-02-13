/**
 * India e-Visa Form Auto-fill Script Generator
 * 
 * Generates JavaScript snippets for each page of the India e-Visa application portal
 * at https://indianvisaonline.gov.in/evisa/tvoa.html
 * 
 * The India e-Visa Business application has multiple pages:
 * 1. Page 1: Passport & Personal Details
 * 2. Page 2: Applicant Details (address, family, profession)
 * 3. Page 3: Travel Details (visa type, purpose, itinerary)
 * 4. Page 4: Previous Visa / Other Info
 * 
 * Each page generates a separate script. The admin navigates to each page,
 * pastes the script, and clicks "Save & Continue".
 * 
 * Same principle as Svensklistan — copy script → paste in console → auto-fill.
 */

// ============================================================
// DATA TYPE — All fields needed across all pages
// ============================================================

export interface IndiaEVisaData {
  // === Page 1: Passport & Personal Details ===
  nationality: string;              // e.g. "SWEDEN" — must match portal dropdown exactly
  passportType: 'ORDINARY PASSPORT' | 'DIPLOMATIC PASSPORT' | 'OFFICIAL PASSPORT' | 'SERVICE PASSPORT' | 'SPECIAL PASSPORT';
  portOfArrival: string;            // e.g. "DELHI AIRPORT" — must match portal dropdown exactly
  dateOfBirth: string;              // DD/MM/YYYY
  emailId: string;
  reenterEmailId: string;
  expectedDateOfArrival: string;    // DD/MM/YYYY
  visaService: string;              // e.g. "e-Business Visa"
  visaSubType?: string;             // e.g. "ATTEND TECHNICAL/BUSINESS MEETINGS"
  
  // Applicant details
  surname: string;
  givenName: string;
  haveYouChangedName: 'Yes' | 'No';
  previousName?: string;
  gender: 'MALE' | 'FEMALE' | 'TRANSGENDER';
  townCityOfBirth: string;
  countryOfBirth: string;           // Must match portal dropdown e.g. "SWEDEN"
  citizenshipNationalId: string;    // e.g. personnummer
  religion: string;                 // e.g. "CHRISTIANITY", "ISLAM", "HINDUISM", "BUDDHISM", "OTHERS"
  visibleIdentificationMark: string; // e.g. "NONE" or description
  educationalQualification: string; // e.g. "GRADUATE", "POST GRADUATE", "PROFESSIONAL", etc.
  
  // Passport details
  passportNumber: string;
  placeOfIssue: string;
  dateOfIssue: string;              // DD/MM/YYYY
  dateOfExpiry: string;             // DD/MM/YYYY
  anyOtherPassport: 'Yes' | 'No';
  otherPassportCountry?: string;
  otherPassportNumber?: string;
  otherPassportPlaceOfIssue?: string;
  otherPassportDateOfIssue?: string;
  otherPassportNationality?: string;

  // === Page 2: Applicant Address & Family ===
  houseNoStreet: string;
  village: string;                  // Village/Town/City — can be same as city
  city: string;
  state: string;
  postalCode: string;
  phoneNo: string;                  // With country code
  mobileNo: string;
  
  // Father details
  fatherName: string;
  fatherNationality: string;
  fatherPreviousNationality?: string;
  fatherPlaceOfBirth?: string;
  fatherCountryOfBirth?: string;
  
  // Mother details
  motherName: string;
  motherNationality: string;
  motherPreviousNationality?: string;
  motherPlaceOfBirth?: string;
  motherCountryOfBirth?: string;
  
  // Spouse details (if applicable)
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';
  spouseName?: string;
  spouseNationality?: string;
  spousePreviousNationality?: string;
  spousePlaceOfBirth?: string;
  spouseCountryOfBirth?: string;
  
  // Profession
  presentOccupation: string;        // e.g. "BUSINESS PERSON", "WORKER", "PROFESSIONAL", etc.
  employerName?: string;
  employerAddress?: string;
  employerPhone?: string;
  pastOccupation?: string;
  
  // Were you in military/semi-military
  wereYouInMilitary: 'Yes' | 'No';

  // === Page 3: Travel Details ===
  // Business visa specifics
  purposeOfVisit: string;           // e.g. "ATTEND BUSINESS MEETINGS"
  detailsOfPurpose: string;         // Detailed description
  placesToVisit: string;            // Cities to visit
  durationOfVisa: string;           // e.g. "UP TO 1 YEAR", "UP TO 5 YEARS"
  numberOfEntries: string;          // e.g. "MULTIPLE"
  
  // Reference in India
  referenceNameInIndia: string;
  referenceAddressInIndia: string;
  referencePhoneInIndia: string;
  
  // Reference in home country
  referenceNameInHomeCountry: string;
  referenceAddressInHomeCountry: string;
  referencePhoneInHomeCountry: string;
  
  // Inviting company/organization
  invitingCompanyName?: string;
  invitingCompanyAddress?: string;
  invitingCompanyPhone?: string;
  
  // Accommodation
  expectedPortOfExit?: string;
  hasItineraryCities?: string;      // Comma-separated cities
  
  // === Page 4: Previous Visa & Other Info ===
  haveYouVisitedIndiaBefore: 'Yes' | 'No';
  previousVisaDetails?: string;     // Address, cities visited, last visa no
  previousVisaNo?: string;
  previousVisaType?: string;
  previousVisaPlaceOfIssue?: string;
  previousVisaDateOfIssue?: string;
  
  countriesVisitedInLast10Years?: string; // Comma-separated
  
  haveYouBeenRefusedVisa: 'Yes' | 'No';
  refusedVisaDetails?: string;
  
  haveYouBeenDeported: 'Yes' | 'No';
  deportedDetails?: string;
  
  // SAARC country details
  saarcCountryVisitedInLast3Years?: string;
}

// ============================================================
// SCRIPT GENERATORS — One per page
// ============================================================

const SCRIPT_HEADER = `
// === India e-Visa Auto-fill Script ===
// Generated by DOX Visumpartner Admin
// =====================================

(function() {
  'use strict';
  
  function setVal(selector, value) {
    var el = document.querySelector(selector);
    if (!el) { console.warn('Not found:', selector); return false; }
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (setter && setter.set) { setter.set.call(el, value); }
    else { el.value = value; }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }
  
  function setSelect(selector, value) {
    var el = document.querySelector(selector);
    if (!el) { console.warn('Select not found:', selector); return false; }
    // Try exact match first
    for (var i = 0; i < el.options.length; i++) {
      if (el.options[i].value === value || el.options[i].text.trim().toUpperCase() === value.toUpperCase()) {
        el.selectedIndex = i;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    // Try partial match
    for (var i = 0; i < el.options.length; i++) {
      if (el.options[i].text.trim().toUpperCase().includes(value.toUpperCase())) {
        el.selectedIndex = i;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    console.warn('Option not found:', value, 'in', selector);
    return false;
  }
  
  function setRadio(name, value) {
    var radios = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].value === value || radios[i].value.toUpperCase() === value.toUpperCase()) {
        radios[i].click();
        radios[i].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    console.warn('Radio not found:', name, '=', value);
    return false;
  }
  
  function setDate(selector, ddmmyyyy) {
    var el = document.querySelector(selector);
    if (!el) { console.warn('Date not found:', selector); return false; }
    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (setter && setter.set) { setter.set.call(el, ddmmyyyy); }
    else { el.value = ddmmyyyy; }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    // Also try to trigger Angular/jQuery change
    if (typeof jQuery !== 'undefined') { jQuery(el).val(ddmmyyyy).trigger('change'); }
    if (typeof angular !== 'undefined') {
      var scope = angular.element(el).scope();
      if (scope) { scope.$apply(); }
    }
    return true;
  }
  
  function setCheckbox(selector, checked) {
    var el = document.querySelector(selector);
    if (!el) { console.warn('Checkbox not found:', selector); return false; }
    if (el.checked !== checked) { el.click(); }
    return true;
  }
  
  var results = [];
  function r(name, ok) { results.push([name, ok]); }
`;

const SCRIPT_FOOTER = `
  // Report
  var success = 0, fail = 0;
  for (var i = 0; i < results.length; i++) {
    if (results[i][1]) { success++; console.log('✅ ' + results[i][0]); }
    else { fail++; console.log('❌ ' + results[i][0] + ' — CHECK MANUALLY'); }
  }
  var msg = 'India e-Visa auto-fill done!\\n\\nFilled: ' + success + '/' + results.length;
  if (fail > 0) msg += '\\n\\n⚠️ ' + fail + ' field(s) need manual review.';
  msg += '\\n\\nReview all fields, then click Save & Continue.';
  alert(msg);
})();
`;

function esc(s: string): string {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

/**
 * Generate Page 1 script: Passport & Personal Details
 */
export function generatePage1Script(data: IndiaEVisaData): string {
  return `${SCRIPT_HEADER}
  // === PAGE 1: Passport & Personal Details ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Nationality
  r('Nationality', setSelect('#nationality, [name="nationality"], select[ng-model*="nationality"]', '${esc(data.nationality)}'));
  
  // Passport Type
  r('Passport Type', setSelect('#passportType, [name="passportType"], select[ng-model*="passportType"]', '${esc(data.passportType)}'));
  
  // Port of Arrival
  r('Port of Arrival', setSelect('#portOfArrival, [name="portOfArrival"], select[ng-model*="portOfArrival"]', '${esc(data.portOfArrival)}'));
  
  // Date of Birth
  r('Date of Birth', setDate('#dateOfBirth, [name="dateOfBirth"], input[ng-model*="dateOfBirth"]', '${esc(data.dateOfBirth)}'));
  
  // Email
  r('Email', setVal('#emailId, [name="emailId"], input[ng-model*="emailId"]', '${esc(data.emailId)}'));
  r('Re-enter Email', setVal('#reenterEmailId, [name="reenterEmailId"], input[ng-model*="reenterEmailId"]', '${esc(data.reenterEmailId || data.emailId)}'));
  
  // Expected Date of Arrival
  r('Expected Arrival', setDate('#expectedDateOfArrival, [name="expectedDateOfArrival"], input[ng-model*="expectedDateOfArrival"]', '${esc(data.expectedDateOfArrival)}'));
  
  // Visa Service — eBusiness
  r('Visa Service', setSelect('#visaService, [name="visaService"], select[ng-model*="visaService"]', 'eBUSINESS VISA'));
  
  // Surname
  r('Surname', setVal('#surname, [name="surname"], input[ng-model*="surname"]', '${esc(data.surname)}'));
  
  // Given Name
  r('Given Name', setVal('#givenName, [name="givenName"], input[ng-model*="givenName"]', '${esc(data.givenName)}'));
  
  // Changed Name
  r('Changed Name', setRadio('haveYouChangedName', '${data.haveYouChangedName === 'Yes' ? 'Y' : 'N'}'));
  ${data.haveYouChangedName === 'Yes' && data.previousName ? `r('Previous Name', setVal('#previousName, [name="previousName"]', '${esc(data.previousName)}'));` : ''}
  
  // Gender
  r('Gender', setRadio('gender', '${data.gender === 'MALE' ? 'M' : data.gender === 'FEMALE' ? 'F' : 'T'}'));
  
  // Town/City of Birth
  r('Town of Birth', setVal('#townCityOfBirth, [name="townCityOfBirth"], input[ng-model*="townCityOfBirth"]', '${esc(data.townCityOfBirth)}'));
  
  // Country of Birth
  r('Country of Birth', setSelect('#countryOfBirth, [name="countryOfBirth"], select[ng-model*="countryOfBirth"]', '${esc(data.countryOfBirth)}'));
  
  // Citizenship/National ID
  r('National ID', setVal('#citizenshipNationalId, [name="citizenshipNationalId"], input[ng-model*="citizenshipNationalId"]', '${esc(data.citizenshipNationalId)}'));
  
  // Religion
  r('Religion', setSelect('#religion, [name="religion"], select[ng-model*="religion"]', '${esc(data.religion)}'));
  
  // Visible Identification Mark
  r('Identification Mark', setVal('#visibleIdentificationMark, [name="visibleIdentificationMark"], input[ng-model*="visibleIdentificationMark"]', '${esc(data.visibleIdentificationMark || 'NONE')}'));
  
  // Educational Qualification
  r('Education', setSelect('#educationalQualification, [name="educationalQualification"], select[ng-model*="educationalQualification"]', '${esc(data.educationalQualification)}'));
  
  // === Passport Details ===
  r('Passport Number', setVal('#passportNumber, [name="passportNumber"], input[ng-model*="passportNumber"]', '${esc(data.passportNumber)}'));
  r('Place of Issue', setVal('#placeOfIssue, [name="placeOfIssue"], input[ng-model*="placeOfIssue"]', '${esc(data.placeOfIssue)}'));
  r('Date of Issue', setDate('#dateOfIssue, [name="dateOfIssue"], input[ng-model*="dateOfIssue"]', '${esc(data.dateOfIssue)}'));
  r('Date of Expiry', setDate('#dateOfExpiry, [name="dateOfExpiry"], input[ng-model*="dateOfExpiry"]', '${esc(data.dateOfExpiry)}'));
  
  // Other passport
  r('Other Passport', setRadio('anyOtherPassport', '${data.anyOtherPassport === 'Yes' ? 'Y' : 'N'}'));
  ${data.anyOtherPassport === 'Yes' ? `
  r('Other Passport Country', setSelect('#otherPassportCountry, [name="otherPassportCountry"]', '${esc(data.otherPassportCountry || '')}'));
  r('Other Passport Number', setVal('#otherPassportNumber, [name="otherPassportNumber"]', '${esc(data.otherPassportNumber || '')}'));
  r('Other Passport Place', setVal('#otherPassportPlaceOfIssue, [name="otherPassportPlaceOfIssue"]', '${esc(data.otherPassportPlaceOfIssue || '')}'));
  r('Other Passport Date', setDate('#otherPassportDateOfIssue, [name="otherPassportDateOfIssue"]', '${esc(data.otherPassportDateOfIssue || '')}'));
  ` : ''}
${SCRIPT_FOOTER}`;
}

/**
 * Generate Page 2 script: Applicant Address & Family Details
 */
export function generatePage2Script(data: IndiaEVisaData): string {
  return `${SCRIPT_HEADER}
  // === PAGE 2: Address, Family & Profession ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Address
  r('House/Street', setVal('#houseNoStreet, [name="houseNoStreet"], input[ng-model*="houseNoStreet"]', '${esc(data.houseNoStreet)}'));
  r('Village/Town', setVal('#village, [name="village"], input[ng-model*="village"]', '${esc(data.village || data.city)}'));
  r('City', setVal('#city, [name="city"], input[ng-model*="city"]', '${esc(data.city)}'));
  r('State', setVal('#state, [name="state"], input[ng-model*="state"]', '${esc(data.state)}'));
  r('Postal Code', setVal('#postalCode, [name="postalCode"], input[ng-model*="postalCode"]', '${esc(data.postalCode)}'));
  r('Phone', setVal('#phoneNo, [name="phoneNo"], input[ng-model*="phoneNo"]', '${esc(data.phoneNo)}'));
  r('Mobile', setVal('#mobileNo, [name="mobileNo"], input[ng-model*="mobileNo"]', '${esc(data.mobileNo)}'));
  
  // Father
  r('Father Name', setVal('#fatherName, [name="fatherName"], input[ng-model*="fatherName"]', '${esc(data.fatherName)}'));
  r('Father Nationality', setSelect('#fatherNationality, [name="fatherNationality"], select[ng-model*="fatherNationality"]', '${esc(data.fatherNationality)}'));
  ${data.fatherPlaceOfBirth ? `r('Father Birth Place', setVal('#fatherPlaceOfBirth, [name="fatherPlaceOfBirth"]', '${esc(data.fatherPlaceOfBirth)}'));` : ''}
  ${data.fatherCountryOfBirth ? `r('Father Birth Country', setSelect('#fatherCountryOfBirth, [name="fatherCountryOfBirth"]', '${esc(data.fatherCountryOfBirth)}'));` : ''}
  
  // Mother
  r('Mother Name', setVal('#motherName, [name="motherName"], input[ng-model*="motherName"]', '${esc(data.motherName)}'));
  r('Mother Nationality', setSelect('#motherNationality, [name="motherNationality"], select[ng-model*="motherNationality"]', '${esc(data.motherNationality)}'));
  ${data.motherPlaceOfBirth ? `r('Mother Birth Place', setVal('#motherPlaceOfBirth, [name="motherPlaceOfBirth"]', '${esc(data.motherPlaceOfBirth)}'));` : ''}
  ${data.motherCountryOfBirth ? `r('Mother Birth Country', setSelect('#motherCountryOfBirth, [name="motherCountryOfBirth"]', '${esc(data.motherCountryOfBirth)}'));` : ''}
  
  // Marital Status
  r('Marital Status', setSelect('#maritalStatus, [name="maritalStatus"], select[ng-model*="maritalStatus"]', '${esc(data.maritalStatus)}'));
  ${data.maritalStatus === 'MARRIED' && data.spouseName ? `
  r('Spouse Name', setVal('#spouseName, [name="spouseName"], input[ng-model*="spouseName"]', '${esc(data.spouseName)}'));
  r('Spouse Nationality', setSelect('#spouseNationality, [name="spouseNationality"]', '${esc(data.spouseNationality || '')}'));
  ${data.spousePlaceOfBirth ? `r('Spouse Birth Place', setVal('#spousePlaceOfBirth, [name="spousePlaceOfBirth"]', '${esc(data.spousePlaceOfBirth)}'));` : ''}
  ${data.spouseCountryOfBirth ? `r('Spouse Birth Country', setSelect('#spouseCountryOfBirth, [name="spouseCountryOfBirth"]', '${esc(data.spouseCountryOfBirth)}'));` : ''}
  ` : ''}
  
  // Profession
  r('Occupation', setSelect('#presentOccupation, [name="presentOccupation"], select[ng-model*="presentOccupation"]', '${esc(data.presentOccupation)}'));
  ${data.employerName ? `r('Employer', setVal('#employerName, [name="employerName"], input[ng-model*="employerName"]', '${esc(data.employerName)}'));` : ''}
  ${data.employerAddress ? `r('Employer Address', setVal('#employerAddress, [name="employerAddress"], input[ng-model*="employerAddress"]', '${esc(data.employerAddress)}'));` : ''}
  ${data.employerPhone ? `r('Employer Phone', setVal('#employerPhone, [name="employerPhone"], input[ng-model*="employerPhone"]', '${esc(data.employerPhone)}'));` : ''}
  
  // Military
  r('Military Service', setRadio('wereYouInMilitary', '${data.wereYouInMilitary === 'Yes' ? 'Y' : 'N'}'));
${SCRIPT_FOOTER}`;
}

/**
 * Generate Page 3 script: Travel Details (Business Visa)
 */
export function generatePage3Script(data: IndiaEVisaData): string {
  return `${SCRIPT_HEADER}
  // === PAGE 3: Travel / Business Details ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Purpose
  ${data.purposeOfVisit ? `r('Purpose', setSelect('#purposeOfVisit, [name="purposeOfVisit"], select[ng-model*="purposeOfVisit"]', '${esc(data.purposeOfVisit)}'));` : ''}
  ${data.detailsOfPurpose ? `r('Details', setVal('#detailsOfPurpose, [name="detailsOfPurpose"], textarea[ng-model*="detailsOfPurpose"], input[ng-model*="detailsOfPurpose"]', '${esc(data.detailsOfPurpose)}'));` : ''}
  
  // Places to visit
  ${data.placesToVisit ? `r('Places to Visit', setVal('#placesToVisit, [name="placesToVisit"], input[ng-model*="placesToVisit"]', '${esc(data.placesToVisit)}'));` : ''}
  
  // Duration & entries
  ${data.durationOfVisa ? `r('Duration', setSelect('#durationOfVisa, [name="durationOfVisa"], select[ng-model*="durationOfVisa"]', '${esc(data.durationOfVisa)}'));` : ''}
  ${data.numberOfEntries ? `r('Entries', setSelect('#numberOfEntries, [name="numberOfEntries"], select[ng-model*="numberOfEntries"]', '${esc(data.numberOfEntries)}'));` : ''}
  
  // Reference in India
  r('Ref Name (India)', setVal('#referenceNameInIndia, [name="referenceNameInIndia"], input[ng-model*="referenceNameInIndia"]', '${esc(data.referenceNameInIndia)}'));
  r('Ref Address (India)', setVal('#referenceAddressInIndia, [name="referenceAddressInIndia"], input[ng-model*="referenceAddressInIndia"]', '${esc(data.referenceAddressInIndia)}'));
  r('Ref Phone (India)', setVal('#referencePhoneInIndia, [name="referencePhoneInIndia"], input[ng-model*="referencePhoneInIndia"]', '${esc(data.referencePhoneInIndia)}'));
  
  // Reference in home country
  r('Ref Name (Home)', setVal('#referenceNameInHomeCountry, [name="referenceNameInHomeCountry"], input[ng-model*="referenceNameInHomeCountry"]', '${esc(data.referenceNameInHomeCountry)}'));
  r('Ref Address (Home)', setVal('#referenceAddressInHomeCountry, [name="referenceAddressInHomeCountry"], input[ng-model*="referenceAddressInHomeCountry"]', '${esc(data.referenceAddressInHomeCountry)}'));
  r('Ref Phone (Home)', setVal('#referencePhoneInHomeCountry, [name="referencePhoneInHomeCountry"], input[ng-model*="referencePhoneInHomeCountry"]', '${esc(data.referencePhoneInHomeCountry)}'));
  
  // Inviting company
  ${data.invitingCompanyName ? `r('Company Name', setVal('#invitingCompanyName, [name="invitingCompanyName"], input[ng-model*="invitingCompanyName"]', '${esc(data.invitingCompanyName)}'));` : ''}
  ${data.invitingCompanyAddress ? `r('Company Address', setVal('#invitingCompanyAddress, [name="invitingCompanyAddress"], input[ng-model*="invitingCompanyAddress"]', '${esc(data.invitingCompanyAddress)}'));` : ''}
  ${data.invitingCompanyPhone ? `r('Company Phone', setVal('#invitingCompanyPhone, [name="invitingCompanyPhone"], input[ng-model*="invitingCompanyPhone"]', '${esc(data.invitingCompanyPhone)}'));` : ''}
  
  // Port of exit
  ${data.expectedPortOfExit ? `r('Port of Exit', setSelect('#expectedPortOfExit, [name="expectedPortOfExit"], select[ng-model*="expectedPortOfExit"]', '${esc(data.expectedPortOfExit)}'));` : ''}
${SCRIPT_FOOTER}`;
}

/**
 * Generate Page 4 script: Previous Visa & Other Info
 */
export function generatePage4Script(data: IndiaEVisaData): string {
  return `${SCRIPT_HEADER}
  // === PAGE 4: Previous Visa & Other Info ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Previous India visit
  r('Visited India Before', setRadio('haveYouVisitedIndiaBefore', '${data.haveYouVisitedIndiaBefore === 'Yes' ? 'Y' : 'N'}'));
  ${data.haveYouVisitedIndiaBefore === 'Yes' ? `
  ${data.previousVisaNo ? `r('Previous Visa No', setVal('#previousVisaNo, [name="previousVisaNo"]', '${esc(data.previousVisaNo)}'));` : ''}
  ${data.previousVisaType ? `r('Previous Visa Type', setVal('#previousVisaType, [name="previousVisaType"]', '${esc(data.previousVisaType)}'));` : ''}
  ${data.previousVisaPlaceOfIssue ? `r('Previous Visa Place', setVal('#previousVisaPlaceOfIssue, [name="previousVisaPlaceOfIssue"]', '${esc(data.previousVisaPlaceOfIssue)}'));` : ''}
  ${data.previousVisaDateOfIssue ? `r('Previous Visa Date', setDate('#previousVisaDateOfIssue, [name="previousVisaDateOfIssue"]', '${esc(data.previousVisaDateOfIssue)}'));` : ''}
  ` : ''}
  
  // Countries visited in last 10 years
  ${data.countriesVisitedInLast10Years ? `r('Countries Visited', setVal('#countriesVisitedInLast10Years, [name="countriesVisitedInLast10Years"], textarea[ng-model*="countriesVisitedInLast10Years"]', '${esc(data.countriesVisitedInLast10Years)}'));` : ''}
  
  // Visa refusal
  r('Visa Refused', setRadio('haveYouBeenRefusedVisa', '${data.haveYouBeenRefusedVisa === 'Yes' ? 'Y' : 'N'}'));
  ${data.haveYouBeenRefusedVisa === 'Yes' && data.refusedVisaDetails ? `r('Refusal Details', setVal('#refusedVisaDetails, [name="refusedVisaDetails"]', '${esc(data.refusedVisaDetails)}'));` : ''}
  
  // Deportation
  r('Deported', setRadio('haveYouBeenDeported', '${data.haveYouBeenDeported === 'Yes' ? 'Y' : 'N'}'));
  ${data.haveYouBeenDeported === 'Yes' && data.deportedDetails ? `r('Deportation Details', setVal('#deportedDetails, [name="deportedDetails"]', '${esc(data.deportedDetails)}'));` : ''}
  
  // SAARC
  ${data.saarcCountryVisitedInLast3Years ? `r('SAARC Countries', setVal('#saarcCountryVisitedInLast3Years, [name="saarcCountryVisitedInLast3Years"]', '${esc(data.saarcCountryVisitedInLast3Years)}'));` : ''}
${SCRIPT_FOOTER}`;
}

/**
 * Generate ALL page scripts as an array
 */
export function generateAllPageScripts(data: IndiaEVisaData): { page: number; title: string; script: string }[] {
  return [
    { page: 1, title: 'Passport & Personal Details', script: generatePage1Script(data) },
    { page: 2, title: 'Address, Family & Profession', script: generatePage2Script(data) },
    { page: 3, title: 'Travel / Business Details', script: generatePage3Script(data) },
    { page: 4, title: 'Previous Visa & Other Info', script: generatePage4Script(data) },
  ];
}

/**
 * Build IndiaEVisaData from order data + form submission data + passport data.
 * 
 * Priority: formSubmission > passport scan > order data
 */
export function buildIndiaEVisaDataFromOrder(
  order: any,
  travelerIndex: number,
  formSubmissionData?: Record<string, string>
): IndiaEVisaData | null {
  const travelers = order.travelers || [];
  const traveler = travelers[travelerIndex];
  if (!traveler) return null;

  const fd = formSubmissionData || {};
  const passport = traveler.passportData || {};
  const customer = order.customerInfo || {};

  // Helper: check both indexed and non-indexed keys
  const get = (fieldId: string) => fd[`${fieldId}_${travelerIndex}`] || fd[fieldId] || '';

  // Convert YYYY-MM-DD to DD/MM/YYYY for India portal
  const toIndiaDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const email = get('email') || customer.email || '';

  return {
    // Page 1
    nationality: (get('nationality') || passport.nationality || 'SWEDEN').toUpperCase(),
    passportType: (get('passportType') as any) || 'ORDINARY PASSPORT',
    portOfArrival: get('portOfArrival') || 'DELHI AIRPORT',
    dateOfBirth: toIndiaDate(get('dateOfBirth') || passport.dateOfBirth || traveler.dateOfBirth || ''),
    emailId: email,
    reenterEmailId: email,
    expectedDateOfArrival: toIndiaDate(get('expectedDateOfArrival') || order.departureDate || ''),
    visaService: 'e-Business Visa',
    visaSubType: get('purposeOfVisit') || 'ATTEND TECHNICAL/BUSINESS MEETINGS',

    surname: (get('surname') || passport.surname || traveler.lastName || '').toUpperCase(),
    givenName: (get('givenName') || passport.givenNames || traveler.firstName || '').toUpperCase(),
    haveYouChangedName: (get('haveYouChangedName') as any) || 'No',
    previousName: get('previousName') || undefined,
    gender: (get('gender') || passport.gender || traveler.gender || 'MALE') as any,
    townCityOfBirth: (get('townCityOfBirth') || '').toUpperCase(),
    countryOfBirth: (get('countryOfBirth') || passport.issuingCountry || 'SWEDEN').toUpperCase(),
    citizenshipNationalId: get('citizenshipNationalId') || get('personnummer') || traveler.personnummer || '',
    religion: get('religion') || 'CHRISTIANITY',
    visibleIdentificationMark: get('visibleIdentificationMark') || 'NONE',
    educationalQualification: get('educationalQualification') || 'GRADUATE',

    passportNumber: (get('passportNumber') || passport.passportNumber || traveler.passportNumber || '').toUpperCase(),
    placeOfIssue: (get('placeOfIssue') || '').toUpperCase(),
    dateOfIssue: toIndiaDate(get('dateOfIssue') || ''),
    dateOfExpiry: toIndiaDate(get('dateOfExpiry') || passport.expiryDate || traveler.passportExpiry || ''),
    anyOtherPassport: (get('anyOtherPassport') as any) || 'No',
    otherPassportCountry: get('otherPassportCountry') || undefined,
    otherPassportNumber: get('otherPassportNumber') || undefined,

    // Page 2
    houseNoStreet: get('houseNoStreet') || customer.address || '',
    village: get('village') || get('city') || customer.city || '',
    city: get('city') || customer.city || '',
    state: get('state') || '',
    postalCode: get('postalCode') || customer.postalCode || '',
    phoneNo: get('phoneNo') || customer.phone || '',
    mobileNo: get('phoneNo') || customer.phone || '',

    fatherName: (get('fatherName') || '').toUpperCase(),
    fatherNationality: (get('fatherNationality') || 'SWEDEN').toUpperCase(),
    fatherPlaceOfBirth: get('fatherPlaceOfBirth') || undefined,
    fatherCountryOfBirth: (get('fatherCountryOfBirth') || '').toUpperCase() || undefined,
    motherName: (get('motherName') || '').toUpperCase(),
    motherNationality: (get('motherNationality') || 'SWEDEN').toUpperCase(),
    motherPlaceOfBirth: get('motherPlaceOfBirth') || undefined,
    motherCountryOfBirth: (get('motherCountryOfBirth') || '').toUpperCase() || undefined,

    maritalStatus: (get('maritalStatus') as any) || 'SINGLE',
    spouseName: get('spouseName') || undefined,
    spouseNationality: get('spouseNationality') || undefined,
    spousePlaceOfBirth: get('spousePlaceOfBirth') || undefined,
    spouseCountryOfBirth: get('spouseCountryOfBirth') || undefined,

    presentOccupation: get('presentOccupation') || 'BUSINESS PERSON',
    employerName: get('employerName') || '',
    employerAddress: get('employerAddress') || '',
    employerPhone: get('employerPhone') || '',
    wereYouInMilitary: (get('wereYouInMilitary') as any) || 'No',

    // Page 3
    purposeOfVisit: get('purposeOfVisit') || 'ATTEND TECHNICAL/BUSINESS MEETINGS',
    detailsOfPurpose: get('detailsOfPurpose') || '',
    placesToVisit: get('placesToVisit') || '',
    durationOfVisa: get('durationOfVisa') || '1 YEAR',
    numberOfEntries: get('numberOfEntries') || 'MULTIPLE',

    referenceNameInIndia: get('referenceNameInIndia') || '',
    referenceAddressInIndia: get('referenceAddressInIndia') || '',
    referencePhoneInIndia: get('referencePhoneInIndia') || '',

    referenceNameInHomeCountry: get('referenceNameInHomeCountry') || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
    referenceAddressInHomeCountry: get('referenceAddressInHomeCountry') || customer.address || '',
    referencePhoneInHomeCountry: get('referencePhoneInHomeCountry') || customer.phone || '',

    invitingCompanyName: get('invitingCompanyName') || '',
    invitingCompanyAddress: get('invitingCompanyAddress') || '',
    invitingCompanyPhone: get('invitingCompanyPhone') || '',

    expectedPortOfExit: get('expectedPortOfExit') || '',

    // Page 4
    haveYouVisitedIndiaBefore: (get('haveYouVisitedIndiaBefore') as any) || 'No',
    previousVisaNo: get('previousVisaNo') || undefined,
    previousVisaType: get('previousVisaType') || undefined,
    previousVisaPlaceOfIssue: get('previousVisaPlaceOfIssue') || undefined,
    previousVisaDateOfIssue: toIndiaDate(get('previousVisaDateOfIssue') || ''),
    countriesVisitedInLast10Years: get('countriesVisitedInLast10Years') || '',
    haveYouBeenRefusedVisa: (get('haveYouBeenRefusedVisa') as any) || 'No',
    refusedVisaDetails: get('refusedVisaDetails') || undefined,
    haveYouBeenDeported: (get('haveYouBeenDeported') as any) || 'No',
  };
}
