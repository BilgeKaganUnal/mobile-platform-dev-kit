import { useState, useCallback } from 'react';
import { useUIActions } from '../store/ui.store';
import { errorService } from '../services/errorService';

interface UseAPIOptions {
  showErrorNotification?: boolean;
  showSuccessNotification?: boolean;
  successMessage?: string;
}

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAPI = <T = any>(options: UseAPIOptions = {}) => {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { showNotification } = useUIActions();

  const execute = useCallback(
    async (apiCall: () => Promise<T>): Promise<{ success: boolean; data?: T; error?: string }> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = await apiCall();
        
        setState(prev => ({ ...prev, data, loading: false }));

        if (options.showSuccessNotification && options.successMessage) {
          showNotification({
            type: 'success',
            title: 'Success',
            message: options.successMessage,
          });
        }

        return { success: true, data };
      } catch (error: any) {
        const appError = errorService.handleGenericError(error);
        const errorMessage = errorService.getUserFriendlyMessage(appError);

        setState(prev => ({ ...prev, error: errorMessage, loading: false }));

        if (options.showErrorNotification !== false) {
          showNotification({
            type: 'error',
            title: 'Error',
            message: errorMessage,
          });
        }

        return { success: false, error: errorMessage };
      }
    },
    [showNotification, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

// Specialized hook for async operations with loading states
export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useUIActions();

  const execute = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: {
        showErrorNotification?: boolean;
        showSuccessNotification?: boolean;
        successMessage?: string;
        errorTitle?: string;
      }
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
      setLoading(true);

      try {
        const data = await operation();

        if (options?.showSuccessNotification && options.successMessage) {
          showNotification({
            type: 'success',
            title: 'Success',
            message: options.successMessage,
          });
        }

        return { success: true, data };
      } catch (error: any) {
        const appError = errorService.handleGenericError(error);
        const errorMessage = errorService.getUserFriendlyMessage(appError);

        if (options?.showErrorNotification !== false) {
          showNotification({
            type: 'error',
            title: options?.errorTitle || 'Error',
            message: errorMessage,
          });
        }

        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [showNotification]
  );

  return {
    loading,
    execute,
  };
};