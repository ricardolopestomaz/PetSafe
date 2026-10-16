import React, { useCallback, useMemo, useRef } from "react";
import { Animated, Easing, Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { GoogleIcon } from "@/components/GoogleIcon";
import { SecondaryButton } from "@/components/ds";

/** Cores oficiais do Google. */
export const GOOGLE_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"] as const;

type Particle = {
  dx: number;
  dy: number;
  size: number;
  color: string;
  diamond: boolean;
  spin: number;
};

const PARTICLE_COUNT = 28;
const DURATION = 800;

function gerarParticulas(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // Distribui em círculo com leve variação aleatória para parecer orgânico
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const distance = 50 + Math.random() * 60;
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 5 + Math.random() * 5,
      color: GOOGLE_COLORS[i % GOOGLE_COLORS.length],
      diamond: i % 3 === 0,
      spin: (Math.random() > 0.5 ? 1 : -1) * (90 + Math.random() * 180),
    };
  });
}

/**
 * Explosão de partículas nas 4 cores do Google. Dispare com `ref.current?.explodir()`.
 * Usa Animated nativo: desaceleração (ease-out), gravidade leve, fade-out e scale.
 */
export type FogosHandle = { explodir: () => void };

export const GoogleFireworks = React.forwardRef<FogosHandle>(function GoogleFireworks(_, ref) {
  const [progress] = React.useState(() => new Animated.Value(0));
  const [particulas, setParticulas] = React.useState<Particle[]>(() => gerarParticulas());

  const explodir = useCallback(() => {
    setParticulas(gerarParticulas());
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [progress]);

  React.useImperativeHandle(ref, () => ({ explodir }), [explodir]);

  const opacity = progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.2, 1.1, 0.3] });
  // Gravidade: cai um pouco mais conforme o tempo passa
  const gravidade = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particulas.map((p, i) => {
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
        const translateYBase = progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${p.spin}deg`],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.diamond ? 1.5 : p.size / 2,
                backgroundColor: p.color,
                opacity,
                transform: [
                  { translateX },
                  { translateY: Animated.add(translateYBase, gravidade) },
                  { rotate: p.diamond ? rotate : "0deg" },
                  { scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
});

/**
 * Botão "Continuar com o Google" com fogos de artifício ao toque.
 * A explosão dispara no onPress, simultaneamente à função de autenticação.
 */
export function GoogleFireworksButton({
  label,
  onPress,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fogos = useRef<FogosHandle>(null);
  const ocupado = useMemo(() => Boolean(loading || disabled), [loading, disabled]);

  function aoPressionar() {
    if (ocupado) return;
    fogos.current?.explodir();
    onPress();
  }

  return (
    <View style={[styles.wrapper, style]}>
      <SecondaryButton
        label={label}
        onPress={aoPressionar}
        loading={loading}
        disabled={disabled}
        icon={<GoogleIcon size={18} />}
      />
      <GoogleFireworks ref={fogos} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "relative", zIndex: 10, overflow: "visible" },
  overlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 0,
    height: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  particle: { position: "absolute" },
});
