import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: number;
  ticket_id: string;
  cashier: string;
  payment_method: string;
  total: number;
  customer_id: number | null;
  created_at: string;
  items: SaleItemOut[];
}

export interface SaleItemOut {
  product_id: number;
  quantity: number;
  unit_price: number;
  product_name: string;
}

export interface SaleCreate {
  cashier: string;
  payment_method: string;
  customer_id?: number | null;
  items: { product_id: number; quantity: number }[];
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  total_purchases: number;
  last_visit?: string;
}

export interface DailyStats {
  today_sales: number;
  today_tickets: number;
  avg_ticket: number;
  week_sales: number;
  month_sales: number;
  new_customers: number;
}

export interface WeeklyPoint {
  day: string;
  total: number;
}

export interface TopProduct {
  product_id: number;
  name: string;
  sold: number;
  revenue: number;
}

export interface CategoryStat {
  category: string;
  amount: number;
  percentage: number;
}

export interface PaymentMethodStat {
  method: string;
  amount: number;
  percentage: number;
}

export interface BusinessConfig {
  payment_methods: string[];
  low_stock_threshold: number;
  currency_symbol: string;
  business_name: string;
}

export interface SessionInfo {
  cashier_name: string;
  cashier_initials: string;
  role: string;
  shift_start: string;
  shift_end: string;
}

export interface CashSession {
  id: number;
  opened_by: number;
  closed_by: number | null;
  opened_at: string;
  closed_at: string | null;
  initial_balance: number;
  final_balance: number | null;
  system_balance: number | null;
  difference: number | null;
  notes: string | null;
  is_open: boolean;
}

export interface CashSessionIn {
  initial_balance: number;
  notes?: string;
}

export interface CashCutIn {
  final_balance: number;
  notes?: string;
}

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PosService {
  private http = inject(HttpClient);

  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartItems.asObservable();

  // -- Products --
  getProducts()                        { return firstValueFrom(this.http.get<Product[]>(`${API}/products/`)); }
  createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    return firstValueFrom(this.http.post<Product>(`${API}/products/`, data));
  }
  updateProduct(id: number, data: Partial<Product>) {
    return firstValueFrom(this.http.put<Product>(`${API}/products/${id}`, data));
  }
  deleteProduct(id: number)             { return firstValueFrom(this.http.delete(`${API}/products/${id}`)); }

  // -- Customers --
  getCustomers()                        { return firstValueFrom(this.http.get<Customer[]>(`${API}/customers/`)); }
  createCustomer(data: { name: string; email?: string; phone?: string }) {
    return firstValueFrom(this.http.post<Customer>(`${API}/customers/`, data));
  }
  updateCustomer(id: number, data: Partial<Customer>) {
    return firstValueFrom(this.http.put<Customer>(`${API}/customers/${id}`, data));
  }
  deleteCustomer(id: number)            { return firstValueFrom(this.http.delete(`${API}/customers/${id}`)); }

  // -- Sales --
  getSales(limit = 50)                  { return firstValueFrom(this.http.get<Sale[]>(`${API}/sales/?limit=${limit}`)); }
  createSale(data: SaleCreate)          { return firstValueFrom(this.http.post<Sale>(`${API}/sales/`, data)); }

  // -- Config / Session --
  getConfig()        { return firstValueFrom(this.http.get<BusinessConfig>(`${API}/config`)); }
  getSession()       { return firstValueFrom(this.http.get<SessionInfo>(`${API}/session`)); }
  getCategories()    { return firstValueFrom(this.http.get<string[]>(`${API}/categories`)); }

  // -- Cash Register --
  getCashSession()   { return firstValueFrom(this.http.get<CashSession | {message: string}>(`${API}/cash/current`)); }
  openCashSession(data: CashSessionIn) { return firstValueFrom(this.http.post<CashSession>(`${API}/cash/open`, data)); }
  closeCashSession(data: CashCutIn)    { return firstValueFrom(this.http.post<CashSession>(`${API}/cash/close`, data)); }

  // -- Reports --
  getDailyStats()        { return firstValueFrom(this.http.get<DailyStats>(`${API}/reports/stats`)); }
  getWeeklySales()       { return firstValueFrom(this.http.get<WeeklyPoint[]>(`${API}/reports/weekly`)); }
  getMonthlySales()      { return firstValueFrom(this.http.get<WeeklyPoint[]>(`${API}/reports/monthly`)); }
  getHourlySales()       { return firstValueFrom(this.http.get<WeeklyPoint[]>(`${API}/reports/hourly`)); }
  getTopProducts()       { return firstValueFrom(this.http.get<TopProduct[]>(`${API}/reports/top-products`)); }
  getCategoryStats()     { return firstValueFrom(this.http.get<CategoryStat[]>(`${API}/reports/categories`)); }
  getPaymentMethods()    { return firstValueFrom(this.http.get<PaymentMethodStat[]>(`${API}/reports/payment-methods`)); }

  // -- Cart (local) --
  addToCart(product: Product) {
    const current = this.cartItems.getValue();
    const existing = current.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity++;
      this.cartItems.next([...current]);
    } else {
      this.cartItems.next([...current, { product, quantity: 1 }]);
    }
  }

  removeFromCart(productId: number) {
    this.cartItems.next(this.cartItems.getValue().filter(i => i.product.id !== productId));
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) { this.removeFromCart(productId); return; }
    const current = this.cartItems.getValue();
    const item = current.find(i => i.product.id === productId);
    if (item) { item.quantity = quantity; this.cartItems.next([...current]); }
  }

  clearCart() { this.cartItems.next([]); }

  getCartTotal(): number {
    return this.cartItems.getValue().reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }
}
