import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppUpdate from '../hooks/useAppUpdate';
import { Colors } from '../constants/colors';

export default function UpdateBanner() {
  const { updateAvailable, downloading, error, applyUpdate } = useAppUpdate();
  const insets = useSafeAreaInsets();

  if (!updateAvailable) return null;

  return (
    <View style={[styles.banner, { top: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
      <MaterialCommunityIcons name="arrow-up-circle" size={18} color="#fff" />
      <Text style={styles.text} numberOfLines={1}>
        {error ?? 'A new version is available!'}
      </Text>
      <TouchableOpacity
        style={[styles.btn, downloading && styles.btnDisabled]}
        onPress={applyUpdate}
        disabled={downloading}
      >
        {downloading
          ? <ActivityIndicator color={Colors.primary} size="small" />
          : <Text style={styles.btnLabel}>Update now</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  text: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
