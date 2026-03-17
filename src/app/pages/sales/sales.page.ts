import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';
import { PosService, Product, CartItem } from '../../services/pos';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.page.html',
  styleUrls: ['./sales.page.scss'],
  standalone: false,
})
export class SalesPage implements OnInit, OnDestroy {
  private pos = inject(PosService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  searchTerm = '';
  selectedCategory = 'Todos';
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = ['Todos'];
  paymentMethods: string[] = [];
  cashierName = '';
  lowStockThreshold = 10;
  cartItems: CartItem[] = [];
  cartTotal = 0;
  cartCount = 0;
  cartExpanded = true;
  loading = true;
  private cartSub!: Subscription;

  async ngOnInit() {
    this.cartSub = this.pos.cart$.subscribe(items => {
      this.cartItems = items;
      this.cartCount = items.reduce((s, i) => s + i.quantity, 0);
      this.cartTotal = this.pos.getCartTotal();
    });
    const [config, session] = await Promise.all([
      this.pos.getConfig(),
      this.pos.getSession(),
    ]);
    this.paymentMethods = config.payment_methods;
    this.lowStockThreshold = config.low_stock_threshold;
    this.cashierName = session.cashier_name;
    await this.loadProducts();
  }

  ngOnDestroy() { this.cartSub.unsubscribe(); }

  async loadProducts() {
    this.loading = true;
    try {
      this.allProducts = await this.pos.getProducts();
      const cats = [...new Set(this.allProducts.map(p => p.category))].sort();
      this.categories = ['Todos', ...cats];
      this.filterProducts();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.allProducts.filter(p => {
      const matchCat  = this.selectedCategory === 'Todos' || p.category === this.selectedCategory;
      const matchName = !term || p.name.toLowerCase().includes(term);
      return matchCat && matchName;
    });
  }

  addToCart(product: Product) {
    if (product.stock < 1) return;
    this.pos.addToCart(product);
    this.showToast(`${product.name} agregado`);
  }

  updateQty(productId: number, qty: number) { this.pos.updateQuantity(productId, qty); }
  clearCart() { this.pos.clearCart(); this.cartExpanded = false; }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Bebidas': 'cafe-outline',
      'Comida': 'fast-food-outline',
      'Postres': 'ice-cream-outline',
    };
    return icons[category] ?? 'pricetag-outline';
  }

  isLowStock(stock: number): boolean {
    return stock < this.lowStockThreshold;
  }

  async openPayment() {
    const buttons = [
      ...this.paymentMethods.map(method => ({
        text: method,
        handler: () => this.processPayment(method),
      })),
      { text: 'Cancelar', role: 'cancel' },
    ];
    const alert = await this.alertCtrl.create({
      header: `Cobrar $${this.cartTotal.toFixed(0)}`,
      message: 'Selecciona el método de pago',
      buttons,
    });
    await alert.present();
  }

  async processPayment(method: string) {
    const loading = await this.loadingCtrl.create({ message: 'Procesando…' });
    await loading.present();
    try {
      await this.pos.createSale({
        cashier: this.cashierName,
        payment_method: method,
        items: this.cartItems.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      });
      const total = this.cartTotal;
      this.pos.clearCart();
      this.cartExpanded = false;
      await this.loadProducts();
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: `Venta $${total.toFixed(0)} registrada — ${method}`,
        duration: 3000, color: 'success', position: 'top', icon: 'checkmark-circle-outline',
      });
      await toast.present();
    } catch (e: any) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: e?.error?.detail || 'Error al procesar la venta',
        duration: 4000, color: 'danger', position: 'top',
      });
      await toast.present();
    }
  }

  private async showToast(msg: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 700, position: 'top', color: 'dark' });
    await toast.present();
  }
}
