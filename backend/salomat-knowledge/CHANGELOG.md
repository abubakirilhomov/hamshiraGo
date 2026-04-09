# Salomat Prompt Changelog

## v1.0.0 — 2026-04-09
- Initial knowledge base created
- Files: triage.md, specialties.md, safety.md, tone.md, conversation-flow.md, disclaimer.md
- Language: Uzbek greeting → Russian conversation
- Triage: 4 levels (emergency, urgent, planned, self-care)
- Specializations: 12 doctors + 6 nursing services
- Safety: strict no-diagnosis, no-prescription rules
- Rate limit: 50 messages/day per patient

## v1.1.0 — 2026-04-09
- Added patient context (name, medical profile) to system prompt
- Added prompt caching (cache_control: ephemeral)
- Added audit logging for red flags, referrals, safeguards
- Added streaming SSE endpoint
- Added summary generation for doctor consultations
