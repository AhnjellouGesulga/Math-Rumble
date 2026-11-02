param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$localPhpPath = Join-Path $PSScriptRoot '.runtime\php\php.exe'

if (Test-Path -LiteralPath $localPhpPath) {
    $phpExecutable = $localPhpPath
} else {
    $phpCommand = Get-Command php -ErrorAction SilentlyContinue
    if (-not $phpCommand) {
        throw 'PHP 8.4.1 or newer is required. Install it or select a compatible PHP version in Laragon.'
    }
    $phpExecutable = $phpCommand.Source
}

$installedPhpVersion = & $phpExecutable -r 'echo PHP_VERSION;'
if ([version]$installedPhpVersion -lt [version]'8.4.1') {
    throw 'This project requires PHP 8.4.1 or newer. Select a compatible PHP version in Laragon.'
}
if (-not (Test-Path -LiteralPath 'vendor\autoload.php')) {
    throw 'Dependencies are missing. Run composer install with PHP 8.4.1 or newer first.'
}
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    & $phpExecutable artisan key:generate --no-interaction
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Math Rope Rumble: http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host 'Press Ctrl+C to stop the server.'
& $phpExecutable artisan serve --host=127.0.0.1 --port=$Port --no-interaction
exit $LASTEXITCODE
