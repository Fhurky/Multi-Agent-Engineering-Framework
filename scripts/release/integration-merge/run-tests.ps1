# Runs the release merge executor test suite.
#
# The repository invokes automation through PowerShell, while this module's normative
# contract is expressed in TypeScript discriminated unions. This wrapper bridges the
# two: it validates the Node.js runtime, then runs the module's `node:test` suite with
# no third-party dependency and no package manifest.
#
# The suite is entirely offline and deterministic. It contacts no network, spawns no
# Git or GitHub process, reads no environment credential, and performs, requests, and
# simulates no merge.
#
# Exit codes:
#   0  every executed test passed
#   2  the Node.js runtime is unavailable or too old
#   1  a test failed
#
# Live protected-branch and attestor fixtures are registered as explicit unexecuted
# obligations in `tests/live-control-plane.blocked.test.ts` and are reported as `todo`.
# They must never be stubbed or provisioned to make them pass.

[CmdletBinding()]
param(
    [switch]$ListBlocked
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$moduleRoot = $PSScriptRoot

$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) {
    Write-Error 'Node.js is required to run the release merge executor tests.'
    exit 2
}

$rawVersion = (& node --version).Trim()
if ($rawVersion -notmatch '^v(\d+)\.(\d+)\.(\d+)') {
    Write-Error "Unable to parse the Node.js version: $rawVersion"
    exit 2
}

$major = [int]$Matches[1]
$minor = [int]$Matches[2]

# Native TypeScript type stripping is unflagged from 22.18 and from 23.6. Between 22.6
# and 22.17, and between 23.0 and 23.5, it needs an explicit flag.
$nodeArguments = @()
if ($major -gt 23 -or ($major -eq 23 -and $minor -ge 6) -or ($major -eq 22 -and $minor -ge 18)) {
    # No flag required.
}
elseif (($major -eq 22 -and $minor -ge 6) -or ($major -eq 23)) {
    $nodeArguments += '--experimental-strip-types'
}
else {
    Write-Error "Node.js 22.18 or newer is required for native TypeScript execution; found $rawVersion."
    exit 2
}

if ($ListBlocked) {
    Write-Host 'Unexecuted live control-plane fixtures (human-controlled control plane absent):'
    Write-Host '  tests/live-control-plane.blocked.test.ts'
    exit 0
}

$nodeArguments += '--test'

Write-Host "Running the release merge executor test suite with Node $rawVersion."
Push-Location -LiteralPath $moduleRoot
try {
    & node @nodeArguments
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

if ($exitCode -ne 0) {
    Write-Error "Release merge executor tests failed with exit code $exitCode."
    exit $exitCode
}

Write-Host 'Release merge executor tests passed. The executor remains dormant; no merge was performed, requested, or simulated.'
exit 0
