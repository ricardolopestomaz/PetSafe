import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { DS } from '@/global/themes';
import { HighlightCard } from '@/components/ds';

const C = DS.colors;

export default function PetDetails() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={DS.icon.md} color={C.text} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <HighlightCard style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="paw" size={28} color={C.cardText} />
          </View>
          <Text style={styles.text}>Pet Details para ID: {id}</Text>
        </HighlightCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  card: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    fontFamily: DS.font.semibold,
    color: C.cardText,
  },
});
