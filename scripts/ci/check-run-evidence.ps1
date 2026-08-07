# Pure evaluation library for target-bound continuous-integration evidence.
#
# Nothing in this file performs input or output. It converts an already fetched
# GitHub check-run payload into a verdict, so the verdict can be covered by
# deterministic offline tests without contacting GitHub. All GitHub access lives
# in assert-check-runs.ps1 and is read-only.
#
# Stable result codes. Callers and logs may depend on these literals.
#
#   OK                    Every required context exists and concluded success.
#   E_ARGUMENT            Caller supplied an unusable argument.
#   E_CONFIG              The required-checks configuration is missing or invalid.
#   E_REPOSITORY          The target repository could not be resolved.
#   E_GH_MISSING          The GitHub CLI is unavailable.
#   E_API                 A read-only GitHub API call failed.
#   E_COMMIT_UNRESOLVED   The commit identifier did not resolve to one commit.
#   E_NO_CHECK_RUNS       The commit carries zero check runs. Absent CI is not passing CI.
#   E_MISSING_CONTEXT     A required context has no check run on this commit.
#   E_AMBIGUOUS_CONTEXT   A required context has several check runs that disagree.
#   E_INCOMPLETE          A required context exists but has not completed.
#   E_CONCLUSION          A required context completed with a conclusion other than success.
#   E_UNTRUSTED_APP       A required context was reported by an unexpected application.

Set-StrictMode -Version Latest

$script:CheckEvidenceExitCodes = @{
    'OK'                  = 0
    'E_ARGUMENT'          = 2
    'E_CONFIG'            = 2
    'E_REPOSITORY'        = 2
    'E_GH_MISSING'        = 3
    'E_API'               = 3
    'E_COMMIT_UNRESOLVED' = 3
    'E_NO_CHECK_RUNS'     = 4
    'E_MISSING_CONTEXT'   = 4
    'E_AMBIGUOUS_CONTEXT' = 4
    'E_INCOMPLETE'        = 4
    'E_CONCLUSION'        = 4
    'E_UNTRUSTED_APP'     = 4
}

function Get-CheckEvidenceExitCode {
    <#
        .SYNOPSIS
        Maps a stable result code to its process exit code.
        Any unknown code is treated as a failure rather than as success.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Code
    )

    if ($script:CheckEvidenceExitCodes.ContainsKey($Code)) {
        return [int]$script:CheckEvidenceExitCodes[$Code]
    }

    return 4
}

function Get-CheckEvidenceProperty {
    <#
        .SYNOPSIS
        Reads a property from a ConvertFrom-Json object without failing under
        Set-StrictMode when the property is absent or JSON null.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $InputObject,

        [Parameter(Mandatory = $true)]
        [string]$Name,

        [AllowNull()]
        $Default = $null
    )

    if ($null -eq $InputObject) {
        return $Default
    }

    $property = $InputObject.PSObject.Properties[$Name]
    if ($null -eq $property -or $null -eq $property.Value) {
        return $Default
    }

    return $property.Value
}

function Read-RequiredCheckConfiguration {
    <#
        .SYNOPSIS
        Loads and validates the required-checks configuration.

        .OUTPUTS
        An object with Ok, Code, Message and Configuration. Configuration carries
        RequiredAppSlug and RequiredContexts, each of which has WorkflowPath, Job
        and Context.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return [pscustomobject]@{
            Ok            = $false
            Code          = 'E_CONFIG'
            Message       = "Required-checks configuration not found: $Path"
            Configuration = $null
        }
    }

    try {
        $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
        $parsed = $raw | ConvertFrom-Json
    }
    catch {
        return [pscustomobject]@{
            Ok            = $false
            Code          = 'E_CONFIG'
            Message       = "Required-checks configuration is not valid JSON: $Path"
            Configuration = $null
        }
    }

    $appSlug = [string](Get-CheckEvidenceProperty -InputObject $parsed -Name 'required_app_slug' -Default '')
    if ([string]::IsNullOrWhiteSpace($appSlug)) {
        return [pscustomobject]@{
            Ok            = $false
            Code          = 'E_CONFIG'
            Message       = "Required-checks configuration has no required_app_slug: $Path"
            Configuration = $null
        }
    }

    $rawContexts = @(Get-CheckEvidenceProperty -InputObject $parsed -Name 'required_contexts' -Default @())
    if ($rawContexts.Count -eq 0) {
        return [pscustomobject]@{
            Ok            = $false
            Code          = 'E_CONFIG'
            Message       = "Required-checks configuration declares no required_contexts: $Path"
            Configuration = $null
        }
    }

    $contexts = @()
    foreach ($entry in $rawContexts) {
        $workflowPath = [string](Get-CheckEvidenceProperty -InputObject $entry -Name 'workflow_path' -Default '')
        $job = [string](Get-CheckEvidenceProperty -InputObject $entry -Name 'job' -Default '')

        if ([string]::IsNullOrWhiteSpace($workflowPath) -or [string]::IsNullOrWhiteSpace($job)) {
            return [pscustomobject]@{
                Ok            = $false
                Code          = 'E_CONFIG'
                Message       = "Every required context needs a non-empty workflow_path and job: $Path"
                Configuration = $null
            }
        }

        $contexts += [pscustomobject]@{
            WorkflowPath = $workflowPath
            Job          = $job
            Context      = "$workflowPath / $job"
        }
    }

    return [pscustomobject]@{
        Ok            = $true
        Code          = 'OK'
        Message       = ''
        Configuration = [pscustomobject]@{
            RequiredAppSlug  = $appSlug
            RequiredContexts = $contexts
        }
    }
}

function ConvertTo-CheckRunEvidence {
    <#
        .SYNOPSIS
        Normalizes raw check-run objects, joining each one to the workflow run
        that produced it so a context can be identified by workflow file rather
        than by job name alone.

        .PARAMETER CheckRun
        Objects shaped like the elements of GET /repos/{owner}/{repo}/commits/{ref}/check-runs.

        .PARAMETER WorkflowRun
        Objects shaped like the elements of GET /repos/{owner}/{repo}/actions/runs?head_sha={sha}.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [array]$CheckRun,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [array]$WorkflowRun
    )

    $bySuite = @{}
    foreach ($run in $WorkflowRun) {
        $suiteId = Get-CheckEvidenceProperty -InputObject $run -Name 'check_suite_id' -Default $null
        if ($null -eq $suiteId) {
            continue
        }

        $key = [string]$suiteId
        if (-not $bySuite.ContainsKey($key)) {
            $bySuite[$key] = $run
        }
    }

    $evidence = @()
    foreach ($check in $CheckRun) {
        $suite = Get-CheckEvidenceProperty -InputObject $check -Name 'check_suite' -Default $null
        $suiteId = Get-CheckEvidenceProperty -InputObject $suite -Name 'id' -Default $null
        $app = Get-CheckEvidenceProperty -InputObject $check -Name 'app' -Default $null

        $workflowName = ''
        $workflowPath = ''
        $workflowRunId = ''
        if ($null -ne $suiteId -and $bySuite.ContainsKey([string]$suiteId)) {
            $matched = $bySuite[[string]$suiteId]
            $workflowName = [string](Get-CheckEvidenceProperty -InputObject $matched -Name 'name' -Default '')
            $workflowPath = [string](Get-CheckEvidenceProperty -InputObject $matched -Name 'path' -Default '')
            $workflowRunId = [string](Get-CheckEvidenceProperty -InputObject $matched -Name 'id' -Default '')
        }

        $jobName = [string](Get-CheckEvidenceProperty -InputObject $check -Name 'name' -Default '')
        if ([string]::IsNullOrWhiteSpace($workflowName)) {
            $context = $jobName
        }
        else {
            $context = "$workflowName / $jobName"
        }

        $evidence += [pscustomobject]@{
            CheckRunId    = [string](Get-CheckEvidenceProperty -InputObject $check -Name 'id' -Default '')
            Job           = $jobName
            Status        = [string](Get-CheckEvidenceProperty -InputObject $check -Name 'status' -Default '')
            Conclusion    = [string](Get-CheckEvidenceProperty -InputObject $check -Name 'conclusion' -Default '')
            AppSlug       = [string](Get-CheckEvidenceProperty -InputObject $app -Name 'slug' -Default '')
            CheckSuiteId  = [string]$suiteId
            WorkflowName  = $workflowName
            WorkflowPath  = $workflowPath
            WorkflowRunId = $workflowRunId
            Context       = $context
            HtmlUrl       = [string](Get-CheckEvidenceProperty -InputObject $check -Name 'html_url' -Default '')
        }
    }

    return , @($evidence)
}

function Test-RequiredCheckEvidence {
    <#
        .SYNOPSIS
        Decides whether a commit carries passing, target-bound check-run evidence
        for every configured required context.

        .DESCRIPTION
        The verdict fails closed. Zero check runs is a failure, a missing context
        is a failure, an unfinished context is a failure, and every conclusion
        other than success is a failure. When one required context is reported by
        several check runs, the verdict passes only if they unanimously report a
        trusted, completed, successful result; a disagreement is unsafe and is
        reported as E_AMBIGUOUS_CONTEXT rather than resolved by preference.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Repository,

        [Parameter(Mandatory = $true)]
        [string]$Commit,

        [Parameter(Mandatory = $true)]
        $Configuration,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [array]$Evidence
    )

    $required = @($Configuration.RequiredContexts)
    $requiredAppSlug = [string]$Configuration.RequiredAppSlug
    $allEvidence = @($Evidence)
    $contextResults = @()
    $matchedIds = @{}
    $failureCode = ''

    if ($allEvidence.Count -eq 0) {
        foreach ($requirement in $required) {
            $contextResults += [pscustomobject]@{
                Context      = $requirement.Context
                WorkflowPath = $requirement.WorkflowPath
                Job          = $requirement.Job
                State        = 'fail'
                Code         = 'E_NO_CHECK_RUNS'
                Message      = 'The commit carries zero check runs, so no target-bound result supports this context. Absent continuous integration is not passing continuous integration.'
                CheckRunIds  = @()
                Status       = ''
                Conclusion   = ''
            }
        }

        return [pscustomobject]@{
            Passed              = $false
            Code                = 'E_NO_CHECK_RUNS'
            Repository          = $Repository
            Commit              = $Commit
            CheckRunTotal       = 0
            RequiredTotal       = $required.Count
            MatchedTotal        = 0
            UnmatchedCheckRuns  = 0
            ContextResults      = $contextResults
        }
    }

    foreach ($requirement in $required) {
        $contextRuns = @(
            $allEvidence | Where-Object {
                $_.WorkflowPath -ieq $requirement.WorkflowPath -and $_.Job -ieq $requirement.Job
            }
        )

        if ($contextRuns.Count -eq 0) {
            $contextResults += [pscustomobject]@{
                Context      = $requirement.Context
                WorkflowPath = $requirement.WorkflowPath
                Job          = $requirement.Job
                State        = 'fail'
                Code         = 'E_MISSING_CONTEXT'
                Message      = "No check run on this commit was produced by job '$($requirement.Job)' of workflow '$($requirement.WorkflowPath)'."
                CheckRunIds  = @()
                Status       = ''
                Conclusion   = ''
            }

            if ([string]::IsNullOrEmpty($failureCode)) {
                $failureCode = 'E_MISSING_CONTEXT'
            }
            continue
        }

        foreach ($match in $contextRuns) {
            $matchedIds[$match.CheckRunId] = $true
        }

        # Report the context under the name GitHub itself shows for it, so the
        # evidence reads the same way as the pull request's own check list.
        $displayContext = $requirement.Context
        if (-not [string]::IsNullOrWhiteSpace($contextRuns[0].Context)) {
            $displayContext = $contextRuns[0].Context
        }

        $ids = @($contextRuns | ForEach-Object { $_.CheckRunId })
        $statuses = @($contextRuns | ForEach-Object { $_.Status } | Sort-Object -Unique)
        $conclusions = @($contextRuns | ForEach-Object { $_.Conclusion } | Sort-Object -Unique)

        $untrusted = @($contextRuns | Where-Object { $_.AppSlug -ine $requiredAppSlug })
        $incomplete = @($contextRuns | Where-Object { $_.Status -ine 'completed' })
        $unsuccessful = @($contextRuns | Where-Object { $_.Conclusion -ine 'success' })

        $failing = @($contextRuns | Where-Object {
            $_.AppSlug -ine $requiredAppSlug -or $_.Status -ine 'completed' -or $_.Conclusion -ine 'success'
        })

        # More than one check run answers this context and they do not agree.
        # There is no safe rule for choosing a winner, so refuse to choose.
        if ($contextRuns.Count -gt 1 -and $failing.Count -gt 0 -and $failing.Count -lt $contextRuns.Count) {
            $contextResults += [pscustomobject]@{
                Context      = $displayContext
                WorkflowPath = $requirement.WorkflowPath
                Job          = $requirement.Job
                State        = 'fail'
                Code         = 'E_AMBIGUOUS_CONTEXT'
                Message      = "$($contextRuns.Count) check runs answer this context on the same commit and they disagree, so no single authoritative result exists."
                CheckRunIds  = $ids
                Status       = ($statuses -join ',')
                Conclusion   = ($conclusions -join ',')
            }

            if ([string]::IsNullOrEmpty($failureCode)) {
                $failureCode = 'E_AMBIGUOUS_CONTEXT'
            }
            continue
        }

        if ($untrusted.Count -gt 0) {
            $observedApps = @($untrusted | ForEach-Object { $_.AppSlug } | Sort-Object -Unique) -join ','
            $contextResults += [pscustomobject]@{
                Context      = $displayContext
                WorkflowPath = $requirement.WorkflowPath
                Job          = $requirement.Job
                State        = 'fail'
                Code         = 'E_UNTRUSTED_APP'
                Message      = "This context was reported by application '$observedApps' rather than by the required application '$requiredAppSlug'."
                CheckRunIds  = $ids
                Status       = ($statuses -join ',')
                Conclusion   = ($conclusions -join ',')
            }

            if ([string]::IsNullOrEmpty($failureCode)) {
                $failureCode = 'E_UNTRUSTED_APP'
            }
            continue
        }

        if ($incomplete.Count -gt 0) {
            $contextResults += [pscustomobject]@{
                Context      = $displayContext
                WorkflowPath = $requirement.WorkflowPath
                Job          = $requirement.Job
                State        = 'fail'
                Code         = 'E_INCOMPLETE'
                Message      = "This context has not completed; its status is '$($statuses -join ',')'. An unfinished check is not a passing check."
                CheckRunIds  = $ids
                Status       = ($statuses -join ',')
                Conclusion   = ($conclusions -join ',')
            }

            if ([string]::IsNullOrEmpty($failureCode)) {
                $failureCode = 'E_INCOMPLETE'
            }
            continue
        }

        if ($unsuccessful.Count -gt 0) {
            $observed = @($unsuccessful | ForEach-Object {
                if ([string]::IsNullOrEmpty($_.Conclusion)) { 'none' } else { $_.Conclusion }
            } | Sort-Object -Unique) -join ','
            $contextResults += [pscustomobject]@{
                Context      = $displayContext
                WorkflowPath = $requirement.WorkflowPath
                Job          = $requirement.Job
                State        = 'fail'
                Code         = 'E_CONCLUSION'
                Message      = "This context concluded '$observed' rather than 'success'. Only a success conclusion is accepted."
                CheckRunIds  = $ids
                Status       = ($statuses -join ',')
                Conclusion   = ($conclusions -join ',')
            }

            if ([string]::IsNullOrEmpty($failureCode)) {
                $failureCode = 'E_CONCLUSION'
            }
            continue
        }

        $message = 'This context completed with conclusion success.'
        if ($contextRuns.Count -gt 1) {
            $message = "$($contextRuns.Count) check runs answer this context and all completed with conclusion success."
        }

        $contextResults += [pscustomobject]@{
            Context      = $displayContext
            WorkflowPath = $requirement.WorkflowPath
            Job          = $requirement.Job
            State        = 'pass'
            Code         = 'OK'
            Message      = $message
            CheckRunIds  = $ids
            Status       = ($statuses -join ',')
            Conclusion   = ($conclusions -join ',')
        }
    }

    $passed = $false
    $code = $failureCode
    if ([string]::IsNullOrEmpty($failureCode)) {
        $passed = $true
        $code = 'OK'
    }

    return [pscustomobject]@{
        Passed             = $passed
        Code               = $code
        Repository         = $Repository
        Commit             = $Commit
        CheckRunTotal      = $allEvidence.Count
        RequiredTotal      = $required.Count
        MatchedTotal       = $matchedIds.Keys.Count
        UnmatchedCheckRuns = ($allEvidence.Count - $matchedIds.Keys.Count)
        ContextResults     = $contextResults
    }
}
