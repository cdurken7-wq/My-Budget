const { PlaidApi, PlaidEnvironments, Configuration } = require('plaid');

function getPlaidClient() {
  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'development'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  });
  return new PlaidApi(config);
}

function getTokenStore() {
  try {
    const raw = process.env.TOKEN_STORE;
    return raw ? JSON.parse(Buffer.from(raw, 'base64').toString()) : {};
  } catch (e) {
    return {};
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { getPlaidClient, getTokenStore, setCors };
