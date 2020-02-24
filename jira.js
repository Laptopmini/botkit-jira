const utils = require('./utils');

class UserNotFoundError extends Error {
  constructor() {
    super();
    this.code = 404;
  }
}

async function getUser(key) {
  const path = '/rest/api/2/user/search';
  const parameters = {
    username: key,
    maxResults: 1
  };
  const response = await utils.get(path, parameters);
  if (!response.length) {
    throw new UserNotFoundError();
  }
  return response[0];
}

async function isUserTeamMember(email) {
  if (!!!process.env.JIRA_TEAM) {
    throw new Error('JIRA_TEAM env variable is missing.');
  }
  let user;
  try {
    user = await getUser(email);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      console.log(
        `notice: User with email "${email}" not found, access was denied.`
      );
      return false;
    }
    throw error;
  }

  const path = '/rest/api/2/user';
  const parameters = {
    accountId: user.accountId,
    expand: 'groups'
  };
  const response = await utils.get(path, parameters);
  if (!!response.groups && !!response.groups.items) {
    const { items } = response.groups;
    return !!items.find(item => item.name === process.env.JIRA_TEAM);
  }
  console.log(
    `notice: User "${
      user.displayName
    }" does not belong to target group, access was denied.`
  );
  return false;
}

module.exports = {
  getUser,
  isUserTeamMember
};
