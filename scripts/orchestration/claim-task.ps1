[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [Parameter(Mandatory = $true)]
    [string]$Role,

    [Parameter(Mandatory = $true)]
    [string]$Llm,

    [string]$SettingsPath = 'config/agents/settings.yaml'
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

$assignment = Assert-AgentAssignment -Role $Role -Llm $Llm -SettingsPath $SettingsPath
$repositoryRoot = Get-RepositoryRoot
$expectedBranch = Get-AgentBranchName -TaskId $TaskId -Role $assignment.Role -Llm $assignment.Llm
$currentBranch = (& git branch --show-current).Trim()

if ($currentBranch -ne $expectedBranch) {
    throw "Task must be claimed on branch '$expectedBranch'. Current branch: '$currentBranch'."
}

$primaryLine = & git worktree list --porcelain |
    Where-Object { $_ -match '^worktree ' } |
    Select-Object -First 1
$primaryWorktree = [System.IO.Path]::GetFullPath($primaryLine.Substring(9))
if ($repositoryRoot -eq $primaryWorktree) {
    throw 'Agent tasks cannot run in the primary worktree. Create an isolated worktree first.'
}

$lockDirectory = Get-SharedLockDirectory
New-Item -ItemType Directory -Path $lockDirectory -Force | Out-Null
$lockName = (ConvertTo-SafeSegment -Value $TaskId) + '.json'
$lockPath = Join-Path $lockDirectory $lockName

$metadata = [ordered]@{
    task_id = $TaskId
    role = $assignment.Role
    llm = $assignment.Llm
    branch = $currentBranch
    worktree = $repositoryRoot
    process_id = $PID
    claimed_at_utc = [DateTime]::UtcNow.ToString('o')
}
$json = $metadata | ConvertTo-Json -Depth 4

$stream = $null
$writer = $null
try {
    $stream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
    try {
        $writer = New-Object System.IO.StreamWriter($stream, (New-Object System.Text.UTF8Encoding($false)))
        $writer.Write($json)
        $writer.Flush()
    }
    finally {
        if ($null -ne $writer) { $writer.Dispose() }
        elseif ($null -ne $stream) { $stream.Dispose() }
    }
}
catch [System.IO.IOException] {
    if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
        $owner = Get-Content -Raw -LiteralPath $lockPath -Encoding UTF8 | ConvertFrom-Json
        throw "Task '$TaskId' is already claimed by role '$($owner.role)' using '$($owner.llm)' in '$($owner.worktree)'."
    }
    throw
}

[pscustomobject]$metadata
