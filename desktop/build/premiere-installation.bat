@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================
echo   LivraisonApp - Premiere installation
echo ============================================
echo.
echo Ce script initialise la base de donnees (migrations + compte admin).
echo A executer UNE SEULE FOIS, apres avoir configure backend\.env
echo (voir GUIDE_INSTALLATION.md).
echo.
pause

where php >nul 2>nul
if %errorlevel%==0 (
    set PHP_EXE=php
) else (
    set PHP_EXE=
    for %%V in (php8.2.29 php8.3.28 php8.4.15 php8.5.0 php8.1.33 php8.0.30) do (
        if exist "C:\wamp64\bin\php\%%V\php.exe" if "!PHP_EXE!"=="" set PHP_EXE=C:\wamp64\bin\php\%%V\php.exe
    )
)

if "%PHP_EXE%"=="" (
    echo [ERREUR] php.exe introuvable. Installez PHP ou WAMP, voir GUIDE_INSTALLATION.md.
    pause
    exit /b 1
)

echo Utilisation de : %PHP_EXE%
echo.

if not exist "backend\.env" (
    echo [ERREUR] backend\.env est introuvable. Copiez backend\.env.example vers backend\.env
    echo et renseignez vos identifiants PostgreSQL avant de relancer ce script.
    pause
    exit /b 1
)

cd backend

echo Regeneration de l'autoloader Composer pour ce poste...
"%PHP_EXE%" "..\composer.phar" dump-autoload --optimize --no-interaction
if errorlevel 1 goto :erreur

echo Generation de la cle d'application (si necessaire)...
findstr /R "^APP_KEY=.\+" .env >nul 2>nul
if errorlevel 1 (
    "%PHP_EXE%" artisan key:generate --force --ansi
) else (
    echo Deja generee, on passe.
)

echo Publication de la migration Sanctum (si necessaire)...
dir /b "database\migrations\*personal_access_tokens_table.php" >nul 2>nul
if errorlevel 1 (
    "%PHP_EXE%" artisan vendor:publish --tag=sanctum-migrations --ansi
) else (
    echo Deja publiee, on passe.
)

echo Execution des migrations...
"%PHP_EXE%" artisan migrate --force --ansi
if errorlevel 1 goto :erreur

echo Creation du compte administrateur initial...
"%PHP_EXE%" artisan db:seed --force --ansi
if errorlevel 1 goto :erreur

echo.
echo ============================================
echo   Termine ! Compte admin : admin@livraison-app.local / admin123
echo   Vous pouvez maintenant lancer LivraisonApp depuis le Bureau.
echo ============================================
pause
exit /b 0

:erreur
echo.
echo [ERREUR] Une etape a echoue. Verifiez backend\.env (connexion PostgreSQL) et relancez ce script.
pause
exit /b 1
