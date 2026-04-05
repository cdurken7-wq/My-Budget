const { getPlaidClient, setCors } = require('./_lib');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: 'mybudget-personal-user' },
      client_name: 'MyBudget',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error('create-link-token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create link token' });
  }
};
