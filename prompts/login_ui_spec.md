# UI/UX Specification: Login Page

**Project:** Sales Inventory Analysis and Forecasting System
**Design Ethos:** Minimalist, Modern, Enterprise-grade (Stripe/Linear/Vercel inspired)

---

## 1. Low-Fidelity Wireframe (ASCII)

```text
+-----------------------------------------------------------------------------+
|                                      |                                      |
|  [Logo] BrandName                    |                                      |
|                                      |          +-----------------+         |
|  "Empowering your sales and          |          |  [Logo]         |         |
|   inventory decisions through        |          |                 |         |
|   intelligent, predictive data."     |          |  Welcome back   |         |
|                                      |          |  Log in to app  |         |
|  +--------------------------------+  |          |                 |         |
|  | ~ +24% Sales YoY               |  |          |  Email          |         |
|  +--------------------------------+  |          |  [____________] |         |
|                                      |          |                 |         |
|  +--------------------------------+  |          |  Password       |         |
|  | ~ 99.8% Inventory Accuracy     |  |          |  [____________]o|         |
|  +--------------------------------+  |          |                 |         |
|                                      |          |  [x] Remember   |         |
|  [ Abstract Data Illustration ]      |          |         Forgot? |         |
|                                      |          |                 |         |
|                                      |          |  [   Login    ] |         |
|                                      |          |                 |         |
|                                      |          |  --- or ---     |         |
|                                      |          |                 |         |
|                                      |          |  Sign up        |         |
|                                      |          +-----------------+         |
|                                      |                              Footer  |
|  v1.0.0                              |  🔒 Secure Connection                |
+-----------------------------------------------------------------------------+
```

---

## 2. High-Fidelity UI Description

The page utilizes a **50/50 Split-Screen Layout** to separate marketing/trust elements from the functional authentication flow.

### Left Section (Brand & Value)
*   **Background:** `#F8FAFC` (Slate 50) to create a soft, welcoming feel without harsh white glare.
*   **Typography:** Primary heading is `#0F172A` (Slate 900), bold (700). Subtext is `#64748B` (Slate 500), medium (500).
*   **Analytics Cards:** Small, floating cards showcasing system value. Background `#FFFFFF`, 1px solid border `#E2E8F0`, 12px border radius, and a very soft shadow to pop off the `#F8FAFC` background.
*   **Illustration:** A clean, geometric, abstract representation of data/charts (no cartoonish elements).

### Right Section (Authentication)
*   **Background:** Pure `#FFFFFF` to focus the user's attention.
*   **Login Card:** Rather than a heavy boxed card, the form sits cleanly in the center of the right pane. If boxed, it uses a 1px `#E2E8F0` border and `0px` shadow to remain flat and modern.
*   **Inputs:** High contrast borders `#E2E8F0`. Text is Slate 900.
*   **Primary Button:** Uses the Primary brand color `#1E293B` (Slate 800) for a mature, enterprise feel. Text is pure white.
*   **Accent Usage:** The Accent color `#2563EB` (Blue 600) is used *sparingly*—only for focus rings on inputs, the "Remember me" checkbox active state, and text links (Forgot Password, Sign up).

---

## 3. Component Hierarchy

```text
LoginPage
├── SplitLayout
│   ├── BrandSection (Left Pane)
│   │   ├── BrandLogo
│   │   ├── ValuePropositionText
│   │   ├── AnalyticsHighlightList
│   │   │   └── StatCard (Reusable)
│   │   ├── AbstractIllustration
│   │   └── AppVersion
│   │
│   └── AuthSection (Right Pane)
│       └── LoginFormContainer
│           ├── FormHeader (Logo, Title, Subtitle)
│           ├── LoginForm
│           │   ├── TextInput (Email)
│           │   ├── PasswordInput (with Show/Hide toggle)
│           │   ├── FormControls (Remember Me Checkbox, Forgot Password Link)
│           │   └── SubmitButton
│           ├── FormDivider ("or")
│           ├── SignUpPrompt
│           └── SecurityFooter
```

---

## 4. Tailwind CSS Structure

These are the exact utility classes that will be used to achieve the strict design system requirements.

**Layout & Containers:**
*   `SplitLayout`: `min-h-screen w-full flex bg-white font-inter`
*   `BrandSection`: `hidden lg:flex w-1/2 flex-col justify-between bg-slate-50 border-r border-slate-200 p-12`
*   `AuthSection`: `w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-24 bg-white`

**Typography:**
*   `Title`: `text-2xl font-bold text-slate-900 tracking-tight`
*   `Subtitle`: `text-sm font-medium text-slate-500 mt-2`
*   `Labels`: `block text-sm font-semibold text-slate-700 mb-1.5`

**Form Elements (12px Radius = `rounded-xl`):**
*   `Input`: `w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200`
*   `PrimaryButton`: `w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 transition-all active:scale-[0.98]`
*   `Checkbox`: `h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer`

**Accent Links:**
*   `Link`: `text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors`

---

## 5. Responsive Behavior

*   **Mobile (< 1024px):** The `BrandSection` (Left) is entirely hidden (`hidden lg:flex`). The `AuthSection` (Right) takes up `100%` width. Padding is reduced to accommodate smaller screens.
*   **Desktop (>= 1024px):** The 50/50 split layout is activated.
*   **Inputs & Buttons:** Always take up `100%` width of their container to ensure large, tappable touch targets on mobile.

---

## 6. Accessibility (a11y) Considerations

*   **Contrast Ratios:** `#64748B` (Slate 500) on `#FFFFFF` and `#1E293B` on `#FFFFFF` strictly adhere to WCAG AA standards.
*   **Semantic HTML:** Strict use of `<form>`, `<label htmlFor="...">`, and `<input id="...">` to ensure screen reader compatibility.
*   **Keyboard Navigation:** All interactive elements (`input`, `button`, `a`) will have highly visible focus states using Tailwind's `focus:ring`.
*   **Aria Attributes:** The password toggle button will implement `aria-label="Toggle password visibility"` and `aria-pressed`.

---

## 7. User Interaction States

*   **Hover:** Buttons subtly shift color (`bg-slate-700`). Links change color slightly without adding underlines to keep it clean.
*   **Focus:** Inputs gain a distinct Blue 600 ring with 20% opacity (`focus:ring-blue-600/20`) and the border turns solid Blue 600.
*   **Active:** The primary login button shrinks slightly (`active:scale-[0.98]`) to provide tactile feedback without relying on heavy animations.
*   **Loading:** When submitting, the button text changes to "Signing in...", a minimalist SVG spinner appears, and all inputs become `disabled` (lowered opacity).
*   **Error:** If validation fails, input borders turn Red 500 (`border-red-500`), and a sharp, concise error message appears below the field in Red 500 (`text-red-500`).

---

## 8. Design Rationale

This design completely avoids "trendy" UI fads like glassmorphism, heavy drop shadows, or neon gradients. Instead, it relies on **high-quality typography (Inter), strict spacing scales, and subtle border contrasts** to define the visual hierarchy.

By using Slate 800 (`#1E293B`) as the primary button color rather than the Accent Blue, the application immediately feels mature, serious, and secure—aligning with the aesthetic of enterprise dashboards like Vercel and Stripe. The Accent Blue is reserved exclusively for interactive links and focus states, ensuring that when the user sees blue, they know it means "action."
