$backendVenvPython = 'c:\Users\CASAIS\GRKK\backend\.venv\Scripts\python.exe'
$scriptPath = 'c:\Users\CASAIS\GRKK\create_frontend_zip.py'
$zipPath = 'c:\Users\CASAIS\GRKK\frontend_clean.zip'

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Executa o script python de build e zip com permissões Unix corretas
& $backendVenvPython $scriptPath

if (Test-Path $zipPath) {
    $sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host ''
    Write-Host '=== frontend_clean.zip criado com sucesso ===' -ForegroundColor Green
    Write-Host "Tamanho  : $sizeMB MB" -ForegroundColor Cyan
    Write-Host "Caminho  : $zipPath" -ForegroundColor Cyan
} else {
    Write-Host 'Falha ao gerar o arquivo ZIP do frontend' -ForegroundColor Red
}
