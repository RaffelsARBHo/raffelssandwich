// types/index.ts
// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    rowCount: number;
  };
}

// ============================================
// Product Types
// ============================================

export interface Product {
  id: number | string;           // ✅ Product ID
  no: string;                     // ✅ Product Number
  name: string;                   // ✅ Product Name
  itemType: string;               // ✅ Item Type
  unitPrice: number;              // ✅ Price
  unit1Name?: string;             // ✅ Unit Name
  category?: any;
  image?: string;
  imageUrlThumb?: string;         // ✅ Thumbnail Image
  availableToSell?: number;       // ✅ Stock
  minimumSellingQuantity?: number;
}

export interface ProductDetail extends Product {
  shortName?: string;
  itemTypeName?: string;
  cost: number;
  vendorPrice: number;
  unit1: {
    id: string | null;
    name: string | null;
  };
  balance: number;
  balanceInUnit?: any;
  controlQuantity: boolean;
  minimumQuantity: number;
  itemCategory: {
    id: string | null;
    name: string | null;
  };
  percentTaxable: number;
  suspended: boolean;
  onSales: number;
  notes?: string;
  images: ProductImage[];          // ✅ Product Images Array
  sellingPrices: SellingPrice[];
  warehouses: Warehouse[];
  upcNo?: string;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  itemBrand?: any;
  preferedVendor?: any;
}

export interface ProductImage {
  id: number | string | null;      // ✅ Image ID
  fileName: string | null;         // ✅ Full Image URL
  thumbnailPath: string | null;    // ✅ Thumbnail URL
  originalName: string | null;
  seq: number;
}

export interface SellingPrice {
  price: number;
  effectiveDate: string | null;
  effectiveDateView: string | null;
  unit: {
    id: string | null;
    name: string | null;
  };
  priceCategory: {
    id: string | null;
    name: string | null;
    defaultCategory: boolean;
  };
  currency: {
    id: string | null;
    code: string | null;
    symbol: string | null;
    name: string | null;
  };
  branch: {
    id: string | null;
    name: string | null;
    defaultBranch: boolean;
  };
}

export interface Warehouse {
  id: string | null;
  name: string | null;
  warehouseName: string | null;
  balance: number;
  balanceUnit: any;
  defaultWarehouse: boolean;
  unit1Quantity: number;
}

// ============================================
// Cart Types
// ============================================

export interface CartItem {
  id: string;                      // ✅ Cart Item Unique ID (crypto.randomUUID)
  productId: number | string;       // ✅ Product ID (from product.id)
  productNo: string;                // ✅ Product Number (from product.no)
  name: string;                     // ✅ Product Name
  price: number;                    // ✅ Price (from product.unitPrice)
  quantity: number;                 // ✅ Quantity
  image?: string | null;            // ✅ Image URL (thumbnail or main)
  maxQuantity?: number;             // ✅ Max Available Stock
}

// ============================================
// Customer Types
// ============================================

export interface Customer {
  id: string | null;
  customerNo: string | null;
  name: string | null;
  email: string | null;
  mobilePhone: string | null;
  billStreet: string | null;
  billCity: string | null;
  billProvince: string | null;
  billCountry: string | null;
  billZipCode: string | null;
  shipStreet: string | null;
  shipCity: string | null;
  shipProvince: string | null;
  shipCountry: string | null;
  shipZipCode: string | null;
  shipSameAsBill: boolean;
  priceCategoryId: string | null;
  termId: string | null;
  balance: number;
}

export interface CustomerFormData {
  name: string;
  transDate: string;
  customerNo?: string;
  mobilePhone?: string;
  email?: string;
  billStreet?: string;
  billCity?: string;
  billProvince?: string;
  billCountry?: string;
  billZipCode?: string;
}

// ============================================
// Order Types
// ============================================

export interface Order {
  id: string;
  number: string;
  transDate: string;
  customer: {
    id: string;
    customerNo: string;
    name: string;
  };
  total: number;
  status: string;
  items?: OrderItem[];
}

export interface OrderDetail {
  id: string;
  number: string;
  transDate: string;
  shipDate?: string;
  status: string;
  statusName: string;
  customerId: string;
  customer: {
    id: string;
    customerNo: string;
    name: string;
    email?: string;
    mobilePhone?: string;
  };
  toAddress?: string;
  shipAddress: {
    street: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    zipCode: string | null;
  };
  items: OrderItem[];
  subTotal: number;
  totalExpense: number;
  discount: number;
  tax1Amount: number;
  tax2Amount: number;
  totalAmount: number;
  currency: {
    code: string | null;
    symbol: string | null;
  };
  paymentTerm: {
    id: string | null;
    name: string | null;
    netDays: number;
  };
  description?: string;
  poNumber?: string;
}

export interface OrderItem {
  id: string | null;
  seq: number | null;
  itemId: string | null;
  itemNo: string | null;
  itemName: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalPrice: number;
  unit?: string;
  notes?: string;
}