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

function fillPersonal1(){
  console.log('🔄 Filling Personal 1...');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_SURNAME',D.surname);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_GIVEN_NAME',D.givenName);
  if(D.fullNameNativeNA)sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_FULL_NAME_NATIVE_NA',true);
  else sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_FULL_NAME_NATIVE',D.fullNameNative);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblOtherNames',D.hasOtherNames?'Y':'N');
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblTelecodeQuestion','N');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_GENDER',D.sex);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_MARITAL_STATUS',D.maritalStatus);
  // DOB - try multiple patterns since DS-160 changes field IDs
  setField([
    '[id*="tbxAPP_DOB"]',
    '[id*="DOBDay"]',
    '[id$="DOB"]',
    'input[id*="DateOfBirth"]',
    'input[id*="APP_DOB"]'
  ], D.dateOfBirth) || sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_DOB',D.dateOfBirth);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_CITY',D.placeOfBirthCity);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_POB_ST_PROVINCE',D.placeOfBirthState);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_POB_CNTRY',D.placeOfBirthCountry);
  console.log('✅ Personal 1 done!');
}

function fillPersonal2(){
  console.log('🔄 Filling Personal 2...');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_NATL',D.nationality);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblAPP_OTH_NATL_IND',D.hasOtherNationality?'Y':'N');
  if(D.hasOtherNationality&&D.otherNationality)ss('ctl00_SiteContentPlaceHolder_FormView1_ddlAPP_OTH_NATL',D.otherNationality);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblPermResOtherCntryInd','N');
  if(D.nationalIdNumber)sv('ctl00_SiteContentPlaceHolder_FormView1_tbxAPP_NATIONAL_ID',D.nationalIdNumber);
  else sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_NATIONAL_ID_NA',true);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_SSN_NA',true);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexAPP_TAX_ID_NA',true);
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

function fillPassport(){
  console.log('🔄 Filling Passport...');
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_TYPE','R');
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_NUM',D.passportNumber);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_BOOK_NUM_NA',true);
  ss('ctl00_SiteContentPlaceHolder_FormView1_ddlPPT_ISSUED_CNTRY',D.passportIssuingCountry);
  sc('ctl00_SiteContentPlaceHolder_FormView1_cbexPPT_ISSUED_IN_STATE_NA',true);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_ISSUED_DTD',D.passportIssueDate);
  sv('ctl00_SiteContentPlaceHolder_FormView1_tbxPPT_EXPIRE_DTD',D.passportExpiryDate);
  sr('ctl00$SiteContentPlaceHolder$FormView1$rblLOST_PPT_IND','N');
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
  const t=document.title;
  if(t.includes('Personal Information 1')||t.includes('Personal 1'))fillPersonal1();
  else if(t.includes('Personal 2'))fillPersonal2();
  else if(t.includes('Address'))fillAddress();
  else if(t.includes('Passport'))fillPassport();
  else if(t.includes('U.S. Contact'))fillUSContact();
  else if(t.includes('Family'))fillFamily();
  else if(t.includes('Work')||t.includes('Education'))fillWork();
  else if(t.includes('Security'))fillSecurity();
  else if(t.includes('Previous'))fillPreviousTravel();
  else console.log('Unknown page. Use: fillPersonal1(), fillAddress(), etc.');
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
