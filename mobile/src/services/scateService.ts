import { ScateSDK } from 'scatesdk-react';
import { logger } from '../utils/logger';

class ScateService {
  private static readonly API_KEY = 'GKqUc';
  
  private _isInitialized: boolean = false;

  /**
   * Check if Scate SDK is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Initialize Scate SDK
   */
  initialize(): void {
    if (this._isInitialized) {
      logger.info('ScateService: Already initialized, skipping');
      return;
    }

    try {
      logger.info('ScateService: Initializing Scate SDK...');
      
      ScateSDK.Init(ScateService.API_KEY);
      
      this._isInitialized = true;
      logger.info('ScateService: Scate SDK initialized successfully');
    } catch (error) {
      logger.error('ScateService: Failed to initialize Scate SDK', { error });
      throw error;
    }
  }

  /**
   * Set Adjust ADID for attribution
   */
  setAdid(adid: string): void {
    try {
      logger.info('ScateService: Setting ADID', { adid });
      ScateSDK.SetAdid(adid);
      logger.info('ScateService: ADID set successfully');
    } catch (error) {
      logger.error('ScateService: Failed to set ADID', { error });
      throw error;
    }
  }

  /**
   * Track custom event (if needed for future features)
   */
  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    try {
      logger.info('ScateService: Custom event tracking would be implemented here', { 
        eventName, 
        parameters 
      });
      // Implementation would depend on Scate SDK's event tracking capabilities
    } catch (error) {
      logger.error('ScateService: Failed to track event', { error });
    }
  }

  /**
   * Get API key
   */
  getApiKey(): string {
    return ScateService.API_KEY;
  }

  /**
   * Reset Scate SDK state (useful for testing)
   */
  reset(): void {
    this._isInitialized = false;
    logger.info('ScateService: Service reset');
  }
}

// Export singleton instance
export const scateService = new ScateService();