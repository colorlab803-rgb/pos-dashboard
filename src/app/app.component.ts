import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PosService, SessionInfo, BusinessConfig } from './services/pos';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private pos = inject(PosService);
  private auth = inject(AuthService);
  private router = inject(Router);

  session: SessionInfo = {
    cashier_name: '',
    cashier_initials: '',
    role: '',
    shift_start: '',
    shift_end: '',
  };
  businessName = '';

  async ngOnInit() {
    if (!this.auth.isAuthenticated()) return;
    await this.loadSessionData();
  }

  async loadSessionData() {
    try {
      const [session, config] = await Promise.all([
        this.pos.getSession(),
        this.pos.getConfig(),
      ]);
      this.session = session;
      this.businessName = config.business_name;
    } catch (e) {
      console.error('Error cargando sesion/config', e);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
