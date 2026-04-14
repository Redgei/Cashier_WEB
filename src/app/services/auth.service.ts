import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { BehaviorSubject, throwError } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  public isLoading = signal(false);
  public error = signal<string | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string) {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('token', response.access_token);
        this.currentUserSubject.next(response.user);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard/payments']);
      }),
      catchError(error => {
        this.isLoading.set(false);
        this.error.set(this.getErrorMessage(error, 'Login failed'));
        return throwError(() => error);
      })
    );
  }

  register(name: string, email: string, password: string) {
    this.isLoading.set(true);
    this.error.set(null);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      name,
      email,
      password,
    }).pipe(
      tap(() => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.isLoading.set(false);
        this.error.set(this.getErrorMessage(error, 'Registration failed'));
        return throwError(() => error);
      })
    );
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clearError() {
    this.error.set(null);
  }

  private getErrorMessage(error: any, fallback: string): string {
    const validationErrors = error?.error?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
      const firstFieldError = Object.values(validationErrors).flat()[0];
      if (typeof firstFieldError === 'string') {
        return firstFieldError;
      }
    }

    return error?.error?.message || fallback;
  }
}
