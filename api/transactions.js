const { getPlaidClient, getTokenStore, setCors } = require('./_lib');

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

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const days = parseInt(req.query.days || '90');
  const store = getTokenStore();

  if (!Object.keys(store).length) {
    return res.json({ transactions: [], accounts: [] });
  }

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const client = getPlaidClient();
  const allTransactions = [];
  const allAccounts = [];

  for (const [itemId, { accessToken, institutionName }] of Object.entries(store)) {
    try {
      const response = await client.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: { count: 500, offset: 0 },
      });

      const txs = response.data.transactions.map(tx => ({
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

      const accounts = response.data.accounts.map(a => ({
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
      console.error(`Error fetching ${institutionName}:`, err.response?.data || err.message);
    }
  }

  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ transactions: allTransactions, accounts: allAccounts });
};
