// Bulk Category Gallery Dataset
const bulkCategoryDetails = {
  "watercolor-landscape": {
    title: "Watercolor Landscape Collection",
    description: "Hand-painted atmospheric landscapes featuring serene mountains, lakeside trees, and coastal vistas created with gentle washes of watercolor on archival cotton paper.",
    paintings: [
      {
        id: "wl1",
        title: "Lake Reflections",
        medium: "Watercolor on Paper",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_landscape_lake_boat.jpg",
        description: "A serene lake view with a small boat resting near the shore under soft hills."
      },
      {
        id: "wl2",
        title: "River Sunset",
        medium: "Watercolor on Paper",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_landscape_river_sunset.jpg",
        description: "Warm sunset hues reflecting on a gentle river winding through low hills."
      },
      {
        id: "wl3",
        title: "Monochrome Village",
        medium: "Watercolor on Paper",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_landscape_monochrome_village.jpg",
        description: "A traditional monochrome wash study showing simple village huts and trees."
      },
      {
        id: "wl4",
        title: "Evening Bonfire",
        medium: "Watercolor on Paper",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_landscape_village_bonfire.jpg",
        description: "A cozy evening scene in a village with a bonfire, trees, and figures."
      },
      {
        id: "wl5",
        title: "Village Pathway",
        medium: "Watercolor on Paper",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_landscape_village_path.jpg",
        description: "A rustic village lane winding past thatched huts and lush green trees."
      }
    ]
  },
  "watercolor-folk-art": {
    title: "Watercolor Folk Art Collection",
    description: "Traditional floral arrangements, regional patterns, and cultural heritage art styles with intricate design outlines.",
    paintings: [
      {
        id: "wf1",
        title: "Ceremonial Elephant",
        medium: "Folk Art Watercolor",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_folk_art_elephant.jpg",
        description: "A decorated traditional Indian elephant with fine patterns, lines, and stripes in folk art style."
      }
    ]
  },
  "still-life": {
    title: "Still Life Collection",
    description: "Quiet arrangements of household objects, fruit, and glassware in watercolor and graphite sketches.",
    paintings: [
      {
        id: "sl1",
        title: "Wine & Grapes Study",
        medium: "Watercolor Still Life",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_still_life_wine.jpg",
        description: "A classic watercolor study of a wine bottle, half-filled glass, and a bunch of grapes on a tabletop."
      },
      {
        id: "sl2",
        title: "Stacked Teacups",
        medium: "Watercolor Still Life",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/watercolor_still_life_teacups.jpg",
        description: "A colorful, vibrant study of stacked ceramic teacups highlighting shadows and glazed surfaces."
      },
      {
        id: "sl3",
        title: "Jug and Fruits Sketch",
        medium: "Graphite on Paper",
        price: 200,
        dimensions: "A3 Size",
        image: "assets/paintings/bulk/pencil_still_life_jug_fruit.jpg",
        description: "A detailed graphite study of a traditional jug, apple, and pear capturing fine textures and light source gradients."
      }
    ]
  }
};

// Gallery State
let cart = [];
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
        <img src="${art.image}" alt="${art.title}" onerror="this.src='assets/paintings/sunset_solitude.png';">
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
    
    // Update category tag text
    if (categoryTag) {
      categoryTag.textContent = activeCategoryData.title.toUpperCase();
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

    let rate = 200;
    let savings = 0;
    if (qty >= 10) {
      rate = 100;
      savings = (200 - 100) * qty;
    } else if (qty >= 5) {
      rate = 150;
      savings = (200 - 150) * qty;
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

    // Highlight the active pricing tier card
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
        const price = card.querySelector('strong');
        if (label) label.style.color = "var(--text-secondary)";
        if (price) price.style.color = "var(--text-primary)";
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
      const activePrice = activeCard.querySelector('strong');
      if (activeLabel) activeLabel.style.color = activeColor;
      if (activePrice) activePrice.style.color = activeColor;
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
          price: 200,
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
      price: item.price,
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
  let rate = 200;
  if (totalBulkQty >= 10) {
    rate = 100;
  } else if (totalBulkQty >= 5) {
    rate = 150;
  }
  cart.forEach(item => {
    if (item.type === "bulk-stock") {
      item.price = rate;
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  subtotalEl.textContent = `₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  // Calculate total savings
  const totalBulkSavings = cart.filter(item => item.type === "bulk-stock").reduce((sum, item) => sum + ((200 - item.price) * item.qty), 0);
  const savingsContainer = document.getElementById("cart-savings-container");
  const savingsVal = document.getElementById("cart-savings-val");
  
  if (savingsContainer && savingsVal) {
    if (totalBulkSavings > 0) {
      savingsContainer.style.display = "flex";
      savingsVal.textContent = `-₹${totalBulkSavings.toLocaleString()}`;
    } else {
      savingsContainer.style.display = "none";
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
    const unitPriceHTML = item.type === "bulk-stock"
      ? `<span class="cart-item-option" style="color: var(--accent-gold); font-weight: 500;">₹${item.price} each</span>`
      : "";
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/paintings/sunset_solitude.png';">
        </div>
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <span class="cart-item-option">${item.dimensions}</span>
          ${unitPriceHTML}
          <span class="cart-item-option">Qty: 1</span>
        </div>
        <div class="cart-item-right">
          <span class="cart-item-price">₹${(item.price * item.qty).toLocaleString()}</span>
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
  const art = activeCategoryData.paintings.find(p => p.id === id);
  if (!art) return;

  selectedModalPainting = art;

  const modalImg = document.getElementById("modal-art-img");
  const modalTitle = document.getElementById("modal-art-title");
  const modalMeta = document.getElementById("modal-art-meta");
  const modalDesc = document.getElementById("modal-art-desc");
  const buyBtn = document.getElementById("modal-art-buy-btn");

  modalImg.src = art.image;
  modalImg.alt = art.title;
  modalTitle.textContent = art.title;
  modalMeta.textContent = `${art.medium} • ${art.dimensions}`;
  modalDesc.textContent = art.description;

  buyBtn.onclick = () => {
    addToCart(selectedModalPainting);
    closePaintingModal();
    openCartDrawer();
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

  addressForm.addEventListener("submit", (e) => {
    e.preventDefault();
    openCheckoutStep(2);
  });

  prevBtn.addEventListener("click", () => openCheckoutStep(1));

  paymentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const paySubmitBtn = paymentForm.querySelector('button[type="submit"]');
    paySubmitBtn.disabled = true;
    paySubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

    setTimeout(() => {
      paySubmitBtn.disabled = false;
      paySubmitBtn.textContent = "Complete Order";
      cart = [];
      saveCart();
      updateCartUI();
      openCheckoutStep(3);
    }, 2000);
  });

  doneBtn.addEventListener("click", closeCheckoutModal);

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
