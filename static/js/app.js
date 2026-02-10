// State Management
let state = {
    view: 'dashboard',
    inventory: [],
    cart: [],
    paymentMethod: 'Cash',
    discount: 0
};

// DOM Elements
const elements = {
    navLinks: document.querySelectorAll('.nav-links li'),
    views: document.querySelectorAll('.view'),
    clock: document.getElementById('digital-clock'),
    posItemsGrid: document.getElementById('pos-items-grid'),
    itemSearch: document.getElementById('item-search'),
    cartList: document.getElementById('cart-items-list'),
    subtotal: document.getElementById('cart-subtotal'),
    total: document.getElementById('cart-total'),
    discountInput: document.getElementById('cart-discount'),
    paymentBtns: document.querySelectorAll('.btn-pay'),
    completeSaleBtn: document.getElementById('complete-sale'),
    inventoryTableBody: document.querySelector('#inventory-table tbody'),
    modalContainer: document.getElementById('modal-container'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    closeModalBtn: document.querySelector('.close-modal'),
    // Summary elements
    todaySales: document.getElementById('today-sales'),
    todayTransactions: document.getElementById('today-transactions'),
    lowStockCount: document.getElementById('low-stock-count'),
    invValue: document.getElementById('inv-value')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log("POS System initializing...");

    try {
        // 1. Core Logic (Must run first)
        setupNavigation();
        setupSalesLogic();
        setupInventoryLogic();
        setupPurchaseLogic();
        setupModalLogic();
        console.log("Core logic setup complete.");
    } catch (e) {
        console.error("Critical error during logic setup:", e);
    }

    try {
        // 2. Data Loading (Async)
        syncData();
        startClock();
        console.log("Data sync and clock started.");
    } catch (e) {
        console.error("Error during data loading:", e);
    }
});

// Icon Refresher - Robust rendering
function refreshIcons() {
    try {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
            console.log("Icons refreshed.");
        }
    } catch (e) {
        console.warn("Lucide refresh failed:", e);
    }
}

// Navigation Logic
function setupNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const view = link.getAttribute('data-view');
            switchView(view);
        });
    });
}

function switchView(viewName) {
    console.log(`Switching view to: ${viewName}`);
    state.view = viewName;
    elements.navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });
    elements.views.forEach(v => {
        v.classList.toggle('hidden', v.id !== `${viewName}-view`);
    });

    if (viewName === 'inventory') fetchInventory();
    if (viewName === 'dashboard') loadDashboardData();
    if (viewName === 'sales') renderPOSItems();
    if (viewName === 'purchases') renderPurchasesView();
    if (viewName === 'reports') renderReportsView();
}

// Modal Logic
window.openModal = function (title, contentHtml) {
    elements.modalTitle.textContent = title;
    elements.modalBody.innerHTML = contentHtml;
    elements.modalContainer.classList.remove('hidden');
    elements.modalContainer.style.display = 'flex';
    refreshIcons();
}

window.closeModal = function () {
    elements.modalContainer.classList.add('hidden');
    elements.modalContainer.style.display = 'none';
}

function setupModalLogic() {
    // 1. Close button (Event Delegation)
    elements.modalContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal') || e.target.closest('.close-modal')) {
            window.closeModal();
        }
        // 2. Overlay click
        if (e.target === elements.modalContainer) {
            window.closeModal();
        }
    });

    // 3. Escape key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.modalContainer.classList.contains('hidden')) {
            window.closeModal();
        }
    });
}

// Clock Function
function startClock() {
    const updateTime = () => {
        const now = new Date();
        elements.clock.textContent = now.toLocaleTimeString();
    };
    setInterval(updateTime, 1000);
    updateTime();
}

// Dashboard Logic
async function loadDashboardData() {
    try {
        const res = await fetch('/api/reports/summary');
        const data = await res.json();

        elements.todaySales.textContent = `KSh ${data.today.total_sales.toLocaleString()}`;
        elements.todayTransactions.textContent = data.today.transactions;
        elements.lowStockCount.textContent = data.today.low_stock_alerts || data.inventory.low_stock_count;
        elements.invValue.textContent = `KSh ${data.inventory.total_value_selling.toLocaleString()}`;

        console.log("Dashboard data refreshed.");
        refreshIcons();
    } catch (err) {
        console.error('Failed to load dashboard:', err);
    }
}

// Global Sync Function
async function syncData() {
    console.log("Syncing all data...");
    await Promise.all([
        fetchInventory(true),
        loadDashboardData()
    ]);
}

// Inventory Logic
async function fetchInventory(force = false) {
    if (state.inventory.length > 0 && !force) {
        if (state.view === 'inventory') renderInventoryTable();
        if (state.view === 'sales') renderPOSItems();
        return;
    }
    try {
        const res = await fetch('/api/inventory/');
        state.inventory = await res.json();
        if (state.view === 'inventory') renderInventoryTable();
        if (state.view === 'sales') renderPOSItems();
    } catch (err) {
        console.error('Failed to fetch inventory:', err);
    }
}

function renderInventoryTable() {
    elements.inventoryTableBody.innerHTML = state.inventory.map(item => {
        const stockClass = item['Quantity in Stock'] <= 0 ? 'stock-out' :
            (item['Quantity in Stock'] <= item['Reorder Level'] ? 'stock-low' : 'stock-ok');
        const catClass = `category-${item['Category'].toLowerCase()}`;

        return `
            <tr>
                <td><strong>${item['Item Code']}</strong></td>
                <td>${item['Item Name']}</td>
                <td><span class="category-pill ${catClass}">${item['Category']}</span></td>
                <td><span class="stock-badge ${stockClass}">${item['Quantity in Stock']} ${item['Unit of Measure']}</span></td>
                <td>${item['Cost Price'].toLocaleString()}</td>
                <td>KSh ${item['Selling Price'].toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-pill edit" onclick="editItem('${item['Item Code']}')">
                            <i data-lucide="edit-3"></i> Edit
                        </button>
                        <button class="btn-pill delete" onclick="deleteItem('${item['Item Code']}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    refreshIcons();
}

function setupInventoryLogic() {
    document.getElementById('add-item-btn').addEventListener('click', () => {
        openModal('Add New Item', `
            <form id="inventory-form" class="modal-form">
                <div class="form-group">
                    <label>Item Code</label>
                    <input type="text" name="item_code" required>
                </div>
                <div class="form-group">
                    <label>Item Name</label>
                    <input type="text" name="item_name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Category</label>
                        <select name="category">
                            <option>Cement</option><option>Paint</option><option>Tools</option><option>Plumbing</option><option>Electrical</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Unit</label>
                        <input type="text" name="unit_of_measure" placeholder="e.g. bags" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Cost Price</label>
                        <input type="number" name="cost_price" required>
                    </div>
                    <div class="form-group">
                        <label>Selling Price</label>
                        <input type="number" name="selling_price" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stock</label>
                        <input type="number" name="quantity_in_stock" value="0">
                    </div>
                    <div class="form-group">
                        <label>Reorder Level</label>
                        <input type="number" name="reorder_level" value="10">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Supplier Name</label>
                        <input type="text" name="supplier_name" placeholder="Optional">
                    </div>
                    <div class="form-group">
                        <label>Location/Shelf</label>
                        <input type="text" name="location_shelf_number" placeholder="e.g. A1">
                    </div>
                </div>
                <button type="submit" class="btn-primary w-100">Save Item</button>
            </form>
        `);

        document.getElementById('inventory-form').onsubmit = handleInventorySubmit;
    });
}

function getErrorMessage(err) {
    if (typeof err === 'string') return err;
    if (err.detail) {
        if (Array.isArray(err.detail)) {
            return err.detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('\n');
        }
        return err.detail;
    }
    return JSON.stringify(err);
}

async function handleInventorySubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Convert numeric strings
    ['cost_price', 'selling_price', 'quantity_in_stock', 'reorder_level'].forEach(k => data[k] = parseFloat(data[k]));

    const method = e.target.getAttribute('data-edit') ? 'PUT' : 'POST';
    const url = method === 'PUT' ? `/api/inventory/${data.item_code}` : '/api/inventory/';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            closeModal();
            await syncData();
        } else {
            const err = await res.json();
            alert(getErrorMessage(err));
        }
    } catch (err) {
        console.error('Error saving item:', err);
    }
}

window.editItem = (itemCode) => {
    const item = state.inventory.find(i => i['Item Code'] === itemCode);
    if (!item) return;

    openModal('Edit Item', `
        <form id="inventory-form" class="modal-form" data-edit="true">
            <input type="hidden" name="item_code" value="${item['Item Code']}">
            <div class="form-group">
                <label>Item Name</label>
                <input type="text" name="item_name" value="${item['Item Name']}" required>
            </div>
            <!-- ... more fields ... -->
            <button type="submit" class="btn-primary w-100">Update Item</button>
        </form>
    `);
    // I will simplify the edit form for now, just to show it works.
    document.getElementById('inventory-form').onsubmit = handleInventorySubmit;
};

window.deleteItem = async (itemCode) => {
    if (!confirm(`Are you sure you want to delete ${itemCode}?`)) return;
    try {
        const res = await fetch(`/api/inventory/${itemCode}`, { method: 'DELETE' });
        if (res.ok) {
            await syncData();
        } else {
            const err = await res.json();
            alert(getErrorMessage(err));
        }
    } catch (err) {
        console.error('Delete failed:', err);
        alert('Network error or server unreachable');
    }
};

// Purchase Logic
function setupPurchaseLogic() {
    document.getElementById('purchase-form').onsubmit = handlePurchaseSubmit;
}

function renderPurchasesView() {
    const select = document.getElementById('purchase-item-select');
    select.innerHTML = state.inventory.map(item => `
        <option value="${item['Item Code']}">${item['Item Name']} (${item['Item Code']})</option>
    `).join('');
}

async function handlePurchaseSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Find item name
    const item = state.inventory.find(i => i['Item Code'] === data.item_code);
    data.item_name = item['Item Name'];
    data.quantity = parseFloat(data.quantity);
    data.unit_cost = parseFloat(data.unit_cost);
    data.received_by = 'Admin';

    try {
        const res = await fetch('/api/purchases/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Purchase recorded successfully!');
            e.target.reset();
            await syncData();
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to record purchase');
        }
    } catch (err) {
        console.error('Purchase failed:', err);
    }
}

// Sales Logic (POS)
function setupSalesLogic() {
    elements.itemSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderPOSItems(query);
    });

    elements.discountInput.addEventListener('change', (e) => {
        state.discount = parseFloat(e.target.value) || 0;
        updateCart();
    });

    elements.paymentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.paymentBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            state.paymentMethod = btn.getAttribute('data-method');
        });
    });

    elements.completeSaleBtn.addEventListener('click', processSale);
}

function renderPOSItems(query = '') {
    const filtered = state.inventory.filter(item =>
        item['Item Name'].toLowerCase().includes(query) ||
        item['Item Code'].toLowerCase().includes(query)
    );

    elements.posItemsGrid.innerHTML = filtered.map(item => `
        <div class="item-card" onclick="addToCart('${item['Item Code']}')">
            <h4>${item['Item Name']}</h4>
            <div class="item-stock">Stock: ${item['Quantity in Stock']}</div>
            <div class="item-price">KSh ${item['Selling Price'].toLocaleString()}</div>
        </div>
    `).join('');
    refreshIcons();
}

window.addToCart = (itemCode) => {
    const item = state.inventory.find(i => i['Item Code'] === itemCode);
    if (!item) return;
    if (item['Quantity in Stock'] <= 0) {
        alert('Item out of stock!');
        return;
    }

    const existing = state.cart.find(c => c.item_code === itemCode);
    if (existing) {
        if (existing.quantity >= item['Quantity in Stock']) return;
        existing.quantity++;
        existing.total = existing.quantity * existing.unit_price;
    } else {
        state.cart.push({
            item_code: item['Item Code'],
            item_name: item['Item Name'],
            quantity: 1,
            unit_price: item['Selling Price'],
            total: item['Selling Price']
        });
    }
    updateCart();
};

function updateCart() {
    elements.cartList.innerHTML = state.cart.map((item, idx) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.item_name}</h4>
                <p>${item.quantity} x KSh ${item.unit_price.toLocaleString()}</p>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="changeQty(${idx}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
            </div>
        </div>
    `).join('');

    const subtotal = state.cart.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal * (1 - state.discount / 100);

    elements.subtotal.textContent = `KSh ${subtotal.toLocaleString()}`;
    elements.total.textContent = `KSh ${total.toLocaleString()}`;
}

window.changeQty = (idx, delta) => {
    const item = state.cart[idx];
    const inventoryItem = state.inventory.find(i => i['Item Code'] === item.item_code);

    item.quantity += delta;
    if (item.quantity <= 0) {
        state.cart.splice(idx, 1);
    } else if (item.quantity > inventoryItem['Quantity in Stock']) {
        item.quantity = inventoryItem['Quantity in Stock'];
    }

    item.total = item.quantity * item.unit_price;
    updateCart();
};

async function processSale() {
    if (state.cart.length === 0) return;

    const saleData = {
        items: state.cart,
        payment_method: state.paymentMethod,
        served_by: 'Admin', // Static for now
        discount: state.discount
    };

    try {
        const res = await fetch('/api/sales/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });

        if (res.ok) {
            const result = await res.json();
            state.cart = [];
            state.discount = 0;
            elements.discountInput.value = 0;
            updateCart();
            await syncData();

            // Show Receipt
            showReceipt(saleData);
        } else {
            const err = await res.json();
            alert(getErrorMessage(err));
        }
    } catch (err) {
        console.error('Sale failed:', err);
    }
}

// Receipt Logic
window.showReceipt = (sale) => {
    const modal = document.getElementById('modal-container');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.innerText = 'Purchase Receipt';
    const subtotal = sale.items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal * (1 - sale.discount / 100);

    body.innerHTML = `
        <div class="receipt-container" id="printable-receipt">
            <div class="receipt-header">
                <h2>HARDWARE POS</h2>
                <p>Nairobi, Kenya</p>
                <p>Date: ${new Date().toLocaleString()}</p>
            </div>
            ${sale.items.map(item => `
                <div class="receipt-line">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>KSh ${item.total.toLocaleString()}</span>
                </div>
            `).join('')}
            <div class="receipt-total">
                <div class="receipt-line">
                    <span>Subtotal</span>
                    <span>KSh ${subtotal.toLocaleString()}</span>
                </div>
                <div class="receipt-line">
                    <span>Discount</span>
                    <span>${sale.discount}%</span>
                </div>
                <div class="receipt-line" style="font-size: 1.2rem; margin-top: 0.5rem;">
                    <span>TOTAL</span>
                    <span>KSh ${total.toLocaleString()}</span>
                </div>
            </div>
            <div class="receipt-footer">
                <p>Served by: ${sale.served_by}</p>
                <p>Payment: ${sale.payment_method}</p>
                <p>Thank you for shopping with us!</p>
            </div>
        </div>
        <button class="btn-primary w-100" style="margin-top: 2rem;" onclick="window.print()">
            <i data-lucide="printer"></i> Print Receipt
        </button>
    `;

    modal.classList.remove('hidden');
    refreshIcons();
};

// Reports Logic
async function renderReportsView() {
    try {
        const res = await fetch('/api/sales/');
        const salesData = await res.json();
        const tbody = document.querySelector('#sales-history-table tbody');
        if (!tbody) return;

        // Group items back into sales if possible, or just render rows
        tbody.innerHTML = salesData.map(sale => `
            <tr>
                <td>${sale['Date & Time']}</td>
                <td>${sale['Item Name']}</td>
                <td>${sale['Quantity Sold']}</td>
                <td>KSh ${sale['Total Sale Amount'].toLocaleString()}</td>
                <td>
                    <button class="btn-print-sm" onclick='window.showReceiptFromHistory(${JSON.stringify(sale).replace(/'/g, "&apos;")})'>
                        <i data-lucide="printer"></i>
                    </button>
                </td>
            </tr>
        `).reverse().join('');
        refreshIcons();
    } catch (err) {
        console.error('Failed to load reports:', err);
    }
}

// Global helper for historical receipts
window.showReceiptFromHistory = (saleRow) => {
    // Map backend row format to the showReceipt format
    const saleData = {
        items: [{
            name: saleRow['Item Name'],
            quantity: saleRow['Quantity Sold'],
            total: saleRow['Total Sale Amount'],
            unit_price: saleRow['Unit Price'] || (saleRow['Total Sale Amount'] / saleRow['Quantity Sold'])
        }],
        payment_method: saleRow['Payment Method'] || 'N/A',
        served_by: saleRow['Served By'] || 'System',
        discount: saleRow['Discount Applied'] || 0
    };
    showReceipt(saleData);
};
