// Wires the questionnaire to the scoring engine and updates the results seal.

const form = document.getElementById("assessment-form");
const button = document.getElementById("run-assessment");
const seal = document.querySelector(".result-seal");
const panel = document.querySelector(".result-panel");
const exportButton = document.getElementById("export-task-sheet");
let hasResult = false;

function hideExport() {
  exportButton.hidden = true;
  exportButton.style.display = "none";
}

function showExport() {
  exportButton.hidden = false;
  exportButton.style.display = "block";
}

function getAllSafeguardAnswers() {
  const radios = form.querySelectorAll('input[type="radio"]');
  const names = new Set();
  radios.forEach((radio) => names.add(radio.name));

  const answers = {};
  names.forEach((name) => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    answers[name] = checked ? checked.value : null;
  });
  return answers;
}

function clearPrintSections() {
  const ids = [".result-breakdown", ".exec-summary", ".risk-register", ".risk-heatmap"];
  ids.forEach((selector) => {
    const existing = panel.querySelector(selector);
    if (existing) existing.remove();
  });
}

function showStale() {
  hasResult = false;
  clearPrintSections();
  hideExport();
  seal.textContent = "";
  seal.classList.add("is-empty");
  seal.append(
    makeEl("p", "seal-status", "ANSWERS CHANGED"),
    makeEl("p", "seal-empty-copy", "Select Get grade to refresh the results.")
  );
}

function showUnavailable() {
  hasResult = false;
  clearPrintSections();
  hideExport();
  seal.textContent = "";
  seal.classList.add("is-empty");
  seal.append(
    makeEl("p", "seal-status", "SCORING UNAVAILABLE"),
    makeEl("p", "seal-empty-copy", "The scoring engine did not load. Reload this page.")
  );
}

function showIncomplete() {
  hasResult = false;
  clearPrintSections();
  hideExport();
  seal.textContent = "";
  seal.classList.add("is-empty");

  const status = document.createElement("p");
  status.className = "seal-status";
  status.textContent = "INCOMPLETE";

  const copy = document.createElement("p");
  copy.className = "seal-empty-copy";
  copy.textContent = "Answer every question to generate a grade.";

  seal.append(status, copy);
}

const TIER_LABELS = {
  full: "Fully implemented",
  partial: "Partially implemented",
  none: "Not implemented",
};

function riskClass(level) {
  if (level === "High") return "risk-high";
  if (level === "Moderate") return "risk-moderate";
  return "risk-low";
}

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function makeTile(className, value, label) {
  const tile = makeEl("div", "exec-tile " + className);
  tile.append(makeEl("p", "exec-tile-value", value), makeEl("p", "exec-tile-label", label));
  return tile;
}

function renderExecSummary(result, vendorName, categoryLabel) {
  const es = result.executiveSummary;
  const wrap = makeEl("div", "exec-summary");

  const header = makeEl("div", "exec-header");
  header.append(makeEl("p", "exec-title", "Executive summary"));
  const meta = makeEl("div", "exec-meta");
  const idLine = makeEl("p", "", "");
  idLine.append(makeEl("span", "exec-meta-label", "Assessment ID  "), document.createTextNode(es.assessmentId));
  const dateLine = makeEl("p", "", "");
  dateLine.append(makeEl("span", "exec-meta-label", "Date  "), document.createTextNode(es.date));
  meta.append(idLine, dateLine);
  header.append(meta);
  wrap.append(header);

  wrap.append(makeEl("p", "exec-vendor", vendorName + " (" + categoryLabel + ") \u00B7 " + result.framework));

  const tiles = makeEl("div", "exec-tiles");
  tiles.append(
    makeTile("exec-tile-total", String(es.totalSafeguards), "Safeguards assessed"),
    makeTile("exec-tile-full", String(es.fullCount), "Fully implemented"),
    makeTile("exec-tile-partial", String(es.partialCount), "Partially implemented"),
    makeTile("exec-tile-none", String(es.noneCount), "Not implemented")
  );
  wrap.append(tiles);

  wrap.append(makeEl("p", "exec-narrative", window.ThirdPartyTrust.buildNarrative(result, vendorName).join(" ")));

  const exposure = makeEl("div", "exec-exposure");
  exposure.append(makeEl("p", "exec-exposure-label", "Primary exposure"));
  const chips = makeEl("div", "exec-chips");
  if (es.highRiskFamilies.length > 0) {
    es.highRiskFamilies.forEach((name) => {
      chips.append(makeEl("span", "risk-badge risk-high", name));
    });
  } else {
    chips.append(makeEl("span", "risk-badge risk-low", "No areas rated High risk"));
  }
  exposure.append(chips);
  wrap.append(exposure);

  const controls = [...new Set(result.families.flatMap((f) => f.safeguards.map((s) => parseInt(s.id, 10))))].sort((x, y) => x - y);
  wrap.append(
    makeEl(
      "p",
      "exec-scope",
      "Scope: all " + es.totalSafeguards + " IG1 safeguards in " + controls.length + " of the 18 CIS Controls (" + controls.join(", ") + "). " +
        "The remaining 16 IG1 safeguards, in Controls 2, 4, 8, 9, and 12, are not assessed. " +
        "Answers are self-reported and not independently verified. " +
        "Safeguard titles: CIS Controls\u00AE v8.1, Center for Internet Security, Inc. (CC BY-NC-ND 4.0)."
    )
  );

  panel.append(wrap);
}

function renderRiskRegister(result) {
  const wrap = makeEl("div", "risk-register");
  wrap.append(makeEl("p", "breakdown-heading", "Risk Register"));

  const table = makeEl("table", "register-table");
  const thead = makeEl("thead");
  const headRow = makeEl("tr");
  ["Risk Area", "Likelihood", "Impact", "Risk Level", "Recommended Action"].forEach((label) => {
    headRow.append(makeEl("th", "", label));
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = makeEl("tbody");
  result.riskRegister.forEach((entry) => {
    const row = makeEl("tr");

    const areaCell = makeEl("td");
    areaCell.append(makeEl("p", "register-area-name", entry.family), makeEl("p", "register-area-desc", entry.riskDescription));

    const levelCell = makeEl("td");
    levelCell.append(makeEl("span", "risk-badge " + riskClass(entry.riskLevel), entry.riskLevel));

    row.append(
      areaCell,
      makeEl("td", "", entry.likelihood),
      makeEl("td", "", entry.impact),
      levelCell,
      makeEl("td", "", entry.recommendedAction)
    );
    tbody.append(row);
  });
  table.append(tbody);
  wrap.append(table);
  wrap.append(makeEl("p", "breakdown-citation", "Safeguard numbers refer to the detailed findings that follow."));

  panel.append(wrap);
}

const LEVELS = ["Low", "Moderate", "High"];

function renderHeatMap(result) {
  const wrap = makeEl("div", "risk-heatmap");
  wrap.append(makeEl("p", "breakdown-heading", "Risk Heat Map"));

  const grid = makeEl("div", "heatmap-grid");
  grid.append(makeEl("div"));
  LEVELS.forEach((level) => grid.append(makeEl("div", "heatmap-axis-label", level)));

  [...LEVELS].reverse().forEach((impactLevel) => {
    grid.append(makeEl("div", "heatmap-axis-label", impactLevel));

    LEVELS.forEach((likelihoodLevel) => {
      const cellLevel = window.ThirdPartyTrust.riskMatrix[impactLevel][likelihoodLevel];
      const cell = makeEl("div", "heatmap-cell " + riskClass(cellLevel));

      result.riskRegister
        .filter((r) => r.impact === impactLevel && r.likelihood === likelihoodLevel)
        .forEach((r) => cell.append(makeEl("span", "heatmap-chip", r.family)));

      grid.append(cell);
    });
  });

  wrap.append(grid);
  wrap.append(makeEl("p", "breakdown-citation", "Columns: Likelihood. Rows: Impact."));

  panel.append(wrap);
}

function renderBreakdown(result) {
  const breakdown = makeEl("div", "result-breakdown");
  breakdown.append(makeEl("p", "breakdown-heading", result.framework + " -- v" + result.matrixVersion));

  result.families.forEach((family) => {
    breakdown.append(
      makeEl("p", "breakdown-heading", family.name + ": " + family.points.toFixed(2) + " / " + family.maxPoints.toFixed(2)),
      makeEl("p", "breakdown-citation", family.citation)
    );

    family.safeguards.forEach((safeguard) => {
      const row = makeEl("div", "breakdown-row");
      const tierLabel = safeguard.tier ? TIER_LABELS[safeguard.tier] : "Not answered";
      row.append(
        makeEl("p", "breakdown-line", safeguard.id + " -- " + safeguard.title),
        makeEl("p", "breakdown-citation", tierLabel + " -- " + safeguard.points.toFixed(2) + " / " + safeguard.maxPoints.toFixed(2) + " pts")
      );
      breakdown.append(row);
    });
  });

  panel.append(breakdown);
}

function showResult(vendorName, categoryLabel, result) {
  hasResult = true;
  seal.classList.remove("is-empty");
  seal.textContent = "";
  seal.append(
    makeEl("p", "seal-grade", result.grade),
    makeEl("p", "seal-status", vendorName),
    makeEl("p", "seal-score", result.score.toFixed(2) + " / 100")
  );

  clearPrintSections();
  renderExecSummary(result, vendorName, categoryLabel);
  renderRiskRegister(result);
  renderHeatMap(result);
  renderBreakdown(result);

  showExport();
}

function runAssessment() {
  if (!window.ThirdPartyTrust || typeof window.ThirdPartyTrust.computeAssessment !== "function") {
    showUnavailable();
    return;
  }

  const vendorName = document.getElementById("vendor-name").value.trim();
  const categorySelect = document.getElementById("vendor-category");
  const answers = getAllSafeguardAnswers();

  const result = window.ThirdPartyTrust.computeAssessment(answers);

  if (!vendorName || !categorySelect.value || !result.complete) {
    showIncomplete();
    return;
  }

  showResult(vendorName, categorySelect.selectedOptions[0].textContent, result);
}

button.addEventListener("click", runAssessment);

// Pressing Enter in the vendor-name box is an implicit form submission. Without this, the browser would
// reload the page and put the vendor name and answers in the URL of a request to the host.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  runAssessment();
});

// Any edit after grading invalidates the report, so a stale report can never be exported.
["input", "change"].forEach((type) => {
  form.addEventListener(type, () => {
    if (hasResult) showStale();
  });
});

exportButton.addEventListener("click", () => {
  window.print();
});
