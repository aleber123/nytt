/**
 * Nigeria e-Visa Auto-fill Script
 *
 * Generates a JavaScript snippet that can be pasted into the browser console
 * on the Nigerian e-visa website (https://evisa.immigration.gov.ng) to
 * auto-fill Steps 2–4 (Biodata, Travel Information, Contact/Hotel).
 *
 * Step 1 (General Information) uses Angular Material mat-select dropdowns
 * which require a different interaction (click → panel → option click).
 * The generated script handles this via a special matSelect() helper.
 *
 * Steps 5 (Supporting Documents) must be uploaded manually.
 * Steps 6–7 (Travel History, Security) default all radio buttons to "No".
 *
 * The form uses standard HTML inputs with `name` attributes inside an
 * Angular app. Fields are targeted via document.querySelector('[name="..."]').
 */

export interface NigeriaEVisaData {
  // Step 1 — General Information (mat-select dropdowns)
  nationality: string;         // e.g. "Sweden"
  classOfVisa: string;         // e.g. "F4A - Business" or "F4B - Business Visa (Multiple Entry)"
  passportType: string;        // e.g. "Standard"

  // Step 2 — Biodata
  title: string;               // "Mr", "Mrs", "Miss", "Dr", etc.
  lastName: string;
  firstName: string;
  middleName: string;
  dateOfBirthDay: string;      // "15"
  dateOfBirthMonth: string;    // "Jun" or month number
  dateOfBirthYear: string;     // "1990"
  placeOfBirth: string;        // City name
  gender: string;              // "Male" or "Female"
  maritalStatus: string;       // "Single", "Married", etc.
  passportNumber: string;
  passportExpiryDate: string;  // dd/mm/yyyy
  hasNigerianPassport: boolean;

  // Step 3 — Travel Information
  purposeOfJourney: string;    // "Business", "Tourism", etc.
  travelCarrier: string;       // Airline/shipping company name
  flightNumber: string;
  countryOfDeparture: string;  // Country name for dropdown
  departureDate: string;       // dd/mm/yyyy
  arrivalDate: string;         // dd/mm/yyyy
  arrivalChannel: string;      // "Air", "Sea", "Land"
  durationOfStay: string;      // Number of days
  portOfEntry: string;         // e.g. "Murtala Mohammed Airport, Lagos"

  // Step 4 — Contact/Hotel details in Nigeria
  contactName: string;         // Hotel name or contact person
  contactPhone: string;        // Nigerian phone (without +234 prefix)
  contactAddress: string;
  contactCity: string;
  contactState: string;        // Nigerian state dropdown
  contactEmail: string;
  contactPostalCode: string;
}

/**
 * Convert ISO date (YYYY-MM-DD) to Nigerian format (DD/MM/YYYY)
 */
function toNigeriaDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Extract day, month name, and year from an ISO date
 */
function splitDate(isoDate: string): { day: string; month: string; year: string } {
  if (!isoDate) return { day: '', month: '', year: '' };
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return { day: '', month: '', year: '' };
  const monthIdx = parseInt(parts[1], 10) - 1;
  return {
    day: String(parseInt(parts[2], 10)),
    month: months[monthIdx] || parts[1],
    year: parts[0],
  };
}

/**
 * Build NigeriaEVisaData from order + traveler + form submission data
 */
export function buildNigeriaVisaDataFromOrder(
  order: any,
  travelerIndex: number,
  formSubmissionData?: Record<string, string>
): NigeriaEVisaData | null {
  const travelers = order.travelers || [];
  const traveler = travelers[travelerIndex];
  if (!traveler) return null;

  const fd = formSubmissionData || {};
  const passport = traveler.passportData || {};
  const customer = order.customerInfo || {};

  const get = (fieldId: string) =>
    fd[`${fieldId}_${travelerIndex}`] || fd[fieldId] || '';

  const dob = splitDate(
    get('dateOfBirth') || passport.dateOfBirth || traveler.dateOfBirth || ''
  );
  const gender = (get('gender') || get('sex') || passport.gender || traveler.gender || '').toLowerCase();
  const expiryDate = get('passportExpiryDate') || get('dateOfExpiry') || passport.expiryDate || traveler.passportExpiry || '';

  return {
    // Step 1
    nationality: get('nationality') || order.nationality || 'Sweden',
    classOfVisa: get('classOfVisa') || 'F4A - Business',
    passportType: get('passportType') || 'Standard',

    // Step 2
    title: get('title') || (gender.startsWith('f') ? 'Mrs' : 'Mr'),
    lastName: get('lastName') || get('surname') || passport.surname || traveler.lastName || '',
    firstName: get('firstName') || get('givenNames') || passport.givenNames || traveler.firstName || '',
    middleName: get('middleName') || '',
    dateOfBirthDay: dob.day,
    dateOfBirthMonth: dob.month,
    dateOfBirthYear: dob.year,
    placeOfBirth: get('placeOfBirth') || get('placeOfBirthCity') || '',
    gender: gender.startsWith('f') ? 'Female' : 'Male',
    maritalStatus: get('maritalStatus') || get('civilStatus') || 'Single',
    passportNumber: get('passportNumber') || passport.passportNumber || traveler.passportNumber || '',
    passportExpiryDate: toNigeriaDate(expiryDate),
    hasNigerianPassport: false,

    // Step 3
    purposeOfJourney: get('purposeOfJourney') || get('purposeOfVisit') || 'Business',
    travelCarrier: get('travelCarrier') || get('airlineName') || '',
    flightNumber: get('flightNumber') || '',
    countryOfDeparture: get('countryOfDeparture') || 'Sweden',
    departureDate: toNigeriaDate(get('departureDate') || order.departureDate || ''),
    arrivalDate: toNigeriaDate(get('arrivalDate') || order.departureDate || ''),
    arrivalChannel: get('arrivalChannel') || 'Air',
    durationOfStay: get('durationOfStay') || '30',
    portOfEntry: get('portOfEntry') || 'Murtala Mohammed Airport, Lagos',

    // Step 4
    contactName: get('contactName') || get('hotelName') || '',
    contactPhone: get('contactPhone') || '',
    contactAddress: get('contactAddress') || get('hotelAddress') || '',
    contactCity: get('contactCity') || '',
    contactState: get('contactState') || '',
    contactEmail: get('contactEmail') || customer.email || '',
    contactPostalCode: get('contactPostalCode') || '',
  };
}

/**
 * Generate a console script that auto-fills the Nigeria e-visa form.
 *
 * The script contains functions for each step so the operator can run
 * them one at a time as they navigate through the form tabs.
 */
export function generateNigeriaAutoFillScript(data: NigeriaEVisaData): string {
  const esc = (s: string) => (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

  return `
// ============================================================
// NIGERIA E-VISA AUTO-FILL SCRIPT
// Generated: ${new Date().toISOString()}
// Applicant: ${data.firstName} ${data.lastName}
// ============================================================

// Helper: set input value by name and trigger Angular change detection
function setByName(name, value) {
  const el = document.querySelector('[name="' + name + '"]');
  if (!el) { console.warn('⚠️ Field not found:', name); return; }
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
  console.log('✅', name, '=', value);
}

// Helper: set select dropdown by name (match option text)
function setSelectByName(name, value) {
  const el = document.querySelector('[name="' + name + '"]');
  if (!el) { console.warn('⚠️ Select not found:', name); return; }
  let found = false;
  for (const opt of el.options) {
    const txt = opt.textContent.trim();
    if (opt.value === value || txt.toLowerCase() === value.toLowerCase()) {
      el.value = opt.value; found = true; break;
    }
  }
  if (!found) {
    for (const opt of el.options) {
      if (opt.textContent.trim().toLowerCase().includes(value.toLowerCase())) {
        el.value = opt.value; found = true; break;
      }
    }
  }
  if (!found) { console.warn('⚠️ Option not found for', name, ':', value); el.value = value; }
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  console.log('✅', name, '=', value);
}

// Helper: click radio button by ID
function clickRadio(id) {
  const el = document.getElementById(id);
  if (!el) { console.warn('⚠️ Radio not found:', id); return; }
  el.click();
  el.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('✅ Radio:', id);
}

// Helper: set Angular Material mat-select (click to open, then select option)
function setMatSelect(index, optionText) {
  const selects = document.querySelectorAll('mat-select');
  const sel = selects[index];
  if (!sel) { console.warn('⚠️ mat-select[' + index + '] not found'); return; }
  sel.click();
  setTimeout(() => {
    const panel = document.querySelector('.mat-select-panel, .mat-mdc-select-panel');
    if (!panel) { console.warn('⚠️ Panel not found for mat-select[' + index + ']'); return; }
    const options = panel.querySelectorAll('mat-option, .mat-option, .mat-mdc-option');
    let found = false;
    for (const opt of options) {
      const txt = opt.textContent.trim();
      if (txt.toLowerCase() === optionText.toLowerCase() || txt.toLowerCase().includes(optionText.toLowerCase())) {
        opt.click(); found = true;
        console.log('✅ mat-select[' + index + '] =', txt);
        break;
      }
    }
    if (!found) console.warn('⚠️ Option not found in mat-select[' + index + ']:', optionText);
  }, 300);
}

// ────────────────────────────────────────────────────────────
// STEP 1: General Information (run on Step 1 page)
// ────────────────────────────────────────────────────────────
function fillStep1() {
  console.log('\\n📋 Step 1: General Information');
  setMatSelect(0, '${esc(data.nationality)}');
  setTimeout(() => setMatSelect(1, '${esc(data.classOfVisa)}'), 500);
  setTimeout(() => setMatSelect(2, '${esc(data.passportType)}'), 1000);
  console.log('⏳ Wait 2 seconds then click Continue');
}

// ────────────────────────────────────────────────────────────
// STEP 2: Biodata (run on Step 2 page)
// ────────────────────────────────────────────────────────────
function fillStep2() {
  console.log('\\n📋 Step 2: Biodata');
  setSelectByName('title', '${esc(data.title)}');
  setByName('lastName', '${esc(data.lastName)}');
  setByName('firstName', '${esc(data.firstName)}');
  setByName('middleName', '${esc(data.middleName)}');
  setByName('dateOfBirthDay', '${esc(data.dateOfBirthDay)}');
  setSelectByName('dateOfBirthMonth', '${esc(data.dateOfBirthMonth)}');
  setByName('dateOfBirthYear', '${esc(data.dateOfBirthYear)}');
  setByName('placeOfBirth', '${esc(data.placeOfBirth)}');
  setSelectByName('gender', '${esc(data.gender)}');
  setSelectByName('maritalStatus', '${esc(data.maritalStatus)}');
  setByName('passportNumber', '${esc(data.passportNumber)}');
  setByName('passportExpiryDate', '${esc(data.passportExpiryDate)}');
  clickRadio('${data.hasNigerianPassport ? 'convictionsYes' : 'convictionsNo'}');
  console.log('✅ Step 2 complete — verify photo upload manually');
}

// ────────────────────────────────────────────────────────────
// STEP 3: Travel Information (run on Step 3 page)
// ────────────────────────────────────────────────────────────
function fillStep3() {
  console.log('\\n📋 Step 3: Travel Information');
  setByName('journeyPurpose', '${esc(data.purposeOfJourney)}');
  setByName('airlineName', '${esc(data.travelCarrier)}');
  setByName('flightNumber', '${esc(data.flightNumber)}');
  setByName('expectedDepartureDate', '${esc(data.departureDate)}');
  setByName('expectedArrivalDate', '${esc(data.arrivalDate)}');
  setSelectByName('arrivalChannel', '${esc(data.arrivalChannel)}');
  setByName('durationOfStay', '${esc(data.durationOfStay)}');
  // Country of Departure and Port of Entry may be mat-selects
  // Try standard select first, fall back to mat-select
  try { setSelectByName('countryOfDeparture', '${esc(data.countryOfDeparture)}'); } catch(e) {}
  try { setSelectByName('portOfEntry', '${esc(data.portOfEntry)}'); } catch(e) {}
  console.log('✅ Step 3 complete — verify Country of Departure and Port of Entry');
}

// ────────────────────────────────────────────────────────────
// STEP 4: Contact/Hotel details in Nigeria (run on Step 4 page)
// ────────────────────────────────────────────────────────────
function fillStep4() {
  console.log('\\n📋 Step 4: Contact/Hotel details in Nigeria');
  setByName('contactName', '${esc(data.contactName)}');
  setByName('contactPhone', '${esc(data.contactPhone)}');
  setByName('contactAddress', '${esc(data.contactAddress)}');
  setByName('contactCity', '${esc(data.contactCity)}');
  try { setSelectByName('contactState', '${esc(data.contactState)}'); } catch(e) {}
  setByName('contactEmail', '${esc(data.contactEmail)}');
  setByName('contactPostalCode', '${esc(data.contactPostalCode)}');
  console.log('✅ Step 4 complete');
}

// ────────────────────────────────────────────────────────────
// STEP 6: Travel History — default all to "No"
// ────────────────────────────────────────────────────────────
function fillStep6() {
  console.log('\\n📋 Step 6: Travel History — defaulting all to No');
  document.querySelectorAll('input[type="radio"]').forEach(r => {
    if (r.id && r.id.toLowerCase().includes('no') && !r.checked) {
      r.click();
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  // Fallback: check all "No" radios by value
  document.querySelectorAll('input[type="radio"][value="No"], input[type="radio"][value="no"]').forEach(r => {
    if (!r.checked) { r.click(); r.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  console.log('✅ Step 6 complete — verify all answers are "No"');
}

// ────────────────────────────────────────────────────────────
// STEP 7: Security and Criminal History — default all to "No"
// ────────────────────────────────────────────────────────────
function fillStep7() {
  console.log('\\n📋 Step 7: Security — defaulting all to No');
  document.querySelectorAll('input[type="radio"]').forEach(r => {
    if (r.id && r.id.toLowerCase().includes('no') && !r.checked) {
      r.click();
      r.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  document.querySelectorAll('input[type="radio"][value="No"], input[type="radio"][value="no"]').forEach(r => {
    if (!r.checked) { r.click(); r.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  console.log('✅ Step 7 complete — verify all answers are "No"');
}

// ============================================================
// RUN: Call the function matching your current step
// ============================================================
// fillStep1();  // ← Run on Step 1 (General Information)
// fillStep2();  // ← Run on Step 2 (Biodata)
// fillStep3();  // ← Run on Step 3 (Travel Information)
// fillStep4();  // ← Run on Step 4 (Contact/Hotel)
// fillStep6();  // ← Run on Step 6 (Travel History — all "No")
// fillStep7();  // ← Run on Step 7 (Security — all "No")

// Auto-detect current step and fill:
(function autoFill() {
  const heading = document.body.innerText.substring(0, 2000);
  if (heading.includes('Step 1') || heading.includes('General Information')) { fillStep1(); }
  else if (heading.includes('Step 2') || heading.includes('Biodata')) { fillStep2(); }
  else if (heading.includes('Step 3') || heading.includes('Travel Information')) { fillStep3(); }
  else if (heading.includes('Step 4') || heading.includes('Contact')) { fillStep4(); }
  else if (heading.includes('Step 6') || heading.includes('Travel History')) { fillStep6(); }
  else if (heading.includes('Step 7') || heading.includes('Security')) { fillStep7(); }
  else { console.log('🔍 Could not detect step — call fillStep1() through fillStep7() manually'); }
})();
`.trim();
}
