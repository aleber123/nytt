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

import { useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

const STORAGE_KEY = 'orderDraft';
const EXPIRATION_HOURS = 24;

interface OrderDraft {
  answers: any;
  currentStep: number;
  timestamp: number;
}

export const useOrderPersistence = (
  answers: any,
  currentQuestion: number,
  setAnswers: (answers: any) => void,
  setCurrentQuestion: (step: number) => void
) => {
  /**
   * Save current progress to sessionStorage
   */
  const saveProgress = useCallback(() => {
    try {
      const draft: OrderDraft = {
        answers,
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

      // Restore the saved data
      setAnswers(draft.answers);
      setCurrentQuestion(draft.currentStep);
      
      logger.log('✅ Order progress restored:', { 
        step: draft.currentStep,
        savedAt: new Date(draft.timestamp).toLocaleString()
      });
      
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
    // Don't save on initial mount
    if (currentQuestion === 1 && !answers.country) {
      return;
    }

    // Save progress whenever answers or step changes
    saveProgress();
  }, [answers, currentQuestion, saveProgress]);

  /**
   * Restore progress on mount (only once)
   */
  useEffect(() => {
    const restored = restoreProgress();
    
    // If progress was restored, we don't need to do anything else
    // The useEffect above will handle saving from this point forward
  }, []); // Empty dependency array = run once on mount

  return {
    saveProgress,
    restoreProgress,
    clearProgress,
    getSavedProgressInfo
  };
};

export default useOrderPersistence;
