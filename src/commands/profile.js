const Logger = require("../logger.js");
const User = require("../models/user.js")

module.exports = function (api) {
  const s_currentUser = User.getCurrent(api)

  s_currentUser.onValue(({ name, email, preferredMFA }) => {
    const has2FA = (preferredMFA != null && preferredMFA !== "NONE") ? "yes": "no"
    Logger.println("You're currently logged in as:");
    Logger.println("Name:           ", name);
    Logger.println("Email:          ", email);
    Logger.println("Two factor auth:", has2FA);
  })

  s_currentUser.onError(Logger.error);
}
