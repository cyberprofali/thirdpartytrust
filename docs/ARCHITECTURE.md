# Architecture

## Overview

ThirdPartyTrust is a static, client-side web page. There is no server, no database, and no build step — the files in src/ are exactly what GitHub Pages serves, unmodified. Every calculation happens in the visitor's browser; nothing entered into the form is transmitted anywhere.

## File structure

- src/index.html — Page structure: questionnaire, results panel, export button
- src/styles/tokens.css — Brand colors and type, as CSS custom properties
- src/styles/layout.css — Page layout and component styling
- src/styles/print.css — Print-only rules for the exported task sheet
- src/scripts/governance-matrix.json — CIS-mapped scoring weights (source of truth)
- src/scripts/scoring-engine.js — Pure scoring logic, no DOM access
- src/scripts/ui.js — Wires the form to the engine, updates the page

## How an assessment is scored

scoring-engine.js embeds a copy of the governance matrix as a JavaScript object, rather than fetching the JSON file at runtime. Static sites opened directly from disk can fail to load local JSON via fetch(), so embedding the matrix keeps scoring reliable regardless of how the page is served. governance-matrix.json remains the canonical, human-readable source for what those weights are and why.

Each of the four questionnaire categories — data sensitivity, permission scope, encryption, and breach history — is scored independently against the matrix, then summed into a 0–100 score and mapped to a letter grade. The function returns not just the score, but a breakdown array carrying each category's points, maximum points, and its specific CIS Control citation.

## Why the grade is explainable, not a black box

ui.js renders that breakdown array directly into the results panel — every grade shows exactly which factors contributed, how many points each was worth, and which CIS Control it reflects. Nothing about the scoring is hidden or summarized away.

## Compliance framework

Weights are mapped to CIS Critical Security Controls v8:

- Control 3 (Data Protection) — data sensitivity, encryption
- Control 6 (Access Control Management) — permission scope
- Control 15 (Service Provider Management) — breach history

Control 15 is the control most directly concerned with vendor and service-provider oversight, which is why it anchors the tool's compliance framing.

## Export mechanism

The "Export task sheet" button calls the browser's native window.print() — no PDF library is used. print.css hides the questionnaire and footer, reformats the results panel into a single-page certificate layout, and forces color printing on, since browsers strip background colors from printed pages by default. The export button itself is hidden from the printed output via a !important rule, since it's shown in the live page via an inline style set by JavaScript, which would otherwise override a normal stylesheet rule.

## Security notes

- Vendor names and other user input are inserted into the page using textContent, never innerHTML, closing off the one realistic XSS vector in a form-driven page.
- No external scripts, fonts, or stylesheets are loaded from any third party. Type is set using system font stacks already present on the visitor's device.
- No localStorage, sessionStorage, or cookies are used anywhere. Closing the tab clears everything; nothing persists unless the visitor exports it themselves.
