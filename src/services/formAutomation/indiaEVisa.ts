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
  
  // Convert Swedish characters å ä ö to ASCII for India portal
  function tr(s) {
    return s.replace(/å/g,'aa').replace(/Å/g,'AA')
            .replace(/ä/g,'ae').replace(/Ä/g,'AE')
            .replace(/ö/g,'oe').replace(/Ö/g,'OE');
  }
  
  function setVal(selector, value) {
    var el = document.querySelector(selector);
    if (!el) { console.warn('Not found:', selector); return false; }
    var clean = tr(value);
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value');
    if (setter && setter.set) { setter.set.call(el, clean); }
    else { el.value = clean; }
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
        radios[i].checked = true;
        radios[i].click();
        radios[i].dispatchEvent(new Event('change', { bubbles: true }));
        radios[i].dispatchEvent(new Event('input', { bubbles: true }));
        // Trigger Angular digest if present
        if (typeof angular !== 'undefined') {
          var scope = angular.element(radios[i]).scope();
          if (scope) { try { scope.$apply(); } catch(e) {} }
        }
        return true;
      }
    }
    // Fallback: try matching by label text near the radio
    for (var i = 0; i < radios.length; i++) {
      var lbl = radios[i].closest('label') || document.querySelector('label[for="' + radios[i].id + '"]');
      if (lbl && lbl.textContent.trim().toUpperCase().includes(value.toUpperCase())) {
        radios[i].checked = true;
        radios[i].click();
        radios[i].dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    console.warn('Radio not found:', name, '=', value);
    return false;
  }
  
  function clickRadioById(id) {
    var el = document.querySelector('#' + id);
    if (!el) { console.warn('Radio #' + id + ' not found'); return false; }
    el.checked = true;
    el.click();
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    if (typeof angular !== 'undefined') {
      var scope = angular.element(el).scope();
      if (scope) { try { scope.$apply(); } catch(e) {} }
    }
    return true;
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
 * Generate Registration Page script (the first page at indianvisaonline.gov.in/evisa/tvoa.html)
 * Fields: nationality, passport type, DOB, email, arrival date, visa service + purpose
 */
export function generatePage1Script(data: IndiaEVisaData): string {
  // Map visa purpose to the portal's radio button name
  // e-Business Visa purposes use evisa_purpose_31 radio group
  const purposeMap: Record<string, { radioName: string; radioValue: string }> = {
    'TO SET UP INDUSTRIAL/BUSINESS VENTURE': { radioName: 'evisa_purpose_31', radioValue: '311' },
    'SALE/PURCHASE/TRADE': { radioName: 'evisa_purpose_31', radioValue: '312' },
    'ATTEND TECHNICAL/BUSINESS MEETINGS': { radioName: 'evisa_purpose_31', radioValue: '313' },
    'TO RECRUIT MANPOWER': { radioName: 'evisa_purpose_31', radioValue: '314' },
    'PARTICIPATION IN EXHIBITIONS/BUSINESS FAIRS': { radioName: 'evisa_purpose_31', radioValue: '315' },
    'EXPERT/SPECIALIST IN CONNECTION WITH AN ONGOING PROJECT': { radioName: 'evisa_purpose_31', radioValue: '316' },
  };
  const purpose = purposeMap[(data.purposeOfVisit || data.visaSubType || 'ATTEND TECHNICAL/BUSINESS MEETINGS').toUpperCase()] 
    || purposeMap['ATTEND TECHNICAL/BUSINESS MEETINGS'];

  return `${SCRIPT_HEADER}
  // === REGISTRATION PAGE ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Nationality
  r('Nationality', setSelect('#nationality_id, [name="appl.nationality"]', '${esc(data.nationality)}'));
  
  // Passport Type
  r('Passport Type', setSelect('#ppt_type_id, [name="appl.ppt_type_id"]', '${esc(data.passportType)}'));
  
  // Port of Arrival
  r('Port of Arrival', setSelect('#port_id, [name="appl.port_id"]', '${esc(data.portOfArrival)}'));
  
  // Date of Birth
  r('Date of Birth', setDate('#dob_id, [name="appl.birthdate"]', '${esc(data.dateOfBirth)}'));
  
  // Email
  r('Email', setVal('#email_id, [name="appl.email"]', '${esc(data.emailId)}'));
  r('Re-enter Email', setVal('#email_re_id, [name="appl.email_re"]', '${esc(data.reenterEmailId || data.emailId)}'));
  
  // Visa Service — radio buttons for visa type (e-BUSINESS VISA, e-TOURIST VISA, etc.)
  r('Visa Service', (function() {
    // Try all possible selectors for the e-Business Visa radio
    var selectors = [
      'input[name="visa_ser_id"][value="31"]',
      'input[name="evisa_service"][value="31"]',
      '#visa_ser_id_31',
      '#evisa_service_31'
    ];
    for (var s = 0; s < selectors.length; s++) {
      var el = document.querySelector(selectors[s]);
      if (el) { el.checked = true; el.click(); el.dispatchEvent(new Event('change', {bubbles:true})); return true; }
    }
    // Fallback: find radio by label text containing 'Business'
    var allRadios = document.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < allRadios.length; i++) {
      var lbl = allRadios[i].closest('label') || document.querySelector('label[for="' + allRadios[i].id + '"]');
      var parent = allRadios[i].parentElement;
      var txt = (lbl ? lbl.textContent : '') + (parent ? parent.textContent : '');
      if (txt.toUpperCase().includes('BUSINESS') && txt.toUpperCase().includes('VISA')) {
        allRadios[i].checked = true;
        allRadios[i].click();
        allRadios[i].dispatchEvent(new Event('change', {bubbles:true}));
        return true;
      }
    }
    console.warn('e-Business Visa radio not found');
    return false;
  })());
  
  // Purpose radio within eBusiness — wait briefly for sub-options to appear
  r('Purpose', (function() {
    var radios = document.querySelectorAll('input[name="${purpose.radioName}"]');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].value === '${purpose.radioValue}') {
        radios[i].checked = true;
        radios[i].click();
        radios[i].dispatchEvent(new Event('change', {bubbles:true}));
        return true;
      }
    }
    // Fallback: click the first radio in the group
    if (radios.length > 0) { radios[0].checked = true; radios[0].click(); return true; }
    return false;
  })());
  
  // Expected Date of Arrival
  r('Expected Arrival', setDate('#jouryney_id, [name="appl.journeydate"]', '${esc(data.expectedDateOfArrival)}'));
${SCRIPT_FOOTER}`;
}

/**
 * Generate Page 2 script: Applicant Details (Personal + Passport)
 * This is the "BasicDetails" page after registration
 */
export function generatePage2Script(data: IndiaEVisaData): string {
  return `${SCRIPT_HEADER}
  // === PAGE 2: Applicant Details (Personal + Passport) ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Surname & Given Name
  r('Surname', setVal('#surname, [name="appl.surname"]', '${esc(data.surname)}'));
  r('Given Name', setVal('#givenName, [name="appl.applname"]', '${esc(data.givenName)}'));
  
  // Changed Name
  ${data.haveYouChangedName === 'Yes' ? `
  r('Changed Name', setCheckbox('#changedSurnameCheck', true));
  ${data.previousName ? `r('Previous Surname', setVal('#prev_surname, [name="appl.prev_surname"]', '${esc(data.previousName)}'));` : ''}
  ` : ''}
  
  // Gender
  r('Gender', setSelect('#gender, [name="appl.applsex"]', '${esc(data.gender)}'));
  
  // Birth Place & Country
  r('Birth Place', setVal('#birth_place, [name="appl.placbrth"]', '${esc(data.townCityOfBirth)}'));
  r('Country of Birth', setSelect('#country_birth, [name="appl.country_of_birth"]', '${esc(data.countryOfBirth)}'));
  
  // National ID (personnummer)
  r('National ID', setVal('#nic_number, [name="appl.nic_no"]', '${esc(data.citizenshipNationalId)}'));
  
  // Religion
  r('Religion', setSelect('#religion, [name="appl.religion"]', '${esc(data.religion)}'));
  
  // Visible Identification Mark
  r('Identification Mark', setVal('#identity_marks, [name="appl.visual_mark"]', '${esc(data.visibleIdentificationMark || 'NONE')}'));
  
  // Educational Qualification
  r('Education', (function() {
    // Try multiple selectors for the education dropdown
    var selectors = ['#education', '#edu_id', '[name="appl.edu_id"]', 'select[name="edu_id"]'];
    for (var s = 0; s < selectors.length; s++) {
      var el = document.querySelector(selectors[s]);
      if (el && el.tagName === 'SELECT') {
        var val = '${esc(data.educationalQualification)}';
        for (var i = 0; i < el.options.length; i++) {
          if (el.options[i].value.toUpperCase() === val.toUpperCase() || el.options[i].text.trim().toUpperCase() === val.toUpperCase() || el.options[i].text.trim().toUpperCase().includes(val.toUpperCase())) {
            el.selectedIndex = i;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }
    }
    // Also try radio buttons (some portal versions use radios)
    var radios = document.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < radios.length; i++) {
      var lbl = radios[i].closest('label') || document.querySelector('label[for="' + radios[i].id + '"]');
      if (lbl && lbl.textContent.trim().toUpperCase().includes('${esc(data.educationalQualification)}')) {
        radios[i].checked = true; radios[i].click(); radios[i].dispatchEvent(new Event('change', {bubbles:true}));
        return true;
      }
    }
    return setSelect('#education, #edu_id, [name="appl.edu_id"]', '${esc(data.educationalQualification)}');
  })());
  
  // Education sub-field: Qualification acquired from (College/University)
  r('Edu Detail', (function() {
    var selectors = ['#edu_detail', '#edu_detail_id', '[name="appl.edu_detail"]', 'select[name="edu_detail"]'];
    for (var s = 0; s < selectors.length; s++) {
      var el = document.querySelector(selectors[s]);
      if (el && el.tagName === 'SELECT') {
        // Try to select an option containing 'COLLEGE' or 'UNIVERSITY'
        for (var i = 0; i < el.options.length; i++) {
          var txt = el.options[i].text.trim().toUpperCase();
          if (txt.includes('COLLEGE') || txt.includes('UNIVERSITY')) {
            el.selectedIndex = i;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }
    }
    return false;
  })());
  
  // Nationality acquired by
  r('Nationality By', setSelect('#nationality_by, [name="appl.nationality_by"]', 'BIRTH'));
  
  // === Passport Details ===
  r('Passport Number', setVal('#passport_no, [name="appl.passport_number"]', '${esc(data.passportNumber)}'));
  r('Place of Issue', setVal('#passport_issue_place, [name="appl.passport_issue_place"]', '${esc(data.placeOfIssue)}'));
  r('Date of Issue', setDate('#passport_issue_date, [name="appl.passport_issue_date"]', '${esc(data.dateOfIssue)}'));
  r('Date of Expiry', setDate('#passport_expiry_date, [name="appl.passport_expiry_date"]', '${esc(data.dateOfExpiry)}'));
  
  // Other passport — radio: other_ppt_1 = Yes, other_ppt_2 = No
  r('Other Passport', (function() {
    var el = document.querySelector('${data.anyOtherPassport === 'Yes' ? '#other_ppt_1' : '#other_ppt_2'}');
    if (el) { el.click(); return true; }
    return false;
  })());
  ${data.anyOtherPassport === 'Yes' ? `
  r('Other PP Country', setSelect('#other_ppt_country_issue, [name="appl.prev_passport_country_issue"]', '${esc(data.otherPassportCountry || '')}'));
  r('Other PP Number', setVal('#other_ppt_no, [name="appl.oth_pptno"]', '${esc(data.otherPassportNumber || '')}'));
  r('Other PP Issue Date', setDate('#other_ppt_issue_date, [name="appl.previous_passport_issue_date"]', '${esc(data.otherPassportDateOfIssue || '')}'));
  r('Other PP Issue Place', setVal('#other_ppt_issue_place, [name="appl.other_ppt_issue_place"]', '${esc(data.otherPassportPlaceOfIssue || '')}'));
  r('Other PP Nationality', setSelect('#other_ppt_nat, [name="appl.other_ppt_nationality"]', '${esc(data.otherPassportNationality || '')}'));
  ` : ''}
${SCRIPT_FOOTER}`;
}

/**
 * Generate Page 3 script: Address, Family & Profession
 * This is the second form page after BasicDetails
 */
export function generatePage3Script(data: IndiaEVisaData): string {
  return `${SCRIPT_HEADER}
  // === PAGE 3: Address, Family & Profession ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Present Address
  r('Address Line 1', setVal('#pres_add1, [name="appl.pres_add1"]', '${esc(data.houseNoStreet)}'));
  r('Address Line 2', setVal('#pres_add2, [name="appl.pres_add2"]', '${esc(data.village || data.city)}'));
  r('Country', setSelect('#pres_country, [name="appl.pres_country"]', 'SWEDEN'));
  r('State/Province', setVal('#pres_add3, [name="appl.state_name"]', '${esc(data.state)}'));
  r('Postal Code', setVal('#pincode, [name="appl.pincode"]', '${esc(data.postalCode)}'));
  r('Phone', setVal('#pres_phone, [name="appl.pres_phone"]', '${esc(data.phoneNo)}'));
  r('Mobile', setVal('#mobile, [name="appl.mobile"]', '${esc(data.mobileNo || data.phoneNo)}'));
  
  // Same as permanent address
  r('Same Address', setCheckbox('#sameAddress_id', true));
  
  // Father
  r('Father Name', setVal('#fthrname, [name="appl.fthrname"]', '${esc(data.fatherName)}'));
  r('Father Nationality', setSelect('#father_nationality, [name="appl.father_nationality"]', '${esc(data.fatherNationality)}'));
  r('Father Prev Nationality', setSelect('#father_previous_nationality, [name="appl.father_previous_nationality"]', '${esc(data.fatherPreviousNationality || data.fatherNationality)}'));
  ${data.fatherPlaceOfBirth ? `r('Father Birth Place', setVal('#father_place_of_birth, [name="appl.father_place_of_birth"]', '${esc(data.fatherPlaceOfBirth)}'));` : ''}
  ${data.fatherCountryOfBirth ? `r('Father Birth Country', setSelect('#father_country_of_birth, [name="appl.father_country_of_birth"]', '${esc(data.fatherCountryOfBirth)}'));` : ''}
  
  // Mother
  r('Mother Name', setVal('#mother_name, [name="appl.mother_name"]', '${esc(data.motherName)}'));
  r('Mother Nationality', setSelect('#mother_nationality, [name="appl.mother_nationality"]', '${esc(data.motherNationality)}'));
  r('Mother Prev Nationality', setSelect('#mother_previous_nationality, [name="appl.mother_previous_nationality"]', '${esc(data.motherPreviousNationality || data.motherNationality)}'));
  ${data.motherPlaceOfBirth ? `r('Mother Birth Place', setVal('#mother_place_of_birth, [name="appl.mother_place_of_birth"]', '${esc(data.motherPlaceOfBirth)}'));` : ''}
  ${data.motherCountryOfBirth ? `r('Mother Birth Country', setSelect('#mother_country_of_birth, [name="appl.mother_country_of_birth"]', '${esc(data.motherCountryOfBirth)}'));` : ''}
  
  // Marital Status
  r('Marital Status', setSelect('#marital_status, [name="appl.marital_status"]', '${esc(data.maritalStatus)}'));
  ${data.maritalStatus === 'MARRIED' && data.spouseName ? `
  r('Spouse Name', setVal('#spouse_name, [name="appl.spouse_name"]', '${esc(data.spouseName)}'));
  r('Spouse Nationality', setSelect('#spouse_nationality, [name="appl.spouse_nationality"]', '${esc(data.spouseNationality || '')}'));
  r('Spouse Prev Nationality', setSelect('#spouse_previous_nationality, [name="appl.spouse_previous_nationality"]', '${esc(data.spousePreviousNationality || data.spouseNationality || '')}'));
  ${data.spousePlaceOfBirth ? `r('Spouse Birth Place', setVal('#spouse_place_of_birth, [name="appl.spouse_place_of_birth"]', '${esc(data.spousePlaceOfBirth)}'));` : ''}
  ${data.spouseCountryOfBirth ? `r('Spouse Birth Country', setSelect('#spouse_country_of_birth, [name="appl.spouse_country_of_birth"]', '${esc(data.spouseCountryOfBirth)}'));` : ''}
  ` : ''}
  
  // Grandparent — No
  r('Grandparent Indian', (function() {
    var el = document.querySelector('#grandparent_flag2');
    if (el) { el.click(); return true; }
    return false;
  })());
  
  // Have you lived for at least two years in the country where you are applying visa?
  r('Lived 2 Years', (function() {
    // Try common radio IDs
    var yesIds = ['#lived_flag1', '#lived_2yr_yes', '#livedTwoYears_yes'];
    var noIds = ['#lived_flag2', '#lived_2yr_no', '#livedTwoYears_no'];
    var ids = 'Yes' === 'Yes' ? yesIds : noIds;
    for (var i = 0; i < ids.length; i++) {
      var el = document.querySelector(ids[i]);
      if (el) { el.checked = true; el.click(); el.dispatchEvent(new Event('change', {bubbles:true})); return true; }
    }
    // Fallback: find radio by nearby label text
    var allRadios = document.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < allRadios.length; i++) {
      var lbl = allRadios[i].closest('label') || document.querySelector('label[for="' + allRadios[i].id + '"]');
      var parent = allRadios[i].closest('div');
      var ctx = (parent ? parent.textContent : '') + (lbl ? lbl.textContent : '');
      if (ctx.toUpperCase().includes('LIVED') && ctx.toUpperCase().includes('TWO YEARS') || ctx.toUpperCase().includes('AT LEAST TWO')) {
        // Found the question context, now pick Yes radio
        var name = allRadios[i].name;
        var group = document.querySelectorAll('input[name="' + name + '"]');
        for (var j = 0; j < group.length; j++) {
          if (group[j].value.toUpperCase() === 'Y' || group[j].value === '1' || group[j].value.toUpperCase() === 'YES') {
            group[j].checked = true; group[j].click(); group[j].dispatchEvent(new Event('change', {bubbles:true}));
            return true;
          }
        }
        // If values are not Y/N, click the first one (usually Yes)
        if (group.length >= 1) { group[0].checked = true; group[0].click(); group[0].dispatchEvent(new Event('change', {bubbles:true})); return true; }
      }
    }
    return false;
  })());
  
  // Profession / Present Occupation
  r('Occupation', (function() {
    var val = '${esc(data.presentOccupation)}';
    var selectors = ['#occupation', '#occupation_id', '[name="appl.occupation"]', 'select[name="occupation"]'];
    for (var s = 0; s < selectors.length; s++) {
      var el = document.querySelector(selectors[s]);
      if (el && el.tagName === 'SELECT') {
        // Exact match first
        for (var i = 0; i < el.options.length; i++) {
          if (el.options[i].text.trim().toUpperCase() === val.toUpperCase()) {
            el.selectedIndex = i; el.dispatchEvent(new Event('change', {bubbles:true})); return true;
          }
        }
        // Partial match
        for (var i = 0; i < el.options.length; i++) {
          if (el.options[i].text.trim().toUpperCase().includes(val.toUpperCase()) || val.toUpperCase().includes(el.options[i].text.trim().toUpperCase())) {
            el.selectedIndex = i; el.dispatchEvent(new Event('change', {bubbles:true})); return true;
          }
        }
      }
    }
    return setSelect('#occupation, [name="appl.occupation"]', val);
  })());
  ${data.employerName ? `r('Employer Name', setVal('#empname, [name="appl.empname"]', '${esc(data.employerName)}'));` : ''}
  ${data.employerAddress ? `r('Employer Address', setVal('#empaddress, [name="appl.empaddress"]', '${esc(data.employerAddress)}'));` : ''}
  ${data.employerPhone ? `r('Employer Phone', setVal('#empphone, [name="appl.empphone"]', '${esc(data.employerPhone)}'));` : ''}
  
  // Military/Semi-military — radio: prev_org1 = Yes, prev_org2 = No
  r('Military Service', (function() {
    var el = document.querySelector('${data.wereYouInMilitary === 'Yes' ? '#prev_org1' : '#prev_org2'}');
    if (el) { el.checked = true; el.click(); el.dispatchEvent(new Event('change', {bubbles:true})); return true; }
    return false;
  })());
${SCRIPT_FOOTER}`;
}

/**
 * Generate Page 4 script: Travel Details, Previous Visa, References & Other Info
 * This is the third form page — combines travel, visa history, and references
 */
export function generatePage4Script(data: IndiaEVisaData): string {
  return `${SCRIPT_HEADER}
  // === PAGE 4: Travel Details, Previous Visa & References ===
  // Traveler: ${esc(data.givenName)} ${esc(data.surname)}
  
  // Places to visit
  r('Place to Visit 1', setVal('#placesToBeVisited1_id, [name="appl.placesToBeVisited1"]', '${esc(data.placesToVisit || '')}'));
  
  // Hotel booking — No
  r('Hotel Booked', (function() {
    var el = document.querySelector('#haveYouBookedRoomInHotel_no_id');
    if (el) { el.click(); return true; }
    return false;
  })());
  
  // Business visa service request fields (visa_serreq_id_*)
  // These are dynamic fields for eBusiness purpose details
  ${data.detailsOfPurpose ? `r('Purpose Details', setVal('#visa_serreq_id_20', '${esc(data.detailsOfPurpose)}'));` : ''}
  ${data.invitingCompanyName ? `r('Company Name', setVal('#visa_serreq_id_26', '${esc(data.invitingCompanyName)}'));` : ''}
  ${data.invitingCompanyAddress ? `r('Company Address', setVal('#visa_serreq_id_27', '${esc(data.invitingCompanyAddress)}'));` : ''}
  ${data.invitingCompanyPhone ? `r('Company Phone', setVal('#visa_serreq_id_29', '${esc(data.invitingCompanyPhone)}'));` : ''}
  
  // Port of Exit
  ${data.expectedPortOfExit ? `r('Port of Exit', setSelect('#exitpoint, [name="appl.exitpoint"]', '${esc(data.expectedPortOfExit)}'));` : ''}
  
  // === Previous India Visit ===
  r('Visited India Before', (function() {
    var el = document.querySelector('${data.haveYouVisitedIndiaBefore === 'Yes' ? '#old_visa_flag1' : '#old_visa_flag2'}');
    if (el) { el.click(); return true; }
    return false;
  })());
  ${data.haveYouVisitedIndiaBefore === 'Yes' ? `
  ${data.previousVisaNo ? `r('Previous Visa No', setVal('#old_visa_no, [name="appl.old_visa_no"]', '${esc(data.previousVisaNo)}'));` : ''}
  ${data.previousVisaType ? `r('Previous Visa Type', setSelect('#old_visa_type_id, [name="appl.old_visa_type_id"]', '${esc(data.previousVisaType)}'));` : ''}
  ${data.previousVisaPlaceOfIssue ? `r('Previous Visa Place', setVal('#oldvisaissueplace, [name="appl.oldvisaissueplace"]', '${esc(data.previousVisaPlaceOfIssue)}'));` : ''}
  ${data.previousVisaDateOfIssue ? `r('Previous Visa Date', setDate('#oldvisaissuedate, [name="appl.oldvisaissuedate"]', '${esc(data.previousVisaDateOfIssue)}'));` : ''}
  ` : ''}
  
  // Visa refusal
  r('Visa Refused', (function() {
    var el = document.querySelector('${data.haveYouBeenRefusedVisa === 'Yes' ? '#refuse_flag1' : '#refuse_flag2'}');
    if (el) { el.click(); return true; }
    return false;
  })());
  ${data.haveYouBeenRefusedVisa === 'Yes' && data.refusedVisaDetails ? `r('Refusal Details', setVal('#refuse_details, [name="appl.refuse_details"]', '${esc(data.refusedVisaDetails)}'));` : ''}
  
  // Countries visited in last 10 years (multi-select)
  ${data.countriesVisitedInLast10Years ? `r('Countries Visited', (function() {
    var sel = document.querySelector('#country_visited');
    if (!sel) return false;
    var countries = '${esc(data.countriesVisitedInLast10Years)}'.split(',').map(function(s) { return s.trim().toUpperCase(); });
    for (var i = 0; i < sel.options.length; i++) {
      var optText = sel.options[i].text.trim().toUpperCase();
      if (countries.some(function(c) { return optText.includes(c) || c.includes(optText); })) {
        sel.options[i].selected = true;
      }
    }
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })());` : ''}
  
  // SAARC — No
  r('SAARC Visited', (function() {
    var el = document.querySelector('#saarc_flag2');
    if (el) { el.click(); return true; }
    return false;
  })());
  
  // === References ===
  // Reference in India
  r('Ref Name (India)', setVal('#nameofsponsor_ind, [name="appl.nameofsponsor_ind"]', '${esc(data.referenceNameInIndia)}'));
  r('Ref Address (India)', setVal('#add1ofsponsor_ind, [name="appl.add1ofsponsor_ind"]', '${esc(data.referenceAddressInIndia)}'));
  r('Ref Phone (India)', setVal('#phoneofsponsor_ind, [name="appl.phoneofsponsor_ind"]', '${esc(data.referencePhoneInIndia)}'));
  
  // Reference in home country
  r('Ref Name (Home)', setVal('#nameofsponsor_msn, [name="appl.nameofsponsor_msn"]', '${esc(data.referenceNameInHomeCountry)}'));
  r('Ref Address (Home)', setVal('#add1ofsponsor_msn, [name="appl.add1ofsponsor_msn"]', '${esc(data.referenceAddressInHomeCountry)}'));
  r('Ref Phone (Home)', setVal('#phoneofsponsor_msn, [name="appl.phoneofsponsor_msn"]', '${esc(data.referencePhoneInHomeCountry)}'));
${SCRIPT_FOOTER}`;
}

/**
 * Generate ALL page scripts as an array
 */
export function generateAllPageScripts(data: IndiaEVisaData): { page: number; title: string; script: string }[] {
  return [
    { page: 1, title: 'Registration Page', script: generatePage1Script(data) },
    { page: 2, title: 'Personal & Passport Details', script: generatePage2Script(data) },
    { page: 3, title: 'Address, Family & Profession', script: generatePage3Script(data) },
    { page: 4, title: 'Travel, Visa History & References', script: generatePage4Script(data) },
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
