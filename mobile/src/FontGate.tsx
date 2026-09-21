import React from 'react';
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
// Per-weight entry points: the package index requires all 14 font files into the bundle.
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      console.log('[ArtisanHub] Font.isLoaded Plus Jakarta Sans', {
        regular: Font.isLoaded('PlusJakartaSans-Regular'),
        medium: Font.isLoaded('PlusJakartaSans-Medium'),
        semibold: Font.isLoaded('PlusJakartaSans-SemiBold'),
        bold: Font.isLoaded('PlusJakartaSans-Bold'),
      });
      if (fontError) {
        console.error('[ArtisanHub] Plus Jakarta Sans failed to load; using platform fallback.', fontError);
      }
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;
  return <>{children}</>;
};
