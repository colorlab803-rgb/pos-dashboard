import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private router = inject(Router);


  canActivate(): boolean {
    const token = localStorage.getItem('pos_token');
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
