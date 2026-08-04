[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$ErrorActionPreference = 'Stop'
if ($Version -notmatch '^v?[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$') {
    throw "Version must use semantic versioning, for example v1.2.3: $Version"
}

$requiredFiles = @('docs/project/CHANGELOG.md', 'docs/releases/RELEASE_NOTES.md')
foreach ($path in $requiredFiles) {
    $content = if (Test-Path -LiteralPath $path -PathType Leaf) {
        Get-Content -Raw -LiteralPath $path -Encoding UTF8
    }
    else {
        $null
    }
    if ([string]::IsNullOrWhiteSpace($content)) {
        throw "Release file is missing or empty: $path"
    }
}

& (Join-Path (Split-Path -Parent $PSScriptRoot) 'ci/validate-framework.ps1')
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Release prerequisites passed for $Version."
