// ============================================================
//  Gmail Add-on: Malicious Email Scorer
//  FILE: RiskCalculator.gs
//  PURPOSE: Core scoring engine + all signal helper functions
// ============================================================

// ============================================================
//  CORE RISK CALCULATOR
// ============================================================

function calculateRisk(sender, subject, links, rawContent, body) {
  var score = 0;
  var finalSignals = []; 
  var internalReasons = []; 
  var linkCount = links ? links.length : 0;

  // --- Extract sender email and domain ---
  var senderRegex      = new RegExp("<([^>]+)>");
  var senderEmailMatch = sender.match(senderRegex);
  var senderEmail      = senderEmailMatch ? senderEmailMatch[1].toLowerCase() : sender.toLowerCase();
  var senderDomain     = senderEmail.split("@")[1] ? senderEmail.split("@")[1] : "";

  // --- Signal 1: Blacklist check ---
  if (isBlacklisted(senderEmail)) {
    return generateBlacklistVerdict(senderEmail);
  }
  finalSignals.push("🟢 <b>1. Blacklist:</b> Sender is not on your blocklist.");

  // --- Signal 2: Domain Identity (Typosquatting) ---
  if (senderDomain) {
    if (TOP_BRANDS.includes(senderDomain)) {
      finalSignals.push("🟢 <b>2. Domain Identity:</b> Official brand recognized (" + senderDomain + ").");
    } else {
      var isTyposquat = TOP_BRANDS.some(function(brand) {
        var dist = getLevenshteinDistance(senderDomain, brand);
        if (dist === 1 || dist === 2) {
          score += 60;
          finalSignals.push("🔴 <b>2. Domain Identity:</b> Typosquatting alert! Looks suspiciously like '" + brand + "'.");
          internalReasons.push("Typosquatting");
          return true;
        }
        return false;
      });

      if (!isTyposquat) {
        finalSignals.push("🟠 <b>2. Domain Identity:</b> '" + senderDomain + "' is an unrecognized domain.");
      }
    }
  } else {
    finalSignals.push("🟠 <b>2. Domain Identity:</b> Could not extract domain.");
  }

  // --- Signal 3: Authentication headers ---
  var rawLower  = rawContent.toLowerCase();
  var spfPass   = rawLower.includes("spf=pass");
  var dkimPass  = rawLower.includes("dkim=pass");
  var dmarcPass = rawLower.includes("dmarc=pass") || rawLower.includes("dmarc=bestguesspass");

  var authDetails = (spfPass ? "✅" : "❌") + " SPF | " + (dkimPass ? "✅" : "❌") + " DKIM | " + (dmarcPass ? "✅" : "❌") + " DMARC";

  if (spfPass && dkimPass && dmarcPass) {
    finalSignals.push("🟢 <b>3. Authentication:</b> Passed all checks.<br><i>" + authDetails + "</i>");
  } else {
    var authPenalty = 0;
    if (!spfPass) authPenalty += 20;
    if (!dkimPass) authPenalty += 15;
    if (!dmarcPass) authPenalty += 5;
    score += authPenalty;

    finalSignals.push("🔴 <b>3. Authentication:</b> Missing or failed checks.<br><i>" + authDetails + "</i>");
    internalReasons.push("Authentication Failed");
  }

  // --- Signal 4: Link Safety Analysis ---
  var linkAnalysisResult = analyzeLinksDeep(links);
  score += linkAnalysisResult.penalty;
  if (linkCount > 3) score += 10;

  if (linkAnalysisResult.penalty > 0 || linkCount > 3) {
    var issues = [];
    if (linkCount > 3) issues.push("High volume (" + linkCount + " links)");
    if (linkAnalysisResult.penalty > 0) issues.push("Contains hidden or redirect links");
    
    finalSignals.push("🔴 <b>4. Link Safety:</b> Suspicious links detected.<br><i>" + issues.join(" | ") + "</i>");
    internalReasons.push("Obfuscation");
  } else {
    finalSignals.push("🟢 <b>4. Link Safety:</b> " + linkCount + " link(s) found. No threats detected.");
  }

  // --- Signal 5: AI Intent Analysis---
  var seResult = analyzeSocialEngineering(subject, body || "");
  if (seResult.isSocialEngineering) {
    var penalty = 0;
    if (seResult.confidence === "High")   penalty = 35;
    if (seResult.confidence === "Medium") penalty = 20;
    if (seResult.confidence === "Low")    penalty = 10;
    score += penalty;

    var tacticsStr = seResult.tactics.length > 0 ? " (" + seResult.tactics.join(", ") + ")" : "";
    
    finalSignals.push("🔴 <b>5. AI Intent Analysis:</b> Manipulation detected" + tacticsStr + ".<br><i>" + seResult.explanation + "</i>");
    internalReasons.push("Social Engineering detected");
  } else {
    finalSignals.push("🟢 <b>5. AI Intent Analysis:</b> No manipulation detected.<br><i>" + seResult.explanation + "</i>");
  }

  // --- Final verdict ---
  var verdict = "Safe";
  if (score >= 60)      verdict = "Malicious";
  else if (score >= 30) verdict = "Suspicious";

  return {
    score:       Math.min(score, 100),
    verdict:     verdict,
    fiveSignals: finalSignals, 
    reasons:     internalReasons,
    seVerdict:   seResult.isSocialEngineering ? "detected" : "safe",
    blacklisted: false
  };
}


// ============================================================
//  SIGNAL HELPERS
// ============================================================

function generateBlacklistVerdict(senderEmail) {
  return {
    score:       100,
    verdict:     "Malicious",
    fiveSignals: [
      "🔴 <b>1. Blacklist:</b> You manually flagged '" + senderEmail + "' as dangerous.",
      "⚪ <b>2. Domain Identity:</b> Skipped (Sender is blocked)",
      "⚪ <b>3. Authentication:</b> Skipped (Sender is blocked)",
      "⚪ <b>4. Link Safety:</b> Skipped (Sender is blocked)",
      "⚪ <b>5. AI Intent Analysis:</b> Skipped (Sender is blocked)"
    ],
    reasons:     ["Blacklisted"], 
    seVerdict:   "safe",
    blacklisted: true
  };
}

function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  var matrix = [];
  for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }

  for (var i = 1; i <= b.length; i++) {
    for (var j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1]     + 1,
          matrix[i - 1][j]     + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function analyzeLinksDeep(links) {
  var linkScorePenalty = 0;
  var linkReasons      = [];

  if (!links || links.length === 0) {
    return { penalty: 0, reasons: [] };
  }

  for (var i = 0; i < links.length; i++) {
    var link = links[i].toLowerCase();

    var isShortened = URL_SHORTENERS.some(function(s) { return link.includes(s); });
    if (isShortened) {
      linkScorePenalty += 15;
      linkReasons.push("🟠 <b>Obfuscation:</b> Found a shortened URL (" + links[i] + ").");
    }

    if (link.includes("redirect=") || link.includes("url?q=") || link.includes("returnurl=")) {
      linkScorePenalty += 20;
      linkReasons.push("🔴 <b>Open Redirect Suspicion:</b> URL contains redirect parameters (" + links[i] + ").");
    }
  }

  return { penalty: linkScorePenalty, reasons: linkReasons };
}

function analyzeSocialEngineering(subject, body) {
  var textLower = (subject + " " + body).toLowerCase();

  if (textLower.includes("urgent") || textLower.includes("password") || textLower.includes("account")) {
    return {
      isSocialEngineering: true,
      confidence: "High",
      tactics: ["Urgency", "Fear/Threat", "Account Manipulation"],
      explanation: "[MOCK API] Detected artificial urgency and pressure to access account credentials."
    };
  }

  if (textLower.includes("invoice") || textLower.includes("payment")) {
    return {
      isSocialEngineering: true,
      confidence: "Medium",
      tactics: ["Pretexting", "Financial Fraud"],
      explanation: "[MOCK API] Detected financial keywords often used in invoice fraud."
    };
  }

  return {
    isSocialEngineering: false,
    confidence: "Low",
    tactics: [],
    explanation: "[MOCK API] Content appears to be standard conversational or commercial text."
  };
}
