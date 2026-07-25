$backendPath = 'c:\Users\CASAIS\GRKK\backend'
$zipPath = 'c:\Users\CASAIS\GRKK\backend_clean.zip'

# Remove ZIP anterior se existir
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$include = @(
    'app.py', '__init__.py',
    'ai_routes.py', 'atleta_routes.py', 'auditoria_routes.py', 'auth_routes.py',
    'aviso_routes.py', 'cert_routes.py', 'cms_routes.py', 'dojo_routes.py',
    'documentos_assinados_routes.py', 'despesa_routes.py',
    'estoque_routes.py', 'event_routes.py', 'exam_routes.py', 'filial_routes.py',
    'finance_routes.py', 'fornecedor_routes.py', 'messages_routes.py', 'notif_routes.py',
    'notif_whatsapp_routes.py', 'presenca_routes.py', 'ranking_routes.py', 'relatorio_routes.py',
    'team_gallery_routes.py',
    'check_startup.py', 'check_profiles.py',
    'requirements.txt', '.htaccess', 'index.fcgi', 'passenger_wsgi.py',
    'forcar_reinstalacao_total.php', 'limpar_e_reinstalar.php', 'diagnostico_erro.php',
    'schema.sql', '.env.production.template'
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

foreach ($file in $include) {
    $fullPath = Join-Path $backendPath $file
    if (Test-Path $fullPath) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $file) | Out-Null
        Write-Host "  + $file"
    } else {
        Write-Host "  ! NAO ENCONTRADO: $file" -ForegroundColor Yellow
    }
}

# Adiciona pasta services/ (excluindo __pycache__ e .pyc)
$servicesPath = Join-Path $backendPath 'services'
Get-ChildItem -Path $servicesPath -File | Where-Object { $_.Extension -ne '.pyc' } | ForEach-Object {
    $entryName = 'services/' + $_.Name
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
    Write-Host "  + $entryName"
}

$zip.Dispose()

$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host ""
Write-Host "=== backend_clean.zip criado com sucesso ===" -ForegroundColor Green
Write-Host "Tamanho : $sizeMB MB" -ForegroundColor Cyan
Write-Host "Caminho : $zipPath" -ForegroundColor Cyan
