import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { tokens } from '../../../theme/tokens';
import { Text } from './Text';

interface AvatarProps {
  name: string;
  /** Photo URL. Falls back to initials while loading and on error. */
  uri?: string;
  size?: number;
  verified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 44, verified = false }) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [uri]);

  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'AH';
  const showImage = !!uri && !failed;

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text variant="subheading" color={tokens.colors.inverseText}>{initials}</Text>
      {showImage ? (
        <Image
          source={{ uri }}
          accessibilityLabel={name}
          onError={() => setFailed(true)}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
        />
      ) : null}
      {verified ? <View style={styles.badge} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: { backgroundColor: tokens.colors.inverse, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.success,
    borderWidth: 2,
    borderColor: tokens.colors.surface,
  },
});
