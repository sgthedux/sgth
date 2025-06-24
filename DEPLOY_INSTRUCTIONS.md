# RESUMEN DE CORRECCIONES PARA ENDPOINTS 404

## 📊 ESTADO ACTUAL
- ✅ Build local exitoso
- ✅ Endpoints configurados como rutas dinámicas (ƒ)
- ✅ Configuración de runtime añadida
- ⚠️ Pendiente: Verificación en producción

## 🔧 CAMBIOS REALIZADOS

### 1. Configuración de Runtime Dinámico
Se agregó a todos los endpoints API problemáticos:
```typescript
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

**Archivos modificados:**
- `/app/api/licenses/excel/route.ts` ✅
- `/app/api/licenses/update-status/route.ts` ✅
- `/app/api/licenses/report/route.ts` ✅
- `/app/api/licenses/status/route.ts` ✅
- `/app/api/catalogs/route.ts` ✅
- `/app/api/profile-data/route.ts` ✅ (reconstruido)
- `/app/api/get-admin-profile/route.ts` ✅
- `/app/api/documents/check/route.ts` ✅

### 2. Configuración de Next.js
Actualizado `next.config.mjs`:
```javascript
{
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['exceljs'],
  }
}
```

### 3. Endpoints de Prueba Creados
- `/api/health` - Verificación básica de salud
- `/api/test-licenses` - Test simple sin dependencias
- `/api/licenses/simple-test` - Test con parámetros

### 4. Scripts de Verificación
- `scripts/verify-endpoints.ps1` - Script PowerShell para verificar endpoints en producción

## 🚀 INSTRUCCIONES PARA DEPLOY

### Paso 1: Verificar Build Local
```bash
npm run build
```
✅ Confirmado: Build exitoso

### Paso 2: Deploy a Producción
Subir los cambios al repositorio y hacer deploy.

### Paso 3: Verificación Post-Deploy
Ejecutar las siguientes verificaciones:

#### A. Endpoints Básicos
```bash
curl https://sgth.utede.com.co/api/health
curl https://sgth.utede.com.co/api/test-licenses
```

#### B. Endpoints de Licencias
```bash
# Test Excel (debe devolver JSON de error por falta de ID válido, no 404)
curl "https://sgth.utede.com.co/api/licenses/excel?id=test-id"

# Test Update Status (debe devolver JSON de error por datos inválidos, no 404)
curl -X PATCH "https://sgth.utede.com.co/api/licenses/update-status" \
  -H "Content-Type: application/json" \
  -d '{"licenseId":"test","status":"test"}'

# Test Report
curl "https://sgth.utede.com.co/api/licenses/report"
```

#### C. Script de Verificación Automática
```powershell
.\scripts\verify-endpoints.ps1
```

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Si siguen apareciendo 404:
1. **Verificar logs del servidor** - Buscar errores en la consola de deployment
2. **Revisar configuración de proxy** - Verificar que no haya configuración de proxy bloqueando `/api/licenses/*`
3. **Cache del CDN** - Limpiar cache si se usa Cloudflare u otro CDN
4. **Variables de entorno** - Confirmar que todas las variables necesarias estén configuradas

### Si aparecen errores 500:
1. **Base de datos** - Ejecutar migraciones pendientes (especialmente la columna `status`)
2. **Dependencias** - Verificar que `exceljs` esté instalado correctamente
3. **Variables de entorno de Supabase** - Confirmar configuración

## 📝 MIGRACIONES DE BASE DE DATOS PENDIENTES

**IMPORTANTE**: Ejecutar en Supabase antes de usar los endpoints:

```sql
-- Agregar columna estado si no existe
ALTER TABLE license_requests 
ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'pendiente';

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_license_requests_estado 
ON license_requests(estado);

-- Migrar datos existentes de status a estado si es necesario
UPDATE license_requests 
SET estado = COALESCE(status, 'pendiente') 
WHERE estado IS NULL;
```

## ✅ ENDPOINTS CONFIRMADOS EN BUILD

Los siguientes endpoints están correctamente configurados y aparecen en el build:
- `/api/licenses/excel` (ƒ)
- `/api/licenses/update-status` (ƒ)
- `/api/licenses/report` (ƒ)
- `/api/licenses/status` (ƒ)
- `/api/health` (ƒ)
- `/api/test-licenses` (ƒ)

**Nota**: La (ƒ) indica que son rutas dinámicas que se renderizarán bajo demanda en el servidor.

## 🎯 SIGUIENTE PASO

**Hacer deploy y ejecutar las verificaciones post-deploy para confirmar que los endpoints ya no devuelven 404.**
