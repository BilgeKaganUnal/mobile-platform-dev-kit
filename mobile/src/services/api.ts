import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API Configuration
const getApiUrl = () => {
  // Replace with your backend URL
  const API_URL = 'http://localhost:8080'; // Change this to your backend URL
  
  // For physical devices, use your computer's IP instead of localhost
  // const API_URL = 'http://192.168.1.100:8080'; // Replace with your IP
  
  return API_URL;
};

const API_URL = Constants.expoConfig?.extra?.apiUrl || getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth-storage');
      if (token) {
        const parsedStorage = JSON.parse(token);
        const authToken = parsedStorage?.state?.token;
        
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
      }
      
      return config;
    } catch (error) {
      console.error('API Request Error:', error);
      return config;
    }
  },
  (error) => {
    console.error('API Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 errors by clearing auth
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth-storage');
      // You might want to redirect to login or trigger a global auth state reset
    }
    
    return Promise.reject(error);
  }
);

export default api;