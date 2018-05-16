const LRU = require('lru-cache');
const jira = require('./jira');
const utils = require('./utils');
const mongo = require('./mongo');

const _accessCache = LRU({
    max: 100,
    maxAge: 1000 * 60 * 60 * 24 * 7 // expires after 7 days
});

async function isUserTeamMember(bot, slackUserId) {
    if (slackUserId === undefined) return false;
    const key = 'isUserTeamMember.' + slackUserId;
    if (_accessCache.has(key)) return _accessCache.get(key);
    const email = await utils.getUserEmail(bot, slackUserId);
    const completion = async (email) => {
        const result = await jira.isUserTeamMember(email);
        _accessCache.set(key, result);
        return result;
    };
    if (utils.isEmailOfSamsungPartner(email)) {
        try {
            const jiraEmail = await mongo.getLedgerValue(email);
            return await completion(jiraEmail);
        } catch (error) {
            if (error instanceof mongo.EmailNotInLedgerError) {
                return await completion(email);
            }
            throw error;
        }
    }
    return await completion(email);
}

async function addEmailToUserLedger(slackEmail, jiraEmail) {
    return mongo.addLedgerValue(slackEmail, jiraEmail);
}

module.exports = {
    isUserTeamMember,
    addEmailToUserLedger
}