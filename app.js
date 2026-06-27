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

// Application Data
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
    description: "A premium impasto landscape painting capturing a warm golden sunset over a peaceful alpine lake. Made with thick layers of textured oil paint and subtle metallic gold leaf highlights that catch the light beautifully from different angles."
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
    description: "A dramatic abstract representation of deep ocean waves, balancing deep sea blue, indigo, and emerald hues with dynamic, hand-applied gold leaf textures that shimmer as you move around it."
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
    description: "A quiet, moody study of a deep pine forest enveloped in thick morning fog. Light rays filter gently through the trees. This piece creates a calming, atmospheric focal point suitable for a bedroom, study, or living space."
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
    available: false, // Sold Out Original
    description: "Delicate textured wildflowers blooming against a rich dark charcoal backdrop. Samridhi combines high-quality oil pigments with luxurious gold leaf details to create depth and botanical texture."
  }
];

const courses = [
  {
    id: "c1",
    title: "Impasto Oil Painting Masterclass",
    duration: "8 Weeks",
    level: "Intermediate",
    lessons: 24,
    price: 2999,
    image: "assets/courses/oil_painting.png",
    students: 1420,
    rating: "4.9",
    description: "Learn how to build dramatic, high-texture landscapes using palette knives, thick oil paint layers, and expressive blending techniques.",
    inclusions: [
      "24 High-Definition Video Lessons",
      "Direct 1-on-1 Portfolio Feedback from Samridhi",
      "Access to Private Artist Community",
      "Lifetime Course Access & Updates",
      "Downloadable Materials Checklist & Textures Guide"
    ]
  },
  {
    id: "c2",
    title: "Watercolor Light & Atmosphere",
    duration: "6 Weeks",
    level: "Beginner Friendly",
    lessons: 18,
    price: 1999,
    image: "assets/courses/watercolor.png",
    students: 980,
    rating: "4.8",
    description: "Master wet-on-wet techniques, water ratio control, and soft color transitions to paint glowing skies, oceans, and forest mist.",
    inclusions: [
      "18 High-Definition Video Lessons",
      "Step-by-step Guided Projects",
      "Color Theory & Studio Palette Guides",
      "Monthly Live Q&A and Paint-Along Sessions",
      "Official Academy Certificate of Completion"
    ]
  }
];

// Application State
let cart = [];
let currentCategory = "all";
let searchQuery = "";
let currentSort = "featured";

// Current Selected modal item state
let selectedModalPainting = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  // Load Cart from LocalStorage
  const savedCart = localStorage.getItem("samridhi_art_cart");
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      cart = [];
    }
  }

  initNavigation();
  renderCourses();
  initSimulator();
  initModals();
  initCheckout();
  initContactForm();
  updateCartUI();
});

/* Navigation Scripts */
function initNavigation() {
  const header = document.getElementById("app-header");
  const navLinks = document.querySelectorAll(".nav-link");

  // Sticky header transition on scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      if (header) header.classList.add("scrolled");
    } else {
      if (header) header.classList.remove("scrolled");
    }

    // Highlight nav link based on scroll section
    let current = "";
    const sections = document.querySelectorAll("section");
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("data-target") === current) {
        link.classList.add("active");
      }
    });
  });

  // Mobile menu trigger toggle
  const mobileTrigger = document.getElementById("mobile-menu-trigger");
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

  // Close mobile nav on click
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("data-target");
      if (targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          e.preventDefault();
          window.scrollTo({
            top: targetSection.offsetTop - 80,
            behavior: "smooth"
          });
        }
      }

      // Hide mobile nav if opened
      const nav = document.querySelector("nav");
      if (window.innerWidth <= 768) {
        nav.style.display = "none";
      }
    });
  });

  // Quick Buy Hero Button
  const heroBuyBtn = document.querySelector(".hero-buy-btn");
  if (heroBuyBtn) {
    heroBuyBtn.addEventListener("click", () => {
      const painting = paintings.find(p => p.id === 1);
      if (painting) {
        addToCart(painting, "original");
        openCartDrawer();
      }
    });
  }
}


/* Academy Courses Rendering */
function renderCourses() {
  const container = document.getElementById("courses-grid-container");
  if (!container) return;
  
  container.innerHTML = courses.map(course => `
    <div class="course-card">
      <div class="course-img-container">
        <img src="${course.image}" alt="${course.title}">
        <span class="course-badge" style="background: var(--accent-terracotta); color: white;">Upcoming</span>
      </div>
      <div class="course-content">
        <span class="course-duration">
          <i class="fa-solid fa-clock"></i> ${course.duration} • ${course.lessons} lessons
        </span>
        <h3 class="course-title">${course.title}</h3>
        <p class="course-description">${course.description}</p>
        
        <div class="course-stats">
          <div class="stat-item"><i class="fa-solid fa-user-group"></i> ${course.students}+ students</div>
          <div class="stat-item"><i class="fa-solid fa-star"></i> ${course.rating} Rating</div>
        </div>
        
        <div class="course-footer">
          <div class="course-price">
            <span class="price-label">Tuition Fee</span>
            <span class="price-val">₹${course.price}</span>
          </div>
          <button class="btn btn-secondary course-details-btn" data-id="${course.id}">Syllabus</button>
          <button class="btn btn-terracotta course-enroll-btn" data-id="${course.id}" disabled style="opacity: 0.6; cursor: not-allowed;">Upcoming</button>
        </div>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".course-details-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openCourseModal(id);
    });
  });

  container.querySelectorAll(".course-enroll-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const courseObj = courses.find(c => c.id === id);
      addToCart(courseObj, "course");
      openCartDrawer();
    });
  });
}

/* Virtual Room Simulator */
function initSimulator() {
  const selectArt = document.getElementById("simulator-art-selector");
  if (!selectArt) return;
  const wallColorOverlay = document.getElementById("simulator-wall-color");
  const artFrame = document.getElementById("simulator-art-frame");
  const artImg = document.getElementById("simulator-artwork-img");
  const dimensionTag = document.getElementById("simulator-dimension-tag");
  const buyBtn = document.getElementById("simulator-buy-btn");
  const colorOptions = document.querySelectorAll(".color-option");

  // Populate options dropdown
  selectArt.innerHTML = paintings.map(art => `
    <option value="${art.id}">${art.title} (${art.widthInches}" x ${art.heightInches}")</option>
  `).join("");

  // Select first artwork on load
  updateRoomArt(1);

  // Selector changes
  selectArt.addEventListener("change", (e) => {
    const id = parseInt(e.target.value);
    updateRoomArt(id);
  });

  // Wall color change
  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      colorOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      const colorVal = opt.getAttribute("data-color");
      wallColorOverlay.style.backgroundColor = colorVal;
    });
  });

  // Buy selected button
  buyBtn.addEventListener("click", () => {
    const activeId = parseInt(selectArt.value);
    const painting = paintings.find(p => p.id === activeId);
    if (painting && painting.available) {
      addToCart(painting, "original");
      openCartDrawer();
    }
  });

  function updateRoomArt(id) {
    const art = paintings.find(p => p.id === id);
    if (!art) return;

    // Update image
    artImg.style.backgroundImage = `url('${art.image}')`;
    
    // Update dimensions label
    dimensionTag.textContent = `${art.widthInches}" x ${art.heightInches}"`;
    
    // Scale frame accurately based on painting's real-life dimensions.
    // Let's set a maximum scaling boundary on the virtual room wall.
    // Standard blank wall size is roughly 120" wide. Let's make frame percentage:
    // (artwork_inches / simulated_wall_inches) * scaling_factor
    // Let's say a 40" wide painting occupies roughly 38% of the wall width.
    const baseScaleFactor = 0.95; 
    const calculatedWidth = (art.widthInches / 100) * 100 * baseScaleFactor; // scale relative to room box size
    const aspect = art.heightInches / art.widthInches;
    
    artFrame.style.width = `${calculatedWidth}%`;
    artFrame.style.aspectRatio = `${art.widthInches}/${art.heightInches}`;

    // Adjust button text based on availability
    if (art.available) {
      buyBtn.disabled = false;
      buyBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Add Original Canvas (₹${art.priceOriginal})`;
    } else {
      buyBtn.disabled = true;
      buyBtn.innerHTML = `Sold Out`;
    }
  }
}

/* Shopping Cart Core Logic */
function addToCart(item, type) {
  // item can be a painting or a course
  const cartItemId = `${item.id}_${type}`;
  const existingIndex = cart.findIndex(c => c.cartItemId === cartItemId);

  if (existingIndex > -1) {
    if (type !== "original") {
      cart[existingIndex].qty += 1;
    } else {
      // Original paintings are singular assets. Prompt that they are already in cart
      alert(`"${item.title}" (Original Canvas) is already in your bag.`);
      return;
    }
  } else {
    // If it's an original canvas, double-check availability
    if (type === "original" && !item.available) {
      alert(`Sorry, the original canvas of "${item.title}" has already been sold.`);
      return;
    }

    const price = type === "original" ? item.priceOriginal : item.price;
    const title = type === "original" ? `${item.title} (Original Canvas)` : item.title;
    
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

  if (cart[index].type === "original") {
    // Original canvas cannot exceed 1
    return;
  }

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

  // Sum total quantities
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  countBadge.textContent = totalItems;
  if (totalItems > 0) {
    countBadge.style.display = "block";
  } else {
    countBadge.style.display = "none";
  }

  // Calculate prices
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

  // Redraw items
  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-message">
        <i class="fa-solid fa-bag-shopping"></i>
        <p>Your bag is currently empty.</p>
        <a href="shop.html" class="btn btn-secondary btn-sm" id="cart-empty-shop-btn">View Gallery</a>
      </div>
    `;
    
    // Add event listener to shop button inside cart
    const emptyBtn = document.getElementById("cart-empty-shop-btn");
    if (emptyBtn) {
      emptyBtn.addEventListener("click", () => {
        closeCartDrawer();
      });
    }
    return;
  }

  itemsContainer.innerHTML = cart.map(item => {
    const showQtyControl = item.type !== "original";
    const qtyHTML = showQtyControl
      ? `
        <div class="cart-item-qty">
          <button class="qty-btn qty-dec" data-id="${item.cartItemId}"><i class="fa-solid fa-minus"></i></button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn qty-inc" data-id="${item.cartItemId}"><i class="fa-solid fa-plus"></i></button>
        </div>
      `
      : `<span class="cart-item-option">Original (Qty: 1)</span>`;

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
          ${item.type !== 'course' ? `<span class="cart-item-option">${item.dimensions}</span>` : ''}
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

  // Attach cart event handlers
  itemsContainer.querySelectorAll(".qty-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      updateCartQty(btn.getAttribute("data-id"), -1);
    });
  });

  itemsContainer.querySelectorAll(".qty-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      updateCartQty(btn.getAttribute("data-id"), 1);
    });
  });

  itemsContainer.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.getAttribute("data-id"));
    });
  });
}

function openCartDrawer() {
  document.getElementById("cart-drawer").classList.add("active");
  document.getElementById("cart-drawer-overlay").classList.add("active");
  document.body.style.overflow = "hidden"; // disable scroll
}

function closeCartDrawer() {
  document.getElementById("cart-drawer").classList.remove("active");
  document.getElementById("cart-drawer-overlay").classList.remove("active");
  document.body.style.overflow = "auto";
}

/* Modals Setup (Detail Modals) */
function initModals() {
  const cartTrigger = document.getElementById("cart-trigger");
  const cartClose = document.getElementById("cart-close");
  const cartOverlay = document.getElementById("cart-drawer-overlay");

  const paintingOverlay = document.getElementById("painting-modal-overlay");
  const paintingClose = document.getElementById("painting-modal-close");

  const courseOverlay = document.getElementById("course-modal-overlay");
  const courseClose = document.getElementById("course-modal-close");

  // Cart Drawer open/close
  if (cartTrigger) cartTrigger.addEventListener("click", openCartDrawer);
  if (cartClose) cartClose.addEventListener("click", closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

  // Close modals on overlay clicks or Close X button
  if (paintingClose && paintingOverlay) {
    paintingClose.addEventListener("click", () => closePaintingModal());
    paintingOverlay.addEventListener("click", (e) => {
      if (e.target === paintingOverlay) closePaintingModal();
    });
  }

  if (courseClose && courseOverlay) {
    courseClose.addEventListener("click", () => closeCourseModal());
    courseOverlay.addEventListener("click", (e) => {
      if (e.target === courseOverlay) closeCourseModal();
    });
  }
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
  const roomBtn = document.getElementById("modal-art-room-btn");

  modalImg.src = art.image;
  modalImg.alt = art.title;
  modalTitle.textContent = art.title;
  modalMeta.textContent = `${art.medium} • ${art.widthInches}" x ${art.heightInches}"`;
  modalDesc.textContent = art.description;

  // Set up Purchase Options (Original Canvas only)
  let optionsHTML = "";
  if (art.available) {
    optionsHTML += `
      <div style="padding: 0.5rem 0;">
        <span style="font-weight:600; color:#FFF; font-size: 1.1rem; display: block; margin-bottom: 0.25rem;">Original Canvas</span>
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

  // Add event listener to Buy Button in modal
  buyBtn.onclick = () => {
    if (selectedModalPainting && selectedModalPainting.available) {
      addToCart(selectedModalPainting, "original");
      closePaintingModal();
      openCartDrawer();
    }
  };

  // Add event listener to View In Room inside modal
  roomBtn.onclick = () => {
    closePaintingModal();
    // Scroll to simulator
    const simSection = document.getElementById("room-preview");
    window.scrollTo({
      top: simSection.offsetTop - 80,
      behavior: "smooth"
    });
    // Set simulator selector to this painting
    const artSelector = document.getElementById("simulator-art-selector");
    artSelector.value = art.id;
    // Trigger selector change manually
    artSelector.dispatchEvent(new Event('change'));
  };

  document.getElementById("painting-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePaintingModal() {
  document.getElementById("painting-modal-overlay").classList.remove("active");
  document.body.style.overflow = "auto";
  selectedModalPainting = null;
}

function openCourseModal(id) {
  const course = courses.find(c => c.id === id);
  if (!course) return;

  const modalImg = document.getElementById("modal-course-img");
  const modalTitle = document.getElementById("modal-course-title");
  const modalMeta = document.getElementById("modal-course-meta");
  const modalDesc = document.getElementById("modal-course-desc");
  const inclusionsList = document.getElementById("modal-course-inclusions");
  const buyBtn = document.getElementById("modal-course-buy-btn");

  modalImg.src = course.image;
  modalImg.alt = course.title;
  modalTitle.textContent = course.title;
  modalMeta.textContent = `${course.duration} • ${course.lessons} Lectures • ${course.level}`;
  modalDesc.textContent = course.description;

  inclusionsList.innerHTML = course.inclusions.map(inc => `
    <li><i class="fa-solid fa-circle-check" style="color:var(--success); margin-right:0.5rem;"></i> ${inc}</li>
  `).join("");

  buyBtn.disabled = true;
  buyBtn.textContent = "Upcoming";
  buyBtn.style.opacity = "0.6";
  buyBtn.style.cursor = "not-allowed";

  document.getElementById("course-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCourseModal() {
  document.getElementById("course-modal-overlay").classList.remove("active");
  document.body.style.overflow = "auto";
}

/* Checkout Wizard Multi-Step Flow */
function initCheckout() {
  const checkoutTrigger = document.getElementById("checkout-trigger");
  const checkoutOverlay = document.getElementById("checkout-modal-overlay");
  const checkoutClose = document.getElementById("checkout-modal-close");
  const addressForm = document.getElementById("checkout-form-address");
  const paymentForm = document.getElementById("checkout-form-payment");
  const prevBtn = document.getElementById("checkout-prev-btn");
  const doneBtn = document.getElementById("checkout-done-btn");

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
        if (authTitle) authTitle.textContent = "Create Account";
        if (authSubmitBtn) authSubmitBtn.textContent = "Register";
        authToggleLink.textContent = "Log In";
        const labelNode = authToggleLink.previousSibling;
        if (labelNode) labelNode.textContent = "Already have an account? ";
      } else {
        if (authTitle) authTitle.textContent = "Log In to Checkout";
        if (authSubmitBtn) authSubmitBtn.textContent = "Log In";
        authToggleLink.textContent = "Register";
        const labelNode = authToggleLink.previousSibling;
        if (labelNode) labelNode.textContent = "Don't have an account? ";
      }
    });
  }

  // Handle Authentication submit
  if (authForm && authSubmitBtn) {
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

  // Header User Icon action (opens checkout modal to authentication/shipping step, or redirects to shop.html with action=login)
  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", () => {
      if (checkoutOverlay) {
        openCheckoutStep(1);
        checkoutOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
      } else {
        window.location.href = "shop.html?action=login";
      }
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

  // Open checkout
  if (checkoutTrigger && checkoutOverlay) {
    checkoutTrigger.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Your bag is empty! Add paintings or courses before checking out.");
        return;
      }
      closeCartDrawer();
      openCheckoutStep(1);
      checkoutOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  }

  // Close checkout
  if (checkoutClose && checkoutOverlay) {
    checkoutClose.addEventListener("click", closeCheckoutModal);
    checkoutOverlay.addEventListener("click", (e) => {
      if (e.target === checkoutOverlay) closeCheckoutModal();
    });
  }

  // Address step submission
  if (addressForm) {
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
  }

  // Back button on payment step
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      openCheckoutStep(1);
    });
  }

  // Payment form submission (complete purchase)
  if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const nameVal = document.getElementById("chk-name").value;
      const emailVal = document.getElementById("chk-email").value;
      const addressVal = document.getElementById("chk-address") ? document.getElementById("chk-address").value : "";
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const amountInPaise = Math.round(subtotal * 100);

      const paySubmitBtn = paymentForm.querySelector('button[type="submit"]');
      const originalText = paySubmitBtn.textContent;
      paySubmitBtn.disabled = true;
      paySubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

      try {
        if (typeof firebase === 'undefined' || typeof functions === 'undefined' || !auth.currentUser) {
          throw new Error("User must be authenticated to check out via Firebase Cloud Functions.");
        }

        // 1. Create order on the backend via Firebase HTTPS Callable Function
        const createRazorpayOrderFn = functions.httpsCallable('createRazorpayOrder');
        const orderResponse = await createRazorpayOrderFn({ amount: amountInPaise });
        
        const orderData = orderResponse.data;
        const orderId = orderData.order_id;

        // 2. Configure Razorpay Options
        const options = {
          "key": "rzp_test_T2f89ISOl8Q1dr", // Public Razorpay test key
          "amount": orderData.amount,
          "currency": orderData.currency,
          "name": "Samridhi Art Studio",
          "description": "Art Store Purchase",
          "image": "assets/artist_portrait.jpg",
          "order_id": orderId,
          "handler": async function (response) {
            paySubmitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verifying Payment...`;

            try {
              // 3. Verify signature on backend via Firebase HTTPS Callable Function
              const verifyRazorpayPaymentFn = functions.httpsCallable('verifyRazorpayPayment');
              const verifyResult = await verifyRazorpayPaymentFn({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyResult.data && verifyResult.data.verified) {
                paySubmitBtn.disabled = false;
                paySubmitBtn.textContent = originalText;

                // Mark originals sold
                cart.forEach(item => {
                  if (item.type === "original") {
                    const paintObj = paintings.find(p => p.id === item.id);
                    if (paintObj) paintObj.available = false;
                  }
                });
                
                // Reset cart
                cart = [];
                saveCart();
                updateCartUI();
                if (typeof renderGallery === "function") renderGallery();
                if (typeof initSimulator === "function") initSimulator(); 

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
        
        // Fallback client-only mode
        const options = {
          "key": "rzp_test_T2f89ISOl8Q1dr",
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
            if (typeof initSimulator === "function") initSimulator();

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
  }

  // Finished checkout button
  if (doneBtn) {
    doneBtn.addEventListener("click", closeCheckoutModal);
  }

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

    const hasPhysical = cart.some(c => c.type === "original" || c.type === "bulk-stock");
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
      const shipping = hasPhysical ? 0 : 0; 
      const total = subtotal + shipping;

      const subtotalEl = document.getElementById("summary-subtotal");
      const totalEl = document.getElementById("summary-total");
      if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      if (totalEl) totalEl.textContent = `₹${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
  }

  function closeCheckoutModal() {
    if (checkoutOverlay) {
      checkoutOverlay.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  }
}

/* Contact / Inquiries Form */
function initContactForm() {
  const form = document.getElementById("contact-form");
  const feedback = document.getElementById("contact-form-feedback");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      
      // Show success animation
      feedback.classList.add("success");
      form.reset();

      // Clear feedback after 5 seconds
      setTimeout(() => {
        feedback.classList.remove("success");
      }, 5000);

    }, 1500);
  });
}
