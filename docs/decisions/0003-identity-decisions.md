# 0003 — Identity decisions

Date: 2026-11-15. Status: accepted (owner) unless marked otherwise.

- **PINs are optional for every profile**, parents included. The app *advises* setting a
  PIN on parent profiles when the family has a child profile, and never forces it.
  Reason: families without children should not be inconvenienced.
- **Primary device is a central family tablet** that stays signed in to the family;
  people switch profiles on it. Personal devices are secondary.
- **Server-side sessions in httpOnly cookies** instead of JWTs. Orchestrator's
  recommendation, explained to the owner; final sign-off happens with the identity
  design (`docs/spec/identity.md`). Reason: profile switching, instant permission
  changes and device sign-out all need server-side state.
- **Sign-up closed after the first family** via a setting (default; owner has not
  objected). Reopenable later.
- **Authorisation is module-aware**: role × module × action, with modules a family can
  enable or disable (see 0002).

## Approved 2026-11-15: identity design (`docs/spec/identity.md`)

The owner approved the design and its recommended defaults (I1–I11), including
server-side sessions, immediate family deletion after re-authentication, owner-only
account management, and one auto-lock setting for all profiles (PIN-less profiles
simply return to the picker, so no separate timeout).

## Emails: one account email, optional per-profile contact emails

- The **family account email** is the sign-in and account-recovery address. It can be
  any adult's personal address; a shared family inbox is not required.
- Each profile may have an **optional contact email**, used only for notifications and
  communication. It is never a sign-in credential, need not be unique, and is editable
  by the profile itself or a PARENT.
- No email is sent to a contact address until it has been verified; verification
  arrives with email sending (SES), which is not in v1.
- Possible later: per-profile sign-in on personal devices. Not designed now; the
  contact email must not be reused as a credential without a verified-identity design.
