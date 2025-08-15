import { Platform } from 'react-native';
import { Adjust, AdjustConfig } from 'react-native-adjust';
import { logger } from '../utils/logger';

class AdjustService {
  private static readonly APP_TOKEN = 'x7d4cl94zgg0';
  private static readonly ATT_CONSENT_WAITING_INTERVAL = 120;

  /**
   * Initialize Adjust SDK
   */
  initialize(): void {
    try {
      logger.info('AdjustService: Initializing Adjust SDK...');

      const adjustConfig = new AdjustConfig(
        AdjustService.APP_TOKEN,
        __DEV__ ? AdjustConfig.EnvironmentSandbox : AdjustConfig.EnvironmentProduction
      );

      // Set ATT consent waiting interval - gives time for ATT prompt response
      adjustConfig.setAttConsentWaitingInterval(AdjustService.ATT_CONSENT_WAITING_INTERVAL);

      // Initialize the SDK
      Adjust.initSdk(adjustConfig);
      
      logger.info('AdjustService: Adjust SDK initialized successfully');
    } catch (error) {
      logger.error('AdjustService: Failed to initialize Adjust SDK', { error });
      throw error;
    }
  }

  /**
   * Retrieve ADID with retry mechanism and exponential backoff
   */
  async retrieveAdidWithRetry(
    maxAttempts: number = 5,
    maxTotalTimeMs: number = 10000,
    initialDelayMs: number = 500
  ): Promise<string | null> {
    const startTime = Date.now();
    let cumulativeDelay = 0;

    logger.info('AdjustService: Starting ADID retrieval with exponential backoff retry...');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Check if we have time for this attempt
      const elapsedTime = Date.now() - startTime;
      const remainingTime = maxTotalTimeMs - elapsedTime - cumulativeDelay;

      if (remainingTime <= 0) {
        logger.info(`AdjustService: ADID retry timeout reached before attempt ${attempt}`);
        break;
      }

      // Calculate delay for this attempt (exponential backoff)
      const delay = attempt === 1 ? initialDelayMs : Math.min(
        initialDelayMs * Math.pow(2, attempt - 2),
        remainingTime
      );

      // Wait before attempting (except for first attempt)
      if (attempt > 1) {
        logger.info(`AdjustService: ADID retry attempt ${attempt}/${maxAttempts} - waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        cumulativeDelay += delay;
      } else {
        logger.info(`AdjustService: ADID attempt ${attempt}/${maxAttempts} (initial attempt)...`);
      }

      // Check remaining time after delay
      const currentElapsed = Date.now() - startTime;
      if (currentElapsed >= maxTotalTimeMs) {
        logger.info('AdjustService: ADID retry timeout reached after waiting');
        break;
      }

      // Attempt to retrieve ADID
      try {
        const result = await new Promise<string | null>((resolve) => {
          Adjust.getAdid((retrievedAdid) => {
            logger.info(`AdjustService: ADID attempt ${attempt} result:`, retrievedAdid);
            resolve(retrievedAdid);
          });
        });

        if (result) {
          const totalTime = Date.now() - startTime;
          logger.info(`AdjustService: ADID retrieved successfully on attempt ${attempt} after ${totalTime}ms:`, result);
          return result;
        } else {
          logger.info(`AdjustService: ADID attempt ${attempt} returned null`);
        }
      } catch (error) {
        logger.error(`AdjustService: ADID attempt ${attempt} failed:`, error);
      }
    }

    const totalTime = Date.now() - startTime;
    logger.info(`AdjustService: ADID retrieval failed after ${maxAttempts} attempts in ${totalTime}ms`);
    return null;
  }

  /**
   * Get ADID immediately (single attempt)
   */
  async getAdid(): Promise<string | null> {
    try {
      return new Promise<string | null>((resolve) => {
        Adjust.getAdid((adid) => {
          resolve(adid);
        });
      });
    } catch (error) {
      logger.error('AdjustService: Failed to get ADID', { error });
      return null;
    }
  }

  /**
   * Track event with Adjust
   */
  trackEvent(eventToken: string, revenue?: number, currency?: string): void {
    try {
      // Implementation would depend on your event tracking needs
      logger.info('AdjustService: Event tracking would be implemented here', { 
        eventToken, 
        revenue, 
        currency 
      });
    } catch (error) {
      logger.error('AdjustService: Failed to track event', { error });
    }
  }

  /**
   * Get environment info
   */
  getEnvironment(): string {
    return __DEV__ ? 'sandbox' : 'production';
  }

  /**
   * Get app token
   */
  getAppToken(): string {
    return AdjustService.APP_TOKEN;
  }
}

// Export singleton instance
export const adjustService = new AdjustService();