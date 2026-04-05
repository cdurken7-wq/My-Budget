const { getPlaidClient, getTokenStore, setCors } = require('./_lib');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { public_token, institution_name } = req.body;
    const client = getPlaidClient();
    const response = await client.itemPublicTokenExchange({ public_token });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const store = getTokenStore();
    store[itemId] = { accessToken, institutionName: institution_name || 'My Bank' };
    const encoded = Buffer.from(JSON.stringify(store)).toString('base64');

    console.log(`Connected: ${institution_name} (${itemId})`);

    res.json({
      success: true,
      item_id: itemId,
      institution: institution_name,
      token_store: encoded,
    });
  } catch (err) {
    console.error('exchange-token error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
};
