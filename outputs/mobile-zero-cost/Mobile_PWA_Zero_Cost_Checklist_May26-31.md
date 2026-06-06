# VitaNudge Zero-Cost Mobile MVP Checklist

Plan window: May 26, 2026 to May 31, 2026

Goal: launch and test VitaNudge as a mobile-friendly hosted PWA at $0/month before spending on Android/iOS stores.

## Zero-Cost Target Stack

- Frontend: Netlify Free - selected
- Backend: Render Free - selected
- Database: Neon Free Postgres - selected
- Domain: free platform subdomain first
- HTTPS: included by hosting provider
- App install: PWA Add to Home Screen
- Store upload: skipped for this phase
- Monthly target cost: $0

Current status: Step 1 stack selection completed on May 21, 2026.

Brand status: VitaNudge selected with tagline "Small nudges. Big results." and short line "Your daily push toward better health."

Support email: support.vitanudge@gmail.com

## Key Decision

- Use PWA first, not App Store/Play Store.
- Android/iOS native wrapper comes later after the hosted PWA passes testing.
- Apple Developer and Google Play fees are intentionally avoided in this phase.

## Day 1: Tuesday, May 26, 2026 - Prepare For Free Hosting

- [x] Confirm app name, short name, and public description.
- [x] Update PWA manifest so it does not say vegetarian-only unless that remains the product scope.
- [ ] Add proper app icons: 192x192 and 512x512 PNG.
- [x] Add production API URL support in frontend.
- [x] Decide database path: Neon Free.
- [ ] Create free hosting accounts only if needed.
- [ ] Confirm no paid plan is selected anywhere.

Testing checklist:

- [x] Frontend production build passes.
- [ ] App opens on desktop after production build.
- [x] Login page still shows premium preview correctly.
- [x] Manifest is valid.
- [ ] Service worker does not break page refresh.
- [x] No console errors on `/login`.
- [ ] No console errors on dashboard.

Pass gate:

- [x] App can be built locally with no errors.
- [ ] PWA metadata is ready.
- [ ] No paid services are required.

## Day 2: Wednesday, May 27, 2026 - Backend And Database Hosting Setup

- [x] Convert backend config to read production environment variables.
- [x] Add production database connection plan.
- [ ] If using Supabase/Neon, prepare migration from SQLite to Postgres.
- [ ] Keep local SQLite as development fallback if useful.
- [ ] Add JWT secret to hosted environment.
- [ ] Add allowed frontend URL to backend CORS.
- [ ] Keep AI scan key optional for beta if avoiding AI cost.
- [ ] Keep email sending optional if avoiding email provider cost.

Testing checklist:

- [ ] Backend `/api/ping` works locally.
- [ ] Backend `/api/auth/register` works locally.
- [ ] Backend `/api/auth/login` works locally.
- [ ] Backend rejects invalid login.
- [ ] Backend validates missing scan image.
- [x] Backend test suite passes.

Pass gate:

- [ ] Backend can run using environment variables.
- [x] No secret is hardcoded.
- [ ] Database decision is final for hosted MVP.

## Day 3: Thursday, May 28, 2026 - Deploy Frontend And Backend

- [ ] Deploy frontend to free hosting.
- [ ] Deploy backend to free hosting.
- [ ] Set frontend production API URL.
- [ ] Set backend CORS to deployed frontend URL.
- [ ] Confirm HTTPS URL works.
- [ ] Confirm refresh works on routes like `/login`, `/scan`, `/report`.
- [ ] Save deployed URLs in project notes.

Testing checklist:

- [ ] Hosted `/login` loads.
- [ ] Hosted `/register` loads.
- [ ] User can register on hosted app.
- [ ] User can log out.
- [ ] User can log back in.
- [ ] Dashboard loads after login.
- [ ] No mixed-content errors.
- [ ] No CORS errors.
- [ ] Hosted API health check works.

Pass gate:

- [ ] A new user can register and reach dashboard on hosted URL.
- [ ] API calls work over HTTPS.
- [ ] App does not rely on `localhost`.

## Day 4: Friday, May 29, 2026 - Mobile Browser And PWA Testing

- [ ] Test on iPhone Safari.
- [ ] Test on Android Chrome.
- [ ] Add app to home screen on iPhone.
- [ ] Add app to home screen on Android.
- [ ] Open installed PWA from home screen.
- [ ] Confirm login remains usable in installed mode.
- [ ] Confirm camera/photo upload options are usable on phone.

Mobile UI testing checklist:

- [ ] Login screen fits without awkward cropping.
- [ ] Register screen fits without awkward cropping.
- [ ] Top menu is readable and tappable.
- [ ] Username menu is tappable.
- [ ] Tools drawer does not overflow badly.
- [ ] Forms are not hidden behind keyboard.
- [ ] Buttons are large enough for thumb use.
- [ ] Charts do not overflow screen.
- [ ] Scan buttons are consistent.
- [ ] Recipe calculator is usable on mobile.
- [ ] Saved recipes page is usable on mobile.
- [ ] Reports page is readable on mobile.

Pass gate:

- [ ] App is usable on both iPhone Safari and Android Chrome.
- [ ] PWA install works on at least one Android and one iPhone device.
- [ ] No blocker layout issue remains on core pages.

## Day 5: Saturday, May 30, 2026 - Full Functional Regression

- [ ] Run automated frontend build.
- [ ] Run backend regression tests.
- [ ] Run manual auth tests.
- [ ] Run manual dashboard tests.
- [ ] Run manual scan tests.
- [ ] Run manual recipe tests.
- [ ] Run manual reports tests.
- [ ] Run manual goals/profile tests.
- [ ] Run manual tools drawer tests.
- [ ] Record pass/fail in existing Excel test matrix.

Core manual test cases:

- [ ] Register new user.
- [ ] Login existing user.
- [ ] Update profile.
- [ ] Update goals.
- [ ] Add food manually.
- [ ] Log meal.
- [ ] Edit logged meal quantity/unit.
- [ ] Copy yesterday meals.
- [ ] Add water.
- [ ] Add glucose reading.
- [ ] Add weight.
- [ ] Add blood pressure.
- [ ] Add HbA1c.
- [ ] Add medication.
- [ ] Mark medication taken.
- [ ] Create meal template.
- [ ] Log from meal template.
- [ ] Add recipe manually.
- [ ] Add custom ingredient using Other flow.
- [ ] Save suggested recipe.
- [ ] Confirm saved recipe is removed or marked in suggestions.
- [ ] Open My Saved Recipes from username menu.
- [ ] Generate weekly report.
- [ ] Generate monthly report.
- [ ] Generate custom report.
- [ ] Ask coach question.
- [ ] Scan nutrition label with image.
- [ ] Scan plate with image.
- [ ] Barcode validation works.

Pass gate:

- [ ] No P0 blocker remains.
- [ ] No login/register blocker remains.
- [ ] No data-loss issue remains.
- [ ] Manual test result is recorded.

## Day 6: Sunday, May 31, 2026 - Beta Readiness And Share

- [ ] Create a short beta tester instruction note.
- [ ] Create demo account if needed.
- [ ] Add privacy policy page.
- [ ] Add terms page.
- [ ] Add medical disclaimer page.
- [ ] Add account deletion path or clearly document how users can request deletion.
- [ ] Confirm Plus preview wording is honest.
- [ ] Confirm no paid subscription claim is shown unless billing exists.
- [ ] Invite 3 to 5 trusted testers.
- [ ] Ask testers to use mobile only.
- [ ] Collect issues in one tracker.

Beta tester script:

1. Open hosted URL on phone.
2. Create account.
3. Add to home screen.
4. Log one meal.
5. Try scan or upload.
6. Create one recipe.
7. Check report.
8. Ask coach one question.
9. Send screenshot/video of anything confusing.

Pass gate:

- [ ] Hosted PWA is shareable.
- [ ] Testers can complete basic flow without help.
- [ ] Known issues are documented.
- [ ] Next paid step is justified by real feedback.

## Must-Fix Before Public Launch

- [ ] Production database is reliable.
- [ ] Backups are configured.
- [ ] Privacy policy is visible.
- [ ] Terms are visible.
- [ ] Medical disclaimer is visible.
- [ ] Account deletion is available.
- [ ] Health advice is clearly non-diagnostic.
- [ ] AI features gracefully handle missing API key or quota.
- [ ] Email features gracefully handle missing email provider.
- [ ] Camera/upload permission behavior is tested.
- [ ] App does not expose secret keys in frontend.
- [ ] No page depends on localhost.

## What Not To Pay For Yet

- [ ] Apple Developer Program.
- [ ] Google Play Console.
- [ ] Paid Vercel/Netlify plan.
- [ ] Paid database plan.
- [ ] Paid email provider.
- [ ] Paid AI usage at unlimited scale.
- [ ] Custom native iOS/Android rebuild.

## Go / No-Go Criteria

Go for beta sharing if:

- [ ] Hosted app works over HTTPS.
- [ ] Register/login works.
- [ ] Core tracking works.
- [ ] Mobile UI is usable.
- [ ] PWA install works.
- [ ] Privacy/terms/disclaimer are present.
- [ ] Test matrix has latest results.

No-go if:

- [ ] Users cannot register or log in.
- [ ] API fails on mobile network.
- [ ] Database loses data after backend restart.
- [ ] Camera/upload does not work at all.
- [ ] Important text/buttons overlap on mobile.
- [ ] App makes paid/medical claims that are not supported.
