param(
    [Parameter(Mandatory=$true)]
    [string]$LocalRepoPath,

    [Parameter(Mandatory=$true)]
    [string]$BareRepoPath,

    [string]$BackupPath = "C:\\temp\\Capstone-Project.git.bare-backup",
    [string]$LogFile    = "C:\\temp\\git-sync-log.txt"
)

function Log { param([string]$m) $t=(Get-Date).ToString('s'); "$t - $m" | Tee-Object -FilePath $LogFile -Append }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "git not found in PATH"; exit 2 }

Log "Starting sync_to_bare.ps1"
Log "LocalRepoPath=$LocalRepoPath"
Log "BareRepoPath=$BareRepoPath"
Log "BackupPath=$BackupPath"
Log "LogFile=$LogFile"

if (-not (Test-Path $LocalRepoPath)) { Write-Error "Local repo path does not exist: $LocalRepoPath"; exit 3 }

# Backup existing bare if present
if (Test-Path $BareRepoPath) {
    Log "Backing up existing bare repo to $BackupPath"
    $backupParent = Split-Path $BackupPath -Parent
    if (-not (Test-Path $backupParent)) { New-Item -ItemType Directory -Path $backupParent -Force | Out-Null }
    robocopy $BareRepoPath $BackupPath /MIR /COPYALL | Tee-Object -FilePath $LogFile -Append
    Log "Backup completed"

    # Run fsck to confirm corruption
    Log "Running fsck on bare repo"
    $fsck = & git --git-dir="$BareRepoPath" fsck --full 2>&1
    $fsck | Tee-Object -FilePath $LogFile -Append
    if ($fsck -match "missing|broken|error|fatal") {
        Log "Bare repo appears corrupted — will recreate a fresh bare repo"
        # rename existing to .corrupt (keeping backup intact)
        try {
            $corruptName = $BareRepoPath + ".corrupt"
            if (Test-Path $corruptName) { Remove-Item -LiteralPath $corruptName -Recurse -Force -ErrorAction SilentlyContinue }
            Rename-Item -LiteralPath $BareRepoPath -NewName $corruptName -ErrorAction Stop
            Log "Renamed corrupted bare to $corruptName"
        } catch {
            Log "Failed to rename corrupted bare: $_"
            Write-Error "Failed to rename corrupted bare: $_"
            exit 4
        }
        Log "Creating new bare repo at $BareRepoPath"
        git init --bare $BareRepoPath 2>&1 | Tee-Object -FilePath $LogFile -Append
    } else {
        Log "Bare repo fsck OK (no obvious corruption). Will attempt push into it."
    }
} else {
    Log "Bare repo path does not exist. Creating bare repo"
    git init --bare $BareRepoPath 2>&1 | Tee-Object -FilePath $LogFile -Append
}

# Push from local repo (mirror)
Log "Pushing from local repo to bare (mirror)"
param(
    [Parameter(Mandatory=$true)]
    [string]$LocalRepoPath,

    [Parameter(Mandatory=$true)]
    [string]$BareRepoPath,

    [string]$BackupPath = "C:\\temp\\Capstone-Project.git.bare-backup",
    [string]$LogFile    = "C:\\temp\\git-sync-log.txt"
)

function Log { param([string]$m) $t=(Get-Date).ToString('s'); "$t - $m" | Tee-Object -FilePath $LogFile -Append }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Error "git not found in PATH"; exit 2 }

Log "Starting sync_to_bare.ps1"
Log "LocalRepoPath=$LocalRepoPath"
Log "BareRepoPath=$BareRepoPath"
Log "BackupPath=$BackupPath"
Log "LogFile=$LogFile"

if (-not (Test-Path $LocalRepoPath)) { Write-Error "Local repo path does not exist: $LocalRepoPath"; exit 3 }

# Backup existing bare if present
if (Test-Path $BareRepoPath) {
    Log "Backing up existing bare repo to $BackupPath"
    $backupParent = Split-Path $BackupPath -Parent
    if (-not (Test-Path $backupParent)) { New-Item -ItemType Directory -Path $backupParent -Force | Out-Null }
    robocopy $BareRepoPath $BackupPath /MIR /COPYALL | Tee-Object -FilePath $LogFile -Append
    Log "Backup completed"

    # Run fsck to confirm corruption
    Log "Running fsck on bare repo"
    $fsck = & git --git-dir="$BareRepoPath" fsck --full 2>&1
    $fsck | Tee-Object -FilePath $LogFile -Append
    if ($fsck -match "missing|broken|error|fatal") {
        Log "Bare repo appears corrupted — will recreate a fresh bare repo"
        # rename existing to .corrupt (keeping backup intact)
        try {
            $corruptName = $BareRepoPath + ".corrupt"
            if (Test-Path $corruptName) { Remove-Item -LiteralPath $corruptName -Recurse -Force -ErrorAction SilentlyContinue }
            Rename-Item -LiteralPath $BareRepoPath -NewName $corruptName -ErrorAction Stop
            Log "Renamed corrupted bare to $corruptName"
        } catch {
            Log "Failed to rename corrupted bare: $_"
            Write-Error "Failed to rename corrupted bare: $_"
            exit 4
        }
        Log "Creating new bare repo at $BareRepoPath"
        git init --bare $BareRepoPath 2>&1 | Tee-Object -FilePath $LogFile -Append
    } else {
        Log "Bare repo fsck OK (no obvious corruption). Will attempt push into it."
    }
} else {
    Log "Bare repo path does not exist. Creating bare repo"
    git init --bare $BareRepoPath 2>&1 | Tee-Object -FilePath $LogFile -Append
}

# Push from local repo (mirror)
Log "Pushing from local repo to bare (mirror)"
Push-Location $LocalRepoPath
try {
    # Remove any existing remote named 'workspace' to avoid surprises
    git remote remove workspace 2>$null | Out-Null
    git remote add workspace "$BareRepoPath" 2>&1 | Tee-Object -FilePath $LogFile -Append
    $pushOutput = & git push --mirror workspace 2>&1
    $pushOutput | Tee-Object -FilePath $LogFile -Append
    if ($LASTEXITCODE -ne 0) { Log "git push failed with exit code $LASTEXITCODE"; Throw "push failed" }
    Log "git push --mirror succeeded"
} catch {
    Log "Error during push: $_"
    Write-Error "Error during push: $_"
    Pop-Location
    exit 5
}
Pop-Location

# Verify the bare repo after push
Log "Running fsck on bare repo after push"
$fsck2 = & git --git-dir="$BareRepoPath" fsck --full 2>&1
$fsck2 | Tee-Object -FilePath $LogFile -Append

# Try a test clone into temp to verify checkout
$testClone = Join-Path (Split-Path $env:TEMP) "capstone-test-clone"
if (Test-Path $testClone) { Remove-Item -LiteralPath $testClone -Recurse -Force -ErrorAction SilentlyContinue }
Log "Attempting test clone: $BareRepoPath -> $testClone"
$cloneOut = & git clone "$BareRepoPath" "$testClone" 2>&1
$cloneOut | Tee-Object -FilePath $LogFile -Append

Log "Completed sync_to_bare.ps1 - check $LogFile for details"
Write-Output "Sync completed. Log: $LogFile"
