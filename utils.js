const request = require('request');

function getAuthorizationHeaderValue() {
    const user = process.env.JIRA_USER;
    const key = process.env.JIRA_KEY;
    if (user !== undefined && key !== undefined) {
        return "Basic " + Buffer.from(user + ":" + key).toString('base64');
    }
    throw new Error("JIRA_USER and/or JIRA_KEY env variable is missing.");
}

function encodeParameters(parameters, keys) {
    const finalKeys = keys !== undefined ? keys : Object.keys(parameters);
    return finalKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(parameters[k])}`).join('&');
}

function isEmailOfSamsungPartner(email) {
    return /@partner.samsung.com\s*$/.test(email);
}

function getUserEmail(bot, slackId) {
    return new Promise((resolve, reject) => {
        bot.api.users.info({user: slackId}, (error, response) => {
            if (error) {
                reject(error);
                return;       
            }
            resolve(response.user.profile.email);
        });
    });
}

function get(path, parameters = undefined) {
    return new Promise((resolve, reject) => {
        if (process.env.JIRA_HOST === undefined) {
            reject(new Error("JIRA_HOST env variable is missing."));
            return;
        }
        var authHeaderValue;
        try {
            authHeaderValue = getAuthorizationHeaderValue();
        } catch (error) {
            reject(error);
            return;
        }
        
        var finalUrl = process.env.JIRA_HOST + path;
        if (parameters !== undefined) {
            finalUrl += '?' + encodeParameters(parameters);
        }

        request.get({
            url: finalUrl,
            json: true,
            headers: {
                'Authorization': authHeaderValue,
                'User-Agent': 'request'
            }
        }, (error, res, data) => {
            if (error) {
                reject(error);
            } else if (res.statusCode !== 200) {
                var err = new Error("Received an invalid status code from response. [" + res.statusCode + "]");
                err.code = res.statusCode;
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

module.exports = {
    isEmailOfSamsungPartner,
    getUserEmail,
    get
}