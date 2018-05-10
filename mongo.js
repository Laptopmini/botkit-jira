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
    return new Promise((resolve, reject) => {
        let db;
        try {
            db = monk(getUri());
        } catch (error) {
            reject(error);
            return;
        }

        db.get(table).findOne({
            slack: slackEmail
        }).then((item) => {
            if (item === null) {
                reject(new EmailNotInLedgerError());
                return;
            }
            resolve(item.jira);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function addLedgerValue(slackEmail, jiraEmail) {
    return new Promise((resolve, reject) => {
        let db;
        try {
            db = monk(getUri());
        } catch (error) {
            reject(error);
            return;
        }
        
        db.get(table).update({
            slack: slackEmail
        }, {
            slack: slackEmail,
            jira: jiraEmail
        }, {
            upsert: true,
            w: 1
        }).then((item) => {
            resolve();
        }).catch((error) => {
            reject(error);
        }).then(() => {
            db.close();
        });
    })
}

module.exports = {
    EmailNotInLedgerError,
    getLedgerValue,
    addLedgerValue
}
