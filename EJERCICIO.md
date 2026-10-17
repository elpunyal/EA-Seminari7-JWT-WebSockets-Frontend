EXERCICI SEMINARI 7 

Exercici: guardar els tokens de manera segura
Context JWT:
L'aplicació ja té autenticació amb JWT. En fer login, l'API retorna dins del JSON un access
token (15 minuts) i un refresh token (7 dies), i el frontend Angular els guarda tots dos a
`localStorage`. És el patró més habitual, però no el més segur: qualsevol script injectat a la
pàgina (XSS) pot llegir `localStorage` i emportar-se els tokens, inclòs el refresh token, que
permet aconseguir access tokens nous durant dies.
Context Websocket:
L’Aplicació ja té ús de socket.io. Però només pel xat.
Objectiu JWT
Aplicar el patró recomanat: l'access token només en memòria i el refresh token en una
cookie HttpOnly, que JavaScript no pot llegir.
POST /auth/login retorna { token, user } i posa el refresh token en una cookie
POST /auth/refresh llegeix el refresh token de la cookie i retorna { token }
POST /auth/logout esborra la cookie
Objectiu websocket
Afegir altres events a socket.io que no siguin un xat.
Requisits
1. La cookie és HttpOnly i SameSite=Strict, només s'envia a les rutes `/auth` i dura el
mateix que el refresh token; en producció, a més, és Secure. El refresh token ja no
apareix al JSON de cap resposta.
2. `/auth/refresh` respon 401 si no hi ha cookie o si no és vàlida. Després de fer logout,