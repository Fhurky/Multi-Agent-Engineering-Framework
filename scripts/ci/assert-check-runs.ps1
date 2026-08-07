<#
    .SYNOPSIS
    Asserts that one immutable commit carries passing, target-bound GitHub check runs.

    .DESCRIPTION
    Reads the GitHub check runs recorded against exactly one commit identifier and
    fails unless every configured required context exists on that commit and every
    one of them completed with the conclusion 'success'.

    The command exists so that "absent continuous integration is not passing
    continuous integration" is enforced by an exit code instead of asserted in a
    report. It fails on zero check runs, on a missing required context, on a
    context that has not completed, on an unsafe disagreement between duplicate
    check runs, and on every conclusion other than 'success' -- including
    'failure', 'cancelled', 'timed_out', 'action_required', 'neutral', 'skipped',
    'stale' and 'startup_failure'.

    The command is strictly read-only. It issues GET requests only. It never
    creates, re-runs, approves, cancels, comments on, or otherwise modifies any
    GitHub resource, and it never prints a credential.

    .PARAMETER Commit
    The commit to judge, as 7 to 40 hexadecimal characters. The value is resolved
    to its full 40-character identifier and the resolved value is reported, so the
    evidence is bound to one immutable commit rather than to a branch head.

    .PARAMETER Repository
    Target repository as 'owner/name'. Defaults to the GITHUB_REPOSITORY
    environment variable, then to the 'origin' remote of the current worktree.

    .PARAMETER ConfigurationPath
    Path to the required-checks configuration. Defaults to required-checks.json
    beside this script.

    .PARAMETER Json
    Emit one machine-readable JSON object on standard output instead of the
    key/value report lines.

    .OUTPUTS
    Exit code 0 when every required context passed.
    Exit code 2 for a usage, configuration, or repository-resolution failure.
    Exit code 3 when the environment or the GitHub API prevented a verdict.
    Exit code 4 when the evidence itself failed.

    .EXAMPLE
    ./scripts/ci/assert-check-runs.ps1 -Commit ec533fb5bb0055675fb81f72057d5636f7867db3

    .EXAMPLE
    ./scripts/ci/assert-check-runs.ps1 -Commit 5e5fc8fe656b0e08a5337642447d7a81f83c4822 -Json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Commit,

    [string]$Repository,

    [string]$ConfigurationPath,

    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'check-run-evidence.ps1')

$script:ToolName = 'assert-check-runs'

function Write-EvidenceLine {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Output "$($script:ToolName) $Message"
}

function Exit-WithFailure {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Code,

        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    $exitCode = Get-CheckEvidenceExitCode -Code $Code

    if ($Json) {
        $payload = [ordered]@{
            tool       = $script:ToolName
            result     = 'fail'
            code       = $Code
            message    = $Message
            repository = $Repository
            commit     = $Commit
            exit_code  = $exitCode
        }
        Write-Output ([pscustomobject]$payload | ConvertTo-Json -Depth 6)
    }
    else {
        Write-EvidenceLine "result=fail code=$Code exit=$exitCode message=`"$Message`""
    }

    [Console]::Error.WriteLine("$($script:ToolName): $Code $Message")
    exit $exitCode
}

function Invoke-GitHubRead {
    <#
        .SYNOPSIS
        Performs one read-only GitHub API request. The HTTP method is fixed to GET
        so this helper cannot be reused to mutate GitHub state.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $raw = & gh api --method GET -H 'Accept: application/vnd.github+json' $Path
    if ($LASTEXITCODE -ne 0) {
        return [pscustomobject]@{ Ok = $false; Value = $null }
    }

    if ($null -eq $raw) {
        return [pscustomobject]@{ Ok = $false; Value = $null }
    }

    try {
        $text = (@($raw) -join "`n")
        return [pscustomobject]@{ Ok = $true; Value = ($text | ConvertFrom-Json) }
    }
    catch {
        return [pscustomobject]@{ Ok = $false; Value = $null }
    }
}

function Get-GitHubReadCollection {
    <#
        .SYNOPSIS
        Reads every page of a paginated GitHub collection endpoint and returns the
        named array property, concatenated across pages.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Property
    )

    $items = @()
    $page = 1
    $separator = '?'
    if ($Path.Contains('?')) {
        $separator = '&'
    }

    while ($true) {
        $response = Invoke-GitHubRead -Path ("$Path$separator" + "per_page=100&page=$page")
        if (-not $response.Ok) {
            return [pscustomobject]@{ Ok = $false; Items = @() }
        }

        $batch = @(Get-CheckEvidenceProperty -InputObject $response.Value -Name $Property -Default @())
        if ($batch.Count -eq 0) {
            break
        }

        $items += $batch

        $total = Get-CheckEvidenceProperty -InputObject $response.Value -Name 'total_count' -Default $null
        if ($null -ne $total -and $items.Count -ge [int]$total) {
            break
        }

        $page++
        if ($page -gt 20) {
            break
        }
    }

    return [pscustomobject]@{ Ok = $true; Items = @($items) }
}

function Resolve-TargetRepository {
    param(
        [AllowEmptyString()]
        [AllowNull()]
        [string]$Requested
    )

    if (-not [string]::IsNullOrWhiteSpace($Requested)) {
        return $Requested.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_REPOSITORY)) {
        return $env:GITHUB_REPOSITORY.Trim()
    }

    $remote = & git remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0 -or $null -eq $remote) {
        return ''
    }

    $url = (@($remote) -join '').Trim()
    if ($url -match '^(?:https?://[^/]+/|git@[^:]+:|ssh://git@[^/]+/)(?<owner>[^/]+)/(?<name>[^/]+?)(?:\.git)?/?$') {
        return "$($Matches['owner'])/$($Matches['name'])"
    }

    return ''
}

# --- Argument and environment validation ------------------------------------

$Commit = $Commit.Trim()
if ($Commit -notmatch '^[0-9a-fA-F]{7,40}$') {
    Exit-WithFailure -Code 'E_ARGUMENT' -Message "Commit must be 7 to 40 hexadecimal characters; received '$Commit'."
}

if ([string]::IsNullOrWhiteSpace($ConfigurationPath)) {
    $ConfigurationPath = Join-Path $PSScriptRoot 'required-checks.json'
}

$configuration = Read-RequiredCheckConfiguration -Path $ConfigurationPath
if (-not $configuration.Ok) {
    Exit-WithFailure -Code $configuration.Code -Message $configuration.Message
}

$Repository = Resolve-TargetRepository -Requested $Repository
if ($Repository -notmatch '^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$') {
    Exit-WithFailure -Code 'E_REPOSITORY' -Message "Could not resolve a target repository. Pass -Repository owner/name, or set GITHUB_REPOSITORY, or run inside a worktree whose 'origin' remote points at GitHub."
}

if ($null -eq (Get-Command -Name 'gh' -ErrorAction SilentlyContinue)) {
    Exit-WithFailure -Code 'E_GH_MISSING' -Message "The GitHub CLI 'gh' was not found on PATH. Install it and provide read access through GH_TOKEN or GITHUB_TOKEN."
}

# --- Bind the evidence to one immutable commit -------------------------------

$resolved = Invoke-GitHubRead -Path "repos/$Repository/commits/$Commit"
if (-not $resolved.Ok) {
    Exit-WithFailure -Code 'E_COMMIT_UNRESOLVED' -Message "Commit '$Commit' did not resolve to exactly one commit in $Repository, or the read-only API call was rejected. Confirm the identifier and that the session is authenticated for read access."
}

$resolvedSha = [string](Get-CheckEvidenceProperty -InputObject $resolved.Value -Name 'sha' -Default '')
if ([string]::IsNullOrWhiteSpace($resolvedSha) -or -not $resolvedSha.StartsWith($Commit, [System.StringComparison]::OrdinalIgnoreCase)) {
    Exit-WithFailure -Code 'E_COMMIT_UNRESOLVED' -Message "Identifier '$Commit' resolved to '$resolvedSha', which is not the same commit. Pass a full 40-character commit identifier."
}

# --- Read the target-bound evidence ------------------------------------------

$checkRunResponse = Get-GitHubReadCollection -Path "repos/$Repository/commits/$resolvedSha/check-runs?filter=latest" -Property 'check_runs'
if (-not $checkRunResponse.Ok) {
    Exit-WithFailure -Code 'E_API' -Message "Could not read the check runs of $resolvedSha in $Repository. No verdict was reached; this is not evidence that checks passed."
}

$workflowRunResponse = Get-GitHubReadCollection -Path "repos/$Repository/actions/runs?head_sha=$resolvedSha" -Property 'workflow_runs'
if (-not $workflowRunResponse.Ok) {
    Exit-WithFailure -Code 'E_API' -Message "Could not read the workflow runs of $resolvedSha in $Repository. No verdict was reached; this is not evidence that checks passed."
}

$evidence = ConvertTo-CheckRunEvidence -CheckRun @($checkRunResponse.Items) -WorkflowRun @($workflowRunResponse.Items)
$result = Test-RequiredCheckEvidence -Repository $Repository -Commit $resolvedSha -Configuration $configuration.Configuration -Evidence $evidence

# --- Report -------------------------------------------------------------------

$exitCode = Get-CheckEvidenceExitCode -Code $result.Code
$resultWord = 'fail'
if ($result.Passed) {
    $resultWord = 'pass'
}

if ($Json) {
    $payload = [ordered]@{
        tool                 = $script:ToolName
        result               = $resultWord
        code                 = $result.Code
        repository           = $result.Repository
        commit               = $result.Commit
        requested_commit     = $Commit
        check_runs_total     = $result.CheckRunTotal
        workflow_runs_total  = @($workflowRunResponse.Items).Count
        required_contexts    = $result.RequiredTotal
        matched_check_runs   = $result.MatchedTotal
        unmatched_check_runs = $result.UnmatchedCheckRuns
        contexts             = @($result.ContextResults | ForEach-Object {
                [ordered]@{
                    context       = $_.Context
                    workflow_path = $_.WorkflowPath
                    job           = $_.Job
                    state         = $_.State
                    code          = $_.Code
                    status        = $_.Status
                    conclusion    = $_.Conclusion
                    check_run_ids = @($_.CheckRunIds)
                    message       = $_.Message
                }
            })
        exit_code            = $exitCode
    }

    Write-Output ([pscustomobject]$payload | ConvertTo-Json -Depth 6)
}
else {
    Write-EvidenceLine "repository=$($result.Repository) commit=$($result.Commit) requested=$Commit"
    Write-EvidenceLine "check_runs_total=$($result.CheckRunTotal) workflow_runs_total=$(@($workflowRunResponse.Items).Count) required_contexts=$($result.RequiredTotal) matched_check_runs=$($result.MatchedTotal) unmatched_check_runs=$($result.UnmatchedCheckRuns)"

    foreach ($context in $result.ContextResults) {
        $ids = @($context.CheckRunIds) -join ','
        Write-EvidenceLine "context=`"$($context.Context)`" state=$($context.State) code=$($context.Code) status=`"$($context.Status)`" conclusion=`"$($context.Conclusion)`" check_run_ids=`"$ids`" message=`"$($context.Message)`""
    }

    Write-EvidenceLine "result=$resultWord code=$($result.Code) exit=$exitCode"
}

if (-not $result.Passed) {
    [Console]::Error.WriteLine("$($script:ToolName): $($result.Code) target-bound check-run evidence is missing or not successful for $($result.Commit) in $($result.Repository).")
}

exit $exitCode
