# Lesa.io - Automated Backup Script
param(
    [string]$BackupName = "stable_checkpoint_" + (Get-Date -Format "yyyyMMdd_HHmmss")
)

$sourceDir = if ($PSScriptRoot) { $PSScriptRoot } else { "c:\Lesa.io" }
$backupRootDir = Join-Path $sourceDir "_backups"
$backupTargetDir = Join-Path $backupRootDir $BackupName
$zipTargetPath = Join-Path $backupRootDir "$BackupName.zip"

Write-Output "Creating backup directory: $backupTargetDir"
New-Item -ItemType Directory -Path $backupTargetDir -Force | Out-Null

$itemsToCopy = @(
    'assets', 'Audio', 'src', 'styles', 'favicon.ico', 'favicon.png',
    'index.html', 'Launcher.cs', 'Lesa.io.exe', 'style.css',
    'Versions.md', 'GAME_OVERVIEW.md', 'BUGS_FIXED.md', 'MOBILE_ARCHITECTURE_PLAN.md',
    'GEAR_OVERVIEW.md', 'ROADMAP.md', 'serve.ps1', 'tcp_bridge.ps1', 'manifest.json', 'crop_icons.ps1', 'DevTeamLOGO'
)

foreach ($item in $itemsToCopy) {
    $srcPath = Join-Path $sourceDir $item
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination $backupTargetDir -Recurse -Force
        Write-Output " -> Backed up: $item"
    }
}

Write-Output "Compressing backup to zip archive: $zipTargetPath"
if (Test-Path $zipTargetPath) { Remove-Item $zipTargetPath -Force }
Compress-Archive -Path "$backupTargetDir\*" -DestinationPath $zipTargetPath -Force

Write-Output "SUCCESS! Backup saved at:"
Write-Output "1. Folder: $backupTargetDir"
Write-Output "2. Zip:    $zipTargetPath"
