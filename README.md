# Expense Tracker Application

Vanilla HTML, CSS, and JavaScript app for tracking daily income and expenses. Totals are calculated with `reduce()`, and records persist in Local Storage.

## Features

- Add income (deposit) and expense (withdraw) records
- Live balance, income, and expense summaries
- Category mix shown as percentage bubbles
- Filter recent transactions (all / income / expense)
- Delete records with event delegation
- Data saved under `expenseTrackerTransactions`

## Project structure

```text
expense-tracker/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── README.md
```

## How to run

Open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
```

## Usage

1. Choose **Income** or **Expense**.
2. Enter a description, amount (greater than 0), and category.
3. Submit the form — the dashboard and history update immediately.
4. Use **Deposit** / **Withdraw** on the home card to preselect type.
5. Refresh the page: transactions reload from Local Storage.

## Currency format

Amounts render as Pakistani rupees, for example `Rs. 50,000`.
