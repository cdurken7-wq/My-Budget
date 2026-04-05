# MyBudget — Vercel Setup Guide

## Folder structure
```
mybudget-vercel/
├── vercel.json         ← Vercel config
├── package.json        ← Plaid dependency
├── index.html          ← The app
├── manifest.json
├── sw.js
├── icon-192.svg
├── icon-512.svg
└── api/                ← Backend functions (run on Vercel's servers)
    ├── _lib.js
    ├── create-link-token.js
    ├── exchange-token.js
    ├── transactions.js
    ├── connected-banks.js
    └── remove-bank.js
```

---

## Step 1 — Create a Vercel account
Go to vercel.com and sign up (free, use your GitHub account)

---

## Step 2 — Push to GitHub
In Terminal, inside the mybudget-vercel folder:

  git init
  git add .
  git commit -m "initial"

Then on github.com create a new PRIVATE repo called "mybudget"
and follow the instructions to push.

---

## Step 3 — Import to Vercel
1. Go to vercel.com/new
2. Click "Import Git Repository" → select your mybudget repo
3. Leave all build settings as default
4. Click Deploy

---

## Step 4 — Add environment variables
In Vercel → your project → Settings → Environment Variables, add:

  PLAID_CLIENT_ID    →  your client id
  PLAID_SECRET       →  your development secret
  PLAID_ENV          →  development

Then go to Deployments → click the 3 dots on latest → Redeploy

---

## Step 5 — Connect your bank
1. Open your app (Vercel gives you a URL like mybudget.vercel.app)
2. Add it to your home screen on iPhone
3. Go to Add → Connect a bank account
4. Log in with your real bank
5. After connecting, the app shows a TOKEN_STORE value — copy it
6. Go to Vercel → Environment Variables → add:

  TOKEN_STORE  →  (paste the value)

7. Redeploy once more — you're done!

---

## Future updates
When you get a new version from Claude:
  git add .
  git commit -m "update"
  git push

Vercel redeploys automatically. Your env vars stay saved.
