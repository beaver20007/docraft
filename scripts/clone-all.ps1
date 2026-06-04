# Clone DOCRAFT child repositories next to a parent directory.
param(
    [string]$ParentDir = (Split-Path $PSScriptRoot -Parent),
    [string]$PlaybookDir = "",
    [string]$DesktopDir = "",
    [string]$MagicalDir = "",
    [switch]$SkipExisting
)

$ErrorActionPreference = "Stop"

$repos = @(
    @{
        Name = "ai-playbook-generator"
        Url  = "https://github.com/beaver20007/ai-playbook-generator.git"
        Dir  = if ($PlaybookDir) { $PlaybookDir } else { Join-Path $ParentDir "ai-playbook-generator" }
    },
    @{
        Name = "desktop-instructor"
        Url  = "https://github.com/beaver20007/desktop-instructor.git"
        Dir  = if ($DesktopDir) { $DesktopDir } else { Join-Path $ParentDir "desktop-instructor" }
    },
    @{
        Name = "magical-pdf"
        Url  = "https://github.com/beaver20007/magical-pdf.git"
        Dir  = if ($MagicalDir) { $MagicalDir } else { Join-Path (Join-Path $env:USERPROFILE "Documents") "magical-pdf" }
    }
)

Write-Host "DOCRAFT clone-all — parent: $ParentDir" -ForegroundColor Cyan

foreach ($r in $repos) {
    if (Test-Path $r.Dir) {
        if ($SkipExisting) {
            Write-Host "[skip] $($r.Name) exists: $($r.Dir)" -ForegroundColor Yellow
            continue
        }
        Write-Host "[pull] $($r.Name) at $($r.Dir)" -ForegroundColor Green
        git -C $r.Dir pull --ff-only
        continue
    }
    Write-Host "[clone] $($r.Name) -> $($r.Dir)" -ForegroundColor Green
    git clone $r.Url $r.Dir
}

Write-Host ""
Write-Host "Local paths (customize in docs/REPOS.md if different):" -ForegroundColor Cyan
foreach ($r in $repos) {
    Write-Host "  $($r.Name): $($r.Dir)"
}
