const queries = require("../lib/queries");

const RANDOM_STRANGERS = "random strangers";

async function ensureRandomStrangers() {
  const chat = await queries.ensureGroupChat(RANDOM_STRANGERS);
  return chat;
}

module.exports = { ensureRandomStrangers };
