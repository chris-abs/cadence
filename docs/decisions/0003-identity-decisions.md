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
