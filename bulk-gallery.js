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

// Bulk Category Gallery Dataset
const bulkCategoryDetails = {
  "watercolor-landscape": {
    title: "Watercolor Landscape and Composition Collection (₹200 - ₹400)",
    description: "Hand-painted atmospheric landscapes featuring serene mountains, lakeside trees, and coastal vistas created with gentle washes of watercolor on archival cotton paper.",
    paintings: window.paintingsData ? window.paintingsData.bulkPaintings["watercolor-landscape"] : []
  },
  "watercolor-folk-art": {
    title: "Watercolor Folk Art Collection (₹200 - ₹300)",
    description: "Traditional floral arrangements, regional patterns, and cultural heritage art styles with intricate design outlines.",
    paintings: window.paintingsData ? window.paintingsData.bulkPaintings["watercolor-folk-art"] : []
  },
  "still-life": {
    title: "Still Life Collection (₹200)",
    description: "Delicate watercolor compositions and graphite pencil drawings featuring household artifacts, stacked teacups, fruit bowls, and botanical elements.",
    paintings: window.paintingsData ? window.paintingsData.bulkPaintings["still-life"] : []
  }
};

// Gallery State
const paintings = window.paintingsData ? window.paintingsData.originals : [];
let cart = [];

function syncSoldPaintings() {
  if (typeof db !== "undefined" && db) {
    db.collection("sold_paintings").get().then(snap => {
      let updated = false;
      snap.forEach(doc => {
        const pId = parseInt(doc.id);
        const paintObj = paintings.find(p => p.id === pId);
        if (paintObj && paintObj.available) {
          paintObj.available = false;
          updated = true;
        }
      });
      if (updated) {
        if (typeof initSimulator === "function") initSimulator();
        if (typeof renderGallery === "function") renderGallery();
        if (typeof renderArtDetails === "function") renderArtDetails();
      }
    }).catch(err => console.warn("Failed to load sold paintings list:", err));
  }
}

let selectedModalPainting = null;
let activeCategoryKey = "watercolor-landscape";
let activeCategoryData = null;

// Initialize Page
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

  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get("category");
  if (catParam && bulkCategoryDetails[catParam]) {
    activeCategoryKey = catParam;
  }
  activeCategoryData = bulkCategoryDetails[activeCategoryKey];

  initNavigation();
  renderCategoryHeader();
  initCategoryCalculator();
  initModals();
  initCheckout();
  updateCartUI();
  syncSoldPaintings();
});

/* Mobile Navigation Drawer Scripts */
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

/* Category Details Render */
function renderCategoryHeader() {
  const titleEl = document.getElementById("category-title");
  const descEl = document.getElementById("category-description");
  const breadcrumbEl = document.getElementById("category-breadcrumb");

  if (titleEl) titleEl.textContent = activeCategoryData.title;
  if (descEl) descEl.textContent = activeCategoryData.description;
  if (breadcrumbEl) breadcrumbEl.textContent = activeCategoryData.title;
}

/* Premium Category Bulk Calculator & Swatch Variant Picker */
function initCategoryCalculator() {
  const qtyInput = document.getElementById("bulk-qty");
  const pricePerUnitEl = document.getElementById("calc-price-unit");
  const totalCostEl = document.getElementById("calc-total-cost");
  const discountSavingsEl = document.getElementById("calc-savings");
  
  const categoryTag = document.getElementById("bulk-category-tag");
  const qtyDecBtn = document.getElementById("bulk-qty-dec");
  const qtyIncBtn = document.getElementById("bulk-qty-inc");
  
  const thumbnailsContainer = document.getElementById("bulk-thumbnails-container");
  const previewImg = document.getElementById("bulk-preview-img");
  const previewTitle = document.getElementById("bulk-preview-title");
  const previewDesc = document.getElementById("bulk-preview-desc");
  const addToCartBtn = document.getElementById("bulk-add-to-cart-btn");

  if (!qtyInput || !thumbnailsContainer) return;

  let selectedBulkPainting = null;

  // (Inquiry deadline setup removed)

  // Hook up quantity adjustment buttons (enforcing only 1 in stock)
  if (qtyDecBtn && qtyIncBtn) {
    qtyDecBtn.style.display = "none";
    qtyIncBtn.style.display = "none";
    qtyInput.readOnly = true;
    qtyInput.value = 1;
    // Add a text helper below the selector
    const helper = document.createElement("div");
    helper.style.fontSize = "0.85rem";
    helper.style.color = "var(--accent-gold)";
    helper.style.marginTop = "0.5rem";
    helper.style.lineHeight = "1.4";
    helper.textContent = "Each painting is a unique hand-painted piece (only 1 in stock). Add other variations to your bag to enjoy bulk discounts.";
    qtyInput.parentNode.parentNode.appendChild(helper);
  }

  // Render thumbnail swatches
  function renderSwatches() {
    const paintingsList = activeCategoryData.paintings || [];
    
    if (paintingsList.length === 0) {
      thumbnailsContainer.innerHTML = "<p style='color:var(--text-secondary); font-size:0.9rem;'>No variations available.</p>";
      return;
    }

    // Get variant parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const variantParam = urlParams.get("variant");
    
    // Find if the variant is in the list, otherwise default to first item
    let startIndex = 0;
    if (variantParam) {
      const foundIdx = paintingsList.findIndex(p => p.id === variantParam);
      if (foundIdx > -1) {
        startIndex = foundIdx;
      }
    }

    thumbnailsContainer.innerHTML = paintingsList.map((art, index) => `
      <div class="bulk-swatch ${index === startIndex ? 'active' : ''}" data-id="${art.id}" title="${art.title}">
        <img src="${art.image}" alt="${art.title}" onerror="this.src='assets/paintings/bulk/WhatsApp Image 2026-06-27 at 9.50.24 PM (1).jpeg';">
      </div>
    `).join("");

    // Select the variation
    selectVariation(paintingsList[startIndex]);

    // Attach click events
    thumbnailsContainer.querySelectorAll(".bulk-swatch").forEach(swatch => {
      swatch.addEventListener("click", () => {
        thumbnailsContainer.querySelectorAll(".bulk-swatch").forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
        
        const id = swatch.getAttribute("data-id");
        const artObj = paintingsList.find(p => p.id === id);
        selectVariation(artObj);
      });
    });
  }

  function selectVariation(art) {
    selectedBulkPainting = art;
    previewImg.src = art.image;
    previewImg.alt = art.title;
    previewTitle.textContent = art.title;
    previewDesc.textContent = art.description;

    const detailsLink = document.getElementById("view-bulk-details-link");
    if (detailsLink) {
      detailsLink.href = `painting-details.html?id=${art.id}&type=bulk-item`;
    }
    
    // Update category tag text
    if (categoryTag) {
      categoryTag.textContent = activeCategoryData.title.toUpperCase();
    }

    // Update base price display
    const basePriceDisplay = document.getElementById("bulk-base-price-display");
    if (basePriceDisplay) {
      basePriceDisplay.textContent = `₹${art.price}`;
    }
    
    calculateBulk();
  }

  // Update calculator calculations on input adjustments
  function calculateBulk() {
    let qty = parseInt(qtyInput.value);

    // Enforce Quantity >= 1
    if (isNaN(qty) || qty < 1) {
      qty = 1;
      qtyInput.value = 1;
    }

    const basePrice = (selectedBulkPainting && selectedBulkPainting.price) ? selectedBulkPainting.price : 200;
    let rate = basePrice;
    let savings = 0;
    
    if (qty >= 10) {
      rate = Math.round(basePrice * 0.50);
      savings = (basePrice - rate) * qty;
    } else if (qty >= 5) {
      rate = Math.round(basePrice * 0.75);
      savings = (basePrice - rate) * qty;
    }

    const totalCost = rate * qty;

    if (pricePerUnitEl) pricePerUnitEl.textContent = `₹${rate.toLocaleString()}`;
    if (totalCostEl) totalCostEl.textContent = `₹${totalCost.toLocaleString()}`;

    // Manage savings row visibility and calculation
    const savingsEl = document.getElementById("calc-savings");
    const savingsRowEl = savingsEl ? savingsEl.closest('.breakdown-row') : null;
    if (savingsRowEl) {
      if (qty < 5) {
        savingsRowEl.style.display = 'none';
      } else {
        savingsRowEl.style.display = 'flex';
        savingsEl.textContent = `₹${savings.toLocaleString()}`;
      }
    }

    // Highlight and dynamically update the bulk pricing tier cards
    const tierCard1 = document.getElementById("tier-card-1");
    const tierCard2 = document.getElementById("tier-card-2");
    const tierCard3 = document.getElementById("tier-card-3");
    if (tierCard1 && tierCard2 && tierCard3) {
      // Reset styles to default
      [tierCard1, tierCard2, tierCard3].forEach(card => {
        card.style.background = "var(--bg-secondary)";
        card.style.borderColor = "var(--glass-border)";
        card.style.boxShadow = "none";
        // Reset child text colors
        const label = card.querySelector('span');
        const priceText = card.querySelector('strong');
        if (label) label.style.color = "var(--text-secondary)";
        if (priceText) priceText.style.color = "var(--text-primary)";
      });

      // Apply active style
      let activeCard = tierCard1;
      let activeColor = "var(--accent-gold)";
      let activeBg = "rgba(197, 155, 63, 0.08)";
      if (qty >= 10) {
        activeCard = tierCard3;
        activeColor = "var(--accent-terracotta)";
        activeBg = "rgba(224, 122, 95, 0.08)";
      } else if (qty >= 5) {
        activeCard = tierCard2;
        activeColor = "var(--accent-gold)";
        activeBg = "rgba(197, 155, 63, 0.08)";
      }
      
      activeCard.style.background = activeBg;
      activeCard.style.borderColor = activeColor;
      activeCard.style.boxShadow = `0 0 12px ${activeColor}22`;
      const activeLabel = activeCard.querySelector('span');
      const activePriceText = activeCard.querySelector('strong');
      if (activeLabel) activeLabel.style.color = activeColor;
      if (activePriceText) activePriceText.style.color = activeColor;
    }
  }

  qtyInput.addEventListener("input", calculateBulk);

  // Initialize swatches display
  renderSwatches();

  // Add selected variation to shopping cart drawer
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      if (!selectedBulkPainting) return;
      
      const item = selectedBulkPainting;
      const cartItemId = `${item.id}_bulk`;
      const existingIndex = cart.findIndex(c => c.cartItemId === cartItemId);

      if (existingIndex > -1) {
        alert(`"${item.title}" is already in your bag. Only 1 unique piece is available.`);
        return;
      } else {
        cart.push({
          cartItemId,
          id: item.id,
          title: `${item.title} (Bulk)`,
          basePrice: item.price || 200,
          price: item.price || 200,
          type: "bulk-stock",
          qty: 1,
          image: item.image,
          dimensions: item.dimensions
        });
      }

      saveCart();
      updateCartUI();
      openCartDrawer();
    });
  }
}

/* Shopping Cart Actions */
function addToCart(item) {
  const cartItemId = `${item.id}_bulk`;
  const existingIndex = cart.findIndex(c => c.cartItemId === cartItemId);

  if (existingIndex > -1) {
    alert(`"${item.title}" is already in your bag. Only 1 unique piece is available.`);
    return;
  } else {
    cart.push({
      cartItemId,
      id: item.id,
      title: `${item.title} (Bulk Stock)`,
      basePrice: item.price || 200,
      price: item.price || 200,
      type: "bulk-stock",
      qty: 1,
      image: item.image,
      dimensions: item.dimensions
    });
  }

  saveCart();
  updateCartUI();
}

function updateCartQty(cartItemId, delta) {
  const index = cart.findIndex(c => c.cartItemId === cartItemId);
  if (index === -1) return;

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

  // Update dynamic shipping notice in the cart footer
  const shippingNoticeEl = document.getElementById("cart-shipping-notice");
  if (shippingNoticeEl) {
    const hasPhysical = cart.some(c => c.type === "original" || c.type === "bulk-stock" || (typeof c.id === "string" && (c.id.startsWith("wl") || c.id.startsWith("wf") || c.id.startsWith("sl"))) || typeof c.id === "number");
    if (cart.length === 0 || !hasPhysical) {
      shippingNoticeEl.style.display = "none";
      shippingNoticeEl.innerHTML = "";
    } else {
      shippingNoticeEl.style.display = "block";
      if (finalTotal < 500) {
        const remaining = 500 - finalTotal;
        shippingNoticeEl.innerHTML = `<i class="fa-solid fa-truck-fast" style="color: var(--accent-gold); margin-right: 0.35rem;"></i> Add <strong>₹${remaining.toLocaleString()}</strong> more for <strong>FREE Shipping</strong>!<br><span style="font-size: 0.75rem; opacity: 0.8;">Otherwise, a ₹50 shipping charge applies.</span>`;
      } else {
        shippingNoticeEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success); margin-right: 0.35rem;"></i> You qualify for <strong>FREE Shipping</strong>!`;
      }
    }
  }

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
    const unitPriceHTML = item.type === "bulk-stock"
      ? `<span class="cart-item-option" style="color: var(--accent-gold); font-weight: 500;">₹${itemOrigPrice} each</span>`
      : "";
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/paintings/bulk/WhatsApp Image 2026-06-27 at 9.50.24 PM (1).jpeg';">
        </div>
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <span class="cart-item-option">${item.dimensions}</span>
          ${unitPriceHTML}
          <span class="cart-item-option">Qty: ${item.qty}</span>
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
  window.location.href = `painting-details.html?id=${id}&type=bulk-item`;
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
    const hasPhysical = cart.some(c => c.type === "original" || c.type === "bulk-stock" || (typeof c.id === "string" && (c.id.startsWith("wl") || c.id.startsWith("wf") || c.id.startsWith("sl"))) || typeof c.id === "number");
    const shipping = (hasPhysical && subtotal < 500) ? 50 : 0;
    const total = subtotal + shipping;
    const amountInPaise = Math.round(total * 100);

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

              // Save full order document to root-level all_orders
              const hasPhysical = cart.some(c => c.type === "original" || c.type === "bulk-stock" || (typeof c.id === "string" && (c.id.startsWith("wl") || c.id.startsWith("wf") || c.id.startsWith("sl"))) || typeof c.id === "number");
              const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
              const shipping = (hasPhysical && subtotal < 500) ? 50 : 0;
              const total = subtotal + shipping;

              const orderRecord = {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                uid: auth.currentUser.uid,
                buyer_name: document.getElementById("chk-name") ? document.getElementById("chk-name").value : (auth.currentUser.displayName || ""),
                buyer_email: auth.currentUser.email,
                shipping_address: document.getElementById("chk-address") ? document.getElementById("chk-address").value : "",
                items: cart.map(item => ({
                  id: item.id,
                  title: item.title,
                  price: item.price,
                  qty: item.qty,
                  type: item.type
                })),
                subtotal: subtotal,
                shipping: shipping,
                total: total,
                status: "paid",
                created_at: firebase.firestore.FieldValue.serverTimestamp()
              };

              if (typeof db !== "undefined" && db) {
                await db.collection("all_orders").doc(response.razorpay_order_id).set(orderRecord)
                  .catch(err => console.warn("Failed to save order to all_orders collection:", err));
              }

              // Mark originals sold locally and in Firestore
              const soldPromises = [];
              cart.forEach(item => {
                if (item.type === "original") {
                  const paintObj = paintings.find(p => p.id === item.id);
                  if (paintObj) paintObj.available = false;
                  if (typeof db !== "undefined" && db) {
                    soldPromises.push(
                      db.collection("sold_paintings").doc(item.id.toString()).set({
                        sold: true,
                        sold_at: firebase.firestore.FieldValue.serverTimestamp()
                      }).catch(err => console.warn("Failed to mark painting sold in db:", err))
                    );
                  }
                }
              });
              if (soldPromises.length > 0) {
                await Promise.all(soldPromises);
              }

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
    const stepContent = document.getElementById(`step-content-${stepNumber}`);
    if (!stepContent) return;

    document.querySelectorAll(".checkout-step-content").forEach(el => el.classList.remove("active"));
    stepContent.classList.add("active");

    document.querySelectorAll(".step-node").forEach(node => {
      const stepVal = parseInt(node.getAttribute("data-step"));
      node.classList.remove("active", "completed");
      if (stepVal === stepNumber) {
        node.classList.add("active");
      } else if (stepVal < stepNumber) {
        node.classList.add("completed");
      }
    });

    const hasPhysical = cart.some(c => c.type === "original" || c.type === "bulk-stock" || (typeof c.id === "string" && (c.id.startsWith("wl") || c.id.startsWith("wf") || c.id.startsWith("sl"))) || typeof c.id === "number");
    const shippingContainer = document.getElementById("shipping-address-container");
    const addressInput = document.getElementById("chk-address");

    if (shippingContainer && addressInput) {
      if (hasPhysical) {
        shippingContainer.style.display = "block";
        addressInput.required = true;
      } else {
        shippingContainer.style.display = "none";
        addressInput.required = false;
      }
    }

    if (stepNumber === 2) {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const shipping = (hasPhysical && subtotal < 500) ? 50 : 0; 
      const total = subtotal + shipping;

      const subtotalEl = document.getElementById("summary-subtotal");
      const shippingEl = document.getElementById("summary-shipping");
      const totalEl = document.getElementById("summary-total");
      if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      if (shippingEl) shippingEl.textContent = shipping > 0 ? `₹${shipping.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "FREE";
      if (totalEl) totalEl.textContent = `₹${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
  }

  function closeCheckoutModal() {
    checkoutOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}
