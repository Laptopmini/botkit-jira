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

async function isUserTeamMember(email) {
    let user;
    try {
        user = await getUser(email);
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            console.log(`notice: User with email "${email}" not found, access was denied.`);
            return false;
        }
        throw error;
    }

    const path = '/rest/api/2/user';
    const parameters = {
        username: user.name,
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
    console.log(`notice: User "${user.name}" does not belong to target group, access was denied.`);
    return false;
}

module.exports = {
    getUser,
    isUserTeamMember
}