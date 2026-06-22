import * as Haptics from 'expo-haptics';
import { AlertCircle } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const DEFAULT_DURATION_MS = 3000;

/** Aviso breve alineado con cards y ConfirmSheet del picking. */
export function useToast(durationMs = DEFAULT_DURATION_MS) {
  const [message, setMessage] = useState<string | null>(null);
  const [nudgeToken, setNudgeToken] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(false);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isVisibleRef.current = false;
    setMessage(null);
  }, []);

  const scheduleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isVisibleRef.current = false;
      setMessage(null);
    }, durationMs);
  }, [durationMs]);

  const show = useCallback(
    (msg: string) => {
      if (isVisibleRef.current) {
        setNudgeToken((t) => t + 1);
        scheduleDismiss();
        return;
      }

      isVisibleRef.current = true;
      setMessage(msg);
      scheduleDismiss();
    },
    [scheduleDismiss],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { message, nudgeToken, show, dismiss };
}

interface ToastProps {
  message: string | null;
  nudgeToken?: number;
  topInset?: number;
}

export function Toast({ message, nudgeToken = 0, topInset = 56 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState<string | null>(null);
  const displayedRef = useRef<string | null>(null);

  const animateIn = useCallback(() => {
    opacity.setValue(0);
    translateY.setValue(-10);
    shakeX.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, shakeX, translateY]);

  const animateOut = useCallback(
    (onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -8,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onDone?.());
    },
    [opacity, translateY],
  );

  const animateShake = useCallback(() => {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -5, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 5, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -3, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 3, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 35, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

  useEffect(() => {
    if (!message) return;
    displayedRef.current = message;
    setDisplayed(message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    animateIn();
  }, [message, animateIn]);

  useEffect(() => {
    if (message) return;
    if (!displayedRef.current) return;
    animateOut(() => {
      displayedRef.current = null;
      setDisplayed(null);
    });
  }, [message, animateOut]);

  useEffect(() => {
    if (!nudgeToken || !displayedRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateShake();
  }, [nudgeToken, animateShake]);

  if (!displayed) return null;

  return (
    <View style={[styles.wrap, { top: topInset }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity,
            transform: [{ translateY }, { translateX: shakeX }],
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <AlertCircle size={18} color="#D97706" strokeWidth={2.2} />
        </View>
        <Text style={styles.text}>{displayed}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 200,
    elevation: 20,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
