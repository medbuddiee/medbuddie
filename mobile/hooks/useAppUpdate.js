import { useState, useEffect, useCallback } from 'react';
import * as Updates from 'expo-updates';

export default function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading,     setDownloading]     = useState(false);
  const [error,           setError]           = useState(null);

  const checkForUpdate = useCallback(async () => {
    // Updates only work in standalone builds, not Expo Go or dev
    if (__DEV__ || !Updates.isEnabled) return;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) setUpdateAvailable(true);
    } catch { /* silent — network may be unavailable */ }
  }, []);

  // Check on mount
  useEffect(() => { checkForUpdate(); }, [checkForUpdate]);

  const applyUpdate = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e) {
      setError('Update failed. Please try again.');
      setDownloading(false);
    }
  }, []);

  return { updateAvailable, downloading, error, applyUpdate };
}
