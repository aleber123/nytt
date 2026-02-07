import { toast } from 'react-hot-toast';
import type { ExtendedOrder, NotaryApostilleCoverLetterData, EmbassyCoverLetterData, UDCoverLetterData } from './types';
import { getNotaryApostilleDefaults, getEmbassyDefaults, getUDDefaults,
  downloadNotaryApostilleCoverLetter, printNotaryApostilleCoverLetter,
  downloadEmbassyCoverLetter, printEmbassyCoverLetter,
  downloadUDCoverLetter, printUDCoverLetter,
  downloadCoverLetter, printCoverLetter } from '@/services/coverLetterService';

interface CoverLettersTabProps {
  order: ExtendedOrder;
  notaryApostilleData: NotaryApostilleCoverLetterData | null;
  setNotaryApostilleData: (data: NotaryApostilleCoverLetterData | null) => void;
  embassyData: EmbassyCoverLetterData | null;
  setEmbassyData: (data: EmbassyCoverLetterData | null) => void;
  udData: UDCoverLetterData | null;
  setUdData: (data: UDCoverLetterData | null) => void;
}

export default function CoverLettersTab({
  order, notaryApostilleData, setNotaryApostilleData,
  embassyData, setEmbassyData, udData, setUdData,
}: CoverLettersTabProps) {
  const handleDownloadCover = () => {
    try {
      downloadCoverLetter(order);
      toast.success('Packing slip downloading');
    } catch (err) {
      toast.error('Could not create packing slip');
    }
  };

  const handlePrintCover = () => {
    try {
      printCoverLetter(order);
      toast.success('Printing started');
    } catch (err) {
      toast.error('Could not print packing slip');
    }
  };

  return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Cover Letters</h3>
                      <p className="text-sm text-gray-500">Generate cover letters for each authority/instance</p>
                    </div>

                    {/* Determine which cover letters are needed based on services */}
                    {(() => {
                      const services = Array.isArray(order.services) ? order.services : [];
                      const hasNotarization = services.some(s => s === 'notarization' || s === 'notarisering');
                      const hasApostille = services.some(s => s === 'apostille');
                      const hasChamber = services.some(s => s === 'chamber');
                      const hasUD = services.some(s => s === 'ud' || s === 'utrikesdepartementet');
                      const hasEmbassy = services.some(s => s === 'embassy' || s === 'ambassad');
                      const hasTranslation = services.some(s => s === 'translation' || s === 'oversattning');

                      // Notarization + Apostille share the same cover letter (same visit to Notarius Publicus)
                      const needsNotaryApostille = hasNotarization || hasApostille;

                      const coverLetters = [];

                      if (needsNotaryApostille) {
                        coverLetters.push({
                          id: 'notary-apostille',
                          name: 'Notarius Publicus / Apostille',
                          description: hasNotarization && hasApostille 
                            ? 'Combined cover letter for notarization and apostille (same authority)'
                            : hasNotarization 
                              ? 'Cover letter for notarization'
                              : 'Cover letter for apostille',
                          icon: '⚖️',
                          services: [hasNotarization && 'Notarization', hasApostille && 'Apostille'].filter(Boolean)
                        });
                      }

                      if (hasChamber) {
                        coverLetters.push({
                          id: 'chamber',
                          name: 'Chamber of Commerce',
                          description: 'Cover letter for Chamber of Commerce legalization',
                          icon: '🏛️',
                          services: ['Chamber of Commerce']
                        });
                      }

                      if (hasUD) {
                        coverLetters.push({
                          id: 'ud',
                          name: 'Ministry for Foreign Affairs (UD)',
                          description: 'Cover letter for Ministry for Foreign Affairs legalization',
                          icon: '🏢',
                          services: ['Ministry for Foreign Affairs']
                        });
                      }

                      if (hasEmbassy) {
                        coverLetters.push({
                          id: 'embassy',
                          name: 'Embassy Legalization',
                          description: `Cover letter for ${order.country ? `${order.country} ` : ''}embassy legalization`,
                          icon: '🏳️',
                          services: ['Embassy Legalization']
                        });
                      }

                      if (hasTranslation) {
                        coverLetters.push({
                          id: 'translation',
                          name: 'Translation',
                          description: 'Cover letter for translation service',
                          icon: '📄',
                          services: ['Translation']
                        });
                      }

                      if (coverLetters.length === 0) {
                        return (
                          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-4xl mb-4 block">📭</span>
                            <p className="text-gray-600">No cover letters needed for this order.</p>
                            <p className="text-sm text-gray-500 mt-2">Selected services don't require separate cover letters.</p>
                          </div>
                        );
                      }

                      // Initialize notary data if not set
                      if (!notaryApostilleData && coverLetters.some(l => l.id === 'notary-apostille')) {
                        const defaults = getNotaryApostilleDefaults(order);
                        setNotaryApostilleData(defaults);
                      }

                      // Initialize embassy data if not set
                      if (!embassyData && coverLetters.some(l => l.id === 'embassy')) {
                        const defaults = getEmbassyDefaults(order);
                        setEmbassyData(defaults);
                      }

                      // Initialize UD data if not set
                      if (!udData && coverLetters.some(l => l.id === 'ud')) {
                        const defaults = getUDDefaults(order);
                        setUdData(defaults);
                      }

                      return (
                        <div className="space-y-6">
                          {coverLetters.map((letter) => {
                            // Notary/Apostille with editable form
                            if (letter.id === 'notary-apostille' && notaryApostilleData) {
                              return (
                                <div 
                                  key={letter.id}
                                  className="bg-white border border-gray-200 rounded-lg p-5"
                                >
                                  <div className="flex items-center space-x-3 mb-4">
                                    <span className="text-2xl">{letter.icon}</span>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{letter.name}</h4>
                                      <p className="text-sm text-gray-500">{letter.description}</p>
                                    </div>
                                  </div>

                                  {/* Editable form */}
                                  <div className="space-y-4 border-t pt-4">
                                    {/* Document description */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Document description
                                        </label>
                                        <input
                                          type="text"
                                          value={notaryApostilleData.documentDescription}
                                          onChange={(e) => setNotaryApostilleData({
                                            ...notaryApostilleData,
                                            documentDescription: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                          placeholder="e.g. 1 x Birth Certificate"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Document issuer (company/authority)
                                        </label>
                                        <input
                                          type="text"
                                          value={notaryApostilleData.documentIssuer}
                                          onChange={(e) => setNotaryApostilleData({
                                            ...notaryApostilleData,
                                            documentIssuer: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                          placeholder="e.g. Skatteverket, Bolagsverket"
                                        />
                                      </div>
                                    </div>

                                    {/* Actions */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Requested actions (one per line)
                                      </label>
                                      <textarea
                                        value={notaryApostilleData.actions.join('\n')}
                                        onChange={(e) => setNotaryApostilleData({
                                          ...notaryApostilleData,
                                          actions: e.target.value.split('\n').filter(a => a.trim())
                                        })}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        placeholder="Signature verification&#10;Apostille"
                                      />
                                    </div>

                                    {/* Two column layout */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Country of use
                                        </label>
                                        <input
                                          type="text"
                                          value={notaryApostilleData.countryOfUse}
                                          onChange={(e) => setNotaryApostilleData({
                                            ...notaryApostilleData,
                                            countryOfUse: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Language
                                        </label>
                                        <input
                                          type="text"
                                          value={notaryApostilleData.language}
                                          onChange={(e) => setNotaryApostilleData({
                                            ...notaryApostilleData,
                                            language: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Order number (fixed)
                                        </label>
                                        <input
                                          type="text"
                                          value={order.orderNumber || order.id || ''}
                                          disabled
                                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Additional invoice reference
                                        </label>
                                        <input
                                          type="text"
                                          value={notaryApostilleData.invoiceReference}
                                          onChange={(e) => setNotaryApostilleData({
                                            ...notaryApostilleData,
                                            invoiceReference: e.target.value
                                          })}
                                          placeholder="Optional extra reference..."
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Payment method
                                        </label>
                                        <input
                                          type="text"
                                          value={notaryApostilleData.paymentMethod}
                                          onChange={(e) => setNotaryApostilleData({
                                            ...notaryApostilleData,
                                            paymentMethod: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Return method
                                      </label>
                                      <input
                                        type="text"
                                        value={notaryApostilleData.returnMethod}
                                        onChange={(e) => setNotaryApostilleData({
                                          ...notaryApostilleData,
                                          returnMethod: e.target.value
                                        })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                      />
                                    </div>

                                    {/* Reset button */}
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => setNotaryApostilleData(getNotaryApostilleDefaults(order))}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                      >
                                        Reset to defaults
                                      </button>
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await downloadNotaryApostilleCoverLetter(order, notaryApostilleData);
                                          toast.success('Cover letter downloaded');
                                        } catch (err) {
                                          toast.error('Failed to generate cover letter');
                                        }
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Download PDF
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await printNotaryApostilleCoverLetter(order, notaryApostilleData);
                                          toast.success('Printing cover letter');
                                        } catch (err) {
                                          toast.error('Failed to print cover letter');
                                        }
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                      </svg>
                                      Print
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // Chamber of Commerce - downloadable PDF form
                            if (letter.id === 'chamber') {
                              return (
                                <div 
                                  key={letter.id}
                                  className="bg-white border border-gray-200 rounded-lg p-5"
                                >
                                  <div className="flex items-center space-x-3 mb-4">
                                    <span className="text-2xl">{letter.icon}</span>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{letter.name}</h4>
                                      <p className="text-sm text-gray-500">{letter.description}</p>
                                    </div>
                                  </div>

                                  <div className="border-t pt-4">
                                    <p className="text-sm text-gray-600 mb-3">
                                      Download the Chamber of Commerce form and fill it in using Adobe Acrobat. 
                                      <strong className="text-amber-600 bg-yellow-100 px-1"> Attach 1 copy of the original document.</strong>
                                    </p>
                                    
                                    <div className="flex items-center space-x-2">
                                      <a
                                        href="/chamber-form.pdf"
                                        download="Handelskammaren_Dokumentbeställning.pdf"
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 flex items-center"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download Form (PDF)
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            // Embassy cover letter with editable form
                            if (letter.id === 'embassy' && embassyData) {
                              return (
                                <div 
                                  key={letter.id}
                                  className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-lg p-5"
                                >
                                  <div className="flex items-center space-x-3 mb-4">
                                    <span className="text-2xl">🏛️</span>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{letter.name}</h4>
                                      <p className="text-sm text-amber-700">Elegant formal letter for embassy legalisation</p>
                                    </div>
                                  </div>

                                  {/* Editable form */}
                                  <div className="space-y-4 border-t border-amber-200 pt-4">
                                    {/* Embassy name and address */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Embassy name
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.embassyName}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            embassyName: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                          placeholder="e.g. Embassy of Kuwait"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Embassy address (optional)
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.embassyAddress || ''}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            embassyAddress: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                          placeholder="Street address, City"
                                        />
                                      </div>
                                    </div>

                                    {/* Document details */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Document description
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.documentDescription}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            documentDescription: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                          placeholder="e.g. 1 x Birth Certificate"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Document issuer (optional)
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.documentIssuer || ''}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            documentIssuer: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                          placeholder="e.g. Skatteverket"
                                        />
                                      </div>
                                    </div>

                                    {/* Country and purpose */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Country of use
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.countryOfUse}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            countryOfUse: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Purpose (optional)
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.purpose || ''}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            purpose: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                          placeholder="e.g. For business registration"
                                        />
                                      </div>
                                    </div>

                                    {/* Payment and return */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Order number (fixed)
                                        </label>
                                        <input
                                          type="text"
                                          value={order.orderNumber || order.id || ''}
                                          disabled
                                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Additional invoice reference
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.invoiceReference}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            invoiceReference: e.target.value
                                          })}
                                          placeholder="Optional extra reference..."
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Payment method
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.paymentMethod}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            paymentMethod: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Collection method
                                        </label>
                                        <input
                                          type="text"
                                          value={embassyData.returnMethod}
                                          onChange={(e) => setEmbassyData({
                                            ...embassyData,
                                            returnMethod: e.target.value
                                          })}
                                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                      </div>
                                    </div>

                                    {/* Reset button */}
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => setEmbassyData(getEmbassyDefaults(order))}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                      >
                                        Reset to defaults
                                      </button>
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-amber-200">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await downloadEmbassyCoverLetter(order, embassyData);
                                          toast.success('Embassy cover letter downloaded');
                                        } catch (err) {
                                          toast.error('Failed to generate cover letter');
                                        }
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Download PDF
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await printEmbassyCoverLetter(order, embassyData);
                                          toast.success('Printing embassy cover letter');
                                        } catch (err) {
                                          toast.error('Failed to print cover letter');
                                        }
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                      </svg>
                                      Print
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // UD cover letter with editable form
                            if (letter.id === 'ud' && udData) {
                              return (
                                <div 
                                  key={letter.id}
                                  className="bg-white border border-gray-200 rounded-lg p-5"
                                >
                                  <div className="flex items-center space-x-3 mb-4">
                                    <span className="text-2xl">{letter.icon}</span>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{letter.name}</h4>
                                      <p className="text-sm text-gray-500">{letter.description}</p>
                                    </div>
                                  </div>

                                  {/* Editable form */}
                                  <div className="space-y-4 mb-6">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Document Description</label>
                                      <input
                                        type="text"
                                        value={udData.documentDescription}
                                        onChange={(e) => setUdData({ ...udData, documentDescription: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Document Issuer (optional)</label>
                                      <input
                                        type="text"
                                        value={udData.documentIssuer || ''}
                                        onChange={(e) => setUdData({ ...udData, documentIssuer: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        placeholder="Company or authority that issued the document"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Country of Use</label>
                                        <input
                                          type="text"
                                          value={udData.countryOfUse}
                                          onChange={(e) => setUdData({ ...udData, countryOfUse: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                        <input
                                          type="text"
                                          value={udData.language}
                                          onChange={(e) => setUdData({ ...udData, language: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Order Number (fixed)</label>
                                        <input
                                          type="text"
                                          value={order.orderNumber || order.id || ''}
                                          disabled
                                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Invoice Reference</label>
                                        <input
                                          type="text"
                                          value={udData.invoiceReference}
                                          onChange={(e) => setUdData({ ...udData, invoiceReference: e.target.value })}
                                          placeholder="Optional extra reference..."
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                        <input
                                          type="text"
                                          value={udData.paymentMethod}
                                          onChange={(e) => setUdData({ ...udData, paymentMethod: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Method</label>
                                      <input
                                        type="text"
                                        value={udData.returnMethod}
                                        onChange={(e) => setUdData({ ...udData, returnMethod: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                      />
                                    </div>

                                    {/* Reset button */}
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => setUdData(getUDDefaults(order))}
                                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                                      >
                                        Reset to defaults
                                      </button>
                                    </div>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await downloadUDCoverLetter(order, udData);
                                          toast.success('UD cover letter downloaded');
                                        } catch (err) {
                                          toast.error('Failed to generate cover letter');
                                        }
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Download
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await printUDCoverLetter(order, udData);
                                          toast.success('Printing UD cover letter');
                                        } catch (err) {
                                          toast.error('Failed to print cover letter');
                                        }
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                      </svg>
                                      Print
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            // Other cover letter types (not yet editable)
                            return (
                              <div 
                                key={letter.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3">
                                    <span className="text-2xl">{letter.icon}</span>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{letter.name}</h4>
                                      <p className="text-sm text-gray-500 mt-1">{letter.description}</p>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {letter.services.map((service, idx) => (
                                          <span 
                                            key={idx}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                                          >
                                            {service}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => toast.success(`${letter.name} cover letter coming soon...`)}
                                      className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Download
                                    </button>
                                    <button
                                      onClick={() => toast.success(`${letter.name} cover letter coming soon...`)}
                                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                      </svg>
                                      Print
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Packing Slip / Return Checklist */}
                          <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-md font-medium text-gray-900 mb-4">📦 Packing Slip (Return Checklist)</h4>
                            <p className="text-sm text-gray-500 mb-4">Use this when packing documents for return to customer.</p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">📋</span>
                                  <div>
                                    <h5 className="font-medium text-gray-900">Return Packing Slip</h5>
                                    <p className="text-sm text-gray-500">Checklist for packing completed documents</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={handleDownloadCover}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download
                                  </button>
                                  <button
                                    onClick={handlePrintCover}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
  );
}