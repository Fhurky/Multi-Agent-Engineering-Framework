[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$findings = @()
$trackedFiles = @(& git ls-files)

foreach ($trackedFile in $trackedFiles) {
    $normalized = $trackedFile.Replace('\', '/')
    $name = [System.IO.Path]::GetFileName($normalized)
    if ($normalized -eq '.env.example') {
        continue
    }
    if ($name -eq '.env' -or $name.StartsWith('.env.') -or $name -match '\.(pem|key|p12|pfx)$') {
        $findings += "Forbidden tracked secret-bearing filename: $normalized"
    }
}

$secretPatterns = @(
    'AKIA[0-9A-Z]{16}',
    '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'gh[pousr]_[A-Za-z0-9]{36,}',
    'sk-[A-Za-z0-9]{20,}'
)

foreach ($pattern in $secretPatterns) {
    $matchedFiles = @(& git grep -l -I -E -e $pattern -- . 2>$null)
    if ($LASTEXITCODE -notin @(0, 1)) {
        throw "Secret scan command failed for one pattern."
    }
    foreach ($matchedFile in $matchedFiles) {
        $findings += "Possible secret pattern in tracked file: $matchedFile"
    }
}

$findings = @($findings | Sort-Object -Unique)
if ($findings.Count -gt 0) {
    $findings | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host 'Repository security checks passed.'
exit 0
