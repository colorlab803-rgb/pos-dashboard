import { Component, OnInit, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { PosService, Customer } from '../../services/pos';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
  standalone: false,
})
export class CustomersPage implements OnInit {
  private pos = inject(PosService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  customers: Customer[] = [];
  filtered: Customer[] = [];
  searchTerm = '';
  avgPurchase = 0;
  loading = true;

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading = true;
    try {
      this.customers = await this.pos.getCustomers();
      this.filtered = [...this.customers];
      this.avgPurchase = this.customers.length
        ? this.customers.reduce((s, c) => s + c.total_purchases, 0) / this.customers.length
        : 0;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  filter() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.customers.filter(c =>
      c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
    );
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  isToday(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr).toDateString() === new Date().toDateString();
  }

  async openAddCustomer() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo Cliente',
      inputs: [
        { name: 'name',  type: 'text',  placeholder: 'Nombre completo *' },
        { name: 'email', type: 'email', placeholder: 'Email (opcional)' },
        { name: 'phone', type: 'tel',   placeholder: 'Teléfono' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (!data.name) return false;
            try {
              await this.pos.createCustomer({ name: data.name, email: data.email || undefined, phone: data.phone });
              await this.load();
              this.showToast('Cliente agregado');
            } catch (e: any) {
              this.showToast(e?.error?.detail || 'Error al crear cliente', 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
