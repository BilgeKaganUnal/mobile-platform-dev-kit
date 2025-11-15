import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSession, useSessionActions } from '../src/store/session.store';
import { useRevenueCat } from '../src/store/revenuecat.store';
import { LoadingSpinner } from '../src/components/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../src/utils/logger';

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <LoadingSpinner overlay text="Loading..." />
    </View>
  );
}

// This component handles the session state and navigation
function AppContent() {
  const { hasValidSession, isLoading: sessionLoading, isSessionChecked, error: sessionError } = useSession();
  const { initializeSession } = useSessionActions();
  const { customerInfo, isLoading: subscriptionLoading } = useRevenueCat();
  const router = useRouter();
  const segments = useSegments();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  // Add render counter for debugging
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  console.log(`🔄 AppContent render #${renderCountRef.current}`);

  // Initialize session once on app start
  useEffect(() => {
    console.log('🚀 _layout.tsx: Starting session initialization...');
    const initSession = async () => {
      try {
        await initializeSession();
        console.log('✅ _layout.tsx: Session initialization completed');
      } catch (error) {
        console.error('❌ _layout.tsx: Session initialization failed:', error);
        logger.error('Session initialization failed in _layout.tsx', { error });
      }
    };
    initSession();
  }, []); // Only run once on mount

  // Check onboarding status once on app start
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        const hasCompleted = onboardingCompleted === 'true';
        logger.info('Onboarding status checked', { hasCompleted, raw: onboardingCompleted });
        setHasCompletedOnboarding(hasCompleted);
      } catch (error) {
        logger.error('Error checking onboarding status', { error });
        setHasCompletedOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, []); // Only check once on mount

  // Re-check onboarding status when session state changes (e.g., session deletion, account deletion)
  useEffect(() => {
    const recheckOnboarding = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        const hasCompleted = onboardingCompleted === 'true';

        // Only update if the value has actually changed
        if (hasCompleted !== hasCompletedOnboarding) {
          logger.info('Onboarding status changed after session state update', {
            hasCompleted,
            previous: hasCompletedOnboarding,
            hasValidSession,
            isSessionChecked
          });
          setHasCompletedOnboarding(hasCompleted);
        }
      } catch (error) {
        logger.error('Error re-checking onboarding status', { error });
      }
    };

    // Re-check onboarding status when session is checked and not loading
    // This handles cases where session is deleted or account is deleted
    if (isSessionChecked && !sessionLoading) {
      recheckOnboarding();
    }
  }, [hasValidSession, isSessionChecked, sessionLoading]);

  // Listen for onboarding completion changes (e.g., when paywall is completed/skipped)
  useEffect(() => {
    const checkForOnboardingUpdate = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
        const hasCompleted = onboardingCompleted === 'true';
        if (hasCompleted !== hasCompletedOnboarding) {
          logger.info('Onboarding status updated', { hasCompleted, previous: hasCompletedOnboarding });
          setHasCompletedOnboarding(hasCompleted);
        }
      } catch (error) {
        logger.error('Error checking onboarding status update', { error });
      }
    };

    // Only check for updates if user is currently on paywall screen
    const currentSegment = segments[0];
    if (currentSegment === 'paywall') {
      const interval = setInterval(checkForOnboardingUpdate, 1000);
      return () => clearInterval(interval);
    }
  }, [segments, hasCompletedOnboarding]);

  // Clean, deterministic navigation logic
  useEffect(() => {
    // Wait for all required state to load
    if (sessionLoading || !isSessionChecked || subscriptionLoading || hasCompletedOnboarding === null) {
      logger.debug('Waiting for all contexts to load', {
        sessionLoading,
        isSessionChecked,
        subscriptionLoading,
        hasCompletedOnboarding
      });
      return;
    }

    // Skip navigation if there's a session error
    if (sessionError) {
      logger.debug('Skipping navigation due to session error', { sessionError });
      return;
    }

    const currentSegment = segments[0];
    const hasActiveSubscription = customerInfo?.entitlements.active ? 
      Object.keys(customerInfo.entitlements.active).length > 0 : false;

    logger.info('Navigation evaluation', {
      currentSegment,
      allSegments: segments,
      hasActiveSubscription,
      hasCompletedOnboarding,
      customerInfoPresent: !!customerInfo,
      hasValidSession
    });

    // Critical screens where we should NOT interrupt navigation
    const criticalScreens = ['add-receipt', 'scan'];
    const isInCriticalScreen = criticalScreens.some(screen => segments.includes(screen));
    
    if (isInCriticalScreen) {
      logger.debug('User is in critical screen, skipping navigation logic', { currentSegment });
      return;
    }

    // Determine where user should be based on complete state
    let targetRoute: string | null = null;

    if (hasActiveSubscription) {
      // Rule 1: Active subscription = allow access to legitimate screens
      const legitimateScreensWithSubscription = ['(tabs)', 'scan', 'subscription', 'settings', '(auth)'];
      if (!legitimateScreensWithSubscription.includes(currentSegment)) {
        targetRoute = '/(tabs)';
        logger.info('User has active subscription but in invalid screen - routing to main app');
      }
    } else if (!hasCompletedOnboarding) {
      // Rule 2: No subscription + no onboarding = onboarding flow
      // Only redirect if user is not already in onboarding OR paywall
      const isInOnboardingFlow = currentSegment === '(onboarding)' || currentSegment === 'paywall';
      if (!isInOnboardingFlow) {
        targetRoute = '/(onboarding)/page-1';
        logger.info('User needs onboarding - routing to onboarding');
      }
    } else {
      // Rule 3: No subscription + onboarding complete = allow natural flow
      // User can be in paywall, main app, or other legitimate screens
      const legitimateScreens = ['(tabs)', 'paywall', 'scan', 'subscription', 'settings', '(auth)'];
      if (!legitimateScreens.includes(currentSegment)) {
        targetRoute = '/(tabs)';
        logger.info('User completed onboarding but in invalid screen - routing to main app');
      }
    }

    // Navigate only if needed
    if (targetRoute) {
      logger.info('Navigating to target route', { from: currentSegment, to: targetRoute });
      router.replace(targetRoute as any);
    } else {
      logger.debug('User is in correct location, no navigation needed');
    }

  }, [sessionLoading, isSessionChecked, subscriptionLoading, hasCompletedOnboarding, sessionError, segments, customerInfo, hasValidSession, router]);

  // Show loading screen until all required contexts are ready
  if (sessionLoading || !isSessionChecked || subscriptionLoading || hasCompletedOnboarding === null) {
    logger.debug('Showing loading screen', { 
      sessionLoading, 
      isSessionChecked, 
      subscriptionLoading, 
      hasCompletedOnboarding 
    });
    return <LoadingScreen />;
  }

  // Always render the full navigation stack, but let navigation handle the routing
  return (
    <Stack>
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="paywall" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4299E1',
  },
});

export default function RootLayout() {
  logger.info('Root layout rendering');

  return (
    <>
      <AppContent />
      <StatusBar style="auto" />
    </>
  );
}