# Alpha Gate — Integration Guide
## Email capture gate for Revenue Physics Engine

---

## Files Added

```
src/AlphaGate.jsx   ← Gate component (form + access control)
```

---

## 3 Changes Required

### Change 1: Add hidden Netlify Form to index.html

Netlify's deploy bot needs a static HTML form to detect. Add this
inside `<body>`, just before the `<div id="root">`:

```html
<!-- Netlify Forms detection (hidden, never rendered to user) -->
<form name="alpha-access" netlify netlify-honeypot="bot-field" hidden>
  <input name="email" />
  <input name="role" />
  <input name="company" />
  <input name="bot-field" />
</form>
```

Full index.html body becomes:
```html
<body>
  <form name="alpha-access" netlify netlify-honeypot="bot-field" hidden>
    <input name="email" /><input name="role" /><input name="company" /><input name="bot-field" />
  </form>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
```

### Change 2: Wire gate into App.jsx

Add import at top:
```jsx
import AlphaGate, { hasAlphaAccess } from './AlphaGate';
```

Add gated state inside the App component (around line 2589):
```jsx
export default function App(){
  const[gated, setGated] = useState(!hasAlphaAccess());   // ← ADD
  const[onboarded,setOnboarded]=useState(false);
  // ... rest unchanged
```

Add gate check before the onboarding check (around line 2609):
```jsx
  // ── Alpha Gate (before onboarding) ──
  if(gated) return <AlphaGate onAccessGranted={() => setGated(false)} />;

  if(!onboarded) return <OnboardingWizard onComplete={handleOnboardComplete}/>;
```

That's it. Three lines in App.jsx, one form tag in index.html.

### Change 3: Deploy

```bash
git add src/AlphaGate.jsx index.html src/App.jsx
git commit -m "Add alpha access gate with email capture"
git push origin main
```

Netlify auto-deploys. Form submissions appear in your Netlify dashboard
under Forms → alpha-access.

---

## How It Works

### First visit
1. AlphaGate renders — shows positioning copy + email form
2. User enters email (role + company optional)
3. Form submits to Netlify Forms via fetch POST
4. localStorage gets `rpe_alpha_access: { granted: true, email }`
5. Success animation plays (1.8s)
6. OnboardingWizard loads
7. Engine loads

### Return visit
1. `hasAlphaAccess()` checks localStorage → finds existing grant
2. Gate skipped entirely → straight to engine (or onboarding if first session)

### Offline / fetch failure
The gate still grants access even if the Netlify Forms POST fails.
Better to lose a lead than block someone from using the tool.
The email is stored in localStorage either way for later recovery.

---

## Where Submissions Go

Netlify Dashboard → your site → Forms → "alpha-access"

Each submission includes:
- **email** (required)
- **role** (optional) — useful for segmentation
- **company** (optional) — useful for account-level targeting

You can:
- Export submissions as CSV
- Set up email notifications (Settings → Forms → Notifications)
- Connect to Zapier/Make for CRM integration
- Connect to a Google Sheet for live tracking

### Recommended: Enable email notifications
Netlify Dashboard → Site → Forms → Form Notifications → Add Notification
→ Email notification → nick@heretics.io → "alpha-access" form

You'll get an email for every signup.

---

## Customization

### Change the copy
Edit the text directly in AlphaGate.jsx. Key sections:
- `<h1>` — headline
- `<p>` below headline — subhead / value prop
- Feature list grid — what's inside
- "Join the alpha" line — CTA context
- Privacy note — footer disclaimer

### Make fields required
Change `role` and `company` inputs to add `required` attribute.
Currently optional because friction kills conversion.

### Add a bypass for development
In App.jsx, for local dev:
```jsx
const isDev = window.location.hostname === 'localhost';
const[gated, setGated] = useState(!isDev && !hasAlphaAccess());
```

### Remove the gate later
Delete the `if(gated)` line and the `gated` state in App.jsx.
The AlphaGate component can stay in the repo for reference.

---

## Spam Protection

The form uses Netlify's built-in honeypot field (`bot-field`).
Bots that fill in the hidden honeypot field get silently rejected.
No CAPTCHA needed — keeps the UX clean.

For additional protection, enable Netlify's spam filter:
Site → Forms → Settings → Spam settings → Enable Akismet.
