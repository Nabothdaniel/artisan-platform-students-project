import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from './Pressable';
import { tokens } from '../../../theme/tokens';
import { Text, TextProps } from './Text';

interface ExpandableTextProps extends TextProps {
  children: React.ReactNode;
  /** Lines shown while collapsed. */
  lines?: number;
  moreLabel?: string;
  lessLabel?: string;
}

/** Clamps long copy and offers a toggle only when the text actually overflows. */
export const ExpandableText: React.FC<ExpandableTextProps> = ({
  children,
  lines = 3,
  moreLabel = 'Read more',
  lessLabel = 'Show less',
  ...textProps
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [truncated, setTruncated] = React.useState(false);

  return (
    <View style={styles.container}>
      <Text
        {...textProps}
        numberOfLines={expanded ? undefined : lines}
        onTextLayout={event => {
          // Fires with every line; more lines than the clamp means there is more to read.
          if (!expanded && event.nativeEvent.lines.length > lines) setTruncated(true);
        }}
      >
        {children}
      </Text>
      {truncated ? (
        <Pressable onPress={() => setExpanded(value => !value)} hitSlop={8} accessibilityRole="button">
          <Text variant="meta" color={tokens.colors.accent}>{expanded ? lessLabel : moreLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: tokens.spacing[1] },
});
