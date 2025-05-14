# -------- CONFIG --------
$resourceGroup = "myResourceGroup"
$webAppName = "nestwebapp123"
$envPath = ".env"

# -------- LOAD .env FILE --------
$envLines = Get-Content $envPath | Where-Object { $_ -match "=" -and -not ($_ -match "^#") }
$settingsArray = @()

foreach ($line in $envLines) {
    $parts = $line -split "=", 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    $settingsArray += "$key=$value"
}

# -------- PUSH TO AZURE --------
az webapp config appsettings set `
  --name $webAppName `
  --resource-group $resourceGroup `
  --settings $settingsArray



az webapp restart \ --name nestwebapp123 \ --resource-group myResourceGroup

