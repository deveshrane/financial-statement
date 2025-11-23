/* YOUR ORIGINAL JS CODE (UNCHANGED EXCEPT DECIMAL + DARK MODE AT END) */
const INCOME_CATEGORIES = ["Earned", "Portfolio", "Passive", "Miscellaneous"];
const EXPENSE_CATEGORIES = ["Necessary", "Unnecessary"];
let data = { income: [], expense: [], liabilities: [], assets: [] };
let subcategories = {
    income: [],
    expense: [],
    liabilities: [],
    assets: [],
};

const LIABILITY_CATEGORIES = [
    "Equities",
    "Long Term Loans",
    "Current Liabilities",
];
const ASSET_CATEGORIES = ["Fixed Assets", "Current Assets"];

const itemModal = new bootstrap.Modal(document.getElementById("itemModal"));
const form = document.getElementById("itemForm");

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (s) =>
    ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[s])
    );
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderAll() {
    ["income", "expense", "liabilities", "assets"].forEach((t) => renderList(t));
    updateTotals();
}
function renderItemHTML(it, type, idx) {
    return `
        <div class="d-flex justify-content-between border-bottom py-1">
            <div>
              <strong>${escapeHtml(it.label)}</strong><br/>
              <span class="text-secondary small">${it.date}</span>
            </div>
            <div class="text-end">
              ₹${Number(it.value).toLocaleString("en-IN")}
              <div>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="openEdit('${type}',${idx})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${type}',${idx})">
                    <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
        </div>`;
}
function renderList(type) {
    const container = document.getElementById(type + "List");
    container.innerHTML = "";

    /* ============================
       1) LIABILITIES (3 categories)
       ============================ */
    if (type === "liabilities") {
        LIABILITY_CATEGORIES.forEach(cat => {
            container.innerHTML += `
                <div class="liab-section">
                    <div class="liab-heading">${escapeHtml(cat)}</div>
                    <div id="liab-${cat.replace(/\s+/g, "_")}" class="liab-items mt-2"></div>
                </div>`;
        });

        LIABILITY_CATEGORIES.forEach(cat => {
            const section = container.querySelector(`#liab-${cat.replace(/\s+/g, "_")}`);
            const items = data.liabilities.filter(it => it.subcategory === cat);

            section.innerHTML = items.length === 0
                ? `<p class="liab-empty mb-0">No entries yet.</p>`
                : items.map(it => {
                    const realIndex = data.liabilities.indexOf(it);
                    return renderItemHTML(it, "liabilities", realIndex);
                }).join("");
        });

        return;
    }

    /* ============================
       2) ASSETS (2 categories)
       ============================ */
    if (type === "assets") {
        ASSET_CATEGORIES.forEach(cat => {
            container.innerHTML += `
                <div class="asset-section">
                    <div class="asset-heading">${escapeHtml(cat)}</div>
                    <div id="asset-${cat.replace(/\s+/g, "_")}" class="asset-items mt-2"></div>
                </div>`;
        });

        ASSET_CATEGORIES.forEach(cat => {
            const section = container.querySelector(`#asset-${cat.replace(/\s+/g, "_")}`);
            const items = data.assets.filter(it => it.subcategory === cat);

            section.innerHTML = items.length === 0
                ? `<p class="asset-empty mb-0">No entries yet.</p>`
                : items.map(it => {
                    const realIndex = data.assets.indexOf(it);
                    return renderItemHTML(it, "assets", realIndex);
                }).join("");
        });

        return;
    }

    /* ============================
       3) INCOME (4 categories)
       ============================ */
    if (type === "income") {
        INCOME_CATEGORIES.forEach(cat => {
            container.innerHTML += `
                <div class="asset-section">
                    <div class="asset-heading">${escapeHtml(cat)}</div>
                    <div id="income-${cat.replace(/\s+/g, "_")}" class="mt-2"></div>
                </div>`;
        });

        INCOME_CATEGORIES.forEach(cat => {
            const section = container.querySelector(`#income-${cat.replace(/\s+/g, "_")}`);
            const items = data.income.filter(it => it.subcategory === cat);

            section.innerHTML = items.length === 0
                ? `<p class="text-muted mb-0">No entries yet.</p>`
                : items.map(it => {
                    const realIndex = data.income.indexOf(it);
                    return renderItemHTML(it, "income", realIndex);
                }).join("");
        });

        return;
    }

    /* ============================
       4) EXPENSE (2 categories)
       ============================ */
    if (type === "expense") {
        EXPENSE_CATEGORIES.forEach(cat => {
            container.innerHTML += `
                <div class="asset-section">
                    <div class="asset-heading">${escapeHtml(cat)}</div>
                    <div id="expense-${cat.replace(/\s+/g, "_")}" class="mt-2"></div>
                </div>`;
        });

        EXPENSE_CATEGORIES.forEach(cat => {
            const section = container.querySelector(`#expense-${cat.replace(/\s+/g, "_")}`);
            const items = data.expense.filter(it => it.subcategory === cat);

            section.innerHTML = items.length === 0
                ? `<p class="text-muted mb-0">No entries yet.</p>`
                : items.map(it => {
                    const realIndex = data.expense.indexOf(it);
                    return renderItemHTML(it, "expense", realIndex);
                }).join("");
        });

        return;
    }

    /* ============================
       5) FALLBACK (unused now)
       ============================ */
    container.innerHTML = `<p class='text-muted mb-0'>No entries yet.</p>`;
}

function updateTotals() {
    ["income", "expense", "liabilities", "assets"].forEach((type) => {
        const total = data[type].reduce((s, it) => s + Number(it.value || 0), 0);
        document.getElementById(type + "Total").textContent =
            "₹" + total.toLocaleString("en-IN");
    });

    const cashFlow =
        data.income.reduce((s, it) => s + Number(it.value || 0), 0) -
        data.expense.reduce((s, it) => s + Number(it.value || 0), 0);
    document.getElementById("currentCashFlow").textContent =
        "₹" + cashFlow.toLocaleString("en-IN");

    const passiveTotal = data.income
        .filter((it) => it.passive)
        .reduce((s, it) => s + Number(it.value || 0), 0);
    document.getElementById("passiveIncome").textContent =
        "₹" + passiveTotal.toLocaleString("en-IN");

    const currentAssets = data.assets
        .filter((it) => it.subcategory === "Current Assets")
        .reduce((s, it) => s + Number(it.value || 0), 0);
    const currentLiab = data.liabilities
        .filter((it) => it.subcategory === "Current Liabilities")
        .reduce((s, it) => s + Number(it.value || 0), 0);

    const ratio =
        currentLiab === 0
            ? "N/A"
            : (currentAssets / currentLiab).toFixed(2) + ":1";
    document.getElementById("liquidityRatio").textContent = ratio;

    const totalExpenses = data.expense.reduce((s, it) => s + Number(it.value || 0), 0);
    const passive = data.income
        .filter((i) => i.passive)
        .reduce((s, i) => s + Number(i.value), 0);

    const progress =
        totalExpenses === 0 ? 0 : Math.min(100, (passive / (2 * totalExpenses)) * 100);

    // CURRENT progress %
    const current = Math.round(progress);

    // Load previous highest
    let highest = Number(localStorage.getItem("highestProgress") || 0);

    // Update highest if current is greater
    if (current > highest) {
        highest = current;
        localStorage.setItem("highestProgress", highest);
    }

    // Update UI
    document.getElementById("exitProgress").style.width = current + "%";
    document.getElementById("exitPercent").textContent = current + "%";
    document.getElementById("highestPercent").textContent = highest + "%";

    const allDates = [
        ...data.income,
        ...data.expense,
        ...data.assets,
        ...data.liabilities,
    ]
        .map((it) => it.date)
        .filter(Boolean);

    document.getElementById("statementDate").textContent =
        allDates.length === 0
            ? "(as on -)"
            : "(as on " + allDates.sort().reverse()[0] + ")";
}

function openModal(type) {
    document.getElementById("modalType").value = type;
    document.getElementById("editIndex").value = "";
    form.reset();
    document.getElementById("modalTitle").textContent =
        "Add " + capitalize(type);

    document.getElementById("subcatWrapper").style.display =
        (type === "income" || type === "expense") ? "block" : "none";
    document.getElementById("liabilityRadios").style.display =
        type === "liabilities" ? "block" : "none";
    document.getElementById("assetRadios").style.display =
        type === "assets" ? "block" : "none";
    document.getElementById("passiveWrapper").style.display =
        type === "income" ? "block" : "none";

    if (type === "income" || type === "expense") populateSubcats(type);
    else if (type === "liabilities")
        document.querySelector('input[name="liabType"]').checked = true;
    else if (type === "assets")
        document.querySelector('input[name="assetType"]').checked = true;

    itemModal.show();
}

function populateSubcats(type, selected = "") {
    const sel = document.getElementById("modalSubcat");
    sel.innerHTML = "";

    const cats = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    cats.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selected) opt.selected = true;
        sel.appendChild(opt);
    });

    document.getElementById("newSubcat").style.display = "none";
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const type = document.getElementById("modalType").value;
    const label = document.getElementById("modalLabel").value;

    // DECIMAL SUPPORT
    const value = Number(document.getElementById("modalValue").value);

    const date = document.getElementById("modalDate").value;
    const passive = document.getElementById("modalPassive").checked;

    let subcat = "";

    if (type === "income" || type === "expense") {
        subcat =
            document.getElementById("newSubcat").value ||
            document.getElementById("modalSubcat").value;
        if (subcat && !subcategories[type].includes(subcat))
            subcategories[type].push(subcat);
    } else if (type === "liabilities") {
        subcat = document.querySelector('input[name="liabType"]:checked').value;
    } else if (type === "assets") {
        subcat = document.querySelector('input[name="assetType"]:checked').value;
    }

    const item = { label, value, date, subcategory: subcat, passive };

    const editIdx = document.getElementById("editIndex").value;
    if (editIdx === "") data[type].push(item);
    else data[type][editIdx] = item;

    renderAll();
    itemModal.hide();
});

function openEdit(type, idx) {
    const it = data[type][idx];
    openModal(type);

    document.getElementById("modalLabel").value = it.label;
    document.getElementById("modalValue").value = it.value;
    document.getElementById("modalDate").value = it.date;

    if (type === "income" || type === "expense") {
        populateSubcats(type, it.subcategory);
        document.getElementById("newSubcat").value = "";
        document.getElementById("modalPassive").checked = !!it.passive;
    } else if (type === "liabilities") {
        document
            .querySelectorAll('input[name="liabType"]')
            .forEach((r) => (r.checked = r.value === it.subcategory));
    } else if (type === "assets") {
        document
            .querySelectorAll('input[name="assetType"]')
            .forEach((r) => (r.checked = r.value === it.subcategory));
    }

    document.getElementById("editIndex").value = idx;
}

function deleteItem(type, idx) {
    if (confirm("Delete this item?")) {
        data[type].splice(idx, 1);
        renderAll();
    }
}

document.getElementById("exportBtn").addEventListener("click", () => {
    const today = new Date().toISOString().split("T")[0];
    const filename = `FS-${today}.json`;

    const content = JSON.stringify(
        {
            income: data.income,
            expense: data.expense,
            liabilities: data.liabilities,
            assets: data.assets,
            subcategories: subcategories,
        },
        null,
        2
    );

    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById("importBtn").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);

                data.income = imported.income || [];
                data.expense = imported.expense || [];
                data.liabilities = imported.liabilities || [];
                data.assets = imported.assets || [];

                subcategories.income =
                    (imported.subcategories && imported.subcategories.income) || [];
                subcategories.expense =
                    (imported.subcategories && imported.subcategories.expense) || [];
                subcategories.liabilities =
                    (imported.subcategories && imported.subcategories.liabilities) || [];
                subcategories.assets =
                    (imported.subcategories && imported.subcategories.assets) || [];

                renderAll();
            } catch (err) {
                alert("Invalid JSON");
            }
        };

        reader.readAsText(file);
    };

    input.click();
});

window.openModal = openModal;
window.openEdit = openEdit;
window.deleteItem = deleteItem;
renderAll();

/* -------------------------------- */
/*           DARK MODE JS           */
/* -------------------------------- */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.classList.replace("bi-moon-fill", "bi-sun-fill");
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    if (isDark) {
        themeIcon.classList.replace("bi-moon-fill", "bi-sun-fill");
        localStorage.setItem("theme", "dark");
    } else {
        themeIcon.classList.replace("bi-sun-fill", "bi-moon-fill");
        localStorage.setItem("theme", "light");
    }
});