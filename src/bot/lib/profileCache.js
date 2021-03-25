const levels = {};
const creators = {};

class ProfileCache {
  addLevelsForCreator(creatorId, newLevels) {
    creators[creatorId] = creators[creatorId] || new Set();
    for (const level of newLevels) {
      this.removeLevel(level.id); // in case it somehow changed creatorId
      creators[creatorId].add(level.id);
      levels[level.id] = {
        creators: creators[creatorId],
        level
      };
    }
  }

  getLevelsForCreator(creatorId) {
    if (creators[creatorId]) {
      return Array.from(creators[creatorId]).map(l => levels[l].level);
    }
    return null;
  }

  updateLevel(level) {
    const entry = levels[level.id];
    if (entry) {
      for (const key of Object.keys(level)) {
        entry.level[key] = level[key];
      }
    }
  }

  removeLevel(levelId) {
    const entry = levels[levelId];
    if (entry) {
      entry.creators.delete(levelId);
      levels[levelId] = undefined;
    }
  }
}

module.exports = { ProfileCache };
