[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
. (Join-Path (Split-Path -Parent $PSScriptRoot) 'orchestration/common.ps1')

$repositoryRoot = Get-RepositoryRoot
$errors = @()
$assignments = @(Get-AgentAssignments)
$requiredRoleFiles = @('ROLE.md', 'SYSTEM_PROMPT.md', 'CHECKLIST.md', 'OUTPUT_TEMPLATE.md')

if ($assignments.Count -eq 0) {
    $errors += 'No role assignments were found.'
}

$seenScopes = @{}
foreach ($assignment in $assignments) {
    $roleDirectory = Join-Path $repositoryRoot ('.agents/' + $assignment.Role)
    foreach ($name in $requiredRoleFiles) {
        $path = Join-Path $roleDirectory $name
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            $errors += "Missing role contract: .agents/$($assignment.Role)/$name"
        }
        elseif ((Get-Item -LiteralPath $path).Length -eq 0) {
            $errors += "Empty role contract: .agents/$($assignment.Role)/$name"
        }
    }

    if ($assignment.WriteScope.Count -eq 0) {
        $errors += "Role has no write scope: $($assignment.Role)"
    }

    if (-not [string]::IsNullOrWhiteSpace($assignment.Llm) -and $assignment.Llm -cnotmatch '^[a-z][a-z0-9_-]*$') {
        $errors += "Role '$($assignment.Role)' has an invalid llm value. Use a lowercase family name."
    }

    foreach ($scope in $assignment.WriteScope) {
        if ($seenScopes.ContainsKey($scope)) {
            $errors += "Exact write scope '$scope' is assigned to both '$($seenScopes[$scope])' and '$($assignment.Role)'."
        }
        else {
            $seenScopes[$scope] = $assignment.Role
        }
    }
}

$requiredFiles = @(
    '.agents/README.md',
    '.agents/ROUTING.md',
    '.agents/HANDOFF.md',
    '.agents/COMMUNICATION.md',
    '.agents/DEFINITION_OF_DONE.md',
    '.worktreeinclude',
    'templates/task.md',
    'scripts/ci/test-orchestration.ps1',
    '.githooks/pre-push',
    'scripts/setup/install-git-hooks.ps1',
    'AGENTS.md',
    'CLAUDE.md',
    '.agents/rules/project-governance.md'
)
foreach ($relativePath in $requiredFiles) {
    $path = Join-Path $repositoryRoot $relativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf) -or (Get-Item -LiteralPath $path).Length -eq 0) {
        $errors += "Required file is missing or empty: $relativePath"
    }
}

$trackedFiles = @(& git ls-files)
foreach ($trackedFile in $trackedFiles) {
    $normalized = $trackedFile.Replace('\', '/')
    $name = [System.IO.Path]::GetFileName($normalized)
    if ($normalized -eq '.env.example') {
        continue
    }
    if ($name -eq '.env' -or $name.StartsWith('.env.') -or $name -match '\.(pem|key|p12|pfx)$') {
        $errors += "Sensitive local file is tracked: $normalized"
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "Framework validation passed for $($assignments.Count) roles."
