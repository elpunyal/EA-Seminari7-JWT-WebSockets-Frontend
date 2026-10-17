import { Injectable, inject, signal } from '@angular/core';
import { io, type Socket } from 'socket.io-client';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Missatge d'error del backend si el token no és vàlid
const AUTH_ERROR = 'Authentication error';

@Injectable({ providedIn: 'root' })
export class ComptadorUsuarisService {
  private readonly authService = inject(AuthService);

  // Socket connectat al namespace /comptador del backend
  private socket: Socket | null = null;

  // Evitem fer més d'un reintent de connexió si el token ha caducat
  private retriedWithNewToken = false;

  // Signal que guarda quants usuaris estan connectats al canal en temps real.
  // Els components que l'injectin es renderitzaran automàticament quan canviï.
  readonly usersCount = signal<number>(0);

  connect(): void {
    // Si ja hi ha un socket no creem un altre
    if (this.socket) return;

    // Connectem al namespace del comptador d'usuaris (separat del chat)
    this.socket = io(`${environment.socketUrl}/comptador`, {
      autoConnect: false,
      // Igual que al chat: enviem el token al handshake perquè el servidor ens identifiqui
      auth: (send) => send({ token: this.authService.getToken() }),
    });

    this.socket.on('connect', () => {
      this.retriedWithNewToken = false;
    });

    this.socket.on('connect_error', (error) => {
      // Si el token ha caducat el renovem i tornem a connectar (una sola vegada)
      if (error.message === AUTH_ERROR && !this.retriedWithNewToken) {
        this.retriedWithNewToken = true;
        this.authService.refresh().subscribe({
          next: () => this.socket?.connect(),
          error: () => this.authService.logout(),
        });
        return;
      }
    });

    // Rebem el nombre d'usuaris connectats i actualitzem la signal
    // El backend emet 'users:count' cada vegada que algú es connecta o desconnecta
    this.socket.on('users:count', (count: number) => {
      this.usersCount.set(count);
    });

    this.socket.connect();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    // Resetem el comptador quan ens desconnectem
    this.usersCount.set(0);
  }
}
