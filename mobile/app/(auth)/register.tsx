import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { RegisterForm } from '../../src/components/auth';

export default function RegisterScreen() {
  const handleRegisterSuccess = () => {
    // Navigate to the main app
    router.replace('/(tabs)');
  };

  const handleSwitchToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={handleSwitchToLogin}
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