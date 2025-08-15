# Mobile App Documentation

A React Native/Expo mobile application with Zustand state management, TypeScript, and comprehensive authentication.

## 🏗 Architecture

### Modern React Native Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   └── register.tsx   # Register screen
│   ├── (tabs)/            # Main app screens
│   │   └── index.tsx      # Home screen
│   ├── _layout.tsx        # Root layout with auth routing
│   └── +not-found.tsx     # 404 error screen
└── src/                   # Application source code
    ├── store/             # Zustand stores
    │   ├── auth.store.ts  # Authentication state
    │   ├── ui.store.ts    # UI state (loading, notifications)
    │   └── index.ts       # Store exports
    ├── hooks/             # Custom React hooks
    │   ├── useAuth.ts     # Authentication hook
    │   ├── useAPI.ts      # API operations hook
    │   └── index.ts       # Hook exports
    ├── services/          # API services
    │   ├── api.ts         # Axios configuration
    │   ├── auth.ts        # Authentication API calls
    │   └── errorService.ts # Error handling service
    ├── components/        # UI components
    │   ├── ui/            # Reusable UI components
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   └── LoadingSpinner.tsx
    │   └── auth/          # Authentication components
    │       ├── LoginForm.tsx
    │       └── RegisterForm.tsx
    └── utils/             # Helper functions
        ├── logger.ts      # Logging utility
        └── formatters.ts  # Text formatting helpers
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Emulator
- Physical device with Expo Go app (optional)

### Installation

1. Navigate to mobile directory:
   ```bash
   cd mobile
   npm install
   ```

2. Configure API URL:
   Update `src/services/api.ts` with your backend URL:
   ```typescript
   const API_URL = 'http://localhost:8080'; // Your backend URL
   // For physical devices: 'http://YOUR_COMPUTER_IP:8080'
   ```

3. Start development server:
   ```bash
   npm start
   ```

4. Choose your development platform:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator  
   npm run web     # Web browser
   ```

## 📱 Features

### Core Features

- ✅ **Authentication Flow** - Login, register, logout with JWT
- ✅ **Expo Router** - File-based navigation with TypeScript routes
- ✅ **Zustand State Management** - Lightweight, performant state
- ✅ **Form Validation** - Client-side input validation
- ✅ **Error Handling** - User-friendly error messages and recovery
- ✅ **Loading States** - Responsive UI feedback
- ✅ **Persistent Storage** - Automatic state persistence
- ✅ **TypeScript** - Full type safety throughout the app
- ✅ **Custom Hooks** - Reusable logic patterns
- ✅ **Component Library** - Consistent, accessible UI components

### State Management with Zustand

**Auth Store:**
```typescript
const { user, isAuthenticated, login, logout } = useAuth();

// Login user
await login({ email: 'user@example.com', password: 'password' });

// Access user data
console.log(user?.name); // Current user's name
```

**UI Store:**
```typescript
const { showNotification, isLoading } = useUIActions();

// Show success notification
showNotification({
  type: 'success',
  title: 'Success!',
  message: 'Operation completed successfully'
});
```

## 🎨 UI Components

### Button Component

```typescript
import { Button } from '@/components/ui';

<Button
  title="Sign In"
  onPress={handleLogin}
  loading={isLoading}
  variant="primary"
  size="medium"
  fullWidth
/>
```

**Variants:**
- `primary` - Blue background
- `secondary` - Gray background  
- `outline` - Transparent with border
- `ghost` - Transparent

**Sizes:**
- `small` - 32px height
- `medium` - 44px height
- `large` - 52px height

### Input Component

```typescript
import { Input } from '@/components/ui';

<Input
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  keyboardType="email-address"
  autoCapitalize="none"
  error={emailError}
  hint="We'll never share your email"
/>
```

**Features:**
- Built-in validation states
- Password toggle for secure inputs
- Customizable styling
- Accessible labels and hints

## 🔧 State Management

### Zustand Store Pattern

**Creating a Store:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    { name: 'my-storage' }
  )
);
```

**Using the Store:**
```typescript
const { count, increment, decrement } = useMyStore();
```

### Selectors for Performance

```typescript
// Only re-render when specific fields change
const user = useAuthStore((state) => state.user);
const isLoading = useAuthStore((state) => state.isLoading);
```

## 🛠 Custom Hooks

### useAuth Hook

Comprehensive authentication hook with error handling:

```typescript
const {
  user,
  isAuthenticated,
  isLoading,
  error,
  login,
  register,
  logout,
  updateProfile,
  changePassword
} = useAuth();

// Login with error handling
const handleLogin = async () => {
  const result = await login({ email, password });
  if (result.success) {
    // Navigate to main app
  }
};
```

### useAPI Hook

Generic API operations with loading states:

```typescript
const { data, loading, error, execute } = useAPI();

// Execute API call
const result = await execute(() => 
  authService.updateProfile({ name: 'New Name' })
);
```

## 🌐 Navigation

### Expo Router Structure

**Authentication Flow:**
- Users start at the root layout
- Redirected to `(auth)/login` if not authenticated
- Redirected to `(tabs)/` if authenticated

**Adding New Screens:**
1. Create file in `app/` directory
2. Export default React component
3. Navigation handled automatically

**Programmatic Navigation:**
```typescript
import { router } from 'expo-router';

// Navigate to screen
router.push('/(auth)/login');

// Replace current screen
router.replace('/(tabs)/');

// Go back
router.back();
```

## 🔐 Security

### Implemented Security Measures

- **Token Storage:** Secure AsyncStorage for JWT tokens
- **Input Validation:** Client-side form validation
- **Error Handling:** No sensitive data exposed in error messages
- **Auto-logout:** Invalid tokens trigger automatic logout
- **Type Safety:** TypeScript prevents runtime errors

### Best Practices

1. **Validate all user input** before sending to API
2. **Handle errors gracefully** with user-friendly messages
3. **Use TypeScript** for type safety
4. **Keep sensitive data secure** in AsyncStorage
5. **Implement proper loading states** for better UX

## 📦 API Integration

### Service Layer Pattern

**Auth Service:**
```typescript
import { authService } from '@/services/auth';

// Login user
const response = await authService.login({ email, password });

// Get current user
const user = await authService.getCurrentUser();

// Update profile
const updatedUser = await authService.updateProfile({ name: 'New Name' });
```

**Automatic Token Management:**
- Tokens automatically added to requests
- Invalid tokens trigger logout
- Network errors handled gracefully

### Error Handling

**Structured Error Responses:**
```typescript
// API errors are automatically converted to user-friendly messages
try {
  await authService.login(credentials);
} catch (error) {
  // Error is already user-friendly
  showNotification({
    type: 'error',
    title: 'Login Failed',
    message: error.message
  });
}
```

## 🎯 Development Workflow

### Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Development Tips

1. **Use TypeScript:** Take advantage of type checking
2. **Component Structure:** Keep components small and focused
3. **Custom Hooks:** Extract reusable logic into hooks
4. **Error Boundaries:** Implement error boundaries for crash recovery
5. **Performance:** Use React.memo for expensive components

### Adding New Features

1. **Create Types:**
   ```typescript
   // types/feature.ts
   export interface Feature {
     id: string;
     name: string;
   }
   ```

2. **Create Store:**
   ```typescript
   // store/feature.store.ts
   export const useFeatureStore = create<FeatureState>(() => ({
     features: [],
     loading: false,
   }));
   ```

3. **Create Service:**
   ```typescript
   // services/feature.ts
   class FeatureService {
     async getFeatures() {
       const response = await api.get('/features');
       return response.data;
     }
   }
   ```

4. **Create Hook:**
   ```typescript
   // hooks/useFeature.ts
   export const useFeature = () => {
     const store = useFeatureStore();
     // Hook logic
   };
   ```

5. **Create Component:**
   ```typescript
   // components/FeatureList.tsx
   export const FeatureList = () => {
     const { features, loading } = useFeature();
     // Component logic
   };
   ```

## 📱 Platform-Specific Considerations

### iOS

- Follows iOS Human Interface Guidelines
- Native navigation animations
- iOS-specific permissions handling

### Android

- Material Design principles
- Android-specific back button handling
- System navigation integration

### Web

- Responsive design for different screen sizes
- Web-specific optimizations
- PWA capabilities (can be added)

## 🚀 Building for Production

### EAS Build Setup

1. Install EAS CLI:
   ```bash
   npm install -g @expo/cli
   ```

2. Configure EAS:
   ```bash
   eas build:configure
   ```

3. Build for platforms:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

### App Store Deployment

1. **iOS:** Upload to App Store Connect
2. **Android:** Upload to Google Play Console
3. **Over-the-Air Updates:** Use EAS Update for instant updates

## 🧪 Testing (Recommended Setup)

While not included, recommended testing libraries:

```bash
npm install --save-dev jest @testing-library/react-native
```

**Test Structure:**
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { LoginForm } from '../components/auth/LoginForm';

test('should submit form with valid data', () => {
  const onSubmit = jest.fn();
  const { getByPlaceholderText, getByText } = render(
    <LoginForm onSubmit={onSubmit} />
  );
  
  fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
  fireEvent.changeText(getByPlaceholderText('Password'), 'password');
  fireEvent.press(getByText('Sign In'));
  
  expect(onSubmit).toHaveBeenCalled();
});
```

## 📊 Performance Optimization

### Zustand Performance

- Use selectors to prevent unnecessary re-renders
- Split stores by domain for better performance
- Avoid storing derived data in state

### React Native Performance

- Use `React.memo` for expensive components
- Implement proper list virtualization for long lists
- Optimize image loading and caching
- Use Flipper for performance debugging

## 🔄 State Persistence

### Automatic Persistence

Auth state is automatically persisted:

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Store state
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);
```

### Manual Persistence

For custom data persistence:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
await AsyncStorage.setItem('key', JSON.stringify(data));

// Load data
const data = JSON.parse(await AsyncStorage.getItem('key') || '{}');
```