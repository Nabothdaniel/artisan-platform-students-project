import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { tokens } from '../theme/tokens';
import { Icon } from '../components/ui/Icon';
import { isOverflowOutlineEnabled, setOverflowOutline } from './overflowDebug';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  DateChip,
  ExpandableText,
  Divider,
  EmptyState,
  FloatingTabBar,
  Header,
  IconButton,
  Input,
  InverseCard,
  ListRow,
  Modal,
  Rating,
  SectionHeader,
  Sheet,
  Skeleton,
  Text as FoundationText,
  Pressable,
} from '../components/ui/foundation';

const swatches = [
  ['background', tokens.colors.background],
  ['surface', tokens.colors.surface],
  ['surface-raised', tokens.colors.surfaceRaised],
  ['text', tokens.colors.text],
  ['text-muted', tokens.colors.textMuted],
  ['accent', tokens.colors.accent],
  ['inverse', tokens.colors.inverse],
];

/** Labelled block so every component in the library gets a named section. */
const Spec: React.FC<{ name: string; note?: string; children: React.ReactNode }> = ({ name, note, children }) => (
  <View className="mt-6 gap-3">
    <View className="gap-1">
      <Text className="font-jakarta-semibold text-heading text-text">{name}</Text>
      {note ? <Text className="font-jakarta text-meta text-text-muted">{note}</Text> : null}
    </View>
    {children}
  </View>
);

const noop = () => undefined;

export const DevShowcase: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [sheetVisible, setSheetVisible] = React.useState(false);
  const [titledSheetVisible, setTitledSheetVisible] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [confirmResult, setConfirmResult] = React.useState('untouched');
  const [outlineOn, setOutlineOn] = React.useState(isOverflowOutlineEnabled());
  const [activeTab, setActiveTab] = React.useState('explore');
  const [selectedDate, setSelectedDate] = React.useState('12');
  const [chipSelected, setChipSelected] = React.useState(false);
  const rotation = useSharedValue(0);
  const probeStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1800 }), -1, false);
  }, [rotation]);

  return (
  <View className="absolute inset-0 bg-background">
  <ScrollView className="flex-1 p-5">
    <View className="flex-row items-center justify-between">
      <Text className="font-jakarta-bold text-title text-text">Design Tokens</Text>
      <Pressable className="min-h-11 rounded-full bg-inverse px-4 py-3" onPress={onClose}>
        <Text className="font-jakarta-semibold text-button text-inverse-text">Close</Text>
      </Pressable>
    </View>
    <Text className="mt-2 font-jakarta text-body text-text-muted">NativeWind className test and Phase 1 token proof.</Text>

    <Text className="mt-6 font-jakarta-semibold text-heading text-text">Colors</Text>
    <View className="mt-3 flex-row flex-wrap gap-3">
      {swatches.map(([name, color]) => (
        <View key={name} className="w-28 rounded-md border border-border p-3" style={{ backgroundColor: color }}>
          <Text className="font-jakarta-medium text-meta text-text">{name}</Text>
          <Text className="mt-1 font-jakarta text-meta text-text-muted">{color}</Text>
        </View>
      ))}
    </View>

    <Text className="mt-6 font-jakarta-semibold text-heading text-text">Type scale</Text>
    <Text className="mt-3 font-jakarta-bold text-title text-text">Plus Jakarta Sans 700</Text>
    <Text className="mt-2 font-jakarta-semibold text-heading text-text">Plus Jakarta Sans 600</Text>
    <Text className="mt-2 font-jakarta-medium text-subheading text-text">Plus Jakarta Sans 500</Text>
    <Text className="mt-2 font-jakarta text-body text-text-muted">Plus Jakarta Sans 400</Text>

    <Text className="mt-6 font-jakarta-semibold text-heading text-text">Font proof</Text>
    <Text className="mt-3 font-system text-body text-text">ArtisanHub marketplace - system font</Text>
    <Text className="mt-2 font-jakarta text-body text-text">ArtisanHub marketplace - Jakarta 400</Text>
    <Text className="mt-2 font-jakarta-medium text-body text-text">ArtisanHub marketplace - Jakarta 500</Text>
    <Text className="mt-2 font-jakarta-semibold text-body text-text">ArtisanHub marketplace - Jakarta 600</Text>
    <Text className="mt-2 font-jakarta-bold text-body text-text">ArtisanHub marketplace - Jakarta 700</Text>

    <Text className="mt-6 font-jakarta-semibold text-heading text-text">Overflow debug</Text>
    <Text className="mt-2 font-jakarta text-meta text-text-muted">
      Outlines any View wider than the window in danger red and logs it with a [overflow] warning.
      Toggle, then close the showcase and scroll the screen you suspect.
    </Text>
    <View className="mt-3">
      <Button
        label={outlineOn ? 'Overflow outlines: ON' : 'Overflow outlines: OFF'}
        icon="alert-circle-outline"
        variant={outlineOn ? 'danger' : 'secondary'}
        onPress={() => { const next = !outlineOn; setOverflowOutline(next); setOutlineOn(next); }}
      />
    </View>

    <Text className="mt-6 font-jakarta-semibold text-heading text-text">Runtime probes</Text>
    <View className="mt-3 flex-row items-center gap-3">
      <Animated.View className="h-11 w-11 rounded-full bg-inverse" style={probeStyle} />
      <Text className="font-jakarta text-body text-text-muted">Reanimated 4 rotation is running.</Text>
    </View>

    <Text className="mt-6 font-jakarta-semibold text-heading text-text">Radii and icon sizes</Text>
    <View className="mt-3 flex-row items-end gap-3">
      <View className="h-12 w-12 rounded-sm bg-surface-raised" />
      <View className="h-12 w-12 rounded-md bg-surface-raised" />
      <View className="h-12 w-12 rounded-lg bg-surface-raised" />
      <View className="h-12 w-12 rounded-full bg-inverse" />
    </View>
    <Text className="mt-3 font-jakarta text-meta text-text-muted">12 / 20 / 28 / 9999   |   18 / 20 / 24</Text>

    <Text className="mt-10 font-jakarta-bold text-title text-text">Component library</Text>
    <Text className="mt-2 font-jakarta text-body text-text-muted">Every Phase 2 component with every variant and state.</Text>

    <Spec name="Text" note="variant: title | heading | subheading | body | meta | button, plus color override">
      <FoundationText variant="title">Title 30/38</FoundationText>
      <FoundationText variant="heading">Heading 18/24</FoundationText>
      <FoundationText variant="subheading">Subheading 16/22</FoundationText>
      <FoundationText variant="body">Body 14/20</FoundationText>
      <FoundationText variant="meta">Meta 12/16</FoundationText>
      <FoundationText variant="button">Button 15/20</FoundationText>
      <FoundationText variant="body" color={tokens.colors.accent}>Body with accent color</FoundationText>
      <FoundationText variant="body" color={tokens.colors.textMuted}>Body with muted color</FoundationText>
      <FoundationText variant="body" color={tokens.colors.accent}>
        Accent parent with <FoundationText variant="body" color="inherit">color="inherit" child</FoundationText> and <FoundationText variant="body">a default child</FoundationText>
      </FoundationText>
    </Spec>

    <Spec name="IconButton" note="variant: surface | inverse, plus disabled">
      <View className="flex-row items-center gap-3">
        <IconButton name="magnify" onPress={noop} accessibilityLabel="Search" />
        <IconButton name="close" onPress={noop} variant="inverse" accessibilityLabel="Close" />
        <IconButton name="arrow-left" onPress={noop} disabled accessibilityLabel="Back, disabled" />
      </View>
    </Spec>

    <Spec name="Button" note="variant: primary | secondary | ghost | accent-text | danger | outline, size: sm | md | lg, icon + iconPosition, loading, disabled">
      <Button label="Primary sm" onPress={noop} size="sm" />
      <Button label="Primary md" onPress={noop} />
      <Button label="Primary lg" onPress={noop} size="lg" />
      <Button label="Secondary" onPress={noop} variant="secondary" />
      <Button label="Ghost" onPress={noop} variant="ghost" />
      <Button label="Change" onPress={noop} variant="accent-text" />
      <Button label="Outline" onPress={noop} variant="outline" />
      <Button label="Danger" onPress={noop} variant="danger" />
      <Button label="Icon left" onPress={noop} icon="magnify" variant="secondary" />
      <Button label="Icon right" onPress={noop} icon="arrow-left" iconPosition="right" variant="secondary" />
      <Button label="Icon danger" onPress={noop} icon="alert-circle-outline" variant="danger" />
      <Button label="Loading" onPress={noop} loading />
      <Button label="Loading secondary" onPress={noop} variant="secondary" loading />
      <Button label="Disabled" onPress={noop} disabled />
      <Button label="Disabled outline" onPress={noop} variant="outline" disabled />
    </Spec>

    <Spec name="Badge" note="variant: neutral | success | warning | danger | accent, size: sm | md, optional dot">
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge label="Neutral" />
        <Badge label="Verified" variant="success" dot />
        <Badge label="Pending" variant="warning" dot />
        <Badge label="Rejected" variant="danger" dot />
        <Badge label="Featured" variant="accent" />
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <Badge label="Small neutral" size="sm" />
        <Badge label="Small success" size="sm" variant="success" dot />
        <Badge label="Small accent" size="sm" variant="accent" />
      </View>
    </Spec>

    <Spec name="Chip" note="variant: dark | inverse | accent-dot, plus selected and disabled">
      <View className="flex-row flex-wrap gap-2">
        <Chip label="Dark" />
        <Chip label="Inverse" variant="inverse" />
        <Chip label="Available" variant="accent-dot" />
        <Chip label={chipSelected ? 'Selected' : 'Tap me'} selected={chipSelected} onPress={() => setChipSelected(v => !v)} />
        <Chip label="Disabled" disabled />
      </View>
    </Spec>

    <Spec name="Card / InverseCard" note="Card is a gradient surface, optionally pressable and bordered; InverseCard is the solid white block. No margin prop - the parent owns spacing.">
      <Card><FoundationText variant="body">Static gradient card</FoundationText></Card>
      <Card bordered={false}><FoundationText variant="body">bordered={'{false}'} - no hairline</FoundationText></Card>
      <Card onPress={noop}><FoundationText variant="body">Pressable card - scales on press</FoundationText></Card>
      <Card onPress={noop} disabled><FoundationText variant="body">Pressable card, disabled</FoundationText></Card>
      <InverseCard><FoundationText variant="body" color={tokens.colors.inverseText}>Inverse card</FoundationText></InverseCard>
    </Spec>

    <Spec name="Avatar" note="size (default 44), verified badge, optional uri with initials fallback">
      <View className="flex-row items-center gap-3">
        <Avatar name="Amina Lawal" size={32} />
        <Avatar name="Amina Lawal" />
        <Avatar name="Amina Lawal" size={64} verified />
        <Avatar name="Chukwu" size={44} verified />
      </View>
      <View className="flex-row items-center gap-3">
        <Avatar name="Photo User" uri="https://i.pravatar.cc/150?img=12" size={44} />
        <Avatar name="Photo User" uri="https://i.pravatar.cc/150?img=12" size={64} verified />
        <Avatar name="Broken Url" uri="https://example.invalid/missing.png" size={44} />
      </View>
      <FoundationText variant="meta" color={tokens.colors.textMuted}>
        Third avatar points at a dead URL - it must fall back to initials, not a blank circle.
      </FoundationText>
    </Spec>

    <Spec name="Rating" note="value, optional count, size">
      <Rating value={4.8} count={12} />
      <Rating value={3} />
      <Rating value={5} count={240} size={tokens.iconSizes.lg} />
    </Spec>

    <Spec name="Input" note="variant: dark | inverse, label, error, leftIcon, rightIcon; extends TextInputProps">
      <Input placeholder="Dark input" />
      <Input placeholder="Inverse input" variant="inverse" />
      <Input label="With label" placeholder="Trade category" />
      <Input
        label="With icons"
        placeholder="Search artisans"
        leftIcon={<Icon name="magnify" size={tokens.iconSizes.sm} color={tokens.colors.textMuted} />}
        rightIcon={<Icon name="close" size={tokens.iconSizes.sm} color={tokens.colors.textMuted} />}
      />
      <Input label="Email" placeholder="you@example.com" error="Enter a valid email address" />
      <Input placeholder="Read only" editable={false} />
      <Input placeholder="Secure entry" secureTextEntry />
    </Spec>

    <Spec name="Header" note="title, optional onBack and onAction; slots collapse to spacers">
      <Header title="With both actions" onBack={noop} onAction={noop} />
      <Header title="Back only" onBack={noop} />
      <Header title="Title only" />
    </Spec>

    <Spec name="SectionHeader" note="title, optional actionLabel + onAction">
      <SectionHeader title="Top artisans" onAction={noop} />
      <SectionHeader title="Recently viewed" actionLabel="Clear" onAction={noop} />
      <SectionHeader title="No action" />
    </Spec>

    <Spec name="ListRow" note="label, optional value, optional onPress">
      <ListRow label="Label only" />
      <ListRow label="Location" value="Keffi, Nasarawa State" />
      <ListRow label="Pressable row" value="Tap" onPress={noop} />
    </Spec>

    <Spec name="Divider" note="solid or dashed">
      <Divider />
      <Divider dashed />
    </Spec>

    <Spec name="DateChip" note="day + date, selected state">
      <View className="flex-row gap-2">
        {[['Mon', '11'], ['Tue', '12'], ['Wed', '13']].map(([day, date]) => (
          <DateChip key={date} day={day} date={date} selected={selectedDate === date} onPress={() => setSelectedDate(date)} />
        ))}
      </View>
    </Spec>

    <Spec name="Skeleton" note="width and height override the 100% x 16 default">
      <Skeleton />
      <Skeleton width="60%" />
      <Skeleton width={44} height={44} style={{ borderRadius: tokens.radii.full }} />
      <Skeleton height={96} />
    </Spec>

    <Spec name="EmptyState" note="title, optional description">
      <EmptyState title="No artisans yet" description="New verified profiles will appear here." />
      <EmptyState title="Title only" />
    </Spec>

    <Spec name="FloatingTabBar" note="tabs array, active tab expands to show its label">
      <FloatingTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { value: 'explore', label: 'Explore', icon: 'magnify' },
          { value: 'my_jobs', label: 'Jobs', icon: 'clipboard-text-outline' },
          { value: 'feed', label: 'Feed', icon: 'hammer-wrench' },
          { value: 'admin', label: 'Admin', icon: 'chart-box-outline' },
        ]}
      />
    </Spec>

    <Spec name="Sheet / Modal" note="identical props: visible, onClose, title?, style?, children. Sheet slides from the bottom, Modal fades in centred.">
      <Button label="Open sheet" onPress={() => setSheetVisible(true)} />
      <Button label="Open sheet with title" onPress={() => setTitledSheetVisible(true)} variant="secondary" />
      <Button label="Open modal" onPress={() => setModalVisible(true)} variant="secondary" />
    </Spec>

    <Spec name="ExpandableText" note="lines (default 3) + Read more / Show less. The toggle only appears when the text really overflows.">
      <ExpandableText variant="body" color={tokens.colors.textMuted} lines={3}>
        Dedicated trade professional committed to clean execution, fair pricing, punctual site attendance and quality
        workmanship for every client request. Fifteen years across residential and light commercial work, with a focus on
        plumbing diagnostics, pipe replacement and emergency callouts throughout Keffi and the wider Nasarawa State area.
      </ExpandableText>
      <ExpandableText variant="body" color={tokens.colors.textMuted} lines={3}>
        Short bio, no toggle.
      </ExpandableText>
    </Spec>

    <Spec name="ConfirmDialog" note="Modal + cancel/confirm pair. destructive renders confirm in the danger variant.">
      <Button label="Delete something" onPress={() => setConfirmVisible(true)} variant="danger" icon="alert-circle-outline" />
      <FoundationText variant="meta" color={tokens.colors.textMuted}>Last answer: {confirmResult}</FoundationText>
    </Spec>

    <Text className="mt-6 mb-10 font-jakarta text-meta text-text-muted">
      Screen is not previewed here - it owns a full-height SafeAreaView and cannot nest inside this ScrollView.
    </Text>

    <Sheet visible={sheetVisible} onClose={() => setSheetVisible(false)}>
      <FoundationText variant="heading">Untitled sheet</FoundationText>
      <FoundationText variant="body" color={tokens.colors.textMuted}>Drag handle only, no header row.</FoundationText>
      <Button label="Close" onPress={() => setSheetVisible(false)} style={{ marginTop: tokens.spacing[4] }} />
    </Sheet>

    <Sheet
      visible={titledSheetVisible}
      onClose={() => setTitledSheetVisible(false)}
      title="Titled sheet with pinned footer"
      footer={<Button label="Primary action" onPress={() => setTitledSheetVisible(false)} size="lg" />}
    >
      <FoundationText variant="body" color={tokens.colors.textMuted}>
        Fixed header, scrolling body, pinned footer. Focus the input: the footer button must stay reachable.
      </FoundationText>
      <Input label="Keyboard avoidance check" placeholder="Type here" />
      {Array.from({ length: 12 }).map((_, i) => (
        <FoundationText key={i} variant="body">Body line {i + 1} — scroll me, the header and footer stay put.</FoundationText>
      ))}
    </Sheet>

    <Modal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      title="Centred modal"
      footer={<Button label="Close" onPress={() => setModalVisible(false)} size="lg" />}
    >
      <FoundationText variant="body" color={tokens.colors.textMuted}>Same props and same three zones as Sheet.</FoundationText>
    </Modal>

    <ConfirmDialog
      visible={confirmVisible}
      title="Delete this job?"
      message="This cannot be undone. Bids already placed will be withdrawn."
      confirmLabel="Delete"
      destructive
      onCancel={() => { setConfirmVisible(false); setConfirmResult('cancelled'); }}
      onConfirm={() => { setConfirmVisible(false); setConfirmResult('confirmed'); }}
    />
  </ScrollView>
  </View>
  );
};
