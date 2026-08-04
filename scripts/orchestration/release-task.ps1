[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$TaskId,

    [Parameter(Mandatory = $true)]
    [string]$Role,

    [Parameter(Mandatory = $true)]
    [string]$Llm,

    [string]$SettingsPath = 'config/agents/settings.yaml',

    [switch]$Force
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

$assignment = Assert-AgentAssignment -Role $Role -Llm $Llm -SettingsPath $SettingsPath
$lockPath = Join-Path (Get-SharedLockDirectory) ((ConvertTo-SafeSegment -Value $TaskId) + '.json')
if (-not (Test-Path -LiteralPath $lockPath -PathType Leaf)) {
    throw "Task is not locked: $TaskId"
}

$owner = Get-Content -Raw -LiteralPath $lockPath -Encoding UTF8 | ConvertFrom-Json
$runtimeDirectory = Join-Path (Get-RepositoryRoot) '.agent-runtime'
$tokenPath = Join-Path $runtimeDirectory (((ConvertTo-SafeSegment -Value $TaskId) + '.json.token'))
if (-not $Force) {
    if ($owner.role -ne $assignment.Role -or $owner.llm -ne $assignment.Llm) {
        throw "Task is owned by role '$($owner.role)' using '$($owner.llm)'."
    }
    if (-not (Test-Path -LiteralPath $tokenPath -PathType Leaf)) {
        throw 'This worktree does not hold the release token for the task. Use -Force only for human-verified stale-lock recovery.'
    }
    $sessionId = (Get-Content -Raw -LiteralPath $tokenPath -Encoding UTF8).Trim()
    if ($sessionId -ne $owner.session_id) {
        throw 'The local release token does not match the active task-lock session.'
    }
}

Remove-Item -LiteralPath $lockPath -Force
if (Test-Path -LiteralPath $tokenPath -PathType Leaf) {
    Remove-Item -LiteralPath $tokenPath -Force
}
[pscustomobject]@{
    released = $true
    task_id = $TaskId
    role = $owner.role
    llm = $owner.llm
    session_id = $owner.session_id
}
