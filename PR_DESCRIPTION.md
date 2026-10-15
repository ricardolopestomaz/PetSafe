# Pull Request: Redesign de Autenticação, Onboarding Mobile-Only e Correções do Sistema

## Resumo das Alterações

Este Pull Request implementa a reformulação visual e estrutural das telas de autenticação (`Login` e `Cadastro`), ajusta as regras de navegação do `Onboarding` e resolve problemas críticos de integração com o Supabase e linter do Expo.

---

### 1. Telas de Login e Cadastro (Visual Minimalista & Identidade PetSafe)
- **Fundo Amarelo com Textura Borrada**:
  - Removido o fundo branco estéril e qualquer imagem pesada de fundo.
  - Aplicada a cor amarela oficial da PetSafe (`#FEB101`) integrada a camadas de orbes com desfoque suave (*ambient blur texture*), conferindo identidade acolhedora e moderna.
- **Card Minimalista (Vercel / Relume Style)**:
  - Cards elevados com cantos arredondados (`20px`), bordas sutis (`#E5E7EB`) e sombras de alta definição.
  - Feedback de validação com banner de erro nativo diretamente no card para mensagens claras sem depender exclusivamente de alertas modais.
  - Suporte ao envio pelo teclado (`onSubmitEditing / returnKeyType="go"`).
- **Header Superior Restaurado**:
  - Barra superior limpa e sólida (fundo branco, borda `#EEEEEE`, tipografia oficial e botão de ação em pílula).
  - Remoção de transparências que causavam conflitos visuais.
- **Painéis Laterais Desktop**:
  - Painéis informativos em telas maiores (*TECNOLOGIA DE IDENTIFICAÇÃO* e *BENEFÍCIOS DA PLATAFORMA*) mantidos estritamente limpos, com ícones vetoriais (`Ionicons` e `MaterialCommunityIcons`), sem imagens desnecessárias.
- **Identidade Tipográfica sem Emojis**:
  - Remoção total de emojis em títulos, botões e tags de todo o fluxo.
  - Logo pura em texto `Pet`<span style="color: #FFB101">Safe</span> no padrão do app, sem ícones ou fotos ao lado.

---

### 2. Onboarding Mobile-Only e Navegação Manual
- **Detecção de Dispositivo (`src/lib/device.ts`)**:
  - Implementada verificação que identifica se a aplicação está rodando em aplicativo nativo (Android/iOS) ou celular/smartphone (via navegador mobile/emulação responsiva).
  - Em computadores e notebooks desktop, o onboarding é **ignorado automaticamente**, direcionando o usuário diretamente para a tela de login.
- **Transição Exclusivamente Manual**:
  - Removido o timer automático (`setInterval`). O slide agora **só avança quando o usuário clica em "Continuar"**.
  - Ao chegar no último slide e clicar em "Continuar", a navegação avança para o login.
  - Indicadores em cápsula ajustados para atuar como marcadores visuais passivos de progresso.
  - Imagens de fundo do onboarding cobrindo 100% da tela (`resizeMode="cover"`).

---

### 3. Integração com Supabase & Segurança
- Resolução do erro `Forbidden use of secret API key in browser` no cliente Supabase:
  - Implementada validação defensiva em `src/lib/supabaseClient.ts` e `src/controller/authController.ts` contra o uso indevido de chaves secretas (`sb_secret_...`) no ambiente do navegador.
  - Suporte completo e tipado ao login com e-mail/senha e Google OAuth via deep link (`useAuthDeepLink`).

---

### 4. Qualidade de Código e Linter
- Correção de alertas de hooks e renderização no React (`src/app/(tabs)/index.tsx`).
- TypeScript validado com `npx tsc --noEmit` (**0 erros**).
- Linter validado com `npx expo lint` (**0 erros e 0 avisos**).

---

### Arquivos Modificados / Criados

- `src/app/(auth)/login.tsx`: Novo design de login com fundo amarelo texturizado, card Vercel e header clássico.
- `src/app/(auth)/cadastro.tsx`: Novo design de cadastro consistente com o login.
- `src/app/(auth)/onboarding.tsx`: Bloqueio em desktop, imagens em cover total e avanço apenas no botão "Continuar".
- `src/app/index.tsx`: Roteamento inteligente baseado em sessão e dispositivo (app/celular vs notebook).
- `src/lib/device.ts`: Utilitário de detecção de app/celular vs desktop/notebook.
- `src/components/PetSafeLogo.tsx`: Componente oficial da logo em texto puro.
- `src/components/GoogleIcon.tsx`: Ícone vetorial SVG oficial do Google.
- `src/app/(tabs)/index.tsx`: Resolução de avisos de hooks e renderização.
- `src/controller/authController.ts` & `src/lib/supabaseClient.ts`: Tratamento de autenticação e validação de chaves.
