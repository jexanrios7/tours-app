# Guía de Despliegue

Esta guía te ayudará a desplegar tu aplicación de tours en servicios de hosting en la nube.

## Opciones de Hosting Gratuitas

### 1. Render (Recomendado)
- **URL**: https://render.com
- **Ventajas**: Fácil de usar, soporta PostgreSQL gratuito, despliegue automático desde GitHub
- **Limitaciones**: 750 horas/mes de CPU, 90 días de inactividad

### 2. Railway
- **URL**: https://railway.app
- **Ventajas**: Interfaz intuitiva, soporte para PostgreSQL
- **Limitaciones**: $5 de crédito gratuito al mes

### 3. Heroku
- **URL**: https://heroku.com
- **Ventajas**: Muy popular, documentación extensa
- **Limitaciones**: Ya no tiene plan gratuito (mínimo $5/mes)

## Pasos para Desplegar en Render

### Paso 1: Preparar el Repositorio en GitHub

1. Crea una cuenta en GitHub si no tienes una
2. Crea un nuevo repositorio
3. Sube tu código al repositorio:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```

### Paso 2: Crear Archivo .gitignore

Asegúrate de tener un archivo `.gitignore` en la raíz del proyecto:

```
node_modules/
.env
.DS_Store
*.log
uploads/
```

### Paso 3: Configurar Variables de Entorno en Render

En Render, necesitas configurar estas variables de entorno:

**Base de Datos:**
- `DB_HOST`: (Render lo proporciona automáticamente)
- `DB_PORT`: 5432
- `DB_NAME`: (Render lo proporciona automáticamente)
- `DB_USER`: (Render lo proporciona automáticamente)
- `DB_PASSWORD`: (Render lo proporciona automáticamente)

**JWT:**
- `JWT_SECRET`: Genera una cadena segura (ej: `openssl rand -base64 32`)

**Email (opcional):**
- `EMAIL_HOST`: smtp.mail.me.com
- `EMAIL_PORT`: 587
- `EMAIL_USER`: tu-email@icloud.com
- `EMAIL_PASS`: tu-contraseña-de-aplicación
- `EMAIL_FROM`: tu-email@icloud.com
- `CONTACT_EMAIL`: tu-email@icloud.com

### Paso 4: Crear Servicios en Render

1. **Crear Base de Datos PostgreSQL:**
   - Ve a Render Dashboard
   - Click en "New" → "PostgreSQL"
   - Nombra tu base de datos
   - Selecciona la región más cercana
   - Click en "Create Database"

2. **Crear Servicio Web:**
   - Ve a Render Dashboard
   - Click en "New" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Configura:
     - **Name**: tours-app
     - **Region**: (la misma que tu base de datos)
     - **Branch**: main
     - **Root Directory**: (dejar vacío)
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`

3. **Conectar Base de Datos:**
   - En tu servicio web, ve a "Environment"
   - Agrega las variables de entorno de la base de datos que Render te proporciona
   - Render te dará las credenciales en la página de tu base de datos PostgreSQL

### Paso 5: Despliegue Automático

Render desplegará automáticamente tu aplicación cada vez que hagas push a GitHub.

## Pasos para Desplegar en Railway

### Paso 1: Crear Cuenta y Proyecto

1. Ve a https://railway.app
2. Crea una cuenta con GitHub
3. Click en "New Project" → "Deploy from GitHub repo"

### Paso 2: Conectar Repositorio

1. Selecciona tu repositorio de GitHub
2. Railway detectará automáticamente que es un proyecto Node.js

### Paso 3: Agregar Base de Datos

1. Click en "New" → "Database" → "Add PostgreSQL"
2. Railway creará la base de datos automáticamente

### Paso 4: Configurar Variables de Entorno

1. Ve a la pestaña "Variables"
2. Agrega las variables de entorno necesarias (ver lista arriba)
3. Railway reemplazará automáticamente las variables de la base de datos

### Paso 5: Desplegar

Click en "Deploy" y Railway hará el resto.

## Configuración de Producción

### Cambiar Puerto

El servidor ya está configurado para usar el puerto que proporciona el hosting:

```javascript
const PORT = process.env.PORT || 3000;
```

### Base de Datos en Producción

Asegúrate de usar las credenciales que te proporciona el servicio de hosting.

### Cambiar Contraseña de Admin

Antes de desplegar, cambia la contraseña del admin en producción:

```sql
UPDATE admins SET password = '$2a$10$...' WHERE username = 'admin';
```

Genera un nuevo hash con:
```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('nueva-contraseña', 10);
console.log(hash);
```

## Dominio Personalizado

### En Render

1. Ve a tu servicio web
2. Click en "Settings" → "Custom Domains"
3. Agrega tu dominio
4. Configura los DNS según las instrucciones de Render

### En Railway

1. Ve a tu proyecto
2. Click en "Settings" → "Domains"
3. Agrega tu dominio
4. Configura los DNS según las instrucciones de Railway

## Consideraciones de Seguridad

1. **Nunca commits el archivo .env**
2. **Usa contraseñas fuertes para JWT_SECRET**
3. **Cambia la contraseña del admin por defecto**
4. **Usa HTTPS** (Render y Railway lo proporcionan automáticamente)
5. **Limita el acceso al panel admin** (ya implementado con JWT)

## Monitoreo

- **Render**: Dashboard muestra logs, métricas y estado del servicio
- **Railway**: Dashboard muestra logs y estado del servicio

## Soporte

- **Render**: https://render.com/docs
- **Railway**: https://docs.railway.app

## Costos

- **Render**: Plan gratuito disponible (con limitaciones)
- **Railway**: $5 de crédito gratuito al mes, luego $5/mes por servicio

## Resumen Rápido

1. Sube tu código a GitHub
2. Crea cuenta en Render o Railway
3. Crea base de datos PostgreSQL
4. Crea servicio web conectando tu repositorio
5. Configura variables de entorno
6. ¡Despliega y disfruta tu aplicación en línea!
