[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
if ($Version -notmatch '^v?[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$') {
    throw "Version must use semantic versioning, for example v1.2.3: $Version"
}

$requiredFiles = @('CHANGELOG.md', 'RELEASE_NOTES.md')
foreach ($path in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf) -or (Get-Item -LiteralPath $path).Length -eq 0) {
        throw "Release file is missing or empty: $path"
    }
}

& (Join-Path (Split-Path -Parent $PSScriptRoot) 'ci/validate-framework.ps1')
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Release prerequisites passed for $Version."
