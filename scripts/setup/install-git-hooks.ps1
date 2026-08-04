[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = (& git rev-parse --show-toplevel 2>$null | Select-Object -First 1).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repositoryRoot)) {
    throw 'This command must run inside the repository.'
}

$hookPath = Join-Path $repositoryRoot '.githooks/pre-push'
if (-not (Test-Path -LiteralPath $hookPath -PathType Leaf)) {
    throw "Tracked pre-push hook not found: $hookPath"
}

& git config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to configure the repository Git hooks path.'
}

$configuredPath = (& git config --get core.hooksPath).Trim()
if ($configuredPath -ne '.githooks') {
    throw "Unexpected Git hooks path: $configuredPath"
}

Write-Host 'Repository Git hooks installed. Direct pushes to main are now blocked locally.'
