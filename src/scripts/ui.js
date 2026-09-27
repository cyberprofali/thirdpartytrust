// Wires the questionnaire to the scoring engine and updates the results seal.

const form = document.getElementById("assessment-form");
const button = document.getElementById("run-assessment");
const seal = document.querySelector(".result-seal");
const panel = document.querySelector(".result-panel");
const exportButton = document.getElementById("export-task-sheet");

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

function showIncomplete() {
  clearPrintSections();
  exportButton.style.display = "none";
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

function renderExecSummary(result, vendorName) {
  const wrap = document.createElement("div");
  wrap.className = "exec-summary";

  const heading = document.createElement("p");
  heading.className = "breakdown-heading";
  heading.textContent = "Executive Summary";
  wrap.append(heading);

  const meta = document.createElement("p");
  meta.className = "breakdown-citation";
  meta.textContent = "Assessment ID: " + result.executiveSummary.assessmentId + "  |  Date: " + result.executiveSummary.date;
  wrap.append(meta);

  const summaryText = document.createElement("p");
  summaryText.className = "exec-summary-text";
  const es = result.executiveSummary;
  let exposureText = "no families rated High risk.";
  if (es.highRiskFamilies.length > 0) {
    exposureText = "primary exposure in: " + es.highRiskFamilies.join(", ") + ".";
  }
  summaryText.textContent =
    (vendorName || "This vendor") + " scored " + result.grade + " (" + result.score + "/100) against " + result.framework +
    ". Of 35 evaluated safeguards, " + es.fullCount + " are fully implemented, " + es.partialCount +
    " partially implemented, and " + es.noneCount + " not implemented. Based on the stated data sensitivity, " + exposureText;
  wrap.append(summaryText);

  panel.append(wrap);
}

function renderRiskRegister(result) {
  const wrap = document.createElement("div");
  wrap.className = "risk-register";

  const heading = document.createElement("p");
  heading.className = "breakdown-heading";
  heading.textContent = "Risk Register";
  wrap.append(heading);

  const table = document.createElement("table");
  table.className = "register-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Risk Area", "Likelihood", "Impact", "Risk Level", "Recommended Action"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  result.riskRegister.forEach((entry) => {
    const row = document.createElement("tr");

    const areaCell = document.createElement("td");
    const areaName = document.createElement("p");
    areaName.className = "register-area-name";
    areaName.textContent = entry.family;
    const areaDesc = document.createElement("p");
    areaDesc.className = "register-area-desc";
    areaDesc.textContent = entry.riskDescription;
    areaCell.append(areaName, areaDesc);

    const likelihoodCell = document.createElement("td");
    likelihoodCell.textContent = entry.likelihood;

    const impactCell = document.createElement("td");
    impactCell.textContent = entry.impact;

    const levelCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "risk-badge " + riskClass(entry.riskLevel);
    badge.textContent = entry.riskLevel;
    levelCell.append(badge);

    const actionCell = document.createElement("td");
    actionCell.textContent = entry.recommendedAction;

    row.append(areaCell, likelihoodCell, impactCell, levelCell, actionCell);
    tbody.append(row);
  });
  table.append(tbody);
  wrap.append(table);

  panel.append(wrap);
}

const LEVELS = ["Low", "Moderate", "High"];

// Single source of truth for the heat map's cell coloring -- mirrors the
// RISK_MATRIX in scoring-engine.js exactly, so the two never drift apart.
const HEATMAP_RISK_MATRIX = {
  Low: { Low: "Low", Moderate: "Low", High: "Moderate" },
  Moderate: { Low: "Low", Moderate: "Moderate", High: "High" },
  High: { Low: "Moderate", Moderate: "High", High: "High" },
};

function renderHeatMap(result) {
  const wrap = document.createElement("div");
  wrap.className = "risk-heatmap";

  const heading = document.createElement("p");
  heading.className = "breakdown-heading";
  heading.textContent = "Risk Heat Map";
  wrap.append(heading);

  const grid = document.createElement("div");
  grid.className = "heatmap-grid";

  grid.append(document.createElement("div"));
  LEVELS.forEach((lvl) => {
    const colLabel = document.createElement("div");
    colLabel.className = "heatmap-axis-label";
    colLabel.textContent = lvl;
    grid.append(colLabel);
  });

  [...LEVELS].reverse().forEach((impactLevel) => {
    const rowLabel = document.createElement("div");
    rowLabel.className = "heatmap-axis-label";
    rowLabel.textContent = impactLevel;
    grid.append(rowLabel);

    LEVELS.forEach((likelihoodLevel) => {
      const cell = document.createElement("div");
      const riskLevel = HEATMAP_RISK_MATRIX[impactLevel][likelihoodLevel];
      cell.className = "heatmap-cell " + riskClass(riskLevel);

      const matches = result.riskRegister.filter((r) => r.impact === impactLevel && r.likelihood === likelihoodLevel);
      matches.forEach((m) => {
        const chip = document.createElement("span");
        chip.className = "heatmap-chip";
        chip.textContent = m.family;
        cell.append(chip);
      });

      grid.append(cell);
    });
  });

  wrap.append(grid);

  const axisNote = document.createElement("p");
  axisNote.className = "breakdown-citation";
  axisNote.textContent = "Columns: Likelihood. Rows: Impact.";
  wrap.append(axisNote);

  panel.append(wrap);
}

function renderBreakdown(result) {
  const breakdown = document.createElement("div");
  breakdown.className = "result-breakdown";

  const heading = document.createElement("p");
  heading.className = "breakdown-heading";
  heading.textContent = result.framework + " -- v" + result.matrixVersion;
  breakdown.append(heading);

  result.families.forEach((family) => {
    const familyHeading = document.createElement("p");
    familyHeading.className = "breakdown-heading";
    familyHeading.textContent = family.name + ": " + family.points.toFixed(2) + " / " + family.maxPoints.toFixed(2);
    breakdown.append(familyHeading);

    const familyCitation = document.createElement("p");
    familyCitation.className = "breakdown-citation";
    familyCitation.textContent = family.citation;
    breakdown.append(familyCitation);

    family.safeguards.forEach((safeguard) => {
      const row = document.createElement("div");
      row.className = "breakdown-row";

      const line = document.createElement("p");
      line.className = "breakdown-line";
      line.textContent = safeguard.id + " -- " + safeguard.title;

      const detail = document.createElement("p");
      detail.className = "breakdown-citation";
      const tierLabel = safeguard.tier ? TIER_LABELS[safeguard.tier] : "Not answered";
      detail.textContent = tierLabel + " -- " + safeguard.points.toFixed(2) + " / " + safeguard.maxPoints.toFixed(2) + " pts";

      row.append(line, detail);
      breakdown.append(row);
    });
  });

  panel.append(breakdown);
}

function showResult(vendorName, result) {
  seal.classList.remove("is-empty");
  seal.textContent = "";

  const grade = document.createElement("p");
  grade.className = "seal-grade";
  grade.textContent = result.grade;

  const label = document.createElement("p");
  label.className = "seal-status";
  label.textContent = vendorName || "Assessment complete";

  const score = document.createElement("p");
  score.className = "seal-score";
  score.textContent = result.score + " / 100";

  seal.append(grade, label, score);

  clearPrintSections();
  renderExecSummary(result, vendorName);
  renderRiskRegister(result);
  renderHeatMap(result);
  renderBreakdown(result);

  exportButton.style.display = "block";
}

button.addEventListener("click", () => {
  const vendorName = document.getElementById("vendor-name").value.trim();
  const answers = getAllSafeguardAnswers();

  const result = window.ThirdPartyTrust.computeAssessment(answers);

  if (!result.complete) {
    showIncomplete();
    return;
  }

  showResult(vendorName, result);
});

exportButton.addEventListener("click", () => {
  window.print();
});
