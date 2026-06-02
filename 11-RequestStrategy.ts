/**
 * RequestStrategy.ts
 * Branch 11 - Strategy Design Pattern
 * Project: Eventies - Event Services Marketplace
 *
 * ─── What is Strategy Pattern? ───────────────────────────────────────────────
 * The Strategy Pattern defines a family of algorithms (strategies),
 * encapsulates each one, and makes them interchangeable.
 * It lets the algorithm vary independently from the clients that use it.
 *
 * ─── Why here? ───────────────────────────────────────────────────────────────
 * Eventies has two types of requests:
 *   1. Rental Request  → price = pricePerDay × qty × days
 *   2. Quote Request   → price = unitPrice × qty (no days)
 *
 * Instead of writing if/else everywhere, we encapsulate each pricing
 * and validation logic in its own Strategy class.
 *
 * ─── Pattern Structure ────────────────────────────────────────────────────────
 *
 *   «interface»
 *   IRequestStrategy
 *        │
 *        ├── RentalRequestStrategy   (calculates rental cost per day)
 *        └── QuoteRequestStrategy    (calculates quote cost per unit)
 *
 *   RequestProcessor   ← uses IRequestStrategy (the "Context")
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Shared Types ─────────────────────────────────────────────────────────────

/** A single line item inside any request */
export interface RequestItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;      // price per day (rental) or per unit (quote)
  startDate?: string;     // only used in rental requests
  endDate?: string;       // only used in rental requests
}

/** Result returned after processing a request */
export interface RequestResult {
  type: string;
  isValid: boolean;
  errors: string[];
  totalAmount: number;
  summary: string;
}

// ─── Strategy Interface ───────────────────────────────────────────────────────

/**
 * IRequestStrategy
 *
 * Every request strategy must implement these two methods:
 *   - validate() : checks whether the request data is correct
 *   - calculate() : computes the total cost
 */
export interface IRequestStrategy {
  /**
   * Validates the list of items for this request type.
   * @returns array of error messages (empty = valid)
   */
  validate(items: RequestItem[]): string[];

  /**
   * Calculates the total cost for the given items.
   * @returns total amount in JOD
   */
  calculate(items: RequestItem[]): number;

  /** Human-readable name of this strategy */
  getTypeName(): string;
}

// ─── Concrete Strategy 1: Rental Request ─────────────────────────────────────

/**
 * RentalRequestStrategy
 *
 * Used when the customer wants to RENT products for a specific period.
 *
 * Pricing formula:
 *   subtotal per item = unitPrice × quantity × numberOfDays
 *   total = sum of all subtotals
 */
export class RentalRequestStrategy implements IRequestStrategy {

  getTypeName(): string {
    return "Rental Request";
  }

  /**
   * Calculates number of days between two date strings.
   * Minimum 1 day even if start === end.
   */
  private calcDays(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end   = new Date(endDate).getTime();
    const days  = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  }

  validate(items: RequestItem[]): string[] {
    const errors: string[] = [];

    if (!items || items.length === 0) {
      errors.push("Rental request must have at least one item.");
      return errors;
    }

    items.forEach((item, index) => {
      // Check quantity
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1} (${item.productName}): quantity must be greater than 0.`);
      }

      // Check price
      if (item.unitPrice <= 0) {
        errors.push(`Item ${index + 1} (${item.productName}): price per day must be greater than 0.`);
      }

      // Check dates
      if (!item.startDate) {
        errors.push(`Item ${index + 1} (${item.productName}): start date is required.`);
      }
      if (!item.endDate) {
        errors.push(`Item ${index + 1} (${item.productName}): end date is required.`);
      }
      if (item.startDate && item.endDate) {
        const start = new Date(item.startDate);
        const end   = new Date(item.endDate);
        if (end < start) {
          errors.push(`Item ${index + 1} (${item.productName}): end date cannot be before start date.`);
        }
      }
    });

    return errors;
  }

  calculate(items: RequestItem[]): number {
    return items.reduce((total, item) => {
      const days     = this.calcDays(item.startDate!, item.endDate!);
      const subtotal = item.unitPrice * item.quantity * days;
      return total + subtotal;
    }, 0);
  }
}

// ─── Concrete Strategy 2: Quote Request ──────────────────────────────────────

/**
 * QuoteRequestStrategy
 *
 * Used when the customer wants a PRICE QUOTE for purchasing products.
 * No rental dates needed — just quantity × unit price.
 *
 * Pricing formula:
 *   subtotal per item = unitPrice × quantity
 *   total = sum of all subtotals
 */
export class QuoteRequestStrategy implements IRequestStrategy {

  getTypeName(): string {
    return "Quote Request";
  }

  validate(items: RequestItem[]): string[] {
    const errors: string[] = [];

    if (!items || items.length === 0) {
      errors.push("Quote request must have at least one item.");
      return errors;
    }

    items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1} (${item.productName}): quantity must be greater than 0.`);
      }
      if (item.unitPrice <= 0) {
        errors.push(`Item ${index + 1} (${item.productName}): unit price must be greater than 0.`);
      }
    });

    return errors;
  }

  calculate(items: RequestItem[]): number {
    return items.reduce((total, item) => {
      return total + item.unitPrice * item.quantity;
    }, 0);
  }
}

// ─── Context: RequestProcessor ────────────────────────────────────────────────

/**
 * RequestProcessor (Context class)
 *
 * This is the "context" in the Strategy Pattern.
 * It holds a reference to a strategy and delegates
 * validation and calculation to it.
 *
 * The strategy can be swapped at runtime — no need
 * to change this class when adding new request types.
 */
export class RequestProcessor {
  private strategy: IRequestStrategy;

  /**
   * @param strategy - The strategy to use for this request
   */
  constructor(strategy: IRequestStrategy) {
    this.strategy = strategy;
  }

  /**
   * Allows switching the strategy at runtime.
   * Example: switching from Rental to Quote mode
   */
  setStrategy(strategy: IRequestStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Processes the request:
   * 1. Validates items using the current strategy
   * 2. Calculates total if valid
   * 3. Returns a RequestResult with all details
   */
  process(items: RequestItem[]): RequestResult {
    const errors      = this.strategy.validate(items);
    const isValid     = errors.length === 0;
    const totalAmount = isValid ? this.strategy.calculate(items) : 0;
    const typeName    = this.strategy.getTypeName();

    const summary = isValid
      ? `${typeName} processed successfully. Total: JD ${totalAmount.toFixed(2)}.`
      : `${typeName} failed validation. ${errors.length} error(s) found.`;

    return { type: typeName, isValid, errors, totalAmount, summary };
  }
}

// ─── Usage Examples ───────────────────────────────────────────────────────────

/**
 * Demonstrates how the Strategy Pattern works in Eventies.
 * This function would typically be called from a service or a React hook.
 */
export function runStrategyDemo(): void {

  // ── Example 1: Rental Request ──────────────────────────────────────────────
  console.log("═══════════════════════════════════════");
  console.log("  EXAMPLE 1 — Rental Request Strategy  ");
  console.log("═══════════════════════════════════════");

  const rentalItems: RequestItem[] = [
    {
      productId:   "p1",
      productName: "Elegant Tent 10x10m",
      quantity:    2,
      unitPrice:   150,     // JD 150 per day
      startDate:   "2026-06-01",
      endDate:     "2026-06-03",  // 2 days
    },
    {
      productId:   "p2",
      productName: "Round Banquet Tables (set of 10)",
      quantity:    1,
      unitPrice:   80,      // JD 80 per day
      startDate:   "2026-06-01",
      endDate:     "2026-06-03",  // 2 days
    },
  ];

  const rentalProcessor = new RequestProcessor(new RentalRequestStrategy());
  const rentalResult    = rentalProcessor.process(rentalItems);

  console.log("Valid?  ", rentalResult.isValid);
  console.log("Total:   JD", rentalResult.totalAmount);
  // Expected: (150×2×2) + (80×1×2) = 600 + 160 = JD 760
  console.log("Summary:", rentalResult.summary);

  // ── Example 2: Quote Request ───────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("  EXAMPLE 2 — Quote Request Strategy   ");
  console.log("═══════════════════════════════════════");

  const quoteItems: RequestItem[] = [
    {
      productId:   "p3",
      productName: "Premium Sound System",
      quantity:    1,
      unitPrice:   1200,   // JD 1200 per unit
    },
    {
      productId:   "p4",
      productName: "LED Stage Lighting Kit",
      quantity:    3,
      unitPrice:   450,    // JD 450 per unit
    },
  ];

  // Switch strategy at runtime — same processor, different strategy
  const quoteProcessor = new RequestProcessor(new QuoteRequestStrategy());
  const quoteResult    = quoteProcessor.process(quoteItems);

  console.log("Valid?  ", quoteResult.isValid);
  console.log("Total:   JD", quoteResult.totalAmount);
  // Expected: (1200×1) + (450×3) = 1200 + 1350 = JD 2550
  console.log("Summary:", quoteResult.summary);

  // ── Example 3: Validation failure ─────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("  EXAMPLE 3 — Validation Failure       ");
  console.log("═══════════════════════════════════════");

  const badRentalItems: RequestItem[] = [
    {
      productId:   "p1",
      productName: "Elegant Tent",
      quantity:    0,         // ← invalid: quantity is 0
      unitPrice:   150,
      startDate:   "2026-06-05",
      endDate:     "2026-06-03",  // ← invalid: end before start
    },
  ];

  const badResult = rentalProcessor.process(badRentalItems);
  console.log("Valid?  ", badResult.isValid);        // false
  console.log("Errors: ", badResult.errors);
  console.log("Summary:", badResult.summary);
}
