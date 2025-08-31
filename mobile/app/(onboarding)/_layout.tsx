import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="page-1" />
      <Stack.Screen name="page-2" />
      <Stack.Screen name="page-3" />
    </Stack>
  );
}