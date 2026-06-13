# Security Policy

## Supported versions

The latest commit on `main` is the supported version. There are no maintained release branches.

## Reporting a vulnerability

Please do not open a public issue for security problems. Instead:

- Use GitHub's private vulnerability reporting on this repository (Security tab → "Report a vulnerability"), or
- Email **bo.umair@gmail.com** with the details.

You can expect an acknowledgement within a few days. Please include reproduction steps and the commit hash you tested.

## Scope notes

- The council chamber UI binds to `127.0.0.1` by default and has **no authentication**. Exposing it (`UI_HOST=0.0.0.0`) deliberately lets anyone who can reach it spend your API budget - that is documented behavior, not a vulnerability.
- API keys are read from `.env` and never logged; a report that keys leak into logs or transcripts would be very welcome.
- Model output is treated as untrusted input and schema-validated at the boundary; bypasses of that validation are in scope.
