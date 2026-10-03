# Architecture

## Overview

ThirdPartyTrust is a static, client-side web page. There is no server, no database, and no build step -- the files in src/ are exactly what GitHub Pages serves, unmodified. Every calculation happens in the visitor's browser; nothing entered into the form is transmitted anywhere.

## File structure

- src/index.html -- Page structure: vendor fields, data-sensitivity question, 40 safeguard questions, results panel, export button
- src/assets/favicon.svg -- Site icon
- src/styles/tokens.css -- Brand colors, risk-level colors, and system font stacks, as CSS custom properties
- src/styles/layout.css -- Page layout and component styling; hides the report sections on screen
- src/styles/print.css -- Print-only rules for the exported task sheet
- src/scripts/governance-matrix.json -- Canonical governance matrix (v2.1.0): families, safeguards, points, impact map, risk matrix
- src/scripts/scoring-engine.js -- Pure scoring and risk logic, no DOM access
- src/scripts/ui.js -- Wires the form to the engine and renders the seal and report sections

## Compliance framework

Scoring is built on CIS Critical Security Controls v8.1, Implementation Group 1 (IG1) -- CIS's designation for essential cyber hygiene, aimed at small to medium-sized enterprises with limited IT and cybersecurity expertise, which matches this tool's target market directly. (The guide's cover reads Version 8.1, March 2025; its running footers carry the revision label v8.1.2. The tool cites v8.1.)

Coverage spans all 40 IG1 safeguards in 10 of the 18 CIS Controls, organized into 6 plain-English families so the assessment reads clearly to a non-technical user:

- **Data Protection & Privacy** -- CIS Control 3, Data Protection (6 safeguards)
- **Access & Identity Management** -- CIS Controls 5 & 6, Account Management and Access Control Management (9 safeguards)
- **Vulnerability & Threat Management** -- CIS Controls 7 & 10, Continuous Vulnerability Management and Malware Defenses (7 safeguards)
- **Asset Inventory & Data Recovery** -- CIS Controls 1 & 11, Inventory and Control of Enterprise Assets and Data Recovery (6 safeguards)
- **Vendor & Service Provider Oversight** -- CIS Control 15, Service Provider Management (1 safeguard)
- **Security Awareness & Incident Response** -- CIS Controls 14 & 17, Security Awareness and Skills Training and Incident Response Management (11 safeguards)

IG1 contains 56 safeguards in total. The remaining 16 -- in Controls 2 (3), 4 (7), 8 (3), 9 (2), and 12 (1) -- are not assessed, and every exported report states this in its scope note.

Control 15 has only one IG1 safeguard, 15.1 Establish and Maintain an Inventory of Service Providers. Every other Control 15 safeguard sits at IG2 or IG3, so the vendor-oversight family is a single question at this implementation level.

## Scoring methodology

CIS does not define weights or a scoring method for its safeguards. Everything in this section is this tool's own disclosed methodology.

Each safeguard is answered on a three-tier scale: Fully implemented (2.50 points), Partially implemented (1.25), or Not implemented (0). All 40 safeguards carry equal weight, for a total of exactly 100.00. Points are summed in whole cents so grade cut-offs are exact and never subject to floating-point error.

Grade bands: A 90 and above, B 80 to under 90, C 70 to under 80, D 60 to under 70, F under 60.

Equal weighting per safeguard replaced an earlier scheme that gave each family an equal share of the total regardless of size. Under that scheme, a vendor missing only safeguard 15.1 scored 83.33 and a vendor missing all nine Access & Identity Management safeguards scored 83.34 -- one safeguard weighed the same as an entire control area. Under the current model the same two vendors score 97.50 and 77.50.

The trade-off is that vendor oversight now contributes 2.50 points to the grade. That gap is carried by the risk register instead of the grade: a Not implemented answer on 15.1 sets that family's Likelihood to High, which produces a High Risk Level whenever Impact is Moderate or High.

## Risk register methodology

Every completed assessment produces a per-family risk register. The method below is this tool's own; it is not attributed to CIS or any other framework.

**Likelihood (weakest link).** Any Not implemented safeguard in a family sets that family's Likelihood to High, even if every other safeguard in it is Fully implemented. Otherwise, any Partially implemented safeguard sets it to Moderate. A family with every safeguard Fully implemented is Low. Averaging was rejected because it can hide a single serious gap behind strong answers elsewhere.

**Impact (vendor-level).** One question -- what kind of data the vendor handles -- sets Impact for all six families:

- Public information only -- Low
- Internal business data -- Moderate
- Customer or employee records -- High
- Regulated data (health, financial, etc.) -- High

**Risk Level.** Looked up from a 3x3 matrix, indexed by Impact (rows) and Likelihood (columns):

| Impact \ Likelihood | Low | Moderate | High |
|---|---|---|---|
| High | Moderate | High | High |
| Moderate | Low | Moderate | High |
| Low | Low | Low | Moderate |

Because Impact applies to the whole vendor, a vendor handling customer, employee, or regulated data cannot rate Low in any family, even with every safeguard Fully implemented.

**Recommended Action.** Lists safeguard numbers only: "Prioritize" every Not implemented safeguard in the family; if there are none, "Strengthen" every Partially implemented one; if there are neither, "No immediate action needed."

**Heat map.** Places each family in the cell matching its Likelihood and Impact, with cells colored by Risk Level.

## Executive summary

Built entirely from computed data; nothing in it is free-written.

- Assessment ID in the format TPT-YYYYMMDD-HHMM, from the visitor's system clock, plus the date in the browser's local format
- Vendor name, category, and framework line
- Four tiles: safeguards assessed, fully, partially, and not implemented
- A rule-built paragraph: score and grade with the grade scale, the count of areas at each risk level, why Impact was rated as it was, and where the Not implemented answers are concentrated (or, if there are none, how many safeguards were only partially implemented). One extra sentence is added when the grade and the risk profile point in different directions (an A or B with any High-risk area, or a D or F with none).
- Primary exposure chips naming every High-risk family, or a single "No areas rated High risk" chip
- Scope note: controls covered, the 16 IG1 safeguards not assessed, that answers are self-reported, and the CIS credit

## How the code is organized

`scoring-engine.js` embeds a copy of the governance matrix as a JavaScript object rather than fetching the JSON file at runtime -- a page opened directly from disk can fail to load local JSON via `fetch()`, so embedding keeps scoring reliable regardless of how the page is served. `governance-matrix.json` remains the canonical, human-readable source; the embedded copy must be kept identical to it, and both are at v2.1.0.

The engine exposes three things on `window.ThirdPartyTrust`:

- `computeAssessment(answers)` -- returns the score, grade, per-family and per-safeguard breakdown, risk register, executive summary data, and a `complete` flag that is false if any safeguard or the data-sensitivity question is unanswered
- `buildNarrative(result, vendorName)` -- returns the executive summary paragraph as an array of sentences, or nothing for an incomplete assessment
- `riskMatrix` -- the 3x3 lookup, used by the heat map

`ui.js` reads the form, calls the engine, and renders the result. It holds no scoring logic of its own.

## Results states

The results seal shows one of five states:

- **AWAITING ASSESSMENT** -- initial page load
- **INCOMPLETE** -- the vendor name, category, data-sensitivity question, or any safeguard is unanswered; no grade is produced and export stays hidden
- **Graded** -- letter grade, vendor name, and score out of 100; export becomes available
- **ANSWERS CHANGED** -- any edit after grading clears the report and hides export, so a stale report can never be exported
- **SCORING UNAVAILABLE** -- the engine script failed to load

Pressing Enter in the vendor-name box triggers an implicit form submission. `ui.js` intercepts it and grades instead, so the page never reloads and answers never end up in a URL.

## What's shown where

On screen, only the results seal is shown. The executive summary, risk register, heat map, and detailed safeguard findings are rendered into the page at grading time but hidden by `layout.css`; `print.css` reveals them only inside its `@media print` block. The same computed result feeds both views.

## Export mechanism

The "Export task sheet" button calls the browser's native `window.print()` -- no PDF library is used. `print.css` hides the questionnaire, footer, and tagline, shows a "Vendor Risk Compliance Task Sheet" subtitle, and lays out the report in this order: seal, executive summary, risk register, heat map, detailed findings. The executive summary, risk register, heat map, and individual register rows are kept from splitting across pages, and `print-color-adjust: exact` keeps grade and risk colors, which browsers strip from printed pages by default.

The export button is hidden from printed output with a `!important` rule, because `ui.js` shows it on screen via an inline style that would otherwise override a normal stylesheet rule.

## Security notes

- All user input and computed text is inserted with `textContent` and `createElement`. No `innerHTML` or other HTML-parsing insertion is used anywhere, closing off the realistic XSS vector in a form-driven page.
- No external scripts, fonts, or stylesheets are loaded. Type is set using system font stacks already present on the visitor's device. The footer's two outbound links (CIS and the license terms) open only when clicked and use `rel="noopener noreferrer"`.
- No `localStorage`, `sessionStorage`, or cookies are used. Closing the tab clears everything; nothing persists unless the visitor exports it.
- Each assessment is independent; no history is kept between assessments.

## Design history

- Expanded from an original 3-control version to full IG1 coverage of the 10 controls above.
- An earlier build listed 35 safeguards across 9 controls. A line-by-line re-check against the CIS guide found the correct figure of 40 across 10, and every title was matched word for word.
- The family previously named Network & System Hygiene was renamed Asset Inventory & Data Recovery, since the old name implied network controls (Controls 12 and 13) that are not assessed.
- Equal-per-family weighting was replaced by equal-per-safeguard weighting, for the reason given under Scoring methodology.

## Credit and license

Safeguard titles are from CIS Critical Security Controls(R) v8.1, Center for Internet Security, Inc., licensed under CC BY-NC-ND 4.0 (https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode). See https://www.cisecurity.org/controls/. That license covers the CIS content only; the code in this repository is licensed separately under the terms in LICENSE.

## What this tool is not

ThirdPartyTrust is a self-assessment questionnaire, not an automated scanner. It never visits, fetches, or independently verifies the vendor's actual website or security posture -- the grade and risk register reflect only what the person filling out the form reports to be true. This is a deliberate scope boundary, not a limitation to work around.
