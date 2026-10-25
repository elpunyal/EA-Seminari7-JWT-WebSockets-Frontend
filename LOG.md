# LOG
Aquest document és la bitàcola del projecte: serveix per registrar el que s'ha fet i quins prompts d'IA s'han fet servir per fer-ho.

## Eines i models d'IA utilitzats
- **Google Gemini**: Model Gemini 3.6 Flash.
- **Copilot de VS Code**: Utilitzat per generar els comentaris necessaris al codi.

## Registre d'usos de la IA

### Ús 1
**Prompt literal:**
"Com puc configurar Express perquè enviï el refresh token dins d'una cookie HttpOnly segura en comptes de retornar-lo al JSON?"

**Resposta de la IA:** Va donar un exemple configurant `res.cookie('refreshToken', token, { httpOnly: true, sameSite: 'strict', path: '/auth', maxAge: 7 * 24 * 60 * 60 * 1000 })` abans de retornar l'access token i l'usuari al JSON.

**Incoherències detectades:** Cap incoherència detectada. La resposta era correcta i donava la sintaxi vàlida per configurar la cookie HttpOnly a Express.

**Solució/adaptació manual:** Vam adaptar el codi a `src/controllers/Auth.ts` creant la funció `parseDurationMs()` per sincronitzar el `maxAge` amb el `.env`, vam afegir `secure: process.env.NODE_ENV === 'production'` i vam definir `cookieOptions` amb `sameSite: 'strict' as const`.

---

### Ús 2
**Prompt literal:**
"Per què req.cookies surt undefined a Express quan intento llegir la cookie de refresh token?"

**Resposta de la IA:** Va dir que Express no parseja cookies sol i que calia instal·lar `cookie-parser` i afegir `app.use(cookieParser())`.

**Incoherències detectades:** No va avisar que a TypeScript cal instal·lar també `@types/cookie-parser` (donava error `TS7016`), ni va recordar que el middleware s'ha de registrar abans de les rutes perquè `req.cookies` estigui disponible al controlador.

**Solució/adaptació manual:** Vam instal·lar `cookie-parser` i `@types/cookie-parser`, i vam posar `router.use(cookieParser())` a `server.ts` just abans de declarar les rutes.

---

### Ús 3
**Prompt literal:**
"Com puc esborrar una cookie HttpOnly des del backend d'Express quan l'usuari fa logout?"

**Resposta de la IA:** Va suggerir cridar `res.clearCookie('refreshToken')` dins de la ruta de logout.

**Incoherències detectades:** No va tenir en compte que si la cookie s'ha creat amb `path: '/auth'`, cal passar aquest mateix `path` a `res.clearCookie()`. Com que Express per defecte posa `path: '/'`, el navegador no troba la cookie a l'arrel i no l'esborra de `/auth`, deixant la sessió oberta.

**Solució/adaptació manual:** Vam passar `{ path: '/auth', sameSite: 'strict', httpOnly: true }` a `res.clearCookie()` a `Auth.ts` perquè s'esborri de veritat.

---

### Ús 4
**Prompt literal:**
"Què cal configurar a CORS a Express perquè el navegador permeti rebre i enviar cookies des d'Angular?"

**Resposta de la IA:** Va explicar que s'ha d'activar l'opció `credentials: true` a la configuració del middleware CORS.

**Incoherències detectades:** Va proposar `credentials: true` mantenint el comodí `origin: '*'`. El navegador bloqueja directament les peticions amb credencials si l'origen és `*`; és obligatori posar la URL exacta del client.

**Solució/adaptació manual:** Vam configurar `src/middleware/Cors.ts` amb `origin: config.cors.origin` (l'origen del frontend del `.env`), `credentials: true`, i vam aprofitar per declarar els mètodes i capçaleres permeses.

---

### Ús 5
**Prompt literal:**
"Com puc guardar l'access token només en memòria a Angular amb Signals en lloc d'utilitzar localStorage?"

**Resposta de la IA:** Va ensenyar com crear una signal mutable al servei d'autenticació per guardar el token en fer login i anar-lo actualitzant.

**Incoherències detectades:** No va preveure que en recarregar la pàgina (F5) la memòria es neteja i el token torna a ser `null` sense cap mecanisme de *silent refresh* amb la cookie per recuperar la sessió. A més, deixava la signal pública i mutable trencant l'encapsulació, i no separava les dades d'usuari per saber el rol o el nom abans de renovar el token.

**Solució/adaptació manual:** Vam deixar la signal de l'access token privada, vam guardar les dades de l'usuari a `localStorage` exposades amb `asReadonly()` i `computed`, i vam vincular el refresc automàtic a l'interceptor amb el mètode `refresh()`.

---

### Ús 6
**Prompt literal:**
"Com configuro un HttpInterceptor a Angular per afegir withCredentials només a les peticions d'autenticació?"

**Resposta de la IA:** Va donar un interceptor que feia servir `request.url.includes('auth')` per afegir `request.clone({ withCredentials: true })`.

**Incoherències detectades:** Usar `includes('auth')` també coincidia amb `/authors`, traient-li el token Bearer i trencant el CRUD d'autors amb errors 401. A més, si la petició a `/auth/refresh` fallava amb 401, podia generar un bucle infinit de refrescos si no s'excloïen les rutes d'auth del reintent.

**Solució/adaptació manual:** Vam canviar la comprovació a `request.url.startsWith('${environment.apiUrl}/auth/')` per no tocar `/authors`, fent que les rutes d'auth surtin directament sense passar pel bloc de reintent per evitar bucles.

---

### Ús 7
**Prompt literal:**
"Com puc implementar un comptador d'usuaris connectats en temps real amb Socket.IO en un namespace independent?"

**Resposta de la IA:** Va explicar com crear el namespace `/comptador` i usar `nsp.sockets.size` per emetre `users:count` a la connexió i desconnexió.

**Incoherències detectades:** `nsp.sockets.size` compta connexions obertes i no usuaris reals (dues pestanyes del mateix usuari sumen dos). A més, no va posar cap middleware JWT per autenticar el socket i va oblidar configurar el CORS al servidor de Socket.IO.

**Solució/adaptació manual:** Vam crear `ComptadorUsuaris.ts` afegint el middleware `VerifySocketToken`, vam configurar el CORS amb l'origen del frontend i vam emetre `users:count` en connectar i desconnectar.

---

### Ús 8
**Prompt literal:**
"Com puc connectar un component d'Angular al comptador de Socket.IO i mostrar el valor actualitzat a la plantilla?"

**Resposta de la IA:** Va mostrar com crear un servei amb una signal `usersCount` connectada al socket per injectar-la directament al component.

**Incoherències detectades:** No comprovava si ja hi havia un socket obert (`if (this.socket) return;`), duplicant connexions si es tornava a carregar el component. Tampoc enviava el token JWT al handshake (`auth`) i no gestionava `connect_error` (Socket.IO no es reconnecta sol si el rebutja un middleware, cal cridar `connect()` a mà).

**Solució/adaptació manual:** Vam configurar el handshake amb el token a `comptador-usuaris.service.ts`, vam escoltar `connect_error` per renovar el token i cridar `this.socket?.connect()`, i vam afegir el mètode `disconnect()` per tancar la connexió netament.
