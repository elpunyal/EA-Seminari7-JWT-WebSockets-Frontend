import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../models';

// Nombre con el que guardo el usuario en localStorage
const USER_KEY = 'user';

// Al arrancar la app, recupero el usuario que dejó guardado el último login
function readStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    // Si alguien ha tocado el valor a mano y no es JSON, es como no tener sesión
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private baseUrl = `${environment.apiUrl}/auth`;

  // L'access token es guarda NOMÉS en memòria (no a localStorage ni a cap cookie).
  // Quan es recarrega la pàgina, es recupera fent /auth/refresh.
  private accessToken = signal<string | null>(null);

  // El usuario se guarda en localStorage solo para saber el nombre y rol sin volver a hacer login
  private currentUser = signal<User | null>(readStoredUser());
  readonly user = this.currentUser.asReadonly();

  // computed: se recalculan solos cada vez que cambia el usuario
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  /** POST /auth/register. No inicia sesión: la API no devuelve token y hay que hacer login */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, data);
  }

  /** POST /auth/login.
   * Guarda l'access token en memòria i l'usuari a localStorage.
   * El refresh token el gestiona el servidor via cookie HttpOnly (withCredentials: true).
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, credentials, {
        // withCredentials: true fa que el navegador accepti i enviï la cookie HttpOnly
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          // Guardem l'access token en memòria (no a localStorage)
          this.accessToken.set(response.token);
          // Guardem l'usuari a localStorage per mostrar-lo sense tornar a fer login
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          this.currentUser.set(response.user);
        }),
      );
  }

  /** POST /auth/refresh.
   * El navegador envia automàticament la cookie HttpOnly amb withCredentials.
   * El servidor llegeix el refresh token de la cookie i retorna un access token nou.
   */
  refresh(): Observable<string> {
    return this.http
      .post<RefreshResponse>(
        `${this.baseUrl}/refresh`,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap((response) => {
          // Actualitzem l'access token en memòria amb el nou
          this.accessToken.set(response.token);
        }),
        map((response) => response.token),
      );
  }

  /** POST /auth/logout.
   * El servidor esborra la cookie del refresh token.
   * Nosaltres esborrerem l'access token de memòria i l'usuari de localStorage.
   */
  logout(): void {
    // Demanem al servidor que esborri la cookie (withCredentials perquè l'enviï)
    this.http
      .post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} }); // ignorar errors de xarxa al tancar sessió

    // Netegem l'estat local
    this.accessToken.set(null);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /** L'access token en memòria. L'usa l'interceptor per afegir la capçalera Authorization. */
  getToken(): string | null {
    return this.accessToken();
  }
}
