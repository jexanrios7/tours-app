# 🌍 Agencia de Tours - Sistema Web Profesional

Sistema web completo para gestión de una agencia de tours de viajes con panel administrativo, catálogo público y sistema de reservas por WhatsApp.

## 📋 Características

### Backend (Node.js + Express + PostgreSQL)
- ✅ Arquitectura modular y escalable
- ✅ Base de datos PostgreSQL con pools de conexiones optimizados
- ✅ Autenticación JWT para administradores
- ✅ Hashing de contraseñas con Bcrypt
- ✅ Seguridad avanzada con Helmet
- ✅ Rate limiting para prevenir ataques de fuerza bruta
- ✅ CORS configurado
- ✅ Manejo de variables de entorno con dotenv

### Frontend (HTML5 + Bootstrap 5 + JavaScript)
- ✅ Catálogo público de tours con diseño responsive
- ✅ Buscador instantáneo por título
- ✅ Filtros por categoría y rango de precios
- ✅ Sistema de reserva inteligente por WhatsApp
- ✅ Panel de administración protegido
- ✅ CRUD completo de tours (Crear, Leer, Actualizar, Eliminar)
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Vista previa de imágenes
- ✅ Alertas dinámicas con SweetAlert2
- ✅ Botones flotantes de redes sociales

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos relacional
- **pg** - Cliente de PostgreSQL para Node.js
- **Bcrypt** - Hashing de contraseñas
- **JWT (jsonwebtoken)** - Autenticación basada en tokens
- **Helmet** - Seguridad HTTP headers
- **Express Rate Limit** - Limitación de peticiones
- **CORS** - Cross-Origin Resource Sharing
- **Dotenv** - Variables de entorno

### Frontend
- **HTML5** - Estructura semántica
- **Bootstrap 5** - Framework CSS responsive
- **FontAwesome** - Iconos
- **JavaScript ES6+** - Lógica del cliente
- **SweetAlert2** - Alertas personalizadas

## 📁 Estructura del Proyecto

```
agencia-tours/
├── .env                  # Variables de entorno
├── .gitignore
├── package.json
├── database.sql          # Script SQL para inicializar la BD
├── server.js             # Punto de entrada de la aplicación
├── config/
│   └── db.js             # Configuración del Pool de PostgreSQL
├── middlewares/
│   └── authMiddleware.js # Verificación de tokens JWT
├── controllers/
│   ├── tourController.js # Lógica de negocio para tours
│   └── authController.js # Lógica de negocio para autenticación
├── routes/
│   ├── tourRoutes.js     # Rutas de la API de tours
│   └── authRoutes.js     # Rutas de autenticación
└── public/               # Frontend estático
    ├── index.html        # Vista pública
    ├── login.html        # Login de administradores
    ├── admin.html        # Panel administrativo
    ├── css/
    │   └── styles.css    # Estilos personalizados
    └── js/
        ├── app.js        # Lógica de la vista pública
        ├── login.js      # Lógica del login
        └── admin.js      # Lógica del panel admin
```

## 🚀 Guía de Instalación

### Requisitos Previos

- **Node.js** (v16 o superior) - [Descargar aquí](https://nodejs.org/)
- **PostgreSQL** (v12 o superior) - [Descargar aquí](https://www.postgresql.org/download/)
- **Git** (opcional) - [Descargar aquí](https://git-scm.com/downloads)

### Paso 1: Clonar o Descargar el Proyecto

Si tienes Git:
```bash
git clone <url-del-repositorio>
cd agencia-tours
```

O descarga y descomprime el proyecto en tu carpeta deseada.

### Paso 2: Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias del backend.

### Paso 3: Configurar PostgreSQL

#### 3.1 Crear la Base de Datos

Abre PostgreSQL (pgAdmin o terminal) y ejecuta:

```sql
CREATE DATABASE agencia_tours;
```

#### 3.2 Ejecutar el Script SQL

Ejecuta el archivo `database.sql` en tu base de datos recién creada. Puedes hacerlo desde pgAdmin o desde la terminal:

```bash
psql -U postgres -d agencia_tours -f database.sql
```

Esto creará las tablas necesarias e insertará un administrador inicial.

### Paso 4: Configurar Variables de Entorno

Abre el archivo `.env` y configura los siguientes valores:

```env
# Configuración de Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agencia_tours
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui

# Configuración del Servidor
PORT=3000
NODE_ENV=development

# Configuración JWT
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_en_produccion
JWT_EXPIRES_IN=24h

# Configuración WhatsApp
WHATSAPP_NUMBER=5211234567890

# Configuración Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**IMPORTANTE:**
- Cambia `DB_PASSWORD` por tu contraseña real de PostgreSQL
- Cambia `JWT_SECRET` por una cadena segura y única
- Cambia `WHATSAPP_NUMBER` por tu número de WhatsApp corporativo

### Paso 5: Iniciar el Servidor

#### Modo Desarrollo (con recarga automática):
```bash
npm run dev
```

#### Modo Producción:
```bash
npm start
```

El servidor iniciará en `http://localhost:3000`

## 🔐 Credenciales de Acceso

### Administrador por Defecto

- **Usuario:** `admin`
- **Contraseña:** `admin123`

⚠️ **IMPORTANTE:** Cambia la contraseña del administrador inmediatamente después del primer inicio de sesión desde el panel administrativo.

## 🌐 Acceso a la Aplicación

Una vez iniciado el servidor, puedes acceder a:

- **Vista Pública:** http://localhost:3000
- **Login Admin:** http://localhost:3000/login
- **Panel Admin:** http://localhost:3000/admin
- **API:** http://localhost:3000/api

## 📚 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/create-admin` - Crear nuevo admin

### Tours
- `GET /api/tours` - Obtener todos los tours (público)
- `GET /api/tours/:id` - Obtener un tour por ID (público)
- `POST /api/tours` - Crear tour (requiere autenticación)
- `PUT /api/tours/:id` - Actualizar tour (requiere autenticación)
- `DELETE /api/tours/:id` - Eliminar tour (requiere autenticación)
- `GET /api/tours/stats` - Obtener estadísticas (requiere autenticación)

## 🔧 Configuración Adicional

### Cambiar Número de WhatsApp

Edita el archivo `public/js/app.js` y busca la función `reserveByWhatsApp`. Cambia el número en la URL:

```javascript
const whatsappUrl = `https://wa.me/TU_NUMERO_AQUI?text=${encodedMessage}`;
```

También actualiza la variable `WHATSAPP_NUMBER` en el archivo `.env`.

### Personalizar Imágenes

Las imágenes de los tours se cargan desde URLs. Puedes usar:
- Imágenes de Unsplash (como en los ejemplos)
- Imágenes alojadas en tu propio servidor
- Imágenes de servicios como Cloudinary, AWS S3, etc.

## 🛡️ Seguridad en Producción

Antes de desplegar en producción:

1. **Cambiar todas las contraseñas por defecto**
2. **Usar un JWT_SECRET fuerte y único**
3. **Configurar CORS con tu dominio real**
4. **Usar HTTPS**
5. **Configurar firewall y reglas de seguridad**
6. **Hacer backups regulares de la base de datos**
7. **Monitorear logs de errores**
8. **Actualizar dependencias regularmente**

## 📝 Uso del Sistema

### Vista Pública (Clientes)
1. Los clientes pueden ver el catálogo de tours
2. Pueden buscar por nombre o palabra clave
3. Pueden filtrar por categoría y precio
4. Pueden reservar directamente por WhatsApp con un mensaje pre-formateado

### Panel Administrativo
1. Inicia sesión con tus credenciales de admin
2. Verás estadísticas generales en el dashboard
3. Puedes crear, editar y eliminar tours
4. Puedes cambiar tu contraseña
5. Puedes ver el sitio público desde el panel

## 🐛 Solución de Problemas

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Asegúrate de que la base de datos `agencia_tours` exista

### Error "Token inválido o expirado"
- Cierra sesión y vuelve a iniciar
- Verifica que el JWT_SECRET sea el mismo en servidor y cliente
- Limpia el localStorage/sessionStorage del navegador

### Las imágenes no cargan
- Verifica que las URLs sean válidas
- Asegúrate de que las imágenes sean accesibles públicamente
- Verifica que no haya bloqueo CORS en el servidor de imágenes

## 📞 Soporte

Para reportar issues o solicitar mejoras, por favor abre un issue en el repositorio del proyecto.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia ISC.

## 👨‍💻 Desarrollo

Desarrollado con ❤️ utilizando Node.js, Express, PostgreSQL y tecnologías web modernas.

---

**¡Disfruta gestionando tu agencia de tours! 🌴✈️**
