"use client"

import React, { useEffect, useMemo, useState, useCallback, lazy, Suspense } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  ArrowLeft,
  FileText,
  PauseCircle,
  Settings,
  Trash2,
  Loader2,
  History,
  CheckCircle2,
  Printer,
  Share2,
} from "lucide-react";
import {
  type POSProduct,
  type CartItem,
  type Fulfillment,
  type Screen,
  type ReceiptData,
} from "@/components/screens/pos-screen";
import {
  productService,
  customerService,
  orderService,
  categoryService,
  storeService,
  type ApiProduct,
  type ApiCustomer,
  type ApiCategory,
  type ApiStore,
} from "@/services";
import { tokenManager } from "@/lib/axios-client";
import Swal from "sweetalert2";
import { db } from "@/lib/db";
import { syncService } from "@/lib/sync-service";
import { localDb } from "@/lib/local-first-service";

// Lazy load heavy components
const DesktopPOSLayout = lazy(() => import("@/components/screens/pos-screen/DesktopPOSLayout"));

const THEME = {
  bg: "bg-gray-50 dark:bg-gradient-to-br dark:from-[#1f1633] dark:via-[#241a3a] dark:to-[#2b1f4a]",
  card: "bg-white dark:bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur",
  panel: "bg-white dark:bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10",
  muted: "text-gray-600 dark:text-white/60",
  text: "text-gray-900 dark:text-white",
};

type TotalsInput = {
  subtotal: number;
  discountAmount: number;
  taxEnabled: boolean;
  taxRate: number;
  fulfillment: Fulfillment;
  deliveryKm: number;
};

export function calcDeliveryFee(fulfillment: Fulfillment, deliveryKm: number) {
  if (fulfillment !== "delivery") return 0;
  const base = 40;
  const perKm = 12;
  const km = Number.isFinite(Number(deliveryKm)) ? Number(deliveryKm) : 0;
  return Math.round(base + perKm * Math.max(0, km));
}

export function calcTotals(input: TotalsInput) {
  const safeSubtotal = Math.max(0, Number(input.subtotal) || 0);
  const safeDiscount = Math.max(0, Math.min(Number(input.discountAmount) || 0, safeSubtotal));
  const deliveryFee = calcDeliveryFee(input.fulfillment, input.deliveryKm);

  // Prices are VAT-inclusive, so we extract VAT from the subtotal
  const taxableBase = Math.max(0, safeSubtotal - safeDiscount);

  // Vatable Sales = Subtotal / 1.12
  const vatableSales = input.taxEnabled ? taxableBase / 1.12 : taxableBase;

  // Tax = Vatable Sales × 12%
  const tax = input.taxEnabled ? vatableSales * 0.12 : 0;

  // Total = subtotal - discount + delivery (tax is already included in item prices)
  const total = taxableBase + deliveryFee;

  return {
    subtotal: safeSubtotal,
    vatableSales,
    discount: safeDiscount,
    tax,
    deliveryFee,
    total,
  };
}

export function clampQty(qty: number, stock: number) {
  const s = Math.max(0, Number(stock) || 0);
  const q = Math.max(1, Number(qty) || 1);
  return Math.min(q, Math.max(1, s));
}

const Pill = React.memo(({ children }: { children: React.ReactNode }) => (
  <span className={`inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-xs ${THEME.muted}`}>
    {children}
  </span>
));
Pill.displayName = "Pill";

const Money = React.memo(({ value }: { value: number }) => (
  <span>{"₱ "}{Math.round(value).toLocaleString()}</span>
));
Money.displayName = "Money";

// Memoized product converter
const convertApiProductToPOS = (apiProduct: ApiProduct): POSProduct => ({
  id: String(apiProduct.id),
  name: apiProduct.name,
  sku: apiProduct.sku,
  barcode: apiProduct.barcode || "",
  price: apiProduct.price,
  stock: apiProduct.stock,
  category: "general",
  unit: apiProduct.unit || "pc",
});

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className={`min-h-screen ${THEME.bg} flex items-center justify-center`}>
    <div className="text-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mx-auto" />
        <Receipt className="h-6 w-6 text-purple-500 dark:text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-gray-900 dark:text-white text-lg mt-4 font-medium">Loading POS...</p>
      <p className="text-gray-600 dark:text-white/50 text-sm mt-1">Preparing your workspace</p>
    </div>
  </div>
);

// Extract data array helper
const extractDataArray = <T,>(response: T | T[] | { data?: T[] }): T[] => {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object" && "data" in response && Array.isArray((response as { data?: T[] }).data)) {
    return (response as { data: T[] }).data;
  }
  return [];
};

export default function VendoraPOS() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("sale");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data from API
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);

  // Reactively sync products from IndexedDB so newly created/updated products
  // appear without requiring a full page reload.
  const liveDbProducts = useLiveQuery(
    () => db.products.filter(p => p.is_active === true && p._status !== "deleted").toArray(),
    [],
    null
  );
  useEffect(() => {
    if (!liveDbProducts || liveDbProducts.length === 0) return;
    const mapped: ApiProduct[] = liveDbProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || "",
      barcode: p.barcode || "",
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      category: p.category_id ? { id: p.category_id, name: p.category_name || "" } : undefined as any,
      image: p.image_url,
      is_active: true,
      currency: "PHP",
      is_low_stock: false,
      created_at: "",
      updated_at: "",
    }));
    setApiProducts(mapped);
  }, [liveDbProducts]);

  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);

  // Product search and filtering
  const [query, setQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [category, setCategory] = useState<string>("all");

  // Cart state — initialized synchronously from localStorage to avoid
  // the effect ordering race where the save effect fires with [] before
  // the load effect's setState can correct it.
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("vendora_pos_cart");
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem("vendora_pos_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);
  const [customer, setCustomer] = useState<"walkin" | "saved1" | "saved2">("walkin");
  const [notes, setNotes] = useState("");

  // Pricing and payment
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRate, setTaxRate] = useState<number>(0.12);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [deliveryKm, setDeliveryKm] = useState<number>(3);
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [splitPay, setSplitPay] = useState(false);
  const [primaryMethod, setPrimaryMethod] = useState<"cash" | "card" | "online" | "credit">("cash");
  const [cashPay, setCashPay] = useState<number>(0);
  const [cardPay, setCardPay] = useState<number>(0);
  const [onlinePay, setOnlinePay] = useState<number>(0);
  const [creditorFirstName, setCreditorFirstName] = useState("");
  const [creditorMiddleName, setCreditorMiddleName] = useState("");
  const [creditorLastName, setCreditorLastName] = useState("");
  const [creditorPhone, setCreditorPhone] = useState("");
  const [creditorAddress, setCreditorAddress] = useState("");

  // Modal states
  const [holdOpen, setHoldOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const [saleId, setSaleId] = useState<string | null>(null);

  // Generate sale ID once on mount
  useEffect(() => {
    const base = String(Math.floor(Date.now() / 1000)).slice(-6);
    setSaleId(`SALE-${base}`);
  }, []);

  // Check auth and load data (offline init moved to POS layout)
  useEffect(() => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      router.push("/pos/auth/login");
      return;
    }

    loadInitialData();
  }, []);

  // Local-first data loading: Load from IndexedDB first, then sync with API
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let localProductsCount = 0;

    try {
      // STEP 1: Load from IndexedDB FIRST (instant, works offline)
      console.log('📦 Loading cached data from IndexedDB...');
      const [localProducts, localCategories, localCustomers, localStores, localOrders] = await Promise.all([
        db.products.toArray().then(items => items.filter(p => p.is_active === true)),
        db.categories.toArray(),
        db.customers.toArray().then(items => items.filter(c => c.status === 'active')),
        db.stores.toArray().then(items => items.filter(s => s.is_active === true)),
        db.orders.toArray(),
      ]);

      localProductsCount = localProducts.length;

      // Set local data immediately (fast UI)
      if (localProducts.length > 0) {
        const apiProducts = localProducts.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode || '',
          price: p.price,
          stock: p.stock,
          unit: p.unit,
          category: p.category_id ? { id: p.category_id, name: p.category_name || '' } : undefined,
          image_url: p.image_url,
          is_active: p.is_active
        })) as unknown as ApiProduct[];
        setApiProducts(apiProducts);
        console.log(`✅ Loaded ${localProducts.length} products from cache`);
      }

      if (localCategories.length > 0) {
        const apiCategories = localCategories.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description
        })) as ApiCategory[];
        setCategories(apiCategories);
        console.log(`✅ Loaded ${localCategories.length} categories from cache`);
      }

      {
        const apiCustomers = localCustomers.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          status: c.status
        })) as ApiCustomer[];

        // Also pull unique customer names from order history (covers credit customers)
        const orderCustomerMap = new Map<string, ApiCustomer>();
        for (const o of localOrders) {
          const name = o.customer_name?.trim();
          if (name && name.toLowerCase() !== 'walk-in customer') {
            const key = name.toLowerCase();
            if (!orderCustomerMap.has(key)) {
              orderCustomerMap.set(key, {
                id: o.customer_id || 0,
                name,
                phone: undefined,
                status: 'active',
                created_at: '',
                updated_at: '',
              } as ApiCustomer);
            }
          }
        }

        // Merge: start with DB customers, then add any from orders not already present
        const merged = [...apiCustomers];
        for (const oc of orderCustomerMap.values()) {
          if (!merged.find(c => c.name.toLowerCase() === oc.name.toLowerCase())) {
            merged.push(oc);
          }
        }

        setCustomers(merged);
        console.log(`✅ Loaded ${merged.length} customers (${apiCustomers.length} from DB + ${merged.length - apiCustomers.length} from orders)`);
      }

      if (localStores.length > 0) {
        const apiStores = localStores.map(s => ({
          id: s.id,
          name: s.name,
          is_active: s.is_active
        })) as ApiStore[];
        setStores(apiStores);
        console.log(`✅ Loaded ${localStores.length} stores from cache`);
      }

      // Show UI immediately with cached data
      setIsLoading(false);

      // STEP 2: Sync with API in background (if online)
      if (syncService.getOnlineStatus()) {
        console.log('🔄 Syncing with API in background...');

        const [categoriesResult, storesResult, productsResult, customersResult] = await Promise.allSettled([
          categoryService.getAll(),
          storeService.getAll(),
          productService.getMy({ per_page: 1000 }),
          customerService.getAll({ per_page: 100 })
        ]);

        // Process and cache API data
        if (categoriesResult.status === "fulfilled") {
          const categoriesList = extractDataArray(categoriesResult.value);
          setCategories(categoriesList);
          await syncService.cacheCategories(categoriesList);
        }

        if (storesResult.status === "fulfilled") {
          const storesList = extractDataArray(storesResult.value);
          const activeStores = storesList.filter((s: ApiStore) => s.is_active);
          setStores(activeStores);
          await syncService.cacheStores(storesList);
        }

        if (productsResult.status === "fulfilled") {
          const apiProds = extractDataArray(productsResult.value);
          await syncService.cacheProducts(apiProds);
        }

        // After caching, read ALL active products fresh from IndexedDB as the
        // single source of truth. This prevents a race condition where pushDirty()
        // completes between the API query and the pendingNotInApi check, causing
        // newly uploaded products to disappear from the grid.
        const freshLocal = await db.products.toArray();
        const allActive = freshLocal
          .filter(p => p.is_active === true && p._status !== 'deleted')
          .map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku || '',
            barcode: p.barcode || '',
            price: p.price,
            stock: p.stock,
            unit: p.unit,
            category: p.category_id ? { id: p.category_id, name: p.category_name || '' } : undefined,
            image_url: p.image_url,
            is_active: true,
            currency: 'PHP',
            is_low_stock: false,
            created_at: '',
            updated_at: '',
          } as ApiProduct));
        if (allActive.length > 0) {
          setApiProducts(allActive);
        }

        if (customersResult.status === "fulfilled") {
          const customersList = extractDataArray(customersResult.value);
          setCustomers(customersList);
          await syncService.cacheCustomers(customersList);
        }

        console.log('✅ Background sync complete');
      } else {
        console.log('📴 Offline - using cached data only');
      }

    } catch (err: any) {
      // Don't show error if we have cached data
      if (localProductsCount === 0) {
        setError(err?.message || "Failed to load data. Please check your connection.");
        setIsLoading(false);
      }

      if (err?.status === 401 || err?.status === 403) {
        router.push("/pos/auth/login");
      }
    }
  }, [router]);

  // Reload products when store changes
  useEffect(() => {
    if (selectedStore !== null && !isLoading) {
      loadStoreProducts();
    }
  }, [selectedStore]);

  const loadStoreProducts = useCallback(async () => {
    if (!selectedStore) return;
    try {
      const productsResponse = await storeService.getProducts(selectedStore, { per_page: 500 });
      const products = extractDataArray(productsResponse);
      setApiProducts(products);
    } catch (err) {
      // Silent fail, keep existing products
    }
  }, [selectedStore]);

  // Memoized products conversion
  const products = useMemo<POSProduct[]>(() => {
    return apiProducts.map(convertApiProductToPOS);
  }, [apiProducts]);

  // Memoized filtered products
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const apiProduct = apiProducts.find(ap => String(ap.id) === p.id);
      const categoryMatch = category === "all" || apiProduct?.category?.id === Number(category);
      const okQuery = !q || `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(q);
      return categoryMatch && okQuery;
    });
  }, [products, query, category, apiProducts]);

  // Cart operations with useCallback
  const addToCart = useCallback((p: POSProduct, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((x) => x.id === p.id);
      if (found) {
        const nextQty = clampQty(found.qty + qty, p.stock);
        return prev.map((x) => (x.id === p.id ? { ...x, qty: nextQty } : x));
      }
      return [...prev, {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        price: p.price,
        stock: p.stock,
        unit: p.unit,
        qty: clampQty(qty, p.stock)
      }];
    });
  }, []);

  const applyBarcode = useCallback(async () => {
    const code = barcodeInput.trim();
    if (!code) return;

    setIsProcessing(true);
    try {
      // Search in IndexedDB first (instant, works offline)
      let localProduct = await db.products
        .where('barcode')
        .equals(code)
        .or('sku')
        .equals(code)
        .first();

      let product: ApiProduct | null = null;

      if (localProduct) {
        // Found in local cache
        product = {
          id: localProduct.id,
          name: localProduct.name,
          sku: localProduct.sku,
          barcode: localProduct.barcode || '',
          price: localProduct.price,
          stock: localProduct.stock,
          unit: localProduct.unit,
          is_active: localProduct.is_active
        } as ApiProduct;
      } else if (syncService.getOnlineStatus()) {
        // Not in cache and online - try API
        try {
          product = await productService.getByBarcode(code);
        } catch {
          try {
            product = await productService.getBySku(code);
          } catch { /* Not found */ }
        }
      }

      if (product) {
        const posProduct = convertApiProductToPOS(product);
        addToCart(posProduct, 1);
        setBarcodeInput("");
        Swal.fire({
          icon: "success",
          title: "Added to cart",
          text: product.name,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Product not found",
          text: `No product found for: ${code}`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [barcodeInput, addToCart]);

  const changeQty = useCallback((id: string, nextQty: number | string) => {
    setCart((prev) =>
      prev.map((x) => x.id !== id ? x : { ...x, qty: clampQty(Number(nextQty || 1), x.stock) })
    );
  }, []);

  const removeItem = useCallback((id: string) => setCart((prev) => prev.filter((x) => x.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);

  // Memoized calculations
  const subtotal = useMemo(() => cart.reduce((sum, x) => sum + x.price * x.qty, 0), [cart]);

  const discountAmount = useMemo(() => {
    const v = Math.max(0, Number(discountValue) || 0);
    if (discountMode === "amount") return Math.min(v, subtotal);
    return Math.round(subtotal * (Math.min(100, v) / 100));
  }, [discountValue, discountMode, subtotal]);

  const totals = useMemo(() => calcTotals({
    subtotal,
    discountAmount,
    taxEnabled,
    taxRate,
    fulfillment,
    deliveryKm,
  }), [subtotal, discountAmount, taxEnabled, taxRate, fulfillment, deliveryKm]);

  const amountDue = useMemo(() => {
    if (paymentType === "partial") return Math.round(totals.total * 0.5);
    return totals.total;
  }, [paymentType, totals.total]);

  const paid = useMemo(() => {
    const c = Math.max(0, Number(cashPay) || 0);
    const k = Math.max(0, Number(cardPay) || 0);
    const o = Math.max(0, Number(onlinePay) || 0);
    if (splitPay) return c + k + o;
    if (primaryMethod === "cash") return c;
    if (primaryMethod === "card") return k;
    return o;
  }, [splitPay, primaryMethod, cashPay, cardPay, onlinePay, amountDue]);

  const balance = useMemo(() => Math.max(0, amountDue - paid), [amountDue, paid]);
  const change = useMemo(() => Math.max(0, paid - amountDue), [amountDue, paid]);
  const canGoCheckout = useMemo(() => cart.length > 0 && totals.total > 0, [cart.length, totals.total]);
  const canComplete = useMemo(() => cart.length > 0 && totals.total > 0 && balance === 0, [cart.length, totals.total, balance]);

  // Complete order (Local-first: Save to IndexedDB, then sync)
  const completeOrder = useCallback(async (isCredit = false, creditInfo?: { firstName: string; middleName?: string; lastName: string; phone: string; address: string; dueDate?: string }) => {
    // For non-credit, ensure balance is 0. For credit, ignore balance as user is promising to pay later.
    if (!isCredit && !canComplete) return;
    // Prefer explicitly passed credit info over component state (state updates are async)
    const resolvedCreditFirstName = creditInfo?.firstName ?? creditorFirstName;
    const resolvedCreditMiddleName = creditInfo?.middleName ?? creditorMiddleName;
    const resolvedCreditLastName = creditInfo?.lastName ?? creditorLastName;
    const resolvedCreditName = [resolvedCreditFirstName, resolvedCreditMiddleName, resolvedCreditLastName].filter(Boolean).join(' ');
    const resolvedCreditPhone = creditInfo?.phone ?? creditorPhone;
    const resolvedCreditAddress = creditInfo?.address ?? creditorAddress;
    const resolvedCreditDueDate = creditInfo?.dueDate ?? "";
    setIsProcessing(true);

    try {
      // Determine customer ID
      let customerId = selectedCustomerId;
      let customerName = "Walk-in Customer";

      if (customer === "walkin") {
        // Walk-in orders don't need a customer record — backend accepts null customer_id
        customerId = null;
        customerName = "Walk-in Customer";
      } else if (customer === "saved1" && customers[0]) {
        customerId = customers[0].id;
        customerName = customers[0].name;
      } else if (customer === "saved2" && customers[1]) {
        customerId = customers[1].id;
        customerName = customers[1].name;
      }

      if (!customerId && customer !== "walkin" && !isCredit) throw new Error("Customer selection required");

      if (isCredit && resolvedCreditName.trim() !== "") {
        customerName = resolvedCreditName.trim();
        // Check if customer already exists; if not, auto-register them
        const existingCustomer = customers.find(
          c => c.name.toLowerCase() === resolvedCreditName.trim().toLowerCase()
        );
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else if (syncService.getOnlineStatus()) {
          try {
            const newCustomer = await customerService.create({
              name: resolvedCreditName.trim(),
              phone: resolvedCreditPhone.trim() || undefined,
              status: "active",
            });
            customerId = newCustomer.id;
            console.log(`✅ Auto-registered new customer: ${newCustomer.name} (ID: ${newCustomer.id})`);
          } catch (e) {
            console.warn("Could not auto-register customer, credit_customer data will be used by backend", e);
          }
        }
      }

      // Save transaction locally FIRST (offline-first approach)
      const paymentMethods = splitPay
        ? [
          cashPay > 0 && { method: 'cash' as const, amount: cashPay },
          cardPay > 0 && { method: 'card' as const, amount: cardPay },
          onlinePay > 0 && { method: 'online' as const, amount: onlinePay }
        ].filter(Boolean) as Array<{ method: 'cash' | 'card' | 'online'; amount: number }>
        : undefined;

      const transactionUuid = await syncService.saveTransactionLocally({
        customer_id: customerId ?? null,
        customer_name: customerName,
        ordered_at: new Date().toISOString().split('T')[0] || "",
        status: isCredit ? 'pending' : 'completed',
        items: cart.map(item => ({
          product_id: Number(item.id),
          product_name: item.name,
          quantity: item.qty,
          price: item.price
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        delivery_fee: totals.deliveryFee,
        total: totals.total,
        payment_method: (isCredit || primaryMethod === "credit") ? "cash" : primaryMethod as "cash" | "card" | "online",
        payment_methods: paymentMethods,
        amount_tendered: isCredit ? amountDue : paid,
        change: isCredit ? 0 : change,
        store_id: selectedStore || undefined,
        is_credit: isCredit || undefined,
        credit_customer: isCredit ? {
          first_name: resolvedCreditFirstName.trim(),
          middle_name: resolvedCreditMiddleName.trim() || undefined,
          last_name: resolvedCreditLastName.trim(),
          contact_number: resolvedCreditPhone.trim() || undefined,
          address: resolvedCreditAddress.trim() || undefined,
        } : undefined,
        notes: isCredit
          ? [
            resolvedCreditPhone.trim() ? `Contact: ${resolvedCreditPhone.trim()}` : '',
            resolvedCreditAddress.trim() ? `Address: ${resolvedCreditAddress.trim()}` : '',
            resolvedCreditDueDate.trim() ? `Due: ${resolvedCreditDueDate.trim()}` : '',
            notes ? `Notes: ${notes}` : ''
          ].filter(Boolean).join(' | ') || undefined
          : (notes || undefined)
      });

      console.log(`✅ Transaction saved locally: ${transactionUuid}`);

      // Write to orders and payments tables for immediate visibility on those pages
      const txnDate = new Date().toISOString().split('T')[0] || "";
      const txnTime = new Date();
      const paidAtStr = `${txnDate} ${txnTime.toTimeString().slice(0, 5)}`;

      await localDb.orders.addFromTransaction({
        order_number: `TXN-${transactionUuid.substring(0, 8).toUpperCase()}`,
        customer_id: customerId || 1,
        customer_name: customerName,
        ordered_at: txnDate,
        status: isCredit ? 'pending' : 'completed',
        total: Math.round(totals.total),
        subtotal: Math.round(totals.subtotal),
        tax: Math.round(totals.tax),
        discount: Math.round(totals.discount),
        delivery_fee: Math.round(totals.deliveryFee),
        payment_method: (isCredit || primaryMethod === "credit") ? "cash" : primaryMethod,
        items: cart.map(item => ({
          product_id: Number(item.id),
          product_name: item.name,
          quantity: item.qty,
          price: item.price,
        })),
      }).catch(err => console.error('Failed to write order to local DB:', err));

      // Write payment record(s)
      if (paymentMethods && paymentMethods.length > 1) {
        for (const pm of paymentMethods) {
          await localDb.payments.addFromTransaction({
            order_id: -Date.now(),
            customer_name: customerName,
            amount: Math.round(pm.amount * 100),
            method: pm.method,
            status: 'completed',
            paid_at: paidAtStr,
          }).catch(err => console.error('Failed to write payment to local DB:', err));
        }
      } else {
        await localDb.payments.addFromTransaction({
          order_id: -Date.now(),
          customer_name: customerName,
          amount: Math.round((isCredit ? totals.total : paid) * 100),
          method: (isCredit || primaryMethod === "credit") ? "cash" : primaryMethod,
          status: isCredit ? 'pending' : 'completed',
          paid_at: paidAtStr,
        }).catch(err => console.error('Failed to write payment to local DB:', err));
      }

      // Use UUID as transaction number
      const txnNumber = transactionUuid.substring(0, 8).toUpperCase();
      const now = new Date();

      // Credit order creation is handled by syncSingleTransaction (called automatically
      // by saveTransactionLocally when online). It sends POST /api/orders with
      // payment_method:'credit' + credit_customer fields, which handles everything:
      // customer creation/update, credit_balance increment, payment record, and ledger entry.

      // Build discount label
      let discountLabel = "Discount";
      if (discountValue > 0) {
        discountLabel = discountMode === "percent" ? `Discount (${discountValue}%)` : "Discount";
      }

      // Build tax label
      const taxLabel = taxEnabled ? `Tax (${Math.round(taxRate * 100)}% VAT)` : "Tax (VAT Exempt)";

      // Determine payment method label
      let paymentMethodLabel: string;
      if (isCredit) {
        paymentMethodLabel = "Credit";
      } else if (splitPay) {
        const parts: string[] = [];
        if (cashPay > 0) parts.push("Cash");
        if (cardPay > 0) parts.push("Card");
        if (onlinePay > 0) parts.push("Online");
        paymentMethodLabel = `Split (${parts.join(", ")})`;
      } else {
        paymentMethodLabel = primaryMethod.charAt(0).toUpperCase() + primaryMethod.slice(1);
      }

      customerName = customer === "walkin"
        ? "Walk-in Customer"
        : customers.find(c => c.id === customerId)?.name || "Customer";

      if (isCredit && resolvedCreditName.trim() !== "") {
        customerName = resolvedCreditName.trim();
      }

      // Build receipt data
      const receipt: ReceiptData = {
        transactionNumber: txnNumber,
        date: now.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        customerName,
        items: [...cart],
        subtotal: totals.subtotal,
        vatableSales: totals.vatableSales,
        discount: totals.discount,
        discountLabel,
        tax: totals.tax,
        taxLabel,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        paymentMethod: paymentMethodLabel,
        amountTendered: isCredit ? amountDue : paid,
        change: isCredit ? 0 : change,
        isCredit,
        creditorPhone: isCredit ? resolvedCreditPhone.trim() : undefined,
        creditorAddress: isCredit ? resolvedCreditAddress.trim() : undefined,
      };

      setReceiptData(receipt);
      setCart([]);  // Clear cart immediately — receipt snapshot already captured above

      // Silent print: skip for credit transactions (no receipt needed)
      if (!isCredit) try {
        const res = await fetch('/api/print-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionNumber: receipt.transactionNumber,
            date: receipt.date,
            customerName: receipt.customerName,
            items: receipt.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
            subtotal: receipt.subtotal,
            vatableSales: receipt.vatableSales,
            tax: receipt.tax,
            total: receipt.total,
            paymentMethod: receipt.paymentMethod,
            amountTendered: receipt.amountTendered,
            change: receipt.change,
            openDrawer: true,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('Silent print failed:', errData);
        }
      } catch (printErr) {
        console.error('Silent print error:', printErr);
      }

      setSuccessModalOpen(true);

    } catch (err: any) {
      // Extract full error details for debugging
      const responseData = err?.response?.data;
      const status = err?.response?.status;
      console.error("Complete order error:", {
        status,
        responseData: JSON.stringify(responseData, null, 2),
        message: err?.message,
        fullError: JSON.stringify(err, null, 2),
      });

      // Extract validation errors if present
      const validationErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().join(", ")
        : err?.errors
          ? Object.values(err.errors).flat().join(", ")
          : "";

      // Get server message from response data
      const serverMsg = responseData?.message
        || err?.message
        || "Something went wrong";

      // For 500 errors, provide more context
      const displayMsg = status === 500
        ? `Server error: ${serverMsg}. Please contact support if this persists.`
        : validationErrors || serverMsg;

      Swal.fire({
        icon: "error",
        title: status === 500 ? "Server Error" : "Order Failed",
        text: displayMsg,
        confirmButtonColor: "#7c3aed",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [canComplete, customer, customers, selectedCustomerId, cart, splitPay, cashPay, cardPay, onlinePay, paid, primaryMethod, totals, change, loadInitialData, creditorFirstName, creditorMiddleName, creditorLastName, creditorPhone, creditorAddress]);

  const startNewTransaction = useCallback(() => {
    // Close success modal
    setSuccessModalOpen(false);
    setReceiptData(null);

    // Reset to sale screen
    setScreen("sale");

    // Reset cart and payment state
    setCart([]);
    setNotes("");
    setDiscountValue(0);
    setCashPay(0);
    setCardPay(0);
    setOnlinePay(0);
    setCreditorFirstName("");
    setCreditorMiddleName("");
    setCreditorLastName("");
    setCreditorPhone("");
    setCreditorAddress("");

    // Reset customer and payment settings
    setSelectedCustomerId(null);
    setCustomer("walkin");
    setFulfillment("pickup");
    setPaymentType("full");
    setSplitPay(false);
    setPrimaryMethod("cash");
    setTaxEnabled(true);
    setTaxRate(0.12);
    setDiscountMode("amount");

    // Generate new sale ID
    const base = String(Math.floor(Date.now() / 1000)).slice(-6);
    setSaleId(`SALE-${base}`);

    // Refresh products in background
    loadInitialData();
  }, [loadInitialData]);

  const screenProps = useMemo(() => ({
    screen, cart, query, setQuery, barcodeInput, setBarcodeInput, category, setCategory,
    customer, setCustomer, notes, setNotes, filtered, addToCart, applyBarcode, changeQty,
    removeItem, totals, discountAmount, canGoCheckout, setScreen, discountMode, setDiscountMode,
    discountValue, setDiscountValue, taxEnabled, setTaxEnabled, taxRate, setTaxRate,
    fulfillment, setFulfillment, deliveryKm, setDeliveryKm, paymentType, setPaymentType,
    splitPay, setSplitPay, primaryMethod, setPrimaryMethod, cashPay, setCashPay,
    cardPay, setCardPay, onlinePay, setOnlinePay, amountDue, paid, balance, change,
    canComplete, setReceiptOpen, calcDeliveryFee, completeOrder, categories,
    receiptData, startNewTransaction, creditorFirstName, setCreditorFirstName, creditorMiddleName, setCreditorMiddleName, creditorLastName, setCreditorLastName, creditorPhone, setCreditorPhone, creditorAddress, setCreditorAddress,
    customers,
  }), [screen, cart, query, barcodeInput, category, customer, notes, filtered, addToCart,
    applyBarcode, changeQty, removeItem, totals, discountAmount, canGoCheckout, discountMode,
    discountValue, taxEnabled, taxRate, fulfillment, deliveryKm, paymentType, splitPay,
    primaryMethod, cashPay, cardPay, onlinePay, amountDue, paid, balance, change,
    canComplete, completeOrder, categories, receiptData, startNewTransaction, creditorFirstName, creditorMiddleName, creditorLastName, creditorPhone, creditorAddress, customers]);

  // Show loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show error
  if (error) {
    return (
      <div className={`min-h-screen ${THEME.bg} flex items-center justify-center`}>
        <div className="text-center max-w-md">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Button onClick={loadInitialData} className="rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${THEME.bg} overflow-auto lg:overflow-hidden`}>
      <header className="border-b border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#1f1633]/70 backdrop-blur py-3 lg:h-[84px] lg:py-0">
        <div className="px-4 sm:px-6 flex flex-col gap-3 lg:h-full lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
            <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-200" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">Vendora POS</div>
              <div className={`text-xs ${THEME.muted} truncate`}>{screen === "sale" ? "Sale" : screen === "checkout" ? "Checkout" : "Receipt"} - Txn {saleId ?? "—"}</div>
            </div>
            <div className="hidden lg:flex gap-2 ml-2">
              <Pill>Cashier</Pill>
              {stores.length > 0 && (
                <Select value={selectedStore ? String(selectedStore) : "all"} onValueChange={(v) => setSelectedStore(v === "all" ? null : Number(v))}>
                  <SelectTrigger className="h-7 w-auto rounded-full bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white text-xs px-3" suppressHydrationWarning>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Pill>{customer === "walkin" ? "Walk in" : customer === "saved1" ? customers[0]?.name || "Customer 1" : customers[1]?.name || "Customer 2"}</Pill>
            </div>
          </div>

          {/* Network status indicators now in POS layout header */}
          <div className="flex items-center justify-center gap-3 lg:flex-1" />

          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            <Button
              variant="secondary"
              className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white"
              onClick={async () => {
                setOrderHistoryOpen(true);
                try {
                  const orders = await orderService.getAll({});
                  const list = extractDataArray(orders);
                  list.sort((a: any, b: any) => new Date(b.created_at || b.ordered_at || 0).getTime() - new Date(a.created_at || a.ordered_at || 0).getTime());
                  // API returns total in centavos — convert to pesos for display
                  setRecentOrders(list.map((o: any) => ({ ...o, total: Number(o.total ?? 0) / 100 })));
                } catch { /* Silent fail */ }
              }}
            >
              <History className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Orders</span>
            </Button>

            {screen !== "sale" && (
              <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => setScreen(screen === "receipt" ? "sale" : "sale")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => setReceiptOpen(true)}>
              <FileText className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Receipt</span>
            </Button>

            <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => setHoldOpen(true)} disabled={cart.length === 0}>
              <PauseCircle className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Hold</span>
            </Button>

            <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Settings</span>
            </Button>

            <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600" onClick={clearCart}>
              <Trash2 className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Clear</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="h-auto lg:h-[calc(100vh-84px)] px-4 py-4 lg:px-6 lg:overflow-hidden">
        <Suspense fallback={null}>
          <DesktopPOSLayout {...screenProps} />
        </Suspense>
      </main>

      {/* Lazy loaded dialogs */}
      <Suspense fallback={null}>
        {holdOpen && <InlineHoldDialog open={holdOpen} onOpenChange={setHoldOpen} cart={cart} />}
        {receiptOpen && <InlineReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} cart={cart} totals={totals} saleId={saleId} notes={notes} receiptData={receiptData} />}
        {settingsOpen && <InlineSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} taxEnabled={taxEnabled} setTaxEnabled={setTaxEnabled} taxRate={taxRate} setTaxRate={setTaxRate} />}
        {orderHistoryOpen && <InlineOrderHistoryDialog open={orderHistoryOpen} onOpenChange={setOrderHistoryOpen} recentOrders={recentOrders} />}
        {successModalOpen && <TransactionSuccessDialog open={successModalOpen} onOpenChange={(open: boolean) => { if (!open) startNewTransaction(); }} receiptData={receiptData} onNewTransaction={startNewTransaction} onViewCredits={() => { startNewTransaction(); router.push('/pos/credit-accounts'); }} />}
      </Suspense>

      {/* Hidden thermal receipt for printing */}
      {receiptData && <ThermalReceipt receiptData={receiptData} />}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#201836] rounded-2xl p-6 text-center">
            <Loader2 className="h-12 w-12 text-purple-500 dark:text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white text-lg">Processing...</p>
          </div>
        </div>
      )}

      <footer className="px-6 pb-6 hidden">
      </footer>
    </div>
  );
}

// Inline dialog components (fallback if lazy imports fail)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

function InlineHoldDialog({ open, onOpenChange, cart }: { open: boolean; onOpenChange: (v: boolean) => void; cart: CartItem[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl bg-white dark:bg-[#201836] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle>Hold this sale</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-white/60">Save the cart temporarily and resume later.</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 space-y-2">
          <div className="text-sm">Hold reference</div>
          <Input className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white" placeholder="Example Counter 1" />
          <div className="text-xs text-gray-600 dark:text-white/60">Feature coming soon.</div>
        </div>
        <DialogFooter>
          <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600" onClick={() => { onOpenChange(false); alert("Hold sale feature coming soon."); }} disabled={cart.length === 0}>Hold Sale</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InlineReceiptDialog({ open, onOpenChange, cart, totals, saleId, notes, receiptData }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl bg-white dark:bg-[#201836] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receipt Preview</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-white/60">{receiptData ? "Order completed successfully" : "Preview receipt before checkout"}</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">Vendora Retail</div>
              <div className="text-xs text-gray-600 dark:text-white/60">{receiptData ? `Order ${receiptData.orderNumber}` : `Transaction ${saleId ?? "—"}`}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600 dark:text-white/60">Cashier</div>
              <div className="text-sm">Staff</div>
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <div className="space-y-2">
            {cart.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-white/60">No items</div>
            ) : (
              cart.map((x: CartItem) => (
                <div key={x.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{x.name}</div>
                    <div className="text-xs text-gray-600 dark:text-white/60">{x.qty} {x.unit} × ₱ {x.price.toLocaleString()}</div>
                  </div>
                  <div className="font-medium">₱ {(x.qty * x.price).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
          <div className="h-px bg-white/10" />
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between"><span className="text-gray-600 dark:text-white/60">Subtotal</span><span>₱ {totals.subtotal.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-600 dark:text-white/60">Vatable Sales</span><span className="text-blue-500 dark:text-blue-400">₱ {(totals.total / 1.12).toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-600 dark:text-white/60">Discount</span><span>₱ {totals.discount.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-600 dark:text-white/60">Tax</span><span>₱ {totals.tax.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-600 dark:text-white/60">Delivery</span><span>₱ {totals.deliveryFee.toLocaleString()}</span></div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between font-semibold"><span>Total</span><span>₱ {totals.total.toLocaleString()}</span></div>
            {receiptData && (
              <>
                <div className="flex items-center justify-between"><span className="text-gray-600 dark:text-white/60">Paid</span><span>₱ {receiptData.paid.toLocaleString()}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-600 dark:text-white/60">Change</span><span>₱ {receiptData.change.toLocaleString()}</span></div>
                <div className="text-xs text-gray-600 dark:text-white/60 mt-2">Payment: {receiptData.paymentMethod}</div>
              </>
            )}
          </div>
          {notes && <div className="text-xs text-gray-600 dark:text-white/60">Notes: {notes}</div>}
        </div>
        <DialogFooter>
          <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600" onClick={() => window.print()}>Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InlineSettingsDialog({ open, onOpenChange, taxEnabled, setTaxEnabled, taxRate, setTaxRate }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl bg-white dark:bg-[#201836] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white max-w-xl">
        <DialogHeader>
          <DialogTitle>POS Settings</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-white/60">Configure POS preferences</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3 space-y-2">
            <div className="text-sm font-medium">Tax defaults</div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-white/60">Tax enabled by default</span>
              <Switch checked={taxEnabled} onCheckedChange={(v) => setTaxEnabled(Boolean(v))} />
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(Number(v))}>
                <SelectTrigger className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white" suppressHydrationWarning>
                  <SelectValue placeholder="Tax rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="0.03">3%</SelectItem>
                  <SelectItem value="0.05">5%</SelectItem>
                  <SelectItem value="0.12">12%</SelectItem>
                </SelectContent>
              </Select>
              <Pill>Rate</Pill>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => onOpenChange(false)}>Close</Button>
          <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600" onClick={() => onOpenChange(false)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InlineOrderHistoryDialog({ open, onOpenChange, recentOrders }: any) {
  const formatOrderDateTime = (order: any) => {
    const raw = order.created_at || order.ordered_at;
    if (!raw) return "—";
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleString("en-PH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl bg-white dark:bg-[#201836] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Recent Orders</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-white/60">View and manage recent transactions</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8"><p className="text-gray-600 dark:text-white/60">No orders found</p></div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{order.order_number || `ORD-${order.id}`}</div>
                      <div className="text-sm text-gray-600 dark:text-white/60">{order.customer?.name || order.customer || "Walk-in"}</div>
                      <div className="text-xs text-gray-600 dark:text-white/60">{formatOrderDateTime(order)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₱{(order.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-gray-600 dark:text-white/60 capitalize">{order.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-gray-200 dark:hover:bg-white/20 dark:text-white" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Transaction Success Modal - Thermal receipt style preview
function TransactionSuccessDialog({ open, onOpenChange, receiptData, onNewTransaction, onViewCredits }: any) {
  if (!receiptData) return null;

  const isCredit = receiptData.isCredit === true;
  const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const Row = ({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) => (
    <div className="flex justify-between">
      <span className={bold ? 'font-bold' : ''}>{label}</span>
      <span className={`${bold ? 'font-bold' : ''} ${green ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{value}</span>
    </div>
  );

  if (isCredit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm bg-transparent border-0 p-0 sm:max-w-md">
          <DialogTitle className="sr-only">Credit Transaction Recorded</DialogTitle>

          {/* Badge */}
          <div className="flex justify-center -mb-6 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 shadow-lg">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a2e] rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="px-6 pt-10 pb-6 text-center space-y-1">
              <div className="text-lg font-bold text-gray-900 dark:text-white">Credit Recorded!</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Transaction has been saved as credit</div>
            </div>

            <div className="px-6 pb-4 font-sans text-xs text-gray-700 dark:text-gray-300 space-y-1.5">
              <Row label="TXN:" value={receiptData.transactionNumber} />
              <Row label="Date:" value={receiptData.date} />
              <Row label="Creditor:" value={receiptData.customerName || 'Customer'} />
              {receiptData.creditorPhone && <Row label="Contact:" value={receiptData.creditorPhone} />}
              <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-2" />
              <div className="flex justify-between font-bold text-sm">
                <span>Balance Due:</span>
                <span className="text-orange-500">₱{fmt2(receiptData.total)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                <span>{receiptData.items.length} item{receiptData.items.length !== 1 ? 's' : ''}</span>
                <span>Status: <span className="text-orange-500 font-semibold">Pending</span></span>
              </div>
            </div>

            <div className="px-5 py-4 bg-gray-50 dark:bg-[#12121f] space-y-3">
              <Button
                className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold py-5 text-sm"
                onClick={onViewCredits}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Credit Accounts
              </Button>
              <Button
                variant="secondary"
                className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white py-4 text-sm"
                onClick={onNewTransaction}
              >
                New Transaction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto bg-transparent border-0 p-0 sm:max-w-md">
        <DialogTitle className="sr-only">Transaction Successful</DialogTitle>

        {/* Success Badge */}
        <div className="flex justify-center -mb-6 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Receipt Paper */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10">
          <div className="px-5 pt-8 pb-4 font-sans text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
            <div className="text-center mb-3">
              <div className="text-base font-bold tracking-wide">VENDORA POS</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">Point of Sale System</div>
            </div>
            <div className="space-y-0.5 mb-3">
              <Row label="TXN:" value={receiptData.transactionNumber} />
              <Row label="Date:" value={receiptData.date} />
              <Row label="Customer:" value={receiptData.customerName || 'Walk-in Customer'} />
              <Row label="Cashier:" value="Staff" />
            </div>
            <div className="space-y-1.5 mb-3">
              {receiptData.items.map((item: any, index: number) => (
                <div key={index}>
                  <div className="font-bold break-words">{item.name}</div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{item.qty} x ₱{fmt2(item.price)}</span>
                    <span className="text-gray-800 dark:text-gray-200">₱{fmt2(item.qty * item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-0.5 mb-3">
              <Row label="Subtotal:" value={`₱${fmt2(receiptData.subtotal)}`} />
              <Row label="Vatable Sales:" value={`₱${fmt2(receiptData.vatableSales)}`} />
              {receiptData.discount > 0 && (
                <Row label={`${receiptData.discountLabel}:`} value={`-₱${fmt2(receiptData.discount)}`} green />
              )}
              <Row label={`${receiptData.taxLabel}:`} value={`₱${fmt2(receiptData.tax)}`} />
              {receiptData.deliveryFee > 0 && (
                <Row label="Delivery Fee:" value={`₱${fmt2(receiptData.deliveryFee)}`} />
              )}
            </div>
            <div className="flex justify-between text-sm font-bold mb-3">
              <span>TOTAL:</span>
              <span className="text-emerald-600 dark:text-emerald-400">₱{fmt2(receiptData.total)}</span>
            </div>
            <div className="space-y-0.5 mb-3">
              <Row label={`Payment (${receiptData.paymentMethod}):`} value={`₱${fmt2(receiptData.amountTendered)}`} />
              <Row label="Change:" value={`₱${fmt2(receiptData.change)}`} bold green />
            </div>
            <div className="text-center text-gray-500 dark:text-gray-400 mt-2 mb-1">
              <div>Thank you for your purchase!</div>
              <div>Please come again</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-5 py-4 bg-gray-50 dark:bg-[#12121f] space-y-3">
            <Button
              className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-5 text-sm"
              onClick={onNewTransaction}
            >
              New Transaction
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white py-4 text-sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white py-4 text-sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Transaction Receipt",
                      text: `Transaction ${receiptData.transactionNumber} - Total: ₱${receiptData.total.toFixed(2)}`,
                    }).catch(() => { });
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Opens a dedicated print window with only the receipt HTML so that
// Thermal Receipt Component — rendered via Portal directly on <body>.
// This lets the @media print CSS use `display: none` on all other body
// children to completely remove them from layout, preventing blank pages.
function ThermalReceipt({ receiptData }: { receiptData: ReceiptData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const S = { row: { display: 'flex', justifyContent: 'space-between' } as const, dash: { borderBottom: '1px dashed #000', margin: '3px 0' } as const };
  const fmt2 = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return createPortal(
    <div id="thermal-receipt" style={{ display: 'none' }}>
      <div style={{ width: '100%', fontFamily: '"Courier New", Courier, monospace', fontSize: '9px', lineHeight: '1.1', color: '#000', backgroundColor: '#fff', padding: '0' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>VENDORA POS</div>
          <div style={{ fontSize: '9px' }}>Point of Sale System</div>
        </div>
        <div style={S.dash} />

        {/* Transaction Info */}
        <div style={{ fontSize: '9px', marginBottom: '1px' }}>
          <div style={S.row}><span>TXN:</span><span>{receiptData.transactionNumber}</span></div>
          <div style={S.row}><span>Date:</span><span>{receiptData.date}</span></div>
          <div style={S.row}><span>Customer:</span><span>{receiptData.customerName || 'Walk-in Customer'}</span></div>
          <div style={S.row}><span>Cashier:</span><span>Staff</span></div>
        </div>
        <div style={S.dash} />

        {/* Items */}
        <div style={{ fontSize: '9px', marginBottom: '1px' }}>
          {receiptData.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              <div style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{item.name}</div>
              <div style={S.row}>
                <span>{item.qty} x ₱{fmt2(item.price)}</span>
                <span>₱{fmt2(item.qty * item.price)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={S.dash} />

        {/* Totals */}
        <div style={{ fontSize: '9px' }}>
          <div style={S.row}><span>Subtotal:</span><span>₱{fmt2(receiptData.subtotal)}</span></div>
          <div style={S.row}><span>Vatable Sales:</span><span>₱{receiptData.vatableSales.toFixed(2)}</span></div>
          <div style={S.row}><span>Tax (12% VAT):</span><span>₱{receiptData.tax.toFixed(2)}</span></div>
        </div>
        <div style={S.dash} />

        {/* Grand Total */}
        <div style={{ ...S.row, fontSize: '12px', fontWeight: 'bold', margin: '2px 0' }}>
          <span>TOTAL:</span>
          <span>₱{fmt2(receiptData.total)}</span>
        </div>
        <div style={S.dash} />

        {/* Payment */}
        <div style={{ fontSize: '9px' }}>
          <div style={S.row}><span>Payment ({receiptData.paymentMethod}):</span><span>₱{fmt2(receiptData.amountTendered)}</span></div>
          <div style={{ ...S.row, fontWeight: 'bold' }}><span>Change:</span><span>₱{fmt2(receiptData.change)}</span></div>
        </div>
        <div style={S.dash} />

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '3px' }}>
          <div>Thank you for your purchase!</div>
          <div>Please come again</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
