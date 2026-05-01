const IS_IOS = process.env.EAS_BUILD_PLATFORM === 'ios';

export default {
  expo: {
    name: 'MedBuddie',
    slug: 'medbuddie',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'medbuddie',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#f9f9f9',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.medbuddie.app',
      infoPlist: {
        NSHealthShareUsageDescription:
          'MedBuddie reads your health data (steps, heart rate, weight, blood pressure) to keep your health profile up to date.',
        NSHealthUpdateUsageDescription:
          'MedBuddie may write health data back to Apple Health.',
        NSMotionUsageDescription: 'MedBuddie uses motion data to count steps.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#f0f0f0',
      },
      package: 'com.medbuddie.app',
      softwareKeyboardLayoutMode: 'resize',
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.health.READ_STEPS',
        'android.permission.health.READ_HEART_RATE',
        'android.permission.health.READ_WEIGHT',
        'android.permission.health.READ_HEIGHT',
        'android.permission.health.READ_BLOOD_PRESSURE',
        'android.permission.health.READ_BLOOD_GLUCOSE',
        'android.permission.health.READ_SLEEP',
        'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
      ],
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      '@sentry/react-native/expo',
      [
        'expo-build-properties',
        {
          android: { minSdkVersion: 26 },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'MedBuddie needs access to your photos to update your profile picture.',
        },
      ],
      // react-native-health is iOS (HealthKit) only — skip on Android builds
      ...(IS_IOS ? [['react-native-health', { isClinicalDataEnabled: false }]] : []),
      // react-native-health-connect is Android (Health Connect) only
      ...(!IS_IOS ? ['react-native-health-connect'] : []),
    ],
    experiments: {
      typedRoutes: false,
    },
    extra: {
      apiUrl: 'https://medbuddie.up.railway.app',
      googleClientId: '',
      router: {},
      eas: {
        projectId: '6e87e0a3-465e-4113-b660-815db6abb27c',
      },
    },
    owner: 'a0122529',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/6e87e0a3-465e-4113-b660-815db6abb27c',
    },
  },
};
