import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [firstNameCheckDone, setFirstNameCheckDone] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    const checkNavigation = async () => {
      if (!session) {
        if (!inAuthGroup) {
          router.replace('/(auth)/login');
        }
        return;
      }

      // Check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single();

      if (profile && !profile.onboarding_completed) {
        router.replace('/onboarding');
      } else if (inAuthGroup || segments[0] === 'onboarding') {
        router.replace('/(tabs)');
      } else if (!inTabsGroup && profile?.onboarding_completed) {
        // Fallback if they are nowhere valid? specific handled by expo-router usually
      }
      setFirstNameCheckDone(true);
    };

    checkNavigation();
  }, [session, segments, isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="analysis/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="calculator" options={{ headerShown: false }} />
        <Stack.Screen name="wallet" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
