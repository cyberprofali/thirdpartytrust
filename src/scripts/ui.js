// Wires the questionnaire to the scoring engine and updates the results seal.

const form = document.getElementById("assessment-form");
const button = document.getElementById("run-assessment");
const seal = document.querySelector(".result-seal");
const panel = document.querySelector(".result-panel");
const exportButton = document.getElementById("export-task-sheet");

function getSelectedValue(name) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : null;
}

function getCheckedValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

function clearBreakdown() {
  const existing = panel.querySelector(".result-breakdown");
  if (existing) existing.remove();
}

function showIncomplete() {
  clearBreakdown();
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

function renderBreakdown(result) {
  clearBreakdown();

  const breakdown = document.createElement("div");
  breakdown.className = "result-breakdown";

  const heading = document.createElement("p");
  heading.className = "breakdown-heading";
  heading.textContent = result.framework + " — v" + result.matrixVersion;
  breakdown.append(heading);

  result.breakdown.forEach((item) => {
    const row = document.createElement("div");
    row.className = "breakdown-row";

    const line = document.createElement("p");
    line.className = "breakdown-line";
    line.textContent = item.label + ": " + item.points + "/" + item.maxPoints;

    const citation = document.createElement("p");
    citation.className = "breakdown-citation";
    citation.textContent = item.citation;

    row.append(line, citation);
    breakdown.append(row);
  });

  panel.insertBefore(breakdown, exportButton);
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
  renderBreakdown(result);
  exportButton.style.display = "block";
}

button.addEventListener("click", () => {
  const vendorName = document.getElementById("vendor-name").value.trim();
  const dataSensitivity = getSelectedValue("data-sensitivity");
  const permissionScope = getCheckedValues("permission-scope");
  const encryption = getSelectedValue("encryption");
  const breachHistory = getSelectedValue("breach-history");

  if (!dataSensitivity || !encryption || !breachHistory) {
    showIncomplete();
    return;
  }

  const result = window.ThirdPartyTrust.computeAssessment({
    dataSensitivity,
    permissionScope,
    encryption,
    breachHistory,
  });

  showResult(vendorName, result);
});

exportButton.addEventListener("click", () => {
  window.print();
});
