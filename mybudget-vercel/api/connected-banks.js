const { getTokenStore, setCors } = require('./_lib');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const store = getTokenStore();
  const banks = Object.entries(store).map(([itemId, { institutionName }]) => ({
    itemId,
    institutionName,
  }));
  res.json({ banks });
};
