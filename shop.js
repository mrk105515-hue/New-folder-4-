// Shop & Bulk Order Data
const paintings = [
  {
    id: 1,
    title: "Sunset Solitude",
    medium: "Oil on Canvas",
    priceOriginal: 12000,
    widthInches: 30,
    heightInches: 24,
    image: "assets/paintings/sunset_solitude.png",
    featured: true,
    category: "oil",
    available: true,
    description: "A premium impasto landscape painting capturing a warm golden sunset over a peaceful alpine lake. Made with thick layers of textured oil paint and subtle metallic gold leaf highlights."
  },
  {
    id: 2,
    title: "Ocean Whisper",
    medium: "Acrylic & Gold Leaf",
    priceOriginal: 9500,
    widthInches: 40,
    heightInches: 30,
    image: "assets/paintings/ocean_whisper.png",
    featured: false,
    category: "acrylic",
    available: true,
    description: "A dramatic abstract representation of deep ocean waves, balancing deep sea blue, indigo, and emerald hues with dynamic, hand-applied gold leaf textures."
  },
  {
    id: 3,
    title: "Silent Forest",
    medium: "Oil on Panel",
    priceOriginal: 8500,
    widthInches: 24,
    heightInches: 20,
    image: "assets/paintings/silent_forest.png",
    featured: false,
    category: "oil",
    available: true,
    description: "A quiet, moody study of a deep pine forest enveloped in thick morning fog. Light rays filter gently through the trees."
  },
  {
    id: 4,
    title: "Golden Bloom",
    medium: "Mixed Media & Gold Leaf",
    priceOriginal: 14000,
    widthInches: 36,
    heightInches: 36,
    image: "assets/paintings/golden_bloom.png",
    featured: false,
    category: "mixed",
    available: false,
    description: "Delicate textured wildflowers blooming against a rich dark charcoal backdrop. Samridhi combines high-quality oil pigments with gold leaf details."
  }
];

// Bulk Order Pricing Rates (INR per piece)
const bulkRate = 200;

// Bulk Variations Dataset
const bulkPaintings = {
  "watercolor-landscape": [
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
  ],
  "watercolor-folk-art": [
    {
      id: "wf1",
      title: "Ceremonial Elephant",
      medium: "Folk Art Watercolor",
      price: 200,
      dimensions: "A3 Size",
      image: "assets/paintings/bulk/watercolor_folk_art_elephant.jpg",
      description: "A decorated traditional Indian elephant with fine patterns, lines, and stripes in folk art style."
    }
  ],
  "still-life": [
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
};

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
      title: "Watercolor Landscape",
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
    const firstImage = pList.length > 0 ? pList[0].image : "assets/paintings/sunset_solitude.png";
    return {
      ...cat,
      id: `cat_${cat.categoryKey}`,
      image: firstImage,
      category: cat.categoryKey === "still-life" ? "still-life" : "watercolor"
    };
  });

  const allGalleryItems = [
    ...paintings.map(p => ({ ...p, isBulk: false })),
    ...bulkCategoriesList
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
          <img src="${p.image}" alt="${p.title}" style="width:100%; height:100%; object-fit:contain;" onerror="this.src='assets/paintings/sunset_solitude.png';">
        </span>
      `).join("");
      
      const defaultVariantId = pList.length > 0 ? pList[0].id : art.id;
      const defaultTitle = pList.length > 0 ? `${pList[0].title} (Bulk)` : art.title;

      return `
        <div class="artwork-card bulk-artwork-card" data-category="${art.categoryKey}" data-variant="${defaultVariantId}">
          <div class="artwork-img-container">
            <img class="bulk-main-image" src="${art.image}" alt="${art.title}" onerror="this.src='assets/paintings/sunset_solitude.png';" style="width: 100%; height: 100%; object-fit: contain;">
            <div class="artwork-badges">
              <span class="badge badge-bulk-tag">Bulk Order</span>
              <span class="badge badge-print">₹200 / piece</span>
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
              <span class="artwork-price" style="color: var(--accent-terracotta);">₹200</span>
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
            <img src="${art.image}" alt="${art.title}" onerror="this.src='assets/paintings/sunset_solitude.png';">
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
      openPaintingModal(id);
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

    let price, title;
    if (type === "bulk-stock") {
      price = 200;
      title = `${item.title} (Bulk)`;
    } else {
      price = item.priceOriginal;
      title = `${item.title} (Original Canvas)`;
    }
    
    cart.push({
      cartItemId,
      id: item.id,
      title,
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
    const qtyHTML = `<span class="cart-item-option">Qty: 1</span>`;

    const unitPriceHTML = item.type === "bulk-stock"
      ? `<span class="cart-item-option" style="color: var(--accent-gold); font-weight: 500;">₹${item.price} each</span>`
      : "";

    return `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <span class="cart-item-option">${item.dimensions}</span>
          ${unitPriceHTML}
          ${qtyHTML}
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
    
    const nameVal = document.getElementById("chk-name").value;
    const emailVal = document.getElementById("chk-email").value;
    const addressVal = document.getElementById("chk-address") ? document.getElementById("chk-address").value : "";
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const amountInPaise = Math.round(subtotal * 100);

    const paySubmitBtn = paymentForm.querySelector('button[type="submit"]');
    const originalText = "Pay with Razorpay";
    paySubmitBtn.disabled = true;
    paySubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Launching Razorpay...`;

    const options = {
      "key": "rzp_test_T2f89ISOl8Q1dr",
      "amount": amountInPaise,
      "currency": "INR",
      "name": "Samridhi Art Studio",
      "description": "Art Store Purchase",
      "image": "assets/artist_portrait.jpg",
      "handler": function (response) {
        paySubmitBtn.disabled = false;
        paySubmitBtn.textContent = originalText;

        // Update original painting availabilities locally to show sold status
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
        
        // Render real Payment ID in Step 3 success screen
        const successParagraph = document.querySelector(".success-screen p");
        if (successParagraph) {
          successParagraph.innerHTML = `Your payment was successfully processed. Razorpay Payment ID: <strong>${response.razorpay_payment_id}</strong>. A confirmation email with order details has been sent to your email.`;
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
    } catch (err) {
      alert("Error launching Razorpay: " + err.message);
      paySubmitBtn.disabled = false;
      paySubmitBtn.textContent = originalText;
    }
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

// (initBulkCalculator and its related handlers removed)
