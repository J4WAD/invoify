# FacturApp — Plan de Corrections & Améliorations

> **Destinataire :** Claude Code CLI  
> **Auteur :** Djaouad Azzouz / SiferOne  
> **Date :** 2026-04-22  
> **Priorité :** Haute — issues bloquantes en production

---

## Vue d'ensemble des 6 issues

| # | Issue | Impact | Effort estimé |
|---|---|---|---|
| 1 | Supprimer le dark mode | UX / Cohérence visuelle | Moyen |
| 2 | Remplacer `#2563eb` par un bleu foncé | Branding | Faible |
| 3 | Écran de chargement au login | UX | Faible |
| 4 | Pages vides avec erreur HTTP 401 | **Bloquant** | Élevé |
| 5 | Données settings non chargées dans les factures | **Bloquant** | Moyen |
| 6 | Créer un second utilisateur | Fonctionnel | Documentation |

---

## Issue 1 — Supprimer le Dark Mode

### Diagnostic

Le dark mode est implémenté avec `next-themes` + Tailwind `darkMode: ["class"]`. Il s'active via :
- `contexts/ThemeProvider.tsx` — wraps l'app avec `ThemeProvider`
- `app/components/reusables/ThemeSwitcher.tsx` — bouton Soleil/Lune dans la navbar
- `app/globals.css` — variables CSS `.dark { ... }`
- Classes `dark:` partout dans les composants (ex. `dark:bg-slate-800`)

### Plan d'action

**Étape 1 — Forcer le thème clair dans ThemeProvider**

Fichier : `contexts/ThemeProvider.tsx`

```tsx
// AVANT
<NextThemesProvider attribute="class" defaultTheme="system" enableSystem>

// APRÈS — forcer le thème clair, désactiver le système
<NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
```

**Étape 2 — Supprimer le ThemeSwitcher de la Navbar**

Fichier : `app/components/layout/Navbar.tsx` (ou similaire)

- Supprimer l'import de `ThemeSwitcher`
- Supprimer le composant `<ThemeSwitcher />` du JSX
- Le fichier `ThemeSwitcher.tsx` peut rester mais ne doit plus être utilisé

**Étape 3 — Supprimer les variables CSS dark dans globals.css**

Fichier : `app/globals.css`

- Supprimer le bloc `.dark { ... }` entier
- Garder uniquement les variables `:root { ... }` (thème clair)

**Étape 4 — Nettoyer les classes `dark:` dans Tailwind**

Faire un `grep -r "dark:" app/` pour lister tous les fichiers concernés. Pour chaque occurrence :

- `dark:bg-slate-800` → supprimer la classe `dark:` (garder `bg-slate-100`)
- `dark:text-white` → supprimer (garder la couleur light)
- `dark:-rotate-90` dans ThemeSwitcher → fichier non utilisé, ignorer

**Étape 5 — Tailwind config (optionnel mais propre)**

Fichier : `tailwind.config.js`

```js
// Peut rester comme ça ou supprimer la ligne darkMode
// Aucun impact si les classes dark: sont retirées des composants
darkMode: ["class"], // <- laisser tel quel suffit si les classes sont retirées
```

**Étape 6 — Body layout**

Fichier : `app/[locale]/layout.tsx`

```tsx
// AVANT
<body className="bg-slate-100 dark:bg-slate-800">

// APRÈS
<body className="bg-slate-100">
```

### Fichiers à modifier
- `contexts/ThemeProvider.tsx`
- `app/[locale]/layout.tsx`
- `app/globals.css`
- `app/components/layout/Navbar.tsx` (retirer ThemeSwitcher)
- Tous les fichiers contenant des classes `dark:` (lancer un grep)

---

## Issue 2 — Remplacer `#2563eb` par un Bleu Foncé

### Diagnostic

`#2563eb` est le bleu primaire de l'app (Tailwind blue-600). Il apparaît dans :

| Fichier | Rôle |
|---|---|
| `app/[locale]/auth/login/page.tsx` | Titre + bouton login |
| `app/[locale]/auth/setup/page.tsx` | Titre + bouton setup |
| `app/[locale]/auth/forgot/page.tsx` | Titre + bouton |
| `app/[locale]/auth/reset/page.tsx` | Titre + bouton |
| `app/components/modals/settings/tabs/BrandingTab.tsx` | Preset de couleur #1 |
| `contexts/InvoiceContext.tsx` | Fallback brandColor (x2) |
| `app/[locale]/layout.tsx` | `viewport.themeColor` |

### Couleur cible recommandée

Utiliser `#1e3a8a` (Tailwind **blue-900**) — un bleu marine professionnel, déjà dans le spectre des couleurs sombres Tailwind.

> ⚠️ **Action requise :** Confirmer la couleur exacte souhaitée avec Djaouad avant d'exécuter. Options :
> - `#1e3a8a` — Bleu marine (blue-900)
> - `#1e40af` — Bleu foncé (blue-800)
> - `#1d4ed8` — Bleu royal (blue-700)

### Plan d'action

**Étape 1 — Recherche globale et remplacement**

```bash
# Trouver toutes les occurrences
grep -r "#2563eb" app/ contexts/ lib/ --include="*.tsx" --include="*.ts" --include="*.css"

# Remplacer (exemple avec blue-900)
# Faire un Find & Replace global dans l'IDE :
# Chercher  : #2563eb
# Remplacer : #1e3a8a
```

**Étape 2 — Mettre à jour le preset BrandingTab**

Fichier : `app/components/modals/settings/tabs/BrandingTab.tsx`

```tsx
// AVANT
const PRESET_COLORS = ["#2563eb", "#dc2626", ...]

// APRÈS
const PRESET_COLORS = ["#1e3a8a", "#dc2626", ...]
```

**Étape 3 — Mettre à jour InvoiceContext (fallback)**

Fichier : `contexts/InvoiceContext.tsx`

```tsx
// AVANT (x2 occurrences)
brandColor: branding.brandColor || "#2563eb"

// APRÈS
brandColor: branding.brandColor || "#1e3a8a"
```

**Étape 4 — FORM_DEFAULT_VALUES**

Fichier : `lib/variables.ts`

```tsx
// Vérifier et mettre à jour le brandColor par défaut
brandColor: "#1e3a8a",
```

**Étape 5 — Viewport theme color**

Fichier : `app/[locale]/layout.tsx`

```tsx
// AVANT
themeColor: "#2563eb"

// APRÈS
themeColor: "#1e3a8a"
```

---

## Issue 3 — Écran de Chargement au Login

### Diagnostic

Actuellement, lors de l'authentification :
- `login/page.tsx` — le bouton change de texte mais pas de spinner
- Pages protégées (dashboard, etc.) — affichent `null` pendant le check → écran **blanc**
- Aucun spinner global de transition

### Plan d'action

**Étape 1 — Créer un composant `LoadingScreen`**

Fichier à créer : `app/components/reusables/LoadingScreen.tsx`

```tsx
// Spinner centré plein écran, avec branding FacturApp
export default function LoadingScreen({ message = "Chargement…" }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#1e3a8a]" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
```

**Étape 2 — Remplacer les `return null` sur les pages protégées**

Chercher `if (checking) return null` dans :
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/invoices/page.tsx`
- `app/[locale]/clients/page.tsx`
- Tous les autres fichiers ayant ce pattern

```tsx
// AVANT
if (checking) return null;

// APRÈS
import LoadingScreen from "@/app/components/reusables/LoadingScreen";
if (checking) return <LoadingScreen message="Vérification de la session…" />;
```

**Étape 3 — Ajouter un spinner au bouton de login**

Fichier : `app/[locale]/auth/login/page.tsx`

```tsx
// Dans le bouton submit, utiliser BaseButton avec loading
<BaseButton
  type="submit"
  loading={loading}
  loadingText="Connexion en cours…"
  style={{ backgroundColor: "#1e3a8a" }}
>
  Se connecter
</BaseButton>
```

**Étape 4 — Exporter le composant**

Fichier : `app/components/index.ts`

```tsx
export { default as LoadingScreen } from "./reusables/LoadingScreen";
```

---

## Issue 4 — Pages vides : Erreur HTTP 401

### Diagnostic

Les pages **Tableau de bord**, **Clients**, et **Factures** affichent :
> `Erreur: HTTP 401 — connectez-vous pour voir vos factures.`

Cela indique que les appels API échouent avec une réponse 401 (non autorisé). Causes possibles et investigations à faire :

### Causes probables (par ordre de priorité)

**Cause A — Variables d'environnement manquantes ou incorrectes**

Le middleware de NextAuth a besoin de `AUTH_SECRET`. Sans lui, les sessions JWT ne peuvent pas être validées.

```bash
# Vérifier que .env.local contient :
AUTH_SECRET=<une_longue_chaine_aleatoire_32+_chars>
DATABASE_URL=postgresql://...
```

**Cause B — Base de données non connectée / migrations non appliquées**

Si Prisma ne peut pas se connecter à PostgreSQL, toute validation de session échoue.

```bash
# Vérifier la connexion DB
npx prisma db push
# ou
npx prisma migrate dev

# Vérifier que la DB est accessible
npx prisma studio
```

**Cause C — Session cookie non envoyé avec les requêtes fetch**

Les appels `fetch('/api/...')` dans les composants client doivent inclure les cookies.

Fichier : `app/[locale]/dashboard/page.tsx`

```tsx
// AVANT (potentiellement)
const res = await fetch('/api/invoices?perPage=100');

// APRÈS — forcer l'envoi des cookies de session
const res = await fetch('/api/invoices?perPage=100', {
  credentials: 'include',
  cache: 'no-store',
});
```

Vérifier et corriger dans :
- `app/[locale]/dashboard/page.tsx`
- `app/components/clients/ClientsManager.tsx`
- `app/components/invoice/dashboard/InvoiceDashboard.tsx` (si appels API)

**Cause D — Middleware bloquant les requêtes API**

Fichier : `middleware.ts`

```tsx
// Vérifier que les routes API sont correctement gérées
// Les routes /api/invoices, /api/clients doivent passer par l'auth check
// et retourner 401 proprement, pas rediriger vers login
```

### Plan de correction étape par étape

**Étape 1 — Audit des variables d'environnement**

```bash
# Créer .env.local s'il n'existe pas
cp .env.example .env.local

# Variables obligatoires :
AUTH_SECRET=<générer avec: openssl rand -base64 32>
DATABASE_URL=postgresql://user:password@localhost:5432/facturapp
NEXTAUTH_URL=http://localhost:3000
```

**Étape 2 — Vérifier et appliquer les migrations Prisma**

```bash
npx prisma generate
npx prisma db push
```

**Étape 3 — Corriger les appels fetch dans Dashboard**

Fichier : `app/[locale]/dashboard/page.tsx`

```tsx
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices?perPage=100', {
        credentials: 'include',  // ← AJOUTER
        cache: 'no-store',       // ← AJOUTER
      });
      
      if (res.status === 401) {
        // Rediriger vers login plutôt qu'afficher erreur
        router.push('/fr/auth/login');
        return;
      }
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

**Étape 4 — Corriger les appels dans ClientsManager**

Fichier : `app/components/clients/ClientsManager.tsx`

Même correction : ajouter `credentials: 'include'` à tous les `fetch()`.

**Étape 5 — Améliorer les messages d'erreur 401**

Dans tous les composants, intercepter le 401 et rediriger proprement :

```tsx
if (res.status === 401) {
  router.push(`/${locale}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
  return;
}
```

**Étape 6 — Vérifier les API routes (côté serveur)**

Dans `/api/invoices/route.ts`, `/api/clients/route.ts` :

```tsx
// S'assurer que l'auth check est correct
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
}
```

### Debug rapide

```bash
# Tester l'API directement avec curl (avec cookie de session)
# 1. Se connecter via le browser, copier le cookie de session
# 2. Tester :
curl -H "Cookie: authjs.session-token=<token>" http://localhost:3000/api/invoices

# Vérifier les logs Next.js
npm run dev  # Observer les erreurs dans le terminal
```

---

## Issue 5 — Données Settings non chargées dans les Factures

### Diagnostic

Quand l'utilisateur crée une nouvelle facture, les données du profil (nom de l'entreprise, adresse, logo, couleur, etc.) devraient pré-remplir le formulaire. La fonction `newInvoice()` dans `InvoiceContext.tsx` lit depuis `ProfileContext`, mais il y a un **problème de timing** :

- `ProfileContext` charge les données depuis le localStorage (rapide) ET depuis la DB (asynchrone)
- Si `newInvoice()` est appelé avant que la DB réponde, les valeurs par défaut sont utilisées
- De plus, si la DB et le localStorage sont désynchronisés, les données affichées sont incohètes

### Plan d'action

**Étape 1 — Auditer ProfileContext**

Fichier : `contexts/ProfileContext.tsx` (ou `Providers.tsx`)

```tsx
// Vérifier que le chargement depuis DB est correctement awaité
// et que les données DB priment sur localStorage en cas de conflit

useEffect(() => {
  const loadProfile = async () => {
    // 1. Charger immédiatement depuis localStorage (UX)
    const localData = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
    if (localData) setProfile(JSON.parse(localData));
    
    // 2. Charger depuis la DB (source de vérité)
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (res.ok) {
        const dbProfile = await res.json();
        // DB prime sur localStorage
        setProfile(dbProfile);
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(dbProfile));
      }
    } catch (e) {
      console.error('Profile DB load failed, using localStorage', e);
    } finally {
      setProfileLoaded(true); // ← Signal que le profil est prêt
    }
  };
  loadProfile();
}, []);
```

**Étape 2 — Ajouter un état `profileLoaded` dans ProfileContext**

```tsx
// Dans ProfileContext
const [profileLoaded, setProfileLoaded] = useState(false);

// Exposer dans le context value
return (
  <ProfileContext.Provider value={{ profile, setProfile, profileLoaded }}>
    {children}
  </ProfileContext.Provider>
);
```

**Étape 3 — Attendre que le profil soit chargé avant `newInvoice()`**

Fichier : `app/page.tsx` ou le composant qui appelle `newInvoice()`

```tsx
const { profileLoaded } = useProfileContext();
const { newInvoice } = useInvoiceContext();

useEffect(() => {
  if (profileLoaded) {
    newInvoice(); // Appeler seulement quand profil est prêt
  }
}, [profileLoaded]);
```

**Étape 4 — Créer l'API route `/api/profile` si elle n'existe pas**

Si le profil n'est sauvegardé que dans localStorage et pas en DB, les données sont perdues si l'utilisateur change de navigateur/appareil.

```typescript
// app/api/profile/route.ts

// GET — récupérer le profil
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id }
  });
  
  return NextResponse.json(profile || {});
}

// PATCH — sauvegarder le profil
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });
  
  const data = await req.json();
  
  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { ...data, userId: session.user.id },
  });
  
  return NextResponse.json(profile);
}
```

**Étape 5 — Synchroniser les changements Settings → DB**

Dans `SettingsModal.tsx`, à chaque sauvegarde de tab :

```tsx
// AVANT — sauvegarde localStorage seulement
localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));

// APRÈS — localStorage + DB
localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
await fetch('/api/profile', {
  method: 'PATCH',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updatedProfile),
});
```

**Étape 6 — Vérifier les champs spécifiques dans `newInvoice()`**

Fichier : `contexts/InvoiceContext.tsx`

```tsx
const newInvoice = useCallback(() => {
  const { businessInfo, branding, invoiceDefaults, paymentInfo } = profile;
  
  reset({
    ...FORM_DEFAULT_VALUES,
    sender: {
      name: businessInfo?.name || "",
      address: businessInfo?.address || "",
      city: businessInfo?.city || "",
      country: businessInfo?.country || "",
      email: businessInfo?.email || "",
      phone: businessInfo?.phone || "",
      // Ajouter tous les champs manquants
    },
    details: {
      ...FORM_DEFAULT_VALUES.details,
      currency: invoiceDefaults?.currency || "DZD",
      language: invoiceDefaults?.language || "fr",
      brandColor: branding?.brandColor || "#1e3a8a",
      logo: branding?.logo || "",
    },
    paymentInformation: {
      bankName: paymentInfo?.bankName || "",
      accountName: paymentInfo?.accountName || "",
      accountNumber: paymentInfo?.accountNumber || "",
    },
  });
}, [profile, reset]);
```

---

## Issue 6 — Créer un Second Utilisateur

### Système existant

FacturApp supporte déjà le **multi-utilisateurs** avec isolation des données. Voici le flux existant :

### Via l'interface (méthode normale)

1. Se connecter avec le compte **admin**
2. Aller dans **Paramètres** (icône ⚙️)
3. Cliquer sur l'onglet **Utilisateurs / Compte**
4. Section **"Ajouter un utilisateur"** (visible admin uniquement)
5. Remplir : Nom d'utilisateur, Mot de passe (min 6 caractères), Rôle (ADMIN ou USER)
6. Cliquer **Créer**

> ℹ️ Le nouveau compte dispose de son propre profil, ses propres factures et ses propres clients — isolation complète par `userId`.

### Via l'API (méthode programmatique)

```bash
# Créer un utilisateur via API (nécessite session admin)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=<token>" \
  -d '{"username": "marie", "password": "motdepasse123", "role": "USER"}'
```

### Via Prisma Studio (méthode développeur)

```bash
npx prisma studio
# Ouvrir http://localhost:5555
# Naviguer vers table "User"
# Cliquer "Add record"
# Remplir les champs (passwordHash doit être généré avec bcrypt rounds 12)
```

### Limitations actuelles & améliorations suggérées

| Limitation | Solution suggérée |
|---|---|
| Pas d'email de bienvenue automatique | Ajouter envoi via Resend API après création |
| Pas de réinitialisation de mot de passe admin | Ajouter UI dans UsersTab pour forcer reset |
| Rôle USER ne peut pas voir factures des autres | C'est voulu (isolation), mais documenter |
| Pas de liste de tous les utilisateurs pour USER | Normal, seul ADMIN peut lister |

### Si la section "Utilisateurs" n'apparaît pas dans Settings

**Problème probable :** L'utilisateur connecté n'est pas ADMIN.

**Vérification :**

```bash
# Via Prisma Studio — vérifier le rôle de l'utilisateur
npx prisma studio
# Table User → vérifier colonne "role"

# Ou via requête SQL directe
SELECT username, role FROM "User";
```

**Correction si rôle incorrect :**

```bash
# Dans Prisma Studio, changer le rôle à ADMIN
# Ou via npx prisma db execute:
UPDATE "User" SET role = 'ADMIN' WHERE username = 'ton_username';
```

---

## Ordre d'exécution recommandé

Exécuter dans cet ordre pour éviter les dépendances :

```
1. Issue 4  (401) → Résoudre en premier, c'est le bloquant principal
   └── Vérifier .env.local, DB connection, migrations
   
2. Issue 5  (Settings → Factures) → Dépend du profil qui charge bien (lui-même dépend de l'auth)
   └── Implémenter /api/profile + synchronisation

3. Issue 2  (Couleur #2563eb) → Simple find & replace global
   └── Confirmer la couleur cible d'abord

4. Issue 1  (Dark mode) → Impact visuel important, tester après
   └── ThemeProvider forcedTheme + retirer ThemeSwitcher + nettoyer dark: classes

5. Issue 3  (Loading screen) → UX pure, sans dépendance
   └── Créer LoadingScreen + remplacer les return null

6. Issue 6  (Multi-user) → Documentation + fix rôle admin si nécessaire
```

---

## Fichiers clés à modifier (récapitulatif)

| Issue | Fichiers |
|---|---|
| 1 (dark mode) | `contexts/ThemeProvider.tsx`, `app/globals.css`, `app/[locale]/layout.tsx`, Navbar, tous les fichiers avec `dark:` |
| 2 (couleur) | `BrandingTab.tsx`, `InvoiceContext.tsx`, `lib/variables.ts`, `app/[locale]/layout.tsx`, pages auth |
| 3 (loading) | `app/components/reusables/LoadingScreen.tsx` (nouveau), pages dashboard/clients/invoices, login page |
| 4 (401) | `.env.local`, `app/[locale]/dashboard/page.tsx`, `ClientsManager.tsx`, `middleware.ts`, routes API |
| 5 (settings) | `contexts/ProfileContext.tsx`, `contexts/InvoiceContext.tsx`, `app/api/profile/route.ts` (nouveau), `SettingsModal.tsx` |
| 6 (user) | `lib/auth/userStore.ts`, `app/components/modals/settings/tabs/UsersTab.tsx` (vérification) |

---

## Commandes utiles pour le debug

```bash
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Lancer en développement avec logs détaillés
npm run dev

# Vérifier la connexion Prisma/DB
npx prisma db push --preview-feature

# Ouvrir Prisma Studio (UI pour la DB)
npx prisma studio

# Générer un AUTH_SECRET
openssl rand -base64 32

# Chercher toutes les occurrences de #2563eb
grep -r "#2563eb" app/ contexts/ lib/ --include="*.tsx" --include="*.ts"

# Chercher les classes dark: à nettoyer
grep -r "dark:" app/ --include="*.tsx" -l
```

---

*Plan rédigé par Djaouad Azzouz — FacturApp / SiferOne · siferone.com*
