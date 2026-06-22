# benserca_Mobile

Plantilla de app móvil multiplataforma (iOS + Android) de **Grupo Deproinf**, construida con **Expo SDK 55**, **Expo Router v7 (Native Tabs con Liquid Glass de iOS 26)**, **React 19** y **TypeScript estricto**.

**Repositorio:** [github.com/GrupoDeproinf/template_app_reactnative](https://github.com/GrupoDeproinf/template_app_reactnative.git)

Este documento es la **fuente de verdad** para humanos y para agentes/IA que trabajen sobre el proyecto: describe **qué librería está instalada, para qué sirve, dónde se usa, y qué convenciones seguir**.

---

## Tabla de contenidos

1. [Arranque rápido](#arranque-rápido)
2. [Stack y librerías (qué y para qué)](#stack-y-librerías-qué-y-para-qué)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Navegación: Expo Router + Liquid Glass Native Tabs](#navegación-expo-router--liquid-glass-native-tabs)
5. [Theming y modo claro/oscuro](#theming-y-modo-claroscuro)
6. [Internacionalización (i18n)](#internacionalización-i18n)
7. [Estado: Zustand + TanStack Query](#estado-zustand--tanstack-query)
8. [Persistencia: MMKV + SecureStore](#persistencia-mmkv--securestore)
9. [Formularios: React Hook Form + Zod](#formularios-react-hook-form--zod)
10. [Estilos: NativeWind v4 (Tailwind)](#estilos-nativewind-v4-tailwind)
11. [Liquid Glass (iOS 26)](#liquid-glass-ios-26)
12. [Convenciones y reglas](#convenciones-y-reglas)
13. [Scripts disponibles](#scripts-disponibles)
14. [Notas sobre Windows / OneDrive](#notas-sobre-windows--onedrive)

---

## Arranque rápido

Requisitos: **Node ≥ 20**, npm.

```bash
git clone https://github.com/GrupoDeproinf/template_app_reactnative.git
cd template_app_reactnative
npm install --legacy-peer-deps
npm run start
```

> Tras clonar, puedes renombrar la carpeta local; el nombre del proyecto en código es `benserca_Mobile` (ver `app.json` y `package.json`).

- Pulsar `i` para abrir en iOS Simulator (requiere macOS + Xcode).
- Pulsar `a` para abrir en Android Emulator.
- Pulsar `w` para abrir versión web (Expo soporta web por defecto).
- Escanear QR con la app **Expo Go** del teléfono.

> **Liquid Glass nativo:** solo es visible al compilar con **Xcode 26 / iOS 26**. En versiones anteriores se renderiza la tab bar nativa clásica y los `GlassCard` caen a `BlurView`.

---

## Stack y librerías (qué y para qué)

### Núcleo

| Librería | Versión | Para qué sirve |
| --- | --- | --- |
| `expo` | `~55.0.25` | Framework principal. Gestiona build, dev server, OTA, módulos nativos. |
| `react` / `react-native` | `19.2` / `0.83.6` | UI y runtime. New Architecture (Fabric + TurboModules) habilitada por defecto. |
| `typescript` | `~5.9` | Tipado estricto. `strict: true` en `tsconfig.json`. |
| `react-compiler` | habilitado vía `experiments.reactCompiler` | Memoización automática de componentes. |

### Navegación

| Librería | Para qué sirve |
| --- | --- |
| `expo-router` (~55.0.15, v7) | File-based routing. Carpeta `app/` define rutas. Soporte para typed routes. |
| `expo-router/unstable-native-tabs` | **Tabs nativas** (`NativeTabs`) con **Liquid Glass automático en iOS 26+**. |
| `@react-navigation/native`, `bottom-tabs`, `elements` | Capa de navegación que usa Expo Router por debajo. |
| `react-native-screens` | Activa pantallas nativas (necesario para Native Tabs / Stack nativos). |
| `react-native-safe-area-context` | Maneja safe areas (notch, dynamic island). |

### Estado y datos

| Librería | Para qué sirve |
| --- | --- |
| `zustand` | Estado **cliente** global. Stores en `src/store/` y `src/features/<f>/store/`. |
| `@tanstack/react-query` | Estado **servidor** (cache, refetch, mutaciones). Provider en `src/providers/query-provider.tsx`. |
| `react-hook-form` | Manejo de formularios performante (no re-renderiza por cada tecla). |
| `zod` + `@hookform/resolvers` | Schemas y validación type-safe. Schemas en `src/features/<f>/schemas/`. |

### Persistencia

| Librería | Para qué sirve |
| --- | --- |
| `react-native-mmkv` (v3) | Storage local **~30× más rápido** que AsyncStorage. Síncrono, basado en JSI. |
| `expo-secure-store` | Storage cifrado para tokens, credenciales. Usa Keychain (iOS) / EncryptedSharedPreferences (Android). |

### UI y estilos

| Librería | Para qué sirve |
| --- | --- |
| `nativewind` v4 | **Tailwind CSS para React Native**. Permite usar `className` en componentes. |
| `tailwindcss` | Motor de Tailwind v3 (lo usa NativeWind por debajo). |
| `expo-glass-effect` | `<GlassView>` con **Liquid Glass nativo** de iOS 26+ (UIVisualEffectView). |
| `expo-blur` | `<BlurView>` fallback para iOS < 26 y Android. |
| `expo-linear-gradient` | Gradientes nativos. |
| `expo-image` | Imágenes rápidas con cache nativo (preferir sobre `<Image>` de RN). |
| `lucide-react-native` | Iconografía SVG consistente y tree-shakeable. |
| `expo-symbols` | SF Symbols nativos en iOS. |
| `@expo/vector-icons` | Iconos vectoriales (FontAwesome, Ionicons, etc.). |
| `react-native-svg` + `react-native-svg-transformer` | Permite importar `.svg` como componentes React. |
| `react-native-reanimated` v4 | Animaciones nativas en el UI thread. Worklets vía `react-native-worklets`. |
| `react-native-gesture-handler` | Gestos nativos (swipe, pan, etc.). |
| `expo-haptics` | Feedback háptico. Usado en `Button` y navegación. |

### i18n y localización

| Librería | Para qué sirve |
| --- | --- |
| `i18next` + `react-i18next` | Traducciones, interpolación, plurales. |
| `expo-localization` | Detecta idioma/timezone del dispositivo. |

### Plataforma / sistema

| Librería | Para qué sirve |
| --- | --- |
| `expo-constants` | Acceso a constantes del manifest, env público. |
| `expo-font` | Carga de fuentes custom. |
| `expo-splash-screen` | Splash screen nativa controlable desde JS. |
| `expo-status-bar` | Color/estilo de la status bar. |
| `expo-system-ui` | Color de fondo de root view (evita flashes). |
| `expo-linking` | Deep linking. |
| `expo-web-browser` | In-app browser (SFSafariViewController / Chrome Custom Tabs). |
| `expo-build-properties` | Permite tunear `deploymentTarget`, `minSdkVersion`, etc. desde `app.json`. |

### Calidad

| Librería | Para qué sirve |
| --- | --- |
| `@biomejs/biome` | Linter + formatter unificado, mucho más rápido que ESLint+Prettier. Config en `biome.json`. |
| `eslint` + `eslint-config-expo` | Mantenido como red de seguridad (Expo lo usa para algunas reglas específicas). |

---

## Estructura del proyecto

```
.
├── app/                          # Expo Router: rutas y layouts (file-based)
│   ├── _layout.tsx               # Root layout. Providers globales + lógica de protección de rutas
│   ├── +not-found.tsx            # 404
│   ├── (auth)/                   # Rutas públicas (solo re-exportan screens de src/features/auth)
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Bienvenida
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   └── (tabs)/                   # Rutas autenticadas (re-exportan home/settings)
│       ├── _layout.tsx
│       ├── index.tsx
│       └── settings.tsx
│
├── src/                          # Lógica y UI reutilizable
│   ├── features/                 # Feature-first: una carpeta por dominio
│   │   ├── auth/
│   │   │   ├── components/       # UI solo de auth (BrandMark, AuthScreenLayout…)
│   │   │   ├── constants/      # Rutas tipadas (AUTH_ROUTES)
│   │   │   ├── hooks/          # useProtectedRoute
│   │   │   ├── navigation/     # Layout del stack auth (re-export en app/)
│   │   │   ├── screens/        # Welcome, Login, ForgotPassword
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   └── store/
│   │   ├── home/
│   │   │   └── screens/
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   └── screens/
│   │   └── tabs/
│   │       └── navigation/     # NativeTabs layout
│   │
│   ├── shared/                   # Reutilizable entre features
│   │   ├── components/
│   │   │   ├── ui/               # Button, Input, Text, GlassCard
│   │   │   └── layout/           # Screen (SafeAreaView + padding base)
│   │   ├── hooks/                # Hooks compartidos
│   │   ├── utils/                # Helpers puros
│   │   ├── constants/            # Constantes globales
│   │   └── types/                # Tipos compartidos
│   │
│   ├── services/                 # Infraestructura técnica
│   │   ├── api/                  # Clientes HTTP (pendiente cuando haya backend)
│   │   └── storage/              # mmkv.ts (sync) + secure.ts (cifrado)
│   │
│   ├── store/                    # Stores globales no atados a un feature
│   │   └── settings.store.ts     # Tema, idioma
│   │
│   ├── theme/                    # Sistema de design
│   │   ├── tokens.ts             # colors, spacing, radius, typography
│   │   └── index.ts              # useTheme(), useResolvedColorScheme()
│   │
│   ├── i18n/                     # Internacionalización
│   │   ├── index.ts              # Init i18next + sync con settings store
│   │   └── locales/
│   │       ├── es.json
│   │       └── en.json
│   │
│   └── providers/                # Providers de árbol React
│       ├── app-providers.tsx     # GestureHandler + SafeArea + Query
│       └── query-provider.tsx
│
├── assets/                       # Fuentes, imágenes, iconos de la app
├── global.css                    # @tailwind directives (entrada de NativeWind)
├── tailwind.config.js            # Config Tailwind (paths + theme extend)
├── babel.config.js               # Preset Expo + NativeWind + Worklets
├── metro.config.js               # NativeWind + svg-transformer
├── biome.json                    # Lint + format
├── nativewind-env.d.ts           # Tipos de className
├── expo-env.d.ts                 # Tipos de Expo
├── tsconfig.json                 # strict + path aliases (@/* → src/*)
├── app.json                      # Manifest Expo
└── package.json
```

### Path aliases

Definidos en `tsconfig.json`:

```json
"@/*":      ["./src/*"]
"@app/*":   ["./app/*"]
"@assets/*":["./assets/*"]
```

Uso: `import { Button } from '@/shared/components/ui/button'`.

---

## Navegación: Expo Router + Liquid Glass Native Tabs

### Reglas

1. **`app/` es solo orquestación.** Las pantallas en `app/` son delgadas: importan componentes de `src/` y conectan stores/servicios. **No** poner lógica de negocio aquí.
2. **Grupos de rutas con paréntesis** `(auth)`, `(tabs)`, `(modals)` agrupan sin agregar segmento a la URL.
3. **Layouts anidados** (`_layout.tsx`) inyectan providers/UI shared para ese grupo.
4. **Protección de rutas:** `app/_layout.tsx` redirige según `useAuthStore().isAuthenticated`.

### Native Tabs con Liquid Glass (iOS 26)

`app/(tabs)/_layout.tsx` usa `NativeTabs` de `expo-router/unstable-native-tabs`. Esto renderiza la **tab bar nativa del sistema**:

- iOS 26+ → **Liquid Glass automático**.
- iOS < 26 → Tab bar iOS clásica.
- Android → Material Design 3 con dynamic colors.

Iconos por plataforma:

```tsx
<NativeTabs.Trigger.Icon
  sf={{ default: 'house', selected: 'house.fill' }}  // SF Symbols (iOS)
  md="home"                                          // Material Symbols (Android)
/>
```

Colores adaptativos al Liquid Glass:

```tsx
tintColor={DynamicColorIOS({ dark: '#FFFFFF', light: '#0A84FF' })}
```

> Liquid Glass cambia el color de fondo dinámicamente; **no se debe** colorear la tab bar con un color sólido. Usar `DynamicColorIOS` para el tint del icono seleccionado.

---

## Theming y modo claro/oscuro

- Tokens en `src/theme/tokens.ts` (colors, spacing, radius, typography).
- Preferencia persistida en `useSettingsStore` (valores: `'system' | 'light' | 'dark'`).
- Hook `useResolvedColorScheme()` resuelve la preferencia contra el sistema.
- Tailwind soporta dark mode con clase `dark:` (configurado con `darkMode: 'class'`).
- `userInterfaceStyle: "automatic"` en `app.json` para que iOS/Android respeten el sistema.

### Cómo añadir un nuevo color

1. Añadir en `src/theme/tokens.ts` bajo `colors.light` y `colors.dark`.
2. Añadir en `tailwind.config.js` (`theme.extend.colors`) si se va a usar como utility class.

---

## Internacionalización (i18n)

- Idiomas: **español (default)** e **inglés**.
- Traducciones en `src/i18n/locales/<lang>.json`.
- Init en `src/i18n/index.ts` (importado por `app-providers.tsx`).
- Cambio de idioma vía `useSettingsStore().setLanguage('en')` → subscriber sincroniza i18next automáticamente.

Uso:

```tsx
const { t } = useTranslation();
<Text>{t('home.welcome', { name: 'Manuel' })}</Text>
```

### Cómo añadir una nueva clave

1. Añadir la clave en **ambos** `es.json` y `en.json` (mismo árbol).
2. Si se añade un idioma nuevo, añadir el archivo en `locales/`, registrarlo en `resources` dentro de `src/i18n/index.ts` y agregar el código al tipo `Language` en `src/store/settings.store.ts`.

---

## Estado: Zustand + TanStack Query

### Zustand — estado cliente

- Stores **globales** en `src/store/` (ej. `settings.store.ts`).
- Stores **por feature** en `src/features/<feature>/store/`.
- Convenciones:
  - Nombre del store: `useFooStore`.
  - Persistir con `persist` middleware + `zustandMMKVStorage` cuando se necesite sobrevivir reinicios.
  - Usar selectores: `useStore((s) => s.value)` para evitar re-renders.

### TanStack Query — estado servidor

- `QueryClient` montado en `src/providers/query-provider.tsx`.
- Defaults: `staleTime: 60s`, `retry: 1`, sin refetch on focus.
- Convenciones:
  - Custom hooks `useFooQuery`, `useFooMutation` por feature.
  - Query keys como arrays: `['users', userId]`.

---

## Persistencia: MMKV + SecureStore

- **MMKV** (`src/services/storage/mmkv.ts`): datos no sensibles, settings, cache local. API síncrona.
- **SecureStore** (`src/services/storage/secure.ts`): tokens, credenciales. API async, cifrada.

```ts
// No sensible
storage.set('key', 'value');
const v = storage.getString('key');

// Sensible
await setSecureItem(secureKeys.authToken, jwt);
const jwt = await getSecureItem(secureKeys.authToken);
```

---

## Formularios: React Hook Form + Zod

- Schema en `src/features/<f>/schemas/<form>.schema.ts`.
- Tipo inferido: `type LoginFormValues = z.infer<typeof loginSchema>`.
- Resolver: `zodResolver(loginSchema)` pasado a `useForm`.
- Ejemplo completo en `app/(auth)/login.tsx`.

---

## Estilos: NativeWind v4 (Tailwind)

- Entrada CSS: `global.css` (`@tailwind base/components/utilities`).
- Importado **una sola vez** en `app/_layout.tsx`.
- Modo oscuro: `darkMode: 'class'` + componente `Screen` aplica `bg-background dark:bg-background-dark`.
- Convenciones:
  - Preferir `className` sobre `StyleSheet.create` para layout y colores.
  - Usar `StyleSheet` o `style` solo para valores dinámicos no expresables en Tailwind.
  - Componer variantes con strings condicionales (no instalar `clsx` por ahora).

### Componentes core ya creados

- `<Text>` — texto con color de foreground por defecto.
- `<Input>` — input con border + bg muted + placeholder color resuelto por scheme.
- `<Button>` — variantes `primary | secondary | ghost` + haptic feedback.
- `<GlassCard>` — superficie con Liquid Glass / Blur.
- `<Screen>` — wrapper con SafeArea + padding base.

---

## Liquid Glass (iOS 26)

Dos formas de usarlo:

### 1) Tab bar nativa con Liquid Glass

Automática en iOS 26+ vía `NativeTabs` (ver sección Navegación).

### 2) Componente reutilizable `<GlassCard>`

`src/shared/components/ui/glass-card.tsx`:

```tsx
<GlassCard className="p-6">
  <Text>Hola</Text>
</GlassCard>
```

Internamente:

- Si `Platform.OS === 'ios'` y `isLiquidGlassAvailable()` ⇒ usa `<GlassView>` (iOS 26+).
- Si no ⇒ fallback a `<BlurView>` de `expo-blur`.

> **Limitación conocida** (`expo-glass-effect`): no animar `opacity: 0` sobre el `GlassView` o sus padres. Usar los props `animate` / `animationDuration` integrados.

### Requisitos para ver Liquid Glass

- Xcode 26 (para compilar bundles iOS).
- Dispositivo / Simulator con iOS 26+.
- `app.json` ya tiene `deploymentTarget: "16.0"` (compatible). Para forzar Liquid Glass solo testear en iOS 26.

---

## Convenciones y reglas

- **TypeScript estricto.** Nunca `any`. Preferir `unknown` y narrowing.
- **Feature-first.** Una carpeta por dominio en `src/features/`. No carpetas globales por tipo (no `screens/`, no `redux/`).
- **`app/` es solo routing.** La lógica vive en `src/`.
- **Path aliases** (`@/...`) para todo. Nunca `../../../`.
- **Stores Zustand** por feature, no un store gigante.
- **Server state via TanStack Query**, nunca en Zustand.
- **i18n obligatorio** — no hardcodear strings visibles al usuario.
- **No instalar** librerías clásicas redundantes (Redux, AsyncStorage, styled-components, Axios solo si justificado).
- **Componentes de UI** copy-paste antes que dependencias pesadas (estilo Reusables/shadcn).
- **Iconos**: preferir `lucide-react-native` para iconos custom y `sf=`/`md=` para tab/navigation icons.
- **Haptics** en acciones primarias (login, navegación principal).
- **Lint/format**: `npm run lint:fix` antes de cada commit.

---

## Scripts disponibles

| Script | Comando | Descripción |
| --- | --- | --- |
| `npm run start` | `expo start` | Arranca Metro + abre el panel interactivo. |
| `npm run ios` | `expo start --ios` | Arranca y abre iOS Simulator (macOS). |
| `npm run android` | `expo start --android` | Arranca y abre Android Emulator. |
| `npm run web` | `expo start --web` | Versión web (Expo soporta web vía react-native-web). |
| `npm run prebuild` | `expo prebuild` | Genera carpetas nativas `ios/` y `android/` (solo si necesitas modificarlas). |
| `npm run typecheck` | `tsc --noEmit` | Validación TypeScript estricta. |
| `npm run lint` | `biome check .` | Lint + format check. |
| `npm run lint:fix` | `biome check --write .` | Aplica fixes automáticos. |
| `npm run format` | `biome format --write .` | Solo formatear. |

---

## Metro se cierra al guardar (NativeWind + Expo 55)

Si al editar archivos Metro falla con `Cannot read properties of undefined (reading 'addedFiles')`, es un bug conocido de `react-native-css-interop@0.2.4` con Metro 0.83+.

El proyecto aplica un parche automático en `npm install` (`scripts/patch-nativewind-metro.js`).

```bash
# Tras clonar o si el error vuelve:
npm install --legacy-peer-deps
npm run start:clear
```

No es un fallo de tu código de pantallas; ocurre cuando Tailwind regenera estilos en caliente.

---

## Notas sobre Windows / OneDrive

- El proyecto está en una ruta de **OneDrive**. Esto puede causar:
  - Warnings de file watchers en Metro.
  - Conflictos de sincronización si OneDrive está pausando archivos.
- Si aparecen errores de `EBUSY` o file lock al hacer `npm install`, pausar la sincronización de OneDrive y reintentar.
- Usar `npm install --legacy-peer-deps` cuando se actualicen dependencias (necesario por `react-native-reanimated` peer constraint con React Native 0.83).
- iOS solo se puede compilar nativamente desde macOS. En Windows usar **Expo Go** sobre dispositivo físico o **EAS Build** en la nube para iOS.

---

## Para agentes / IA

### Identidad del proyecto

| Campo | Valor |
| --- | --- |
| Nombre del proyecto | `benserca_Mobile` |
| Paquete npm | `benserca_mobile` |
| Repositorio Git | `https://github.com/GrupoDeproinf/template_app_reactnative.git` |
| Organización | GrupoDeproinf |
| Bundle ID (iOS/Android) | `com.benserca.app` |
| Deep link scheme | `benserca_mobile` |

### Inventario de capacidades disponibles (resumen ejecutable)

```text
NAVIGATION:
  - expo-router v7 (file-based)
  - NativeTabs (iOS 26 Liquid Glass)
  - Stack, Modal presentations

STATE:
  - zustand (cliente, con persist+MMKV)
  - @tanstack/react-query (servidor)

FORMS:
  - react-hook-form + zod (@hookform/resolvers)

STORAGE:
  - react-native-mmkv (sync, fast)
  - expo-secure-store (cifrado)

STYLING:
  - NativeWind v4 (Tailwind)
  - className en todos los componentes RN

UI EFFECTS:
  - expo-glass-effect (iOS 26 Liquid Glass)
  - expo-blur (fallback)
  - expo-linear-gradient
  - react-native-reanimated v4
  - react-native-gesture-handler
  - expo-haptics

ICONS:
  - lucide-react-native (Lucide)
  - expo-symbols (SF Symbols nativo iOS)
  - @expo/vector-icons

i18n:
  - i18next + react-i18next + expo-localization
  - idiomas: es (default), en

IMAGES:
  - expo-image (preferir sobre <Image/>)

PLATFORM:
  - New Architecture ON
  - React Compiler ON
  - TypeScript strict ON
  - Typed Routes ON

NOT INSTALLED (no agregar sin justificación):
  - Redux / Redux Toolkit (usar Zustand)
  - AsyncStorage (usar MMKV)
  - Axios (usar fetch o ky cuando llegue backend)
  - styled-components / Emotion / Tamagui (usar NativeWind)
  - moment.js (usar Date nativo + Intl o date-fns si hace falta)
```

### Reglas de oro al modificar el proyecto

1. **Nunca** poner lógica de negocio en `app/`. Mover a `src/features/<f>/`.
2. **Nunca** hardcodear strings de UI. Usar `t('namespace.key')` con clave en `es.json` y `en.json`.
3. **Nunca** usar `../../../` en imports. Usar `@/...`.
4. **Nunca** instalar `axios` si solo se necesitan llamadas REST básicas.
5. **Nunca** instalar `@react-native-async-storage/async-storage`. Usar `react-native-mmkv`.
6. **Nunca** crear archivos `.tsx` en `components/` o `hooks/` en la raíz. Esa estructura del template original fue removida.
7. **Siempre** que se cree un componente UI reusable, ponerlo en `src/shared/components/ui/`.
8. **Siempre** que se cree un store, persistir solo lo necesario con `partialize`.
9. **Siempre** crear el schema Zod antes que el formulario.
10. **Liquid Glass:** usar `GlassCard` o `NativeTabs` antes que componer manualmente con `BlurView`.
