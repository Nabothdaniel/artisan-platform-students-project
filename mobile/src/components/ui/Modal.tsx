import React from 'react';
import { ViewStyle } from 'react-native';
import { Sheet } from './foundation/Sheet';

interface ModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Pinned action area. Never scrolls. */
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
}

/**
 * Thin alias kept so screens keep their current import. The header, scrolling
 * body and pinned footer all live in foundation/Sheet now.
 */
export const Modal: React.FC<ModalProps> = ({ visible, title, onClose, children, footer, contentStyle }) => (
  <Sheet visible={visible} onClose={onClose} title={title} footer={footer} style={contentStyle}>
    {children}
  </Sheet>
);
