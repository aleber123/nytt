/**
 * Step 5: Document Source
 * Allows customer to choose between sending original documents or uploading digital copies
 * If upload is selected, shows file upload interface on the same page
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';

export const Step5DocumentSource: React.FC<StepProps & {
  onDocumentSourceSelect?: (source: string) => void;
}> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  onDocumentSourceSelect,
  currentLocale
}) => {
  const { t } = useTranslation('common');
  const isEn = currentLocale === 'en';
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Track if user wants to send support docs later
  const [sendDocsLater, setSendDocsLater] = useState(false);

  // Check if notarization is selected (need support documents)
  const hasNotarization = answers.services.includes('notarization');
  const notarizationDetails = answers.notarizationDetails || {
    signature: false,
    signingAuthority: false,
    copy: false,
    unknown: false,
    other: false,
    otherText: ''
  };
  
  // Determine which support documents are needed
  const needsIdDocument = hasNotarization && (notarizationDetails.signature || notarizationDetails.unknown);
  const needsSigningAuthority = hasNotarization && (notarizationDetails.signingAuthority || notarizationDetails.unknown);

  const handleSourceSelect = (source: string) => {
    if (source === 'original') {
      setAnswers({ 
        ...answers, 
        documentSource: 'original', 
        uploadedFiles: []
      });
      // If notarization is selected, stay on page to show support document options
      // Otherwise proceed to next step
      if (hasNotarization && (needsIdDocument || needsSigningAuthority)) {
        // Stay on page - will show support document section
      } else {
        if (onDocumentSourceSelect) {
          onDocumentSourceSelect(source);
        } else {
          onNext();
        }
      }
    } else {
      // For upload, just set the source - don't proceed yet
      setAnswers({
        ...answers,
        documentSource: 'upload',
        uploadedFiles: new Array(answers.quantity).fill(null)
      });
    }
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newFiles: (File | null)[] = [...answers.uploadedFiles];
    newFiles[index] = file;
    setAnswers({ ...answers, uploadedFiles: newFiles as File[] });
  };

  const handleIdDocumentChange = (file: File | null) => {
    setAnswers({ ...answers, idDocumentFile: file, willSendIdDocumentLater: false });
  };

  const handleRegistrationCertChange = (file: File | null) => {
    setAnswers({ ...answers, registrationCertFile: file, willSendRegistrationCertLater: false });
  };

  const handleSigningAuthorityIdChange = (file: File | null) => {
    setAnswers({ ...answers, signingAuthorityIdFile: file, willSendSigningAuthorityIdLater: false });
  };

  const handleContinue = () => {
    if (onDocumentSourceSelect) {
      onDocumentSourceSelect('upload');
    } else {
      onNext();
    }
  };

  // Check if all required documents are uploaded or marked as "send later"
  const allMainDocsUploaded = answers.willSendMainDocsLater || (
    answers.uploadedFiles.length === answers.quantity && 
    answers.uploadedFiles.every(file => file !== null)
  );
  
  const idDocReady = !needsIdDocument || answers.idDocumentFile || answers.willSendIdDocumentLater;
  
  // For signing authority, need BOTH registration cert AND ID
  const regCertReady = !needsSigningAuthority || answers.registrationCertFile || answers.willSendRegistrationCertLater;
  const signingAuthIdReady = !needsSigningAuthority || answers.signingAuthorityIdFile || answers.willSendSigningAuthorityIdLater;
  const signingAuthReady = regCertReady && signingAuthIdReady;
  
  // For upload flow: need all main docs + support docs
  const canContinueUpload = allMainDocsUploaded && idDocReady && signingAuthReady;
  
  // For original flow with notarization: just need support docs ready
  const canContinueOriginal = idDocReady && signingAuthReady;

  // If original is selected AND notarization needs support docs, show support document interface
  if (answers.documentSource === 'original' && hasNotarization && (needsIdDocument || needsSigningAuthority)) {
    return (
      <StepContainer
        title={isEn ? 'Supporting documents for notarization' : 'Stöddokument för notarisering'}
        subtitle={isEn 
          ? 'Upload or send supporting documents required for notarization'
          : 'Ladda upp eller skicka stöddokument som krävs för notarisering'}
        onBack={() => setAnswers({ ...answers, documentSource: '' })}
        onNext={() => {
          if (onDocumentSourceSelect) {
            onDocumentSourceSelect('original');
          } else {
            onNext();
          }
        }}
        nextDisabled={!canContinueOriginal}
        nextLabel={isEn ? 'Continue' : 'Fortsätt'}
      >
        {/* Info about original documents */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">📬</span>
            <div>
              <div className="font-medium text-blue-900">
                {isEn ? 'You will send original documents by mail' : 'Du skickar originaldokument via post'}
              </div>
              <div className="text-sm text-blue-700">
                {isEn 
                  ? 'Your original documents will be sent to us. Below you can upload or choose to send the required supporting documents.'
                  : 'Dina originaldokument skickas till oss. Nedan kan du ladda upp eller välja att skicka de stöddokument som krävs.'}
              </div>
            </div>
          </div>
        </div>

        {/* Support Documents Section */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-start mb-4">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <h3 className="font-semibold text-amber-900">
                {isEn ? 'Required supporting documents' : 'Stöddokument som krävs'}
              </h3>
              <p className="text-sm text-amber-700">
                {isEn 
                  ? 'These documents are needed to verify the signatory for notarization'
                  : 'Dessa dokument behövs för att verifiera undertecknaren vid notarisering'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* ID/Passport Upload */}
            {needsIdDocument && (
              <div className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                answers.idDocumentFile 
                  ? 'border-green-400 bg-green-50' 
                  : answers.willSendIdDocumentLater
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-amber-300 bg-white'
              }`}>
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-2">🪪</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {isEn ? 'ID/Passport copy (signature page)' : 'Kopia på ID/Pass (signatursidan)'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isEn 
                        ? 'Copy of ID showing the signature of the person signing the document'
                        : 'Kopia på ID som visar signaturen för den som signerar dokumentet'}
                    </div>
                  </div>
                </div>

                {!answers.willSendIdDocumentLater && (
                  <>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleIdDocumentChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="id-doc-upload-original"
                    />
                    <label 
                      htmlFor="id-doc-upload-original"
                      className="block w-full text-center py-2 px-4 border border-amber-300 rounded-md bg-white hover:bg-amber-50 cursor-pointer text-sm font-medium text-amber-700"
                    >
                      {answers.idDocumentFile 
                        ? `✅ ${answers.idDocumentFile.name}` 
                        : (isEn ? '📎 Upload ID/Passport' : '📎 Ladda upp ID/Pass')}
                    </label>
                  </>
                )}

                <label className="flex items-center mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={answers.willSendIdDocumentLater || false}
                    onChange={(e) => setAnswers({ 
                      ...answers, 
                      willSendIdDocumentLater: e.target.checked,
                      idDocumentFile: e.target.checked ? null : answers.idDocumentFile
                    })}
                    className="h-4 w-4 text-amber-600 rounded mr-2"
                  />
                  <span className="text-sm text-gray-600">
                    {isEn ? 'I will print and send this with my documents' : 'Jag skriver ut och skickar detta med mina dokument'}
                  </span>
                </label>
              </div>
            )}

            {/* Signing Authority - Two separate documents needed */}
            {needsSigningAuthority && (
              <>
                {/* 1. Registration Certificate */}
                <div className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                  answers.registrationCertFile 
                    ? 'border-green-400 bg-green-50' 
                    : answers.willSendRegistrationCertLater
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-amber-300 bg-white'
                }`}>
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">🏢</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {isEn ? 'Registration certificate' : 'Registreringsbevis'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isEn 
                          ? 'Company registration proving signing authority'
                          : 'Registreringsbevis som styrker firmateckningsrätt'}
                      </div>
                    </div>
                  </div>

                  {!answers.willSendRegistrationCertLater && (
                    <>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleRegistrationCertChange(e.target.files?.[0] || null)}
                        className="hidden"
                        id="reg-cert-upload-original"
                      />
                      <label 
                        htmlFor="reg-cert-upload-original"
                        className="block w-full text-center py-2 px-4 border border-amber-300 rounded-md bg-white hover:bg-amber-50 cursor-pointer text-sm font-medium text-amber-700"
                      >
                        {answers.registrationCertFile 
                          ? `✅ ${answers.registrationCertFile.name}` 
                          : (isEn ? '📎 Upload registration certificate' : '📎 Ladda upp registreringsbevis')}
                      </label>
                    </>
                  )}

                  <label className="flex items-center mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.willSendRegistrationCertLater || false}
                      onChange={(e) => setAnswers({ 
                        ...answers, 
                        willSendRegistrationCertLater: e.target.checked,
                        registrationCertFile: e.target.checked ? null : answers.registrationCertFile
                      })}
                      className="h-4 w-4 text-amber-600 rounded mr-2"
                    />
                    <span className="text-sm text-gray-600">
                      {isEn ? 'I will print and send this with my documents' : 'Jag skriver ut och skickar detta med mina dokument'}
                    </span>
                  </label>
                </div>

                {/* 2. ID/Passport of signatory */}
                <div className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                  answers.signingAuthorityIdFile 
                    ? 'border-green-400 bg-green-50' 
                    : answers.willSendSigningAuthorityIdLater
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-amber-300 bg-white'
                }`}>
                  <div className="flex items-center mb-2">
                    <span className="text-xl mr-2">🪪</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {isEn ? 'ID/Passport of signatory' : 'ID/Pass på firmatecknaren'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isEn 
                          ? 'ID document of the person with signing authority'
                          : 'ID-handling för personen med firmateckningsrätt'}
                      </div>
                    </div>
                  </div>

                  {!answers.willSendSigningAuthorityIdLater && (
                    <>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleSigningAuthorityIdChange(e.target.files?.[0] || null)}
                        className="hidden"
                        id="signing-auth-id-upload-original"
                      />
                      <label 
                        htmlFor="signing-auth-id-upload-original"
                        className="block w-full text-center py-2 px-4 border border-amber-300 rounded-md bg-white hover:bg-amber-50 cursor-pointer text-sm font-medium text-amber-700"
                      >
                        {answers.signingAuthorityIdFile 
                          ? `✅ ${answers.signingAuthorityIdFile.name}` 
                          : (isEn ? '📎 Upload ID/Passport' : '📎 Ladda upp ID/Pass')}
                      </label>
                    </>
                  )}

                  <label className="flex items-center mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={answers.willSendSigningAuthorityIdLater || false}
                      onChange={(e) => setAnswers({ 
                        ...answers, 
                        willSendSigningAuthorityIdLater: e.target.checked,
                        signingAuthorityIdFile: e.target.checked ? null : answers.signingAuthorityIdFile
                      })}
                      className="h-4 w-4 text-amber-600 rounded mr-2"
                    />
                    <span className="text-sm text-gray-600">
                      {isEn ? 'I will print and send this with my documents' : 'Jag skriver ut och skickar detta med mina dokument'}
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info about what to include */}
        {(answers.willSendIdDocumentLater || answers.willSendRegistrationCertLater || answers.willSendSigningAuthorityIdLater) && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-xl mr-2">📦</span>
              <div className="text-sm text-blue-800">
                <strong>{isEn ? 'Remember to include:' : 'Kom ihåg att inkludera:'}</strong>
                <ul className="mt-1 list-disc list-inside">
                  {answers.willSendIdDocumentLater && (
                    <li>{isEn ? 'Copy of ID/Passport (signature page)' : 'Kopia på ID/Pass (signatursidan)'}</li>
                  )}
                  {answers.willSendRegistrationCertLater && (
                    <li>{isEn ? 'Registration certificate' : 'Registreringsbevis'}</li>
                  )}
                  {answers.willSendSigningAuthorityIdLater && (
                    <li>{isEn ? 'ID/Passport of signatory' : 'ID/Pass på firmatecknaren'}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </StepContainer>
    );
  }

  // If upload is selected, show upload interface
  if (answers.documentSource === 'upload') {
    return (
      <StepContainer
        title={isEn ? 'Upload your documents' : 'Ladda upp dina dokument'}
        subtitle={isEn 
          ? `Upload ${answers.quantity} document${answers.quantity > 1 ? 's' : ''} for legalization`
          : `Ladda upp ${answers.quantity} dokument för legalisering`}
        onBack={() => setAnswers({ ...answers, documentSource: '', uploadedFiles: [] })}
        onNext={handleContinue}
        nextDisabled={!canContinueUpload}
        nextLabel={isEn ? 'Continue' : 'Fortsätt'}
      >
        {/* Main Documents Upload */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-start mb-4">
            <span className="text-2xl mr-3">📄</span>
            <div>
              <h3 className="font-semibold text-blue-900">
                {isEn ? 'Documents for legalization' : 'Dokument för legalisering'}
              </h3>
              <p className="text-sm text-blue-700">
                {isEn 
                  ? 'Upload clear, readable copies in PDF, JPG or PNG format'
                  : 'Ladda upp tydliga, läsbara kopior i PDF, JPG eller PNG-format'}
              </p>
            </div>
          </div>

          {/* Upload fields - hidden if sending later */}
          {!answers.willSendMainDocsLater && (
            <div className="space-y-3">
              {Array.from({ length: answers.quantity }, (_, index) => (
                <div 
                  key={index}
                  className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
                    answers.uploadedFiles[index] 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400 bg-white'
                  }`}
                >
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                    className="hidden"
                    id={`doc-upload-${index}`}
                  />
                  
                  <label 
                    htmlFor={`doc-upload-${index}`}
                    className="flex flex-col gap-3 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {answers.uploadedFiles[index] ? '✅' : '📎'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {isEn ? `Document ${index + 1}` : `Dokument ${index + 1}`}
                        </div>
                        {answers.uploadedFiles[index] ? (
                          <div className="text-sm text-green-600 break-words">
                            {answers.uploadedFiles[index]?.name}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {isEn ? 'Click to upload' : 'Klicka för att ladda upp'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {answers.uploadedFiles[index] && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFileChange(index, null);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Send later checkbox */}
          <label className="flex items-center mt-4 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={answers.willSendMainDocsLater || false}
              onChange={(e) => setAnswers({ 
                ...answers, 
                willSendMainDocsLater: e.target.checked,
                uploadedFiles: e.target.checked ? [] : new Array(answers.quantity).fill(null)
              })}
              className="h-4 w-4 text-blue-600 rounded mr-3"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                {isEn ? 'I will send documents later via email' : 'Jag skickar in dokumenten senare via e-post'}
              </span>
              <p className="text-xs text-gray-500">
                {isEn 
                  ? 'Email your documents to info@doxvl.se with your order number'
                  : 'Maila dina dokument till info@doxvl.se med ditt ordernummer'}
              </p>
            </div>
          </label>
        </div>

        {/* Support Documents for Notarization */}
        {hasNotarization && (needsIdDocument || needsSigningAuthority) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6 mb-6">
            <div className="flex items-start mb-4">
              <span className="text-2xl mr-3">📋</span>
              <div>
                <h3 className="font-semibold text-amber-900">
                  {isEn ? 'Supporting documents for notarization' : 'Stöddokument för notarisering'}
                </h3>
                <p className="text-sm text-amber-700">
                  {isEn 
                    ? 'These documents are required to verify the signatory'
                    : 'Dessa dokument krävs för att verifiera undertecknaren'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* ID/Passport Upload */}
              {needsIdDocument && (
                <>
                  {!answers.willSendIdDocumentLater && (
                    <div className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
                      answers.idDocumentFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-amber-400 bg-white'
                    }`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleIdDocumentChange(e.target.files?.[0] || null)}
                        className="hidden"
                        id="id-doc-upload"
                      />
                      <label 
                        htmlFor="id-doc-upload"
                        className="flex flex-col gap-3 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {answers.idDocumentFile ? '✅' : '🪪'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {isEn ? 'ID/Passport copy' : 'Kopia på ID/Pass'}
                            </div>
                            {answers.idDocumentFile ? (
                              <div className="text-sm text-green-600 break-words">
                                {answers.idDocumentFile.name}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {isEn ? 'Click to upload' : 'Klicka för att ladda upp'}
                              </div>
                            )}
                          </div>
                        </div>
                        {answers.idDocumentFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleIdDocumentChange(null);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </label>
                    </div>
                  )}

                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={answers.willSendIdDocumentLater || false}
                      onChange={(e) => setAnswers({ 
                        ...answers, 
                        willSendIdDocumentLater: e.target.checked,
                        idDocumentFile: e.target.checked ? null : answers.idDocumentFile
                      })}
                      className="h-4 w-4 text-amber-600 rounded mr-3"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {isEn ? 'I will send ID/Passport later via email' : 'Jag skickar ID/Pass senare via e-post'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {isEn 
                          ? 'Email to info@doxvl.se with your order number'
                          : 'Maila till info@doxvl.se med ditt ordernummer'}
                      </p>
                    </div>
                  </label>
                </>
              )}

              {/* Signing Authority - Two separate documents needed */}
              {needsSigningAuthority && (
                <>
                  {/* 1. Registration Certificate */}
                  {!answers.willSendRegistrationCertLater && (
                    <div className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
                      answers.registrationCertFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-amber-400 bg-white'
                    }`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleRegistrationCertChange(e.target.files?.[0] || null)}
                        className="hidden"
                        id="reg-cert-upload"
                      />
                      <label 
                        htmlFor="reg-cert-upload"
                        className="flex flex-col gap-3 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {answers.registrationCertFile ? '✅' : '🏢'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {isEn ? 'Registration certificate' : 'Registreringsbevis'}
                            </div>
                            {answers.registrationCertFile ? (
                              <div className="text-sm text-green-600 break-words">
                                {answers.registrationCertFile.name}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {isEn ? 'Click to upload' : 'Klicka för att ladda upp'}
                              </div>
                            )}
                          </div>
                        </div>
                        {answers.registrationCertFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRegistrationCertChange(null);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </label>
                    </div>
                  )}

                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={answers.willSendRegistrationCertLater || false}
                      onChange={(e) => setAnswers({ 
                        ...answers, 
                        willSendRegistrationCertLater: e.target.checked,
                        registrationCertFile: e.target.checked ? null : answers.registrationCertFile
                      })}
                      className="h-4 w-4 text-amber-600 rounded mr-3"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {isEn ? 'I will send registration certificate later via email' : 'Jag skickar registreringsbevis senare via e-post'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {isEn 
                          ? 'Email to info@doxvl.se with your order number'
                          : 'Maila till info@doxvl.se med ditt ordernummer'}
                      </p>
                    </div>
                  </label>

                  {/* 2. ID/Passport of signatory */}
                  {!answers.willSendSigningAuthorityIdLater && (
                    <div className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
                      answers.signingAuthorityIdFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-amber-400 bg-white'
                    }`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleSigningAuthorityIdChange(e.target.files?.[0] || null)}
                        className="hidden"
                        id="signing-auth-id-upload"
                      />
                      <label 
                        htmlFor="signing-auth-id-upload"
                        className="flex flex-col gap-3 cursor-pointer sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {answers.signingAuthorityIdFile ? '✅' : '🪪'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900">
                              {isEn ? 'ID of signatory' : 'ID på firmatecknaren'}
                            </div>
                            {answers.signingAuthorityIdFile ? (
                              <div className="text-sm text-green-600 break-words">
                                {answers.signingAuthorityIdFile.name}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {isEn ? 'Click to upload' : 'Klicka för att ladda upp'}
                              </div>
                            )}
                          </div>
                        </div>
                        {answers.signingAuthorityIdFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSigningAuthorityIdChange(null);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </label>
                    </div>
                  )}

                  <label className="flex items-center cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={answers.willSendSigningAuthorityIdLater || false}
                      onChange={(e) => setAnswers({ 
                        ...answers, 
                        willSendSigningAuthorityIdLater: e.target.checked,
                        signingAuthorityIdFile: e.target.checked ? null : answers.signingAuthorityIdFile
                      })}
                      className="h-4 w-4 text-amber-600 rounded mr-3"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {isEn ? 'I will send signatory ID later via email' : 'Jag skickar firmatecknarens ID senare via e-post'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {isEn 
                          ? 'Email to info@doxvl.se with your order number'
                          : 'Maila till info@doxvl.se med ditt ordernummer'}
                      </p>
                    </div>
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-gray-900">
                {isEn ? 'Upload status' : 'Uppladdningsstatus'}
              </div>
              <div className="text-sm text-gray-600">
                {answers.uploadedFiles.filter(f => f !== null).length} / {answers.quantity} {isEn ? 'documents uploaded' : 'dokument uppladdade'}
              </div>
            </div>
            <div className={`text-2xl ${canContinueUpload ? 'text-green-500' : 'text-gray-300'}`}>
              {canContinueUpload ? '✅' : '⏳'}
            </div>
          </div>
        </div>

        {/* Info about sending later */}
        {(answers.willSendMainDocsLater || answers.willSendIdDocumentLater || answers.willSendRegistrationCertLater || answers.willSendSigningAuthorityIdLater) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-xl mr-2">📧</span>
              <div className="text-sm text-blue-800">
                <strong>{isEn ? 'Remember:' : 'Kom ihåg:'}</strong>{' '}
                {isEn 
                  ? 'You have chosen to send some documents later. Please email them to info@doxvl.se with your order number.'
                  : 'Du har valt att skicka vissa dokument senare. Vänligen maila dem till info@doxvl.se med ditt ordernummer.'}
              </div>
            </div>
          </div>
        )}
      </StepContainer>
    );
  }

  // Initial selection view
  return (
    <StepContainer
      title={t('orderFlow.step5.title', 'Hur skickar du dokumenten?')}
      subtitle={t('orderFlow.step5.subtitle', 'Välj hur du vill skicka dina dokument till oss')}
      onBack={onBack}
      showNext={false}
    >
      {/* Quantity Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📄</span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step5.selectedQuantity', { quantity: answers.quantity })}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step5.quantityNote', 'Du har valt att legalisera {{quantity}} dokument', { quantity: answers.quantity })}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {/* Original Documents */}
        <button
          onClick={() => handleSourceSelect('original')}
          className={`w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
            answers.documentSource === 'original'
              ? 'border-custom-button bg-custom-button-bg'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">📬</span>
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">
                {t('orderFlow.step5.originalDocuments', 'Skicka originaldokument')}
              </div>
              <div className="text-gray-600">
                {t('orderFlow.step5.originalDescription', 'Du skickar fysiska originaldokument till oss via post eller hämtning')}
              </div>
            </div>
          </div>
        </button>

        {/* Upload Documents */}
        <button
          onClick={() => handleSourceSelect('upload')}
          className={`w-full p-4 sm:p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
            answers.documentSource === 'upload'
              ? 'border-custom-button bg-custom-button-bg'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center">
            <span className="text-3xl mr-4">📤</span>
            <div className="text-left">
              <div className="text-lg font-medium text-gray-900">
                {t('orderFlow.step5.uploadDocuments', 'Ladda upp dokument')}
              </div>
              <div className="text-gray-600">
                {t('orderFlow.step5.uploadDescription', 'Ladda upp digitala kopior av dina dokument direkt')}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">
              {t('orderFlow.step5.infoTitle', 'Viktigt att veta')}
            </h4>
            <p className="text-sm text-amber-800">
              {t('orderFlow.step5.infoText', 'För vissa länder och dokumenttyper kan originaldokument krävas. Vi kontaktar dig om detta gäller din beställning.')}
            </p>
          </div>
        </div>
      </div>
    </StepContainer>
  );
};

export default Step5DocumentSource;
