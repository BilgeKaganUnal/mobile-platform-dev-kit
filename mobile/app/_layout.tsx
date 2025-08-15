import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '../src/hooks';
import { LoadingSpinner } from '../src/components/ui';

export default function RootLayout() {
  const { isAuthenticated, isAuthChecked, isLoading } = useAuth();

  useEffect(() => {
    if (!isAuthChecked) return; // Wait for auth check to complete

    if (isAuthenticated) {
      // User is logged in, redirect to main app
      router.replace('/(tabs)');
    } else {
      // User is not logged in, redirect to login
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isAuthChecked]);

  // Show loading screen while checking authentication
  if (!isAuthChecked || isLoading) {
    return <LoadingSpinner overlay text="Loading..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not Found' }} />
    </Stack>
  );
}