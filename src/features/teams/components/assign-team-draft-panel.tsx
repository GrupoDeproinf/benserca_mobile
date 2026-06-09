import * as Haptics from 'expo-haptics';
import { UserPlus, Users2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PickerEstado } from '@/features/warehouse/types';

interface AssignTeamDraftPanelProps {
  pickers: PickerEstado[];
  onRemove: (uid: string) => void;
}

function firstName(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

/** Panel fijo que muestra el equipo en construcción. */
export function AssignTeamDraftPanel({ pickers, onRemove }: AssignTeamDraftPanelProps) {
  const { t } = useTranslation();
  const isEmpty = pickers.length === 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Users2 size={18} color="#111827" strokeWidth={2.2} />
          <Text style={styles.title}>{t('teams.assign.yourTeam')}</Text>
        </View>
        <View style={[styles.countBadge, isEmpty && styles.countBadgeEmpty]}>
          <Text style={[styles.countText, isEmpty && styles.countTextEmpty]}>
            {pickers.length}
          </Text>
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <UserPlus size={22} color="#9CA3AF" strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>{t('teams.assign.emptyTeam')}</Text>
          <Text style={styles.emptyHint}>{t('teams.assign.emptyTeamHint')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.membersRow}>
            {pickers.map((picker) => {
              const initial = picker.nombre.charAt(0).toUpperCase();
              return (
                <Pressable
                  key={picker.uid}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onRemove(picker.uid);
                  }}
                  style={({ pressed }) => [styles.memberSlot, pressed && { opacity: 0.85 }]}
                  accessibilityLabel={t('common.remove')}
                >
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{initial}</Text>
                    <View style={styles.removeBadge}>
                      <X size={10} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {firstName(picker.nombre)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>{t('teams.assign.tapToRemove')}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeEmpty: {
    backgroundColor: '#F2F2F7',
  },
  countText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  countTextEmpty: {
    color: '#9CA3AF',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 4,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  emptyHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 4,
  },
  memberSlot: {
    alignItems: 'center',
    width: 72,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  removeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center',
  },
});
