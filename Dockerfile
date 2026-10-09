# Landing estática de Atlas: nginx sirve el árbol tal cual (sin build).
# Rama estable actual de nginx (1.30), fijada por digest del índice multiarquitectura (LND-08):
# la rama 1.27 ya no recibe parches. Para actualizar: subir la etiqueta y poner el digest nuevo.
FROM nginx:1.30-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed43071545afa9d2e27d94
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY index.html login.html registro.html favicon.ico /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://127.0.0.1/healthz || exit 1
