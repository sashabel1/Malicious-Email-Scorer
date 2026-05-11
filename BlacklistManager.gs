// ============================================================
//  Gmail Add-on: Malicious Email Scorer
//  FILE: BlacklistManager.gs
//  PURPOSE: All blacklist CRUD operations and persistence
// ============================================================


// ============================================================
//  BLACKLIST MANAGER
// ============================================================

/**
 * Checks if a specific email address exists in the user's personal blacklist.
 * Retrieves the data from the native Google PropertiesService.
 * * @param {string} email - The sender's email address to verify.
 * @returns {boolean} True if the email is in the blacklist, false otherwise.
 */
function isBlacklisted(email) {
  var props = PropertiesService.getUserProperties();
  var raw   = props.getProperty("blacklist");
  var list  = raw ? JSON.parse(raw) : [];
  return list.indexOf(email.toLowerCase().trim()) !== -1;
}

/**
 * Adds the current sender's email to the blacklist.
 * Triggered via a UI button click in the Add-on.
 * * @param {Object} e - The event object containing action parameters from the UI.
 * @returns {GoogleAppsScript.Card_Service.ActionResponse} A response that updates the current UI card and displays a success notification.
 */
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

/**
 * Removes the current sender's email from the blacklist.
 * Triggered via a UI button click in the Add-on.
 * * @param {Object} e - The event object containing action parameters from the UI.
 * @returns {GoogleAppsScript.Card_Service.ActionResponse} A response that updates the current UI card and displays a success notification.
 */
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

/**
 * Generates and displays a new UI card showing all currently blacklisted email addresses.
 * Provides an option to clear the entire list.
 * * @param {Object} e - The event object from the UI interaction.
 * @returns {GoogleAppsScript.Card_Service.ActionResponse} A response that pushes the new "Blacklist View" card to the navigation stack.
 */
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

/**
 * Completely deletes the "blacklist" property from the user's storage.
 * Triggered from the "View Full Blacklist" UI card.
 * * @returns {GoogleAppsScript.Card_Service.ActionResponse} A response that pops the current card (returning to the previous view) and shows a success notification.
 */
function clearEntireBlacklist() {
  PropertiesService.getUserProperties().deleteProperty("blacklist");

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Blacklist cleared."))
    .setNavigation(CardService.newNavigation().popCard())
    .build();
}
