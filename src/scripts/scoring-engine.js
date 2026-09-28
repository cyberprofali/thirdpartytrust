// Converts questionnaire answers into a 0-100 score, a letter grade, and a
// per-family risk register (Likelihood x Impact -> Risk Level).
// Weights are sourced from the CIS v8.1 IG1-mapped governance matrix.
// No DOM access here -- this stays testable on its own, independent of the UI.

const GOVERNANCE_MATRIX = {
  version: "2.1.0",
  framework: "CIS Critical Security Controls v8.1 \u2014 Implementation Group 1",
  impactMap: { public: "Low", internal: "Moderate", customer: "High", regulated: "High" },
  riskMatrix: {
    Low: { Low: "Low", Moderate: "Low", High: "Moderate" },
    Moderate: { Low: "Low", Moderate: "Moderate", High: "High" },
    High: { Low: "Moderate", Moderate: "High", High: "High" },
  },
  families: [
    {
      id: "data-protection",
      name: "Data Protection & Privacy",
      citation: "CIS Control 3 \u2014 Data Protection",
      riskDescription: "Weaknesses in data handling could expose sensitive information to unauthorized access, loss, or improper disposal.",
      safeguards: [
        { id: "3.1", title: "Establish and Maintain a Data Management Process", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "3.2", title: "Establish and Maintain a Data Inventory", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "3.3", title: "Configure Data Access Control Lists", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "3.4", title: "Enforce Data Retention", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "3.5", title: "Securely Dispose of Data", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "3.6", title: "Encrypt Data on End-User Devices", points: { full: 2.5, partial: 1.25, none: 0 } },
      ],
    },
    {
      id: "access-identity",
      name: "Access & Identity Management",
      citation: "CIS Controls 5 & 6 \u2014 Account Management, Access Control Management",
      riskDescription: "Gaps in account and access management increase the risk of unauthorized system or data access.",
      safeguards: [
        { id: "5.1", title: "Establish and Maintain an Inventory of Accounts", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "5.2", title: "Use Unique Passwords", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "5.3", title: "Disable Dormant Accounts", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "5.4", title: "Restrict Administrator Privileges to Dedicated Administrator Accounts", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "6.1", title: "Establish an Access Granting Process", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "6.2", title: "Establish an Access Revoking Process", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "6.3", title: "Require MFA for Externally-Exposed Applications", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "6.4", title: "Require MFA for Remote Network Access", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "6.5", title: "Require MFA for Administrative Access", points: { full: 2.5, partial: 1.25, none: 0 } },
      ],
    },
    {
      id: "vulnerability-threat",
      name: "Vulnerability & Threat Management",
      citation: "CIS Controls 7 & 10 \u2014 Continuous Vulnerability Management, Malware Defenses",
      riskDescription: "Unpatched systems or inadequate malware defenses increase exposure to known exploits and malicious software.",
      safeguards: [
        { id: "7.1", title: "Establish and Maintain a Vulnerability Management Process", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "7.2", title: "Establish and Maintain a Remediation Process", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "7.3", title: "Perform Automated Operating System Patch Management", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "7.4", title: "Perform Automated Application Patch Management", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "10.1", title: "Deploy and Maintain Anti-Malware Software", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "10.2", title: "Configure Automatic Anti-Malware Signature Updates", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "10.3", title: "Disable Autorun and Autoplay for Removable Media", points: { full: 2.5, partial: 1.25, none: 0 } },
      ],
    },
    {
      id: "asset-recovery",
      name: "Asset Inventory & Data Recovery",
      citation: "CIS Controls 1 & 11 \u2014 Inventory and Control of Enterprise Assets, Data Recovery",
      riskDescription: "Unmanaged assets can go unnoticed, and weak data recovery can prevent restoring systems to a trusted state after an incident.",
      safeguards: [
        { id: "1.1", title: "Establish and Maintain Detailed Enterprise Asset Inventory", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "1.2", title: "Address Unauthorized Assets", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "11.1", title: "Establish and Maintain a Data Recovery Process", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "11.2", title: "Perform Automated Backups", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "11.3", title: "Protect Recovery Data", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "11.4", title: "Establish and Maintain an Isolated Instance of Recovery Data", points: { full: 2.5, partial: 1.25, none: 0 } },
      ],
    },
    {
      id: "vendor-oversight",
      name: "Vendor & Service Provider Oversight",
      citation: "CIS Control 15 \u2014 Service Provider Management",
      riskDescription: "Without a maintained inventory of service providers, this vendor's own third-party risk may go unmanaged.",
      safeguards: [
        { id: "15.1", title: "Establish and Maintain an Inventory of Service Providers", points: { full: 2.5, partial: 1.25, none: 0 } },
      ],
    },
    {
      id: "awareness-response",
      name: "Security Awareness & Incident Response",
      citation: "CIS Controls 14 & 17 \u2014 Security Awareness and Skills Training, Incident Response Management",
      riskDescription: "Insufficient security training or incident response readiness can slow detection and containment of a security incident.",
      safeguards: [
        { id: "14.1", title: "Establish and Maintain a Security Awareness Program", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "14.2", title: "Train Workforce Members to Recognize Social Engineering Attacks", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "14.3", title: "Train Workforce Members on Authentication Best Practices", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "14.4", title: "Train Workforce on Data Handling Best Practices", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "14.5", title: "Train Workforce Members on Causes of Unintentional Data Exposure", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "14.6", title: "Train Workforce Members on Recognizing and Reporting Security Incidents", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "14.7", title: "Train Workforce on How to Identify and Report if Their Enterprise Assets are Missing Security Updates", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "14.8", title: "Train Workforce on the Dangers of Connecting to and Transmitting Enterprise Data Over Insecure Networks", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "17.1", title: "Designate Personnel to Manage Incident Handling", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "17.2", title: "Establish and Maintain Contact Information for Reporting Security Incidents", points: { full: 2.5, partial: 1.25, none: 0 } },
        { id: "17.3", title: "Establish and Maintain an Enterprise Process for Reporting Incidents", points: { full: 2.5, partial: 1.25, none: 0 } },
      ],
    },
  ],
};

// Impact comes from the single vendor-level data-sensitivity question.
// The mapping and the matrix below are this tool's own disclosed methodology.
const IMPACT_MAP = GOVERNANCE_MATRIX.impactMap;
const RISK_MATRIX = GOVERNANCE_MATRIX.riskMatrix;

const GRADE_SCALE = "A: 90 and above, B: 80 to under 90, C: 70 to under 80, D: 60 to under 70, F: under 60";

const DATA_LABELS = {
  public: "public information only",
  internal: "internal business data",
  customer: "customer or employee records",
  regulated: "regulated data",
};

// Scores are summed in whole cents so grade cut-offs never fall to float error.
function toCents(n) {
  return Math.round(n * 100);
}

function letterGrade(cents) {
  if (cents >= 9000) return "A";
  if (cents >= 8000) return "B";
  if (cents >= 7000) return "C";
  if (cents >= 6000) return "D";
  return "F";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function generateAssessmentId(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return "TPT-" + y + m + d + "-" + h + min;
}

// Weakest-link Likelihood: one "none" answer drives the whole family to High,
// even if every other safeguard in it is Fully implemented. Averaging was
// explicitly rejected -- it can mask a single serious gap behind strong scores.
function familyLikelihood(safeguardResults) {
  const hasNone = safeguardResults.some((s) => s.tier === "none" || s.tier === null);
  if (hasNone) return "High";
  const hasPartial = safeguardResults.some((s) => s.tier === "partial");
  if (hasPartial) return "Moderate";
  return "Low";
}

function recommendedAction(safeguardResults) {
  const notImplemented = safeguardResults.filter((s) => s.tier === "none" || s.tier === null);
  if (notImplemented.length > 0) {
    const n = notImplemented.length;
    return "Prioritize " + n + (n === 1 ? " safeguard: " : " safeguards: ") + notImplemented.map((s) => s.id).join(", ");
  }
  const partial = safeguardResults.filter((s) => s.tier === "partial");
  if (partial.length > 0) {
    const n = partial.length;
    return "Strengthen " + n + (n === 1 ? " safeguard: " : " safeguards: ") + partial.map((s) => s.id).join(", ");
  }
  return "No immediate action needed.";
}

// answers shape:
// { "3.1": "full", "3.2": "partial", ..., "data-sensitivity": "customer" }
function computeAssessment(answers) {
  answers = answers || {};
  const familyResults = [];
  const riskRegister = [];
  let scoreCents = 0;
  let missingAnswers = false;
  let fullCount = 0;
  let partialCount = 0;
  let noneCount = 0;
  let totalSafeguards = 0;

  const dataSensitivity = answers["data-sensitivity"];
  if (!dataSensitivity || !(dataSensitivity in IMPACT_MAP)) {
    missingAnswers = true;
  }
  const impact = IMPACT_MAP[dataSensitivity] || null;

  GOVERNANCE_MATRIX.families.forEach((family) => {
    let familyCents = 0;
    let familyMaxCents = 0;
    const safeguardResults = [];

    family.safeguards.forEach((safeguard) => {
      totalSafeguards++;
      const tier = answers[safeguard.id];
      const maxForSafeguard = safeguard.points.full;
      familyMaxCents += toCents(maxForSafeguard);

      if (!tier || !(tier in safeguard.points)) {
        missingAnswers = true;
        safeguardResults.push({ id: safeguard.id, title: safeguard.title, tier: null, points: 0, maxPoints: maxForSafeguard });
        return;
      }

      if (tier === "full") fullCount++;
      else if (tier === "partial") partialCount++;
      else if (tier === "none") noneCount++;

      const earned = safeguard.points[tier];
      familyCents += toCents(earned);
      safeguardResults.push({ id: safeguard.id, title: safeguard.title, tier, points: earned, maxPoints: maxForSafeguard });
    });

    scoreCents += familyCents;
    familyResults.push({
      id: family.id,
      name: family.name,
      citation: family.citation,
      points: familyCents / 100,
      maxPoints: familyMaxCents / 100,
      safeguards: safeguardResults,
    });

    const likelihood = familyLikelihood(safeguardResults);
    const riskLevel = impact ? RISK_MATRIX[impact][likelihood] : null;
    riskRegister.push({
      family: family.name,
      citation: family.citation,
      riskDescription: family.riskDescription,
      likelihood,
      impact,
      riskLevel,
      recommendedAction: recommendedAction(safeguardResults),
    });
  });

  const now = new Date();
  const highRiskFamilies = riskRegister.filter((r) => r.riskLevel === "High").map((r) => r.family);

  return {
    score: scoreCents / 100,
    grade: letterGrade(scoreCents),
    families: familyResults,
    riskRegister,
    dataSensitivity,
    executiveSummary: {
      assessmentId: generateAssessmentId(now),
      date: now.toLocaleDateString(),
      totalSafeguards,
      fullCount,
      partialCount,
      noneCount,
      highRiskFamilies,
    },
    complete: !missingAnswers,
    framework: GOVERNANCE_MATRIX.framework,
    matrixVersion: GOVERNANCE_MATRIX.version,
  };
}

function joinList(items) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

// Builds the summary paragraph. Every sentence is derived from the computed
// result -- counts, levels, and the answers themselves. Nothing is free-written.
function buildNarrative(result, vendorName) {
  // An unfinished assessment has no valid score, so it never gets an explanatory paragraph.
  if (!result || !result.complete) return [];
  const name = vendorName || "This vendor";
  const es = result.executiveSummary;
  const register = result.riskRegister;
  const sentences = [];

  sentences.push(name + " scored " + result.score.toFixed(2) + " out of 100, a grade of " + result.grade + " on this tool's scale (" + GRADE_SCALE + ").");

  const counts = { High: 0, Moderate: 0, Low: 0 };
  register.forEach((r) => {
    counts[r.riskLevel]++;
  });
  const present = ["High", "Moderate", "Low"].filter((level) => counts[level] > 0);
  if (present.length === 1) {
    sentences.push("All " + register.length + " areas assessed are rated " + present[0] + " risk.");
  } else {
    const first = present[0];
    const clauses = [counts[first] + (counts[first] === 1 ? " is" : " are") + " rated " + first + " risk"].concat(
      present.slice(1).map((level) => counts[level] + " " + level)
    );
    sentences.push("Of the " + register.length + " areas assessed, " + joinList(clauses) + ".");
  }

  const impact = register[0].impact;
  sentences.push(
    "Impact is rated " + impact + " because the vendor was reported to handle " + DATA_LABELS[result.dataSensitivity] +
    ", and each area's likelihood is set by its weakest safeguard."
  );

  const strongGradeWithHighRisk = (result.grade === "A" || result.grade === "B") && counts.High > 0;
  const weakGradeWithoutHighRisk = (result.grade === "D" || result.grade === "F") && counts.High === 0;
  if (strongGradeWithHighRisk || weakGradeWithoutHighRisk) {
    sentences.push(
      "The grade reflects overall safeguard implementation, while risk levels also weigh the reported data sensitivity " +
      "and the weakest safeguard in each area, so the two can point in different directions."
    );
  }

  if (es.noneCount === 0) {
    if (es.partialCount === 0) {
      sentences.push("The vendor reported all " + es.totalSafeguards + " safeguards as fully implemented.");
    } else if (es.fullCount === 0) {
      sentences.push("The vendor reported all " + es.totalSafeguards + " safeguards as partially implemented.");
    } else {
      sentences.push(
        "All " + es.totalSafeguards + " safeguards were reported as at least partially implemented, " +
        es.partialCount + " of them only partially."
      );
    }
  } else if (es.noneCount === es.totalSafeguards) {
    sentences.push("The vendor reported all " + es.totalSafeguards + " safeguards as not implemented.");
  } else {
    const gaps = result.families
      .map((f) => ({ name: f.name, k: f.safeguards.filter((s) => s.tier === "none").length, n: f.safeguards.length }))
      .filter((f) => f.k > 0);
    const lead = "The vendor reported " + es.noneCount + (es.noneCount === 1 ? " safeguard" : " safeguards") + " as not implemented";
    if (gaps.length === 1) {
      sentences.push(lead + ", " + (es.noneCount === 1 ? "in " : "all in ") + gaps[0].name + " (" + gaps[0].k + " of its " + gaps[0].n + ").");
    } else {
      const most = Math.max.apply(null, gaps.map((g) => g.k));
      const leaders = gaps.filter((g) => g.k === most);
      if (leaders.length === 1) {
        sentences.push(lead + ", the most in " + leaders[0].name + " (" + leaders[0].k + " of its " + leaders[0].n + ").");
      } else {
        sentences.push(lead + ", the most in " + joinList(leaders.map((l) => l.name)) + " (" + most + " each).");
      }
    }
  }

  return sentences;
}

window.ThirdPartyTrust = { computeAssessment, buildNarrative, riskMatrix: RISK_MATRIX };
