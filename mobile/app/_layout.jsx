import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../context/UserContext';
import UpdateBanner from '../components/UpdateBanner';

// Global error handler — shows crash message on screen instead of killing the app
if (global.ErrorUtils) {
  const prev = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert(
      isFatal ? '💥 Fatal Error' : '⚠️ Error',
      `${error?.message ?? error}\n\n${error?.stack?.split('\n').slice(0, 4).join('\n') ?? ''}`,
      [{ text: 'OK' }]
    );
    if (!isFatal) prev(error, isFatal);
  });
}

export default function RootLayout() {
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

const styles = StyleSheet.create({
  root: { flex: 1 },
});
