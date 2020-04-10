class ViewerLevel {
	constructor(levelId, levelName, creatorAlias, creatorId, submittedBy) {
		this.levelId = levelId;
		this.levelName = levelName;
		this.creatorAlias = creatorAlias;
		this.creatorId = creatorId;
		this.submittedBy = submittedBy;
		this.cleared = false;
	}
}

module.exports = ViewerLevel;
