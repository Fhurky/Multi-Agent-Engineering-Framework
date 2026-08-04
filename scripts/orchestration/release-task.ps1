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
if (-not $Force -and ($owner.role -ne $assignment.Role -or $owner.llm -ne $assignment.Llm)) {
    throw "Task is owned by role '$($owner.role)' using '$($owner.llm)'."
}

Remove-Item -LiteralPath $lockPath -Force
[pscustomobject]@{
    released = $true
    task_id = $TaskId
    role = $owner.role
    llm = $owner.llm
}
