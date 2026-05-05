// ============================================================
//  Gmail Add-on: Malicious Email Scorer
//  FILE: BlacklistManager.gs
//  PURPOSE: All blacklist CRUD operations and persistence
// ============================================================


// ============================================================
//  BLACKLIST MANAGER
// ============================================================

function isBlacklisted(email) {
  var props = PropertiesService.getUserProperties();
  var raw   = props.getProperty("blacklist");
  var list  = raw ? JSON.parse(raw) : [];
  return list.indexOf(email.toLowerCase().trim()) !== -1;
}

function addToBlacklist(e) {
  var email = e.parameters["senderEmail"].toLowerCase().trim();
  var props = PropertiesService.getUserProperties();
  var raw   = props.getProperty("blacklist");
  var list  = raw ? JSON.parse(raw) : [];

  if (list.indexOf(email) === -1) {
    list.push(email);
    props.setProperty("blacklist", JSON.stringify(list));
  }

  var updatedCard = buildAddOn(e)[0];

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
        .setText("🚫 " + email + " added to your blacklist."))
    .setNavigation(CardService.newNavigation().updateCard(updatedCard))
    .build();
}

function removeFromBlacklist(e) {
  var email = e.parameters["senderEmail"].toLowerCase().trim();
  var props = PropertiesService.getUserProperties();
  var raw   = props.getProperty("blacklist");
  var list  = raw ? JSON.parse(raw) : [];

  list = list.filter(function(item) { return item !== email; });
  props.setProperty("blacklist", JSON.stringify(list));

  var updatedCard = buildAddOn(e)[0];

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
        .setText("✅ " + email + " removed from your blacklist."))
    .setNavigation(CardService.newNavigation().updateCard(updatedCard))
    .build();
}

function viewFullBlacklist(e) {
  var props = PropertiesService.getUserProperties();
  var raw   = props.getProperty("blacklist");
  var list  = raw ? JSON.parse(raw) : [];

  var cardBuilder = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
        .setTitle("🚫 Your Blacklist")
        .setSubtitle("All addresses you've manually flagged"));

  if (list.length === 0) {
    cardBuilder.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText("Your blacklist is currently empty.")));
  } else {
    var listText = list.map(function(email) {
      return "• " + email;
    }).join("<br>");

    cardBuilder.addSection(CardService.newCardSection()
      .setHeader("Blocked Emails")
      .addWidget(CardService.newTextParagraph().setText(listText)));

    var clearAction = CardService.newAction().setFunctionName("clearEntireBlacklist");
    cardBuilder.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextButton()
          .setText("🗑️ Clear All")
          .setOnClickAction(clearAction)));
  }

  var backAction = CardService.newAction().setFunctionName("buildAddOn");
  cardBuilder.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextButton()
        .setText("← Back")
        .setOnClickAction(backAction)));

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(cardBuilder.build()))
    .build();
}

function clearEntireBlacklist() {
  PropertiesService.getUserProperties().deleteProperty("blacklist");

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Blacklist cleared."))
    .setNavigation(CardService.newNavigation().popCard())
    .build();
}
