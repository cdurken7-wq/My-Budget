require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_BASE = 'https://development.plaid.com';

const accessTokens = {};

async function plaidPost(path, body) {
  const res = await fetch(`${PLAID_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    has_client_id: !!PLAID_CLIENT_ID,
    has_secret: !!PLAID_SECRET,
    plaid_base: PLAID_BASE,
  });
});

app.post('/create-link-token', async (req, res) => {
  try {
    const data = await plaidPost('/link/token/create', {
      user: { client_user_id: 'personal-budget-user' },
      client_name: 'MyBudget',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    if (data.link_token) {
      res.json({ link_token: data.link_token });
    } else {
      console.error('Plaid error:', JSON.stringify(data));
      res.status(500).json({ error: data });
    }
  } catch (err) {
    console.error('create-link-token error:', err.message, err.cause);
    res.status(500).json({ error: err.message, cause: String(err.cause) });
  }
});

app.post('/exchange-token', async (req, res) => {
  const { public_token, institution_name } = req.body;
  try {
    const data = await plaidPost('/item/public_token/exchange', { public_token });
    const accessToken = data.access_token;
    const itemId = data.item_id;
    accessTokens[itemId] = { accessToken, institutionName: institution_name || 'My Bank' };
    console.log(`Connected: ${institution_name} (${itemId})`);
    res.json({ success: true, item_id: itemId, institution: institution_name });
  } catch (err) {
    console.error('exchange-token error:', err.message, err.cause);
    res.status(500).json({ error: err.message });
  }
});

app.get('/transactions', async (req, res) => {
  const { days = 90 } = req.query;
  if (Object.keys(accessTokens).length === 0) {
    return res.json({ transactions: [], accounts: [] });
  }
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const allTransactions = [];
  const allAccounts = [];

  for (const [itemId, { accessToken, institutionName }] of Object.entries(accessTokens)) {
    try {
      const data = await plaidPost('/transactions/get', {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { count: 500, offset: 0 },
      });
      const txs = (data.transactions || []).map(tx => ({
        id: tx.transaction_id,
        desc: tx.merchant_name || tx.name,
        amount: Math.abs(tx.amount),
        cat: mapPlaidCategory(tx.personal_finance_category?.primary || tx.category?.[0]),
        date: tx.date,
        type: tx.amount > 0 ? 'expense' : 'income',
        institution: institutionName,
        pending: tx.pending,
      }));
      allTransactions.push(...txs);
      const accounts = (data.accounts || []).map(a => ({
        id: a.account_id,
        name: a.name,
        institution: institutionName,
        type: a.type,
        subtype: a.subtype,
        balance: a.balances.current,
        available: a.balances.available,
      }));
      allAccounts.push(...accounts);
    } catch (err) {
      console.error(`Error fetching ${institutionName}:`, err.message);
    }
  }

  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ transactions: allTransactions, accounts: allAccounts });
});

app.get('/connected-banks', (req, res) => {
  const banks = Object.entries(accessTokens).map(([itemId, { institutionName }]) => ({
    itemId, institutionName,
  }));
  res.json({ banks });
});

app.delete('/bank/:itemId', async (req, res) => {
  const { itemId } = req.params;
  if (accessTokens[itemId]) {
    try {
      await plaidPost('/item/remove', { access_token: accessTokens[itemId].accessToken });
    } catch (e) {}
    delete accessTokens[itemId];
  }
  res.json({ success: true });
});

function mapPlaidCategory(plaidCat) {
  if (!plaidCat) return 'Other';
  const cat = plaidCat.toUpperCase();
  if (cat.includes('FOOD') || cat.includes('RESTAURANT') || cat.includes('DINING')) return 'Dining';
  if (cat.includes('GROCER') || cat.includes('SUPERMARKET')) return 'Groceries';
  if (cat.includes('TRANSPORT') || cat.includes('TRAVEL') || cat.includes('GAS') || cat.includes('TAXI') || cat.includes('UBER') || cat.includes('LYFT')) return 'Transport';
  if (cat.includes('RENT') || cat.includes('MORTGAGE') || cat.includes('HOUSING')) return 'Housing';
  if (cat.includes('ENTERTAIN') || cat.includes('STREAMING') || cat.includes('RECREATION')) return 'Entertainment';
  if (cat.includes('MEDICAL') || cat.includes('HEALTH') || cat.includes('PHARMACY')) return 'Health';
  if (cat.includes('SHOP') || cat.includes('RETAIL') || cat.includes('MERCHANDISE')) return 'Shopping';
  if (cat.includes('UTIL') || cat.includes('ELECTRIC') || cat.includes('INTERNET') || cat.includes('PHONE')) return 'Utilities';
  if (cat.includes('INCOME') || cat.includes('PAYROLL') || cat.includes('DEPOSIT')) return 'Income';
  return 'Other';
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ MyBudget server running on port ${PORT}`);
  console.log(`Plaid base: ${PLAID_BASE}`);
  console.log(`Client ID set: ${!!PLAID_CLIENT_ID}`);
  console.log(`Secret set: ${!!PLAID_SECRET}`);
});
