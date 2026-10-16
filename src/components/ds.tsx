import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutChangeEvent,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DS } from "@/global/themes";
import { PetSafeLogo } from "@/components/PetSafeLogo";
import { LinearGradient } from "expo-linear-gradient";

const C = DS.colors;
const webTransition =
  Platform.OS === "web" ? ({ transition: "all 200ms ease-in-out" } as any) : {};

/* ------------------------------------------------------------------ */
/* Primitivos                                                          */
/* ------------------------------------------------------------------ */

/** Divisor ultrafino entre seções abertas. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

/**
 * Card de destaque vivo (azul royal) com texto branco de alto contraste.
 * Efeito 3D tilt: na web acompanha o mouse; no mobile reage ao toque (onPressIn/onPressOut).
 * Usar no máximo 1–2 por tela.
 */
const TILT_MAX = 6; // graus em rotateX/rotateY
const TILT_Z = 1.5; // graus em rotateZ
const SPRING = { stiffness: 180, damping: 14, mass: 0.8, useNativeDriver: false } as const;

export function HighlightCard({
  children,
  style,
  padding = 24,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}) {
  // px/py: posição normalizada do ponteiro (-1..1); ativo: 0..1 (escala e sombra)
  const [px] = useState(() => new Animated.Value(0));
  const [py] = useState(() => new Animated.Value(0));
  const [ativo] = useState(() => new Animated.Value(0));
  const nodeRef = useRef<View>(null);
  const tamanho = useRef({ width: 1, height: 1 });

  const inclinar = useCallback(
    (nx: number, ny: number) => {
      const x = Math.max(-1, Math.min(1, nx));
      const y = Math.max(-1, Math.min(1, ny));
      Animated.spring(px, { toValue: x, ...SPRING }).start();
      Animated.spring(py, { toValue: y, ...SPRING }).start();
      Animated.spring(ativo, { toValue: 1, ...SPRING }).start();
    },
    [px, py, ativo]
  );

  const soltar = useCallback(() => {
    Animated.spring(px, { toValue: 0, ...SPRING }).start();
    Animated.spring(py, { toValue: 0, ...SPRING }).start();
    Animated.spring(ativo, { toValue: 0, ...SPRING }).start();
  }, [px, py, ativo]);

  // Web: acompanha o mouse sobre o card
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = nodeRef.current as any;
    if (!node || typeof node.addEventListener !== "function") return;

    const mover = (e: any) => {
      const rect = node.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      inclinar(nx, ny);
    };
    node.addEventListener("pointermove", mover);
    node.addEventListener("pointerenter", mover);
    node.addEventListener("pointerleave", soltar);
    return () => {
      node.removeEventListener("pointermove", mover);
      node.removeEventListener("pointerenter", mover);
      node.removeEventListener("pointerleave", soltar);
    };
  }, [inclinar, soltar]);

  const rotateY = px.interpolate({ inputRange: [-1, 1], outputRange: [`-${TILT_MAX}deg`, `${TILT_MAX}deg`] });
  const rotateX = py.interpolate({ inputRange: [-1, 1], outputRange: [`${TILT_MAX}deg`, `-${TILT_MAX}deg`] });
  const rotateZ = px.interpolate({ inputRange: [-1, 1], outputRange: [`-${TILT_Z}deg`, `${TILT_Z}deg`] });
  const scale = ativo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const shadowOpacity = ativo.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.32] });
  const shadowRadius = ativo.interpolate({ inputRange: [0, 1], outputRange: [12, 26] });
  const elevation = ativo.interpolate({ inputRange: [0, 1], outputRange: [4, 12] });

  return (
    <Pressable
      ref={nodeRef}
      onLayout={(e: LayoutChangeEvent) => {
        tamanho.current = {
          width: Math.max(1, e.nativeEvent.layout.width),
          height: Math.max(1, e.nativeEvent.layout.height),
        };
      }}
      onPressIn={(e) => {
        if (Platform.OS === "web") return;
        const { locationX, locationY } = e.nativeEvent;
        inclinar(
          (locationX / tamanho.current.width) * 2 - 1,
          (locationY / tamanho.current.height) * 2 - 1
        );
      }}
      onPressOut={() => {
        if (Platform.OS !== "web") soltar();
      }}
    >
      <Animated.View
        style={[
          styles.highlightShadow,
          {
            shadowOpacity,
            shadowRadius,
            elevation,
            transform: [{ perspective: 1000 }, { rotateX }, { rotateY }, { rotateZ }, { scale }],
          },
        ]}
      >
        <LinearGradient
          colors={C.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.blackCard, { padding }, style]}
        >
          {children}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botão Primário Vivo (Índigo/Violeta vibrante com LinearGradient, sem cor preta).
 * Física "Squishy" elástica com Animated.spring no toque/clique (scale: 0.95),
 * pulso contínuo e sutil na sombra e reação dinâmica no ícone ao passar o mouse.
 */
export function PrimaryButton({ label, onPress, loading, disabled, iconRight, style }: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconTranslateX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const isHovered = useRef(false);

  useEffect(() => {
    // Pulso contínuo e sutil usando native driver
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 300,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isHovered.current ? 1.02 : 1,
      friction: 4,
      tension: 220,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handleHoverIn = () => {
    isHovered.current = true;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(iconTranslateX, {
        toValue: 4,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const handleHoverOut = () => {
    isHovered.current = false;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(iconTranslateX, {
        toValue: 0,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const shadowGlowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.95],
  });

  return (
    <Animated.View
      style={[
        styles.btnPrimaryWrapper,
        {
          transform: [{ scale: scaleAnim }],
        },
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.btnPrimaryGlow,
          {
            opacity: shadowGlowOpacity,
          },
        ]}
      />
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        disabled={disabled || loading}
        style={styles.btnPressableInner}
      >
        <LinearGradient
          colors={C.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btnPrimaryGradient}
        >
          {loading ? (
            <ActivityIndicator color={C.primaryText} size="small" />
          ) : (
            <>
              <Text style={styles.btnPrimaryText}>{label}</Text>
              {iconRight ? (
                <Animated.View style={{ transform: [{ translateX: iconTranslateX }] }}>
                  <Ionicons name={iconRight} size={DS.icon.sm} color={C.primaryText} />
                </Animated.View>
              ) : null}
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Secundário: contorno hairline sobre o fundo claro com física elástica
 * "Squishy" ao toque e reação contextual ao passar o mouse.
 */
export function SecondaryButton({ label, onPress, loading, disabled, icon, style }: ButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconTranslateX = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const isHovered = useRef(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 300,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: isHovered.current ? 1.015 : 1,
      friction: 4,
      tension: 220,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handleHoverIn = () => {
    isHovered.current = true;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.015,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(iconTranslateX, {
        toValue: 3,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(iconRotate, {
        toValue: 1,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const handleHoverOut = () => {
    isHovered.current = false;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(iconTranslateX, {
        toValue: 0,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(iconRotate, {
        toValue: 0,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const rotate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "12deg"],
  });

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.btn,
          styles.btnSecondary,
          webTransition,
          pressed && styles.btnPressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={C.textMuted} size="small" />
        ) : (
          <>
            {icon ? (
              <Animated.View
                style={{
                  transform: [{ translateX: iconTranslateX }, { rotate }],
                }}
              >
                {icon}
              </Animated.View>
            ) : null}
            <Text style={styles.btnSecondaryText}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Contêiner interativo com física "Squishy" (escala 0.95 ao pressionar e retorno suave com mola)
 * e micro-interação contextual do ícone interno (deslize ou leve rotação ao passar o mouse).
 */
export function SquishyPressable({
  children,
  onPress,
  disabled,
  style,
  iconAnimType = "slide",
  accessibilityLabel,
  accessibilityRole = "button",
  hitSlop,
}: {
  children: ((state: { iconStyle: any; isHovered: boolean }) => ReactNode) | ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  iconAnimType?: "slide" | "rotate" | "none";
  accessibilityLabel?: string;
  accessibilityRole?: "button";
  hitSlop?: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animValue = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 300,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: hovered ? 1.04 : 1,
      friction: 4,
      tension: 220,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  };

  const handleHoverIn = () => {
    setHovered(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.04,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(animValue, {
        toValue: 1,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const handleHoverOut = () => {
    setHovered(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.spring(animValue, {
        toValue: 0,
        friction: 5,
        tension: 250,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const iconStyle =
    iconAnimType === "slide"
      ? {
          transform: [
            {
              translateX: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 3],
              }),
            },
          ],
        }
      : iconAnimType === "rotate"
      ? {
          transform: [
            {
              rotate: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "15deg"],
              }),
            },
          ],
        }
      : {};

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        hitSlop={hitSlop}
      >
        {typeof children === "function" ? children({ iconStyle, isHovered: hovered }) : children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Bloco para animação de entrada em cascata (Staggered Fade-in com subida suave em Y).
 */
export function StaggerFadeItem({
  animValue,
  style,
  children,
}: {
  animValue: Animated.Value;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: animValue,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: ReactNode;
  labelRight?: ReactNode;
};

/** Input arredondado com foco grafite. */
export function Field({ label, icon, rightSlot, labelRight, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelRight}
      </View>
      <View style={[styles.inputBox, webTransition, focused && styles.inputBoxFocused]}>
        {icon ? (
          <Ionicons name={icon} size={DS.icon.sm} color={focused ? C.text : C.textSubtle} />
        ) : null}
        <TextInput
          {...rest}
          placeholderTextColor={C.textSubtle}
          selectionColor={C.text}
          style={[styles.input, Platform.OS === "web" && ({ outlineStyle: "none" } as any), style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {rightSlot}
      </View>
    </View>
  );
}

/** Mensagem de erro inline. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={DS.icon.sm} color={C.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

/** Cabeçalho de formulário: título + subtítulo, sem caixa. */
export function FormHeader({
  icon,
  eyebrow,
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.formHeader}>
      {icon ? (
        <View style={styles.formIcon}>
          <Ionicons name={icon} size={DS.icon.md} color={C.text} />
        </View>
      ) : null}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.formTitle}>{title}</Text>
      {subtitle ? <Text style={styles.formSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** Divisor com texto centralizado ("ou continue com e-mail"). */
export function LabeledDivider({ label }: { label: string }) {
  return (
    <View style={styles.labeledDivider}>
      <View style={styles.labeledLine} />
      <Text style={styles.labeledText}>{label}</Text>
      <View style={styles.labeledLine} />
    </View>
  );
}

/** Linha "Texto  Link" para rodapés de formulário. */
export function FooterLink({
  text,
  link,
  onPress,
  disabled,
}: {
  text: string;
  link: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText}>{text}</Text>
      <Pressable onPress={onPress} disabled={disabled} hitSlop={6}>
        <Text style={styles.footerLink}>{link}</Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Layout de autenticação                                              */
/* ------------------------------------------------------------------ */

export type PanelItem = { icon: ReactNode; title: string; description: string };

/** Painel desktop: UM card preto com lista aberta separada por hairlines. */
export function FeaturePanel({
  category,
  title,
  description,
  items,
  footer,
}: {
  category: string;
  title: string;
  description: string;
  items: PanelItem[];
  footer?: string;
}) {
  return (
    <HighlightCard padding={32} style={styles.panel}>
      <Text style={styles.panelCategory}>{category}</Text>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelDescription}>{description}</Text>

      <View style={styles.panelList}>
        {items.map((item, index) => (
          <View key={item.title} style={[styles.panelItem, index > 0 && styles.panelItemBorder]}>
            <View style={styles.panelIcon}>{item.icon}</View>
            <View style={styles.flex}>
              <Text style={styles.panelItemTitle}>{item.title}</Text>
              <Text style={styles.panelItemDesc}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {footer ? (
        <View style={styles.panelFooter}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons key={star} name="star" size={13} color="#F59E0B" />
            ))}
          </View>
          <Text style={styles.panelFooterText}>{footer}</Text>
        </View>
      ) : null}
    </HighlightCard>
  );
}

/**
 * Casca das telas de autenticação: fundo off-white, barra superior com a logo
 * original, formulário aberto (sem caixa) e, no desktop, painel preto lateral.
 */
export function AuthLayout({
  children,
  side,
  actionLabel,
  onActionPress,
  onLogoPress,
  actionDisabled,
  scroll = true,
  logoSize = "md",
}: {
  children: ReactNode;
  side?: ReactNode;
  actionLabel: string;
  onActionPress: () => void;
  onLogoPress?: () => void;
  actionDisabled?: boolean;
  scroll?: boolean;
  logoSize?: "sm" | "md" | "lg" | "xl";
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const body = (
    <View style={[styles.authWrapper, isDesktop && side ? styles.authWrapperDesktop : null]}>
      <View style={[styles.authForm, isDesktop && side ? styles.authFormDesktop : null]}>
        {children}
      </View>
      {isDesktop && side ? <View style={styles.authSide}>{side}</View> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.flex}>
        <View style={[styles.topBar, isDesktop && styles.topBarDesktop]}>
          <Pressable onPress={onLogoPress} disabled={!onLogoPress} hitSlop={6}>
            <PetSafeLogo size={logoSize} />
          </Pressable>
          <Pressable
            onPress={onActionPress}
            disabled={actionDisabled}
            hitSlop={8}
            style={({ pressed }) => [styles.topAction, pressed && styles.btnPressed]}
          >
            <Text style={styles.topActionText}>{actionLabel}</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {scroll ? (
            <ScrollView
              contentContainerStyle={styles.authScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {body}
            </ScrollView>
          ) : (
            <View style={styles.authScroll}>{body}</View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: C.bg },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.divider },

  highlightShadow: {
    borderRadius: DS.radius.xl,
    backgroundColor: C.card,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 10px 24px rgba(30, 58, 138, 0.25)" } as any)
      : {
          shadowColor: "#1E3A8A",
          shadowOffset: { width: 0, height: 10 },
        }),
  },

  blackCard: {
    backgroundColor: C.card,
    borderRadius: DS.radius.xl,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },

  btnPrimaryWrapper: {
    borderRadius: DS.radius.md,
    position: "relative",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 6px 16px rgba(79, 70, 229, 0.35)" } as any)
      : {
          shadowColor: C.primaryShadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 6,
        }),
  },
  btnPrimaryGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: DS.radius.md,
    backgroundColor: "transparent",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 8px 22px rgba(124, 58, 237, 0.45)" } as any)
      : {
          shadowColor: "#7C3AED",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 8,
        }),
  },
  btnPressableInner: {
    borderRadius: DS.radius.md,
    overflow: "hidden",
  },
  btnPrimaryGradient: {
    height: 52,
    borderRadius: DS.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
  },
  btn: {
    height: 52,
    borderRadius: DS.radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnPrimary: { backgroundColor: C.primary },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: DS.font.bold,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  btnSecondary: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  btnSecondaryText: { color: C.text, fontSize: 13, fontFamily: DS.font.semibold },
  btnPressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  btnDisabled: { opacity: 0.55 },

  field: { marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { fontSize: 12, fontFamily: DS.font.semibold, color: C.text },
  inputBox: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.field,
  },
  inputBoxFocused: { borderColor: C.ring },
  input: { flex: 1, fontSize: 14, fontFamily: DS.font.regular, color: C.text },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: C.dangerBorder,
    backgroundColor: C.dangerBg,
  },
  errorText: { flex: 1, fontSize: 12, lineHeight: 17, fontFamily: DS.font.regular, color: C.danger },

  formHeader: { marginBottom: 28 },
  formIcon: {
    width: 48,
    height: 48,
    borderRadius: DS.radius.md,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: DS.font.bold,
    color: C.textSubtle,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  formTitle: { fontSize: 28, fontFamily: DS.font.bold, color: C.text, letterSpacing: -0.8 },
  formSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    marginTop: 8,
  },

  labeledDivider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 24 },
  labeledLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.divider },
  labeledText: { fontSize: 11, fontFamily: DS.font.regular, color: C.textSubtle },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 24,
  },
  footerText: { fontSize: 13, fontFamily: DS.font.regular, color: C.textMuted },
  footerLink: { fontSize: 13, fontFamily: DS.font.bold, color: C.text },

  panel: { width: "100%" },
  panelCategory: {
    fontSize: 11,
    fontFamily: DS.font.bold,
    color: C.cardTextMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: DS.font.bold,
    fontWeight: "700",
    color: C.cardText,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  panelDescription: {
    fontSize: 13,
    lineHeight: 21,
    fontFamily: DS.font.regular,
    color: C.cardTextMuted,
  },
  panelList: { marginTop: 24 },
  panelItem: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 16 },
  panelItemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.cardBorder },
  panelIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.cardAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  panelItemTitle: { fontSize: 13, fontFamily: DS.font.bold, fontWeight: "700", color: C.cardText, marginBottom: 2 },
  panelItemDesc: { fontSize: 12, lineHeight: 18, fontFamily: DS.font.regular, color: C.cardTextMuted },
  panelFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.cardBorder,
  },
  starsRow: { flexDirection: "row", gap: 2 },
  panelFooterText: { fontSize: 12, fontFamily: DS.font.regular, color: C.cardTextMuted },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  topBarDesktop: { paddingHorizontal: 48, paddingVertical: 18 },
  topAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  topActionText: { fontSize: 12, fontFamily: DS.font.semibold, color: C.text },

  authScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  authWrapper: { width: "100%", maxWidth: 420, alignSelf: "center" },
  authWrapperDesktop: {
    maxWidth: 1080,
    flexDirection: "row",
    alignItems: "center",
    gap: 72,
  },
  authForm: { width: "100%" },
  authFormDesktop: { flex: 1, maxWidth: 420, width: undefined },
  authSide: { flex: 1, maxWidth: 520 },
});
