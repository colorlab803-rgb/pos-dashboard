import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private api = environment.apiUrl;

  async login(username: string, password: string): Promise<LoginResponse> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.api}/auth/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
    );
    localStorage.setItem('pos_token', res.access_token);
    return res;
  }

  async register(username: string, fullName: string, password: string): Promise<UserInfo> {
    return firstValueFrom(
      this.http.post<UserInfo>(`${this.api}/auth/register`, {
        username,
        full_name: fullName,
        password,
      })
    );
  }

  async getMe(): Promise<UserInfo> {
    return firstValueFrom(this.http.get<UserInfo>(`${this.api}/auth/me`));
  }

  logout() {
    localStorage.removeItem('pos_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('pos_token');
  }

  getToken(): string | null {
    return localStorage.getItem('pos_token');
  }

  async getUsers(): Promise<UserInfo[]> {
    return firstValueFrom(this.http.get<UserInfo[]>(`${this.api}/auth/users`));
  }

  async createUser(data: any): Promise<UserInfo> {
    return firstValueFrom(this.http.post<UserInfo>(`${this.api}/auth/users`, data));
  }

  async updateUser(id: number, data: any): Promise<UserInfo> {
    return firstValueFrom(this.http.put<UserInfo>(`${this.api}/auth/users/${id}`, data));
  }

  async deleteUser(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.api}/auth/users/${id}`));
  }
}
