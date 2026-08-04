Set-StrictMode -Version Latest

function Get-RepositoryRoot {
    $root = & git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($root)) {
        throw 'This command must run inside a Git worktree.'
    }

    return [System.IO.Path]::GetFullPath(($root | Select-Object -First 1).Trim())
}

function Get-AgentAssignments {
    param(
        [string]$SettingsPath = 'config/agents/settings.yaml'
    )

    $repositoryRoot = Get-RepositoryRoot
    if (-not [System.IO.Path]::IsPathRooted($SettingsPath)) {
        $SettingsPath = Join-Path $repositoryRoot $SettingsPath
    }

    if (-not (Test-Path -LiteralPath $SettingsPath -PathType Leaf)) {
        throw "Agent settings file not found: $SettingsPath"
    }

    $lines = Get-Content -LiteralPath $SettingsPath -Encoding UTF8
    $insideAssignments = $false
    $current = $null
    $collectWriteScope = $false
    $assignments = @()

    foreach ($line in $lines) {
        if ($line -match '^assignments:\s*$') {
            $insideAssignments = $true
            continue
        }

        if (-not $insideAssignments) {
            continue
        }

        if ($line -match '^  ([a-z][a-z0-9_-]*):\s*$') {
            if ($null -ne $current) {
                $assignments += [pscustomobject]$current
            }

            $current = [ordered]@{
                Role = $Matches[1]
                Title = $null
                Enabled = $false
                Llm = $null
                TaskQueue = $null
                WriteScope = @()
            }
            $collectWriteScope = $false
            continue
        }

        if ($null -eq $current) {
            continue
        }

        if ($line -match '^    title:\s*(.+?)\s*$') {
            $current.Title = $Matches[1].Trim('"', "'")
            $collectWriteScope = $false
        }
        elseif ($line -match '^    enabled:\s*(true|false)\s*$') {
            $current.Enabled = $Matches[1] -eq 'true'
            $collectWriteScope = $false
        }
        elseif ($line -match '^    llm:\s*(.*?)\s*$') {
            $value = $Matches[1].Trim('"', "'")
            $current.Llm = if ($value -eq 'null' -or $value -eq '~' -or $value -eq '') { $null } else { $value }
            $collectWriteScope = $false
        }
        elseif ($line -match '^    task_queue:\s*(.+?)\s*$') {
            $current.TaskQueue = $Matches[1].Trim('"', "'")
            $collectWriteScope = $false
        }
        elseif ($line -match '^    write_scope:\s*$') {
            $collectWriteScope = $true
        }
        elseif ($collectWriteScope -and $line -match '^      -\s+(.+?)\s*$') {
            $current.WriteScope += $Matches[1].Trim('"', "'")
        }
        elseif ($line -match '^\S') {
            break
        }
    }

    if ($null -ne $current) {
        $assignments += [pscustomobject]$current
    }

    return $assignments
}

function Assert-AgentAssignment {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Role,

        [Parameter(Mandatory = $true)]
        [string]$Llm,

        [string]$SettingsPath = 'config/agents/settings.yaml'
    )

    $normalizedRole = $Role.Trim().ToLowerInvariant()
    $normalizedLlm = $Llm.Trim().ToLowerInvariant()
    $assignment = Get-AgentAssignments -SettingsPath $SettingsPath |
        Where-Object { $_.Role -eq $normalizedRole } |
        Select-Object -First 1

    if ($null -eq $assignment) {
        throw "Unknown role: $normalizedRole"
    }
    if (-not $assignment.Enabled) {
        throw "Role is disabled: $normalizedRole"
    }
    if ([string]::IsNullOrWhiteSpace($assignment.Llm)) {
        throw "Role '$normalizedRole' is unassigned. Set its llm value in config/agents/settings.yaml."
    }
    if ($assignment.Llm -cne $normalizedLlm) {
        throw "Role '$normalizedRole' is assigned to '$($assignment.Llm)', not '$normalizedLlm'."
    }

    return $assignment
}

function ConvertTo-SafeSegment {
    param([Parameter(Mandatory = $true)][string]$Value)

    $segment = $Value.Trim().ToLowerInvariant() -replace '[^a-z0-9._-]+', '-'
    $segment = $segment.Trim('-', '.')
    if ([string]::IsNullOrWhiteSpace($segment)) {
        throw "Value cannot be converted to a safe Git segment: $Value"
    }
    return $segment
}

function Get-AgentBranchName {
    param(
        [Parameter(Mandatory = $true)][string]$TaskId,
        [Parameter(Mandatory = $true)][string]$Role,
        [Parameter(Mandatory = $true)][string]$Llm
    )

    $safeTask = ConvertTo-SafeSegment -Value $TaskId
    $safeRole = ConvertTo-SafeSegment -Value $Role
    $safeLlm = ConvertTo-SafeSegment -Value $Llm
    return "agent/$safeLlm/$safeRole/$safeTask"
}

function Get-SharedLockDirectory {
    $repositoryRoot = Get-RepositoryRoot
    $commonDirectory = (& git rev-parse --git-common-dir).Trim()
    if (-not [System.IO.Path]::IsPathRooted($commonDirectory)) {
        $commonDirectory = Join-Path $repositoryRoot $commonDirectory
    }

    $commonDirectory = [System.IO.Path]::GetFullPath($commonDirectory)
    return Join-Path $commonDirectory 'agent-locks'
}

function Convert-GlobToRegex {
    param([Parameter(Mandatory = $true)][string]$Pattern)

    $normalized = $Pattern.Replace('\', '/').TrimStart('/')
    $escaped = [regex]::Escape($normalized)
    $escaped = $escaped.Replace('\*\*', '.*')
    $escaped = $escaped.Replace('\*', '[^/]*')
    $escaped = $escaped.Replace('\?', '[^/]')
    return '^' + $escaped + '$'
}

function Test-PathInWriteScope {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string[]]$WriteScope
    )

    $normalizedPath = $Path.Replace('\', '/').TrimStart('/')
    foreach ($pattern in $WriteScope) {
        if ($normalizedPath -match (Convert-GlobToRegex -Pattern $pattern)) {
            return $true
        }
    }
    return $false
}
