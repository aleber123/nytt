/**
 * Step 2: Document Type Selection
 * Allows customer to select document types with search, popular suggestions, and freetext support
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { StepProps } from '../types';
import {
  PREDEFINED_DOCUMENT_TYPES,
  getPopularDocumentTypes,
  trackDocumentTypeSelection,
  DocumentTypePopularity
} from '@/firebase/pricingService';

export const Step2DocumentType: React.FC<StepProps> = ({
  answers,
  setAnswers,
  onNext,
  onBack,
  currentLocale
}) => {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [popularDocTypes, setPopularDocTypes] = useState<DocumentTypePopularity[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isEnglish = currentLocale === 'en';

  // Load popular document types on mount
  useEffect(() => {
    const loadPopular = async () => {
      try {
        const popular = await getPopularDocumentTypes(12);
        setPopularDocTypes(popular);
      } catch (error) {
        // Fallback handled by getPopularDocumentTypes
      } finally {
        setLoadingPopular(false);
      }
    };
    loadPopular();
  }, []);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get localized document type name
  const getDocTypeName = (docType: { id: string; name: string; nameEn: string }) => {
    return isEnglish ? docType.nameEn : docType.name;
  };

  // Filter document types based on search
  const filteredDocTypes = PREDEFINED_DOCUMENT_TYPES.filter(docType => {
    if (!searchQuery.trim()) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      docType.name.toLowerCase().includes(searchLower) ||
      docType.nameEn.toLowerCase().includes(searchLower) ||
      docType.id.toLowerCase().includes(searchLower)
    );
  });

  // Check if search query matches any predefined type
  const hasExactMatch = filteredDocTypes.length > 0;
  const showAddCustom = searchQuery.trim().length >= 2 && !hasExactMatch;

  // Get selected document types with their info
  const selectedTypes = Array.isArray(answers.documentTypes) ? answers.documentTypes : [];

  // Handle adding a document type
  const handleAddDocumentType = (documentTypeId: string, customName?: string) => {
    const currentSelection = [...selectedTypes];
    
    // Don't add duplicates
    if (currentSelection.includes(documentTypeId)) {
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }

    const updatedSelection = [...currentSelection, documentTypeId];

    // Track selection for popularity (fire and forget)
    trackDocumentTypeSelection(documentTypeId, customName).catch(() => {});

    setAnswers({
      ...answers,
      documentTypes: updatedSelection,
      documentType: updatedSelection[0] || ''
    });

    setSearchQuery('');
    setShowDropdown(false);
  };

  // Handle adding custom freetext document type
  const handleAddCustomType = () => {
    const customName = searchQuery.trim();
    if (!customName) return;

    // Create a custom ID
    const customId = `custom_${customName.toLowerCase().replace(/[^a-z0-9åäö]/g, '_')}`;
    handleAddDocumentType(customId, customName);
  };

  // Handle removing a document type
  const handleRemoveDocumentType = (documentTypeId: string) => {
    const updatedSelection = selectedTypes.filter(id => id !== documentTypeId);
    setAnswers({
      ...answers,
      documentTypes: updatedSelection,
      documentType: updatedSelection[0] || ''
    });
  };

  // Get display name for a document type ID
  const getDisplayName = (typeId: string) => {
    // Check predefined types first
    const predefined = PREDEFINED_DOCUMENT_TYPES.find(dt => dt.id === typeId);
    if (predefined) {
      return isEnglish ? predefined.nameEn : predefined.name;
    }
    // For custom types, extract the name from the ID
    if (typeId.startsWith('custom_')) {
      return typeId.replace('custom_', '').replace(/_/g, ' ');
    }
    // Fallback to translation or ID
    return t(`orderFlow.step2.${typeId}`, typeId);
  };


  const handleNext = () => {
    if (selectedTypes.length > 0) {
      const existingQuantities = (answers as any).documentTypeQuantities || {};
      const documentTypeQuantities: { [key: string]: number } = {};

      selectedTypes.forEach((typeId: string) => {
        const existing = existingQuantities[typeId];
        documentTypeQuantities[typeId] = existing && existing >= 1 ? existing : 1;
      });

      const totalQuantity = Object.values(documentTypeQuantities).reduce(
        (sum, q) => sum + (q || 0),
        0
      ) || 1;

      setAnswers({
        ...answers,
        documentTypes: selectedTypes,
        documentTypeQuantities,
        documentType: selectedTypes[0] || answers.documentType || '',
        quantity: totalQuantity
      });
    }

    onNext();
  };

  return (
    <StepContainer
      title={t('orderFlow.step2.title', 'Välj dokumenttyp')}
      subtitle={t('orderFlow.step2.subtitle', 'Vilken typ av dokument ska legaliseras?')}
      onBack={onBack}
      onNext={handleNext}
      showNext={false}
    >
      {/* Search Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isEnglish ? 'Search document types' : 'Sök dokumenttyp'}
        </label>
        <div className="relative" ref={dropdownRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={isEnglish ? 'Search or add custom document type...' : 'Sök eller lägg till egen dokumenttyp...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
          />

          {/* Dropdown */}
          {showDropdown && (searchQuery.trim() || filteredDocTypes.length > 0) && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredDocTypes.length > 0 ? (
                filteredDocTypes.map((docType) => {
                  const isAlreadySelected = selectedTypes.includes(docType.id);
                  return (
                    <button
                      key={docType.id}
                      onClick={() => handleAddDocumentType(docType.id)}
                      disabled={isAlreadySelected}
                      className={`w-full text-left px-4 py-2 flex items-center space-x-2 ${
                        isAlreadySelected 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span>{getDocTypeName(docType)}</span>
                      {isAlreadySelected && (
                        <span className="ml-auto text-xs text-gray-400">
                          {isEnglish ? 'Already added' : 'Redan tillagd'}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : showAddCustom ? (
                <button
                  onClick={handleAddCustomType}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center space-x-2 text-blue-700"
                >
                  <span className="text-sm font-medium">+</span>
                  <span>
                    {isEnglish ? `Add: "${searchQuery}"` : `Lägg till: "${searchQuery}"`}
                  </span>
                </button>
              ) : (
                <div className="px-4 py-2 text-gray-500">
                  {isEnglish ? 'Type to search...' : 'Skriv för att söka...'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Popular Document Types */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {isEnglish ? 'Popular document types' : 'Populära dokumenttyper'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {loadingPopular ? (
            // Skeleton placeholders
            Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md animate-pulse"
              >
                <div className="w-6 h-6 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))
          ) : (
            popularDocTypes.map((docType) => {
              const isSelected = selectedTypes.includes(docType.documentTypeId);
              return (
                <button
                  key={docType.documentTypeId}
                  onClick={() => {
                    if (isSelected) {
                      handleRemoveDocumentType(docType.documentTypeId);
                    } else {
                      handleAddDocumentType(docType.documentTypeId);
                    }
                  }}
                  className={`flex items-center space-x-2 p-3 border rounded-md transition-colors ${
                    isSelected
                      ? 'border-custom-button bg-custom-button-bg'
                      : 'border-gray-200 hover:border-custom-button hover:bg-custom-button-light'
                  }`}
                >
                  <span className="text-sm truncate">
                    {isEnglish ? docType.documentTypeNameEn : docType.documentTypeName}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-custom-button">✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected Document Types */}
      {selectedTypes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            {isEnglish ? `Selected documents (${selectedTypes.length})` : `Valda dokument (${selectedTypes.length})`}
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {selectedTypes.map((typeId) => (
                <div
                  key={typeId}
                  className="flex items-center bg-white border border-green-300 rounded-full px-3 py-1.5 text-sm"
                >
                  <span className="text-gray-900">{getDisplayName(typeId)}</span>
                  <button
                    onClick={() => handleRemoveDocumentType(typeId)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                    title={isEnglish ? 'Remove' : 'Ta bort'}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedTypes.length > 0 && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            className="px-4 sm:px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
          >
            {t('orderFlow.continueButton', 'Fortsätt')}
          </button>
        </div>
      )}
    </StepContainer>
  );
};

export default Step2DocumentType;
