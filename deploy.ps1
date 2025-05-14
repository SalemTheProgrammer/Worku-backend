# -------- CONFIGURATION --------
$resourceGroup = "myResourceGroup"
$location = "westeurope"
$acrName = "linternacr123"
$appServicePlan = "nestAppServicePlan"
$webAppName = "nestwebapp123"
$imageName = "$acrName.azurecr.io/nest-app:latest"

# -------- LOGIN & SETUP --------
az login

# Create Resource Group
az group create --name $resourceGroup --location $location

# Create Azure Container Registry (ACR)
az acr create --resource-group $resourceGroup --name $acrName --sku Basic --admin-enabled true

# Login to ACR
az acr login --name $acrName

# Build & Tag Docker Image
docker build -t nest-app .
docker tag nest-app $imageName

# Push Docker Image to ACR
docker push $imageName

# Create App Service Plan (Linux)
az appservice plan create `
  --name $appServicePlan `
  --resource-group $resourceGroup `
  --sku B1 `
  --is-linux

# Create Web App using container image
az webapp create `
  --resource-group $resourceGroup `
  --plan $appServicePlan `
  --name $webAppName `
  --deployment-container-image-name $imageName

# Configure Web App with ACR
az webapp config container set `
  --name $webAppName `
  --resource-group $resourceGroup `
  --docker-custom-image-name $imageName `
  --docker-registry-server-url "https://$acrName.azurecr.io"

# Print Web App URL
$appUrl = az webapp show `
  --name $webAppName `
  --resource-group $resourceGroup `
  --query "defaultHostName" `
  --output tsv

Write-Host "✅ App deployed at: https://$appUrl"
