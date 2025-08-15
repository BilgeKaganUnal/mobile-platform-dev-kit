import { Platform } from 'react-native';
import { useATTStore } from '../store/att.store';
import { useAdjustStore } from '../store/adjust.store';
import { useRevenueCatStore } from '../store/revenuecat.store';
import { useScateStore } from '../store/scate.store';
import { logger } from '../utils/logger';

export interface SDKInitializationStatus {
  isInitializing: boolean;
  isCompleted: boolean;
  attInitialized: boolean;
  revenueCatInitialized: boolean;
  adjustInitialized: boolean;
  scateInitialized: boolean;
  adidRetrieved: boolean;
  error: string | null;
}

class SDKInitializer {
  private _status: SDKInitializationStatus = {
    isInitializing: false,
    isCompleted: false,
    attInitialized: false,
    revenueCatInitialized: false,
    adjustInitialized: false,
    scateInitialized: false,
    adidRetrieved: false,
    error: null
  };

  private _initializationAttempted = false;

  /**
   * Get current initialization status
   */
  get status(): SDKInitializationStatus {
    return { ...this._status };
  }

  /**
   * Initialize all SDKs in the specified sequence:
   * RevenueCat → Adjust → Scate → ADID retrieval → ADID distribution
   */
  async initializeAll(): Promise<SDKInitializationStatus> {
    if (this._initializationAttempted && this._status.isInitializing) {
      logger.info('SDKInitializer: Initialization already in progress, skipping');
      return this._status;
    }

    if (this._status.isCompleted) {
      logger.info('SDKInitializer: SDKs already initialized, skipping');
      return this._status;
    }

    try {
      this._initializationAttempted = true;
      this._status.isInitializing = true;
      this._status.error = null;

      logger.info('SDKInitializer: Starting SDK initialization sequence...');

      // Step 1: Initialize RevenueCat first (independent)
      await this._initializeRevenueCat();

      // Step 2: Initialize Adjust (handles ATT permissions internally)
      await this._initializeAdjust();

      // Step 3: Initialize Scate (without ADID initially)
      await this._initializeScate();

      // Step 4: Retrieve ADID from Adjust
      await this._retrieveAdid();

      // Step 5: ADID distribution is handled automatically by Adjust store

      this._status.isCompleted = true;
      this._status.isInitializing = false;

      logger.info('SDKInitializer: SDK initialization sequence completed successfully');
      return this._status;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SDK initialization failed';
      this._status.error = errorMessage;
      this._status.isInitializing = false;
      this._initializationAttempted = false; // Allow retry on error

      logger.error('SDKInitializer: SDK initialization sequence failed', { error });
      throw error;
    }
  }

  /**
   * Reset all SDK states
   */
  reset(): void {
    try {
      logger.info('SDKInitializer: Resetting all SDK states...');

      // Reset all stores
      useATTStore.getState().reset();
      useAdjustStore.getState().reset();
      useRevenueCatStore.getState().reset();
      useScateStore.getState().reset();

      // Reset initializer state
      this._status = {
        isInitializing: false,
        isCompleted: false,
        attInitialized: false,
        revenueCatInitialized: false,
        adjustInitialized: false,
        scateInitialized: false,
        adidRetrieved: false,
        error: null
      };
      this._initializationAttempted = false;

      logger.info('SDKInitializer: All SDK states reset');
    } catch (error) {
      logger.error('SDKInitializer: Failed to reset SDK states', { error });
    }
  }

  /**
   * Initialize RevenueCat SDK
   */
  private async _initializeRevenueCat(): Promise<void> {
    try {
      logger.info('SDKInitializer: Step 1 - Initializing RevenueCat...');
      
      const revenueCatStore = useRevenueCatStore.getState();
      revenueCatStore.initialize();
      
      this._status.revenueCatInitialized = true;
      logger.info('SDKInitializer: RevenueCat initialization completed');
    } catch (error) {
      logger.error('SDKInitializer: RevenueCat initialization failed', { error });
      throw new Error(`RevenueCat initialization failed: ${error}`);
    }
  }

  /**
   * Initialize Adjust SDK (includes ATT permission handling)
   */
  private async _initializeAdjust(): Promise<void> {
    try {
      logger.info('SDKInitializer: Step 2 - Initializing Adjust...');

      // Handle ATT permissions on iOS first
      if (Platform.OS === 'ios') {
        logger.info('SDKInitializer: Requesting ATT permissions before Adjust...');
        const attStore = useATTStore.getState();
        await attStore.initialize();
        await attStore.requestPermissions();
        this._status.attInitialized = true;
        logger.info('SDKInitializer: ATT permissions handled');
      } else {
        this._status.attInitialized = true; // Not required on Android
      }

      // Initialize Adjust SDK
      const adjustStore = useAdjustStore.getState();
      adjustStore.initialize();
      
      this._status.adjustInitialized = true;
      logger.info('SDKInitializer: Adjust initialization completed');
    } catch (error) {
      logger.error('SDKInitializer: Adjust initialization failed', { error });
      throw new Error(`Adjust initialization failed: ${error}`);
    }
  }

  /**
   * Initialize Scate SDK
   */
  private async _initializeScate(): Promise<void> {
    try {
      logger.info('SDKInitializer: Step 3 - Initializing Scate...');
      
      const scateStore = useScateStore.getState();
      scateStore.initialize();
      
      this._status.scateInitialized = true;
      logger.info('SDKInitializer: Scate initialization completed');
    } catch (error) {
      logger.error('SDKInitializer: Scate initialization failed', { error });
      throw new Error(`Scate initialization failed: ${error}`);
    }
  }

  /**
   * Retrieve ADID from Adjust with retry mechanism
   */
  private async _retrieveAdid(): Promise<void> {
    try {
      logger.info('SDKInitializer: Step 4 - Retrieving ADID...');
      
      const adjustStore = useAdjustStore.getState();
      
      // Use retry mechanism with exponential backoff
      await adjustStore.retrieveAdidWithRetry();
      
      // Check if ADID was successfully retrieved
      const finalState = useAdjustStore.getState();
      if (finalState.adid) {
        this._status.adidRetrieved = true;
        logger.info('SDKInitializer: ADID retrieval completed', { adid: finalState.adid });
      } else {
        logger.warn('SDKInitializer: ADID not available after retry attempts');
        this._status.adidRetrieved = false;
      }
    } catch (error) {
      logger.error('SDKInitializer: ADID retrieval failed', { error });
      // Don't throw error here as this is not critical for app functionality
      this._status.adidRetrieved = false;
    }
  }
}

// Export singleton instance
export const sdkInitializer = new SDKInitializer();