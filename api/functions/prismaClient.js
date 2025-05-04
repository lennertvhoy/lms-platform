const { PrismaClient } = require('@prisma/client');

// Instantiate a single PrismaClient for the function app
const prisma = new PrismaClient();

module.exports = prisma; 