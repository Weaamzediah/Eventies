/**
 * RentalCart.tsx
 * Branch 14 - Main UI / Frontend Code
 * Project: Eventies - Event Services Marketplace
 *
 * This component implements the Rental Cart feature for the Eventies platform.
 * Users can add event-related products to a rental cart, set rental dates,
 * specify quantities, and submit a rental request.
 *
 * Features:
 * - Add / remove items from cart
 * - Set rental start and end dates per item
 * - Calculate total rental cost
 * - Submit rental request (connected to Supabase backend)
 */

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Represents a single product available for rental */
export interface RentalProduct {
  id: string;
  name: string;
  image: string;
  pricePerDay: number;
  category: string;
  availableQty: number;
}

/** Represents a cart item (product + rental details chosen by user) */
export interface CartItem {
  product: RentalProduct;
  quantity: number;
  startDate: string; // ISO date string  e.g. "2026-06-01"
  endDate: string;   // ISO date string  e.g. "2026-06-03"
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Calculates the number of days between two date strings.
 * Returns at least 1 even when start === end (same-day rental).
 */
function calcDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

/**
 * Calculates the subtotal for a single cart item.
 * subtotal = pricePerDay × quantity × numberOfDays
 */
function calcSubtotal(item: CartItem): number {
  const days = calcDays(item.startDate, item.endDate);
  return item.product.pricePerDay * item.quantity * days;
}

/**
 * Calculates the grand total for all items in the cart.
 */
function calcTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calcSubtotal(item), 0);
}

// ─── Sample Data (replace with Supabase fetch in production) ─────────────────

const SAMPLE_PRODUCTS: RentalProduct[] = [
  {
    id: "p1",
    name: "Elegant Tent - 10x10m",
    image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400",
    pricePerDay: 150,
    category: "Tents",
    availableQty: 5,
  },
  {
    id: "p2",
    name: "Round Banquet Tables (set of 10)",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400",
    pricePerDay: 80,
    category: "Furniture",
    availableQty: 20,
  },
  {
    id: "p3",
    name: "Premium Sound System",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    pricePerDay: 200,
    category: "Audio",
    availableQty: 3,
  },
  {
    id: "p4",
    name: "LED Stage Lighting Kit",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400",
    pricePerDay: 120,
    category: "Lighting",
    availableQty: 8,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Displays one product card in the product catalog */
function ProductCard({
  product,
  onAddToCart,
}: {
  product: RentalProduct;
  onAddToCart: (product: RentalProduct) => void;
}) {
  return (
    <div style={styles.productCard}>
      <img
        src={product.image}
        alt={product.name}
        style={styles.productImage}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://via.placeholder.com/400x200?text=No+Image";
        }}
      />
      <div style={styles.productInfo}>
        <span style={styles.categoryBadge}>{product.category}</span>
        <h3 style={styles.productName}>{product.name}</h3>
        <p style={styles.productPrice}>
          <strong>JD {product.pricePerDay}</strong> / day
        </p>
        <p style={styles.productAvail}>
          Available qty: {product.availableQty}
        </p>
        <button
          style={styles.addBtn}
          onClick={() => onAddToCart(product)}
          onMouseOver={(e) =>
            ((e.target as HTMLButtonElement).style.background = "#6d28d9")
          }
          onMouseOut={(e) =>
            ((e.target as HTMLButtonElement).style.background = "#7c3aed")
          }
        >
          + Add to Cart
        </button>
      </div>
    </div>
  );
}

/** Displays one item row inside the cart */
function CartItemRow({
  item,
  onUpdateQty,
  onUpdateDates,
  onRemove,
}: {
  item: CartItem;
  onUpdateQty: (id: string, qty: number) => void;
  onUpdateDates: (id: string, start: string, end: string) => void;
  onRemove: (id: string) => void;
}) {
  const days = calcDays(item.startDate, item.endDate);
  const subtotal = calcSubtotal(item);

  return (
    <div style={styles.cartRow}>
      {/* Product thumbnail + name */}
      <div style={styles.cartRowLeft}>
        <img
          src={item.product.image}
          alt={item.product.name}
          style={styles.cartThumb}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/80x60?text=N/A";
          }}
        />
        <div>
          <p style={styles.cartItemName}>{item.product.name}</p>
          <p style={styles.cartItemPrice}>
            JD {item.product.pricePerDay} / day
          </p>
        </div>
      </div>

      {/* Quantity control */}
      <div style={styles.cartControl}>
        <label style={styles.label}>Qty</label>
        <div style={styles.qtyControl}>
          <button
            style={styles.qtyBtn}
            onClick={() =>
              onUpdateQty(item.product.id, Math.max(1, item.quantity - 1))
            }
          >
            −
          </button>
          <span style={styles.qtyNum}>{item.quantity}</span>
          <button
            style={styles.qtyBtn}
            onClick={() =>
              onUpdateQty(
                item.product.id,
                Math.min(item.product.availableQty, item.quantity + 1)
              )
            }
          >
            +
          </button>
        </div>
      </div>

      {/* Date pickers */}
      <div style={styles.cartControl}>
        <label style={styles.label}>Start</label>
        <input
          type="date"
          style={styles.dateInput}
          value={item.startDate}
          onChange={(e) =>
            onUpdateDates(item.product.id, e.target.value, item.endDate)
          }
        />
      </div>
      <div style={styles.cartControl}>
        <label style={styles.label}>End</label>
        <input
          type="date"
          style={styles.dateInput}
          value={item.endDate}
          onChange={(e) =>
            onUpdateDates(item.product.id, item.startDate, e.target.value)
          }
        />
      </div>

      {/* Subtotal */}
      <div style={styles.cartControl}>
        <label style={styles.label}>{days} day{days !== 1 ? "s" : ""}</label>
        <p style={styles.subtotal}>JD {subtotal.toFixed(2)}</p>
      </div>

      {/* Remove button */}
      <button
        style={styles.removeBtn}
        onClick={() => onRemove(item.product.id)}
        title="Remove item"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * RentalCart - Main component for the Eventies rental cart feature.
 *
 * State:
 *  - cartItems: list of items currently in the cart
 *  - submitted: whether the rental request has been submitted
 *  - loading: async submission in progress
 *
 * Flow:
 *  1. User browses products in the catalog
 *  2. User adds products to cart
 *  3. User adjusts quantities and rental dates
 *  4. User submits — cart data sent to Supabase via service layer
 */
export default function RentalCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Default dates: today → tomorrow
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // ── Cart Actions ────────────────────────────────────────────────────────────

  /** Adds a product to the cart (or increments qty if already present) */
  function addToCart(product: RentalProduct) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        // Already in cart — increase quantity by 1 (up to available stock)
        return prev.map((i) =>
          i.product.id === product.id
            ? {
                ...i,
                quantity: Math.min(i.quantity + 1, product.availableQty),
              }
            : i
        );
      }
      // New item — add with default dates and qty 1
      return [
        ...prev,
        { product, quantity: 1, startDate: today, endDate: tomorrow },
      ];
    });
  }

  /** Updates the quantity of a cart item */
  function updateQty(productId: string, qty: number) {
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  }

  /** Updates the rental start/end dates for a cart item */
  function updateDates(productId: string, start: string, end: string) {
    setCartItems((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, startDate: start, endDate: end }
          : i
      )
    );
  }

  /** Removes a product from the cart */
  function removeItem(productId: string) {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  /** Clears the entire cart */
  function clearCart() {
    setCartItems([]);
  }

  // ── Submission ──────────────────────────────────────────────────────────────

  /**
   * Submits the rental request.
   * In production, this calls the Supabase service layer:
   *   await requestService.createRentalRequest(cartItems, userId)
   */
  async function handleSubmit() {
    if (cartItems.length === 0) return;
    setLoading(true);

    try {
      // Simulate API call (replace with real Supabase call)
      await new Promise((res) => setTimeout(res, 1500));

      console.log("Rental request submitted:", {
        items: cartItems,
        total: calcTotal(cartItems),
        submittedAt: new Date().toISOString(),
      });

      setSubmitted(true);
      clearCart();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={styles.successBox}>
        <div style={styles.successIcon}>✓</div>
        <h2 style={styles.successTitle}>Request Submitted!</h2>
        <p style={styles.successText}>
          Your rental request has been received. Our team will review it and
          contact you shortly.
        </p>
        <button
          style={styles.addBtn}
          onClick={() => setSubmitted(false)}
        >
          Browse More Products
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>
          <span style={styles.headerAccent}>Eventies</span> Rental Cart
        </h1>
        <p style={styles.headerSub}>
          Choose your event equipment, set your dates, and submit a request.
        </p>
      </header>

      <div style={styles.layout}>
        {/* ── Product Catalog ── */}
        <section style={styles.catalog}>
          <h2 style={styles.sectionTitle}>Available Products</h2>
          <div style={styles.productGrid}>
            {SAMPLE_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
            ))}
          </div>
        </section>

        {/* ── Cart Panel ── */}
        <aside style={styles.cartPanel}>
          <h2 style={styles.sectionTitle}>
            Your Cart{" "}
            {cartItems.length > 0 && (
              <span style={styles.cartBadge}>{cartItems.length}</span>
            )}
          </h2>

          {cartItems.length === 0 ? (
            <div style={styles.emptyCart}>
              <p style={styles.emptyText}>🛒 Your cart is empty.</p>
              <p style={styles.emptyHint}>
                Add products from the catalog on the left.
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div style={styles.cartList}>
                {cartItems.map((item) => (
                  <CartItemRow
                    key={item.product.id}
                    item={item}
                    onUpdateQty={updateQty}
                    onUpdateDates={updateDates}
                    onRemove={removeItem}
                  />
                ))}
              </div>

              {/* Total */}
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total Estimate</span>
                <span style={styles.totalAmount}>
                  JD {calcTotal(cartItems).toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                <button style={styles.clearBtn} onClick={clearCart}>
                  Clear Cart
                </button>
                <button
                  style={{
                    ...styles.submitBtn,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Submitting…" : "Submit Rental Request"}
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Segoe UI', sans-serif",
    background: "#f8f7ff",
    minHeight: "100vh",
    color: "#1e1b3a",
  },
  header: {
    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    color: "#fff",
    padding: "2.5rem 2rem",
    textAlign: "center",
  },
  headerTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.5px",
  },
  headerAccent: { color: "#c4b5fd" },
  headerSub: { marginTop: "0.5rem", opacity: 0.85, fontSize: "1rem" },
  layout: {
    display: "flex",
    gap: "2rem",
    padding: "2rem",
    maxWidth: "1300px",
    margin: "0 auto",
    flexWrap: "wrap" as const,
  },
  catalog: { flex: 2, minWidth: "300px" },
  cartPanel: {
    flex: 1,
    minWidth: "300px",
    background: "#fff",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 24px rgba(124,58,237,0.08)",
    alignSelf: "flex-start",
    position: "sticky" as const,
    top: "1rem",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#1e1b3a",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  cartBadge: {
    background: "#7c3aed",
    color: "#fff",
    borderRadius: "999px",
    padding: "0.1rem 0.6rem",
    fontSize: "0.8rem",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "1.2rem",
  },
  productCard: {
    background: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    transition: "transform 0.2s",
  },
  productImage: {
    width: "100%",
    height: "150px",
    objectFit: "cover" as const,
  },
  productInfo: { padding: "1rem" },
  categoryBadge: {
    background: "#ede9fe",
    color: "#7c3aed",
    fontSize: "0.72rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    fontWeight: 600,
  },
  productName: {
    fontSize: "0.95rem",
    fontWeight: 700,
    margin: "0.5rem 0 0.3rem",
  },
  productPrice: { fontSize: "0.9rem", color: "#4f46e5", margin: "0.2rem 0" },
  productAvail: { fontSize: "0.78rem", color: "#888", margin: "0.2rem 0 0.8rem" },
  addBtn: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    width: "100%",
    transition: "background 0.2s",
  },
  cartList: { display: "flex", flexDirection: "column" as const, gap: "1rem" },
  cartRow: {
    border: "1px solid #ede9fe",
    borderRadius: "10px",
    padding: "0.8rem",
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.6rem",
    alignItems: "center",
    background: "#faf9ff",
  },
  cartRowLeft: { display: "flex", gap: "0.6rem", alignItems: "center", flex: "1 1 200px" },
  cartThumb: {
    width: "60px",
    height: "48px",
    objectFit: "cover" as const,
    borderRadius: "6px",
  },
  cartItemName: { fontWeight: 600, fontSize: "0.85rem", margin: 0 },
  cartItemPrice: { fontSize: "0.78rem", color: "#7c3aed", margin: "0.2rem 0 0" },
  cartControl: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.2rem" },
  label: { fontSize: "0.7rem", color: "#888", fontWeight: 600, textTransform: "uppercase" as const },
  qtyControl: { display: "flex", alignItems: "center", gap: "0.3rem" },
  qtyBtn: {
    background: "#ede9fe",
    border: "none",
    borderRadius: "6px",
    width: "26px",
    height: "26px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "1rem",
    color: "#7c3aed",
  },
  qtyNum: { fontWeight: 700, minWidth: "20px", textAlign: "center" as const },
  dateInput: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.25rem 0.4rem",
    fontSize: "0.8rem",
    color: "#333",
  },
  subtotal: { fontWeight: 700, color: "#4f46e5", margin: 0, fontSize: "0.9rem" },
  removeBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: "6px",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.85rem",
  },
  emptyCart: { textAlign: "center" as const, padding: "2rem 1rem" },
  emptyText: { fontSize: "1rem", color: "#888" },
  emptyHint: { fontSize: "0.85rem", color: "#bbb", marginTop: "0.3rem" },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "2px solid #ede9fe",
    marginTop: "1rem",
    paddingTop: "1rem",
  },
  totalLabel: { fontWeight: 700, color: "#555" },
  totalAmount: { fontSize: "1.3rem", fontWeight: 800, color: "#7c3aed" },
  actions: { display: "flex", gap: "0.8rem", marginTop: "1rem" },
  clearBtn: {
    flex: 1,
    background: "#f3f4f6",
    color: "#555",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem",
    cursor: "pointer",
    fontWeight: 600,
  },
  submitBtn: {
    flex: 2,
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.6rem",
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  successBox: {
    textAlign: "center" as const,
    padding: "4rem 2rem",
    maxWidth: "500px",
    margin: "0 auto",
  },
  successIcon: {
    fontSize: "4rem",
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "1rem",
  },
  successTitle: { fontSize: "1.8rem", fontWeight: 800, color: "#1e1b3a" },
  successText: { color: "#555", fontSize: "1rem", marginBottom: "1.5rem" },
};
