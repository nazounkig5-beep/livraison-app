# Installe LivraisonApp pour l'utilisateur courant : copie l'application dans
# %LOCALAPPDATA%\Programs\LivraisonApp et cree un raccourci Bureau + menu Demarrer avec icone.
# Ne necessite aucun droit administrateur (installation par utilisateur uniquement).

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Join-Path $scriptDir "win-unpacked"
$installDir = Join-Path $env:LOCALAPPDATA "Programs\LivraisonApp"
$exeName = "LivraisonApp.exe"

Write-Host "============================================"
Write-Host "  Installation de LivraisonApp"
Write-Host "============================================"
Write-Host ""

if (-not (Test-Path (Join-Path $sourceDir $exeName))) {
    Write-Host "[ERREUR] Dossier de l'application introuvable : $sourceDir" -ForegroundColor Red
    Write-Host "Ce script doit rester a cote du dossier 'win-unpacked' fourni avec l'installateur."
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

Write-Host "Copie de l'application vers : $installDir"
if (Test-Path $installDir) {
    Remove-Item -Recurse -Force $installDir
}
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Copy-Item -Path (Join-Path $sourceDir "*") -Destination $installDir -Recurse -Force

$exePath = Join-Path $installDir $exeName

function New-AppShortcut($shortcutPath) {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $exePath
    $shortcut.WorkingDirectory = $installDir
    $shortcut.IconLocation = "$exePath,0"
    $shortcut.Description = "LivraisonApp"
    $shortcut.Save()
}

$desktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "LivraisonApp.lnk"
Write-Host "Creation du raccourci Bureau : $desktopShortcut"
New-AppShortcut $desktopShortcut

$startMenuDir = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$startMenuShortcut = Join-Path $startMenuDir "LivraisonApp.lnk"
Write-Host "Creation du raccourci menu Demarrer : $startMenuShortcut"
New-AppShortcut $startMenuShortcut

Write-Host ""
Write-Host "============================================"
Write-Host "  Installation terminee !"
Write-Host "============================================"
Write-Host ""
Write-Host "Avant le premier lancement, suivez la section « Premiere installation »"
Write-Host "du GUIDE_INSTALLATION.md : configurer backend\.env puis executer"
Write-Host "premiere-installation.bat depuis :"
Write-Host "  $installDir\resources\"
Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"
