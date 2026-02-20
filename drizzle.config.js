const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'config/.env') });

module.exports = {
  schema: './src/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};