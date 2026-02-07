import { useState } from 'react';
import type { ExtendedOrder, AdminNote } from './types';

interface NotesTabProps {
  order: ExtendedOrder;
  formatDate: (date: any) => string;
  onAddNote: (note: AdminNote) => Promise<void>;
  adminName: string;
}

export default function NotesTab({ order, formatDate, onAddNote, adminName }: NotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<AdminNote['type']>('general');

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note: AdminNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date(),
      createdBy: adminName,
      type: noteType
    };

    await onAddNote(note);
    setNewNote('');
  };

  return (
    <div className="space-y-6">
      {/* Add New Note */}
      <div>
        <h3 className="text-lg font-medium mb-4">Add Note</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as AdminNote['type'])}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="general">General</option>
              <option value="processing">Processing</option>
              <option value="customer">Customer Related</option>
              <option value="issue">Issue</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note here..."
              className="w-full border border-gray-300 rounded-lg p-3"
              rows={3}
            />
          </div>
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            Add Note
          </button>
        </div>
      </div>

      {/* Existing Notes */}
      <div>
        <h3 className="text-lg font-medium mb-4">Previous notes</h3>
        {order.adminNotes && order.adminNotes.length > 0 ? (
          <div className="space-y-4">
            {order.adminNotes.map((note: AdminNote) => (
              <div key={note.id} className={`border rounded-lg p-4 ${
                note.type === 'issue' ? 'border-red-200 bg-red-50' :
                note.type === 'customer' ? 'border-blue-200 bg-blue-50' :
                note.type === 'processing' ? 'border-yellow-200 bg-yellow-50' :
                'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                      note.type === 'issue' ? 'bg-red-100 text-red-800' :
                      note.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                      note.type === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {note.type === 'general' ? 'General' :
                       note.type === 'processing' ? 'Processing' :
                       note.type === 'customer' ? 'Customer' : 'Issue'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatDate(note.createdAt)} by {note.createdBy}
                    </span>
                  </div>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p>No notes yet</p>
          </div>
        )}
      </div>

      {/* Customer Information from Order */}
      {(order.invoiceReference || order.additionalNotes) && (
        <div>
          <h3 className="text-lg font-medium mb-4">Customer information</h3>
          <div className="space-y-4">
            {order.invoiceReference && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Invoice reference</h4>
                <p className="text-green-700">{order.invoiceReference}</p>
              </div>
            )}
            {order.additionalNotes && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Additional information</h4>
                <p className="text-purple-700 whitespace-pre-wrap">{order.additionalNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
