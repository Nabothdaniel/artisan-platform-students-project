import React from 'react';
import {
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
  PressableStateCallbackType,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

/** react-native-web adds `hovered`; on native it is always false. */
export type PressableState = PressableStateCallbackType & { hovered: boolean };

export interface PressableProps extends Omit<RNPressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle> | ((state: PressableState) => StyleProp<ViewStyle>);
  children?: React.ReactNode | ((state: PressableState) => React.ReactNode);
}

/**
 * Drop-in for react-native's Pressable. Use this one everywhere.
 *
 * NativeWind's native runtime treats `style` as a plain object, so the
 * `style={({ pressed }) => ...}` function form is silently dropped on a phone:
 * the background, padding and flex all vanish (web is unaffected). This tracks
 * pressed/hovered itself and always hands the real Pressable a resolved style.
 */
export const Pressable = React.forwardRef<View, PressableProps>(
  ({ style, children, onPressIn, onPressOut, onHoverIn, onHoverOut, ...props }, ref) => {
    const [pressed, setPressed] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const state: PressableState = { pressed, hovered };

    return (
      <RNPressable
        {...props}
        ref={ref}
        onPressIn={event => { setPressed(true); onPressIn?.(event); }}
        onPressOut={event => { setPressed(false); onPressOut?.(event); }}
        onHoverIn={event => { setHovered(true); onHoverIn?.(event); }}
        onHoverOut={event => { setHovered(false); onHoverOut?.(event); }}
        style={typeof style === 'function' ? style(state) : style}
      >
        {typeof children === 'function' ? children(state) : children}
      </RNPressable>
    );
  },
);
Pressable.displayName = 'Pressable';
