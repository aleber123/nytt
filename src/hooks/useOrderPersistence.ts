/**
 * Custom hook for persisting order form progress
 * Automatically saves and restores order data from sessionStorage
 * 
 * Features:
 * - Auto-save on every change
 * - Restore on page load
 * - 24-hour expiration
 * - Clear on order completion
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'orderDraft';
const SESSION_ID_KEY = 'orderDraftSessionId';
const EXPIRATION_HOURS = 24;

/**
 * Get or create a persistent session ID for abandoned cart tracking.
 * Stored in sessionStorage so it survives page refreshes within the
 * same tab but gets a new ID when the user opens a new tab/browser.
 */
function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return `cart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

interface OrderDraft {
  answers: any;
  currentStep: number;
  timestamp: number;
}

export const useOrderPersistence = (
  answers: any,
  currentQuestion: number,
  setAnswers: (answers: any) => void,
  setCurrentQuestion: (step: number) => void,
  /** Order type for abandoned cart tracking ('legalization' | 'visa'). If omitted, Firestore sync is skipped. */
  orderType?: 'legalization' | 'visa',
  /** Total number of steps in the flow (for progress %) */
  totalSteps?: number
) => {
  // Ref to track if we've already restored on mount (prevents double restoration in React Strict Mode)
  const hasRestoredRef = useRef(false);
  // Debounce timer for Firestore writes (avoid hammering on every keystroke)
  const firestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  /**
   * Save current progress to sessionStorage
   * Note: File objects cannot be serialized to JSON, so we exclude them
   */
  const saveProgress = useCallback(() => {
    try {
      // Create a copy of answers without File objects (they can't be serialized)
      const serializableAnswers = {
        ...answers,
        uploadedFiles: [], // File objects can't be serialized - user must re-upload after page refresh
        idDocumentFile: null,
        registrationCertFile: null,
        signingAuthorityIdFile: null,
        ownReturnLabelFile: null,
      };

      const draft: OrderDraft = {
        answers: serializableAnswers,
        currentStep: currentQuestion,
        timestamp: Date.now()
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      logger.log('💾 Order progress saved:', { step: currentQuestion });
    } catch (error) {
      logger.error('Failed to save order progress:', error);
    }
  }, [answers, currentQuestion]);

  /**
   * Restore progress from sessionStorage
   */
  const restoreProgress = useCallback(() => {
    // Prevent double restoration in React Strict Mode
    if (hasRestoredRef.current) {
      logger.log('⏭️ Skipping duplicate restore call');
      return false;
    }
    
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      
      if (!saved) {
        logger.log('📭 No saved order progress found');
        return false;
      }

      const draft: OrderDraft = JSON.parse(saved);
      const now = Date.now();
      const expirationTime = EXPIRATION_HOURS * 60 * 60 * 1000;

      // Check if draft has expired
      if (now - draft.timestamp > expirationTime) {
        logger.log('⏰ Saved order progress expired, clearing...');
        clearProgress();
        return false;
      }

      // Mark as restored BEFORE setting state to prevent race conditions
      hasRestoredRef.current = true;
      
      // Restore the saved data
      // Ensure uploadedFiles array is properly initialized based on quantity
      const restoredAnswers = {
        ...draft.answers,
        uploadedFiles: draft.answers.documentSource === 'upload' && !draft.answers.willSendMainDocsLater
          ? new Array(draft.answers.quantity || 1).fill(null)
          : [],
      };
      setAnswers(restoredAnswers);
      setCurrentQuestion(draft.currentStep);
      
      logger.log('✅ Order progress restored:', { 
        step: draft.currentStep,
        savedAt: new Date(draft.timestamp).toLocaleString()
      });
      
      // Mark that we've shown the notification by setting a session flag
      sessionStorage.setItem(`${STORAGE_KEY}_notified`, 'true');
      
      return true;
    } catch (error) {
      logger.error('Failed to restore order progress:', error);
      clearProgress();
      return false;
    }
  }, [setAnswers, setCurrentQuestion]);

  /**
   * Clear saved progress
   */
  const clearProgress = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(`${STORAGE_KEY}_notified`);
      hasRestoredRef.current = false; // Reset the flag
      logger.log('🗑️ Order progress cleared');
    } catch (error) {
      logger.error('Failed to clear order progress:', error);
    }
  }, []);

  /**
   * Get saved progress info without restoring
   */
  const getSavedProgressInfo = useCallback((): { exists: boolean; step?: number; savedAt?: Date; expired?: boolean } => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      
      if (!saved) {
        return { exists: false };
      }

      const draft: OrderDraft = JSON.parse(saved);
      const now = Date.now();
      const expirationTime = EXPIRATION_HOURS * 60 * 60 * 1000;
      const expired = now - draft.timestamp > expirationTime;

      return {
        exists: true,
        step: draft.currentStep,
        savedAt: new Date(draft.timestamp),
        expired
      };
    } catch (error) {
      return { exists: false };
    }
  }, []);

  /**
   * Auto-save on every change (debounced by React)
   */
  useEffect(() => {
    // Don't save on initial mount when no data exists
    if (currentQuestion === 1 && !answers.country && !answers.destinationCountry) {
      return;
    }

    // Save to sessionStorage immediately (synchronous, cheap)
    saveProgress();

    // Debounced save to Firestore for abandoned cart tracking (3 sec delay
    // so we don't write on every keystroke, but still capture progress
    // if the user leaves after filling in a field)
    if (orderType) {
      if (firestoreTimerRef.current) clearTimeout(firestoreTimerRef.current);
      firestoreTimerRef.current = setTimeout(async () => {
        try {
          const { upsertAbandonedCart } = await import('@/firebase/abandonedCartService');
          // Strip file objects and circular refs for Firestore
          const serializableAnswers = { ...answers };
          delete serializableAnswers.uploadedFiles;
          delete serializableAnswers.idDocumentFile;
          delete serializableAnswers.registrationCertFile;
          delete serializableAnswers.signingAuthorityIdFile;
          delete serializableAnswers.ownReturnLabelFile;

          await upsertAbandonedCart({
            sessionId: sessionIdRef.current,
            orderType,
            currentStep: currentQuestion,
            totalSteps: totalSteps || 10,
            answers: serializableAnswers,
            locale: typeof window !== 'undefined' ? (document.documentElement.lang || 'sv') : 'sv',
          });
        } catch {
          // Non-blocking
        }
      }, 3000);
    }

    return () => {
      if (firestoreTimerRef.current) clearTimeout(firestoreTimerRef.current);
    };
  }, [answers, currentQuestion, saveProgress, orderType, totalSteps]);

  /**
   * Restore progress on mount (only once)
   */
  useEffect(() => {
    const restored = restoreProgress();
    
    // If progress was restored, we don't need to do anything else
    // The useEffect above will handle saving from this point forward
  }, []); // Empty dependency array = run once on mount

  /**
   * Mark the cart as converted in Firestore (call after successful order creation).
   */
  const markConverted = useCallback(async (orderId: string) => {
    try {
      const { markCartConverted } = await import('@/firebase/abandonedCartService');
      await markCartConverted(sessionIdRef.current, orderId);
    } catch {
      // Non-blocking
    }
  }, []);

  return {
    saveProgress,
    restoreProgress,
    clearProgress,
    getSavedProgressInfo,
    /** Call after successful order submission to mark the abandoned cart as converted */
    markConverted,
    /** The session ID used for abandoned cart tracking */
    sessionId: sessionIdRef.current,
  };
};

export default useOrderPersistence;
