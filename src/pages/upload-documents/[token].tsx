/**
 * Customer Document Upload Page
 * 
 * Allows customers to upload additional documents via a secure token link.
 */

import React, { useState, useRef } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

interface DocumentRequest {
  orderId: string;
  orderNumber: string;
  customMessage: string;
  customerName: string;
  status: 'pending' | 'uploaded' | 'expired';
  expiresAt: string;
  locale: string;
  uploadedFiles: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

interface UploadDocumentsPageProps {
  token: string;
  documentRequest: DocumentRequest | null;
  error?: string;
}

// Translations
const translations = {
  sv: {
    pageTitle: 'Ladda upp dokument',
    invalidLink: 'Ogiltig eller utgången länk',
    invalidLinkDesc: 'Denna uppladdningslänk är inte längre giltig. Kontakta oss om du behöver ladda upp dokument.',
    contactUs: 'Kontakta oss',
    linkExpired: 'Länken har gått ut',
    linkExpiredDesc: 'Denna uppladdningslänk har gått ut. Kontakta oss för att få en ny länk.',
    alreadyUploaded: 'Dokument redan uppladdade',
    alreadyUploadedDesc: 'Du har redan laddat upp dokument via denna länk. Om du behöver ladda upp fler dokument, kontakta oss.',
    uploadedFiles: 'Uppladdade filer',
    uploadSuccess: 'Uppladdning lyckades!',
    uploadSuccessDesc: 'Dina dokument har laddats upp. Vi kommer att granska dem och återkomma till dig.',
    filesUploaded: 'Uppladdade filer:',
    backToStatus: 'Gå till orderstatus',
    uploadDocs: 'Ladda upp kompletterande dokument',
    order: 'Order',
    messageFromHandler: 'Meddelande från handläggare:',
    dragAndDrop: 'Dra och släpp filer här',
    orClickToSelect: 'eller klicka för att välja filer',
    fileTypes: 'PDF, bilder, Word-dokument (max 25 MB per fil)',
    dropHere: 'Släpp filerna här...',
    selectedFiles: 'Valda filer',
    fileTooLarge: 'är för stor (max 25 MB)',
    uploading: 'Laddar upp...',
    uploadFiles: 'Ladda upp',
    file: 'fil',
    files: 'filer',
    questions: 'Har du frågor? Kontakta oss på',
    uploadError: 'Ett fel uppstod vid uppladdningen',
  },
  en: {
    pageTitle: 'Upload Documents',
    invalidLink: 'Invalid or expired link',
    invalidLinkDesc: 'This upload link is no longer valid. Contact us if you need to upload documents.',
    contactUs: 'Contact us',
    linkExpired: 'Link has expired',
    linkExpiredDesc: 'This upload link has expired. Contact us to get a new link.',
    alreadyUploaded: 'Documents already uploaded',
    alreadyUploadedDesc: 'You have already uploaded documents via this link. If you need to upload more documents, please contact us.',
    uploadedFiles: 'Uploaded files',
    uploadSuccess: 'Upload successful!',
    uploadSuccessDesc: 'Your documents have been uploaded. We will review them and get back to you.',
    filesUploaded: 'Uploaded files:',
    backToStatus: 'Go to order status',
    uploadDocs: 'Upload supplementary documents',
    order: 'Order',
    messageFromHandler: 'Message from case handler:',
    dragAndDrop: 'Drag and drop files here',
    orClickToSelect: 'or click to select files',
    fileTypes: 'PDF, images, Word documents (max 25 MB per file)',
    dropHere: 'Drop files here...',
    selectedFiles: 'Selected files',
    fileTooLarge: 'is too large (max 25 MB)',
    uploading: 'Uploading...',
    uploadFiles: 'Upload',
    file: 'file',
    files: 'files',
    questions: 'Have questions? Contact us at',
    uploadError: 'An error occurred during upload',
  }
};

export default function UploadDocumentsPage({ token, documentRequest, error }: UploadDocumentsPageProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get translations based on locale
  const locale = documentRequest?.locale === 'en' ? 'en' : 'sv';
  const t = translations[locale];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    // Filter valid files (max 25MB each)
    const validFiles = newFiles.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`"${file.name}" ${t.fileTooLarge}`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0) setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadError(locale === 'en' ? 'Please select at least one file' : 'Vänligen välj minst en fil');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Convert files to base64
      const filesData = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          data: await fileToBase64(file)
        }))
      );

      const response = await fetch('/api/document-request/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, files: filesData })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.uploadError);
      }

      setUploadSuccess(true);
      setUploadedFiles(files.map(f => f.name));
      setFiles([]);
    } catch (err: any) {
      setUploadError(err.message || t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  // Check if expired
  const isExpired = documentRequest?.expiresAt 
    ? new Date(documentRequest.expiresAt) < new Date()
    : false;

  // Already uploaded
  const alreadyUploaded = documentRequest?.status === 'uploaded';

  if (error || !documentRequest) {
    return (
      <>
        <Head>
          <title>{t.invalidLink} - DOX Visumpartner</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t.invalidLink}</h1>
            <p className="text-gray-600 mb-6">
              {t.invalidLinkDesc}
            </p>
            <a 
              href="mailto:info@doxvl.se"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {t.contactUs}
            </a>
          </div>
        </div>
      </>
    );
  }

  if (isExpired) {
    return (
      <>
        <Head>
          <title>{t.linkExpired} - DOX Visumpartner</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t.linkExpired}</h1>
            <p className="text-gray-600 mb-6">
              {t.linkExpiredDesc}
            </p>
            <a 
              href="mailto:info@doxvl.se"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {t.contactUs}
            </a>
          </div>
        </div>
      </>
    );
  }

  if (uploadSuccess || alreadyUploaded) {
    return (
      <>
        <Head>
          <title>{t.uploadSuccess} - DOX Visumpartner</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t.uploadSuccess}</h1>
            <p className="text-gray-600 mb-4">
              {t.uploadSuccessDesc}
            </p>
            {uploadedFiles.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-gray-700 mb-2">{t.filesUploaded}</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {uploadedFiles.map((name, i) => (
                    <li key={i} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
              {t.order}: #{documentRequest.orderNumber}
            </p>
            <a 
              href={`/orderstatus?order=${documentRequest.orderNumber}`}
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              {t.backToStatus}
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t.pageTitle} - DOX Visumpartner</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.uploadDocs}</h1>
            <p className="text-gray-600">{t.order}: #{documentRequest.orderNumber}</p>
          </div>

          {/* Message from handler */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-1">{t.messageFromHandler}</h3>
                <p className="text-sm text-yellow-700 whitespace-pre-wrap">{documentRequest.customMessage}</p>
              </div>
            </div>
          </div>

          {/* Upload area */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {isDragActive ? (
                <p className="text-primary-600 font-medium">{t.dropHere}</p>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-1">{t.dragAndDrop}</p>
                  <p className="text-gray-500 text-sm">{t.orClickToSelect}</p>
                  <p className="text-gray-400 text-xs mt-2">{t.fileTypes}</p>
                </>
              )}
            </div>

            {/* Selected files */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t.selectedFiles} ({files.length})</h3>
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error message */}
            {uploadError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="w-full mt-6 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.uploading}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {t.uploadFiles} {files.length} {files.length === 1 ? t.file : t.files}
                </>
              )}
            </button>
          </div>

          {/* Help text */}
          <div className="text-center text-sm text-gray-500">
            <p>{t.questions} <a href="mailto:info@doxvl.se" className="text-primary-600 hover:underline">info@doxvl.se</a></p>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const token = params?.token as string;

  if (!token) {
    return { props: { token: '', documentRequest: null, error: 'Invalid token' } };
  }

  try {
    // Import admin SDK
    const { adminDb } = await import('@/lib/firebaseAdmin');
    
    // Find document request by token
    const querySnap = await adminDb.collection('documentRequests')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (querySnap.empty) {
      return { props: { token, documentRequest: null, error: 'Not found' } };
    }

    const doc = querySnap.docs[0];
    const data = doc.data();

    return {
      props: {
        token,
        documentRequest: {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          customMessage: data.customMessage,
          customerName: data.customerName,
          status: data.status,
          expiresAt: data.expiresAt,
          locale: data.locale || 'sv',
          uploadedFiles: data.uploadedFiles || []
        }
      }
    };
  } catch (error) {
    return { props: { token, documentRequest: null, error: 'Server error' } };
  }
};
