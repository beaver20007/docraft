# DOCRAFT - clone or update child repositories (Create / Capture / Protect).
# Run:  cd C:\Projects\docraft
#       .\scripts\clone-all.ps1
#       .\scripts\clone-all.ps1 -SkipExisting

param(
    [string]$ParentDir = "C:\Projects",
    [string]$PlaybookDir = "C:\Users\tsvetkov\ai playbook generator",
    [string]$DesktopDir = "C:\Projects\autocad-instructor",
    [string]$MagicalDir = "C:\Users\tsvetkov\Documents\magical-pdf",
    [switch]$SkipExisting
)

$ErrorActionPreference = "Stop"

$repos = @(
    @{
        Name = "ai-playbook-generator"
        Url  = "https://github.com/beaver20007/ai-playbook-generator.git"
        Dir  = $PlaybookDir
    },
    @{
        Name = "desktop-instructor"
        Url  = "https://github.com/beaver20007/desktop-instructor.git"
        Dir  = $DesktopDir
    },
    @{
        Name = "magical-pdf"
        Url  = "https://github.com/beaver20007/magical-pdf.git"
        Dir  = $MagicalDir
    }
)

Write-Host "DOCRAFT clone-all" -ForegroundColor Cyan
Write-Host "  SkipExisting = $SkipExisting" -ForegroundColor DarkGray
Write-Host ""

foreach ($r in $repos) {
    $dir = $r.Dir
    $gitDir = Join-Path $dir ".git"

    if (Test-Path -LiteralPath $dir) {
        if (Test-Path -LiteralPath $gitDir) {
            Write-Host "[pull] $($r.Name)" -ForegroundColor Green
            Write-Host "       $dir" -ForegroundColor DarkGray
            git -C $dir pull --ff-only
        }
        else {
            Write-Host "[warn] $($r.Name) - not a git repo: $dir" -ForegroundColor Yellow
        }
        continue
    }

    if ($SkipExisting) {
        Write-Host "[skip] $($r.Name) - missing (-SkipExisting): $dir" -ForegroundColor Yellow
        continue
    }

    $parent = Split-Path -LiteralPath $dir -Parent
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    Write-Host "[clone] $($r.Name)" -ForegroundColor Green
    Write-Host "       $dir" -ForegroundColor DarkGray
    git clone $r.Url $dir
}

Write-Host ""
Write-Host "Local paths:" -ForegroundColor Cyan
foreach ($r in $repos) {
    if (Test-Path -LiteralPath $r.Dir) {
        $mark = "ok"
    }
    else {
        $mark = "missing"
    }
    Write-Host "  [$mark] $($r.Name): $($r.Dir)"
}
