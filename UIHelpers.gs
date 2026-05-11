// ============================================================
//  UI HELPERS
// ============================================================

/**
 * Translates the technical risk analysis object into a user-friendly HTML string.
 * This explanation is displayed on the main Add-on screen to help non-technical users understand the verdict.
 * * @param {Object} analysis - The final analysis object returned by calculateRisk().
 * @returns {string} An HTML-formatted string containing the simplified explanation and recommendation.
 */
function generateSimpleExplanation(analysis) {
  if (analysis.blacklisted) {
    return "🚫 <b>Blacklisted Sender!</b> You previously flagged this sender as dangerous. This email is automatically marked as Malicious.";
  }

  if (analysis.score < 30) {
    return "✅ <b>Everything looks good!</b> This email passed all major security checks. The sender's identity is verified, and no suspicious links or manipulation tactics were found.";
  }

  var text = "⚠️ <b>Why is this suspicious?</b><br>";
  text += "This email contains some red flags that typical phishing emails use. ";

  var reasonsStr = analysis.reasons.join(" ");
  if (reasonsStr.includes("Typosquatting")) {
    text += "The sender's domain looks like a fake version of a famous brand. ";
  }
  if (reasonsStr.includes("Authentication Failed")) {
    text += "The email identity could not be verified (it might be forged). ";
  }
  if (reasonsStr.includes("Obfuscation") || reasonsStr.includes("Open Redirect")) {
    text += "It uses hidden or shortened links to hide where they really go. ";
  }
  if (analysis.seVerdict.includes("detected")) {
    text += "The language used seems to be trying to pressure or trick you. ";
  }

  text += "<br><br><b>Recommendation:</b> Do not click any links or download attachments unless you are 100% sure of the sender.";
  return text;
}

/**
 * Provides a static educational dictionary of the 5 security signals.
 * Used to populate the "Signal Explanations" educational view.
 * * @returns {Array<Object>} An array of objects, where each object contains the title, meaning, and an actionable tip for a specific security signal.
 */
function generateSignalExplanations() {
  return [
    {
      title:   "📬 1. Domain Identity (Typosquatting)",
      meaning: "Scammers often create fake domains that look almost identical to trusted brands (like 'amaz0n.com' instead of 'amazon.com'). We check if the sender's domain is a genuine, recognized brand or a dangerous lookalike.",
      action:  "💡 Tip: Always inspect the full sender address, not just the display name."
    },
    {
      title:   "🔐 2. Email Authentication (Spoofing)",
      meaning: "Legitimate emails have invisible security stamps (SPF, DKIM, DMARC) proving they actually came from the claimed sender. If these are missing or fail, the email is likely forged.",
      action:  "💡 Tip: Think of this like a passport. If the stamps don't match, it's a fake ID."
    },
    {
      title:   "🔗 3. Link Safety Analysis",
      meaning: "We scan the email for risky link behavior. This includes having an unusually high volume of links, or using 'shorteners' and hidden redirects designed to trick you into visiting malicious websites.",
      action:  "💡 Tip: Hover your mouse over a link to see its real destination before clicking."
    },
    {
      title:   "🧠 4. AI Intent Detection",
      meaning: "Scammers use psychology to make you panic. Our AI analyzes the email's tone to detect manipulation tactics like fake urgency, threats, or requests for sensitive financial information.",
      action:  "💡 Tip: If an email makes you feel rushed or scared, pause and think twice."
    },
    {
      title:   "🚫 5. Personal Blacklist",
      meaning: "You have the power to manually block dangerous senders. Once you add an email address to your blacklist, any future message from them is automatically flagged as Malicious.",
      action:  "💡 Tip: Use the 'Add to Blacklist' button on the main screen to block repeat offenders."
    }
  ];
}


// ============================================================
//  CALLBACKS / NAVIGATION
// ============================================================

/**
 * Builds and navigates to a new UI card that explains the 5 core security signals.
 * Triggered by the "Signals Explanations" button on the main screen.
 * * @param {Object} e - The event object from the UI interaction.
 * @returns {GoogleAppsScript.Card_Service.ActionResponse} A navigation response that pushes the newly built explanation card onto the screen.
 */
function showSignalExplanations(e) {
  var explanations = generateSignalExplanations();

  var cardBuilder = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
        .setTitle("📖 Security Checks")
        .setSubtitle("How we analyze your emails"));

  cardBuilder.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
        .setText("Here is a simple explanation of the 5 core signals we check to keep your inbox safe:")));

  for (var i = 0; i < explanations.length; i++) {
    var exp = explanations[i];
    cardBuilder.addSection(CardService.newCardSection()
      .setHeader(exp.title)
      .addWidget(CardService.newTextParagraph().setText(exp.meaning))
      .addWidget(CardService.newTextParagraph().setText("<i>" + exp.action + "</i>"))); // הוספתי עיצוב נטוי לטיפ כדי שיבלוט
  }

  var backAction = CardService.newAction().setFunctionName("buildAddOn");
  cardBuilder.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextButton()
        .setText("← Back to Summary")
        .setOnClickAction(backAction)));

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(cardBuilder.build()))
    .build();
}
