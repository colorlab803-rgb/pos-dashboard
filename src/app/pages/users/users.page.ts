import { Component, OnInit, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService, UserInfo } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: false,
})
export class UsersPage implements OnInit {
  private auth = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  users: UserInfo[] = [];
  loading = true;

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    try {
      this.users = await this.auth.getUsers();
    } catch (e) {
      console.error(e);
      this.showToast('Error al obtener usuarios', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async openAddUser() {
    const alert = await this.alertCtrl.create({
      header: 'Nuevo Usuario',
      inputs: [
        { name: 'full_name', type: 'text', placeholder: 'Nombre completo *' },
        { name: 'username', type: 'text', placeholder: 'Usuario *' },
        { name: 'password', type: 'password', placeholder: 'Contraseña (mínimo 6) *' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Continuar',
          handler: async (data) => {
            if (!data.full_name || !data.username || !data.password || data.password.length < 6) {
              this.showToast('Datos inválidos. La contraseña debe tener mínimo 6 caracteres', 'warning');
              return false;
            }
            // Ask for role
            return this.selectNewUserRole(data);
          },
        },
      ],
    });
    await alert.present();
  }

  private async selectNewUserRole(data: any) {
    const roleAlert = await this.alertCtrl.create({
      header: 'Selecciona el rol',
      inputs: [
        { name: 'role', type: 'radio', value: 'admin', label: 'Administrador' },
        { name: 'role', type: 'radio', value: 'cashier', label: 'Cajero', checked: true },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (roleData) => {
            if (!roleData) return false;
            try {
              await this.auth.createUser({
                username: data.username,
                full_name: data.full_name,
                password: data.password,
                role: roleData
              });
              await this.loadUsers();
              this.showToast('Usuario creado');
            } catch (e: any) {
              this.showToast(e?.error?.detail || 'Error al crear usuario', 'danger');
            }
            return true;
          }
        }
      ]
    });
    await roleAlert.present();
    return true;
  }

  async editUser(user: UserInfo) {
    const alert = await this.alertCtrl.create({
      header: 'Editar ' + user.username,
      inputs: [
        { name: 'full_name', type: 'text', value: user.full_name, placeholder: 'Nombre completo' },
        { name: 'password', type: 'password', placeholder: 'Nueva contraseña (opcional)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: async (data) => {
            return this.selectEditRole(user.id, data, user);
          }
        }
      ]
    });
    await alert.present();
  }

  private async selectEditRole(id: number, data: any, user: UserInfo) {
    const roleAlert = await this.alertCtrl.create({
      header: 'Opciones de Cuenta',
      inputs: [
        { name: 'role', type: 'radio', value: 'admin', label: 'Administrador', checked: user.role === 'admin' },
        { name: 'role', type: 'radio', value: 'cashier', label: 'Cajero', checked: user.role === 'cashier' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (roleData) => {
            const updatePayload: any = { role: roleData };
            if (data.full_name) updatePayload.full_name = data.full_name;
            if (data.password) updatePayload.password = data.password;

            try {
              await this.auth.updateUser(id, updatePayload);
              await this.loadUsers();
              this.showToast('Usuario actualizado');
            } catch (e: any) {
              this.showToast(e?.error?.detail || 'Error al actualizar', 'danger');
            }
            return true;
          }
        }
      ]
    });
    await roleAlert.present();
    return true;
  }

  async toggleStatus(user: UserInfo) {
    try {
      await this.auth.updateUser(user.id, { is_active: !user.is_active });
      await this.loadUsers();
      this.showToast(user.is_active ? 'Usuario desactivado' : 'Usuario activado');
    } catch (e: any) {
      this.showToast(e?.error?.detail || 'Error al cambiar estado', 'danger');
    }
  }

  async deleteUser(user: UserInfo) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar a ${user.username}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.auth.deleteUser(user.id);
              await this.loadUsers();
              this.showToast('Usuario eliminado');
            } catch (e: any) {
              this.showToast(e?.error?.detail || 'Error al eliminar', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  private async showToast(msg: string, color = 'success') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color, position: 'top' });
    await t.present();
  }
}
