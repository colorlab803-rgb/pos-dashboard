import { Component, OnInit, inject } from '@angular/core';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { PosService, Product } from '../../services/pos';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: false,
})
export class InventoryPage implements OnInit {
  private pos = inject(PosService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);

  products: Product[] = [];
  filtered: Product[] = [];
  searchTerm = '';
  lowStockThreshold = 10;
  lowStockCount = 0;
  categoryCount = 0;
  loading = true;

  async ngOnInit() {
    const config = await this.pos.getConfig();
    this.lowStockThreshold = config.low_stock_threshold;
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      this.products = await this.pos.getProducts();
      this.filtered = [...this.products];
      this.lowStockCount = this.products.filter(p => p.stock < this.lowStockThreshold).length;
      this.categoryCount = new Set(this.products.map(p => p.category)).size;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  filter() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.products.filter(p =>
      p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
  }

  getCatIcon(cat: string): string {
    const m: Record<string, string> = {
      'Bebidas': 'cafe-outline', 'Comida': 'fast-food-outline', 'Postres': 'ice-cream-outline',
    };
    return m[cat] || 'pricetag-outline';
  }

  isLowStock(stock: number): boolean { return stock < this.lowStockThreshold; }
  getStockPct(stock: number): number { return Math.min(100, stock); }

  async openAddProduct() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo Producto',
      inputs: [
        { name: 'name',     type: 'text',   placeholder: 'Nombre *' },
        { name: 'sku',      type: 'text',   placeholder: 'SKU *' },
        { name: 'price',    type: 'number', placeholder: 'Precio *' },
        { name: 'category', type: 'text',   placeholder: 'Categoría *' },
        { name: 'stock',    type: 'number', placeholder: 'Stock inicial' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (!data.name || !data.sku || !data.price || !data.category) return false;
            try {
              await this.pos.createProduct({
                name: data.name,
                sku: data.sku,
                price: parseFloat(data.price),
                category: data.category,
                stock: parseInt(data.stock || '0'),
              });
              await this.load();
              this.showToast('Producto agregado');
            } catch (e: any) {
              this.showToast(e?.error?.detail || 'Error al crear producto', 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async editProduct(p: Product) {
    const alert = await this.alertCtrl.create({
      header: `Editar: ${p.name}`,
      inputs: [
        { name: 'price', type: 'number', placeholder: 'Precio', value: p.price },
        { name: 'stock', type: 'number', placeholder: 'Stock',  value: p.stock },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            try {
              await this.pos.updateProduct(p.id, {
                price: parseFloat(data.price),
                stock: parseInt(data.stock),
              });
              await this.load();
              this.showToast('Producto actualizado');
            } catch (e) {
              this.showToast('Error al actualizar', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2000, color, position: 'top' });
    await t.present();
  }
}
