const { prisma } = require("./prisma.js");

/*------------------------------------
  User Queries
--------------------------------------*/
exports.getAllUsers = async () => {
  const users = await prisma.user.findMany();
  return users;
};

exports.getUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  return user;
};

exports.getUserByName = async (username) => {
  const user = await prisma.user.findUnique({ where: { username: username } });
  return user;
};

// Returns true if user is created, false if username is already in use
exports.createUser = async (name, username, password, profileURL) => {
  const user = await prisma.user.findUnique({ where: { username: username } });
  if (!user) {
    await prisma.user.create({
      data: {
        name: name,
        username: username,
        password: password,
        profilePictureUrl: profileURL,
      },
    });
    return true;
  }
  return false;
};

exports.deleteUser = async (id) => {
  await prisma.user.delete({
    where: {
      id: id,
    },
  });
};

exports.updateUser = async (data) => {
  await prisma.user.update({
    where: {
      id: data.id,
    },
    data: {
      name: data.name,
      username: data.username,
      password: data.password,
      profilePictureUrl: data.profilePictureUrl,
    },
  });
};

/*------------------------------------
  Token Queries
--------------------------------------*/

exports.saveRefreshToken = async (token, userId, expiresAt) => {
  await prisma.token.create({
    data: {
      token: token,
      userId: userId,
      expires_at: expiresAt,
    },
  });
};

exports.getToken = async (token) => {
  const stored = await prisma.token.findUnique({
    where: {
      token: token,
    },
    include: {
      user: true,
    },
  });
  return stored;
};

exports.revokeToken = async (token) => {
  await prisma.token.update({
    where: {
      token: token,
    },
    data: {
      revoked: true,
    },
  });
};
