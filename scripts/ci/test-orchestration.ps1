[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$orchestrationRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'orchestration'
$settingsPath = 'tests/fixtures/agent-settings.test.yaml'
. (Join-Path $orchestrationRoot 'common.ps1')

$backend = Assert-AgentAssignment -Role 'backend' -Llm 'claude' -SettingsPath $settingsPath
if ($backend.Role -ne 'backend' -or $backend.Llm -ne 'claude') {
    throw 'Expected backend test assignment was not resolved.'
}

$mismatchBlocked = $false
try {
    Assert-AgentAssignment -Role 'backend' -Llm 'gpt' -SettingsPath $settingsPath | Out-Null
}
catch {
    $mismatchBlocked = $_.Exception.Message -match "assigned to 'claude'"
}
if (-not $mismatchBlocked) {
    throw 'Mismatched LLM assignment was not blocked.'
}

$branch = Get-AgentBranchName -TaskId 'TASK-123' -Role 'backend' -Llm 'claude'
if ($branch -ne 'agent/claude/backend/task-123') {
    throw "Unexpected agent branch name: $branch"
}

if (-not (Test-PathInWriteScope -Path 'src/backend/service.ps1' -WriteScope $backend.WriteScope)) {
    throw 'Allowed backend path did not match its write scope.'
}
if (Test-PathInWriteScope -Path 'src/frontend/page.ts' -WriteScope $backend.WriteScope) {
    throw 'Frontend path incorrectly matched backend write scope.'
}

Write-Host 'Orchestration unit checks passed.'
