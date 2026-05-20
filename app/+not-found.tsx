import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/shared/components/layout/screen';
import { Text } from '@/shared/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <Screen>
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-2xl font-bold">Pantalla no encontrada</Text>
          <Link href="/" className="text-primary text-base">
            Volver al inicio
          </Link>
        </View>
      </Screen>
    </>
  );
}
