import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { tokens } from '../../../theme/tokens';

export type TextVariant = 'title' | 'heading' | 'subheading' | 'body' | 'meta' | 'button';

const variantStyles = {
  title: { fontFamily: tokens.typography.fontFamily.semibold, fontSize: tokens.typography.fontSize.title, lineHeight: tokens.typography.lineHeight.title, letterSpacing: -0.5 },
  heading: { fontFamily: tokens.typography.fontFamily.semibold, fontSize: tokens.typography.fontSize.heading, lineHeight: tokens.typography.lineHeight.heading },
  subheading: { fontFamily: tokens.typography.fontFamily.semibold, fontSize: tokens.typography.fontSize.subheading, lineHeight: tokens.typography.lineHeight.subheading },
  body: { fontFamily: tokens.typography.fontFamily.regular, fontSize: tokens.typography.fontSize.body, lineHeight: tokens.typography.lineHeight.body },
  meta: { fontFamily: tokens.typography.fontFamily.regular, fontSize: tokens.typography.fontSize.meta, lineHeight: tokens.typography.lineHeight.meta },
  button: { fontFamily: tokens.typography.fontFamily.semibold, fontSize: tokens.typography.fontSize.button, lineHeight: tokens.typography.lineHeight.button },
} as const;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** A color token, or 'inherit' to take the colour of the enclosing <Text>. */
  color?: string | 'inherit';
}

export const Text: React.FC<TextProps> = ({ variant = 'body', color = tokens.colors.text, style, ...props }) => (
  <RNText {...props} style={[variantStyles[variant], color === 'inherit' ? null : { color }, style]} />
);
