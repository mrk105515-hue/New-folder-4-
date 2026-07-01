// Firebase Configuration (Replace with your actual Firebase project config values)
const firebaseConfig = {
  apiKey: "AIzaSyBzbHVoBlL3HbjJkypfTE5Qvj1amICtwwg",
  authDomain: "swarnim-store.firebaseapp.com",
  projectId: "swarnim-store",
  storageBucket: "swarnim-store.firebasestorage.app",
  messagingSenderId: "460537722995",
  appId: "1:460537722995:web:44770c0895c1b127199206",
  measurementId: "G-CH1E37H3RZ"
};

// Initialize Firebase compat
let auth, db, functions;
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    functions = firebase.functions();
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

// Shop & Bulk Order Data
const paintings = window.paintingsData ? window.paintingsData.originals : [];

// Bulk Order Pricing Rates (INR per piece)
const bulkRate = 200;

// Bulk Variations Dataset
const bulkPaintings = window.paintingsData ? window.paintingsData.bulkPaintings : {};

// Shop State
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let currentSort = "featured";
let selectedModalPainting = null;

// Initialize Shop Page
document.addEventListener("DOMContentLoaded", () => {
  // Load Cart
  const savedCart = localStorage.getItem("samridhi_art_cart");
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }

  initNavigation();
  renderFilterChips();
  renderGallery();
  initModals();
  initCheckout();
  updateCartUI();
});

/* Navigation Scripts */
function initNavigation() {
  const header = document.getElementById("app-header");
  const mobileTrigger = document.getElementById("mobile-menu-trigger");

  // Sticky header transition on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Mobile menu trigger toggle
  if (mobileTrigger) {
    mobileTrigger.addEventListener("click", () => {
      const nav = document.querySelector("nav");
      if (nav.style.display === "block") {
        nav.style.display = "none";
      } else {
        nav.style.display = "block";
        nav.style.position = "absolute";
        nav.style.top = "100%";
        nav.style.left = "0";
        nav.style.width = "100%";
        nav.style.background = "var(--bg-secondary)";
        nav.style.padding = "2rem";
        nav.style.borderBottom = "1px solid var(--glass-border)";
        
        const navUl = nav.querySelector("ul");
        navUl.style.flexDirection = "column";
        navUl.style.gap = "1.5rem";
        navUl.style.textAlign = "center";
      }
    });
  }
}

/* Gallery Filtering & Rendering */
function renderFilterChips() {
  const chipsContainer = document.getElementById("filter-chips-container");
  if (!chipsContainer) return;

  const categories = [
    { key: "all", label: "All Works" },
    { key: "original", label: "Original Paintings" },
    { key: "bulk", label: "Bulk Orders" },
    { key: "acrylic", label: "Acrylics" }
  ];

  chipsContainer.innerHTML = categories.map(cat => `
    <button class="filter-chip ${cat.key === currentCategory ? 'active' : ''}" data-cat="${cat.key}">
      ${cat.label}
    </button>
  `).join("");

  chipsContainer.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      chipsContainer.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentCategory = chip.getAttribute("data-cat");
      renderGallery();
    });
  });
}

function renderGallery() {
  const gridContainer = document.getElementById("artwork-grid-container");
  const searchInput = document.getElementById("gallery-search");
  const sortSelect = document.getElementById("gallery-sort");
  if (!gridContainer) return;

  searchInput.oninput = (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderGallery();
  };

  sortSelect.onchange = (e) => {
    currentSort = e.target.value;
    renderGallery();
  };

  // Define the 3 bulk categories as cards
  const bulkCategoriesList = [
    {
      categoryKey: "watercolor-landscape",
      title: "Watercolor Landscape and Composition",
      medium: "Watercolor Series (Bulk)",
      dimensions: "A3 Size",
      description: "Atmospheric mountains, lakeside trees, and coastal vistas created with gentle washes of watercolor.",
      isBulk: true
    },
    {
      categoryKey: "watercolor-folk-art",
      title: "Watercolor Folk Art",
      medium: "Folk Art Series (Bulk)",
      dimensions: "A3 Size",
      description: "Traditional floral and regional heritage art styles with intricate design outlines.",
      isBulk: true
    },
    {
      categoryKey: "still-life",
      title: "Still Life",
      medium: "Still Life Series (Bulk)",
      dimensions: "A3 Size",
      description: "Quiet arrangements of household objects, fruit, and glassware in watercolor and graphite sketches.",
      isBulk: true
    }
  ].map(cat => {
    const pList = bulkPaintings[cat.categoryKey] || [];
    const firstImage = pList.length > 0 ? pList[0].image : "assets/paintings/bulk/WhatsApp Image 2026-06-27 at 9.50.24 PM (1).jpeg";
    return {
      ...cat,
      id: `cat_${cat.categoryKey}`,
      image: firstImage,
      category: cat.categoryKey === "still-life" ? "still-life" : "watercolor"
    };
  });

  const allGalleryItems = [
    ...bulkCategoriesList,
    ...paintings.map(p => ({ ...p, isBulk: false }))
  ];

  // Filter
  let filtered = allGalleryItems.filter(art => {
    let matchesCat = true;
    if (currentCategory === "original") {
      matchesCat = !art.isBulk;
    } else if (currentCategory === "bulk") {
      matchesCat = art.isBulk;
    } else if (currentCategory === "acrylic") {
      matchesCat = art.category === "acrylic" || (art.isBulk && art.medium.toLowerCase().includes("acrylic"));
    }

    const matchesSearch = art.title.toLowerCase().includes(searchQuery) ||
                          art.medium.toLowerCase().includes(searchQuery) ||
                          art.description.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  // Helper to get sortable price
  const getSortablePrice = (art) => {
    if (art.isBulk) return 200;
    return art.priceOriginal;
  };

  // Sort
  if (currentSort === "price-asc") {
    filtered.sort((a, b) => getSortablePrice(a) - getSortablePrice(b));
  } else if (currentSort === "price-desc") {
    filtered.sort((a, b) => getSortablePrice(b) - getSortablePrice(a));
  } else if (currentSort === "size-desc") {
    const getSizeArea = (art) => {
      if (art.isBulk) return 12 * 16; // A3 size approximation
      return art.widthInches * art.heightInches;
    };
    filtered.sort((a, b) => getSizeArea(b) - getSizeArea(a));
  }

  gridContainer.innerHTML = filtered.map(art => {
    if (art.isBulk) {
      const pList = bulkPaintings[art.categoryKey] || [];
      const swatchesHTML = pList.map((p, idx) => `
        <span class="shop-bulk-swatch ${idx === 0 ? 'active' : ''}" data-variant-id="${p.id}" data-image="${p.image}" data-title="${p.title}" style="width: 32px; height: 32px; border-radius: 4px; border: 1.5px solid var(--glass-border); overflow: hidden; cursor: pointer; display: inline-block; transition: all 0.2s ease; margin-right: 0.2rem;">
          <img src="${p.image}" alt="${p.title}" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='assets/paintings/bulk/WhatsApp Image 2026-06-27 at 9.50.24 PM (1).jpeg';">
        </span>
      `).join("");
      
      const defaultVariantId = pList.length > 0 ? pList[0].id : art.id;
      const defaultTitle = pList.length > 0 ? `${pList[0].title} (Bulk)` : art.title;

      const prices = pList.map(p => p.price || 200);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 200;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 200;
      const priceStr = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;

      return `
        <div class="artwork-card bulk-artwork-card" data-category="${art.categoryKey}" data-variant="${defaultVariantId}">
          <div class="artwork-img-container">
            <img class="bulk-main-image" src="${art.image}" alt="${art.title}" onerror="this.src='assets/paintings/bulk/WhatsApp Image 2026-06-27 at 9.50.24 PM (1).jpeg';" style="width: 100%; height: 100%; object-fit: contain;">
            <div class="artwork-badges">
              <span class="badge badge-bulk-tag">Bulk Order</span>
              <span class="badge badge-print">${priceStr} / piece</span>
            </div>
            <div class="artwork-overlay">
              <div style="display: flex; gap: 0.5rem;">
                <button class="circle-btn view-bulk-btn" data-category="${art.categoryKey}" data-variant="${defaultVariantId}" title="Configure Bulk Order"><i class="fa-solid fa-calculator"></i></button>
                <button class="circle-btn quick-add-bulk-btn" data-category="${art.categoryKey}" data-variant="${defaultVariantId}" title="Quick Add to Bag"><i class="fa-solid fa-plus"></i></button>
              </div>
            </div>
          </div>
          <div class="artwork-info">
            <span class="artwork-medium">${art.medium}</span>
            <h3 class="artwork-title bulk-active-title" style="margin-bottom: 0.5rem;">${defaultTitle}</h3>
            
            <div class="shop-bulk-swatches-picker" style="display: flex; gap: 0.4rem; margin: 0.6rem 0; flex-wrap: wrap;">
              ${swatchesHTML}
            </div>

            <div class="artwork-details-row">
              <span class="artwork-size">${art.dimensions}</span>
              <span class="artwork-price" style="color: var(--accent-terracotta);">${priceStr}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      // Standard Card
      const isSold = !art.available;
      const badgeHTML = isSold 
        ? `<span class="badge badge-sold">Sold</span>`
        : `<span class="badge badge-original">Original Available</span>`;
        
      const overlayBtn = isSold
        ? `<button class="circle-btn view-detail-btn" data-id="${art.id}" title="View Details"><i class="fa-solid fa-magnifying-glass"></i></button>`
        : `<button class="circle-btn add-cart-btn" data-id="${art.id}" title="Add Original Canvas to Bag"><i class="fa-solid fa-plus"></i></button>`;

      return `
        <div class="artwork-card">
          <div class="artwork-img-container">
            <img src="${art.image}" alt="${art.title}" onerror="this.src='assets/paintings/WhatsApp Image 2026-06-29 at 8.45.56 PM.jpeg';">
            <div class="artwork-badges">
              ${badgeHTML}
            </div>
            <div class="artwork-overlay">
              <div style="display: flex; gap: 0.5rem;">
                <button class="circle-btn view-detail-btn" data-id="${art.id}" title="Quick View"><i class="fa-solid fa-eye"></i></button>
                ${overlayBtn}
              </div>
            </div>
          </div>
          <div class="artwork-info">
            <span class="artwork-medium">${art.medium}</span>
            <h3 class="artwork-title">${art.title}</h3>
            <div class="artwork-details-row">
              <span class="artwork-size">${art.widthInches}" x ${art.heightInches}"</span>
              <span class="artwork-price">${isSold ? 'Sold Out' : '₹' + art.priceOriginal}</span>
            </div>
          </div>
        </div>
      `;
    }
  }).join("");

  // Attach card event listeners for Standard works
  gridContainer.querySelectorAll(".view-detail-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute("data-id"));
      window.location.href = `painting-details.html?id=${id}&type=original`;
    });
  });

  gridContainer.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute("data-id"));
      const artObj = paintings.find(p => p.id === id);
      addToCart(artObj, "original");
      openCartDrawer();
    });
  });

  // Attach card event listeners for Bulk works
  gridContainer.querySelectorAll(".bulk-artwork-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.getAttribute("data-category");
      const variant = card.getAttribute("data-variant");
      if (category) {
        window.location.href = `category-gallery.html?category=${category}&variant=${variant}`;
      }
    });
  });

  gridContainer.querySelectorAll(".view-bulk-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const category = btn.getAttribute("data-category");
      const variant = btn.getAttribute("data-variant");
      if (category) {
        window.location.href = `category-gallery.html?category=${category}&variant=${variant}`;
      }
    });
  });

  gridContainer.querySelectorAll(".quick-add-bulk-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const category = btn.getAttribute("data-category");
      const variant = btn.getAttribute("data-variant");
      
      const paintingsList = bulkPaintings[category] || [];
      const item = paintingsList.find(p => p.id === variant);
      if (item) {
        addToCart(item, "bulk-stock");
        openCartDrawer();
      }
    });
  });

  gridContainer.querySelectorAll(".shop-bulk-swatch").forEach(swatch => {
    // Initialize border styling for active swatch on render
    if (swatch.classList.contains("active")) {
      swatch.style.borderColor = "var(--accent-gold)";
      swatch.style.boxShadow = "0 0 6px var(--accent-gold)";
    }
    
    swatch.addEventListener("click", (e) => {
      e.stopPropagation();
      
      const card = swatch.closest(".bulk-artwork-card");
      if (!card) return;
      
      card.querySelectorAll(".shop-bulk-swatch").forEach(s => {
        s.classList.remove("active");
        s.style.borderColor = "var(--glass-border)";
        s.style.boxShadow = "none";
      });
      
      swatch.classList.add("active");
      swatch.style.borderColor = "var(--accent-gold)";
      swatch.style.boxShadow = "0 0 6px var(--accent-gold)";
      
      const newImg = swatch.getAttribute("data-image");
      const newTitle = swatch.getAttribute("data-title");
      const variantId = swatch.getAttribute("data-variant-id");
      
      const mainImg = card.querySelector(".bulk-main-image");
      if (mainImg) mainImg.src = newImg;
      
      const titleEl = card.querySelector(".bulk-active-title");
      if (titleEl) titleEl.textContent = `${newTitle} (Bulk)`;
      
      card.setAttribute("data-variant", variantId);
      
      const viewBtn = card.querySelector(".view-bulk-btn");
      if (viewBtn) viewBtn.setAttribute("data-variant", variantId);
      
      const quickAddBtn = card.querySelector(".quick-add-bulk-btn");
      if (quickAddBtn) quickAddBtn.setAttribute("data-variant", variantId);
    });
  });
}

/* Shopping Cart Actions */
function addToCart(item, type) {
  const cartItemId = `${item.id}_${type}`;
  const existingIndex = cart.findIndex(c => c.cartItemId === cartItemId);

  if (existingIndex > -1) {
    alert(`"${item.title}" is already in your bag. Only 1 unique piece of this artwork is available in stock.`);
    return;
  } else {
    if (type === "original" && !item.available) {
      alert(`Sorry, the original canvas of "${item.title}" has been sold.`);
      return;
    }

    let price, title, basePrice;
    if (type === "bulk-stock") {
      basePrice = item.price || 200;
      price = item.price || 200;
      title = `${item.title} (Bulk)`;
    } else {
      basePrice = item.priceOriginal;
      price = item.priceOriginal;
      title = `${item.title} (Original Canvas)`;
    }
    
    cart.push({
      cartItemId,
      id: item.id,
      title,
      basePrice,
      price,
      type,
      qty: 1,
      image: item.image,
      dimensions: item.dimensions || `${item.widthInches}" x ${item.heightInches}"`
    });
  }

  saveCart();
  updateCartUI();
}

function updateCartQty(cartItemId, delta) {
  const index = cart.findIndex(c => c.cartItemId === cartItemId);
  if (index === -1) return;

  if (cart[index].type === "original") return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(cartItemId) {
  cart = cart.filter(c => c.cartItemId !== cartItemId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  const totalBulkQty = cart.filter(item => item.type === "bulk-stock").reduce((sum, item) => sum + item.qty, 0);
  let discountMultiplier = 1.0;
  if (totalBulkQty >= 10) {
    discountMultiplier = 0.50; // 50% discount
  } else if (totalBulkQty >= 5) {
    discountMultiplier = 0.75; // 25% discount
  }
  cart.forEach(item => {
    if (item.type === "bulk-stock") {
      const base = window.paintingsData ? window.paintingsData.getBulkBasePrice(item.id) : 200;
      item.basePrice = base;
      item.price = Math.round(base * discountMultiplier);
    }
  });
  localStorage.setItem("samridhi_art_cart", JSON.stringify(cart));
}

function updateCartUI() {
  const countBadge = document.getElementById("cart-count");
  const itemsContainer = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("cart-subtotal");
  if (!countBadge) return;

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  countBadge.textContent = totalItems;
  countBadge.style.display = totalItems > 0 ? "block" : "none";

  // finalTotal is what the customer actually pays
  const finalTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  // Calculate total original subtotal and savings
  const originalSubtotal = cart.reduce((sum, item) => {
    const base = item.type === "bulk-stock" ? (window.paintingsData ? window.paintingsData.getBulkBasePrice(item.id) : 200) : (item.basePrice || item.price || 200);
    return sum + (base * item.qty);
  }, 0);
  const totalBulkSavings = originalSubtotal - finalTotal;

  // Manage display elements for the detailed pricing breakdown
  const origContainer = document.getElementById("cart-original-subtotal-container");
  const origVal = document.getElementById("cart-original-subtotal-val");
  const savingsContainer = document.getElementById("cart-savings-container");
  const savingsVal = document.getElementById("cart-savings-val");
  const totalLabel = document.getElementById("cart-total-label");

  if (totalBulkSavings > 0) {
    if (origContainer && origVal) {
      origContainer.style.display = "flex";
      origVal.textContent = `₹${originalSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    if (savingsContainer && savingsVal) {
      savingsContainer.style.display = "flex";
      savingsVal.textContent = `-₹${totalBulkSavings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    if (totalLabel) totalLabel.textContent = "Total";
  } else {
    if (origContainer) origContainer.style.display = "none";
    if (savingsContainer) savingsContainer.style.display = "none";
    if (totalLabel) totalLabel.textContent = "Subtotal";
  }

  // Display the final amount to pay
  subtotalEl.textContent = `₹${finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <i class="fa-solid fa-bag-shopping"></i>
        <p>Your bag is currently empty.</p>
        <button class="btn btn-secondary btn-sm" id="cart-empty-shop-btn">Continue Shopping</button>
      </div>
    `;
    document.getElementById("cart-empty-shop-btn").onclick = closeCartDrawer;
    return;
  }

  itemsContainer.innerHTML = cart.map(item => {
    const itemOrigPrice = item.type === "bulk-stock" ? (window.paintingsData ? window.paintingsData.getBulkBasePrice(item.id) : 200) : (item.basePrice || item.price || 200);
    const qtyHTML = `<span class="cart-item-option">Qty: ${item.qty}</span>`;

    const unitPriceHTML = item.type === "bulk-stock"
      ? `<span class="cart-item-option" style="color: var(--accent-gold); font-weight: 500;">₹${itemOrigPrice} each</span>`
      : "";

    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/paintings/WhatsApp Image 2026-06-29 at 8.45.56 PM.jpeg';">
        </div>
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <span class="cart-item-option">${item.dimensions}</span>
          ${unitPriceHTML}
          ${qtyHTML}
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">₹${(itemOrigPrice * item.qty).toLocaleString()}</span>
          <button class="cart-item-remove" data-id="${item.cartItemId}"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
    `;
  }).join("");

  itemsContainer.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.getAttribute("data-id")));
  });
}

function openCartDrawer() {
  document.getElementById("cart-drawer").classList.add("active");
  document.getElementById("cart-drawer-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
  document.getElementById("cart-drawer").classList.remove("active");
  document.getElementById("cart-drawer-overlay").classList.remove("active");
  document.body.style.overflow = "auto";
}

/* Modals Management */
function initModals() {
  const cartTrigger = document.getElementById("cart-trigger");
  const cartClose = document.getElementById("cart-close");
  const cartOverlay = document.getElementById("cart-drawer-overlay");

  const paintingOverlay = document.getElementById("painting-modal-overlay");
  const paintingClose = document.getElementById("painting-modal-close");

  cartTrigger.addEventListener("click", openCartDrawer);
  cartClose.addEventListener("click", closeCartDrawer);
  cartOverlay.addEventListener("click", closeCartDrawer);

  paintingClose.addEventListener("click", closePaintingModal);
  paintingOverlay.addEventListener("click", (e) => {
    if (e.target === paintingOverlay) closePaintingModal();
  });
}

function openPaintingModal(id) {
  const art = paintings.find(p => p.id === id);
  if (!art) return;

  selectedModalPainting = art;

  const modalImg = document.getElementById("modal-art-img");
  const modalTitle = document.getElementById("modal-art-title");
  const modalMeta = document.getElementById("modal-art-meta");
  const modalDesc = document.getElementById("modal-art-desc");
  const optionsList = document.getElementById("modal-art-options-list");
  const buyBtn = document.getElementById("modal-art-buy-btn");

  modalImg.src = art.image;
  modalImg.alt = art.title;
  modalTitle.textContent = art.title;
  modalMeta.textContent = `${art.medium} • ${art.widthInches}" x ${art.heightInches}"`;
  modalDesc.textContent = art.description;

  let optionsHTML = "";
  if (art.available) {
    optionsHTML += `
      <div style="padding: 0.5rem 0;">
        <span style="font-weight:600; color:var(--text-primary); font-size: 1.1rem; display: block; margin-bottom: 0.25rem;">Original Canvas</span>
        <span style="font-size:0.95rem; color:var(--accent-gold); font-weight: 600;">₹${art.priceOriginal.toLocaleString()}</span>
        <span style="font-size:0.85rem; color:var(--text-secondary); display: block; margin-top: 0.25rem;">Unique Textured Piece</span>
      </div>
    `;
    buyBtn.disabled = false;
    buyBtn.textContent = "Add Original Canvas to Bag";
    buyBtn.style.display = "block";
  } else {
    optionsHTML += `
      <div style="font-size: 1.1rem; color: var(--error); font-weight:600; padding: 0.5rem 0;">
        Original Canvas Sold Out
      </div>
    `;
    buyBtn.disabled = true;
    buyBtn.textContent = "Sold Out";
    buyBtn.style.display = "none";
  }

  optionsList.innerHTML = optionsHTML;

  buyBtn.onclick = () => {
    if (selectedModalPainting && selectedModalPainting.available) {
      addToCart(selectedModalPainting, "original");
      closePaintingModal();
      openCartDrawer();
    }
  };

  document.getElementById("painting-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePaintingModal() {
  document.getElementById("painting-modal-overlay").classList.remove("active");
  document.body.style.overflow = "auto";
  selectedModalPainting = null;
}

/* Checkout Logic */
function initCheckout() {
  const checkoutTrigger = document.getElementById("checkout-trigger");
  const checkoutOverlay = document.getElementById("checkout-modal-overlay");
  const checkoutClose = document.getElementById("checkout-modal-close");
  const addressForm = document.getElementById("checkout-form-address");
  const paymentForm = document.getElementById("checkout-form-payment");
  const prevBtn = document.getElementById("checkout-prev-btn");
  const doneBtn = document.getElementById("checkout-done-btn");

  if (!checkoutTrigger) return;

  // Auth form elements
  const authForm = document.getElementById("checkout-auth-form");
  const authTitle = document.getElementById("auth-title");
  const authSubmitBtn = document.getElementById("auth-submit-btn");
  const authToggleLink = document.getElementById("auth-toggle-link");
  const logoutBtn = document.getElementById("checkout-logout-btn");
  const userProfileBtn = document.getElementById("user-profile-btn");

  let isRegisterMode = false;

  // Toggle register/login mode
  if (authToggleLink) {
    authToggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      if (isRegisterMode) {
        authTitle.textContent = "Create Account";
        authSubmitBtn.textContent = "Register";
        authToggleLink.textContent = "Log In";
        const labelNode = authToggleLink.previousSibling;
        if (labelNode) labelNode.textContent = "Already have an account? ";
      } else {
        authTitle.textContent = "Log In to Checkout";
        authSubmitBtn.textContent = "Log In";
        authToggleLink.textContent = "Register";
        const labelNode = authToggleLink.previousSibling;
        if (labelNode) labelNode.textContent = "Don't have an account? ";
      }
    });
  }

  // Handle Authentication submit
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;

      authSubmitBtn.disabled = true;
      const originalText = authSubmitBtn.textContent;
      authSubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

      try {
        if (isRegisterMode) {
          // Register
          await auth.createUserWithEmailAndPassword(email, password);
          const user = auth.currentUser;
          await user.updateProfile({
            displayName: email.split('@')[0]
          });
          // Save basic profile
          await db.collection("users").doc(user.uid).set({
            email: email,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Log In
          await auth.signInWithEmailAndPassword(email, password);
        }
      } catch (err) {
        alert("Authentication Error: " + err.message);
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = originalText;
      }
    });
  }

  // Handle Sign Out
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to log out?")) {
        await auth.signOut();
      }
    });
  }

  // Handle Google Sign-In
  const googleBtn = document.querySelector(".google-signin-btn");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      if (typeof auth === 'undefined') return;
      googleBtn.disabled = true;
      const originalText = googleBtn.innerHTML;
      googleBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting...`;
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        if (user && db) {
          await db.collection("users").doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }
      } catch (err) {
        console.error("Google Sign-In Error:", err);
        alert("Google Sign-In Error: " + err.message);
      } finally {
        googleBtn.disabled = false;
        googleBtn.innerHTML = originalText;
      }
    });
  }

  // Header User Icon action
  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", () => {
      openCheckoutStep(1);
      checkoutOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  }

  // Observe Firebase Auth state
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged(async (user) => {
      const authContainer = document.getElementById("checkout-auth-container");
      const shippingContainer = document.getElementById("checkout-shipping-container");
      const userIcon = document.getElementById("user-status-icon");

      if (user) {
        if (authContainer) authContainer.style.display = "none";
        if (shippingContainer) shippingContainer.style.display = "block";

        const chkEmail = document.getElementById("chk-email");
        const chkName = document.getElementById("chk-name");
        const chkAddress = document.getElementById("chk-address");

        if (chkEmail) chkEmail.value = user.email;
        if (chkName) chkName.value = user.displayName || "";

        try {
          const doc = await db.collection("users").doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            if (data.name && chkName) chkName.value = data.name;
            if (data.shipping_address && chkAddress) chkAddress.value = data.shipping_address;
          }
        } catch (e) {
          console.warn("Could not retrieve user shipping details:", e);
        }

        if (userIcon) {
          userIcon.className = "fa-solid fa-circle-user";
          userIcon.style.color = "var(--accent-terracotta)";
        }
        if (userProfileBtn) {
          userProfileBtn.title = `Account Profile (${user.email})`;
        }
      } else {
        if (authContainer) authContainer.style.display = "block";
        if (shippingContainer) shippingContainer.style.display = "none";

        if (authSubmitBtn) {
          authSubmitBtn.disabled = false;
          authSubmitBtn.textContent = isRegisterMode ? "Register" : "Log In";
        }
        if (authForm) authForm.reset();

        if (userIcon) {
          userIcon.className = "fa-regular fa-user";
          userIcon.style.color = "var(--text-primary)";
        }
        if (userProfileBtn) {
          userProfileBtn.title = "Sign In / Account";
        }
      }
    });
  }

  checkoutTrigger.addEventListener("click", () => {
    if (cart.length === 0) return;
    closeCartDrawer();
    openCheckoutStep(1);
    checkoutOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  checkoutClose.addEventListener("click", closeCheckoutModal);
  checkoutOverlay.addEventListener("click", (e) => {
    if (e.target === checkoutOverlay) closeCheckoutModal();
  });

  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth ? auth.currentUser : null;
    if (user) {
      const nameVal = document.getElementById("chk-name").value;
      const addressVal = document.getElementById("chk-address") ? document.getElementById("chk-address").value : "";
      try {
        await db.collection("users").doc(user.uid).set({
          name: nameVal,
          shipping_address: addressVal,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to update user profile document:", err);
      }
    }

    openCheckoutStep(2);
  });

  prevBtn.addEventListener("click", () => openCheckoutStep(1));

  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const nameVal = document.getElementById("chk-name").value;
    const emailVal = document.getElementById("chk-email").value;
    const addressVal = document.getElementById("chk-address") ? document.getElementById("chk-address").value : "";
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const amountInPaise = Math.round(subtotal * 100);

    const paySubmitBtn = paymentForm.querySelector('button[type="submit"]');
    const originalText = "Pay with Razorpay";
    paySubmitBtn.disabled = true;
    paySubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

    try {
      if (typeof firebase === 'undefined' || typeof functions === 'undefined' || !auth.currentUser) {
        throw new Error("User must be authenticated to check out via Firebase Cloud Functions.");
      }

      // 1. Create order on the backend via Firebase Cloud Function
      const createRazorpayOrderFn = functions.httpsCallable('createRazorpayOrder');
      const orderResponse = await createRazorpayOrderFn({ amount: amountInPaise });
      
      const orderData = orderResponse.data;
      const orderId = orderData.order_id;

      // 2. Configure Razorpay Options
      const options = {
        "key": "rzp_live_T6XEdh2x0G9PKL",
        "amount": orderData.amount,
        "currency": orderData.currency,
        "name": "Samridhi Art Studio",
        "description": "Art Store Purchase",
        "image": "assets/artist_portrait.jpg",
        "order_id": orderId,
        "handler": async function (response) {
          paySubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying Payment...`;

          try {
            // 3. Verify signature on backend via Firebase Cloud Function
            const verifyRazorpayPaymentFn = functions.httpsCallable('verifyRazorpayPayment');
            const verifyResult = await verifyRazorpayPaymentFn({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResult.data && verifyResult.data.verified) {
              paySubmitBtn.disabled = false;
              paySubmitBtn.textContent = originalText;

              cart.forEach(item => {
                if (item.type === "original") {
                  const paintObj = paintings.find(p => p.id === item.id);
                  if (paintObj) paintObj.available = false;
                }
              });

              cart = [];
              saveCart();
              updateCartUI();
              if (typeof renderGallery === "function") renderGallery();
              
              const successParagraph = document.querySelector(".success-screen p");
              if (successParagraph) {
                successParagraph.innerHTML = `Your payment was successfully processed. Payment ID: <strong>${response.razorpay_payment_id}</strong>. A confirmation email has been dispatched.`;
              }

              openCheckoutStep(3);
            } else {
              throw new Error("Payment signature verification failed.");
            }
          } catch (verifyError) {
            alert("Verification Error: " + verifyError.message);
            paySubmitBtn.disabled = false;
            paySubmitBtn.textContent = originalText;
          }
        },
        "modal": {
          "ondismiss": function() {
            paySubmitBtn.disabled = false;
            paySubmitBtn.textContent = originalText;
          }
        },
        "prefill": {
          "name": nameVal,
          "email": emailVal
        },
        "notes": {
          "address": addressVal
        },
        "theme": {
          "color": "#D46A4F"
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response){
          alert("Payment failed: " + response.error.description);
          paySubmitBtn.disabled = false;
          paySubmitBtn.textContent = originalText;
      });
      rzp.open();

    } catch (err) {
      console.warn("Firebase Order failed or missing. Falling back to local/simulation mode:", err.message);
      
      const options = {
        "key": "rzp_live_T6XEdh2x0G9PKL",
        "amount": amountInPaise,
        "currency": "INR",
        "name": "Samridhi Art Studio",
        "description": "Art Store Purchase (Offline Simulation)",
        "image": "assets/artist_portrait.jpg",
        "handler": function (response) {
          paySubmitBtn.disabled = false;
          paySubmitBtn.textContent = originalText;

          cart.forEach(item => {
            if (item.type === "original") {
              const paintObj = paintings.find(p => p.id === item.id);
              if (paintObj) paintObj.available = false;
            }
          });

          cart = [];
          saveCart();
          updateCartUI();
          if (typeof renderGallery === "function") renderGallery();
          
          const successParagraph = document.querySelector(".success-screen p");
          if (successParagraph) {
            successParagraph.innerHTML = `Your payment was successfully processed. Payment ID: <strong>${response.razorpay_payment_id}</strong>. (Simulation Mode).`;
          }

          openCheckoutStep(3);
        },
        "modal": {
          "ondismiss": function() {
            paySubmitBtn.disabled = false;
            paySubmitBtn.textContent = originalText;
          }
        },
        "prefill": {
          "name": nameVal,
          "email": emailVal
        },
        "notes": {
          "address": addressVal
        },
        "theme": {
          "color": "#D46A4F"
        }
      };

      try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
            alert("Payment failed: " + response.error.description);
            paySubmitBtn.disabled = false;
            paySubmitBtn.textContent = originalText;
        });
        rzp.open();
      } catch (fallbackErr) {
        alert("Error initiating checkout: " + fallbackErr.message);
        paySubmitBtn.disabled = false;
        paySubmitBtn.textContent = originalText;
      }
    }
  });

  doneBtn.addEventListener("click", closeCheckoutModal);

  // Check URL query parameters for login redirection triggers
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'login' && checkoutOverlay) {
    setTimeout(() => {
      openCheckoutStep(1);
      checkoutOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    }, 400);
  }

  function openCheckoutStep(stepNumber) {
    document.querySelectorAll(".checkout-step-content").forEach(el => el.classList.remove("active"));
    document.getElementById(`step-content-${stepNumber}`).classList.add("active");

    document.querySelectorAll(".step-node").forEach(node => {
      const stepVal = parseInt(node.getAttribute("data-step"));
      node.classList.remove("active", "completed");
      if (stepVal === stepNumber) {
        node.classList.add("active");
      } else if (stepVal < stepNumber) {
        node.classList.add("completed");
      }
    });

    if (stepNumber === 2) {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      document.getElementById("summary-subtotal").textContent = `₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      document.getElementById("summary-total").textContent = `₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
  }

  function closeCheckoutModal() {
    checkoutOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// (initBulkCalculator and its related handlers removed)
