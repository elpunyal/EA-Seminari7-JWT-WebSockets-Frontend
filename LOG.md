# LOG
Aquest document és la bitàcola del projecte: serveix per registrar el que s'ha fet i quins prompts d'IA s'han fet servir per fer-ho.

## Eines i models d'IA utilitzats
- **Google Gemini**: Model Gemini 3.6 Flash.
- **Copilot de VS Code**: Utilitzat per generar els comentaris necessaris al codi.

## Registre d'usos de la IA

### Ús 1
**Prompt literal:**
"Com puc configurar Express perquè enviï el refresh token dins d'una cookie HttpOnly segura en comptes de retornar-lo al JSON?"

**Resposta de la IA:** Va explicar com utilitzar `res.cookie('refreshToken', token, { httpOnly: true, sameSite: 'strict', path: '/auth', maxAge: 7 * 24 * 60 * 60 * 1000 })` abans de retornar l'access token i l'usuari en el cos de la resposta.

**Incoherències detectades:** Cap incoherència.

**Solució/adaptació manual:** Es va adaptar al controlador `Auth.ts` creant una constant d'opcions (`cookieOptions`) i retornant exclusivament `{ token, user }` a la resposta JSON.

---

### Ús 2
**Prompt literal:**
"Per què req.cookies surt undefined a Express quan intento llegir la cookie de refresh token?"

**Resposta de la IA:** Va indicar que Express no parseja cookies de manera nativa i que cal instal·lar la llibreria `cookie-parser` i registrar-la com a middleware global amb `app.use(cookieParser())`.

**Incoherències detectades:** Cap incoherència.

**Solució/adaptació manual:** Es va instal·lar `cookie-parser` juntament amb `@types/cookie-parser` i es va afegir `router.use(cookieParser())` a `server.ts` abans de les rutes.

---

### Ús 3
**Prompt literal:**
"Com puc esborrar una cookie HttpOnly des del backend d'Express quan l'usuari fa logout?"

**Resposta de la IA:** Va suggerir fer una crida senzilla a `res.clearCookie('refreshToken')` dins del controlador de la ruta de logout.

**Incoherències detectades:** La IA no va tenir en compte que si la cookie s'havia definit amb una ruta específica (`path: '/auth'`) i amb l'atribut `sameSite: 'strict'`, cal passar exactament les mateixes opcions a `res.clearCookie()`; si no es passen, el navegador ignora la petició d'esborrat i la cookie es manté activa.

**Solució/adaptació manual:** Es va configurar `res.clearCookie(REFRESH_COOKIE, { path: '/auth', sameSite: 'strict', httpOnly: true })` assegurant que el navegador l'elimina correctament en tancar sessió.

---

### Ús 4
**Prompt literal:**
"Què cal configurar a CORS a Express perquè el navegador permeti rebre i enviar cookies des d'Angular?"

**Resposta de la IA:** Va explicar que s'ha d'activar l'opció `credentials: true` a la configuració del middleware CORS perquè retorni la capçalera `Access-Control-Allow-Credentials: true`.

**Incoherències detectades:** Cap incoherència.

**Solució/adaptació manual:** Es va actualitzar el middleware a `src/middleware/Cors.ts` afegint `credentials: true`.

---

### Ús 5
**Prompt literal:**
"Com puc guardar l'access token només en memòria a Angular amb Signals en lloc d'utilitzar localStorage?"

**Resposta de la IA:** Va mostrar com crear una `signal<string | null>(null)` privada dins del servei d'autenticació i exposar mètodes per obtenir el valor actual i actualitzar-lo quan es fa login o refresh.

**Incoherències detectades:** Cap incoherència.

**Solució/adaptació manual:** Es va reescriure `auth.service.ts` eliminant la persistència de l'access token a `localStorage` i substituint-la per la signal reactiva en memòria.

---

### Ús 6
**Prompt literal:**
"Com configuro un HttpInterceptor a Angular per afegir withCredentials només a les peticions d'autenticació?"

**Resposta de la IA:** Va proporcionar el codi d'un interceptor funcional utilitzant `request.clone({ withCredentials: true })` per a les rutes que continguin `/auth`.

**Incoherències detectades:** Cap incoherència.

**Solució/adaptació manual:** Es va adaptar `auth.interceptor.ts` clonant la petició amb `withCredentials: true` en les rutes d'autenticació, garantint que el navegador enviï i rebi la cookie del refresh token automàticament.

---

### Ús 7
**Prompt literal:**
"Com puc implementar un comptador d'usuaris connectats en temps real amb Socket.IO en un namespace independent?"

**Resposta de la IA:** Va explicar com definir el namespace `/comptador` i fer servir `nsp.sockets.size` per emetre l'esdeveniment `users:count` a tots els clients tant a l'esdeveniment `connection` com a `disconnect`.

**Incoherències detectades:** Cap incoherència.

**Solució/adaptació manual:** Es va crear el fitxer `ComptadorUsuaris.ts` i es va vincular al servidor HTTP a `server.ts`.

---

### Ús 8
**Prompt literal:**
"Com puc connectar un component d'Angular al comptador de Socket.IO i mostrar el valor actualitzat a la plantilla?"

**Resposta de la IA:** Va mostrar la creació d'un servei amb una signal `usersCount = signal<number>(0)` que escolta l'esdeveniment del socket i com injectar-lo al component per mostrar-lo directament al template HTML.

**Incoherències detectades:** Cap incoherència.

**Solució/adaptació manual:** Es va crear `comptador-usuaris.service.ts` i es va afegir al component `home` connectant i desconnectant en els cicles de vida `ngOnInit` i `ngOnDestroy`.
