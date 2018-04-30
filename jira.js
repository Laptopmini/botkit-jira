const utils = require('./utils');

async function getUser(key) {
    return new Promise((resolve, reject) => {
        const path = "/rest/api/2/user/search";
        const parameters = {
            username: key,
            maxResults: 1
        }
        utils.get(path, parameters).then((response) => {
            if (response.length > 0) {
                resolve(response[0]);
            } else {
                var err = new Error("User not found");
                err.code = 404;
                reject(err);
            }
        }).catch((error) => {
            reject(error);
        })
    });
}

async function isUserTeamMember(username) {
    return new Promise((resolve, reject) => {
        const path = '/rest/api/2/user';
        const parameters = {
            username: username,
            expand: 'groups'
        }
        utils.get(path, parameters).then((response) => {
            if (response.groups !== undefined && response.groups.items !== undefined) {
                const groups = response.groups.items;
                for (var key in groups) {
                    const name = groups[key].name;
                    if (name !== undefined && name == "Team All") {
                        resolve(true);
                        return;
                    }
                }
            }
            resolve(false);
        }).catch((error) => {
            reject(error);
        })
    });
}

module.exports = {
    getUser,
    isUserTeamMember
}