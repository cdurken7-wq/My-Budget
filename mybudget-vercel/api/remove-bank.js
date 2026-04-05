const { getPlaidClient, getTokenStore, setCors } = require('./_lib');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const itemId = req.query.itemId;
  const store = getTokenStore();

  if (store[itemId]) {
    try {
      const client = getPlaidClient();
      await client.itemRemove({ access_token: store[itemId].accessToken });
    } catch (e) {}
    delete store[itemId];
    const encoded = Buffer.from(JSON.stringify(store)).toString('base64');
    return res.json({ success: true, token_store: encoded });
  }
  res.json({ success: true });
};
