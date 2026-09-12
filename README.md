# ThirdPartyTrust

A browser-only vendor risk scoring tool for small businesses.

**Live demo:** https://moniquemoguel.github.io/thirdpartytrust/src/index.html

## What it does

Small businesses adopt new software constantly, usually without any way to judge what
that vendor does with their data. ThirdPartyTrust turns a short questionnaire into an
instant letter grade, a plain-English breakdown of the score, and an exportable
compliance task sheet — all of it running in the browser, with nothing sent to a server.

## Build Progress

- [x] Project scaffold and documentation structure
- [x] Brand and UI system
- [x] Interface assembly
- [x] Scoring engine
- [x] Governance matrix (CIS Controls v8)
- [x] Export and reporting
- [ ] Documentation and polish
- [ ] Testing evidence

## Stack

Vanilla JavaScript, CSS custom properties, hosted on GitHub Pages.

## Compliance framework

Scoring logic is mapped to CIS Critical Security Controls v8, primarily Control 15
(Service Provider Management), with additional weighting tied to Control 3 (Data
Protection) and Control 6 (Access Control Management). Every grade displays its
per-category breakdown with the specific control it reflects, and can be exported
as a printable compliance task sheet.
