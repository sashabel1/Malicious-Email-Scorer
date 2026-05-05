// ============================================================
//  Gmail Add-on: Malicious Email Scorer
//  FILE: Code.gs
//  PURPOSE: Entry point — triggered when a Gmail message is opened
// ============================================================

function buildAddOn(e) {
  var messageId   = e.gmail.messageId;
  var accessToken = e.gmail.accessToken;
 
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var message = GmailApp.getMessageById(messageId);
 
  var sender     = message.getFrom();
  var subject    = message.getSubject();
  var body       = message.getPlainBody();
  var linkRegex  = new RegExp("https?:\\/\\/[^\\s]+", "g");
  var links      = body.match(linkRegex) || [];
  var rawContent = message.getRawContent();
 
  var analysis = calculateRisk(sender, subject, links, rawContent, body);
 
  var verdictColor = "#4CAF50"; // Default: Green
  if (analysis.verdict === "Malicious")  verdictColor = "#F44336"; // Red
  if (analysis.verdict === "Suspicious") verdictColor = "#FF9800"; // Orange
 
  var cardBuilder = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
        .setTitle("Shield Malware Scorer")
        .setSubtitle("Verdict: " + analysis.verdict));
 
  // --- TOP SECTION: Simple Summary ---
  cardBuilder.addSection(CardService.newCardSection()
    .setHeader("Risk Summary")
    .addWidget(CardService.newTextParagraph().setText("<b>Risk Score:</b> " + analysis.score + " / 100"))
    .addWidget(CardService.newTextParagraph().setText("<b>Verdict:</b> <font color='" + verdictColor + "'>" + analysis.verdict + "</font>")));
 
  // --- Simple Explanation ---
  var simpleExplanation = generateSimpleExplanation(analysis);
  cardBuilder.addSection(CardService.newCardSection()
    .setHeader("🔍 Simple Explanation (For Users)")
    .addWidget(CardService.newTextParagraph().setText(simpleExplanation)));
 
  // --- Technical Deep Dive (UPDATED) ---
  var deepDiveSection = CardService.newCardSection()
    .setHeader("🛠 Technical Deep Dive")
    .setCollapsible(true)
    .addWidget(CardService.newTextParagraph().setText("<b>5-Point Security Scan:</b>"));

  if (analysis.fiveSignals && analysis.fiveSignals.length > 0) {
    for (var i = 0; i < analysis.fiveSignals.length; i++) {
      deepDiveSection.addWidget(CardService.newTextParagraph().setText(analysis.fiveSignals[i]));
    }
  } else {
    deepDiveSection.addWidget(CardService.newTextParagraph().setText("Scan results unavailable."));
  }

  cardBuilder.addSection(deepDiveSection);
 
  // --- MORE OPTIONS SECTION ---
  var senderEmailMatch   = sender.match(new RegExp("<([^>]+)>"));
  var senderEmailClean   = senderEmailMatch ? senderEmailMatch[1] : sender;
  var alreadyBlacklisted = isBlacklisted(senderEmailClean);
 
  var moreOptionsSection = CardService.newCardSection()
    .setHeader("⚙️ More Options");
 
  // 1. Signals Explanation button
  var explainAction = CardService.newAction().setFunctionName("showSignalExplanations");
  moreOptionsSection.addWidget(CardService.newTextButton()
      .setText("📖 Signals Explanations")
      .setOnClickAction(explainAction)
      .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED));
 
  // 2. Add/Remove from Blacklist button
  var blacklistAction = CardService.newAction()
      .setFunctionName(alreadyBlacklisted ? "removeFromBlacklist" : "addToBlacklist")
      .setParameters({ "senderEmail": senderEmailClean });
 
  moreOptionsSection.addWidget(CardService.newTextButton()
      .setText(alreadyBlacklisted ? "✅ Remove from Blacklist" : "🚫 Add to Blacklist")
      .setOnClickAction(blacklistAction)
      .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED));
 
  // 3. View Full Blacklist button
  var viewBlacklistAction = CardService.newAction().setFunctionName("viewFullBlacklist");
  moreOptionsSection.addWidget(CardService.newTextButton()
      .setText("📋 View My Blacklist")
      .setOnClickAction(viewBlacklistAction)
      .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED));
 
  cardBuilder.addSection(moreOptionsSection);
 
  return [cardBuilder.build()];
}
