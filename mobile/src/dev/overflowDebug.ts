/**
 * DEV ONLY. Finds what is scrolling sideways.
 *
 * Wraps the `View` export of react-native so every View reports its laid-out
 * width. Anything wider than the window logs once with its testID /
 * accessibilityLabel, and — when the outline flag is on — draws a danger-coloured
 * border around itself so you can see the offender on the device.
 *
 * Imported for its side effect as the first line of App.tsx, so the swap lands
 * before NativeWind registers its className interop. Delete this file once the
 * layout is clean.
 */
import React from 'react';
import { Dimensions, LayoutChangeEvent } from 'react-native';
import { tokens } from '../theme/tokens';

const RN = require('react-native');

const PATCH_FLAG = '__artisanHubOverflowDebug';
/** Layout rounding noise; only flag a real overflow. */
const TOLERANCE = 0.5;

let outlineEnabled = false;

/** Turn the red outlines on or off. Re-render or scroll to see the effect. */
export const setOverflowOutline = (enabled: boolean) => {
  outlineEnabled = enabled;
};

export const isOverflowOutlineEnabled = () => outlineEnabled;

// react-native-web's exports are non-configurable, so the swap would throw there.
const canPatch = Object.getOwnPropertyDescriptor(RN, 'View')?.configurable !== false;

if (__DEV__ && canPatch && !RN[PATCH_FLAG]) {
  const BaseView = RN.View;

  const OverflowView = React.forwardRef<unknown, Record<string, any>>((props, ref) => {
    const [tooWide, setTooWide] = React.useState(false);
    const warned = React.useRef(false);

    const onLayout = React.useCallback((event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      const windowWidth = Dimensions.get('window').width;
      const over = width > windowWidth + TOLERANCE;

      if (over && !warned.current) {
        warned.current = true;
        const name = props.testID ?? props.accessibilityLabel ?? '(unnamed View)';
        console.warn(
          `[overflow] ${name} is ${width.toFixed(1)}pt wide, window is ${windowWidth.toFixed(1)}pt ` +
          `(+${(width - windowWidth).toFixed(1)}pt). Add a testID to pin it down.`,
        );
      }
      if (!over) warned.current = false;

      setTooWide(prev => (prev === over ? prev : over));
      props.onLayout?.(event);
    }, [props.onLayout, props.testID, props.accessibilityLabel]);

    return React.createElement(BaseView, {
      ...props,
      ref,
      onLayout,
      style: tooWide && outlineEnabled ? [props.style, outlineStyle] : props.style,
    });
  });
  OverflowView.displayName = 'OverflowDebugView';

  const outlineStyle = { borderWidth: 2, borderColor: tokens.colors.danger } as const;

  Object.defineProperty(RN, 'View', { configurable: true, enumerable: true, get: () => OverflowView });
  Object.defineProperty(RN, PATCH_FLAG, { value: true, enumerable: false });
}
