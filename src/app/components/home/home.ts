import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ComptadorUsuarisService } from '../../services/comptador-usuaris.service';

// Página de inicio para cualquier usuario con sesión.
// Todos ven el acceso al chat; un admin ve además los accesos al backoffice.
// Aquí també connectem al canal del comptador d'usuaris en temps real (WebSocket).
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home implements OnInit, OnDestroy {
  auth = inject(AuthService);
  comptador = inject(ComptadorUsuarisService);

  // usersCount és una signal del servei: Angular l'actualitza automàticament a la plantilla
  // quan el backend emet un nou valor per 'users:count'
  usersCount = this.comptador.usersCount;

  ngOnInit(): void {
    // Connectem al canal quan s'obre la pàgina
    this.comptador.connect();
  }

  ngOnDestroy(): void {
    // Desconnectem quan es tanca la pàgina per alliberar recursos
    this.comptador.disconnect();
  }
}
