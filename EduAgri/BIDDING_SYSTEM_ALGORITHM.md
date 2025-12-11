# EduAgri Vegetable Bidding System Algorithm

## Overview
A simple bidding system where multiple farmers bid on vegetable prices (per kg), and customers see the average bid price for each vegetable type.

---

## 1. DATA STRUCTURE

### LocalStorage Schema

#### **Vegetables List** (Global Reference)
```javascript
// Key: 'availableVegetables'
[
  { id: 'v1', name: 'Tomato', unit: 'kg' },
  { id: 'v2', name: 'Potato', unit: 'kg' },
  { id: 'v3', name: 'Onion', unit: 'kg' },
  { id: 'v4', name: 'Carrot', unit: 'kg' },
  { id: 'v5', name: 'Broccoli', unit: 'kg' }
]
```

#### **Farmer Bids** (Farmer Creates)
```javascript
// Key: 'farmerBids'
[
  {
    bidId: 'bid_001',
    farmerId: 'farmer_user1',           // Logged-in farmer username
    farmerName: 'John Farmer',
    vegetableId: 'v1',                  // Reference to Tomato
    vegetableName: 'Tomato',
    pricePerKg: 45,                     // ₹ per kg
    quantity: 100,                      // Total kg available
    quantityRemaining: 85,              // After orders
    bidCreatedAt: 1702300000            // Timestamp
  },
  {
    bidId: 'bid_002',
    farmerId: 'farmer_user2',
    farmerName: 'Jane Farmer',
    vegetableId: 'v1',                  // Also bidding on Tomato
    vegetableName: 'Tomato',
    pricePerKg: 42,                     // Different price
    quantity: 150,
    quantityRemaining: 150,
    bidCreatedAt: 1702300100
  }
]
```

#### **Customer Orders from Bids** (Customer Purchases)
```javascript
// Key: 'customerOrdersFromBids'
[
  {
    orderId: 'order_c001',
    customerId: 'customer_user1',
    bidId: 'bid_002',                   // Which bid was purchased
    farmerId: 'farmer_user2',
    farmerName: 'Jane Farmer',
    vegetableId: 'v1',
    vegetableName: 'Tomato',
    quantity: 15,                       // kg ordered
    pricePerKg: 42,
    totalPrice: 630                     // 15 * 42
  }
]
```

---

## 2. FARMER BIDDING LOGIC

### Step 1: Farmer Creates a Bid
**Location:** `farmers.html`

```javascript
function createBid() {
  const vegetableId = document.getElementById('veg-select').value;
  const pricePerKg = parseFloat(document.getElementById('bid-price').value);
  const quantity = parseFloat(document.getElementById('bid-quantity').value);

  const farmerId = localStorage.getItem('currentUser');

  // Validation
  if (!vegetableId || pricePerKg <= 0 || quantity <= 0) {
    showToast('Please fill all fields with valid values');
    return;
  }

  const newBid = {
    bidId: 'bid_' + Date.now(),
    farmerId: farmerId,
    farmerName: farmerId,
    vegetableId: vegetableId,
    vegetableName: getVegetableName(vegetableId),
    pricePerKg: pricePerKg,
    quantity: quantity,
    quantityRemaining: quantity,
    bidCreatedAt: Date.now()
  };

  // Store bid
  let bids = JSON.parse(localStorage.getItem('farmerBids')) || [];
  bids.push(newBid);
  localStorage.setItem('farmerBids', JSON.stringify(bids));

  showToast('Bid created successfully!', 'success');
  displayMyBids();
}
```

### Step 2: Farmer Views Their Bids
```javascript
function displayMyBids() {
  const farmerId = localStorage.getItem('currentUser');
  const allBids = JSON.parse(localStorage.getItem('farmerBids')) || [];
  
  const myBids = allBids.filter(bid => bid.farmerId === farmerId);

  let html = '<h4>My Active Bids</h4>';
  
  myBids.forEach(bid => {
    const ordersCount = getOrdersCountForBid(bid.bidId);

    html += `
      <div class="bid-card">
        <h5>${bid.vegetableName} - ₹${bid.pricePerKg}/kg</h5>
        <p>Available: ${bid.quantityRemaining}kg / ${bid.quantity}kg</p>
        <p>Orders Received: ${ordersCount}</p>
        <button onclick="editBid('${bid.bidId}')">Edit Price</button>
        <button onclick="removeBid('${bid.bidId}')">Remove Bid</button>
      </div>
    `;
  });

  document.getElementById('my-bids-container').innerHTML = html;
}
```

### Step 3: Farmer Can Update/Remove Bid
```javascript
function editBid(bidId) {
  const newPrice = prompt('Enter new price per kg (₹):');
  if (newPrice === null || newPrice <= 0) return;

  let bids = JSON.parse(localStorage.getItem('farmerBids')) || [];
  const bid = bids.find(b => b.bidId === bidId);

  if (bid) {
    bid.pricePerKg = parseFloat(newPrice);
    localStorage.setItem('farmerBids', JSON.stringify(bids));
    showToast('Bid price updated!', 'success');
    displayMyBids();
  }
}

function removeBid(bidId) {
  if (!confirm('Remove this bid?')) return;

  let bids = JSON.parse(localStorage.getItem('farmerBids')) || [];
  bids = bids.filter(b => b.bidId !== bidId);
  localStorage.setItem('farmerBids', JSON.stringify(bids));
  showToast('Bid removed!', 'success');
  displayMyBids();
}
```

---

## 3. CUSTOMER VIEWING LOGIC

### Step 1: Calculate Average Price Per Vegetable
```javascript
function getAveragePricePerVegetable() {
  const allBids = JSON.parse(localStorage.getItem('farmerBids')) || [];
  const vegetables = JSON.parse(localStorage.getItem('availableVegetables')) || [];

  const avgPricesPerVeg = {};

  vegetables.forEach(veg => {
    const bidsForVeg = allBids.filter(bid => 
      bid.vegetableId === veg.id && 
      bid.quantityRemaining > 0
    );

    if (bidsForVeg.length > 0) {
      const totalPrice = bidsForVeg.reduce((sum, bid) => sum + bid.pricePerKg, 0);
      const avgPrice = totalPrice / bidsForVeg.length;

      avgPricesPerVeg[veg.id] = {
        vegetable: veg,
        averagePrice: avgPrice.toFixed(2),
        farmerCount: bidsForVeg.length,
        allBids: bidsForVeg,
        totalAvailable: bidsForVeg.reduce((sum, bid) => sum + bid.quantityRemaining, 0)
      };
    }
  });

  return avgPricesPerVeg;
}
```

### Step 2: Display Vegetables with Average Price
```javascript
function displayVegetableShop() {
  const avgPrices = getAveragePricePerVegetable();
  let html = '<h3>Fresh Vegetables from Farmers</h3>';
  
  html += '<div class="veg-grid">';

  Object.values(avgPrices).forEach(vegData => {
    const veg = vegData.vegetable;
    const avgPrice = vegData.averagePrice;
    const farmerCount = vegData.farmerCount;
    const allBids = vegData.allBids;
    const totalAvailable = vegData.totalAvailable;

    html += `
      <div class="veg-card">
        <h4>${veg.name}</h4>
        
        <div class="price-info">
          <p><strong>Average Price:</strong> ₹${avgPrice}/${veg.unit}</p>
          <p><strong>Farmers Selling:</strong> ${farmerCount}</p>
          <p><strong>Total Available:</strong> ${totalAvailable}${veg.unit}</p>
        </div>

        <div class="all-bids">
          <p><strong>All Farmer Bids:</strong></p>
          <ul>
            ${allBids.map(bid => 
              `<li>₹${bid.pricePerKg}/${veg.unit} by ${bid.farmerName} (${bid.quantityRemaining}${veg.unit})</li>`
            ).join('')}
          </ul>
        </div>

        <form class="order-form" onsubmit="orderFromBid(event, '${allBids[0].bidId}')">
          <input type="number" name="qty" min="1" max="${totalAvailable}" 
                 placeholder="Quantity (${veg.unit})" required>
          <select name="selectedBidId">
            ${allBids.map(bid => 
              `<option value="${bid.bidId}">₹${bid.pricePerKg} - ${bid.farmerName} (${bid.quantityRemaining}${veg.unit})</option>`
            ).join('')}
          </select>
          <button type="submit" class="btn-secondary">Order Now</button>
        </form>
      </div>
    `;
  });

  html += '</div>';
  document.getElementById('veg-shop-container').innerHTML = html;
}
```

---

## 4. CUSTOMER ORDERING LOGIC

### Place Order from a Bid
```javascript
function orderFromBid(event) {
  event.preventDefault();

  const customerId = localStorage.getItem('currentUser');
  const quantity = parseFloat(event.target.qty.value);
  const selectedBidId = event.target.selectedBidId.value;

  let bids = JSON.parse(localStorage.getItem('farmerBids')) || [];
  const bid = bids.find(b => b.bidId === selectedBidId);

  if (!bid || bid.quantityRemaining < quantity) {
    showToast('Not enough quantity available', 'error');
    return;
  }

  // Create order
  const newOrder = {
    orderId: 'order_' + Date.now(),
    customerId: customerId,
    bidId: bid.bidId,
    farmerId: bid.farmerId,
    farmerName: bid.farmerName,
    vegetableId: bid.vegetableId,
    vegetableName: bid.vegetableName,
    quantity: quantity,
    pricePerKg: bid.pricePerKg,
    totalPrice: quantity * bid.pricePerKg
  };

  // Update bid: reduce remaining quantity
  bid.quantityRemaining -= quantity;

  // Store order and update bid
  let orders = JSON.parse(localStorage.getItem('customerOrdersFromBids')) || [];
  orders.push(newOrder);
  localStorage.setItem('customerOrdersFromBids', JSON.stringify(orders));
  localStorage.setItem('farmerBids', JSON.stringify(bids));

  showToast(`Order placed! Total: ₹${newOrder.totalPrice}`, 'success');
  displayVegetableShop(); // Refresh display
}
```

---

## 5. ALGORITHM FLOW SUMMARY

```
FARMER SIDE:
  ┌─────────────────────┐
  │ Farmer Logs In      │
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ Create Bid          │ ← Vegetable, Price/kg, Quantity
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ View My Bids        │ ← See all bids + order count
  └──────────┬──────────┘
             │
  ┌──────────▼──────────┐
  │ Edit/Remove Bid     │ ← Update price anytime
  └─────────────────────┘


CUSTOMER SIDE:
  ┌──────────────────────────┐
  │ Customer Logs In         │
  └──────────┬───────────────┘
             │
  ┌──────────▼───────────────┐
  │ View All Vegetables      │ ← With active bids only
  └──────────┬───────────────┘
             │
  ┌──────────▼───────────────┐
  │ See Average Price        │ ← Average of all farmer bids
  │ + All Individual Bids    │ ← List of each farmer's price
  └──────────┬───────────────┘
             │
  ┌──────────▼───────────────┐
  │ Select Farmer & Quantity │ ← Choose which bid to buy from
  │ Place Order              │
  └──────────┬───────────────┘
             │
  ┌──────────▼───────────────┐
  │ Order Created            │
  │ Bid Quantity Reduced     │
  └──────────────────────────┘
```

---

## 6. KEY FEATURES (SIMPLIFIED)

| Feature | Description |
|---------|-------------|
| **Simple Pricing** | Price per kg only |
| **Multiple Bids** | Many farmers can bid on same vegetable |
| **Average Price** | Customers see average bid price |
| **All Bids Visible** | Show every farmer's individual bid price |
| **Quantity Tracking** | Real-time remaining stock |
| **Easy Management** | Farmers can edit/remove bids anytime |
| **No Order Tracking** | Simple order placement, no status tracking |

---

## 7. VALIDATION RULES

✅ **Farmer Bid Creation:**
- Price > 0
- Quantity > 0
- Vegetable selected
- Farmer logged in

✅ **Customer Order:**
- Order qty ≤ Remaining quantity for that bid
- Customer logged in

---

## 8. DISPLAY COMPONENTS

**Farmer View:**
```
My Active Bids
├─ Tomato - ₹45/kg
│  ├─ Available: 85kg / 100kg
│  ├─ Orders Received: 3
│  └─ [Edit Price] [Remove Bid]
│
└─ Carrot - ₹35/kg
   ├─ Available: 120kg / 120kg
   ├─ Orders Received: 0
   └─ [Edit Price] [Remove Bid]
```

**Customer View:**
```
Fresh Vegetables
├─ Tomato
│  ├─ Average Price: ₹43.50/kg
│  ├─ Farmers: 2
│  ├─ Total Available: 235kg
│  │
│  ├─ Individual Bids:
│  │  ├─ ₹45/kg by John Farmer (85kg)
│  │  └─ ₹42/kg by Jane Farmer (150kg)
│  │
│  └─ [Qty Input] [Select Farmer] [Order]
│
└─ Potato
   ├─ Average Price: ₹20/kg
   ├─ Farmers: 1
   └─ ...
```

---

**End of Simplified Algorithm**
