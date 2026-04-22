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

      // Neutralise le style d'auto-remplissage (jaune Firefox, bleu Chrome)
      // qui casse le design navy/or sur les champs de connexion.
      // Utilise #0F1E48 (COLORS.surface) pour rester coherent avec le fond
      // des cartes de login.
      const autofillStyle = document.createElement('style');
      autofillStyle.setAttribute('data-miznas-autofill', 'true');
      autofillStyle.textContent = `
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #0F1E48 inset !important;
          -webkit-text-fill-color: #FFFFFF !important;
          caret-color: #FFFFFF !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        /* Firefox */
        input:autofill {
          background-color: #0F1E48 !important;
          color: #FFFFFF !important;
        }
      `;
      document.head.appendChild(autofillStyle);

      return () => {
        autofillStyle.remove();
      };
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
