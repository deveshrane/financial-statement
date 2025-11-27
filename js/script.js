/********************************
 * Financial Statement – Fixed JS
 * Passive checkbox removed
 * Modal error fixed
 ********************************/

/* ------------------------
   Constants
   ------------------------*/
const INCOME_CATEGORIES = ["Earned", "Portfolio", "Passive", "Miscellaneous"];
const EXPENSE_CATEGORIES = ["Necessary", "Unnecessary"];
const LIABILITY_CATEGORIES = ["Equities", "Long Term Loans", "Current Liabilities"];
const ASSET_CATEGORIES = ["Fixed Assets", "Current Assets", "Depreciating Assets"];

/* ------------------------
   State
   ------------------------*/
let data = { income: [], expense: [], liabilities: [], assets: [] };
let highestProgress = 0;

/* ------------------------
   Utilities
   ------------------------*/
function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (m) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
    );
}

function showToast(message, variant = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${variant} shadow`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHtml(message)}</div>
            <button class="btn-close me-2 m-auto"></button>
        </div>`;
    container.appendChild(toast);

    toast.querySelector(".btn-close").onclick = () => toast.remove();
    setTimeout(() => toast.remove(), 2500);
}

/* ------------------------
   Render List Items
   ------------------------*/
function renderItemHTML(it, type, idx) {
    return `
    <div class="d-flex justify-content-between border-bottom py-1">
        <div>
            <strong>${escapeHtml(it.label)}</strong><br>
            <span class="text-secondary small">${escapeHtml(it.date)}</span>
        </div>
        <div class="text-end">
            ₹${Number(it.value).toLocaleString("en-IN")}
            <div>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="openEdit('${type}',${idx})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="requestDelete('${type}',${idx})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    </div>`;
}

function renderSection(container, categories, itemsArr, type) {
    container.innerHTML = "";
    categories.forEach(cat => {
        const id = `${type}-${cat.replace(/\s+/g, "_")}`;
        container.insertAdjacentHTML(
            "beforeend",
            `<div class="asset-section">
                <div class="asset-heading">${cat}</div>
                <div id="${id}" class="mt-2"></div>
            </div>`
        );
    });

    itemsArr.forEach((it, idx) => {
        const sec = container.querySelector(
            `#${type}-${it.subcategory.replace(/\s+/g, "_")}`
        );
        if (sec) sec.insertAdjacentHTML("beforeend", renderItemHTML(it, type, idx));
    });

    categories.forEach(cat => {
        const sec = container.querySelector(`#${type}-${cat.replace(/\s+/g, "_")}`);
        if (sec && !sec.innerHTML.trim())
            sec.innerHTML = `<p class="text-muted mb-0">No entries yet.</p>`;
    });
}

function renderList(type) {
    const el = document.getElementById(type + "List");

    if (type === "income") return renderSection(el, INCOME_CATEGORIES, data.income, "income");
    if (type === "expense") return renderSection(el, EXPENSE_CATEGORIES, data.expense, "expense");
    if (type === "liabilities") return renderSection(el, LIABILITY_CATEGORIES, data.liabilities, "liabilities");
    if (type === "assets") return renderSection(el, ASSET_CATEGORIES, data.assets, "assets");

    el.innerHTML = `<p class="text-muted">No entries yet.</p>`;
}

function renderAll() {
    ["income", "expense", "liabilities", "assets"].forEach(renderList);
    updateTotals();
}

/* ------------------------
   Totals & Ratios
   ------------------------*/
function updateTotals() {
    ["income", "expense", "liabilities", "assets"].forEach(type => {
        const sum = data[type].reduce((a, b) => a + Number(b.value || 0), 0);
        document.getElementById(type + "Total").textContent =
            "₹" + sum.toLocaleString("en-IN");
    });

    const cashFlow =
        data.income.reduce((a, b) => a + Number(b.value), 0) -
        data.expense.reduce((a, b) => a + Number(b.value), 0);
    document.getElementById("currentCashFlow").textContent =
        "₹" + cashFlow.toLocaleString("en-IN");

    // PASSIVE = income items with subcategory 'Passive'
    const passiveTotal = data.income
        .filter(it => it.subcategory === "Passive")
        .reduce((a, b) => a + Number(b.value), 0);

    document.getElementById("passiveIncome").textContent =
        "₹" + passiveTotal.toLocaleString("en-IN");

    const totalExp = data.expense.reduce((a, b) => a + Number(b.value), 0);
    const progress = totalExp === 0 ? 0 : Math.min(100, (passiveTotal / (2 * totalExp)) * 100);

    const current = Math.round(progress);
    if (current > highestProgress) highestProgress = current;

    document.getElementById("exitProgress").style.width = current + "%";
    document.getElementById("exitPercent").textContent = current + "%";
    document.getElementById("highestPercent").textContent = highestProgress + "%";

    const allDates = [...data.income, ...data.expense, ...data.assets, ...data.liabilities]
        .map(i => i.date)
        .filter(Boolean);

    document.getElementById("statementDate").textContent =
        allDates.length ? `(as on ${allDates.sort().reverse()[0]})` : "(as on -)";
}

/* ------------------------
   Modal Logic (fixed)
   ------------------------*/
const itemModal = new bootstrap.Modal(document.getElementById("itemModal"));

function openModal(type) {
    document.getElementById("modalType").value = type;
    document.getElementById("editIndex").value = "";
    document.getElementById("itemForm").reset();

    document.getElementById("incomeExpenseRadios").style.display =
        (type === "income" || type === "expense") ? "block" : "none";

    document.getElementById("liabilityRadios").classList.toggle(
        "d-none",
        type !== "liabilities"
    );

    document.getElementById("assetRadios").classList.toggle(
        "d-none",
        type !== "assets"
    );

    // Build radio group for income/expense
    if (type === "income" || type === "expense") {
        const cont = document.getElementById("incomeExpenseRadioContainer");
        const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        cont.innerHTML = cats
            .map(
                c => `
            <div class="form-check">
                <input class="form-check-input" type="radio" name="ieCategory" value="${c}">
                <label class="form-check-label">${c}</label>
            </div>`
            )
            .join("");
        cont.querySelector(".form-check-input").checked = true;
    }

    itemModal.show();
}

function openEdit(type, idx) {
    const it = data[type][idx];
    openModal(type);

    document.getElementById("modalLabel").value = it.label;
    document.getElementById("modalValue").value = it.value;
    document.getElementById("modalDate").value = it.date;
    document.getElementById("editIndex").value = idx;

    if (type === "income" || type === "expense") {
        const r = [...document.querySelectorAll('input[name="ieCategory"]')];
        r.forEach(x => (x.checked = x.value === it.subcategory));
    }
    if (type === "liabilities") {
        document.querySelectorAll('input[name="liabType"]').forEach(
            x => (x.checked = x.value === it.subcategory)
        );
    }
    if (type === "assets") {
        document.querySelectorAll('input[name="assetType"]').forEach(
            x => (x.checked = x.value === it.subcategory)
        );
    }
}

/* ------------------------
   Save Item
   ------------------------*/
document.getElementById("itemForm").addEventListener("submit", e => {
    e.preventDefault();

    const type = document.getElementById("modalType").value;
    const label = document.getElementById("modalLabel").value;
    const value = Number(document.getElementById("modalValue").value);
    const date = document.getElementById("modalDate").value;

    let subcat = "";

    if (type === "income" || type === "expense") {
        subcat = document.querySelector('input[name="ieCategory"]:checked').value;
    } else if (type === "liabilities") {
        subcat = document.querySelector('input[name="liabType"]:checked').value;
    } else if (type === "assets") {
        subcat = document.querySelector('input[name="assetType"]:checked').value;
    }

    const item = { label, value, date, subcategory: subcat };

    const idx = document.getElementById("editIndex").value;
    if (idx === "") data[type].push(item);
    else data[type][idx] = item;

    renderAll();
    itemModal.hide();
});

/* ------------------------
   Delete Item
   ------------------------*/
let deleteTarget = { type: "", idx: -1 };
const deleteModal = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));

function requestDelete(type, idx) {
    deleteTarget = { type, idx };
    deleteModal.show();
}

document.getElementById("confirmDeleteBtn").onclick = () => {
    const { type, idx } = deleteTarget;
    data[type].splice(idx, 1);
    renderAll();
    deleteModal.hide();
    showToast("Item deleted", "error");
};

/* ------------------------
   Export / Import (AES)
   ------------------------*/
let pendingEncryptedText = "";

document.getElementById("exportBtn").onclick = () => {
    document.getElementById("exportPassword").value = "";
    new bootstrap.Modal(document.getElementById("exportPasswordModal")).show();
};

document.getElementById("confirmExport").onclick = () => {
    const pass = document.getElementById("exportPassword").value.trim();
    if (!pass) return showToast("Password required", "warning");

    const payload = {
        income: data.income,
        expense: data.expense,
        liabilities: data.liabilities,
        assets: data.assets,
        highestProgress
    };

    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), pass).toString();
    const blob = new Blob([encrypted], { type: "text/plain" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "FS.enc";
    a.click();

    showToast("Exported", "success");
};

document.getElementById("importBtn").onclick = () => {
    const f = document.createElement("input");
    f.type = "file";
    f.accept = ".enc";
    f.onchange = e => {
        const reader = new FileReader();
        reader.onload = ev => {
            pendingEncryptedText = ev.target.result;
            document.getElementById("importPassword").value = "";
            new bootstrap.Modal(document.getElementById("importPasswordModal")).show();
        };
        reader.readAsText(e.target.files[0]);
    };
    f.click();
};

document.getElementById("confirmImport").onclick = () => {
    const pass = document.getElementById("importPassword").value.trim();
    if (!pass) return showToast("Password required", "warning");

    try {
        const decrypted = CryptoJS.AES.decrypt(pendingEncryptedText, pass).toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw 0;

        const obj = JSON.parse(decrypted);
        data.income = obj.income || [];
        data.expense = obj.expense || [];
        data.liabilities = obj.liabilities || [];
        data.assets = obj.assets || [];
        highestProgress = obj.highestProgress || 0;

        renderAll();
        showToast("Imported", "success");
    } catch {
        showToast("Incorrect password", "error");
    }
};

/* ------------------------
   Theme Toggle
   ------------------------*/
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.classList.replace("bi-moon-fill", "bi-sun-fill");
    themeToggle.setAttribute("aria-pressed", "true");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");

    themeToggle.setAttribute("aria-pressed", String(isDark));

    if (isDark) {
        themeIcon.classList.replace("bi-moon-fill", "bi-sun-fill");
        localStorage.setItem("theme", "dark");
    } else {
        themeIcon.classList.replace("bi-sun-fill", "bi-moon-fill");
        localStorage.setItem("theme", "light");
    }
});

/* ------------------------
   Expose for inline handlers
   ------------------------*/
window.openModal = openModal;
window.openEdit = openEdit;
window.requestDelete = requestDelete;

/* Initial render */
renderAll();