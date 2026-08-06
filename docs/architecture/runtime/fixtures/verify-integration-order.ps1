[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$IntegrationBase,

    [Parameter(Mandatory = $true)]
    [string]$CumulativeTarget,

    [string]$RejectedCumulativeTarget = '970b08125eaf6e5bfb7b24ec2a55238161b16eac',

    [string]$RejectedPredecessor = '6d145eb81033986361aba6454d10f52e5773f950'
)

$ErrorActionPreference = 'Stop'

function Resolve-Commit {
    param([Parameter(Mandatory = $true)][string]$Reference)

    $resolved = @(& git rev-parse --verify "$Reference^{commit}" 2>&1)
    if ($LASTEXITCODE -ne 0 -or $resolved.Count -ne 1) {
        throw "Cannot resolve commit '$Reference': $($resolved -join [Environment]::NewLine)"
    }

    return [string]$resolved[0]
}

function Resolve-Tree {
    param([Parameter(Mandatory = $true)][string]$Reference)

    $resolved = @(& git rev-parse --verify "$Reference^{tree}" 2>&1)
    if ($LASTEXITCODE -ne 0 -or $resolved.Count -ne 1) {
        throw "Cannot resolve tree for '$Reference': $($resolved -join [Environment]::NewLine)"
    }

    return [string]$resolved[0]
}

function Invoke-MergeTree {
    param(
        [Parameter(Mandatory = $true)][string]$Left,
        [Parameter(Mandatory = $true)][string]$Right
    )

    $lines = @(& git merge-tree --write-tree --messages $Left $Right 2>&1 | ForEach-Object { [string]$_ })
    $exitCode = $LASTEXITCODE
    return [pscustomobject]@{
        ExitCode = $exitCode
        Lines = $lines
    }
}

$baseCommit = Resolve-Commit -Reference $IntegrationBase
$targetCommit = Resolve-Commit -Reference $CumulativeTarget
$targetTree = Resolve-Tree -Reference $targetCommit

# The complete content-bearing architecture order contains exactly one cumulative target.
$contentSteps = @($targetCommit)
if ($contentSteps.Count -ne 1) {
    throw "The architecture content order must contain exactly one cumulative target."
}

$result = Invoke-MergeTree -Left $baseCommit -Right $contentSteps[0]
if ($result.ExitCode -ne 0) {
    throw "The cumulative architecture target conflicts with the integration base:`n$($result.Lines -join [Environment]::NewLine)"
}
if ($result.Lines.Count -lt 1 -or $result.Lines[0] -notmatch '^[0-9a-f]{40,64}$') {
    throw "merge-tree did not return a result tree identifier."
}

$resultTree = $result.Lines[0]
if ($resultTree -ne $targetTree) {
    throw "Complete-order tree mismatch: merge-tree produced $resultTree, expected $targetTree."
}

$legacyTarget = Resolve-Commit -Reference $RejectedCumulativeTarget
$legacyPredecessor = Resolve-Commit -Reference $RejectedPredecessor
$legacyResult = Invoke-MergeTree -Left $legacyTarget -Right $legacyPredecessor
if ($legacyResult.ExitCode -ne 1) {
    throw "The historical second-step probe must exit 1; actual exit was $($legacyResult.ExitCode)."
}

$expectedLegacyConflicts = @(
    'diagrams/architecture/runtime-components.md'
    'diagrams/architecture/runtime-sequences.md'
    'diagrams/architecture/runtime-state-machine.md'
    'docs/adr/0013-single-decision-recovery-reconciliation.md'
    'docs/adr/0019-durable-intent-receipts-for-side-effects.md'
    'docs/adr/0031-pre-dispatch-ingress-observer-and-collector.md'
    'docs/adr/0035-explicit-reconciliation-evidence-composition-boundary.md'
    'docs/adr/0036-target-tree-derived-architecture-fixtures-and-lineage-integration.md'
    'docs/adr/README.md'
    'docs/architecture/ARCHITECTURE.md'
    'docs/architecture/runtime/COMPONENT-BOUNDARIES.md'
    'docs/architecture/runtime/CRASH-RECOVERY.md'
    'docs/architecture/runtime/INTEGRATION-STRATEGY.md'
    'docs/architecture/runtime/INTERFACE-CONTRACTS.md'
    'docs/architecture/runtime/LEASES-AND-SCHEDULING.md'
    'docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md'
    'docs/architecture/runtime/PROVIDER-ADAPTERS.md'
    'docs/architecture/runtime/STATE-MACHINE.md'
    'docs/architecture/runtime/WORKSPACE-LIFECYCLE.md'
) | Sort-Object -Unique

$actualLegacyConflicts = @(
    foreach ($line in $legacyResult.Lines) {
        if ($line -match '^CONFLICT \([^)]+\): Merge conflict in (.+)$') {
            $Matches[1]
        }
    }
) | Sort-Object -Unique

$difference = @(Compare-Object -ReferenceObject $expectedLegacyConflicts -DifferenceObject $actualLegacyConflicts)
if ($difference.Count -ne 0) {
    throw "Historical conflict set changed:`n$($difference | Out-String)"
}

Write-Output "content_steps=$($contentSteps.Count)"
Write-Output "content_conflicts=0"
Write-Output "result_tree=$resultTree"
Write-Output "target_tree=$targetTree"
Write-Output "legacy_second_step_exit=$($legacyResult.ExitCode)"
Write-Output "legacy_conflicts=$($actualLegacyConflicts.Count)"
Write-Output 'legacy_conflict_set=exact'
Write-Output 'integration_order=PASS'
