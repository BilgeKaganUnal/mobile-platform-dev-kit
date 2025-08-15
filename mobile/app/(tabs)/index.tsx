import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks';
import { Button } from '../../src/components/ui';
import { formatDisplayName } from '../../src/utils/formatters';

export default function HomeScreen() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Your App!</Text>
          
          {user && (
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>
                Hello, {formatDisplayName(user.name)}!
              </Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.userId}>User ID: {user.id}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getting Started</Text>
            <Text style={styles.sectionText}>
              This is your main app screen. You can now start building your amazing features!
            </Text>
            
            <View style={styles.featureList}>
              <Text style={styles.feature}>✅ Authentication system</Text>
              <Text style={styles.feature}>✅ Zustand state management</Text>
              <Text style={styles.feature}>✅ Error handling</Text>
              <Text style={styles.feature}>✅ Form validation</Text>
              <Text style={styles.feature}>✅ API integration</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Logout"
              variant="outline"
              onPress={handleLogout}
              loading={isLoading}
              style={styles.logoutButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  scrollContent: {
    flexGrow: 1,
  },
  
  content: {
    flex: 1,
    padding: 20,
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 24,
  },
  
  userInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  
  email: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4,
  },
  
  userId: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  
  sectionText: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 16,
  },
  
  featureList: {
    gap: 8,
  },
  
  feature: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
  },
  
  actions: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  
  logoutButton: {
    marginTop: 16,
  },
});