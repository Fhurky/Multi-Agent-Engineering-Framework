[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Role,

    [Parameter(Mandatory = $true)]
    [string]$Llm,

    [string]$SettingsPath = 'config/agents/settings.yaml'
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

$assignment = Assert-AgentAssignment -Role $Role -Llm $Llm -SettingsPath $SettingsPath
[pscustomobject]@{
    valid = $true
    role = $assignment.Role
    title = $assignment.Title
    llm = $assignment.Llm
    write_scope = $assignment.WriteScope
}
