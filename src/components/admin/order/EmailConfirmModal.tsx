/**
 * EmailConfirmModal — replaces ugly window.confirm() popups when the
 * processing-step handler is about to send a customer email.
 *
 * The handler can:
 *  - See exactly what subject and body will be sent
 *  - Edit the subject and body inline for this one-off send
 *  - Click a button that opens the admin Email Templates page so they can
 *    edit the underlying template (for future sends)
 *  - Send or Cancel
 *
 * Used as a controlled component: parent stores `pendingEmailConfirm`
 * state and renders this when set. On Send, the parent's `onSend(subject, body)`
 * callback is invoked with whatever the user typed.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface EmailConfirmRequest {
  /** Title shown in the modal header (e.g. "Send confirmation email") */
  title: string;
  /** Short context line under the header (e.g. "to alex@example.com") */
  description?: string;
  /** Pre-filled email subject the handler can edit */
  defaultSubject: string;
  /** Pre-filled email body (plain text or HTML) the handler can edit */
  defaultBody: string;
  /** Whether the body should be rendered as HTML preview alongside the editor */
  bodyIsHtml?: boolean;
  /** Optional template id — when set, shows an "Edit template in admin" link */
  templateId?: string;
  /** Customer email address (for display) */
  recipientEmail?: string;
  /** Called when the handler clicks Send. Returns subject + body the handler typed. */
  onSend: (subject: string, body: string) => void | Promise<void>;
  /** Called when the handler dismisses the modal */
  onCancel: () => void;
}

interface Props {
  request: EmailConfirmRequest | null;
}

export default function EmailConfirmModal({ request }: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (request) {
      setSubject(request.defaultSubject);
      setBody(request.defaultBody);
      // For HTML emails, default to the rendered preview. Admins shouldn't
      // have to mentally parse raw HTML to know what the customer will see;
      // they can still click "Edit" to tweak the source.
      setShowPreview(!!request.bodyIsHtml);
      setSending(false);
    }
  }, [request]);

  if (!request) return null;

  const handleSend = async () => {
    setSending(true);
    try {
      await request.onSend(subject, body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{request.title}</h2>
                {request.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{request.description}</p>
                )}
                {request.recipientEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    To: <span className="font-mono text-gray-700">{request.recipientEmail}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={request.onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Body editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Body {request.bodyIsHtml && <span className="text-gray-400 normal-case lowercase">(html)</span>}
              </label>
              {request.bodyIsHtml && (
                <button
                  type="button"
                  onClick={() => setShowPreview(p => !p)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showPreview ? '✏️ Edit' : '👁️ Preview'}
                </button>
              )}
            </div>
            {showPreview && request.bodyIsHtml ? (
              <div
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 max-h-[280px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={request.bodyIsHtml ? 12 : 8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              You can edit this email for this one send. To change the default for all future sends, edit the template.
            </p>
          </div>

          {/* Edit template link */}
          {request.templateId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0">📧</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-900">Editable template</p>
                  <p className="text-xs text-blue-700 truncate">
                    Template: <span className="font-mono">{request.templateId}</span>
                  </p>
                </div>
              </div>
              <Link
                href="/admin/email-templates"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 whitespace-nowrap"
              >
                Edit template →
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex items-center justify-between gap-3">
          <button
            onClick={request.onCancel}
            disabled={sending}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Don't send
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </>
            ) : (
              <>📨 Send email</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
