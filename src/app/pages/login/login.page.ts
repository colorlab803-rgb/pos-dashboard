import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  username = '';
  password = '';
  fullName = '';
  isRegister = false;

  async onSubmit() {
    if (!this.username || !this.password) return;
    if (this.isRegister && !this.fullName) return;

    const loading = await this.loadingCtrl.create({ message: 'Cargando...' });
    await loading.present();

    try {
      if (this.isRegister) {
        await this.auth.register(this.username, this.fullName, this.password);
        this.showToast('Cuenta creada. Iniciando sesion...');
      }
      await this.auth.login(this.username, this.password);
      await loading.dismiss();
      this.router.navigate(['/pages/dashboard'], { replaceUrl: true });
    } catch (e: any) {
      await loading.dismiss();
      const msg = e?.error?.detail || 'Error al iniciar sesion';
      this.showToast(msg, 'danger');
    }
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    await t.present();
  }
}
