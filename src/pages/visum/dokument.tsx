/**
 * Visa Document Upload Portal
 * Allows customers to upload required documents for their visa application
 * Accessed via secure token from confirmation email
 */

import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { getVisaOrderByToken, updateVisaOrder, VisaOrder } from '@/firebase/visaOrderService';
import { getDocumentRequirementsForProduct, DocumentRequirement } from '@/firebase/visaRequirementsService';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';
import { toast, Toaster } from 'react-hot-toast';

interface UploadedDocument {
  requirementId: string;
  requirementName: string;
  originalName: string;
  size: number;
  type: string;
  downloadURL: string;
  storagePath: string;
  uploadedAt: any;
}

export default function VisaDocumentUploadPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [order, setOrder] = useState<VisaOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDocument>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const locale = router.locale || 'sv';

  useEffect(() => {
    if (!router.isReady) return;

    const fetchOrder = async () => {
      const token = router.query.token as string;

      if (!token) {
        setOrder(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const orderData = await getVisaOrderByToken(token);

        if (orderData) {
          setOrder(orderData);
          setError(null);
          
          // Build uploaded docs map from existing files
          if (orderData.uploadedFiles) {
            const existingUploads: Record<string, UploadedDocument> = {};
            orderData.uploadedFiles.forEach((file: any) => {
              if (file.requirementId) {
                existingUploads[file.requirementId] = file;
              }
            });
            setUploadedDocs(existingUploads);
          }
          
          // Fetch document requirements for this visa product
          if (orderData.destinationCountryCode && orderData.visaProduct?.id) {
            try {
              const docs = await getDocumentRequirementsForProduct(
                orderData.destinationCountryCode,
                orderData.visaProduct.id
              );
              setDocumentRequirements(docs);
            } catch {
              // Silent fail
            }
          }
        } else {
          setOrder(null);
          setError(locale === 'en' ? 'Order not found' : 'Beställningen hittades inte');
        }
      } catch (err) {
        setOrder(null);
        setError(locale === 'en' ? 'Error loading order' : 'Kunde inte ladda beställningen');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [router.isReady, router.query.token, locale]);

  const handleFileSelect = async (requirement: DocumentRequirement, file: File) => {
    if (!order?.id) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(locale === 'en' ? 'File too large. Maximum 10MB.' : 'Filen är för stor. Max 10MB.');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(locale === 'en' ? 'Invalid file type. Use JPG, PNG, GIF or PDF.' : 'Ogiltig filtyp. Använd JPG, PNG, GIF eller PDF.');
      return;
    }
    
    setUploadingDoc(requirement.id);
    
    try {
      const storage = getStorage();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${order.id}_${requirement.id}_${Date.now()}_${cleanFileName}`;
      const storageRef = ref(storage, `visa-documents/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const uploadedFileData: UploadedDocument = {
        requirementId: requirement.id,
        requirementName: locale === 'en' ? requirement.nameEn : requirement.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        downloadURL: downloadURL,
        storagePath: `visa-documents/${fileName}`,
        uploadedAt: Timestamp.now()
      };
      
      // Update local state
      const newUploadedDocs = { ...uploadedDocs, [requirement.id]: uploadedFileData };
      setUploadedDocs(newUploadedDocs);
      
      // Get existing files that aren't for this requirement
      const existingFiles = (order.uploadedFiles || []).filter(
        (f: any) => f.requirementId !== requirement.id
      );
      
      // Update order with all files
      await updateVisaOrder(order.id, {
        uploadedFiles: [...existingFiles, uploadedFileData],
        filesUploaded: true,
        filesUploadedAt: Timestamp.now()
      });
      
      toast.success(locale === 'en' ? 'Document uploaded!' : 'Dokument uppladdat!');
      
    } catch (err) {
      toast.error(locale === 'en' ? 'Upload failed. Please try again.' : 'Uppladdning misslyckades. Försök igen.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const triggerFileInput = (requirementId: string) => {
    fileInputRefs.current[requirementId]?.click();
  };

  const uploadableRequirements = documentRequirements.filter(d => d.uploadable && d.isActive);
  const allRequiredUploaded = uploadableRequirements
    .filter(d => d.required)
    .every(d => uploadedDocs[d.id]);

  return (
    <>
      <Head>
        <title>{locale === 'en' ? 'Upload Documents' : 'Ladda upp dokument'} | DOX Visumpartner</title>
      </Head>
      <Toaster position="top-center" />

      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                {locale === 'en' ? 'Loading...' : 'Laddar...'}
              </p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === 'en' ? 'Error' : 'Fel'}
              </h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/visum" className="text-primary-600 hover:underline">
                {locale === 'en' ? 'Back to Visa Services' : 'Tillbaka till Visumtjänster'}
              </Link>
            </div>
          ) : order ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {locale === 'en' ? 'Upload Documents' : 'Ladda upp dokument'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {locale === 'en' 
                        ? `Order #${order.orderNumber} - ${order.destinationCountry} Visa`
                        : `Order #${order.orderNumber} - Visum ${order.destinationCountry}`}
                    </p>
                  </div>
                  <Link 
                    href={`/visum/bekraftelse?token=${router.query.token}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {locale === 'en' ? '← Back to order' : '← Tillbaka till order'}
                  </Link>
                </div>

                {/* Progress indicator */}
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {locale === 'en' ? 'Documents uploaded:' : 'Dokument uppladdade:'}
                    </span>
                    <span className="font-medium">
                      {Object.keys(uploadedDocs).length} / {uploadableRequirements.length}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ 
                        width: `${uploadableRequirements.length > 0 
                          ? (Object.keys(uploadedDocs).length / uploadableRequirements.length) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              {uploadableRequirements.length > 0 ? (
                <div className="bg-white rounded-lg shadow-card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {locale === 'en' ? 'Required Documents' : 'Dokument som krävs'}
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    {locale === 'en' 
                      ? 'Please upload the following documents. Accepted formats: JPG, PNG, GIF, PDF (max 10MB each).'
                      : 'Vänligen ladda upp följande dokument. Godkända format: JPG, PNG, GIF, PDF (max 10MB per fil).'}
                  </p>

                  <div className="space-y-4">
                    {uploadableRequirements.map((doc, index) => {
                      const isUploaded = !!uploadedDocs[doc.id];
                      const isUploading = uploadingDoc === doc.id;
                      
                      return (
                        <div 
                          key={doc.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            isUploaded 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isUploaded 
                                  ? 'bg-green-500 text-white' 
                                  : doc.required 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isUploaded ? '✓' : index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">
                                    {locale === 'en' ? doc.nameEn : doc.name}
                                  </h3>
                                  {doc.required && (
                                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                      {locale === 'en' ? 'Required' : 'Obligatoriskt'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                  {locale === 'en' ? doc.descriptionEn : doc.description}
                                </p>
                                
                                {isUploaded && (
                                  <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                                    <span>✓</span>
                                    <span>{uploadedDocs[doc.id].originalName}</span>
                                    <a 
                                      href={uploadedDocs[doc.id].downloadURL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {locale === 'en' ? 'View' : 'Visa'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <input
                                type="file"
                                ref={el => { fileInputRefs.current[doc.id] = el; }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelect(doc, file);
                                  e.target.value = '';
                                }}
                                accept=".jpg,.jpeg,.png,.gif,.pdf"
                                className="hidden"
                              />
                              <button
                                onClick={() => triggerFileInput(doc.id)}
                                disabled={isUploading}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  isUploaded
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                } disabled:opacity-50`}
                              >
                                {isUploading ? (
                                  <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    {locale === 'en' ? 'Uploading...' : 'Laddar upp...'}
                                  </span>
                                ) : isUploaded ? (
                                  locale === 'en' ? 'Replace' : 'Ersätt'
                                ) : (
                                  locale === 'en' ? 'Upload' : 'Ladda upp'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Completion message */}
                  {allRequiredUploaded && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <h3 className="font-medium text-green-800">
                            {locale === 'en' ? 'All required documents uploaded!' : 'Alla obligatoriska dokument uppladdade!'}
                          </h3>
                          <p className="text-sm text-green-700 mt-1">
                            {locale === 'en' 
                              ? 'We will review your documents and contact you if anything else is needed.'
                              : 'Vi granskar dina dokument och kontaktar dig om något mer behövs.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-card p-6 text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {locale === 'en' ? 'No documents to upload' : 'Inga dokument att ladda upp'}
                  </h2>
                  <p className="text-gray-600">
                    {locale === 'en'
                      ? 'There are no documents that need to be uploaded for this visa application. We will contact you if any documents are required.'
                      : 'Det finns inga dokument som behöver laddas upp för denna visumansökan. Vi kontaktar dig om några dokument behövs.'}
                  </p>
                </div>
              )}

              {/* Help section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-800 mb-2">
                  {locale === 'en' ? 'Need help?' : 'Behöver du hjälp?'}
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  {locale === 'en'
                    ? 'If you have questions about the required documents or need assistance, please contact us:'
                    : 'Om du har frågor om dokumentkraven eller behöver hjälp, kontakta oss:'}
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <a href="mailto:info@visumpartner.se" className="text-blue-600 hover:underline">
                    📧 info@visumpartner.se
                  </a>
                  <a href="tel:+4684094190" className="text-blue-600 hover:underline">
                    📞 08-40941900
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">
                {locale === 'en' ? 'Order Not Found' : 'Beställning hittades inte'}
              </h1>
              <p className="text-gray-600 mb-6">
                {locale === 'en' 
                  ? 'We could not find the order you are looking for.'
                  : 'Vi kunde inte hitta beställningen du söker.'}
              </p>
              <Link href="/visum" className="inline-block px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button/90">
                {locale === 'en' ? 'Back to Visa Services' : 'Tillbaka till Visumtjänster'}
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
