const utils = require('./utils');

class UserNotFoundError extends Error {
    constructor() {
        super();
        this.code = 404;
    }
}

async function getUser(key) {
    const path = "/rest/api/2/user/search";
    const parameters = {
        username: key,
        maxResults: 1
    }
    const response = await utils.get(path, parameters);
    if (!response.length) {
        throw new UserNotFoundError();
    }
    return response[0];
}

async function isUserTeamMember(username) {
    const path = '/rest/api/2/user';
    const parameters = {
        username: username,
        expand: 'groups'
    }
    const response = await utils.get(path, parameters);
    if (response.groups !== undefined && response.groups.items !== undefined) {
        const groups = response.groups.items;
        for (var key in groups) {
            const name = groups[key].name;
            if (name !== undefined && name == "Team All") {
                return true;
            }
        }
    }
    return false;
}

module.exports = {
    UserNotFoundError,
    getUser,
    isUserTeamMember
}