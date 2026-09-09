# Lesa.io - One-Click Backup Restore Script
param(
    [string]$BackupName = "stable_working_release"
)

$sourceDir = if ($PSScriptRoot) { $PSScriptRoot } else { "c:\Lesa.io" }
$backupRootDir = Join-Path $sourceDir "_backups"
$backupTargetDir = Join-Path $backupRootDir $BackupName

if (-not (Test-Path $backupTargetDir)) {
    # If specific folder doesn't exist, pick the newest folder in _backups
    $latest = Get-ChildItem -Path $backupRootDir -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
        $backupTargetDir = $latest.FullName
    } else {
        Write-Error "No backups found in $backupRootDir"
        exit 1
    }
}

Write-Output "Restoring Lesa.io from: $backupTargetDir"

$itemsToRestore = @(
    'assets', 'Audio', 'src', 'styles', 'favicon.ico', 'favicon.png',
    'index.html', 'Launcher.cs', 'Lesa.io.exe', 'style.css',
    'Versions.md', 'GAME_OVERVIEW.md', 'BUGS_FIXED.md', 'MOBILE_ARCHITECTURE_PLAN.md',
    'GEAR_OVERVIEW.md', 'ROADMAP.md', 'serve.ps1', 'tcp_bridge.ps1', 'manifest.json', 'crop_icons.ps1', 'DevTeamLOGO'
)

foreach ($item in $itemsToRestore) {
    $srcPath = Join-Path $backupTargetDir $item
    if (Test-Path $srcPath) {
        $destPath = Join-Path $sourceDir $item
        Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
        Write-Output " -> Restored: $item"
    }
}

Write-Output "SUCCESS! Lesa.io has been restored to the stable working release."
