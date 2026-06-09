import { Bell } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useCurrentUser } from '@/features/auth/store/auth.store';
import { useNotificationsStore } from '../store/notifications.store';
import { Text } from '@/shared/components/ui/text';

interface NotificationBellProps {
  color?: string;
  size?: number;
  onPress: () => void;
}

export function NotificationBell({ color = '#fff', size = 22, onPress }: NotificationBellProps) {
  const user = useCurrentUser();
  const count = useNotificationsStore(
    (s) => (user ? s.getUnreadCount(user.uid, user.role) : 0),
  );

  return (
    <Pressable onPress={onPress} hitSlop={12} style={{ position: 'relative', padding: 2 }}>
      <Bell size={size} color={color} />
      {count > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#EF4444',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
            borderWidth: 1.5,
            borderColor: '#fff',
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', lineHeight: 12 }}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
