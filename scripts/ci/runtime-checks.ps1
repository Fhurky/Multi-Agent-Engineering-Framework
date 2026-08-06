<#
.SYNOPSIS
Shared entry point for the runtime toolchain checks.

.DESCRIPTION
Runs the type check, lint, format check, tests, and toolchain smoke test defined by
TASK-018 and ADR-0001. Continuous integration and local sessions call this script so
that both run exactly the same commands.

Dependencies must already be installed with "npm ci"; this script never installs,
publishes, or mutates anything outside the generated output directories.

.PARAMETER Stage
The check to run. "all" runs typecheck, lint, format, test, and smoke in that order.

.EXAMPLE
./scripts/ci/runtime-checks.ps1
./scripts/ci/runtime-checks.ps1 -Stage typecheck
#>
[CmdletBinding()]
param(
    [ValidateSet('all', 'typecheck', 'lint', 'format', 'test', 'coverage', 'smoke')]
    [string]$Stage = 'all'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repositoryRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$stageCommands = [ordered]@{
    typecheck = 'typecheck'
    lint      = 'lint'
    format    = 'format:check'
    test      = 'test'
    coverage  = 'test:coverage'
    smoke     = 'toolchain:smoke'
}

if ($Stage -eq 'all') {
    $requestedStages = @('typecheck', 'lint', 'format', 'test', 'smoke')
}
else {
    $requestedStages = @($Stage)
}

if ($null -eq (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js was not found on PATH. Install Node.js 22 LTS or newer, as ADR-0001 requires.'
}

if ($null -eq (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm was not found on PATH. Install the npm client that ships with Node.js 22 LTS or newer.'
}

$nodeVersion = (& node --version).Trim()
$nodeMajor = [int](($nodeVersion.TrimStart('v')).Split('.')[0])
if ($nodeMajor -lt 22) {
    throw "Node.js 22 or newer is required by ADR-0001, but $nodeVersion is active."
}

if (-not (Test-Path -LiteralPath (Join-Path $repositoryRoot 'node_modules') -PathType Container)) {
    throw 'Dependencies are not installed. Run "npm ci" in the repository root before running these checks.'
}

Push-Location -LiteralPath $repositoryRoot
try {
    Write-Host "Running runtime toolchain checks on Node.js $nodeVersion."
    foreach ($requestedStage in $requestedStages) {
        $script = $stageCommands[$requestedStage]
        Write-Host "==> npm run $script"
        & npm run --silent $script
        if ($LASTEXITCODE -ne 0) {
            throw "Runtime toolchain stage '$requestedStage' failed with exit code $LASTEXITCODE."
        }
    }
}
finally {
    Pop-Location
}

Write-Host "Runtime toolchain checks passed: $($requestedStages -join ', ')."
