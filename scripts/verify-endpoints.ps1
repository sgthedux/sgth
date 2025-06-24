# Script de verificación de endpoints en producción

# Configuración
$baseUrl = "https://sgth.utede.com.co"

# Lista de endpoints a verificar
$endpoints = @(
    "/api/health",
    "/api/test-licenses",
    "/api/licenses/simple-test?id=test-id",
    "/api/licenses/excel?id=test-id",
    "/api/licenses/update-status",
    "/api/licenses/report"
)

Write-Host "🔍 Verificando endpoints en: $baseUrl" -ForegroundColor Cyan
Write-Host "=" * 50

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$endpoint"
    Write-Host "Probando: $endpoint" -ForegroundColor Yellow
    
    try {
        if ($endpoint -eq "/api/licenses/update-status") {
            # Test PATCH endpoint
            $body = @{
                licenseId = "test-id"
                status = "en_revision"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri $url -Method PATCH -Body $body -ContentType "application/json" -TimeoutSec 10
        } else {
            # Test GET endpoint
            $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 10
        }
        
        Write-Host "✅ OK - Status: Exitoso" -ForegroundColor Green
        if ($response.success) {
            Write-Host "   Message: $($response.message)" -ForegroundColor Green
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ ERROR - Status: $statusCode" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Verificación completada." -ForegroundColor Cyan
