import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR, TAB_BAR_COLORS } from '../constants/tab-bar';
import type { RoleTabIconConfig } from '../constants/role-tabs';

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pillOuter: {
    alignSelf: 'stretch',
    borderRadius: TAB_BAR.radius,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: TAB_BAR.height,
    borderRadius: TAB_BAR.radius,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: TAB_BAR_COLORS.border,
    backgroundColor: TAB_BAR_COLORS.background,
    paddingHorizontal: 12,
  },
  itemPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TAB_BAR.itemGap,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: TAB_BAR.labelSize,
    letterSpacing: 0.1,
  },
});

interface AppTabBarProps extends BottomTabBarProps {
  tabIcons: Record<string, RoleTabIconConfig>;
  tabOrder: string[];
}

export function AppTabBar({
  state,
  descriptors,
  navigation,
  tabIcons,
  tabOrder,
}: AppTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => tabIcons[route.name])
    .sort((a, b) => tabOrder.indexOf(a.route.name) - tabOrder.indexOf(b.route.name));

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 4);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.pillOuter,
          {
            marginHorizontal: TAB_BAR.marginHorizontal,
            marginBottom: bottomInset + TAB_BAR.marginBottom,
          },
        ]}
      >
        <View style={styles.pill}>
          {visibleRoutes.map(({ route, index }) => {
            const icons = tabIcons[route.name]!;
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];
            const labelOption = options.tabBarLabel ?? options.title ?? route.name;
            const label = typeof labelOption === 'string' ? labelOption : route.name;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const color = isFocused ? TAB_BAR_COLORS.active : TAB_BAR_COLORS.inactive;

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                style={({ pressed }) => [
                  styles.itemPressable,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.item}>
                  <Ionicons
                    name={isFocused ? icons.filled : icons.outline}
                    size={TAB_BAR.iconSize}
                    color={color}
                  />
                  <Text
                    style={[
                      styles.label,
                      {
                        color,
                        fontWeight: isFocused ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
