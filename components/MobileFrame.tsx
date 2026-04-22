/**
 * MobileFrame — Encadre l'app dans un cadre "téléphone" centré sur web desktop.
 *
 * Comportement :
 *   - Plateforme native (iOS / Android) : pass-through, zéro wrapper.
 *   - Web avec largeur < 768px : pass-through (on traite ça comme un mobile).
 *   - Web avec largeur >= 768px : cadre centré maxWidth 480px, fond navy
 *     (#1b3a8c) de chaque côté, fond écran (#070E28) à l'intérieur.
 *
 * overflow: 'hidden' clipe les éléments décoratifs (orbes, gradients) qui
 * débordent au-delà du cadre — pas besoin de toucher aux écrans individuels.
 */
import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

const MAX_MOBILE_WIDTH = 480;
const MOBILE_BREAKPOINT = 768;

export function MobileFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= MOBILE_BREAKPOINT;

  if (!isDesktopWeb) return <>{children}</>;

  return (
    <View style={styles.outer}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#1b3a8c',
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    maxWidth: MAX_MOBILE_WIDTH,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#070E28',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 40px rgba(0,0,0,0.5)' } as any)
      : {}),
  },
});
