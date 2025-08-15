import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { logger } from '../utils/logger';

class RevenueCatService {
  private static readonly IOS_API_KEY = 'appl_OQOMeWPInoNfCbjWRYhOSfcZWUr';
  private static readonly ANDROID_API_KEY = 'goog_GLgCoLauFsTUcLSEUhrDNtktTSA';

  private _isInitialized: boolean = false;

  /**
   * Check if RevenueCat is initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Initialize RevenueCat SDK
   */
  initialize(): void {
    if (this._isInitialized) {
      logger.info('RevenueCatService: Already initialized, skipping');
      return;
    }

    try {
      logger.info('RevenueCatService: Initializing RevenueCat...');
      
      // Set log level for debugging
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

      // Configure with platform-specific API key
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: RevenueCatService.IOS_API_KEY });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: RevenueCatService.ANDROID_API_KEY });
      }

      this._isInitialized = true;
      logger.info('RevenueCatService: RevenueCat initialized successfully');
    } catch (error) {
      logger.error('RevenueCatService: Failed to initialize RevenueCat', { error });
      throw error;
    }
  }

  /**
   * Set Adjust ID for attribution
   */
  setAdjustId(adjustId: string): void {
    try {
      logger.info('RevenueCatService: Setting Adjust ID', { adjustId });
      Purchases.setAdjustID(adjustId);
      logger.info('RevenueCatService: Adjust ID set successfully');
    } catch (error) {
      logger.error('RevenueCatService: Failed to set Adjust ID', { error });
      throw error;
    }
  }

  /**
   * Get customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      logger.info('RevenueCatService: Getting customer info');
      const customerInfo = await Purchases.getCustomerInfo();
      logger.info('RevenueCatService: Customer info retrieved successfully');
      return customerInfo;
    } catch (error) {
      logger.error('RevenueCatService: Failed to get customer info', { error });
      throw error;
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<{
    customerInfo: CustomerInfo;
    userCancelled: boolean;
  }> {
    try {
      logger.info('RevenueCatService: Purchasing package', { packageId: pkg.identifier });
      const result = await Purchases.purchasePackage(pkg);
      logger.info('RevenueCatService: Package purchased successfully');
      return { ...result, userCancelled: false };
    } catch (error: any) {
      if (error.userCancelled) {
        logger.info('RevenueCatService: Purchase cancelled by user');
        return { 
          customerInfo: await this.getCustomerInfo(), 
          userCancelled: true 
        };
      }
      logger.error('RevenueCatService: Failed to purchase package', { error });
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      logger.info('RevenueCatService: Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      logger.info('RevenueCatService: Purchases restored successfully');
      return customerInfo;
    } catch (error) {
      logger.error('RevenueCatService: Failed to restore purchases', { error });
      throw error;
    }
  }

  /**
   * Check if user has active entitlement
   */
  hasActiveEntitlement(customerInfo: CustomerInfo, entitlementId: string): boolean {
    return customerInfo.entitlements.active[entitlementId] !== undefined;
  }

  /**
   * Get entitlement info
   */
  getEntitlementInfo(customerInfo: CustomerInfo, entitlementId: string) {
    return customerInfo.entitlements.active[entitlementId];
  }

  /**
   * Add customer info update listener
   */
  addCustomerInfoUpdateListener(callback: (customerInfo: CustomerInfo) => void): void {
    Purchases.addCustomerInfoUpdateListener(callback);
  }

  /**
   * Remove customer info update listener
   */
  removeCustomerInfoUpdateListener(callback: (customerInfo: CustomerInfo) => void): void {
    Purchases.removeCustomerInfoUpdateListener(callback);
  }

  /**
   * Reset RevenueCat state (useful for testing)
   */
  reset(): void {
    this._isInitialized = false;
    logger.info('RevenueCatService: Service reset');
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();