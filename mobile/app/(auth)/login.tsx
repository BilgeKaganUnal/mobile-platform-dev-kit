import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LoginForm } from '../../src/components/auth';

export default function LoginScreen() {
  const handleLoginSuccess = () => {
    // Navigate to the main app
    router.replace('/(tabs)');
  };

  const handleSwitchToRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={handleSwitchToRegister}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});