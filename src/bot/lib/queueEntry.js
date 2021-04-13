class QueueEntry {
  constructor(id, name, type, submittedBy) {
    this.id = id;
    this.name = name;
    this.type = type
    this.submittedBy = submittedBy;
  }
}

class ViewerLevel extends QueueEntry {
  constructor(levelId, levelName, submittedBy) {
    super(levelId, levelName, "level", submittedBy)
  }

  get display() {
    return `${this.name} (${this.id})`;
  }
}

class Creator extends QueueEntry {
  constructor(creatorId, creatorName, submittedBy) {
    super(creatorId, creatorName, "creator", submittedBy)
  }

  get display() {
    return `${this.name}'s Profile (@${this.id})`;
  }
}

module.exports = { ViewerLevel, Creator };
