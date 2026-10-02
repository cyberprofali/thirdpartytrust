# ThirdPartyTrust

A browser-only vendor risk scoring tool for small businesses.

**Live demo:** https://moniquemoguel.github.io/thirdpartytrust/src/index.html

## What it does

Small businesses adopt new software constantly, usually without any way to judge what
that vendor does with their data. ThirdPartyTrust turns a short questionnaire into an
instant letter grade, a plain-English breakdown of the score, a per-family risk register
with a Likelihood x Impact heat map, and an exportable compliance task sheet -- all of it
running in the browser, with nothing sent to a server.

## A note for anyone testing this

This tool covers 40 safeguards from CIS Critical Security Controls v8.1, Implementation
Group 1. All 40 safeguard questions, plus the vendor name, category, and data-sensitivity
fields, must be answered to produce a grade; if any are left blank, the results panel
shows "INCOMPLETE" rather than a grade -- this is expected behavior, not an error.

## Build Progress

- [x] Project scaffold and documentation structure
- [x] Brand and UI system
- [x] Interface assembly
- [x] Scoring engine
- [x] Governance matrix (CIS Critical Security Controls v8.1, Implementation Group 1 --
      40 safeguards, 10 controls, 6 families)
- [x] Risk register, heat map, and executive summary
- [x] Export and reporting
- [ ] Documentation and polish (in progress)
- [ ] Testing evidence

## Stack

Vanilla JavaScript, CSS custom properties, hosted on GitHub Pages. No external scripts,
fonts, or network calls of any kind; nothing entered into the form is stored or
transmitted.

## Compliance framework

Scoring is mapped to CIS Critical Security Controls v8.1, Implementation Group 1 -- CIS's
own designation for organizations with limited IT and security resources. Coverage spans
all 40 IG1 safeguards in 10 of the 18 CIS Controls (1, 3, 5, 6, 7, 10, 11, 14, 15, 17),
organized into 6 plain-English families. The remaining 16 IG1 safeguards, in Controls 2,
4, 8, 9, and 12, are not assessed.

Each safeguard is worth an equal 2.50 points (1.25 if partially implemented), for a total
of 100. CIS does not define weights or scoring for its safeguards; equal weighting is
this tool's own methodology, chosen after an earlier equal-per-family scheme produced
nearly identical scores (83.33 vs. 83.34) for a vendor missing only one inventory
safeguard and a vendor missing an entire nine-safeguard control area.

Grade bands: A 90 and above, B 80 to under 90, C 70 to under 80, D 60 to under 70, F
under 60.

Expanded from an original 3-control version to this 40-safeguard model following direct
instructor feedback that narrower coverage was not realistically useful to an
organization.

## What this tool is, and isn't

ThirdPartyTrust is a self-assessment questionnaire, not an automated scanner. It never
visits or independently verifies the vendor's actual security posture -- every grade
reflects only what the person filling out the form reports to be true.

## Risk register

Every completed assessment includes a one-page risk register: each of the 6 families
gets a Likelihood (set by its weakest safeguard), an Impact (from a single vendor-level
data-sensitivity question), and a resulting Risk Level, plus a Likelihood x Impact heat
map. This methodology is the tool's own; CIS does not prescribe a risk-scoring method at
this level.

## Additions since the proposal

The original proposal scoped four assessment categories: data sensitivity, permission
scope, encryption practices, and breach history. At the instructor's direction, the build
was expanded instead to full CIS v8.1 IG1 coverage with a risk register, which supersedes
that original scope. Both changes were made with instructor approval.

## Credit

Safeguard titles are from CIS Critical Security Controls(R) v8.1, Center for Internet
Security, Inc., licensed under CC BY-NC-ND 4.0. See
[cisecurity.org/controls](https://www.cisecurity.org/controls/) and the
[license terms](https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode). This
license covers the CIS content only; the code in this repository is separately licensed
under the terms in LICENSE.

## Documentation

See docs/ARCHITECTURE.md for a full technical breakdown of how scoring, governance
mapping, risk register, and export work.
