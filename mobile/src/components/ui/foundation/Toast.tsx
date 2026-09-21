import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Pressable } from './Pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../../theme/tokens';
import { Icon, IconName } from '../Icon';
import { FLOATING_TAB_BAR_SPACE } from './FloatingTabBar';
import { Text } from './Text';

export type ToastTone = 'neutral' | 'success' | 'danger';

interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds on screen. Defaults to 3500. */
  duration?: number;
}

interface ToastApi {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {}, success: () => {}, error: () => {} });

const toneIcon: Record<ToastTone, IconName | null> = {
  neutral: null,
  success: 'check-circle-outline',
  danger: 'alert-circle-outline',
};

const toneColor: Record<ToastTone, string> = {
  neutral: tokens.colors.text,
  success: tokens.colors.success,
  danger: tokens.colors.danger,
};

type ActiveToast = { id: number; message: string; tone: ToastTone; duration: number };

/**
 * One transient message at a time, floating just above the tab bar. A new toast
 * replaces the current one. Mount once, inside SafeAreaProvider.
 *
 * Use it for the outcome of something the user just did ("Bid accepted",
 * "Could not update status"). Validation errors stay inline next to the form.
 *
 * It renders in the app root, so it sits *behind* any open Modal/Sheet — report
 * errors that happen inside a modal inline there instead.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 160, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [progress]);

  useEffect(() => {
    if (!toast) return;
    Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(hide, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, hide, progress]);

  const api = useMemo<ToastApi>(() => {
    const show = (message: string, { tone = 'neutral', duration = 3500 }: ToastOptions = {}) => {
      nextId.current += 1;
      setToast({ id: nextId.current, message, tone, duration });
    };
    return {
      show,
      success: message => show(message, { tone: 'success' }),
      error: message => show(message, { tone: 'danger', duration: 5000 }),
    };
  }, []);

  const icon = toast ? toneIcon[toast.tone] : null;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + FLOATING_TAB_BAR_SPACE + tokens.spacing[3] }]}>
          <Animated.View
            style={{
              opacity: progress,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            }}
          >
            <Pressable
              accessibilityRole="alert"
              accessibilityLiveRegion={toast.tone === 'danger' ? 'assertive' : 'polite'}
              accessibilityHint="Dismisses this message"
              onPress={hide}
              style={styles.toast}
            >
              {icon ? <Icon name={icon} size={tokens.iconSizes.md} color={toneColor[toast.tone]} /> : null}
              <Text variant="body" color={tokens.colors.text} numberOfLines={3} style={styles.message}>
                {toast.message}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: tokens.spacing[5],
    alignItems: 'center',
  },
  toast: {
    maxWidth: 480,
    minHeight: 44,
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  message: { flexShrink: 1 },
});
