import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MobileFrame } from '@/components/MobileFrame';

export default function RootLayout() {
  // Filet de securite anti-scroll-horizontal sur web :
  // certaines pages ont des orbes decoratifs en position absolue qui
  // debordent a droite sur mobile etroit (< 768px, donc hors MobileFrame).
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.overflowX = 'hidden';
    }
  }, []);

  return (
    <MobileFrame>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </MobileFrame>
  );
}
