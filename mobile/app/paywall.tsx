import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { useRevenueCat } from '../src/store/revenuecat.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../src/utils/logger';

const features = [
  'Unlimited access to all premium features',
  'Advanced analytics and insights',
  'Priority customer support',
  'Ad-free experience',
  'Cloud backup and synchronization',
  'Advanced customization options'
];

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [skipTimer, setSkipTimer] = useState(5); // 5 second timer
  const [canSkip, setCanSkip] = useState(false);
  
  const timerAnimation = useRef(new Animated.Value(1)).current;
  const fadeInAnimation = useRef(new Animated.Value(0)).current;
  
  const {
    customerInfo,
    isLoading: subscriptionLoading,
  } = useRevenueCat();
  
  // TODO: Add these when RevenueCat store is complete
  const offerings = {};
  const purchasePackage = async () => ({ success: false, userCancelled: false });
  const restoreTransactions = async () => {};

  // Timer countdown effect
  useEffect(() => {
    if (skipTimer > 0) {
      const interval = setInterval(() => {
        setSkipTimer(prev => {
          if (prev <= 1) {
            setCanSkip(true);
            // Animate skip button appearance
            Animated.timing(fadeInAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [skipTimer]);

  // Timer circle animation
  useEffect(() => {
    if (skipTimer > 0) {
      const interval = setInterval(() => {
        Animated.timing(timerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }).start(() => {
          timerAnimation.setValue(1);
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [skipTimer]);

  const hasActiveSubscription = customerInfo?.entitlements.active ? 
    Object.keys(customerInfo.entitlements.active).length > 0 : false;

  const plans = useMemo(() => {
    if (!offerings) return [];

    const mappedPlans: any[] = [];
    const sortOrder = ['Weekly', 'Monthly', 'Annual'];

    for (const offering of Object.values(offerings)) {
      // TODO: Fix when offerings are available
      if (false) {
        for (const pkg of [] as any[]) {
          let badge = '';
          let savings = '';
          
          // Add badges and savings for different plans
          const packageType = pkg.packageType?.toUpperCase() || '';
          if (packageType.includes('ANNUAL')) {
            badge = 'BEST VALUE';
            savings = 'Save 60%';
          } else if (packageType.includes('MONTHLY')) {
            badge = 'MOST POPULAR';
          }
          
          mappedPlans.push({
            id: (pkg as any).identifier,
            title: 'Premium Plan', // offering.serverDescription || packageType,
            price: (pkg as any).product.priceString,
            period: `per ${packageType.toLowerCase()}`,
            description: (pkg as any).product.description || '',
            badge,
            savings,
            revenueCatPackage: pkg,
          });
        }
      }
    }

    // Sort plans if needed
    mappedPlans.sort((a, b) => {
      const aIndex = sortOrder.findIndex(order => a.title.includes(order));
      const bIndex = sortOrder.findIndex(order => b.title.includes(order));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    return mappedPlans;
  }, [offerings]);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // Select the most popular plan (Monthly) or first plan
      const popularPlan = plans.find(p => p.badge === 'MOST POPULAR') || plans[0];
      setSelectedPlan(popularPlan.id);
    }
  }, [plans, selectedPlan]);

  const handlePurchase = async () => {
    if (!selectedPlan) return;

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    try {
      setIsLoading(true);
      const result = await purchasePackage();
      const success = result?.success;

      if (success) {
        Alert.alert(
          'Welcome to Premium! 🎉',
          'Your subscription is now active. You can now access all premium features!',
          [
            {
              text: 'Start Using App',
              onPress: async () => {
                // Mark onboarding as completed when subscription is successful
                await AsyncStorage.setItem('onboarding_completed', 'true');
                logger.info('Subscription successful - onboarding marked as completed');
                
                // Navigate to main app - main layout will handle proper routing
                router.replace('/(tabs)');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to activate subscription. Please try again.');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Subscription activation error:', e);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Continue with Limited Features?',
      'You can still browse the app, but some features will be limited. You can upgrade anytime from settings.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              // Mark onboarding as completed when user skips paywall
              await AsyncStorage.setItem('onboarding_completed', 'true');
              logger.info('Paywall skipped - onboarding marked as completed');
              
              // Navigate to main app
              router.replace('/(tabs)');
            } catch (error) {
              logger.error('Failed to save onboarding completion on paywall skip', { error });
              // Continue anyway
              router.replace('/(tabs)');
            }
          }
        }
      ]
    );
  };

  const handleRestore = async () => {
    try {
      setIsLoading(true);
      await restoreTransactions();
      // The store will handle the success/failure feedback
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlanCard = (plan: any) => {
    const isSelected = selectedPlan === plan.id;
    const isPopular = plan.badge === 'MOST POPULAR';
    const isBestValue = plan.badge === 'BEST VALUE';

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          (isPopular || isBestValue) && styles.popularPlan,
        ]}
        onPress={() => setSelectedPlan(plan.id)}
        activeOpacity={0.7}
      >
        {plan.badge && (
          <View style={[styles.badge, isBestValue && styles.bestValueBadge]}>
            <Text style={styles.badgeText}>{plan.badge}</Text>
          </View>
        )}

        {plan.savings && (
          <View style={styles.savingsTag}>
            <Text style={styles.savingsText}>{plan.savings}</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <Text style={[styles.planTitle, isSelected && styles.selectedText]}>
              {plan.title}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, isSelected && styles.selectedText]}>
              {plan.price}
            </Text>
          </View>

          <Text style={[styles.planPeriod, isSelected && styles.selectedPeriod]}>
            {plan.period}
          </Text>
        </View>

        <View style={styles.radioContainer}>
          <View style={[styles.radio, isSelected && styles.radioSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show subscription management if already subscribed
  if (hasActiveSubscription) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.subscribedContainer}>
            <View style={styles.subscribedGradient}>
              <Text style={styles.subscribedIcon}>✅</Text>
              <Text style={styles.subscribedTitle}>You're All Set!</Text>
              <Text style={styles.subscribedSubtitle}>
                You already have an active subscription. Enjoy all premium features!
              </Text>
              <TouchableOpacity
                style={styles.continueToAppButton}
                onPress={async () => {
                  // Mark onboarding as completed for users with existing subscriptions
                  await AsyncStorage.setItem('onboarding_completed', 'true');
                  logger.info('Existing subscription detected - onboarding marked as completed');
                  
                  // Navigate to main app - main layout will handle proper routing
                  router.replace('/(tabs)');
                }}
              >
                <Text style={styles.continueToAppButtonText}>Continue to App</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Skip Timer/Button */}
        <View style={styles.skipContainer}>
          {!canSkip ? (
            <View style={styles.timerContainer}>
              <View style={styles.timerCircle}>
                <Animated.View
                  style={[
                    styles.timerProgress,
                    {
                      transform: [
                        {
                          rotate: timerAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Text style={styles.timerText}>{skipTimer}</Text>
              </View>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeInAnimation }}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {subscriptionLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4299E1" />
            <Text style={styles.loadingText}>Loading subscription details...</Text>
          </View>
        ) : (
          <>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <View style={styles.heroIconContainer}>
                  <View style={styles.heroIconGradient}>
                    <Text style={styles.heroIcon}>👑</Text>
                  </View>
                </View>
                <Text style={styles.heroTitle}>Unlock Premium Features</Text>
                <Text style={styles.heroSubtitle}>
                  Get unlimited access to all features and premium content
                </Text>
              </View>

              {/* Plan Selection */}
              <View style={styles.plansSection}>
                <View style={styles.plansContainer}>
                  {plans.map(renderPlanCard)}
                </View>
              </View>

              {/* Features Section */}
              <View style={styles.featuresSection}>
                <View style={styles.featuresSectionHeader}>
                  <Text style={styles.featuresSectionTitle}>Premium includes</Text>
                </View>

                <View style={styles.featuresGrid}>
                  {features.map((feature, index) => (
                    <View key={index} style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Trust Indicators */}
              <View style={styles.trustSection}>
                <View style={styles.trustIndicator}>
                  <Text style={styles.trustIcon}>🔒</Text>
                  <Text style={styles.trustText}>Secure & Private</Text>
                </View>
                <View style={styles.trustIndicator}>
                  <Text style={styles.trustIcon}>🔄</Text>
                  <Text style={styles.trustText}>Cancel Anytime</Text>
                </View>
              </View>

              {/* Terms */}
              <View style={styles.termsSection}>
                <Text style={styles.termsText}>
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </Text>
              </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomSection}>
              <View style={styles.purchaseButtonGradient}>
                <TouchableOpacity
                  style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
                  onPress={handlePurchase}
                  activeOpacity={isLoading ? 1 : 0.9}
                  disabled={isLoading || !selectedPlan}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.purchaseButtonText}>
                        Start Premium - {plans.find(p => p.id === selectedPlan)?.price || ''}
                      </Text>
                      <Text style={styles.purchaseButtonSubtext}>
                        {plans.find(p => p.id === selectedPlan)?.period}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Restore Button */}
              <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
                <Text style={styles.restoreButtonText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Skip Timer/Button
  skipContainer: {
    paddingTop: 16,
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    minHeight: 60,
    justifyContent: 'center',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  timerProgress: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4299E1',
    borderTopColor: 'transparent',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4299E1',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  skipButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: 20,
  },
  heroIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4299E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIcon: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Plans Section
  plansSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F0F2F5',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPlan: {
    borderColor: '#4299E1',
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  popularPlan: {
    borderColor: '#4299E1',
    backgroundColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#4299E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bestValueBadge: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  savingsTag: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#4299E1',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.8,
  },
  planPeriod: {
    fontSize: 14,
    color: '#666',
  },
  selectedPeriod: {
    color: '#4299E1',
  },
  radioContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#4299E1',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4299E1',
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresSectionHeader: {
    marginBottom: 20,
  },
  featuresSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F1F3',
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkIcon: {
    color: '#4299E1',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },

  // Trust Section
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginBottom: 16,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trustIcon: {
    fontSize: 20,
  },
  trustText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Terms
  termsSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  termsText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
    textAlign: 'center',
  },

  // Bottom Section
  bottomSection: {
    padding: 24,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonGradient: {
    borderRadius: 20,
    backgroundColor: '#4299E1',
    shadowColor: '#4299E1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  purchaseButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  purchaseButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  restoreButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '500',
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },

  // Already subscribed state
  subscribedContainer: {
    flex: 1,
    margin: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  subscribedGradient: {
    flex: 1,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  subscribedIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  subscribedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subscribedSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  continueToAppButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  continueToAppButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4299E1',
  },
});