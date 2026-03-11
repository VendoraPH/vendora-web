export type Fulfillment = "pickup" | "delivery";

export type POSProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  category: "grocery" | "hardware" | "general";
  unit: string;
};

export type CartItem = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  unit: string;
  qty: number;
};

export type Screen = "sale" | "checkout" | "receipt";

export interface ReceiptData {
  transactionNumber: string;
  date: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  vatableSales: number;
  discount: number;
  discountLabel: string;
  tax: number;
  taxLabel: string;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  amountTendered: number;
  change: number;
  isCredit?: boolean;
  creditorPhone?: string;
  creditorAddress?: string;
}

export interface POSScreenProps {
  screen: Screen;
  cart: CartItem[];
  query: string;
  setQuery: (value: string) => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  customer: "walkin" | "saved1" | "saved2";
  setCustomer: (value: "walkin" | "saved1" | "saved2") => void;
  notes: string;
  setNotes: (value: string) => void;
  filtered: POSProduct[];
  addToCart: (p: POSProduct, qty?: number) => void;
  applyBarcode: () => void;
  changeQty: (id: string, nextQty: number | string) => void;
  removeItem: (id: string) => void;
  totals: {
    subtotal: number;
    vatableSales: number;
    discount: number;
    tax: number;
    deliveryFee: number;
    total: number;
  };
  discountAmount: number;
  canGoCheckout: boolean;
  setScreen: (screen: Screen) => void;
  discountMode: "amount" | "percent";
  setDiscountMode: (mode: "amount" | "percent") => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  taxEnabled: boolean;
  setTaxEnabled: (value: boolean) => void;
  taxRate: number;
  setTaxRate: (value: number) => void;
  fulfillment: Fulfillment;
  setFulfillment: (value: Fulfillment) => void;
  deliveryKm: number;
  setDeliveryKm: (value: number) => void;
  paymentType: "full" | "partial";
  setPaymentType: (value: "full" | "partial") => void;
  splitPay: boolean;
  setSplitPay: (value: boolean) => void;
  primaryMethod: "cash" | "card" | "online" | "credit";
  setPrimaryMethod: (value: "cash" | "card" | "online" | "credit") => void;
  cashPay: number;
  setCashPay: (value: number) => void;
  cardPay: number;
  setCardPay: (value: number) => void;
  onlinePay: number;
  setOnlinePay: (value: number) => void;
  amountDue: number;
  paid: number;
  balance: number;
  change: number;
  canComplete: boolean;
  setReceiptOpen: (value: boolean) => void;
  calcDeliveryFee: (fulfillment: Fulfillment, deliveryKm: number) => number;
  completeOrder?: (isCredit?: boolean, creditInfo?: { firstName: string; middleName?: string; lastName: string; phone: string; address: string; dueDate?: string }) => Promise<void>;
  categories?: any[];
  receiptData?: ReceiptData | null;
  startNewTransaction?: () => void;
  creditorFirstName?: string;
  setCreditorFirstName?: (value: string) => void;
  creditorMiddleName?: string;
  setCreditorMiddleName?: (value: string) => void;
  creditorLastName?: string;
  setCreditorLastName?: (value: string) => void;
  creditorPhone?: string;
  setCreditorPhone?: (value: string) => void;
  creditorAddress?: string;
  setCreditorAddress?: (value: string) => void;
  customers?: { id: number; name: string; phone?: string | null; address?: string | null }[];
}
