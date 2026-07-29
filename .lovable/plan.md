## Plan

1. **Add a dedicated auth callback route**
   - Create a public `/auth/callback` page that handles password-reset links before the user reaches the password form.
   - Support both modern reset-link formats:
     - `?code=...` links by exchanging the code for a session.
     - `?token_hash=...&type=recovery` links by verifying the recovery token.
   - If the link is expired, already used, or invalid, redirect to the password reset status page with a clear error instead of leaving the admin on a broken reset screen.

2. **Update reset-email redirect target**
   - Change the “Forgot password” flow to send reset emails to `/auth/callback?next=/reset-password` instead of directly to `/reset-password`.
   - This gives the app one safe place to process the secure token/session, then forward the admin to the password form.

3. **Harden the reset password page**
   - On `/reset-password`, confirm a valid recovery session exists before allowing password update.
   - Show a clear message if the reset page is opened directly or the link has expired.
   - Add a confirm-password field to prevent mistyped passwords.
   - After a successful password update, sign the user out and send them to `/password-reset-status?status=success` so they can sign in cleanly with the new password.

4. **Improve the status page**
   - Add clear recovery states:
     - password updated successfully
     - reset link expired/invalid
     - reset page opened without a valid reset session
   - Provide buttons to return to sign in or request a fresh reset email.

5. **Make admin access clearer and operational**
   - Keep `/manager/admin` as the admin control center.
   - Add clear admin guidance on the sign-in/reset pages: if the admin account uses Google, use Google sign-in; if using password, request a fresh reset link and use the newest email only.
   - Verify the known admin account remains assigned the `admin` role after the reset-flow changes.

## Current verified facts

- The admin account `arestaurant.life@gmail.com` exists and has the `admin` role.
- Recovery emails for that account are being sent successfully.
- The app currently sends reset links directly to `/reset-password`, but that page does not process callback codes/token hashes before calling password update. That is the part I will fix.