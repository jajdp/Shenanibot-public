const Rumpus = require("@bscotch/rumpus-ce");

const bookmarks = [];

const makeLevel = (_id, levelId, title, userId) => {
  return {
    _id, levelId, title, userId,
    avatarUrl: () => "http://localhost/avatar.png",
    stats: {}
  };
};

beforeAll(function () {
  this.bookmarks = bookmarks;
});

beforeEach(() => {
  bookmarks.length = 0;
});

class MockRumpusCE {
  constructor(_) {
    this.levelhead = {
      levels: {
        search: ({levelIds, userIds, includeMyInteractions,
                  limit, tiebreakerItemId}) => {
          const validLevelMatch = levelIds && levelIds.match(/^valid(\d\d)$/);
          if (validLevelMatch) {
            return [{
              title: `Valid Level ${validLevelMatch[1]}`
            }]
          }
          const eLvlMatch = levelIds && levelIds.match(/^(\d\d\d)l(\d\d\d)$/);
          if (eLvlMatch && eLvlMatch[1] >= eLvlMatch[2]) {
            return [{
              title: `Employee ${eLvlMatch[1]} Level ${eLvlMatch[2]}`
            }];
          }
          const playedMatch = levelIds && levelIds.match(/^played(\d)$/);
          if (playedMatch) {
            const playedLevel = {
              title: `Played Level ${playedMatch[1]}`
            };
            if (includeMyInteractions) {
              playedLevel.interactions = {played: true};
            }
            return [playedLevel];
          }
          const beatenMatch = levelIds && levelIds.match(/^beaten(\d)$/);
          if (beatenMatch) {
            const beatenLevel = {
              title: `Cleared Level ${beatenMatch[1]}`
            };
            if (includeMyInteractions) {
              beatenLevel.interactions = {played: true, completed: true};
            }
            return [beatenLevel];
          }

          const empMatch = userIds && userIds.match(/^emp(\d\d\d)$/);
          if (empMatch) {
            const levels = [];
            const min = (tiebreakerItemId || 0) + 1
            const max = Math.min(empMatch[1], min + limit - 1);
            for (let i = min; i <= max; i++) {
              const n = (i < 100 ? "0" : "") + (i < 10 ? "0" : "") + i;
              levels.push(makeLevel(i, `${empMatch[1]}l${n}`,
                                    `Employee ${empMatch[1]} Level ${n}`,
                                     userIds));
            }
            return levels;
          }

          return [];
        }
      },
      players: {
        search: ({userIds, includeAliases}) => {
          const validCreatorMatch = userIds.match(/^emp(\d\d\d)$/);
          if (validCreatorMatch) {
            return [{
              alias: includeAliases ? {
                alias: `EmployEE ${validCreatorMatch[1]}`
              } : undefined
            }]
          }
          return [];
        }
      },
      bookmarks: {
        add: id => {
          bookmarks.push(id);
        },
        remove: id => {
          bookmarks.splice(bookmarks.indexOf(id), 1);
        }
      }
    }
  }
};

Rumpus.RumpusCE = MockRumpusCE;
