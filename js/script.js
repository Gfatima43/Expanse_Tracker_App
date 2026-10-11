/**
 * Expense Tracker — vanilla JS
 * Persist income/expense records, compute totals with reduce(), and render the dashboard.
 */

const appName = "Expense Tracker";
const STORAGE_KEY = "expenseTrackerTransactions";

const form = document.querySelector("#transaction-form");
const descriptionInput = document.querySelector("#description-input");
const amountInput = document.querySelector("#amount-input");
const categoryInput = document.querySelector("#category-input");
const otherCategoryLabel = document.querySelector("#other-category-label");
const otherCategoryInput = document.querySelector("#other-category-input");
const filterSelect = document.querySelector("#filter-select");
const transactionList = document.querySelector("#transaction-list");
const formError = document.querySelector("#form-error");
const balanceValue = document.querySelector("#balance-value");
const balanceHint = document.querySelector("#balance-hint");
const incomeTotalEl = document.querySelector("#income-total");
const expenseTotalEl = document.querySelector("#expense-total");
const topCategoryValue = document.querySelector("#top-category-value");
const categoryBubbles = document.querySelector("#category-bubbles");
const focusAllBtn = document.querySelector("#focus-all-btn");
const clearAllBtn = document.querySelector("#clear-all-btn");

let transactions = [];
let balance = 0;

const BUBBLE_LAYOUT = [
  { top: "8%", left: "32%", size: 128 },
  { top: "18%", left: "62%", size: 96 },
  { top: "38%", left: "8%", size: 108 },
  { top: "42%", left: "48%", size: 118 },
  { top: "58%", left: "72%", size: 88 },
  { top: "6%", left: "6%", size: 84 },
];

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function formatCurrency(n) {
  const formatted = Number(n).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `Rs. ${formatted}`;
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => {
      return (
        item &&
        typeof item.id === "number" &&
        (item.type === "income" || item.type === "expense") &&
        typeof item.description === "string" &&
        typeof item.amount === "number" &&
        Number.isFinite(item.amount) &&
        typeof item.date === "string"
      );
    });
  } catch (error) {
    console.warn(`${appName}: stored data was reset because it could not be read.`, error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function calculateTotals() {
  const income = transactions.reduce((sum, txn) => {
    return txn.type === "income" ? sum + txn.amount : sum;
  }, 0);
  const expense = transactions.reduce((sum, txn) => {
    return txn.type === "expense" ? sum + txn.amount : sum;
  }, 0);
  balance = income - expense;
  return { income, expense, balance };
}

function showError(message) {
  formError.hidden = false;
  formError.textContent = message;
}

function clearError() {
  formError.hidden = true;
  formError.textContent = "";
}

function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderTransactions() {
  const filter = filterSelect.value;
  let filtered = transactions;
  if (filter === "income" || filter === "expense") {
    filtered = transactions.filter((txn) => txn.type === filter);
  }

  transactionList.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "No transactions yet";
    transactionList.appendChild(empty);
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach((txn) => {
    const item = document.createElement("li");
    item.className = "txn-item";

    const copy = document.createElement("div");
    copy.className = "txn-copy";

    const title = document.createElement("p");
    title.className = "txn-title";
    title.textContent = txn.description;

    const meta = document.createElement("p");
    meta.className = "txn-meta";
    const categoryLabel = txn.category ? `${txn.category} · ` : "";
    meta.textContent = `${categoryLabel}${formatDate(txn.date)}`;

    copy.appendChild(title);
    copy.appendChild(meta);

    const amount = document.createElement("span");
    amount.className = `txn-amount ${txn.type}`;
    const sign = txn.type === "income" ? "+" : "−";
    amount.textContent = `${sign}${formatCurrency(txn.amount)}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", `Delete ${txn.description}`);
    deleteBtn.dataset.id = String(txn.id);
    deleteBtn.textContent = "×";

    item.appendChild(copy);
    item.appendChild(amount);
    item.appendChild(deleteBtn);
    transactionList.appendChild(item);
  });
}

function expenseByCategory() {
  return transactions.reduce((map, txn) => {
    if (txn.type !== "expense") {
      return map;
    }
    const key = txn.category || "Other";
    map[key] = (map[key] || 0) + txn.amount;
    return map;
  }, {});
}

function renderCategoryBubbles(expenseTotal) {
  categoryBubbles.replaceChildren();
  const grouped = expenseByCategory();
  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "bubble";
    placeholder.style.top = "28%";
    placeholder.style.left = "28%";
    placeholder.style.width = "140px";
    placeholder.style.height = "140px";
    const strong = document.createElement("strong");
    strong.textContent = "0%";
    const span = document.createElement("span");
    span.textContent = "No expenses yet";
    placeholder.appendChild(strong);
    placeholder.appendChild(span);
    categoryBubbles.appendChild(placeholder);
    return;
  }

  entries.slice(0, BUBBLE_LAYOUT.length).forEach(([name, amount], index) => {
    const layout = BUBBLE_LAYOUT[index];
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.style.top = layout.top;
    bubble.style.left = layout.left;
    bubble.style.width = `${layout.size}px`;
    bubble.style.height = `${layout.size}px`;

    const percent = expenseTotal > 0 ? Math.round((amount / expenseTotal) * 1000) / 10 : 0;
    const strong = document.createElement("strong");
    strong.textContent = `${percent}%`;
    const span = document.createElement("span");
    span.textContent = name;
    bubble.appendChild(strong);
    bubble.appendChild(span);
    categoryBubbles.appendChild(bubble);
  });
}

function renderSummary() {
  const totals = calculateTotals();
  balanceValue.textContent = formatCurrency(totals.balance);
  balanceValue.classList.toggle("is-positive", totals.balance > 0);
  balanceValue.classList.toggle("is-negative", totals.balance < 0);

  if (totals.balance > 0) {
    balanceHint.textContent = "This month looks healthy";
  } else if (totals.balance < 0) {
    balanceHint.textContent = "Spending is ahead of income";
  } else {
    balanceHint.textContent = "Add income to get started";
  }

  incomeTotalEl.textContent = formatCurrency(totals.income);
  expenseTotalEl.textContent = formatCurrency(totals.expense);

  const grouped = expenseByCategory();
  const top = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
  const topLabel = document.querySelector(".mini-stats div:nth-child(2) .mini-label");
  if (top) {
    topLabel.textContent = top[0];
    topCategoryValue.textContent = formatCurrency(top[1]);
  } else {
    topLabel.textContent = "Clothes and Dress";
    topCategoryValue.textContent = formatCurrency(0);
  }

  renderCategoryBubbles(totals.expense);
}

function addTransaction(e) {
  e.preventDefault();
  clearError();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const typeInput = form.querySelector('input[name="type"]:checked');
  const type = typeInput ? typeInput.value : "income";
  let category = categoryInput.value;

  if (!description) {
    showError("Please enter a description.");
    descriptionInput.focus();
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    showError("Amount must be a number greater than 0.");
    amountInput.focus();
    return;
  }

  // If "Other" is selected and a custom label was typed, use that label
  if (category === "Other") {
    const customLabel = otherCategoryInput.value.trim();
    if (customLabel) {
      category = customLabel;
    }
  }

  const transaction = {
    id: generateId(),
    type,
    description,
    amount,
    date: new Date().toISOString(),
    category: type === "income" ? "Income" : category,
  };

  transactions.push(transaction);
  saveTransactions();
  form.reset();
  form.querySelector('input[name="type"][value="income"]').checked = true;
  categoryInput.value = "Income";
  otherCategoryLabel.hidden = true;
  otherCategoryInput.value = "";
  renderSummary();
  renderTransactions();
}

function deleteTransaction(id) {
  transactions = transactions.filter((txn) => txn.id !== id);
  saveTransactions();
  renderSummary();
  renderTransactions();
}

function syncCategoryWithType() {
  const typeInput = form.querySelector('input[name="type"]:checked');
  const type = typeInput ? typeInput.value : "income";
  if (type === "income") {
    categoryInput.value = "Income";
    otherCategoryLabel.hidden = true;
  } else if (categoryInput.value === "Income") {
    categoryInput.value = "Other";
    otherCategoryLabel.hidden = false;
  }
}

// Show/hide the custom category text input based on whether "Other" is selected
function toggleOtherCategory() {
  const isOther = categoryInput.value === "Other";
  otherCategoryLabel.hidden = !isOther;
  if (isOther) {
    otherCategoryInput.focus();
  }
}

function init() {
  transactions = loadTransactions();

  form.addEventListener("submit", addTransaction);
  filterSelect.addEventListener("change", renderTransactions);

  // Listen for type and category changes inside the form
  form.addEventListener("change", (event) => {
    if (event.target.name === "type") {
      syncCategoryWithType();
    }
    if (event.target.name === "category") {
      toggleOtherCategory();
    }
  });

  // Deposit / Withdraw preset buttons
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.getAttribute("data-preset");
      const radio = form.querySelector(`input[name="type"][value="${preset}"]`);
      if (radio) {
        radio.checked = true;
        syncCategoryWithType();
      }
      descriptionInput.focus();
    });
  });

  // Delete individual transaction
  transactionList.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-btn");
    if (!button) {
      return;
    }
    deleteTransaction(Number(button.dataset.id));
  });

  // Clear All — remove every transaction after confirmation
  clearAllBtn.addEventListener("click", () => {
    if (transactions.length === 0) {
      return;
    }
    const confirmed = window.confirm("Clear all transactions? This cannot be undone.");
    if (confirmed) {
      transactions = [];
      saveTransactions();
      filterSelect.value = "all";
      renderSummary();
      renderTransactions();
    }
  });

  // View All in expenses panel
  focusAllBtn.addEventListener("click", () => {
    filterSelect.value = "all";
    renderTransactions();
    transactionList.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  renderSummary();
  renderTransactions();
}

document.addEventListener("DOMContentLoaded", init);
