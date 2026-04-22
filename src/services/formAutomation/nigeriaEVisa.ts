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
 * Steps 6–7 (Travel History, Security) read the customer's Yes/No answers
 * from the form submission, click the matching radio for each question,
 * and fill the paired details textarea when the answer is Yes.
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

  // Step 6 — Travel History (Yes/No + details text)
  previousVisaNigeria: 'Yes' | 'No';
  previousVisaDetails: string;
  travelledToNigeria: 'Yes' | 'No';
  travelledToNigeriaDetails: string;
  refusedEntryNigeria: 'Yes' | 'No';
  refusedEntryDetails: string;
  refusedVisaAnyCountry: 'Yes' | 'No';
  refusedVisaDetails: string;
  deportedFromAnyCountry: 'Yes' | 'No';
  deportedDetails: string;
  travelledOutsideResidence: 'Yes' | 'No';
  travelledOutsideDetails: string;

  // Step 7 — Security and Criminal History (Yes/No + details text)
  criminalConvictions: 'Yes' | 'No';
  criminalConvictionDetails: string;
  criminalCharges: 'Yes' | 'No';
  criminalChargeDetails: string;
  terroristActivities: 'Yes' | 'No';
  terroristActivityDetails: string;
  terroristViews: 'Yes' | 'No';
  terroristViewDetails: string;
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

    // Step 6 — Travel History (default to No when not answered)
    previousVisaNigeria: yesNo(get('previousVisaNigeria')),
    previousVisaDetails: get('previousVisaDetails') || '',
    travelledToNigeria: yesNo(get('travelledToNigeria')),
    travelledToNigeriaDetails: get('travelledToNigeriaDetails') || '',
    refusedEntryNigeria: yesNo(get('refusedEntryNigeria')),
    refusedEntryDetails: get('refusedEntryDetails') || '',
    refusedVisaAnyCountry: yesNo(get('refusedVisaAnyCountry')),
    refusedVisaDetails: get('refusedVisaDetails') || '',
    deportedFromAnyCountry: yesNo(get('deportedFromAnyCountry')),
    deportedDetails: get('deportedDetails') || '',
    travelledOutsideResidence: yesNo(get('travelledOutsideResidence')),
    travelledOutsideDetails: get('travelledOutsideDetails') || '',

    // Step 7 — Security and Criminal History (default to No when not answered)
    criminalConvictions: yesNo(get('criminalConvictions')),
    criminalConvictionDetails: get('criminalConvictionDetails') || '',
    criminalCharges: yesNo(get('criminalCharges')),
    criminalChargeDetails: get('criminalChargeDetails') || '',
    terroristActivities: yesNo(get('terroristActivities')),
    terroristActivityDetails: get('terroristActivityDetails') || '',
    terroristViews: yesNo(get('terroristViews')),
    terroristViewDetails: get('terroristViewDetails') || '',
  };
}

/**
 * Normalize a form value to strict 'Yes' | 'No' (defaults to 'No').
 */
function yesNo(value: string | undefined): 'Yes' | 'No' {
  return (value || '').trim().toLowerCase() === 'yes' ? 'Yes' : 'No';
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

// Helper: set input value by name and trigger Angular change detection.
// Picks the correct prototype setter for <textarea> vs <input> — using
// HTMLInputElement's setter on a textarea throws "Illegal invocation".
function setByName(name, value) {
  const el = document.querySelector('[name="' + name + '"]');
  if (!el) { console.warn('⚠️ Field not found:', name); return; }
  const proto = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
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

// Helper: pick an Angular Material mat-select option.
// IMPORTANT: the mat-select host ignores .click() in modern Angular Material —
// we must click the inner .mat-select-trigger. We also poll for the dropdown
// panel (with retries) and find it via aria-owns so each mat-select's own
// panel is targeted (avoids reading a previous, still-closing panel).
async function matSelectPick(sel, optionText) {
  if (!sel) { console.warn('⚠️ mat-select missing'); return false; }
  // Close any stray open panel first
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 200));
  const trigger =
    sel.querySelector('.mat-select-trigger') ||
    sel.querySelector('.mat-mdc-select-trigger') ||
    sel.querySelector('[role="combobox"]') ||
    sel;
  trigger.click();
  // Poll for the panel up to 2s
  const panelId = sel.getAttribute('aria-owns') || sel.getAttribute('aria-controls');
  const start = Date.now();
  let panel = null;
  while (Date.now() - start < 2000) {
    await new Promise(r => requestAnimationFrame(r));
    panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) {
      const list = document.querySelectorAll('.mat-select-panel, .mat-mdc-select-panel, .cdk-overlay-pane');
      panel = list[list.length - 1] || null;
    }
    if (panel && panel.querySelector('mat-option, .mat-option, .mat-mdc-option, [role="option"]')) break;
  }
  if (!panel) { console.warn('⚠️ panel never appeared'); return false; }
  const options = panel.querySelectorAll('mat-option, .mat-option, .mat-mdc-option, [role="option"]');
  const wanted = optionText.toLowerCase();
  let match = null;
  for (const opt of options) {
    if (opt.textContent.trim().toLowerCase() === wanted) { match = opt; break; }
  }
  if (!match) {
    for (const opt of options) {
      if (opt.textContent.trim().toLowerCase().includes(wanted)) { match = opt; break; }
    }
  }
  if (match) {
    match.click();
    console.log('✅ mat-select =', match.textContent.trim());
    return true;
  }
  console.warn('⚠️ option not found:', optionText);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  return false;
}

// Helper: find mat-select by its visible mat-label text. Used for fields
// where we don't know the index but know the label (e.g. "Country of
// Departure", "Port of Entry", "State").
async function setMatSelectByLabel(labelText, optionText) {
  let targetSel = null;
  for (const sel of document.querySelectorAll('mat-select')) {
    const label = sel.closest('mat-form-field')?.querySelector('mat-label')?.textContent?.trim() || '';
    if (label.toLowerCase().includes(labelText.toLowerCase())) { targetSel = sel; break; }
  }
  if (!targetSel) {
    // Secondary: scan generic labels
    const labels = document.querySelectorAll('mat-label, label');
    for (const lbl of labels) {
      if (lbl.textContent.trim().toLowerCase().includes(labelText.toLowerCase())) {
        const ff = lbl.closest('mat-form-field') || lbl.parentElement;
        const sel = ff?.querySelector('mat-select');
        if (sel) { targetSel = sel; break; }
      }
    }
  }
  if (!targetSel) { console.warn('⚠️ mat-select not found for label:', labelText); return false; }
  console.log('→ matching mat-select for label:', labelText);
  return matSelectPick(targetSel, optionText);
}

// Helper: pick mat-select by positional index (Step 1 uses this).
async function setMatSelectByIndex(index, optionText) {
  const sel = document.querySelectorAll('mat-select')[index];
  return matSelectPick(sel, optionText);
}

// ────────────────────────────────────────────────────────────
// STEP 1: General Information (run on Step 1 page)
// ────────────────────────────────────────────────────────────
// Nigeria's form is cascading: Class Of Visa only loads after Nationality
// is selected. We must await each pick and wait ~2.5s for the next dropdown
// to populate before clicking it.
async function fillStep1() {
  console.log('\\n📋 Step 1: General Information');
  await setMatSelectByIndex(0, '${esc(data.nationality)}');
  console.log('⏳ waiting for Class Of Visa options to load…');
  await new Promise(r => setTimeout(r, 2500));
  await setMatSelectByIndex(1, '${esc(data.classOfVisa)}');
  await new Promise(r => setTimeout(r, 800));
  await setMatSelectByIndex(2, '${esc(data.passportType)}');
  console.log('✅ Step 1 done — click Continue');
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
async function fillStep3() {
  console.log('\\n📋 Step 3: Travel Information');
  setByName('journeyPurpose', '${esc(data.purposeOfJourney)}');
  setByName('airlineName', '${esc(data.travelCarrier)}');
  setByName('flightNumber', '${esc(data.flightNumber)}');
  setByName('expectedDepartureDate', '${esc(data.departureDate)}');
  setByName('expectedArrivalDate', '${esc(data.arrivalDate)}');
  setSelectByName('arrivalChannel', '${esc(data.arrivalChannel)}');
  setByName('durationOfStay', '${esc(data.durationOfStay)}');
  // Country of Departure and Port of Entry are mat-selects — look them
  // up by their mat-label text instead of [name].
  await setMatSelectByLabel('Country of Departure', '${esc(data.countryOfDeparture)}');
  await new Promise(r => setTimeout(r, 400));
  await setMatSelectByLabel('Port of Entry', '${esc(data.portOfEntry)}');
  console.log('✅ Step 3 complete');
}

// ────────────────────────────────────────────────────────────
// STEP 4: Contact/Hotel details in Nigeria (run on Step 4 page)
// ────────────────────────────────────────────────────────────
async function fillStep4() {
  console.log('\\n📋 Step 4: Contact/Hotel details in Nigeria');
  setByName('contactName', '${esc(data.contactName)}');
  // Strip any country-code prefix — the form has a fixed "+234" prefix
  // baked into the phone input, so the visible field only accepts the
  // local number.
  const __phone = '${esc(data.contactPhone)}'.replace(/^\\+?234[\\s-]?/, '').replace(/^\\+/, '').trim();
  setByName('contactPhone', __phone);
  setByName('contactAddress', '${esc(data.contactAddress)}');
  setByName('contactCity', '${esc(data.contactCity)}');
  // State is a mat-select — must use label lookup.
  await setMatSelectByLabel('State', '${esc(data.contactState)}');
  setByName('contactEmail', '${esc(data.contactEmail)}');
  setByName('contactPostalCode', '${esc(data.contactPostalCode)}');
  console.log('✅ Step 4 complete');
}

// ────────────────────────────────────────────────────────────
// STEP 6/7 helpers — answer each Yes/No question individually.
// Matches each mat-radio-group to a known question by nearby text,
// clicks the right radio (Yes/No), and fills the paired textarea
// when the answer is Yes.
// ────────────────────────────────────────────────────────────
function yesNoQuestions(map) {
  // Iterate in DOM order so we can locate the textarea that belongs
  // to each question (it's typically the first textarea after the group).
  const groups = Array.from(document.querySelectorAll('mat-radio-group, [role="radiogroup"]'));
  const matched = new Set();
  for (const group of groups) {
    // Walk up a few levels to capture the question label text
    let ctx = group;
    let text = '';
    for (let i = 0; i < 5 && ctx; i++) {
      text = (ctx.textContent || '').trim();
      if (text.length > 30) break;
      ctx = ctx.parentElement;
    }
    const lowerText = text.toLowerCase();

    const match = map.find(q => !matched.has(q) && q.match.some(m => lowerText.includes(m.toLowerCase())));
    if (!match) continue;
    matched.add(match);

    // Click the right radio (Yes or No)
    const wantYes = match.answer === 'Yes';
    const radios = Array.from(group.querySelectorAll('input[type="radio"], mat-radio-button'));
    let clicked = false;
    for (const r of radios) {
      const input = r.tagName === 'INPUT' ? r : r.querySelector('input[type="radio"]');
      const rawVal = (input?.value || r.getAttribute?.('value') || r.textContent || r.id || '').toString().trim().toLowerCase();
      const isYes = rawVal === 'yes' || rawVal === 'y' || rawVal === 'true';
      const isNo  = rawVal === 'no'  || rawVal === 'n' || rawVal === 'false';
      if ((wantYes && isYes) || (!wantYes && isNo)) {
        const target = r.tagName === 'INPUT' ? r : (r.querySelector('label') || r);
        target.click();
        if (input) input.dispatchEvent(new Event('change', { bubbles: true }));
        clicked = true;
        break;
      }
    }
    if (!clicked) console.warn('⚠️ Could not click', match.answer, 'for:', match.match[0]);
    else console.log('✅', match.match[0], '→', match.answer);

    // If Yes + details, populate the nearest following textarea
    if (wantYes && match.details) {
      let area = null;
      // Look inside the same container (ctx), then in following siblings
      const scope = ctx || group.parentElement;
      if (scope) {
        area = scope.querySelector('textarea');
      }
      if (!area) {
        let sib = group.nextElementSibling;
        while (sib && !area) {
          area = sib.querySelector ? sib.querySelector('textarea') : null;
          if (sib.tagName === 'TEXTAREA') area = sib;
          sib = sib.nextElementSibling;
        }
      }
      if (area) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (setter) setter.call(area, match.details); else area.value = match.details;
        area.dispatchEvent(new Event('input', { bubbles: true }));
        area.dispatchEvent(new Event('change', { bubbles: true }));
        area.dispatchEvent(new Event('blur', { bubbles: true }));
        console.log('   📝 details filled');
      } else {
        console.warn('   ⚠️ details textarea not found for:', match.match[0]);
      }
    }
  }
}

// ────────────────────────────────────────────────────────────
// STEP 6: Travel History
// ────────────────────────────────────────────────────────────
function fillStep6() {
  console.log('\\n📋 Step 6: Travel History');
  yesNoQuestions([
    { match: ['visa for Nigeria, ECOWAS', 'ECOWAS or AU'], answer: '${data.previousVisaNigeria}', details: '${esc(data.previousVisaDetails)}' },
    { match: ['travelled to Nigeria', 'been to Nigeria'], answer: '${data.travelledToNigeria}', details: '${esc(data.travelledToNigeriaDetails)}' },
    { match: ['refused entry into Nigeria', 'refused entry to Nigeria'], answer: '${data.refusedEntryNigeria}', details: '${esc(data.refusedEntryDetails)}' },
    { match: ['refused a visa for any country', 'refused visa'], answer: '${data.refusedVisaAnyCountry}', details: '${esc(data.refusedVisaDetails)}' },
    { match: ['deported or required to leave', 'deported'], answer: '${data.deportedFromAnyCountry}', details: '${esc(data.deportedDetails)}' },
    { match: ['travelled outside your country of residence', 'outside your country of residence'], answer: '${data.travelledOutsideResidence}', details: '${esc(data.travelledOutsideDetails)}' },
  ]);
  console.log('✅ Step 6 complete — verify each answer matches the customer submission');
}

// ────────────────────────────────────────────────────────────
// STEP 7: Security and Criminal History
// ────────────────────────────────────────────────────────────
function fillStep7() {
  console.log('\\n📋 Step 7: Security');
  yesNoQuestions([
    { match: ['criminal convictions', 'conviction in any country'], answer: '${data.criminalConvictions}', details: '${esc(data.criminalConvictionDetails)}' },
    { match: ['charged with a criminal offence', 'not yet tried'], answer: '${data.criminalCharges}', details: '${esc(data.criminalChargeDetails)}' },
    { match: ['involved in, supported, or encouraged terrorist', 'supported, or encouraged terrorist'], answer: '${data.terroristActivities}', details: '${esc(data.terroristActivityDetails)}' },
    { match: ['justify or promote terrorist violence', 'expressed views'], answer: '${data.terroristViews}', details: '${esc(data.terroristViewDetails)}' },
  ]);
  console.log('✅ Step 7 complete — verify each answer matches the customer submission');
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
(async function autoFill() {
  const heading = document.body.innerText.substring(0, 2000);
  if (heading.includes('Step 1') || heading.includes('General Information')) { await fillStep1(); }
  else if (heading.includes('Step 2') || heading.includes('Biodata')) { fillStep2(); }
  else if (heading.includes('Step 3') || heading.includes('Travel Information')) { await fillStep3(); }
  else if (heading.includes('Step 4') || heading.includes('Contact')) { await fillStep4(); }
  else if (heading.includes('Step 6') || heading.includes('Travel History')) { fillStep6(); }
  else if (heading.includes('Step 7') || heading.includes('Security')) { fillStep7(); }
  else { console.log('🔍 Could not detect step — call fillStep1() through fillStep7() manually'); }
})();
`.trim();
}
