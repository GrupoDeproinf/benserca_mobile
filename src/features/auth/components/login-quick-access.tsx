import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import type { UserRole } from '@/shared/types';
import { loginTheme } from '../constants/login-theme';
import { Text } from '@/shared/components/ui/text';

const DEMO_ROLES: UserRole[] = [
  'picker',
  'warehouse_lead',
  'auditor',
  'supervisor_almacen',
];

const ROLE_I18N_KEY: Record<UserRole, string> = {
  picker: 'auth.loginAsPicker',
  warehouse_lead: 'auth.loginAsLead',
  auditor: 'auth.loginAsAuditor',
  supervisor_almacen: 'auth.loginAsSupervisorAlmacen',
};

interface LoginQuickAccessProps {
  onSelectRole: (role: UserRole) => void;
  disabled?: boolean;
}

export function LoginQuickAccess({ onSelectRole, disabled }: LoginQuickAccessProps) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: loginTheme.muted,
          textAlign: 'center',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {t('auth.demoAccess')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {DEMO_ROLES.map((role) => (
          <Pressable
            key={role}
            disabled={disabled}
            onPress={() => {
              Haptics.selectionAsync();
              onSelectRole(role);
            }}
            style={({ pressed }) => ({
              opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: loginTheme.inputBorder,
              backgroundColor: loginTheme.inputBg,
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: loginTheme.text }}>
              {t(ROLE_I18N_KEY[role])}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
