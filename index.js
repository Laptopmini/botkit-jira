const LRU = require('lru-cache');
const jira = require('./jira');
const utils = require('./utils');
const mongo = require('./mongo');

const _accessCache = LRU({
    max: 100,
    maxAge: 1000 * 60 * 60 * 24 * 7 // expires after 7 days
});

async function isUserTeamMember(bot, slackUserId) {
    return new Promise((resolve, reject) => {
        if (slackUserId === undefined) {
            resolve(false);
            return;
        }
        const key = 'isUserTeamMember.' + slackUserId;
        if (_accessCache.has(key)) {
            resolve(_accessCache.get(key));
            return;
        }
        
        utils.getUserEmail(bot, slackUserId).then((email) => {
            const completion = (email) => {
                jira.getUser(email).then((user) => {
                    jira.isUserTeamMember(user.name).then((result) => {
                        _accessCache.set(key, result);
                        resolve(result);
                    }).catch((error) => {
                        reject(error);
                    })
                }).catch((error) => {
                    reject(error);
                });
            };

            if (utils.isEmailOfSamsungPartner(email)) {
                mongo.getLedgerValue(email).then((jiraEmail) => {
                    completion(jiraEmail);
                }).catch((error) => {
                    reject(error);
                });
            } else {
                completion(email);
            }
        }).catch((error) => {
            reject(error);
        });
    });
}

module.exports = {
    isUserTeamMember
}