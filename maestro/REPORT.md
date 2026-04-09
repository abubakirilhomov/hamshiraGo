# Maestro UI/UX Test Report — HamshiraGo Mobile

**Date:** 2026-04-08
**Device:** iPhone 16 Pro (iOS 18.1, Simulator)
**App:** Expo Go (SDK 52)
**Test runs:** 10+

## Results Summary

### Tested & Verified (10 screens)

| Screen | Status | Screenshot | Notes |
|--------|--------|------------|-------|
| Onboarding (3 slides) | PASS | 02a-02c | Pill CTA, pagination, skip works |
| Language Picker | PASS | 03 | UZ/RU cards, radio, gradient CTA |
| Auth Login | PASS | 04a-04b | +998 prefix, gradient Kirish, YOKI divider |
| Home | PASS | s01-s03 | AI banner, search, 2-col grid catalog |
| Orders List | PASS | s06-s07 | Filter pills, status badges, prices |
| Order Detail | PASS | s08 | Progress stepper, medic card, map, rating |
| Profile | PASS | s09-s10 | Avatar, loyalty card, full menu list |
| AI Chat | PASS | s19 | AI responds, suggestion chips visible |
| Order Tracking | PARTIAL | s11-s12 | Seen via order detail navigation |
| Tab Navigation | PASS | — | Coordinate-based tap (17%/50%/83%, 97%) |

### Not Fully Tested (16 screens)

| Screen | Reason |
|--------|--------|
| Service Detail | Maestro couldn't find "UZS" text after scroll |
| Order Location | Depends on service detail |
| Order Confirm | Depends on order flow |
| Order Chat | Needs active order with medic |
| Medical Card | Profile menu text not matched by regex |
| Favorites | Same — menu text mismatch |
| Loyalty | Same — "ball" text not found after swipe |
| Subscriptions | Not reachable from current menu |
| Referral | Menu text mismatch |
| Courses | Menu text mismatch |
| Doctors | Menu text mismatch |
| Consultations | Menu text mismatch |
| Nearby Medics | Not reachable |
| Prescriptions | Not in profile menu |
| NPS Survey | Modal — needs trigger |
| Video Call | Needs active consultation |

### Root Cause

Maestro in Expo Go has limited accessibility tree access. Tab bar labels and profile menu items are not consistently found via text regex. This is an **Expo Go limitation** — dev builds expose proper accessibility IDs.

## Bugs Found

### BUG-1: Order Detail auto-shows "Davolash kurslari" modal
- **Screen:** Order Detail (completed order)
- **Severity:** Medium
- **Description:** When opening a completed order, a modal "Davolash kurslari — Davolash kursi yaratmoqchimisiz?" appears automatically, blocking the UI
- **Expected:** Modal should not auto-appear; should only show when user explicitly requests

### BUG-2: "Hamshirani baholang" rating modal blocks navigation
- **Screen:** Order Detail (completed order)
- **Severity:** Medium  
- **Description:** After dismissing the course modal, a rating modal "Hamshirani baholang — Iltimos, orqaga qaytishdan oldin hamshirani baholang" appears, preventing the user from going back
- **Expected:** Rating prompt should be optional, not blocking

### BUG-3: AI Chat back navigation doesn't return to Home
- **Screen:** AI Chat
- **Severity:** High
- **Description:** After opening AI Chat from home banner, the back button shows "(tabs)" header but tapping it doesn't reliably return to the Home tab
- **Expected:** Back should return to Home tab

### BUG-4: Phone input accepts overflow text (pre-fix applied)
- **Screen:** Auth
- **Severity:** Low (FIXED)
- **Description:** Phone input had no maxLength, allowing text overflow
- **Fix applied:** `maxLength={9}` added to phone TextInput

## Recommendations

1. Add `testID` props to all interactive elements for reliable E2E testing
2. Build dev build (`npx expo run:ios`) for full Maestro compatibility
3. Fix auto-modals on order detail (BUG-1, BUG-2)
4. Fix AI Chat back navigation (BUG-3)
