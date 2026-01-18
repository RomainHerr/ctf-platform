# Script pour nettoyer le cache et relancer
Write-Host "Nettoyage du cache Next.js..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Write-Host "Redemarrage du serveur..." -ForegroundColor Green
npm run dev
