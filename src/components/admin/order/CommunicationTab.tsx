import type { ExtendedOrder } from './types';

interface CommunicationTabProps {
  order: ExtendedOrder;
  onShowDocumentRequestModal: () => void;
  onShowNewTemplateModal: () => void;
}

export default function CommunicationTab({ order, onShowDocumentRequestModal, onShowNewTemplateModal }: CommunicationTabProps) {
  return (
    <div className="space-y-6">
      {/* Send Custom Email */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Send Custom Email</h3>
          <button
            onClick={onShowNewTemplateModal}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
          >
            + New Template
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Send an email to the customer using a template. The customer can upload files via a secure link.
        </p>
        <button
          onClick={onShowDocumentRequestModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Compose Email
        </button>
        {(order as any).documentRequestSent && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Last email sent {(order as any).documentRequestSentAt && new Date((order as any).documentRequestSentAt).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* Order Update Notification */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Order Update Notification</h3>
        <p className="text-gray-600 mb-4">
          Notify the customer about changes to their order (country, documents, etc).
        </p>
        <p className="text-sm text-gray-500">
          To send an update notification, edit the order information in the Services tab and click &quot;Notify Customer of Changes&quot;.
        </p>
        {(order as any).orderUpdateNotificationSent && (
          <p className="text-sm text-green-600 mt-2">
            ✓ Update notification sent {(order as any).orderUpdateNotificationSentAt && new Date((order as any).orderUpdateNotificationSentAt).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* Email History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Email History</h3>
        <p className="text-sm text-gray-500">
          Email history will be shown here once implemented.
        </p>
      </div>
    </div>
  );
}
