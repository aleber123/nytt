import type { ExtendedOrder } from './types';

interface FilesTabProps {
  order: ExtendedOrder;
  adminUploadFiles: File[];
  setAdminUploadFiles: (files: File[]) => void;
  uploadingAdminFiles: boolean;
  onAdminFileUpload: () => Promise<void>;
  selectedFilesToSend: string[];
  setSelectedFilesToSend: (urls: string[]) => void;
  sendingFilesToCustomer: boolean;
  onSendFilesToCustomer: () => Promise<void>;
  fileMessageToCustomer: string;
  setFileMessageToCustomer: (msg: string) => void;
  filePassword: string;
  setFilePassword: (pw: string) => void;
  sendingPassword: boolean;
  onSendPasswordEmail: () => Promise<void>;
  adminFileInputRef: React.RefObject<HTMLInputElement>;
}

export default function FilesTab(props: FilesTabProps) {
  const {
    order, adminUploadFiles, setAdminUploadFiles, uploadingAdminFiles,
    onAdminFileUpload, selectedFilesToSend, setSelectedFilesToSend,
    sendingFilesToCustomer, onSendFilesToCustomer, fileMessageToCustomer,
    setFileMessageToCustomer, filePassword, setFilePassword, sendingPassword,
    onSendPasswordEmail, adminFileInputRef,
  } = props;

  const adminFiles = (order as any).adminFiles || [];
  const supplementaryFiles = (order as any).supplementaryFiles || [];

  return (
    <div className="space-y-6">
      {/* Return Shipping Label */}
      {(order as any).returnService === 'own-delivery' && (
        <ReturnLabelSection order={order} />
      )}

      {/* Customer Uploaded Files */}
      <UploadedFilesSection order={order} />

      {/* Supplementary Files */}
      {supplementaryFiles.length > 0 && (
        <SupplementaryFilesSection files={supplementaryFiles} />
      )}

      {/* Admin Files for Customer */}
      <AdminFilesSection
        order={order}
        adminFiles={adminFiles}
        adminUploadFiles={adminUploadFiles}
        setAdminUploadFiles={setAdminUploadFiles}
        uploadingAdminFiles={uploadingAdminFiles}
        onAdminFileUpload={onAdminFileUpload}
        selectedFilesToSend={selectedFilesToSend}
        setSelectedFilesToSend={setSelectedFilesToSend}
        sendingFilesToCustomer={sendingFilesToCustomer}
        onSendFilesToCustomer={onSendFilesToCustomer}
        fileMessageToCustomer={fileMessageToCustomer}
        setFileMessageToCustomer={setFileMessageToCustomer}
        filePassword={filePassword}
        setFilePassword={setFilePassword}
        sendingPassword={sendingPassword}
        onSendPasswordEmail={onSendPasswordEmail}
        adminFileInputRef={adminFileInputRef}
      />

      {/* Pickup Address */}
      {order.pickupService && order.pickupAddress && (
        <div>
          <h3 className="text-lg font-medium mb-4">Pickup address</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium text-blue-800">Document pickup ordered</span>
            </div>
            <p className="text-blue-700">{order.pickupAddress.street}</p>
            <p className="text-blue-700">{order.pickupAddress.postalCode} {order.pickupAddress.city}</p>
            <p className="text-blue-600 text-sm mt-2">We will contact the customer within 24 hours to schedule the pickup.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-sections ---

function ReturnLabelSection({ order }: { order: ExtendedOrder }) {
  const labelFile = order.uploadedFiles?.find((f: any) => f.originalName === (order as any).returnLabelFileName);
  const hasLabel = !!labelFile;

  return (
    <div className={`border rounded-lg p-4 ${hasLabel ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">📦</span>
        <h3 className={`text-lg font-medium ${hasLabel ? 'text-blue-900' : 'text-amber-900'}`}>Return Shipping Label</h3>
      </div>
      <p className={`text-sm mb-3 ${hasLabel ? 'text-blue-700' : 'text-amber-700'}`}>
        Customer uploaded their own return shipping label. Print and attach to package.
      </p>
      {hasLabel ? (
        <div className="flex space-x-2">
          <a href={labelFile?.downloadURL} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
            📥 Download Label
          </a>
          <button onClick={() => {
            if (labelFile?.downloadURL) {
              const pw = window.open(labelFile.downloadURL, '_blank');
              if (pw) pw.onload = () => pw.print();
            }
          }} className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium">
            🖨️ Print Label
          </button>
        </div>
      ) : (
        <div className="bg-amber-100 border border-amber-300 rounded p-3">
          <p className="text-amber-800 font-medium">⚠️ Return label missing</p>
          <p className="text-amber-700 text-sm mt-1">
            Customer selected own return but the label was not uploaded correctly.
            {(order as any).returnLabelFileName && (
              <span> Expected filename: <code className="bg-amber-200 px-1 rounded">{(order as any).returnLabelFileName}</code></span>
            )}
          </p>
          <p className="text-amber-700 text-sm mt-2">
            <strong>Action:</strong> Contact the customer and ask them to send the return label via email.
          </p>
        </div>
      )}
    </div>
  );
}

function UploadedFilesSection({ order }: { order: ExtendedOrder }) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Uploaded files</h3>
      {order.uploadedFiles && order.uploadedFiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {order.uploadedFiles.map((file: any, index: number) => {
            const isReturnLabel = (order as any).returnLabelFileName && file.originalName === (order as any).returnLabelFileName;
            return (
              <div key={index} className={`border rounded-lg p-4 ${isReturnLabel ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {isReturnLabel ? <span className="text-2xl mr-3">📦</span> : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{file.originalName}</p>
                        {isReturnLabel && <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Return Label</span>}
                      </div>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <a href={file.downloadURL} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm">Download</a>
                  <button onClick={() => window.open(file.downloadURL, '_blank')} className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Preview</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No files uploaded yet</p>
        </div>
      )}
    </div>
  );
}

function SupplementaryFilesSection({ files }: { files: any[] }) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Supplementary Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file: any, index: number) => (
          <div key={index} className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString('sv-SE')}`}
                  </p>
                </div>
              </div>
            </div>
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="block text-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Download</a>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminFilesSection(props: {
  order: ExtendedOrder;
  adminFiles: any[];
  adminUploadFiles: File[];
  setAdminUploadFiles: (f: File[]) => void;
  uploadingAdminFiles: boolean;
  onAdminFileUpload: () => Promise<void>;
  selectedFilesToSend: string[];
  setSelectedFilesToSend: (u: string[]) => void;
  sendingFilesToCustomer: boolean;
  onSendFilesToCustomer: () => Promise<void>;
  fileMessageToCustomer: string;
  setFileMessageToCustomer: (m: string) => void;
  filePassword: string;
  setFilePassword: (p: string) => void;
  sendingPassword: boolean;
  onSendPasswordEmail: () => Promise<void>;
  adminFileInputRef: React.RefObject<HTMLInputElement>;
}) {
  const { order, adminFiles, adminUploadFiles, setAdminUploadFiles, uploadingAdminFiles, onAdminFileUpload, selectedFilesToSend, setSelectedFilesToSend, sendingFilesToCustomer, onSendFilesToCustomer, fileMessageToCustomer, setFileMessageToCustomer, filePassword, setFilePassword, sendingPassword, onSendPasswordEmail, adminFileInputRef } = props;

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium mb-4">📤 Files for Customer</h3>
      <p className="text-gray-600 mb-4">Upload files here that you want to send to the customer (e.g., approved visa, processed documents).</p>

      {/* Encryption Reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <span className="text-2xl mr-3">🔐</span>
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Security Reminder</h4>
            <p className="text-sm text-amber-700"><strong>Always encrypt sensitive files with a password before uploading.</strong> After sending the file, use the password field to send the password in a separate email for security.</p>
            <p className="text-xs text-amber-600 mt-2">Tip: Use PDF encryption or zip with password protection before uploading.</p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
        <input type="file" ref={adminFileInputRef} multiple className="hidden" onChange={(e) => { if (e.target.files) setAdminUploadFiles(Array.from(e.target.files)); }} />
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <button onClick={() => adminFileInputRef.current?.click()} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Select Files</button>
          <p className="text-sm text-gray-500 mt-2">PDF, images, documents (max 25 MB per file)</p>
        </div>
        {adminUploadFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="font-medium text-gray-700">Selected files:</p>
            {adminUploadFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                <span className="text-sm truncate">{file.name}</span>
                <button onClick={() => setAdminUploadFiles(adminUploadFiles.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 ml-2">✕</button>
              </div>
            ))}
            <button onClick={onAdminFileUpload} disabled={uploadingAdminFiles} className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center">
              {uploadingAdminFiles ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Uploading...</>) : (<>Upload {adminUploadFiles.length} file{adminUploadFiles.length > 1 ? 's' : ''}</>)}
            </button>
          </div>
        )}
      </div>

      {/* Uploaded Admin Files List */}
      {adminFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Uploaded files ready to send:</h4>
          <div className="grid grid-cols-1 gap-4">
            {adminFiles.map((file: any, index: number) => (
              <div key={index} className={`border rounded-lg p-4 ${file.sentToCustomer ? 'border-green-200 bg-green-50' : 'border-purple-200 bg-purple-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mr-4 flex-shrink-0 ${file.sentToCustomer ? 'text-green-500' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.size ? `${(file.size / 1024).toFixed(0)} KB` : ''}{file.uploadedAt && ` • Uploaded ${new Date(file.uploadedAt).toLocaleDateString('en-GB')}`}</p>
                      {file.sentToCustomer && <p className="text-sm text-green-600 font-medium mt-1">✓ Sent to customer {file.sentAt && new Date(file.sentAt).toLocaleDateString('en-GB')}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm">Preview</a>
                    <button onClick={() => { setSelectedFilesToSend([file.url]); setFileMessageToCustomer(''); }}
                      className={`px-4 py-2 rounded text-sm font-medium flex items-center ${!file.sentToCustomer ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {!file.sentToCustomer ? 'Send to Customer' : 'Resend'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Send Confirmation Modal */}
          {selectedFilesToSend.length > 0 && (
            <SendFileModal
              order={order}
              adminFiles={adminFiles}
              selectedFilesToSend={selectedFilesToSend}
              setSelectedFilesToSend={setSelectedFilesToSend}
              sendingFilesToCustomer={sendingFilesToCustomer}
              onSendFilesToCustomer={onSendFilesToCustomer}
              fileMessageToCustomer={fileMessageToCustomer}
              setFileMessageToCustomer={setFileMessageToCustomer}
              filePassword={filePassword}
              setFilePassword={setFilePassword}
              sendingPassword={sendingPassword}
              onSendPasswordEmail={onSendPasswordEmail}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SendFileModal(props: {
  order: ExtendedOrder; adminFiles: any[]; selectedFilesToSend: string[];
  setSelectedFilesToSend: (u: string[]) => void; sendingFilesToCustomer: boolean;
  onSendFilesToCustomer: () => Promise<void>; fileMessageToCustomer: string;
  setFileMessageToCustomer: (m: string) => void; filePassword: string;
  setFilePassword: (p: string) => void; sendingPassword: boolean;
  onSendPasswordEmail: () => Promise<void>;
}) {
  const { order, adminFiles, selectedFilesToSend, setSelectedFilesToSend, sendingFilesToCustomer, onSendFilesToCustomer, fileMessageToCustomer, setFileMessageToCustomer, filePassword, setFilePassword, sendingPassword, onSendPasswordEmail } = props;
  const selectedFile = adminFiles.find((f: any) => f.url === selectedFilesToSend[0]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Send File to Customer</h3>
          <button onClick={() => setSelectedFilesToSend([])} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">Sending to: <strong>{order.customerInfo?.email}</strong></p>
          <p className="text-sm text-gray-500 mt-1">File: {selectedFile?.name}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Message to customer (optional)</label>
          <textarea value={fileMessageToCustomer} onChange={(e) => setFileMessageToCustomer(e.target.value)} placeholder="e.g., Here is your approved visa document..." className="w-full border border-gray-300 rounded-lg p-3 text-sm" rows={3} />
        </div>
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="block text-sm font-medium text-amber-800 mb-2">🔐 File Password (send separately for security)</label>
          <div className="flex gap-2">
            <input type="text" value={filePassword} onChange={(e) => setFilePassword(e.target.value)} placeholder="Enter password if file is encrypted..." className="flex-1 border border-amber-300 rounded-lg p-2 text-sm" />
            <button onClick={onSendPasswordEmail} disabled={!filePassword.trim() || sendingPassword} className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap">
              {sendingPassword ? 'Sending...' : 'Send Password'}
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-2">The password will be sent in a separate email for security.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => { setSelectedFilesToSend([]); setFilePassword(''); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onSendFilesToCustomer} disabled={sendingFilesToCustomer} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium">
            {sendingFilesToCustomer ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Sending...</>) : 'Send File'}
          </button>
        </div>
      </div>
    </div>
  );
}
