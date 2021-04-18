const itHandlesLevelAsUrgent = require("../urgent.template-spec");

describe("the 'urgent' channel point reward", () => {
  itHandlesLevelAsUrgent(async (bot, levelId) => {
    await bot.command(levelId, "viewer", "reward-id-urgent");
  });
});
