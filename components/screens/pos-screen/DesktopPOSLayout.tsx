"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search,
  Barcode,
  ShoppingCart,
  Package,
  Trash2,
  Minus,
  Plus,
  User,
  Percent,
  Truck,
  Store,
  CreditCard,
  Banknote,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Printer,
  Share2,
  FileText,
} from "lucide-react";
import { type POSScreenProps } from "./types";
import { customerService } from "@/services";

const THEME = {
  bg: "bg-gray-50 dark:bg-gradient-to-br dark:from-[#1f1633] dark:via-[#241a3a] dark:to-[#2b1f4a]",
  card: "bg-white border border-gray-200 shadow-sm dark:bg-white/5 dark:border-white/10 dark:backdrop-blur dark:shadow-none",
  panel: "bg-white border border-gray-200 dark:bg-white/5 dark:border-white/10",
  muted: "text-gray-600 dark:text-white/60",
  text: "text-gray-900 dark:text-white",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-xs ${THEME.muted}`}>
      {children}
    </span>
  );
}

function Money({ value }: { value: number }) {
  return <span>{"\u20B1 "}{Math.round(value).toLocaleString()}</span>;
}

function StatRow({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${strong ? "font-semibold" : ""}`}>
      <span className={THEME.muted}>{label}</span>
      <span className={strong ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-white"}>{value}</span>
    </div>
  );
}

/**
 * Default POS Layout
 * Uses responsive grid utilities for all screen sizes
 */
export default function DesktopPOSLayout(props: POSScreenProps) {
  const {
    screen = "sale",
    cart = [],
    query = "",
    setQuery = () => { },
    barcodeInput = "",
    setBarcodeInput = () => { },
    category = "all",
    setCategory = () => { },
    customer = "walkin",
    setCustomer = () => { },
    notes = "",
    setNotes = () => { },
    filtered = [],
    addToCart = () => { },
    applyBarcode = () => { },
    changeQty = () => { },
    removeItem = () => { },
    totals = { subtotal: 0, vatableSales: 0, discount: 0, tax: 0, deliveryFee: 0, total: 0 },
    discountAmount = 0,
    canGoCheckout = false,
    setScreen = () => { },
    discountMode = "amount",
    setDiscountMode = () => { },
    discountValue = 0,
    setDiscountValue = () => { },
    taxEnabled = true,
    setTaxEnabled = () => { },
    taxRate = 0.12,
    setTaxRate = () => { },
    fulfillment = "pickup",
    setFulfillment = () => { },
    deliveryKm = 3,
    setDeliveryKm = () => { },
    paymentType = "full",
    setPaymentType = () => { },
    splitPay = false,
    setSplitPay = () => { },
    primaryMethod = "cash",
    setPrimaryMethod = () => { },
    cashPay = 0,
    setCashPay = () => { },
    cardPay = 0,
    setCardPay = () => { },
    onlinePay = 0,
    setOnlinePay = () => { },
    amountDue = 0,
    paid: _paid = 0,
    balance: _balance = 0,
    change = 0,
    canComplete = false,
    setReceiptOpen = () => { },
    calcDeliveryFee = () => 0,
    completeOrder = async () => { },
    categories = [],
    receiptData = null,
    startNewTransaction = () => { },
    creditorFirstName: _creditorFirstName = "",
    setCreditorFirstName: _setCreditorFirstName = () => { },
    creditorMiddleName: _creditorMiddleName = "",
    setCreditorMiddleName: _setCreditorMiddleName = () => { },
    creditorLastName: _creditorLastName = "",
    setCreditorLastName: _setCreditorLastName = () => { },
    creditorPhone: _creditorPhone = "",
    setCreditorPhone: _setCreditorPhone = () => { },
    creditorAddress: _creditorAddress = "",
    setCreditorAddress: _setCreditorAddress = () => { },
    customers = [],
  } = props || {};

  const [activeDiscountPreset, setActiveDiscountPreset] = useState<string>("None");
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [localFirstName, setLocalFirstName] = useState("");
  const [localMiddleName, setLocalMiddleName] = useState("");
  const [localLastName, setLocalLastName] = useState("");
  const [localCreditorPhone, setLocalCreditorPhone] = useState("");
  const [localCreditorAddress, setLocalCreditorAddress] = useState("");
  const [localCreditorDueDate, setLocalCreditorDueDate] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; phone?: string | null }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Parse a combined full name into first / middle / last parts
  function parseFullName(fullName: string) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { first: "", middle: "", last: "" };
    if (parts.length === 1) return { first: parts[0] ?? "", middle: "", last: "" };
    if (parts.length === 2) return { first: parts[0] ?? "", middle: "", last: parts[1] ?? "" };
    return { first: parts[0] ?? "", middle: parts.slice(1, -1).join(" "), last: parts[parts.length - 1] ?? "" };
  }

  // Search customers — local first, then API fallback
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }

    // Always search local cache first (instant)
    const localMatches = customers
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
    setSearchResults(localMatches);

    // Then hit the API to catch customers not in local cache
    try {
      setIsSearching(true);
      const response = await customerService.getAll({ search: query, per_page: 10 });
      const apiResults = Array.isArray(response) ? response : (response as any)?.data ?? [];
      // Merge: keep local matches + any new ones from API not already listed
      const localIds = new Set(localMatches.map((c) => c.id));
      const merged = [
        ...localMatches,
        ...apiResults.filter((c: { id: number }) => !localIds.has(c.id)),
      ].slice(0, 8);
      setSearchResults(merged);
    } catch {
      // API failed — local results already shown, that's fine
    } finally {
      setIsSearching(false);
    }
  }, [customers]);

  // Debounce the search so we don't spam the API on every keystroke
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim()) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(() => searchCustomers(value), 300);
  };

  // Close customer dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus barcode input when on sale screen
  useEffect(() => {
    const timer = setTimeout(() => {
      if (screen === "sale") barcodeInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [screen]);

  useEffect(() => {
    if (discountValue === 0) {
      setActiveDiscountPreset("None");
    } else if (discountMode === "amount" || ![5, 10, 20].includes(discountValue)) {
      setActiveDiscountPreset("Custom");
    }
  }, [discountValue, discountMode]);

  if (screen === "receipt" && receiptData) {
    return (
      <div className="h-full flex items-start justify-center overflow-auto py-4">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#2d1f5e] dark:to-[#3a2570] border border-gray-200 dark:border-white/10 overflow-hidden shadow-2xl">
            {/* Header - Checkmark + Title */}
            <div className="pt-10 pb-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Successful!</h2>
              <p className={`text-sm ${THEME.muted} mt-1 tracking-wider uppercase`}>Vendora POS</p>
            </div>

            <div className="px-6 pb-8 space-y-0">
              {/* Transaction Details */}
              <div className="border-t border-gray-200 dark:border-white/10 py-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Transaction #</span>
                  <span className="text-gray-900 dark:text-white font-medium">{receiptData.transactionNumber}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Date</span>
                  <span className="text-gray-900 dark:text-white">{receiptData.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Customer</span>
                  <span className="text-gray-900 dark:text-white">{receiptData.customerName}</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 dark:border-white/10 py-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Items</h3>
                <div className="space-y-2">
                  {receiptData.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className={THEME.muted}>
                        {item.name} <span className="text-gray-500 dark:text-white/40">x{item.qty}</span>
                      </span>
                      <span className="text-gray-900 dark:text-white">₱ {(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-white/10 py-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Subtotal</span>
                  <span className="text-gray-900 dark:text-white">₱ {receiptData.subtotal.toFixed(2)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className={THEME.muted}>{receiptData.discountLabel}</span>
                    <span className="text-emerald-400">- ₱ {receiptData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Vatable Sales</span>
                  <span className="text-blue-500 dark:text-blue-400 font-medium">₱ {receiptData.vatableSales.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>{receiptData.taxLabel}</span>
                  <span className="text-gray-900 dark:text-white">₱ {receiptData.tax.toFixed(2)}</span>
                </div>
                {receiptData.deliveryFee > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className={THEME.muted}>Delivery Fee</span>
                    <span className="text-gray-900 dark:text-white">₱ {receiptData.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-white/10 pt-2 flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white font-bold">Total</span>
                  <span className="text-emerald-400 font-bold text-lg">₱ {receiptData.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-gray-200 dark:border-white/10 py-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Payment Method</span>
                  <span className="text-gray-900 dark:text-white font-medium">{receiptData.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Amount Tendered</span>
                  <span className="text-gray-900 dark:text-white">₱ {receiptData.amountTendered.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={THEME.muted}>Change</span>
                  <span className="text-emerald-400 font-medium">₱ {receiptData.change.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 dark:border-white/10 pt-6 space-y-3">
                <Button
                  className="w-full rounded-2xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold py-6 text-base"
                  onClick={startNewTransaction}
                >
                  New Transaction
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    className="rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white py-5"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="secondary"
                    className="rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white py-5"
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
          </div>
        </div>

        {/* Hidden Printable Thermal Receipt */}
        <div id="printable-receipt" className="hidden">
          <div className="receipt-header">VENDORA POS</div>
          <div className="receipt-subheader">Transaction Successful</div>
          <hr className="receipt-divider" />
          <div className="receipt-row">
            <span>Transaction #</span>
            <span>{receiptData.transactionNumber}</span>
          </div>
          <div className="receipt-row">
            <span>Date</span>
            <span>{receiptData.date}</span>
          </div>
          <div className="receipt-row">
            <span>Customer</span>
            <span>{receiptData.customerName}</span>
          </div>
          <hr className="receipt-divider" />
          <div className="receipt-section-title">Items</div>
          {receiptData.items.map((item) => (
            <div key={item.id}>
              <div className="receipt-row">
                <span>{item.name}</span>
                <span>x{item.qty} ₱ {(item.price * item.qty).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <hr className="receipt-divider" />
          <div className="receipt-row">
            <span>Subtotal</span>
            <span>₱ {receiptData.subtotal.toFixed(2)}</span>
          </div>
          {receiptData.discount > 0 && (
            <div className="receipt-row">
              <span>{receiptData.discountLabel}</span>
              <span>- ₱ {receiptData.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="receipt-row">
            <span>Vatable Sales</span>
            <span>₱ {receiptData.vatableSales.toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>{receiptData.taxLabel}</span>
            <span>₱ {receiptData.tax.toFixed(2)}</span>
          </div>
          {receiptData.deliveryFee > 0 && (
            <div className="receipt-row">
              <span>Delivery Fee</span>
              <span>₱ {receiptData.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <hr className="receipt-divider" />
          <div className="receipt-row receipt-row-bold">
            <span>TOTAL</span>
            <span>₱ {receiptData.total.toFixed(2)}</span>
          </div>
          <hr className="receipt-divider" />
          <div className="receipt-row">
            <span>Payment Method</span>
            <span>{receiptData.paymentMethod}</span>
          </div>
          <div className="receipt-row">
            <span>Amount Tendered</span>
            <span>₱ {receiptData.amountTendered.toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>Change</span>
            <span>₱ {receiptData.change.toFixed(2)}</span>
          </div>
          <hr className="receipt-divider" />
          <div className="receipt-footer">
            Thank you for your purchase!<br />
            Please come again
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {screen === "sale" ? (
        <div className="h-full grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left column - Products */}
          <div className="h-full xl:col-span-8 grid grid-rows-[auto_1fr] gap-4 overflow-hidden">
            <Card className={`rounded-2xl ${THEME.card}`}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                    <div className={`rounded-2xl ${THEME.panel} p-2 flex flex-col gap-2 sm:flex-row sm:items-center`}>
                      <User className={`h-4 w-4 ${THEME.muted}`} />
                      <Select value={customer} onValueChange={(v) => setCustomer(v as any)}>
                        <SelectTrigger className="w-full sm:w-[210px] rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white" suppressHydrationWarning>
                          <SelectValue placeholder="Customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walkin">Walk in customer</SelectItem>
                          <SelectItem value="saved1">Mark S.</SelectItem>
                          <SelectItem value="saved2">Liza R.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={`rounded-2xl ${THEME.panel} p-2 flex flex-col gap-2 sm:flex-row sm:items-center`}>
                      <Barcode className={`h-4 w-4 ${THEME.muted}`} />
                      <Input
                        ref={barcodeInputRef}
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="w-full sm:w-[220px] rounded-xl bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 dark:bg-white/10 dark:border-white/10 dark:text-white dark:placeholder:text-gray-400 dark:text-white/40"
                        placeholder="Scan barcode or type SKU"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") applyBarcode();
                        }}
                      />
                      <Button className="w-full sm:w-auto rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600" onClick={applyBarcode}>
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`rounded-2xl ${THEME.card} overflow-hidden`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600 dark:text-purple-200" /> Products
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className={`h-4 w-4 ${THEME.muted} absolute left-3 top-1/2 -translate-y-1/2`} />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-9 rounded-xl bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 dark:bg-white/10 dark:border-white/10 dark:text-white dark:placeholder:text-gray-400 dark:text-white/40"
                      placeholder="Search"
                    />
                  </div>

                  <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                    <SelectTrigger className="w-full sm:w-[140px] rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white" suppressHydrationWarning>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Pill>Tap to add</Pill>
                  <Pill>Stock check</Pill>
                </div>
              </CardHeader>

              <CardContent className="h-full overflow-hidden pt-0">
                <div className="h-full overflow-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                    {filtered.map((p) => (
                      <div
                        key={p.id}
                        className={`rounded-2xl ${THEME.panel} px-3 py-2 flex flex-col gap-1 ${p.stock <= 0 ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate text-gray-900 dark:text-white flex items-center gap-2">
                              {p.name}
                              {p.stock <= 0 && (
                                <span className="text-[9px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
                            <Money value={p.price} />
                          </div>

                          <Button
                            size="sm"
                            disabled={p.stock <= 0}
                            onClick={() => addToCart(p, 1)}
                            className="rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {p.stock <= 0 ? 'Unavailable' : 'Add'}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <div className={`${THEME.muted}`}>
                            {p.sku} &bull; {p.unit}
                          </div>
                          <div className={`${THEME.muted} ${p.stock <= 0 ? 'text-red-400' : ''}`}>
                            Stock {p.stock}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Cart */}
          <div className="xl:col-span-4 overflow-hidden">
            <Card className={`rounded-2xl ${THEME.card} overflow-hidden flex flex-col`}>
              <CardHeader className="pb-3 shrink-0">
                <CardTitle className="text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-200" /> Cart
                </CardTitle>
                <div className={`text-xs ${THEME.muted}`}>Adjust quantity then go checkout</div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-4 pt-0">
                <div className="flex flex-col gap-3">
                  <div className="max-h-[150px] sm:max-h-[180px] md:max-h-[200px] lg:max-h-[220px] xl:max-h-[280px] 2xl:max-h-[350px] overflow-auto pr-1">
                    {cart.length === 0 ? (
                      <div className="rounded-2xl border border-gray-200 dark:border-white/15 border-dashed p-6 text-center text-sm text-gray-600 dark:text-white/60">
                        Cart is empty
                      </div>
                    ) : (
                      <div className="space-y-2 pb-2">
                        {cart.map((x) => (
                          <div key={x.id} className={`rounded-2xl ${THEME.panel} p-2`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium truncate text-gray-900 dark:text-white text-xs">
                                  {x.name} <span className={`text-[7px] ${THEME.muted} font-normal`}>({x.sku})</span>
                                </div>
                                <div className={`text-[7px] ${THEME.muted}`}>{x.unit}</div>
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white"><Money value={x.price * x.qty} /></div>
                            </div>

                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex items-center rounded-md bg-white/10 border border-gray-200 dark:border-white/10 h-5 overflow-hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-full w-5 p-0 rounded-none hover:bg-gray-100 dark:hover:bg-white/10 text-purple-600 dark:text-purple-200"
                                  onClick={() => changeQty(x.id, x.qty - 1)}
                                >
                                  <Minus className="h-2 w-2" />
                                </Button>
                                <Input
                                  value={x.qty}
                                  onChange={(e) => changeQty(x.id, e.target.value)}
                                  className="h-full w-7 text-center bg-transparent border-0 text-gray-900 dark:text-white text-[9px] p-0 focus-visible:ring-0 rounded-none"
                                  inputMode="numeric"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-full w-5 p-0 rounded-none hover:bg-gray-100 dark:hover:bg-white/10 text-purple-600 dark:text-purple-200"
                                  onClick={() => changeQty(x.id, x.qty + 1)}
                                >
                                  <Plus className="h-2 w-2" />
                                </Button>
                              </div>

                              <div className={`ml-auto text-[10px] ${THEME.muted}`}>Unit <Money value={x.price} /></div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-5 w-5 p-0 rounded-md border-red-500/30 text-gray-600 hover:bg-red-500/10 hover:text-red-200"
                                onClick={() => removeItem(x.id)}
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            {x.qty >= x.stock ? <div className={`mt-2 text-xs ${THEME.muted}`}>Max stock reached</div> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`rounded-2xl ${THEME.panel} p-2 space-y-1`}>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">Notes</div>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400 dark:bg-white/10 dark:border-white/10 dark:text-white dark:placeholder:text-gray-400 dark:text-white/40 h-8 text-xs"
                      placeholder="Optional"
                    />
                    <div className="h-px bg-gray-200 dark:bg-white/10" />
                    <StatRow label="Subtotal" value={<Money value={totals.subtotal} />} />
                    <StatRow label="Discount" value={<Money value={discountAmount} />} />
                    <StatRow label="Vatable Sales" value={<span className="text-blue-500 dark:text-blue-400">{"₱ "}{totals.vatableSales.toFixed(2)}</span>} />
                    <StatRow label="Tax" value={<span className="text-gray-900 dark:text-white">{"₱ "}{totals.tax.toFixed(2)}</span>} />
                    <StatRow label="Delivery" value={<Money value={totals.deliveryFee} />} />
                    <div className="h-px bg-gray-200 dark:bg-white/10" />
                    <StatRow label="Total" value={<Money value={totals.total} />} strong />
                    {cart.length > 0 ? (
                      <Button
                        className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                        disabled={!canGoCheckout}
                        onClick={() => setScreen("checkout")}
                      >
                        Checkout
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        // Checkout Screen
        <div className="h-full grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left: options */}
          <div className="h-full xl:col-span-7 overflow-hidden">
            <Card className={`rounded-2xl ${THEME.card} h-full overflow-hidden`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900 dark:text-white">Checkout Details</CardTitle>
                <div className={`text-xs ${THEME.muted}`}>Keep this screen clean and focused</div>
              </CardHeader>

              <CardContent className="h-full overflow-hidden">
                <div className="h-full overflow-auto pr-1 space-y-4 pb-2">
                  <Card className={`rounded-2xl ${THEME.card}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-900 dark:text-white">Fulfillment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={fulfillment === "pickup" ? "default" : "secondary"}
                          className={
                            fulfillment === "pickup"
                              ? "rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                              : "rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"
                          }
                          onClick={() => setFulfillment("pickup")}
                        >
                          <Store className="h-4 w-4 mr-2" /> Pickup
                        </Button>
                        <Button
                          type="button"
                          variant={fulfillment === "delivery" ? "default" : "secondary"}
                          className={
                            fulfillment === "delivery"
                              ? "rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                              : "rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"
                          }
                          onClick={() => setFulfillment("delivery")}
                        >
                          <Truck className="h-4 w-4 mr-2" /> Delivery
                        </Button>
                      </div>

                      {fulfillment === "delivery" ? (
                        <div className={`rounded-2xl ${THEME.panel} p-3 space-y-2`}>
                          <div className={`text-xs ${THEME.muted}`}>Distance estimate</div>
                          <Select value={String(deliveryKm)} onValueChange={(v) => setDeliveryKm(Number(v))}>
                            <SelectTrigger className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white" suppressHydrationWarning>
                              <SelectValue placeholder="Distance" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 km</SelectItem>
                              <SelectItem value="3">3 km</SelectItem>
                              <SelectItem value="5">5 km</SelectItem>
                              <SelectItem value="8">8 km</SelectItem>
                              <SelectItem value="12">12 km</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-sm text-gray-900 dark:text-white">Delivery fee <Money value={calcDeliveryFee("delivery", deliveryKm)} /></div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card className={`rounded-2xl ${THEME.card}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-900 dark:text-white">Discount Type</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { label: "None", mode: "percent" as const, value: 0 },
                          { label: "SC 20%", mode: "percent" as const, value: 20 },
                          { label: "PWD 20%", mode: "percent" as const, value: 20 },
                          { label: "Emp 10%", mode: "percent" as const, value: 10 },
                          { label: "Promo", mode: "percent" as const, value: 5 },
                          { label: "Custom", mode: discountMode, value: -1 },
                        ].map((preset) => {
                          const isActive = activeDiscountPreset === preset.label;
                          return (
                            <Button
                              key={preset.label}
                              type="button"
                              variant={isActive ? "default" : "secondary"}
                              className={`rounded-xl text-xs px-2 py-2 ${isActive
                                ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"
                                }`}
                              onClick={() => {
                                setActiveDiscountPreset(preset.label);
                                if (preset.label === "None") {
                                  setDiscountMode("percent");
                                  setDiscountValue(0);
                                } else if (preset.label === "Custom") {
                                  // Keep current mode, let user type
                                } else {
                                  setDiscountMode(preset.mode);
                                  setDiscountValue(preset.value);
                                }
                              }}
                            >
                              {preset.label}
                            </Button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={discountMode === "amount" ? "default" : "secondary"}
                          size="sm"
                          className={`rounded-xl text-xs ${discountMode === "amount"
                            ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"}`}
                          onClick={() => setDiscountMode("amount")}
                        >
                          <Wallet className="h-3 w-3 mr-1" /> Amount
                        </Button>
                        <Button
                          type="button"
                          variant={discountMode === "percent" ? "default" : "secondary"}
                          size="sm"
                          className={`rounded-xl text-xs ${discountMode === "percent"
                            ? "bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"}`}
                          onClick={() => setDiscountMode("percent")}
                        >
                          <Percent className="h-3 w-3 mr-1" /> Percent
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          value={discountValue}
                          onChange={(e) => {
                            setDiscountValue(Number(e.target.value || 0));
                            setActiveDiscountPreset("Custom");
                          }}
                          className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white"
                          inputMode="numeric"
                          placeholder={discountMode === "amount" ? "₱ 0" : "0 to 100"}
                        />
                        <Pill>{discountMode === "amount" ? "₱" : "%"}</Pill>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`rounded-2xl ${THEME.card} hidden`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-900 dark:text-white">Tax Rate (%)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">VAT</div>
                          <div className={`text-xs ${THEME.muted}`}>Enable or disable tax</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={taxEnabled} onCheckedChange={(v) => setTaxEnabled(Boolean(v))} />
                          <Label className="text-gray-600 dark:text-white/70">{taxEnabled ? "On" : "Off"}</Label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(Number(v))}>
                          <SelectTrigger className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white" suppressHydrationWarning>
                            <SelectValue placeholder="Tax rate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (VAT Exempt)</SelectItem>
                            <SelectItem value="0.03">3%</SelectItem>
                            <SelectItem value="0.05">5%</SelectItem>
                            <SelectItem value="0.12">12% (Standard VAT)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Pill>Rate</Pill>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`rounded-2xl ${THEME.card}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-900 dark:text-white">Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Payment method icon buttons */}
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { key: "cash" as const, label: "Cash", Icon: Banknote, disabled: false },
                          { key: "credit" as const, label: "Credit", Icon: FileText, disabled: false },
                          { key: "card" as const, label: "Card", Icon: CreditCard, disabled: true },
                          { key: "online" as const, label: "E-Wallet", Icon: Wallet, disabled: true },
                        ].map(({ key, label, Icon, disabled }) => (
                          <button
                            key={key}
                            type="button"
                            disabled={disabled}
                            onClick={() => { if (!disabled) { setPrimaryMethod(key); setSplitPay(false); } }}
                            className={`relative flex flex-col items-center gap-2 rounded-2xl p-4 transition-all ${disabled
                              ? "opacity-40 cursor-not-allowed " + THEME.panel + " text-gray-400 dark:text-white/30"
                              : !splitPay && primaryMethod === key
                                ? "bg-purple-100 border-2 border-purple-400 text-purple-700 dark:bg-purple-600/30 dark:border-purple-500 dark:text-purple-300"
                                : `${THEME.panel} text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10`
                              }`}
                          >
                            <Icon className="h-7 w-7" />
                            <span className="text-xs font-medium">{label}</span>
                            {disabled && (
                              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-gray-300 dark:bg-white/20 text-gray-600 dark:text-white/60 leading-none">
                                Soon
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Split payment and Full/Partial toggles hidden by request */}
                      <div className="hidden">
                        {/* Split payment toggle */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">Split payment</div>
                            <div className={`text-xs ${THEME.muted}`}>Combine methods</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={splitPay} onCheckedChange={(v) => setSplitPay(Boolean(v))} />
                            <Label className="text-gray-600 dark:text-white/70">Split</Label>
                          </div>
                        </div>

                        {/* Full / Partial */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Button
                            type="button"
                            variant={paymentType === "full" ? "default" : "secondary"}
                            className={paymentType === "full"
                              ? "rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                              : "rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"}
                            onClick={() => setPaymentType("full")}
                          >
                            Full
                          </Button>
                          <Button
                            type="button"
                            variant={paymentType === "partial" ? "default" : "secondary"}
                            className={paymentType === "partial"
                              ? "rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                              : "rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white"}
                            onClick={() => setPaymentType("partial")}
                          >
                            Partial
                          </Button>
                        </div>
                      </div>

                      {primaryMethod !== "credit" && (!splitPay ? (
                        <div className={`rounded-2xl ${THEME.panel} p-3 space-y-3`}>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Amount Tendered</div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-white/60 text-lg">₱</span>
                            <Input
                              value={primaryMethod === "cash" ? cashPay : primaryMethod === "card" ? cardPay : onlinePay}
                              onChange={(e) => {
                                const v = Number(e.target.value || 0);
                                if (primaryMethod === "cash") setCashPay(v);
                                if (primaryMethod === "card") setCardPay(v);
                                if (primaryMethod === "online") setOnlinePay(v);
                              }}
                              className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 text-lg dark:bg-white/10 dark:border-white/10 dark:text-white"
                              inputMode="numeric"
                              placeholder="0"
                            />
                          </div>

                          {/* Quick amount buttons */}
                          <div className="grid grid-cols-4 gap-2">
                            {[500, 1000, 2000].map((amt) => (
                              <Button
                                key={amt}
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs"
                                onClick={() => {
                                  if (primaryMethod === "cash") setCashPay(amt);
                                  if (primaryMethod === "card") setCardPay(amt);
                                  if (primaryMethod === "online") setOnlinePay(amt);
                                }}
                              >
                                ₱{amt.toLocaleString()}
                              </Button>
                            ))}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 dark:bg-purple-600/30 dark:hover:bg-purple-600/50 dark:text-purple-300 dark:border-purple-500/30 text-xs"
                              onClick={() => {
                                if (primaryMethod === "cash") setCashPay(amountDue);
                                if (primaryMethod === "card") setCardPay(amountDue);
                                if (primaryMethod === "online") setOnlinePay(amountDue);
                              }}
                            >
                              Exact
                            </Button>
                          </div>

                          {/* Change display */}
                          <div className={`rounded-xl ${THEME.panel} p-3 flex items-center justify-between`}>
                            <span className={THEME.muted}>Change</span>
                            <span className="text-emerald-400 font-bold text-lg">₱ {change.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`rounded-2xl ${THEME.panel} p-3 space-y-3`}>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">Split amounts</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <div className={`text-xs ${THEME.muted} flex items-center gap-1`}><Banknote className="h-3 w-3" /> Cash</div>
                              <Input
                                value={cashPay}
                                onChange={(e) => setCashPay(Number(e.target.value || 0))}
                                className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white"
                                inputMode="numeric"
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className={`text-xs ${THEME.muted} flex items-center gap-1`}><CreditCard className="h-3 w-3" /> Card</div>
                              <Input
                                value={cardPay}
                                onChange={(e) => setCardPay(Number(e.target.value || 0))}
                                className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white"
                                inputMode="numeric"
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className={`text-xs ${THEME.muted} flex items-center gap-1`}><Wallet className="h-3 w-3" /> E-Wallet</div>
                              <Input
                                value={onlinePay}
                                onChange={(e) => setOnlinePay(Number(e.target.value || 0))}
                                className="rounded-xl bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/10 dark:border-white/10 dark:text-white"
                                inputMode="numeric"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className={`rounded-xl ${THEME.panel} p-3 flex items-center justify-between`}>
                            <span className={THEME.muted}>Change</span>
                            <span className="text-emerald-400 font-bold text-lg">₱ {change.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}

                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: summary + complete button always visible */}
          <div className="h-full xl:col-span-5 overflow-hidden">
            <Card className={`rounded-2xl ${THEME.card} h-full overflow-hidden`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-900 dark:text-white">Summary</CardTitle>
                <div className={`text-xs ${THEME.muted}`}>Review items and totals</div>
              </CardHeader>

              <CardContent className="h-full overflow-hidden">
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-auto pr-1">
                    <div className={`rounded-2xl ${THEME.panel} p-3 space-y-2`}>
                      {cart.length === 0 ? (
                        <div className={`text-sm ${THEME.muted}`}>No items</div>
                      ) : (
                        cart.map((x) => (
                          <div key={x.id} className="flex items-center justify-between text-sm">
                            <div className="min-w-0">
                              <div className="truncate text-gray-900 dark:text-white">{x.name}</div>
                              <div className={`text-xs ${THEME.muted}`}>{x.qty} {x.unit} &times; <Money value={x.price} /></div>
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white"><Money value={x.qty * x.price} /></div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className={`mt-3 rounded-2xl ${THEME.panel} p-3 space-y-2`}>
                      <StatRow label="Subtotal" value={<Money value={totals.subtotal} />} />
                      <StatRow label="Discount" value={<Money value={totals.discount} />} />
                      <StatRow label="Vatable Sales" value={<span className="text-blue-500 dark:text-blue-400">{"₱ "}{totals.vatableSales.toFixed(2)}</span>} />
                      <StatRow label="Tax" value={<span className="text-gray-900 dark:text-white">{"₱ "}{totals.tax.toFixed(2)}</span>} />
                      <StatRow label="Delivery" value={<Money value={totals.deliveryFee} />} />
                      <div className="h-px bg-gray-200 dark:bg-white/10" />
                      <StatRow label="Total" value={<Money value={totals.total} />} strong />
                      <StatRow label="Amount due" value={<Money value={amountDue} />} strong />
                    </div>

                    {notes ? (
                      <div className={`mt-3 rounded-2xl ${THEME.panel} p-3 text-sm text-gray-900 dark:text-white`}>
                        <div className={`text-xs ${THEME.muted}`}>Notes</div>
                        <div>{notes}</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 pt-3">
                    {primaryMethod === "credit" ? (
                      <Button
                        className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 py-5 text-base font-semibold text-white"
                        disabled={cart.length === 0 || totals.total <= 0}
                        onClick={() => setIsCreditDialogOpen(true)}
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        Confirm Credit
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 py-5 text-base font-semibold"
                        disabled={!canComplete}
                        onClick={() => {
                          if (completeOrder) {
                            completeOrder();
                          }
                        }}
                      >
                        Confirm Payment
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white mt-2"
                      onClick={() => setReceiptOpen(true)}
                    >
                      Preview Receipt
                    </Button>

                    <div className={`mt-2 text-xs ${THEME.muted}`}>
                      {primaryMethod === "credit"
                        ? "Transaction will be added to the customer's credit account."
                        : canComplete ? "Ready to confirm payment." : "Enter payment amount to cover the balance."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Credit Info Dialog */}
      <Dialog open={isCreditDialogOpen} onOpenChange={(v) => { setIsCreditDialogOpen(v); if (!v) { setLocalFirstName(""); setLocalMiddleName(""); setLocalLastName(""); setLocalCreditorPhone(""); setLocalCreditorAddress(""); setLocalCreditorDueDate(""); setCustomerSearch(""); setSearchResults([]); setShowCustomerDropdown(false); } }}>
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-[#1e1340] border-gray-200 dark:border-white/10 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Credit Account Info
            </DialogTitle>
            <p className={`text-sm ${THEME.muted} pt-1`}>Fill in the customer&apos;s details to complete this credit transaction.</p>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {/* Customer search — auto-fill from existing customers */}
            <div ref={customerSearchRef} className="relative grid gap-1.5">
              <Label className="text-gray-700 dark:text-white/80 text-sm flex items-center gap-1">
                <Search className="h-3.5 w-3.5" /> Search Existing Customer
              </Label>
              <div className="relative">
                <Input
                  placeholder="Type a name to search..."
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => { if (customerSearch.trim()) setShowCustomerDropdown(true); }}
                  className="rounded-xl bg-gray-50 border-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white pr-8"
                />
                {isSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-500 animate-pulse">...</span>
                )}
              </div>
              {showCustomerDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1340] shadow-lg overflow-hidden">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-white/10 flex items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const parsed = parseFullName(c.name);
                        setLocalFirstName(parsed.first);
                        setLocalMiddleName(parsed.middle);
                        setLocalLastName(parsed.last);
                        setLocalCreditorPhone(c.phone ?? "");
                        setCustomerSearch(c.name);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <span className="text-sm text-gray-900 dark:text-white font-medium">{c.name}</span>
                      {c.phone && <span className={`text-xs ${THEME.muted} shrink-0`}>{c.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
              {showCustomerDropdown && customerSearch.trim().length > 0 && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1340] shadow-lg px-3 py-2.5 text-sm text-gray-500 dark:text-white/50">
                  No existing customer found — fill in details below.
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 -my-1">
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              <span className={`text-xs ${THEME.muted}`}>or fill in manually</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="cd-firstname" className="text-gray-700 dark:text-white/80 text-sm">First Name <span className="text-red-500">*</span></Label>
                <Input id="cd-firstname" placeholder="First name" value={localFirstName} onChange={(e) => setLocalFirstName(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cd-lastname" className="text-gray-700 dark:text-white/80 text-sm">Last Name <span className="text-red-500">*</span></Label>
                <Input id="cd-lastname" placeholder="Last name" value={localLastName} onChange={(e) => setLocalLastName(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cd-middlename" className="text-gray-700 dark:text-white/80 text-sm">Middle Name <span className={`text-xs ${THEME.muted}`}>(optional)</span></Label>
              <Input id="cd-middlename" placeholder="Middle name" value={localMiddleName} onChange={(e) => setLocalMiddleName(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cd-phone" className="text-gray-700 dark:text-white/80 text-sm">Contact Number <span className="text-red-500">*</span></Label>
              <Input id="cd-phone" placeholder="Phone or mobile number" value={localCreditorPhone} onChange={(e) => setLocalCreditorPhone(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cd-address" className="text-gray-700 dark:text-white/80 text-sm">Address <span className="text-red-500">*</span></Label>
              <Input id="cd-address" placeholder="Complete address" value={localCreditorAddress} onChange={(e) => setLocalCreditorAddress(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cd-due-date" className="text-gray-700 dark:text-white/80 text-sm">Due Date <span className={`text-xs ${THEME.muted}`}>(optional)</span></Label>
              <Input id="cd-due-date" type="date" value={localCreditorDueDate} onChange={(e) => setLocalCreditorDueDate(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 dark:bg-white/10 dark:border-white/10 dark:text-white" />
            </div>
            <div className={`rounded-xl ${THEME.panel} p-3 flex items-center justify-between`}>
              <span className={`text-sm ${THEME.muted}`}>Amount to Credit</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 text-base">&#8369; {amountDue.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsCreditDialogOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
              disabled={!localFirstName.trim() || !localLastName.trim() || !localCreditorPhone.trim() || !localCreditorAddress.trim()}
              onClick={async () => {
                setIsCreditDialogOpen(false);
                if (completeOrder) await completeOrder(true, {
                  firstName: localFirstName,
                  middleName: localMiddleName || undefined,
                  lastName: localLastName,
                  phone: localCreditorPhone,
                  address: localCreditorAddress,
                  dueDate: localCreditorDueDate || undefined,
                });
              }}
            >
              Confirm Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
