<#
    .SYNOPSIS
    Deterministic offline coverage for the target-bound check-run assertion.

    .DESCRIPTION
    Every case runs against fixtures held in this file. Nothing here contacts
    GitHub, reads a credential, or depends on the state of any pull request, so
    the assertion's failure behaviour stays provable even when the network, the
    GitHub API, or GitHub Actions itself is unavailable.

    The command-line cases exercise only the validation that happens before the
    first API call, so they too remain offline.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'check-run-evidence.ps1')

$script:Failures = @()
$script:Passed = 0

function Assert-Equal {
    param(
        [Parameter(Mandatory = $true)][string]$Case,
        [Parameter(Mandatory = $true)][string]$Property,
        [AllowNull()][AllowEmptyString()]$Expected,
        [AllowNull()][AllowEmptyString()]$Actual
    )

    if ([string]$Expected -eq [string]$Actual) {
        $script:Passed++
        return
    }

    $script:Failures += "$Case : expected $Property '$Expected' but observed '$Actual'."
}

function New-FixtureCheckRun {
    param(
        [Parameter(Mandatory = $true)][string]$Id,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Status,
        [AllowNull()][AllowEmptyString()][string]$Conclusion,
        [Parameter(Mandatory = $true)][string]$SuiteId,
        [string]$App = 'github-actions'
    )

    $conclusionValue = $null
    if (-not [string]::IsNullOrEmpty($Conclusion)) {
        $conclusionValue = $Conclusion
    }

    return [pscustomobject]@{
        id          = $Id
        name        = $Name
        status      = $Status
        conclusion  = $conclusionValue
        html_url    = "https://github.example/checks/$Id"
        app         = [pscustomobject]@{ slug = $App }
        check_suite = [pscustomobject]@{ id = $SuiteId }
    }
}

function New-FixtureWorkflowRun {
    param(
        [Parameter(Mandatory = $true)][string]$Id,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$SuiteId
    )

    return [pscustomobject]@{
        id             = $Id
        name           = $Name
        path           = $Path
        check_suite_id = $SuiteId
    }
}

$script:CiWorkflowRun = New-FixtureWorkflowRun -Id '900' -Name 'CI' -Path '.github/workflows/ci.yml' -SuiteId '100'
$script:SecurityWorkflowRun = New-FixtureWorkflowRun -Id '901' -Name 'Security' -Path '.github/workflows/security.yml' -SuiteId '101'
$script:DuplicateCiWorkflowRun = New-FixtureWorkflowRun -Id '902' -Name 'CI' -Path '.github/workflows/ci.yml' -SuiteId '102'
$script:BaselineWorkflowRuns = @($script:CiWorkflowRun, $script:SecurityWorkflowRun, $script:DuplicateCiWorkflowRun)

function Invoke-EvidenceCase {
    param(
        [Parameter(Mandatory = $true)][string]$Case,
        [Parameter(Mandatory = $true)][AllowEmptyCollection()][array]$CheckRun,
        [AllowEmptyCollection()][array]$WorkflowRun = $script:BaselineWorkflowRuns,
        [Parameter(Mandatory = $true)]$Configuration
    )

    $evidence = ConvertTo-CheckRunEvidence -CheckRun @($CheckRun) -WorkflowRun @($WorkflowRun)
    return Test-RequiredCheckEvidence `
        -Repository 'example/repository' `
        -Commit '1111111111111111111111111111111111111111' `
        -Configuration $Configuration `
        -Evidence $evidence
}

# --- Configuration cases -----------------------------------------------------

$repositoryConfigPath = Join-Path $PSScriptRoot 'required-checks.json'
$repositoryConfig = Read-RequiredCheckConfiguration -Path $repositoryConfigPath
Assert-Equal -Case 'repository configuration loads' -Property 'Ok' -Expected $true -Actual $repositoryConfig.Ok
Assert-Equal -Case 'repository configuration loads' -Property 'RequiredContexts.Count' -Expected 2 -Actual @($repositoryConfig.Configuration.RequiredContexts).Count
Assert-Equal -Case 'repository configuration loads' -Property 'RequiredAppSlug' -Expected 'github-actions' -Actual $repositoryConfig.Configuration.RequiredAppSlug
Assert-Equal -Case 'repository configuration loads' -Property 'first workflow_path' -Expected '.github/workflows/ci.yml' -Actual @($repositoryConfig.Configuration.RequiredContexts)[0].WorkflowPath
Assert-Equal -Case 'repository configuration loads' -Property 'first job' -Expected 'validate' -Actual @($repositoryConfig.Configuration.RequiredContexts)[0].Job
Assert-Equal -Case 'repository configuration loads' -Property 'second workflow_path' -Expected '.github/workflows/security.yml' -Actual @($repositoryConfig.Configuration.RequiredContexts)[1].WorkflowPath
Assert-Equal -Case 'repository configuration loads' -Property 'second job' -Expected 'security' -Actual @($repositoryConfig.Configuration.RequiredContexts)[1].Job

$configuration = $repositoryConfig.Configuration

$temporaryRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("check-run-evidence-tests-" + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temporaryRoot -Force | Out-Null

try {
    $missingPath = Join-Path $temporaryRoot 'absent.json'
    $missing = Read-RequiredCheckConfiguration -Path $missingPath
    Assert-Equal -Case 'missing configuration' -Property 'Code' -Expected 'E_CONFIG' -Actual $missing.Code

    $malformedPath = Join-Path $temporaryRoot 'malformed.json'
    Set-Content -LiteralPath $malformedPath -Value '{ this is not json' -Encoding UTF8
    $malformed = Read-RequiredCheckConfiguration -Path $malformedPath
    Assert-Equal -Case 'malformed configuration' -Property 'Code' -Expected 'E_CONFIG' -Actual $malformed.Code

    $emptyPath = Join-Path $temporaryRoot 'empty-contexts.json'
    Set-Content -LiteralPath $emptyPath -Value '{ "required_app_slug": "github-actions", "required_contexts": [] }' -Encoding UTF8
    $empty = Read-RequiredCheckConfiguration -Path $emptyPath
    Assert-Equal -Case 'configuration without required contexts' -Property 'Code' -Expected 'E_CONFIG' -Actual $empty.Code

    $partialPath = Join-Path $temporaryRoot 'partial-context.json'
    Set-Content -LiteralPath $partialPath -Value '{ "required_app_slug": "github-actions", "required_contexts": [ { "workflow_path": ".github/workflows/ci.yml" } ] }' -Encoding UTF8
    $partial = Read-RequiredCheckConfiguration -Path $partialPath
    Assert-Equal -Case 'configuration with a context that has no job' -Property 'Code' -Expected 'E_CONFIG' -Actual $partial.Code

    $noAppPath = Join-Path $temporaryRoot 'no-app.json'
    Set-Content -LiteralPath $noAppPath -Value '{ "required_contexts": [ { "workflow_path": ".github/workflows/ci.yml", "job": "validate" } ] }' -Encoding UTF8
    $noApp = Read-RequiredCheckConfiguration -Path $noAppPath
    Assert-Equal -Case 'configuration without a required application' -Property 'Code' -Expected 'E_CONFIG' -Actual $noApp.Code

    # --- Zero check runs -----------------------------------------------------

    $zero = Invoke-EvidenceCase -Case 'zero' -CheckRun @() -Configuration $configuration
    Assert-Equal -Case 'zero check runs' -Property 'Code' -Expected 'E_NO_CHECK_RUNS' -Actual $zero.Code
    Assert-Equal -Case 'zero check runs' -Property 'Passed' -Expected $false -Actual $zero.Passed
    Assert-Equal -Case 'zero check runs' -Property 'CheckRunTotal' -Expected 0 -Actual $zero.CheckRunTotal
    Assert-Equal -Case 'zero check runs' -Property 'ContextResults.Count' -Expected 2 -Actual @($zero.ContextResults).Count

    # --- The passing shape ---------------------------------------------------

    $passingRuns = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '100'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $passing = Invoke-EvidenceCase -Case 'passing' -CheckRun $passingRuns -Configuration $configuration
    Assert-Equal -Case 'both contexts successful' -Property 'Code' -Expected 'OK' -Actual $passing.Code
    Assert-Equal -Case 'both contexts successful' -Property 'Passed' -Expected $true -Actual $passing.Passed
    Assert-Equal -Case 'both contexts successful' -Property 'MatchedTotal' -Expected 2 -Actual $passing.MatchedTotal
    Assert-Equal -Case 'both contexts successful' -Property 'UnmatchedCheckRuns' -Expected 0 -Actual $passing.UnmatchedCheckRuns
    Assert-Equal -Case 'both contexts successful' -Property 'first context name' -Expected 'CI / validate' -Actual @($passing.ContextResults)[0].Context

    # --- A required context is absent ----------------------------------------

    $missingContext = Invoke-EvidenceCase -Case 'missing' -CheckRun @($passingRuns[0]) -Configuration $configuration
    Assert-Equal -Case 'security context absent' -Property 'Code' -Expected 'E_MISSING_CONTEXT' -Actual $missingContext.Code
    Assert-Equal -Case 'security context absent' -Property 'Passed' -Expected $false -Actual $missingContext.Passed
    Assert-Equal -Case 'security context absent' -Property 'failing context state' -Expected 'fail' -Actual @($missingContext.ContextResults)[1].State
    Assert-Equal -Case 'security context absent' -Property 'passing context state' -Expected 'pass' -Actual @($missingContext.ContextResults)[0].State

    # --- Every conclusion other than success ---------------------------------

    $rejectedConclusions = @('failure', 'cancelled', 'timed_out', 'action_required', 'neutral', 'skipped', 'stale', 'startup_failure')
    foreach ($conclusion in $rejectedConclusions) {
        $runs = @(
            (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion $conclusion -SuiteId '100'),
            (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
        )
        $rejected = Invoke-EvidenceCase -Case $conclusion -CheckRun $runs -Configuration $configuration
        Assert-Equal -Case "conclusion '$conclusion' is rejected" -Property 'Code' -Expected 'E_CONCLUSION' -Actual $rejected.Code
        Assert-Equal -Case "conclusion '$conclusion' is rejected" -Property 'Passed' -Expected $false -Actual $rejected.Passed
    }

    $noConclusionRuns = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion '' -SuiteId '100'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $noConclusion = Invoke-EvidenceCase -Case 'no conclusion' -CheckRun $noConclusionRuns -Configuration $configuration
    Assert-Equal -Case 'completed without any conclusion is rejected' -Property 'Code' -Expected 'E_CONCLUSION' -Actual $noConclusion.Code

    # --- Unfinished checks ----------------------------------------------------

    foreach ($status in @('queued', 'in_progress', 'waiting', 'pending', 'requested')) {
        $runs = @(
            (New-FixtureCheckRun -Id '1' -Name 'validate' -Status $status -Conclusion '' -SuiteId '100'),
            (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
        )
        $incomplete = Invoke-EvidenceCase -Case $status -CheckRun $runs -Configuration $configuration
        Assert-Equal -Case "status '$status' is rejected" -Property 'Code' -Expected 'E_INCOMPLETE' -Actual $incomplete.Code
        Assert-Equal -Case "status '$status' is rejected" -Property 'Passed' -Expected $false -Actual $incomplete.Passed
    }

    # --- Duplicate check runs answering one context ---------------------------

    $agreeingDuplicates = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '100'),
        (New-FixtureCheckRun -Id '3' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '102'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $agreeing = Invoke-EvidenceCase -Case 'agreeing duplicates' -CheckRun $agreeingDuplicates -Configuration $configuration
    Assert-Equal -Case 'duplicate successful check runs are safe' -Property 'Code' -Expected 'OK' -Actual $agreeing.Code
    Assert-Equal -Case 'duplicate successful check runs are safe' -Property 'Passed' -Expected $true -Actual $agreeing.Passed
    Assert-Equal -Case 'duplicate successful check runs are safe' -Property 'MatchedTotal' -Expected 3 -Actual $agreeing.MatchedTotal

    $conflictingDuplicates = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '100'),
        (New-FixtureCheckRun -Id '3' -Name 'validate' -Status 'completed' -Conclusion 'failure' -SuiteId '102'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $conflicting = Invoke-EvidenceCase -Case 'conflicting duplicates' -CheckRun $conflictingDuplicates -Configuration $configuration
    Assert-Equal -Case 'disagreeing duplicate conclusions are unsafe' -Property 'Code' -Expected 'E_AMBIGUOUS_CONTEXT' -Actual $conflicting.Code
    Assert-Equal -Case 'disagreeing duplicate conclusions are unsafe' -Property 'Passed' -Expected $false -Actual $conflicting.Passed

    $unfinishedDuplicates = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '100'),
        (New-FixtureCheckRun -Id '3' -Name 'validate' -Status 'in_progress' -Conclusion '' -SuiteId '102'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $unfinished = Invoke-EvidenceCase -Case 'unfinished duplicate' -CheckRun $unfinishedDuplicates -Configuration $configuration
    Assert-Equal -Case 'a duplicate that is still running is unsafe' -Property 'Code' -Expected 'E_AMBIGUOUS_CONTEXT' -Actual $unfinished.Code

    $unanimousFailures = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'cancelled' -SuiteId '100'),
        (New-FixtureCheckRun -Id '3' -Name 'validate' -Status 'completed' -Conclusion 'cancelled' -SuiteId '102'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $unanimous = Invoke-EvidenceCase -Case 'unanimous duplicate failure' -CheckRun $unanimousFailures -Configuration $configuration
    Assert-Equal -Case 'duplicates that agree on failure report the conclusion' -Property 'Code' -Expected 'E_CONCLUSION' -Actual $unanimous.Code

    # --- Context identity ------------------------------------------------------

    $wrongWorkflowRuns = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '101'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $wrongWorkflow = Invoke-EvidenceCase -Case 'wrong workflow' -CheckRun $wrongWorkflowRuns -Configuration $configuration
    Assert-Equal -Case 'a job name alone does not satisfy a context' -Property 'Code' -Expected 'E_MISSING_CONTEXT' -Actual $wrongWorkflow.Code

    $unknownSuiteRuns = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '999'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $unknownSuite = Invoke-EvidenceCase -Case 'unknown suite' -CheckRun $unknownSuiteRuns -Configuration $configuration
    Assert-Equal -Case 'a check run with no resolvable workflow does not satisfy a context' -Property 'Code' -Expected 'E_MISSING_CONTEXT' -Actual $unknownSuite.Code

    $untrustedRuns = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '100' -App 'some-other-app'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101')
    )
    $untrusted = Invoke-EvidenceCase -Case 'untrusted app' -CheckRun $untrustedRuns -Configuration $configuration
    Assert-Equal -Case 'a context reported by another application is rejected' -Property 'Code' -Expected 'E_UNTRUSTED_APP' -Actual $untrusted.Code

    $withExtras = @(
        (New-FixtureCheckRun -Id '1' -Name 'validate' -Status 'completed' -Conclusion 'success' -SuiteId '100'),
        (New-FixtureCheckRun -Id '2' -Name 'security' -Status 'completed' -Conclusion 'success' -SuiteId '101'),
        (New-FixtureCheckRun -Id '4' -Name 'coverage' -Status 'completed' -Conclusion 'neutral' -SuiteId '100')
    )
    $extras = Invoke-EvidenceCase -Case 'extra checks' -CheckRun $withExtras -Configuration $configuration
    Assert-Equal -Case 'an unrequired check does not change the verdict' -Property 'Code' -Expected 'OK' -Actual $extras.Code
    Assert-Equal -Case 'an unrequired check does not change the verdict' -Property 'UnmatchedCheckRuns' -Expected 1 -Actual $extras.UnmatchedCheckRuns

    # --- Exit code mapping ------------------------------------------------------

    Assert-Equal -Case 'exit code mapping' -Property 'OK' -Expected 0 -Actual (Get-CheckEvidenceExitCode -Code 'OK')
    Assert-Equal -Case 'exit code mapping' -Property 'E_ARGUMENT' -Expected 2 -Actual (Get-CheckEvidenceExitCode -Code 'E_ARGUMENT')
    Assert-Equal -Case 'exit code mapping' -Property 'E_CONFIG' -Expected 2 -Actual (Get-CheckEvidenceExitCode -Code 'E_CONFIG')
    Assert-Equal -Case 'exit code mapping' -Property 'E_REPOSITORY' -Expected 2 -Actual (Get-CheckEvidenceExitCode -Code 'E_REPOSITORY')
    Assert-Equal -Case 'exit code mapping' -Property 'E_API' -Expected 3 -Actual (Get-CheckEvidenceExitCode -Code 'E_API')
    Assert-Equal -Case 'exit code mapping' -Property 'E_GH_MISSING' -Expected 3 -Actual (Get-CheckEvidenceExitCode -Code 'E_GH_MISSING')
    Assert-Equal -Case 'exit code mapping' -Property 'E_COMMIT_UNRESOLVED' -Expected 3 -Actual (Get-CheckEvidenceExitCode -Code 'E_COMMIT_UNRESOLVED')
    foreach ($code in @('E_NO_CHECK_RUNS', 'E_MISSING_CONTEXT', 'E_AMBIGUOUS_CONTEXT', 'E_INCOMPLETE', 'E_CONCLUSION', 'E_UNTRUSTED_APP')) {
        Assert-Equal -Case 'exit code mapping' -Property $code -Expected 4 -Actual (Get-CheckEvidenceExitCode -Code $code)
    }
    Assert-Equal -Case 'exit code mapping' -Property 'unknown code fails closed' -Expected 4 -Actual (Get-CheckEvidenceExitCode -Code 'E_SOMETHING_NEW')

    # --- Command-line validation, still offline ----------------------------------

    $assertScript = Join-Path $PSScriptRoot 'assert-check-runs.ps1'
    $shell = (Get-Process -Id $PID).Path

    & $shell -NoProfile -File $assertScript -Commit 'not-a-commit' | Out-Null
    Assert-Equal -Case 'command line rejects a non-hexadecimal commit' -Property 'exit code' -Expected 2 -Actual $LASTEXITCODE

    & $shell -NoProfile -File $assertScript -Commit 'abc' | Out-Null
    Assert-Equal -Case 'command line rejects a commit that is too short' -Property 'exit code' -Expected 2 -Actual $LASTEXITCODE

    & $shell -NoProfile -File $assertScript -Commit 'ec533fb' -ConfigurationPath $missingPath | Out-Null
    Assert-Equal -Case 'command line rejects a missing configuration' -Property 'exit code' -Expected 2 -Actual $LASTEXITCODE

    & $shell -NoProfile -File $assertScript -Commit 'ec533fb' -Repository 'not a repository' | Out-Null
    Assert-Equal -Case 'command line rejects an unusable repository' -Property 'exit code' -Expected 2 -Actual $LASTEXITCODE
}
finally {
    Remove-Item -LiteralPath $temporaryRoot -Recurse -Force -ErrorAction SilentlyContinue
}

if ($script:Failures.Count -gt 0) {
    $script:Failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Check-run evidence assertion checks passed: $($script:Passed) assertions."
exit 0
