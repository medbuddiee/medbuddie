import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../context/UserContext';
import UpdateBanner from '../components/UpdateBanner';

Sentry.init({
  dsn: 'https://2b0337610748ec812fd6dfcb6794b2ae@o4511312834658304.ingest.us.sentry.io/4511312836362240',
  tracesSampleRate: 1.0,
  enableNative: true,
  attachStacktrace: true,
});

function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <Stack screenOptions={{ headerShown: false }} />
          <UpdateBanner />
        </View>
      </UserProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  root: { flex: 1 },
});
