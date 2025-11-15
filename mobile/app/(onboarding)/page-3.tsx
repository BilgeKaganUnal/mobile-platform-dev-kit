import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingLayout from '@/components/ui/OnboardingLayout';
import { responsive } from '@/utils/responsive';

export default function OnboardingPage3() {
  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/paywall');
    } catch (error) {
      console.error('Failed to save onboarding completion status:', error);
      router.replace('/paywall');
    }
  };

  return (
    <OnboardingLayout
      title="Ready to Get Started"
      subtitle="You're all set! Let's unlock the full potential of your new experience."
      pageIndicators={3}
      totalPages={3}
      onContinue={handleGetStarted}
      continueText="Get Started"
    >
      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/onboarding_page_3.png')}
          style={styles.onboardingImage}
          resizeMode="contain"
        />
      </View>
    </OnboardingLayout>
  );
}

const imageSize = responsive.getImageContainerSize();

const styles = StyleSheet.create({
  imageContainer: {
    width: imageSize.width,
    height: imageSize.height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingImage: {
    width: '100%',
    height: '100%',
  },
});