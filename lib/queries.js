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

exports.updateUser = async (id, name, username, profilePictureUrl) => {
  await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      name: name,
      username: username,
      profilePictureUrl: profilePictureUrl,
    },
  });
};

// Returns users without any sensitive info (password, tokens)
exports.searchUsers = async (query) => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        {
          username: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
  });
  const safeUsers = users.map((user) => {
    const { password, tokens, ...safeUser } = user;
    return safeUser;
  });
  return safeUsers;
};

/*------------------------------------
  Chat Queries
--------------------------------------*/

// Returns chats sorted by most recent messages, with messages sorted from oldest to newest
exports.getChatsForUser = async (userId) => {
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          id: userId,
        },
      },
    },
    orderBy: {
      messages: {
        _max: {
          timestamp: "desc",
        },
      },
    },
    include: {
      messages: {
        orderBy: {
          timestamp: "desc",
        },
        take: 1,
      },
      participants: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return chats;
};

exports.getChat = async (id) => {
  const chat = await prisma.chat.findUnique({
    where: {
      id: id,
    },
    include: {
      messages: {
        orderBy: {
          timestamp: "asc",
        },
      },
      participants: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return chat;
};

exports.doUsersExist = async (userIds) => {
  const userCount = await prisma.user.count({
    where: {
      id: {
        in: userIds,
      },
    },
  });

  if (userCount === userIds.length) {
    return true;
  }
  return false;
};

exports.createChat = async (participantIds) => {
  const chat = await prisma.chat.create({
    data: {
      participants: {
        connect: participantIds.map((id) => ({ id })),
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return chat;
};

exports.createGroupChat = async (name, participantIds) => {
  const chat = await prisma.chat.create({
    data: {
      name: name,
      isGroup: true,
      participants: {
        connect: participantIds.map((id) => ({ id })),
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return chat;
};

exports.updateChatName = async (id, name) => {
  await prisma.chat.update({
    where: {
      id: id,
      isGroup: true, // Only allow updating name for group chats, not individual chats
    },
    data: {
      name: name,
    },
  });
};

exports.addChatParticipants = async (id, participantIds) => {
  await prisma.chat.update({
    where: {
      id: id,
      isGroup: true, // Only allow adding participants to group chats, not individual chats
    },
    data: {
      participants: {
        connect: participantIds.map((id) => ({ id })),
      },
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
