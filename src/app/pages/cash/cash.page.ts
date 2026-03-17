import { Component, OnInit, inject } from '@angular/core';
import { PosService, CashSession } from '../../services/pos';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-cash',
  templateUrl: './cash.page.html',
  styleUrls: ['./cash.page.scss'],
})
export class CashPage implements OnInit {
  private posService = inject(PosService);
  private toastCtrl = inject(ToastController);

  currentSession: CashSession | null = null;
  loading = true;

  // Forms
  initialBalance = 0;
  openNotes = '';

  finalBalance = 0;
  closeNotes = '';

  ngOnInit() {
    this.loadSession();
  }

  ionViewWillEnter() {
    this.loadSession();
  }

  async loadSession() {
    this.loading = true;
    try {
      const res = await this.posService.getCashSession();
      if ('id' in res) {
        this.currentSession = res;
      } else {
        this.currentSession = null;
      }
    } catch (error) {
      console.error('Error fetching cash session:', error);
      this.currentSession = null;
    } finally {
      this.loading = false;
    }
  }

  async openSession() {
    if (this.initialBalance < 0) {
      this.showToast('El saldo inicial no puede ser negativo', 'warning');
      return;
    }
    
    this.loading = true;
    try {
      await this.posService.openCashSession({
        initial_balance: this.initialBalance,
        notes: this.openNotes
      });
      this.showToast('Caja abierta exitosamente', 'success');
      this.initialBalance = 0;
      this.openNotes = '';
      await this.loadSession();
    } catch (e: any) {
      this.showToast(e.error?.detail || 'Error al abrir la caja', 'danger');
      this.loading = false;
    }
  }

  async closeSession() {
    if (this.finalBalance < 0) {
      this.showToast('El saldo final no puede ser negativo', 'warning');
      return;
    }

    this.loading = true;
    try {
      await this.posService.closeCashSession({
        final_balance: this.finalBalance,
        notes: this.closeNotes
      });
      this.showToast('Caja cerrada con éxito. Revisa el reporte para ver diferencias.', 'success');
      this.finalBalance = 0;
      this.closeNotes = '';
      await this.loadSession();
    } catch (e: any) {
      this.showToast(e.error?.detail || 'Error al cerrar la caja', 'danger');
      this.loading = false;
    }
  }

  async showToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 3000,
      color
    });
    t.present();
  }
}
