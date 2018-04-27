const LRU = require('lru-cache');

const table = process.env.JIRA_MONGO_TABLE !== undefined ? process.env.JIRA_MONGO_TABLE : 'ledger';

function checkLedger() {
    if (_ledger === undefined) {
        throw new Error("Ledger needs to be pulled at least once before getting values from it.");
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
        const db = monk(getUri());
        const collection = db.get(table);

        collection.findOne({
            slack: slackEmail
        }).then((item) => {
            resolve(item.jira);
        }).catch((error) => {
            reject(error);
        });
    });
}

async function addLedgerValue(slackEmail, jiraEmail) {
    return new Promise((resolve, reject) => {
        const db = monk(getUri());
        const collection = db.get(table);

        collection.update({
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
    getLedgerValue,
    addLedgerValue
}
