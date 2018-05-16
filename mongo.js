const LRU = require('lru-cache');
const monk = require('monk');

const table = process.env.JIRA_MONGO_TABLE !== undefined ? process.env.JIRA_MONGO_TABLE : 'ledger';

class EmailNotInLedgerError extends Error {
    constructor() {
        super();
        this.message = 'Email not in ledger';
    }
}

function getUri() {
    if (process.env.JIRA_MONGO_USERNAME === undefined 
        || process.env.JIRA_MONGO_PASSWORD === undefined 
        || process.env.JIRA_MONGO_HOST === undefined 
        || process.env.JIRA_MONGO_PORT === undefined 
        || process.env.JIRA_MONGO_DB === undefined) {
        throw new Error("Missing MongoDB Env Variable(s).");
    }
    return "mongodb://" 
        + process.env.JIRA_MONGO_USERNAME + ":" 
        + process.env.JIRA_MONGO_PASSWORD + "@" 
        + process.env.JIRA_MONGO_HOST + ":" 
        + process.env.JIRA_MONGO_PORT + "/" 
        + process.env.JIRA_MONGO_DB;
}

async function getLedgerValue(slackEmail) {
    const db = monk(getUri());
    const item = await db.get(table).findOne({
        slack: slackEmail
    });
    db.close();
    if (item === null) {
        throw new EmailNotInLedgerError();
    }
    return item.jira;
}

async function addLedgerValue(slackEmail, jiraEmail) {
    const db = monk(getUri());
    await db.get(table).update({
        slack: slackEmail
    }, {
        slack: slackEmail,
        jira: jiraEmail
    }, {
        upsert: true,
        w: 1
    });
    db.close();
}

module.exports = {
    EmailNotInLedgerError,
    getLedgerValue,
    addLedgerValue
}
