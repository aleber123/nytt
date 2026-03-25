/**
 * USA DS-160 Visa Application Form Autofill Script Generator
 * 
 * Generates JavaScript for browser console to auto-fill DS-160 forms
 * DS-160 uses ASP.NET WebForms with field IDs like:
 * - ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME
 */

export interface DS160FormData {
  // Personal Information
  surname?: string;
  givenName?: string;
  fullNameNative?: string;
  fullNameNativeNA?: boolean;
  hasOtherNames?: boolean;
  otherSurname?: string;
  otherGivenName?: string;
  sex?: 'M' | 'F';
  maritalStatus?: string;
  dateOfBirth?: string;
  placeOfBirthCity?: string;
  placeOfBirthState?: string;
  placeOfBirthCountry?: string;
  nationality?: string;
  hasOtherNationality?: boolean;
  otherNationality?: string;
  nationalIdNumber?: string;
  // Address & Contact
  homeAddress?: string;
  homeCity?: string;
  homeState?: string;
  homePostalCode?: string;
  homeCountry?: string;
  primaryPhone?: string;
  email?: string;
  // Passport
  passportType?: string;
  passportNumber?: string;
  passportIssuingCountry?: string;
  passportIssuingCity?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  hasLostPassport?: boolean;
  // Travel
  purposeOfTrip?: string;
  arrivalDate?: string;
  departureDate?: string;
  stayLength?: string;
  stayUnit?: string;
  usAddress?: string;
  usCity?: string;
  usState?: string;
  usZipCode?: string;
  whoPaysTripCost?: string;
  // US Contact
  usContactName?: string;
  usContactOrganization?: string;
  usContactRelationship?: string;
  usContactAddress?: string;
  usContactCity?: string;
  usContactState?: string;
  usContactZipCode?: string;
  usContactPhone?: string;
  usContactEmail?: string;
  // Family
  fatherSurname?: string;
  fatherGivenName?: string;
  fatherDateOfBirth?: string;
  isFatherInUS?: boolean;
  motherSurname?: string;
  motherGivenName?: string;
  motherDateOfBirth?: string;
  isMotherInUS?: boolean;
  hasImmediateRelativesInUS?: boolean;
  spouseSurname?: string;
  spouseGivenName?: string;
  spouseDateOfBirth?: string;
  spouseNationality?: string;
  // Work & Education
  primaryOccupation?: string;
  employerName?: string;
  employerAddress?: string;
  employerCity?: string;
  employerCountry?: string;
  employerPhone?: string;
  jobTitle?: string;
  employerStartDate?: string;
  monthlyIncome?: string;
  jobDuties?: string;
  // Previous US Travel
  hasBeenToUS?: boolean;
  lastUSVisitDate?: string;
  lastUSVisitLength?: string;
  hasUSDriversLicense?: boolean;
  usDriversLicenseState?: string;
  hasHadUSVisa?: boolean;
  previousVisaIssueDate?: string;
  previousVisaNumber?: string;
  isSameVisaType?: boolean;
  hasBeenRefused?: boolean;
  hasImmigrantPetition?: boolean;
  // Additional Info
  hasAttendedEducation?: boolean;
  educationInstitutionName?: string;
  educationCity?: string;
  educationCountry?: string;
  educationCourseOfStudy?: string;
  languagesSpoken?: string;
  hasTraveledLast5Years?: boolean;
  countriesVisitedLast5Years?: string;
  belongsToOrganizations?: boolean;
  organizationNames?: string;
  hasServedInMilitary?: boolean;
  militaryDetails?: string;
}

// Country code mapping
export const DS160_COUNTRY_CODES: Record<string, string> = {
  'Sweden': 'SWDN', 'Sverige': 'SWDN', 'SE': 'SWDN',
  'Norway': 'NORW', 'Norge': 'NORW', 'NO': 'NORW',
  'Denmark': 'DEN', 'Danmark': 'DEN', 'DK': 'DEN',
  'Finland': 'FIN', 'FI': 'FIN',
  'Germany': 'GER', 'Tyskland': 'GER', 'DE': 'GER',
  'United Kingdom': 'GRBR', 'Storbritannien': 'GRBR', 'GB': 'GRBR',
  'France': 'FRAN', 'Frankrike': 'FRAN', 'FR': 'FRAN',
  'USA': 'USA', 'US': 'USA',
};

function formatDateForDS160(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(date.getDate()).padStart(2,'0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

export function convertFormDataToDS160(formData: Record<string, any>): DS160FormData {
  const getCountry = (c: string) => DS160_COUNTRY_CODES[c] || c;
  const toBool = (v: any) => v === 'yes' || v === 'Yes' || v === true || v === 'true';
  return {
    // Personal Information
    surname: formData.surname || formData.lastName || formData.familyNames || '',
    givenName: formData.givenName || formData.firstName || formData.givenNames || '',
    fullNameNative: formData.fullNameNative || '',
    fullNameNativeNA: formData.fullNameNativeNA === 'true' || formData.fullNameNativeNA === true,
    hasOtherNames: toBool(formData.hasOtherNames),
    otherSurname: formData.otherSurname || '',
    otherGivenName: formData.otherGivenName || '',
    sex: formData.sex === 'male' || formData.sex === 'M' ? 'M' : formData.sex === 'female' || formData.sex === 'F' ? 'F' : undefined,
    maritalStatus: formData.maritalStatus || '',
    dateOfBirth: formatDateForDS160(formData.dateOfBirth),
    placeOfBirthCity: formData.cityOfBirth || formData.placeOfBirthCity || formData.birthCity || '',
    placeOfBirthState: formData.placeOfBirthState || '',
    placeOfBirthCountry: getCountry(formData.countryOfBirth || formData.placeOfBirthCountry || formData.birthCountry || ''),
    nationality: getCountry(formData.nationality || ''),
    hasOtherNationality: toBool(formData.hasOtherNationality),
    otherNationality: formData.otherNationality || '',
    nationalIdNumber: formData.nationalIdNumber || formData.personnummer || '',
    // Address & Contact
    homeAddress: formData.homeStreetAddress || formData.homeAddress || formData.permanentAddressStreet || formData.address || '',
    homeCity: formData.homeCity || formData.permanentAddressCity || formData.city || '',
    homeState: formData.homeState || formData.permanentAddressState || '',
    homePostalCode: formData.homePostalCode || formData.permanentAddressZip || formData.postalCode || '',
    homeCountry: getCountry(formData.homeCountry || 'Sweden'),
    primaryPhone: formData.primaryPhone || formData.phone || formData.mobilePhone || '',
    email: formData.email || '',
    // Passport
    passportType: formData.passportType || 'REGULAR',
    passportNumber: formData.passportNumber || '',
    passportIssuingCountry: getCountry(formData.passportIssuingCountry || formData.passportIssuedBy || 'Sweden'),
    passportIssuingCity: formData.passportIssuingCity || '',
    passportIssueDate: formatDateForDS160(formData.passportIssueDate || formData.passportDateOfIssue),
    passportExpiryDate: formatDateForDS160(formData.passportExpiryDate || formData.passportDateOfExpiry),
    hasLostPassport: toBool(formData.hasLostPassport),
    // Travel
    purposeOfTrip: formData.purposeOfTrip || '',
    arrivalDate: formatDateForDS160(formData.intendedArrivalDate || formData.arrivalDate),
    departureDate: formatDateForDS160(formData.departureDate || formData.intendedDepartureDate),
    stayLength: formData.intendedStayLength || '',
    stayUnit: formData.intendedStayUnit || 'DAYS',
    usAddress: formData.usStreetAddress || formData.usAddress || formData.usStayAddress || '',
    usCity: formData.usCity || formData.usStayCity || '',
    usState: formData.usState || formData.usStayState || '',
    usZipCode: formData.usZipCode || formData.usStayZipCode || '',
    whoPaysTripCost: formData.whoPaysTripCost || 'SELF',
    // US Contact
    usContactName: formData.usContactName || formData.usPointOfContactName || '',
    usContactOrganization: formData.usContactOrganization || '',
    usContactRelationship: formData.usContactRelationship || '',
    usContactAddress: formData.usContactAddress || '',
    usContactCity: formData.usContactCity || '',
    usContactState: formData.usContactState || '',
    usContactZipCode: formData.usContactZipCode || '',
    usContactPhone: formData.usContactPhone || '',
    usContactEmail: formData.usContactEmail || '',
    // Family
    fatherSurname: formData.fatherSurname || '',
    fatherGivenName: formData.fatherGivenName || '',
    fatherDateOfBirth: formatDateForDS160(formData.fatherDateOfBirth),
    isFatherInUS: toBool(formData.isFatherInUS),
    motherSurname: formData.motherSurname || '',
    motherGivenName: formData.motherGivenName || '',
    motherDateOfBirth: formatDateForDS160(formData.motherDateOfBirth),
    isMotherInUS: toBool(formData.isMotherInUS),
    hasImmediateRelativesInUS: toBool(formData.hasImmediateRelativesInUS),
    spouseSurname: formData.spouseSurname || '',
    spouseGivenName: formData.spouseGivenName || '',
    spouseDateOfBirth: formatDateForDS160(formData.spouseDateOfBirth),
    spouseNationality: formData.spouseNationality || '',
    // Work & Education
    primaryOccupation: formData.primaryOccupation || '',
    employerName: formData.employerName || '',
    employerAddress: formData.employerAddress || '',
    employerCity: formData.employerCity || '',
    employerCountry: getCountry(formData.employerCountry || ''),
    employerPhone: formData.employerPhone || '',
    jobTitle: formData.jobTitle || '',
    employerStartDate: formatDateForDS160(formData.employerStartDate),
    monthlyIncome: formData.monthlyIncome || '',
    jobDuties: formData.jobDuties || '',
    // Previous US Travel
    hasBeenToUS: toBool(formData.hasBeenToUS),
    lastUSVisitDate: formatDateForDS160(formData.lastUSVisitDate),
    lastUSVisitLength: formData.lastUSVisitLength || '',
    hasUSDriversLicense: toBool(formData.hasUSDriversLicense),
    usDriversLicenseState: formData.usDriversLicenseState || '',
    hasHadUSVisa: toBool(formData.hasHadUSVisa),
    previousVisaIssueDate: formatDateForDS160(formData.previousVisaIssueDate),
    previousVisaNumber: formData.previousVisaNumber || '',
    isSameVisaType: toBool(formData.isSameVisaType),
    hasBeenRefused: toBool(formData.hasBeenRefusedVisa),
    hasImmigrantPetition: toBool(formData.hasImmigrantPetition),
    // Additional Info
    hasAttendedEducation: toBool(formData.hasAttendedEducation),
    educationInstitutionName: formData.educationInstitutionName || '',
    educationCity: formData.educationCity || '',
    educationCountry: getCountry(formData.educationCountry || ''),
    educationCourseOfStudy: formData.educationCourseOfStudy || '',
    languagesSpoken: formData.languagesSpoken || '',
    hasTraveledLast5Years: toBool(formData.hasTraveledLast5Years),
    countriesVisitedLast5Years: formData.countriesVisitedLast5Years || '',
    belongsToOrganizations: toBool(formData.belongsToOrganizations),
    organizationNames: formData.organizationNames || '',
    hasServedInMilitary: toBool(formData.hasServedInMilitary),
    militaryDetails: formData.militaryDetails || '',
  };
}

export function generateDS160CompleteScript(formData: Record<string, any>): string {
  const data = convertFormDataToDS160(formData);
  return `
// DS-160 Auto-fill Script - DOX Visumpartner
// Version 2.0 - Improved field detection and event handling
const D=${JSON.stringify(data)};

// Helper: Find element by partial ID match
function findEl(partialId){
  let el = document.getElementById(partialId);
  if(el) return el;
  // Try to find by partial match on last part of ID
  const lastPart = partialId.split('_').pop();
  const all = document.querySelectorAll('[id*="'+lastPart+'"]');
  if(all.length === 1) return all[0];
  // Try multiple partial matches
  const parts = partialId.split('_').filter(p=>p.length>2);
  for(let i=parts.length-1;i>=0;i--){
    const search = parts.slice(i).join('_');
    const found = document.querySelectorAll('[id$="'+search+'"]');
    if(found.length === 1) return found[0];
  }
  // Special case for date fields - DS-160 uses different patterns
  if(lastPart.includes('DOB') || lastPart.includes('DTD')){
    const dateFields = document.querySelectorAll('input[id*="DOB"],input[id*="Date"],input[id*="DTD"]');
    for(const f of dateFields){
      if(f.id.toUpperCase().includes(lastPart.toUpperCase().replace('_',''))){
        return f;
      }
    }
    // Return first date-like field if only one exists
    if(dateFields.length === 1) return dateFields[0];
  }
  return null;
}

// Set text value with proper events
function sv(id,v){
  const e = findEl(id);
  if(!e){console.warn('⚠️ Field not found:',id.split('_').pop());return;}
  if(!v){console.log('⏭️ Skipping empty:',id.split('_').pop());return;}
  e.value = v;
  e.dispatchEvent(new Event('input',{bubbles:true}));
  e.dispatchEvent(new Event('change',{bubbles:true}));
  e.dispatchEvent(new Event('blur',{bubbles:true}));
  console.log('✓',id.split('_').pop(),'=',v);
}

// Set select/dropdown value
function ss(id,v){
  const e = findEl(id);
  if(!e){console.warn('⚠️ Dropdown not found:',id.split('_').pop());return;}
  if(!v){console.log('⏭️ Skipping empty:',id.split('_').pop());return;}
  const vUp = String(v).toUpperCase();
  for(let i=0;i<e.options.length;i++){
    const opt = e.options[i];
    const optVal = opt.value.toUpperCase();
    const optTxt = opt.text.toUpperCase();
    if(optVal===vUp || optTxt===vUp || optTxt.includes(vUp) || optVal.includes(vUp)){
      e.selectedIndex = i;
      e.dispatchEvent(new Event('change',{bubbles:true}));
      console.log('✓',id.split('_').pop(),'=',opt.text);
      return;
    }
  }
  console.warn('⚠️ No match for',id.split('_').pop(),'with value',v);
}

// Set radio button - handles Y/N, 1/0, Yes/No
function sr(name,yesNo){
  const radios = document.querySelectorAll('input[name="'+name+'"]');
  if(radios.length===0){
    // Try partial match
    const partial = name.split('$').pop();
    const found = document.querySelectorAll('input[name*="'+partial+'"]');
    if(found.length>0){
      found.forEach(r=>{
        const isYes = yesNo===true||yesNo==='Y'||yesNo==='Yes'||yesNo==='yes';
        const targetVal = isYes ? ['Y','1','Yes','TRUE'] : ['N','0','No','FALSE'];
        if(targetVal.includes(r.value)){
          r.checked=true;
          r.dispatchEvent(new Event('click',{bubbles:true}));
          r.dispatchEvent(new Event('change',{bubbles:true}));
          console.log('✓ Radio',partial,'=',r.value);
        }
      });
      return;
    }
    console.warn('⚠️ Radio not found:',name.split('$').pop());
    return;
  }
  const isYes = yesNo===true||yesNo==='Y'||yesNo==='Yes'||yesNo==='yes';
  const targetVals = isYes ? ['Y','1','Yes','TRUE'] : ['N','0','No','FALSE'];
  radios.forEach(r=>{
    if(targetVals.includes(r.value)){
      r.checked=true;
      r.dispatchEvent(new Event('click',{bubbles:true}));
      r.dispatchEvent(new Event('change',{bubbles:true}));
      console.log('✓ Radio',name.split('$').pop(),'=',r.value);
    }
  });
}

// Set checkbox
function sc(id,checked){
  const e = findEl(id);
  if(!e){console.warn('⚠️ Checkbox not found:',id.split('_').pop());return;}
  if(e.checked !== checked){
    e.checked = checked;
    e.dispatchEvent(new Event('click',{bubbles:true}));
    e.dispatchEvent(new Event('change',{bubbles:true}));
    console.log('✓ Checkbox',id.split('_').pop(),'=',checked);
  }
}

// Debug: List all form fields on page
function listFields(){
  console.log('📋 Text inputs:');
  document.querySelectorAll('input[type="text"]').forEach(e=>console.log('  ',e.id||e.name));
  console.log('📋 Selects:');
  document.querySelectorAll('select').forEach(e=>console.log('  ',e.id||e.name));
  console.log('📋 Radio groups:');
  const radioNames = new Set();
  document.querySelectorAll('input[type="radio"]').forEach(e=>radioNames.add(e.name));
  radioNames.forEach(n=>console.log('  ',n));
}

// Smart field setter - tries multiple ID patterns
function setField(patterns, value){
  if(!value) return;
  for(const p of patterns){
    const el = document.querySelector(p);
    if(el){
      el.value = value;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      el.dispatchEvent(new Event('blur',{bubbles:true}));
      console.log('✓',el.id.split('_').pop(),'=',value);
      return true;
    }
  }
  console.warn('⚠️ No field found for patterns');
  return false;
}

// Set date field - DS-160 uses: Day dropdown, Month dropdown, Year text input
function setDate(baseId, dateStr){
  if(!dateStr) return;
  // Parse date string (format: DD-MMM-YYYY)
  const parts = dateStr.split('-');
  if(parts.length !== 3) {
    console.warn('⚠️ Invalid date format:', dateStr);
    return;
  }
  const day = parts[0];    // "18"
  const month = parts[1];  // "JUN"
  const year = parts[2];   // "1988"
  
  console.log('🔍 Setting date:', day, month, year);
  
  // Find the date container - look for elements near each other with DOB in ID
  const allElements = document.querySelectorAll('[id*="DOB"],[id*="Date"]');
  const selects = [];
  const inputs = [];
  
  allElements.forEach(el => {
    if(el.tagName === 'SELECT') selects.push(el);
    if(el.tagName === 'INPUT') inputs.push(el);
  });
  
  console.log('🔍 Found', selects.length, 'selects and', inputs.length, 'inputs with DOB/Date');
  
  // Sort by position (left to right)
  const sortByPosition = (a,b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    if(Math.abs(aRect.top - bRect.top) < 20) return aRect.left - bRect.left;
    return aRect.top - bRect.top;
  };
  
  selects.sort(sortByPosition);
  inputs.sort(sortByPosition);
  
  // DS-160 pattern: 2 dropdowns (day, month) + 1 text input (year)
  if(selects.length >= 2 && inputs.length >= 1){
    // First dropdown = Day (01-31)
    const daySelect = selects[0];
    for(let i=0;i<daySelect.options.length;i++){
      const val = daySelect.options[i].value;
      const txt = daySelect.options[i].text;
      // Match "18" or "18" in text
      if(val === day || txt === day || val === day.replace(/^0/,'') || txt === day.replace(/^0/,'')){
        daySelect.selectedIndex = i;
        daySelect.dispatchEvent(new Event('change',{bubbles:true}));
        console.log('✓ Day dropdown =', txt);
        break;
      }
    }
    
    // Second dropdown = Month (JAN-DEC)
    const monthSelect = selects[1];
    for(let i=0;i<monthSelect.options.length;i++){
      const val = monthSelect.options[i].value.toUpperCase();
      const txt = monthSelect.options[i].text.toUpperCase();
      if(val === month || txt === month || val.includes(month) || txt.includes(month)){
        monthSelect.selectedIndex = i;
        monthSelect.dispatchEvent(new Event('change',{bubbles:true}));
        console.log('✓ Month dropdown =', monthSelect.options[i].text);
        break;
      }
    }
    
    // Text input = Year (YYYY)
    const yearInput = inputs[0];
    yearInput.value = year;
    yearInput.dispatchEvent(new Event('input',{bubbles:true}));
    yearInput.dispatchEvent(new Event('change',{bubbles:true}));
    yearInput.dispatchEvent(new Event('blur',{bubbles:true}));
    console.log('✓ Year input =', year);
    return;
  }
  
  // Fallback: try single field
  const singleField = findEl(baseId);
  if(singleField){
    singleField.value = dateStr;
    singleField.dispatchEvent(new Event('input',{bubbles:true}));
    singleField.dispatchEvent(new Event('change',{bubbles:true}));
    singleField.dispatchEvent(new Event('blur',{bubbles:true}));
    console.log('✓ Date =',dateStr);
    return;
  }
  
  console.warn('⚠️ No date fields found');
}

function fillPersonal1(){
  console.log('🔄 Filling Personal 1...');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME',D.surname);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_GIVEN_NAME',D.givenName);
  // Full Name in Native Alphabet - check "Does Not Apply" if empty
  if(D.fullNameNative && !D.fullNameNativeNA){
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_FULL_NAME_NATIVE',D.fullNameNative);
  } else {
    sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_FULL_NAME_NATIVE_NA',true);
    console.log('✓ Full Name Native = Does Not Apply');
  }
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblOtherNames',D.hasOtherNames?'Y':'N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblTelecodeQuestion','N');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_GENDER',D.sex);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_MARITAL_STATUS',D.maritalStatus);
  // DOB - use setDate which handles both single field and Day/Month/Year dropdowns
  setDate('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_DOB', D.dateOfBirth);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_CITY',D.placeOfBirthCity);
  // State/Province - check "Does Not Apply" if empty
  if(D.placeOfBirthState){
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_ST_PROVINCE',D.placeOfBirthState);
  } else {
    // Check the "Does Not Apply" checkbox for State/Province
    sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_POB_ST_PROVINCE_NA',true);
    console.log('✓ State/Province = Does Not Apply');
  }
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_POB_CNTRY',D.placeOfBirthCountry);
  console.log('✅ Personal 1 done!');
}

function fillPersonal2(){
  console.log('🔄 Filling Personal 2...');
  
  // Country/Region of Origin (Nationality) - find dropdown with NATL in ID
  const natlDropdown = document.querySelector('select[id*="NATL"]:not([id*="OTH"])');
  if(natlDropdown && D.nationality){
    const sel = natlDropdown;
    for(let i=0;i<sel.options.length;i++){
      const val = sel.options[i].value.toUpperCase();
      const txt = sel.options[i].text.toUpperCase();
      if(val.includes(D.nationality) || txt.includes(D.nationality) || val===D.nationality || txt.includes('SWED')){
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event('change',{bubbles:true}));
        console.log('✓ Nationality =', sel.options[i].text);
        break;
      }
    }
  } else {
    ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_NATL',D.nationality);
  }
  
  // Other nationality - No
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblAPP_OTH_NATL_IND',D.hasOtherNationality?'Y':'N');
  if(D.hasOtherNationality&&D.otherNationality){
    ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_OTH_NATL',D.otherNationality);
  }
  
  // Permanent resident of other country - No
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPermResOtherCntryInd','N');
  
  // National ID Number - fill or check "Does Not Apply"
  if(D.nationalIdNumber){
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_NATIONAL_ID',D.nationalIdNumber);
  } else {
    sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_NATIONAL_ID_NA',true);
    console.log('✓ National ID = Does Not Apply');
  }
  
  // SSN - Does Not Apply
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_SSN_NA',true);
  console.log('✓ SSN = Does Not Apply');
  
  // Tax ID - Does Not Apply
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_TAX_ID_NA',true);
  console.log('✓ Tax ID = Does Not Apply');
  
  console.log('✅ Personal 2 done!');
}

function fillAddress(){
  console.log('🔄 Filling Address...');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_LN1',D.homeAddress);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_CITY',D.homeCity);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_STATE',D.homeState);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_ADDR_POSTAL_CD',D.homePostalCode);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlCountry',D.homeCountry);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblMailingAddrSame','Y');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_HOME_TEL',D.primaryPhone);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_MOBILE_TEL_NA',true);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_BUS_TEL_NA',true);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_EMAIL_ADDR',D.email);
  console.log('✅ Address done!');
}

function fillTravel(){
  console.log('🔄 Filling Travel...');
  // Purpose of trip
  if(D.purposeOfTrip){
    ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPurposeOfTrip',D.purposeOfTrip);
  }
  // Specific travel plans
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblSpecificTravel',D.arrivalDate?'Y':'N');
  if(D.arrivalDate){
    // Use setDate for arrival date
    setDate('ctl00_SiteContentPlaceHolder_FormView1_tbxArrivDate',D.arrivalDate);
    setDate('ctl00_SiteContentPlaceHolder_FormView1_tbxDepartDate',D.departureDate);
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxStreetAddress1',D.usAddress);
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxCity',D.usCity);
    ss('ctl00_SiteContentPlaceHolder_FormView1_ddlTravelState',D.usState);
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxZipCode',D.usZipCode);
  }
  // Who is paying
  if(D.whoPaysTripCost){
    ss('ctl00_SiteContentPlaceHolder_FormView1_ddlWhoPaying',D.whoPaysTripCost);
  }
  console.log('✅ Travel done!');
}

function fillPassport(){
  console.log('🔄 Filling Passport...');
  // Passport type - Regular
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_TYPE','R');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_NUM',D.passportNumber);
  // Book number - Does Not Apply
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA',true);
  console.log('✓ Passport Book Number = Does Not Apply');
  // Issuing country
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_CNTRY',D.passportIssuingCountry);
  // Issuing city/state - Does Not Apply (for most countries)
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_ISSUED_IN_STATE_NA',true);
  console.log('✓ Passport Issued In = Does Not Apply');
  // Issue and expiry dates - use setDate for proper handling
  setDate('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_ISSUED_DTD',D.passportIssueDate);
  setDate('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_EXPIRE_DTD',D.passportExpiryDate);
  // Lost passport - No
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblLOST_PPT_IND',D.hasLostPassport?'Y':'N');
  console.log('✅ Passport done!');
}

function fillUSContact(){
  console.log('🔄 Filling US Contact...');
  const names=D.usContactName?.split(' ')||[];
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_SURNAME',names.slice(-1)[0]||'');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_GIVEN_NAME',names[0]||'');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ORGANIZATION',D.usContactOrganization);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_LN1',D.usContactAddress);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_CITY',D.usContactCity);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlUS_POC_ADDR_STATE',D.usContactState);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_ADDR_POSTAL_CD',D.usContactZipCode);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_HOME_TEL',D.usContactPhone);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxUS_POC_EMAIL_ADDR',D.usContactEmail);
  console.log('✅ US Contact done!');
}

function fillFamily(){
  console.log('🔄 Filling Family...');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_SURNAME',D.fatherSurname);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxFATHER_GIVEN_NAME',D.fatherGivenName);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxFathersDOB',D.fatherDateOfBirth);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblFATHER_LIVE_IN_US_IND',D.isFatherInUS?'Y':'N');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_SURNAME',D.motherSurname);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxMOTHER_GIVEN_NAME',D.motherGivenName);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxMothersDOB',D.motherDateOfBirth);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblMOTHER_LIVE_IN_US_IND',D.isMotherInUS?'Y':'N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblUS_IMMED_RELATIVE_IND',D.hasImmediateRelativesInUS?'Y':'N');
  if(D.spouseSurname){
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxSPOUSE_SURNAME',D.spouseSurname);
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxSPOUSE_GIVEN_NAME',D.spouseGivenName);
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxDOBSPOUSE',D.spouseDateOfBirth);
    ss('ctl00_SiteContentPlaceHolder_FormView1_ddlSPOUSE_NATL',D.spouseNationality);
  }
  console.log('✅ Family done!');
}

function fillWork(){
  console.log('🔄 Filling Work...');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPresentOccupation',D.primaryOccupation);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchName',D.employerName);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchAddr1',D.employerAddress);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxEmpSchCity',D.employerCity);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxWORK_EDUC_TEL',D.employerPhone);
  console.log('✅ Work done!');
}

function fillSecurity(){
  console.log('🔄 Filling Security (all No)...');
  ['rblDisease','rblDisorder','rblDruguser','rblArrested','rblControlledSubstances','rblProstitution','rblMoneyLaundering','rblHumanTrafficking','rblAssistedSevereTrafficking','rblHumanTraffickingRelated','rblIllegalActivity','rblTerroristActivity','rblTerroristSupport','rblTerroristOrg','rblGenocide','rblTorture','rblExJudKilling','rblChildSoldier','rblReligiousFreedom','rblPopulationControls','rblTransplant','rblDeportation','rblChildCustody','rblVotingViolation','rblTaxEvasion'].forEach(n=>sr('ctl00$SiteContentPlaceHolder$FormView1$'+n,'N'));
  console.log('✅ Security done! ⚠️ REVIEW ALL ANSWERS!');
}

function fillPreviousTravel(){
  console.log('🔄 Filling Previous Travel...');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_US_TRAVEL_IND',D.hasBeenToUS?'Y':'N');
  if(D.hasBeenToUS&&D.lastUSVisitDate){
    sv('ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_dtlPREV_US_VISITRow0_tbxPREV_US_VISIT_DTD',D.lastUSVisitDate);
    sv('ctl00_SiteContentPlaceHolder_FormView1_dtlPREV_US_VISIT_dtlPREV_US_VISITRow0_tbxPREV_US_VISIT_LOS',D.lastUSVisitLength);
  }
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_US_DRIVER_LIC_IND',D.hasUSDriversLicense?'Y':'N');
  if(D.hasUSDriversLicense&&D.usDriversLicenseState){
    ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPREV_US_DRIVER_LIC_STATE',D.usDriversLicenseState);
  }
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_VISA_IND',D.hasHadUSVisa?'Y':'N');
  if(D.hasHadUSVisa){
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_ISSUED',D.previousVisaIssueDate);
    sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPREV_VISA_NUMBER',D.previousVisaNumber);
    sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_VISA_SAME_TYPE_IND',D.isSameVisaType?'Y':'N');
  }
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPREV_VISA_REFUSED_IND',D.hasBeenRefused?'Y':'N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblIV_PETITION_IND',D.hasImmigrantPetition?'Y':'N');
  console.log('✅ Previous Travel done!');
}

function fillAll(){
  const t=document.title.toLowerCase();
  console.log('🔍 Detecting page from title:', t);
  if(t.includes('personal') && t.includes('1'))fillPersonal1();
  else if(t.includes('personal') && t.includes('2'))fillPersonal2();
  else if(t.includes('address') && t.includes('phone'))fillAddress();
  else if(t.includes('passport'))fillPassport();
  else if(t.includes('travel') && !t.includes('previous'))fillTravel();
  else if(t.includes('u.s. contact') || t.includes('point of contact'))fillUSContact();
  else if(t.includes('family'))fillFamily();
  else if(t.includes('work') || t.includes('education') || t.includes('occupation'))fillWork();
  else if(t.includes('security'))fillSecurity();
  else if(t.includes('previous'))fillPreviousTravel();
  else console.log('Unknown page:', t, '\\nUse: fillPersonal1(), fillPersonal2(), fillTravel(), fillAddress(), fillPassport(), fillUSContact(), fillFamily(), fillWork(), fillSecurity(), fillPreviousTravel()');
}

console.log('📋 DS-160 Script v2.0 loaded! Commands:');
console.log('  fillAll() - Auto-detect page and fill');
console.log('  fillPersonal1/2(), fillAddress(), fillPassport()');
console.log('  fillUSContact(), fillFamily(), fillWork(), fillSecurity()');
console.log('  listFields() - Debug: show all form fields on page');
console.log('');
console.log('🔍 Current page:', document.title);
fillAll();
`;
}

export function buildDS160DataFromOrder(order: any, formData?: Record<string, any>): DS160FormData {
  const traveler = order.travelers?.[0] || {};
  const customerInfo = order.customerInfo || {};
  return convertFormDataToDS160({ ...traveler, ...customerInfo, ...formData });
}
