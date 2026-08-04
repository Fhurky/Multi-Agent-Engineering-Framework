[CmdletBinding()]
param(
    [string]$Role,
    [string]$Llm,
    [string]$BranchName,
    [string]$BaseRef = 'origin/main',
    [string]$SettingsPath = 'config/agents/settings.yaml',
    [switch]$IncludeWorkingTree
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

if ([string]::IsNullOrWhiteSpace($BranchName)) {
    $BranchName = (& git branch --show-current).Trim()
}

if ($BranchName -match '^agent/([^/]+)/([^/]+)/(.+)$') {
    if ([string]::IsNullOrWhiteSpace($Llm)) { $Llm = $Matches[1] }
    if ([string]::IsNullOrWhiteSpace($Role)) { $Role = $Matches[2] }
}
elseif ([string]::IsNullOrWhiteSpace($Role) -or [string]::IsNullOrWhiteSpace($Llm)) {
    throw "Branch '$BranchName' does not identify an agent LLM and role."
}

$assignment = Assert-AgentAssignment -Role $Role -Llm $Llm -SettingsPath $SettingsPath
& git rev-parse --verify --quiet $BaseRef | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Base ref does not exist: $BaseRef"
}

$changedFiles = @(& git diff --name-only --diff-filter=ACMRTUXB "$BaseRef...HEAD")
if ($LASTEXITCODE -ne 0) {
    throw "Unable to compare HEAD with $BaseRef."
}

if ($IncludeWorkingTree) {
    $changedFiles += @(& git diff --name-only)
    $changedFiles += @(& git diff --cached --name-only)
    $changedFiles += @(& git ls-files --others --exclude-standard)
}

$changedFiles = @($changedFiles | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Sort-Object -Unique)
$violations = @()
$protectedPatterns = @(
    'AGENTS.md',
    'CLAUDE.md',
    '.agents/**',
    'config/agents/settings.yaml',
    'scripts/orchestration/**',
    'scripts/ci/validate-framework.ps1',
    'scripts/ci/test-orchestration.ps1',
    'scripts/security/check-repository.ps1',
    '.github/workflows/ci.yml',
    '.github/workflows/security.yml',
    '.github/CODEOWNERS',
    '.githooks/**',
    'scripts/setup/install-git-hooks.ps1',
    '.gitattributes',
    '.gitignore',
    '.worktreeinclude'
)
foreach ($path in $changedFiles) {
    if (Test-PathInWriteScope -Path $path -WriteScope $protectedPatterns) {
        $violations += "$path (human-controlled governance path)"
        continue
    }
    if (-not (Test-PathInWriteScope -Path $path -WriteScope $assignment.WriteScope)) {
        $violations += $path
    }
}

if ($violations.Count -gt 0) {
    $details = $violations -join [Environment]::NewLine
    throw "Role '$($assignment.Role)' changed files outside its write scope:$([Environment]::NewLine)$details"
}

[pscustomobject]@{
    valid = $true
    branch = $BranchName
    role = $assignment.Role
    llm = $assignment.Llm
    changed_files = $changedFiles.Count
}
