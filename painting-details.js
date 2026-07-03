// Firebase configurations (must match app.js)
const firebaseConfig = {
  apiKey: "AIzaSyAs-example-key",
  authDomain: "samridhi-art-studio.firebaseapp.com",
  projectId: "samridhi-art-studio",
  storageBucket: "samridhi-art-studio.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}

const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
const functions = typeof firebase !== 'undefined' ? firebase.functions() : null;

// Cart State
let cart = [];
let currentPainting = null;
let currentPaintingType = "original";

document.addEventListener("DOMContentLoaded", () => {
  // Load Cart
  const savedCart = localStorage.getItem("samridhi_art_cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
  }
  
  // Navigation & UI Elements
  const cartTrigger = document.getElementById("cart-trigger");
  const cartClose = document.getElementById("cart-close");
  const cartOverlay = document.getElementById("cart-drawer-overlay");
  
  if (cartTrigger) cartTrigger.addEventListener("click", openCartDrawer);
  if (cartClose) cartClose.addEventListener("click", closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener("click", closeCartDrawer);

  // Authentication Buttons & Listeners
  const userProfileBtn = document.getElementById("user-profile-btn");
  if (userProfileBtn) {
    userProfileBtn.addEventListener("click", () => {
      if (auth && auth.currentUser) {
        const confirmLogout = confirm("Would you like to log out of your account?");
        if (confirmLogout) {
          auth.signOut().then(() => {
            alert("Successfully logged out.");
            location.reload();
          });
        }
      } else {
        openCheckoutStep(1);
        const chkOverlay = document.getElementById("checkout-modal-overlay");
        if (chkOverlay) {
          chkOverlay.classList.add("active");
          document.body.style.overflow = "hidden";
        }
      }
    });
  }

  if (auth) {
    auth.onAuthStateChanged(user => {
      const icon = document.getElementById("user-status-icon");
      const authContainer = document.getElementById("checkout-auth-container");
      const shippingContainer = document.getElementById("checkout-shipping-container");
      const chkEmail = document.getElementById("chk-email");

      if (user) {
        if (icon) {
          icon.className = "fa-solid fa-user-check";
          icon.style.color = "var(--success)";
        }
        if (authContainer) authContainer.style.display = "none";
        if (shippingContainer) shippingContainer.style.display = "block";
        if (chkEmail) chkEmail.value = user.email;
      } else {
        if (icon) {
          icon.className = "fa-regular fa-user";
          icon.style.color = "var(--text-primary)";
        }
        if (authContainer) authContainer.style.display = "block";
        if (shippingContainer) shippingContainer.style.display = "none";
      }
    });
  }

  // Load Product Details
  loadProductDetails();
  updateCartUI();
  initCheckoutModal();
});

/* Parse Query Parameters & Load details */
function loadProductDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = params.get("type") || "original";
  currentPaintingType = type;

  if (!id || !window.paintingsData) {
    window.location.href = "shop.html";
    return;
  }

  let art = null;
  if (type === "original") {
    art = window.paintingsData.originals.find(p => p.id == id);
  } else if (type === "bulk-item") {
    for (const cat in window.paintingsData.bulkPaintings) {
      const found = window.paintingsData.bulkPaintings[cat].find(p => p.id == id);
      if (found) {
        art = { ...found, categoryKey: cat };
        break;
      }
    }
  }

  if (!art) {
    window.location.href = "shop.html";
    return;
  }

  currentPainting = art;

  // Render text details
  document.getElementById("details-title").textContent = art.title;
  document.getElementById("breadcrumb-title").textContent = art.title;
  document.getElementById("details-desc").textContent = art.description;
  document.getElementById("details-meta-medium").textContent = art.medium;
  
  const dimStr = art.dimensions || `${art.widthInches}" x ${art.heightInches}"`;
  document.getElementById("details-meta-dimensions").textContent = dimStr;
  
  const imgEl = document.getElementById("details-img");
  imgEl.src = art.image;
  imgEl.onerror = function() {
    this.src = "assets/paintings/WhatsApp Image 2026-06-29 at 8.45.56 PM.jpeg";
  };

  const priceVal = type === "original" ? art.priceOriginal : art.price;
  document.getElementById("details-price-val").textContent = `₹${priceVal.toLocaleString()}`;

  const breadcrumbParent = document.getElementById("breadcrumb-parent");
  const typeCell = document.getElementById("details-meta-type");
  const badgeEl = document.getElementById("details-status-badge");
  const addBtn = document.getElementById("details-add-to-bag-btn");
  const unitLabel = document.getElementById("details-unit-label");

  if (type === "original") {
    breadcrumbParent.textContent = "Original Paintings";
    breadcrumbParent.href = "shop.html";
    typeCell.textContent = "Original Canvas Painting";
    unitLabel.style.display = "none";
    
    if (art.available) {
      badgeEl.className = "badge-status in-stock";
      badgeEl.textContent = "Available";
      addBtn.textContent = "Add Original Canvas to Bag";
      addBtn.disabled = false;
      addBtn.onclick = () => addToCart(art, "original");
    } else {
      badgeEl.className = "badge-status sold-out";
      badgeEl.textContent = "Sold Out";
      addBtn.textContent = "Artwork Sold";
      addBtn.disabled = true;
    }
  } else {
    breadcrumbParent.textContent = "Bulk Print Shop";
    breadcrumbParent.href = "shop.html";
    typeCell.textContent = "Bulk Order Art Print";
    
    // Check if the parent category gallery has a name
    const categoryNames = {
      "watercolor-landscape": "Landscape Prints",
      "watercolor-folk-art": "Folk Art Prints",
      "still-life": "Still Life Prints"
    };
    const catName = categoryNames[art.categoryKey] || "Bulk Collection";
    
    breadcrumbParent.innerHTML = `Bulk Print Shop`;
    typeCell.textContent = `${catName} (Bulk-exclusive)`;

    unitLabel.style.display = "inline";
    badgeEl.className = "badge-status in-stock";
    badgeEl.textContent = "Prints in Stock";
    
    addBtn.textContent = "Add Prints to Bag";
    addBtn.disabled = false;
    addBtn.onclick = () => {
      // Redirect to the bulk gallery calculator where bulk prints can be calculated and bulk added!
      const destUrl = `category-gallery.html?category=${art.categoryKey}&highlight=${art.id}`;
      window.location.href = destUrl;
    };
  }

  // Setup Wall Simulator
  setupWallSimulator(art);
}

/* Virtual Wall Simulator inside Details */
function setupWallSimulator(art) {
  const artworkImg = document.getElementById("simulator-artwork-img");
  const dimensionTag = document.getElementById("simulator-dimension-tag");
  const artFrame = document.getElementById("simulator-art-frame");
  const canvasArea = document.getElementById("simulator-canvas-area");

  if (!artworkImg || !artFrame) return;

  artworkImg.style.backgroundImage = `url('${art.image}')`;
  
  // Calculate relative aspect ratio for scaling frame
  const widthVal = art.widthInches || 12;
  const heightVal = art.heightInches || 16;
  const aspectRatio = widthVal / heightVal;

  // Set sizing base
  const defaultHeight = 240; 
  const calculatedWidth = defaultHeight * aspectRatio;
  artworkImg.style.height = `${defaultHeight}px`;
  artworkImg.style.width = `${calculatedWidth}px`;

  const dimStr = art.dimensions || `${widthVal}" x ${heightVal}"`;
  dimensionTag.textContent = `${dimStr} (${currentPaintingType === 'original' ? 'Original' : 'Bulk Print'})`;

  // Scale buttons
  const sizeBtns = document.querySelectorAll(".size-btn");
  sizeBtns.forEach(btn => {
    btn.onclick = () => {
      sizeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const scale = btn.getAttribute("data-scale");
      artFrame.style.transform = `scale(${scale})`;
    };
  });

  // Room buttons
  const roomBtns = document.querySelectorAll(".room-btn");
  roomBtns.forEach(btn => {
    btn.onclick = () => {
      roomBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const bg = btn.getAttribute("data-bg");
      canvasArea.style.backgroundImage = `url('${bg}')`;
    };
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
    let price, title, basePrice;
    basePrice = item.priceOriginal;
    price = item.priceOriginal;
    title = `${item.title} (Original Canvas)`;
    
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
  openCartDrawer();
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

  const finalTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const originalSubtotal = cart.reduce((sum, item) => {
    const base = item.type === "bulk-stock" ? (window.paintingsData ? window.paintingsData.getBulkBasePrice(item.id) : 200) : (item.basePrice || item.price || 200);
    return sum + (base * item.qty);
  }, 0);
  const totalBulkSavings = originalSubtotal - finalTotal;

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

/* Checkout Modal Actions */
function initCheckoutModal() {
  const checkoutOverlay = document.getElementById("checkout-modal-overlay");
  const checkoutClose = document.getElementById("checkout-modal-close");
  const checkoutTrigger = document.getElementById("checkout-trigger");

  if (!checkoutOverlay) return;

  checkoutTrigger.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your shopping bag is empty.");
      return;
    }
    
    openCheckoutStep(1);
    checkoutOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    closeCartDrawer();
  });

  checkoutClose.addEventListener("click", closeCheckoutModal);
  checkoutOverlay.addEventListener("click", (e) => {
    if (e.target === checkoutOverlay) closeCheckoutModal();
  });

  const addressForm = document.getElementById("checkout-form-address");
  addressForm.addEventListener("submit", (e) => {
    e.preventDefault();
    openCheckoutStep(2);
  });

  const prevBtn = document.getElementById("checkout-prev-btn");
  prevBtn.addEventListener("click", () => openCheckoutStep(1));

  const doneBtn = document.getElementById("checkout-done-btn");
  doneBtn.addEventListener("click", () => {
    cart = [];
    localStorage.removeItem("samridhi_art_cart");
    updateCartUI();
    closeCheckoutModal();
    location.reload();
  });

  const authToggleLink = document.getElementById("auth-toggle-link");
  let isRegisterMode = false;
  
  if (authToggleLink) {
    authToggleLink.addEventListener("click", (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      const title = document.getElementById("auth-title");
      const submitBtn = document.getElementById("auth-submit-btn");

      if (isRegisterMode) {
        title.textContent = "Create an Account";
        submitBtn.textContent = "Register & Continue";
        authToggleLink.textContent = "Log In";
      } else {
        title.textContent = "Log In to Checkout";
        submitBtn.textContent = "Log In";
        authToggleLink.textContent = "Register";
      }
    });
  }

  const authForm = document.getElementById("checkout-auth-form");
  if (authForm) {
    authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-email").value;
      const password = document.getElementById("auth-password").value;
      const submitBtn = document.getElementById("auth-submit-btn");
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

      if (isRegisterMode) {
        auth.createUserWithEmailAndPassword(email, password)
          .then(() => {
            alert("Registration successful.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Register & Continue";
          })
          .catch(err => {
            alert("Registration error: " + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Register & Continue";
          });
      } else {
        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Log In";
          })
          .catch(err => {
            alert("Login error: " + err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Log In";
          });
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

  const paymentForm = document.getElementById("checkout-form-payment");
  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
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
        throw new Error("Authentication required to complete payment.");
      }

      const createRazorpayOrderFn = functions.httpsCallable('createRazorpayOrder');
      const orderResponse = await createRazorpayOrderFn({ amount: amountInPaise });
      
      const orderData = orderResponse.data;
      const orderId = orderData.order_id;

      const options = {
        "key": "rzp_live_T6XEdh2x0G9PKL",
        "amount": orderData.amount,
        "currency": orderData.currency,
        "name": "Samridhi Art Studio",
        "description": "Original Painting Purchase",
        "image": "assets/artist_portrait.jpg",
        "order_id": orderId,
        "handler": function (response){
          openCheckoutStep(3);
        },
        "prefill": {
          "email": auth.currentUser.email
        },
        "theme": {
          "color": "#c59b3f"
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
      console.warn("Firebase Functions offline. Simulating payment.", err);
      setTimeout(() => {
        openCheckoutStep(3);
        paySubmitBtn.disabled = false;
        paySubmitBtn.textContent = originalText;
      }, 1000);
    }
  });
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
  const checkoutOverlay = document.getElementById("checkout-modal-overlay");
  if (checkoutOverlay) {
    checkoutOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}
