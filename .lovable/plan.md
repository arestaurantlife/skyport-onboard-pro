## Apply SkyportHospitality.com Brand Colors and Jost + Inter Fonts

### Overview
Update the entire training platform UI to use the SkyportHospitality.com brand palette and Jost + Inter typography.

### Brand Tokens (from SkyportHospitality.com)
- **Primary blue:** `#0966B1` → `oklch(0.55 0.12 245)`
- **Dark navy:** `#0f3f65` → `oklch(0.35 0.08 245)`
- **Orange/gold accent:** `#ffa400` → `oklch(0.80 0.18 80)`
- **Typography:** Jost (headings) + Inter (body) via Google Fonts

### Steps

1. **Load Google Fonts**
   - Add Jost and Inter `<link>` tags to `src/routes/__root.tsx` `head.links`.
   - Ensure `crossOrigin="anonymous"` on the gstatic preconnect.

2. **Update `src/styles.css` tokens**
   - Replace `:root` and `.dark` primary colors with the SkyportHospitality blue.
   - Set accent to the orange/gold.
   - Update `--gradient-hero` to use the new primary + primary-glow.
   - Register `--font-display: "Jost", sans-serif` and `--font-body: "Inter", sans-serif` in `@theme inline`.
   - Apply font families in `@layer base` (`font-family: var(--font-body)` for body, `font-family: var(--font-display)` for headings).

3. **Audit and fix hardcoded colors**
   - `src/routes/_authenticated/dashboard.tsx`: Replace the amber alert (`bg-amber-50`, `text-amber-700`, etc.) with semantic warning colors mapped to the brand palette.
   - `src/routes/index.tsx`: Replace the inline `var(--gradient-hero)` if it needs adjustment for the new primary; otherwise leave it since it reads the token.
   - `src/routes/_authenticated/certificate.$courseId.tsx`: Verify `border-accent/40` and `text-accent` render correctly with the new orange accent; adjust if contrast is poor.
   - Scan remaining route/component files for any literal Tailwind color classes (e.g., `blue-600`, `slate-900`) and swap them for semantic tokens (`primary`, `foreground`, `muted-foreground`, etc.).

4. **Build validation**
   - Run the dev build and visually confirm the platform reflects the SkyportHospitality palette on key screens: landing, auth, dashboard, course player, quiz, certificate, and manager dashboard.