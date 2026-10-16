import { Platform } from "react-native";

/**
 * Identifica se a aplicação está rodando no APP nativo ou em um CELULAR (smartphone).
 * Retorna `false` para notebooks, computadores e navegadores desktop normais.
 */
export function isAppOrMobileDevice(): boolean {
  // 1. Se for aplicativo nativo (iOS / Android instalado), é com certeza APP / Celular
  if (Platform.OS !== "web") {
    return true;
  }

  // 2. Se for Web no navegador:
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    const ua = navigator.userAgent || "";

    // Identifica se o User-Agent é de celular (Android, iPhone, etc.)
    const isMobileUA =
      /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(
        ua
      );

    if (isMobileUA) {
      return true;
    }

    // Se estiver em SO Desktop (Windows, Mac, Linux):
    // Só é considerado celular se o desenvolvedor estiver simulando celular (< 600px de largura)
    const isDesktopOS = /Windows NT|Macintosh|Mac OS X|X11|Linux x86_64/i.test(ua);
    if (isDesktopOS) {
      const width = window.innerWidth || 0;
      return width > 0 && width < 600;
    }

    // Touchscreen com tela pequena
    const isTouch = (navigator.maxTouchPoints || 0) > 1;
    const screenWidth = window.screen?.width || window.innerWidth || 0;
    if (isTouch && screenWidth < 768) {
      return true;
    }
  }

  return false;
}
