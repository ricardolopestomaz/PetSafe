# Pull Request: Recursos do Mapa Interativo, Contraste AAA, Física 3D Tilt, Modo Imersivo e Redesign Visual

## Resumo das Alterações

Este Pull Request consolida as melhorias visuais, interativas e estruturais na branch `feature/maps`, com foco em acessibilidade máxima (AAA), interatividade física 3D, modo imersivo mobile, padronização tipográfica e novos ícones SVG para o mapa de escaneamentos.

---

### 1. Contraste Máximo do Card (Padrão AAA de Acessibilidade)
- **Paleta com Profundidade Real**:
  - Cards ativos e de destaque agora usam fundo em Azul Royal/Índigo profundo (`#1D4ED8` a `#1E40AF` com LinearGradient), eliminando contrastes fracos ou lavados.
  - **Títulos e Textos Principais**: Branco puro (`#FFFFFF`) com `fontFamily: 'Poppins_700Bold'` e `fontWeight: '700'`.
  - **Subtítulos e Textos Secundários**: Branco de altíssima opacidade (`rgba(255, 255, 255, 0.92)` ou `#F1F5F9`).
  - **Mini-containers de Badges e Ícones (`CardBadgeContainer`)**: Fundo translúcido `rgba(255, 255, 255, 0.2)` com borda suave `rgba(255, 255, 255, 0.28)` para destacar ícones e badges perfeitamente do fundo escuro.

---

### 2. Efeito de Inclinação Física 3D (3D Tilt Effect)
- **Componente Reutilizável `TiltCard`**:
  - Interação física tridimensional usando `Animated` e propriedades de transformação:
    `transform: [{ perspective: 1000 }, { rotateX }, { rotateY }, { rotateZ }, { scale }]`.
  - **Na Web (Mouse)**: Acompanha suavemente o movimento do cursor com rotações dinâmicas (`rotateY` entre `-6deg` e `6deg`, `rotateZ` leve de `-1.5deg` e `scale: 1.02`), além de sombra projetada que ganha profundidade.
  - **No Mobile (Toque)**: Reage instantaneamente ao toque com `onPressIn` e `onPressOut` através de mola física elástica (`Animated.spring`).
  - **Onde é aplicado**: Ao Card do Pet (`src/app/pet/[id].tsx`) e ao Banner de Acesso ao Mapa (`src/app/(tabs)/index.tsx`).
  - **Cards no Mapa**: O efeito 3D Tilt foi removido dos cards do carrossel no mapa (`PetMap.web.tsx` e `PetMap.native.tsx`) para garantir rolagem horizontal fluida e livre de rotações 3D, preservando o contraste AAA com LinearGradient e toque responsivo.

---

### 3. Modo Imersivo Mobile (Ocultação dos Botões Virtuais do Celular)
- **Integração com `expo-navigation-bar`**:
  - Configurado modo imersivo sticky (`"androidNavigationBar": { "visible": "sticky-immersive" }` no `app.json`).
  - Chamada em `src/app/_layout.tsx` a `NavigationBar.setVisibilityAsync("hidden")` no Android para que os botões de voltar/home/recentes fiquem recolhidos, proporcionando uma experiência de tela cheia sem que botões do sistema fiquem sobrepostos à interface do app.

---

### 4. Padronização das Fontes no Mapa (Poppins)
- **Tipografia Unificada**:
  - Registrado `Poppins_500Medium` no `useFonts` em `_layout.tsx`, cobrindo as variantes Regular (400), Medium (500), SemiBold (600) e Bold (700).
  - No iframe do mapa Web (`Leaflet`), adicionada a importação de Google Fonts para Poppins e aplicada regra CSS global `font-family: 'Poppins', sans-serif;`, eliminando fallbacks de fontes genéricas nos balões de popup e marcadores do mapa.

---

### 5. Novos Ícones Vetoriais SVG de Pets (`PetIcons.tsx`)
- Substituição de emojis por ícones vetoriais SVG nítidos e personalizáveis:
  - **Cachorro**: Ilustração vetorial completa em SVG com camadas de sombra e focinho, com os **olhos abertos, redondos e amigáveis** (corrigido para não ficarem fechados/em piscar).
  - **Gato**: Ilustração vetorial em SVG fiel aos traços geométricos modernos.
  - **Pata / Genérico**: SVG de pegada estilizada.
  - Componente inteligente `PetIconBySpecies` que detecta a espécie do pet e renderiza o ícone SVG correspondente com suporte a fallback de cores.

---

### 6. Qualidade & Validação
- **TypeScript**: `npx tsc --noEmit` executado com sucesso (**0 erros**).
- **Branch**: `feature/maps` atualizada e sincronizada com o repositório remoto.
