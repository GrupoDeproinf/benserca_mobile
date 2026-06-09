import { StyleSheet, View } from 'react-native';

export function LoginBackdrop() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.backdrop]} pointerEvents="none">
      <View className="absolute -right-28 top-12 h-72 w-72 rounded-full bg-white/5" />
      <View className="absolute -left-20 top-32 h-52 w-52 rounded-full bg-white/3" />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#000000',
  },
});
