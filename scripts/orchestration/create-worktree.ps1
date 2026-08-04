[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [Parameter(Mandatory = $true)]
    [string]$Role,

    [Parameter(Mandatory = $true)]
    [string]$Llm,

    [string]$BaseRef = 'origin/main',

    [string]$WorktreeRoot,

    [string]$SettingsPath = 'config/agents/settings.yaml'
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

$assignment = Assert-AgentAssignment -Role $Role -Llm $Llm -SettingsPath $SettingsPath
$repositoryRoot = Get-RepositoryRoot
$branch = Get-AgentBranchName -TaskId $TaskId -Role $assignment.Role -Llm $assignment.Llm

if ([string]::IsNullOrWhiteSpace($WorktreeRoot)) {
    $WorktreeRoot = Join-Path (Split-Path -Parent $repositoryRoot) 'multi-agent-worktrees'
}
elseif (-not [System.IO.Path]::IsPathRooted($WorktreeRoot)) {
    $WorktreeRoot = Join-Path $repositoryRoot $WorktreeRoot
}

$WorktreeRoot = [System.IO.Path]::GetFullPath($WorktreeRoot)
$worktreeName = ((ConvertTo-SafeSegment -Value $Llm) + '-' + (ConvertTo-SafeSegment -Value $Role) + '-' + (ConvertTo-SafeSegment -Value $TaskId))
$worktreePath = Join-Path $WorktreeRoot $worktreeName

& git rev-parse --verify --quiet $BaseRef | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Base ref does not exist: $BaseRef"
}

& git show-ref --verify --quiet "refs/heads/$branch"
if ($LASTEXITCODE -eq 0) {
    throw "Branch already exists: $branch"
}
if (Test-Path -LiteralPath $worktreePath) {
    throw "Worktree path already exists: $worktreePath"
}

New-Item -ItemType Directory -Path $WorktreeRoot -Force | Out-Null
& git worktree add -b $branch $worktreePath $BaseRef
if ($LASTEXITCODE -ne 0) {
    throw "Git could not create worktree: $worktreePath"
}

$includeFile = Join-Path $repositoryRoot '.worktreeinclude'
if (Test-Path -LiteralPath $includeFile -PathType Leaf) {
    foreach ($rawEntry in Get-Content -LiteralPath $includeFile -Encoding UTF8) {
        $entry = $rawEntry.Trim()
        if ($entry -eq '' -or $entry.StartsWith('#')) {
            continue
        }
        if ($entry -match '[*?\[\]]') {
            throw "Wildcards are not allowed in .worktreeinclude: $entry"
        }

        $source = [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot $entry))
        if (-not $source.StartsWith($repositoryRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Entry escapes repository root: $entry"
        }
        if (-not (Test-Path -LiteralPath $source)) {
            throw "Included local path does not exist: $entry"
        }

        $destination = Join-Path $worktreePath $entry
        $destinationParent = Split-Path -Parent $destination
        if (-not (Test-Path -LiteralPath $destinationParent)) {
            New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
        }
        Copy-Item -LiteralPath $source -Destination $destination -Recurse
    }
}

[pscustomobject]@{
    task_id = $TaskId
    role = $assignment.Role
    llm = $assignment.Llm
    branch = $branch
    worktree = $worktreePath
    next_step = "Set-Location '$worktreePath'"
}
