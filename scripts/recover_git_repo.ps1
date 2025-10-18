
param(
    [Parameter(Mandatory=$true)]
    [string]$SourceRepoPath,

    [string]$BackupPath = "C:\\temp\\Capstone-Project.git.backup",
    [string]$ClonePath  = "C:\\Users\\Arvin Urayan\\Documents\\Git\\Capstone-Project-rescue",
    [string]$LogFile    = "C:\\temp\\git-recover-log.txt"
)

function Log {
    param([string]$Message)
    $time = (Get-Date).ToString('s')
    $line = "$time - $Message"
    $line | Tee-Object -FilePath $LogFile -Append
}

# Start
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git not found in PATH. Please install Git or add it to PATH before running this script.";
    exit 2
}

Log "Starting recovery script"
Log "SourceRepoPath = $SourceRepoPath"
Log "BackupPath = $BackupPath"
Log "ClonePath = $ClonePath"
Log "LogFile = $LogFile"

# Validate source
if (-not (Test-Path $SourceRepoPath)) {
    Log "ERROR: Source path does not exist: $SourceRepoPath"
    Write-Error "Source path does not exist: $SourceRepoPath"
    exit 3
}

# Create parent dir for backup
$backupParent = Split-Path $BackupPath -Parent
if (-not (Test-Path $backupParent)) { New-Item -ItemType Directory -Path $backupParent -Force | Out-Null }

Log "Creating a backup copy (robocopy) - this may take a while for large repos"
robocopy $SourceRepoPath $BackupPath /MIR /COPYALL | Tee-Object -FilePath $LogFile -Append

# Run fsck on the backup
Log "Running git fsck on backup"
$fsckCmd = "git --git-dir=`"$BackupPath`" fsck --full --no-reflogs"
Log "Running: $fsckCmd"
$fsckOutput = & git --git-dir="$BackupPath" fsck --full --no-reflogs 2>&1
$fsckOutput | Tee-Object -FilePath $LogFile -Append

# Parse missing hashes (40-hex chars)
$missingHashes = @()
foreach ($line in $fsckOutput) {
    if ($line -match '([0-9a-f]{40})') {
        $missingHashes += $Matches[1]
    }
}
$missingHashes = $missingHashes | Select-Object -Unique
if ($missingHashes.Count -gt 0) {
    Log "Found missing/corrupt hashes:"
    $missingHashes | ForEach-Object { Log "  $_" }
} else {
    Log "No missing object hashes reported by fsck (or fsck output empty)."
}

# Attempt conservative maintenance on the backup
Log "Running reflog expire, gc, repack on backup"
& git --git-dir="$BackupPath" reflog expire --expire=now --all 2>&1 | Tee-Object -FilePath $LogFile -Append
& git --git-dir="$BackupPath" gc --prune=now --aggressive 2>&1 | Tee-Object -FilePath $LogFile -Append
& git --git-dir="$BackupPath" repack -a -d --window=250 --depth=250 2>&1 | Tee-Object -FilePath $LogFile -Append
& git --git-dir="$BackupPath" prune 2>&1 | Tee-Object -FilePath $LogFile -Append

Log "Re-running fsck after maintenance"
$fsckOutput2 = & git --git-dir="$BackupPath" fsck --full --no-reflogs 2>&1
$fsckOutput2 | Tee-Object -FilePath $LogFile -Append

# Try cloning from backup into ClonePath
if (Test-Path $ClonePath) {
    Log "ClonePath already exists: $ClonePath -- will not overwrite. Exiting before clone."
    Write-Output "ClonePath already exists: $ClonePath -- please remove or choose another path and re-run the script."
    exit 4
}

Log "Attempting git clone from backup: $BackupPath -> $ClonePath"
$cloneOutput = & git clone "$BackupPath" "$ClonePath" 2>&1
$cloneOutput | Tee-Object -FilePath $LogFile -Append

# If clone succeeded, try checkout
if (Test-Path $ClonePath) {
    try {
        Log "Attempting to restore/checkout HEAD in clone"
        Push-Location $ClonePath
        $checkoutOutput = & git restore --source=HEAD :/ 2>&1
        if ($LASTEXITCODE -ne 0) {
            $checkoutOutput = & git checkout -f HEAD 2>&1
        }
        $checkoutOutput | Tee-Object -FilePath $LogFile -Append
        Pop-Location
    } catch {
        Log "Checkout attempt produced error: $_"
    }
} else {
    Log "Clone directory was not created. Skipping checkout step."
}

# If missing hashes found, attempt to locate which pack contains them in the backup
if ($missingHashes.Count -gt 0) {
    Log "Searching pack files in backup for missing hashes"
    $packDir = Join-Path $BackupPath "objects\pack"
    if (-not (Test-Path $packDir)) {
        Log "No pack directory present at $packDir"
    } else {
        Get-ChildItem -Path $packDir -Filter "*.idx" | ForEach-Object {
            $idx = $_.FullName
            Log "Running git verify-pack on index: $idx"
            $verify = & git verify-pack -v $idx 2>&1
            $verify | Tee-Object -FilePath $LogFile -Append
            foreach ($h in $missingHashes) {
                if ($verify -match $h) {
                    Log "Hash $h FOUND in index $idx"
                    # copy matching pack and index to clone if clone exists
                    if (Test-Path $ClonePath) {
                        $packName = ($idx -replace '\.idx$','.pack')
                        $targetPackDir = Join-Path $ClonePath ".git\objects\pack"
                        if (-not (Test-Path $targetPackDir)) { New-Item -ItemType Directory -Path $targetPackDir -Force | Out-Null }
                        Log "Copying $packName and $idx to clone pack dir"
                        Copy-Item -LiteralPath $packName -Destination $targetPackDir -Force
                        Copy-Item -LiteralPath $idx -Destination $targetPackDir -Force
                        Log "Running git index-pack and repack in clone"
                        Push-Location $ClonePath
                        & git index-pack -v ".git\objects\pack\$(Split-Path $packName -Leaf)" 2>&1 | Tee-Object -FilePath $LogFile -Append
                        & git repack -a -d 2>&1 | Tee-Object -FilePath $LogFile -Append
                        & git gc --prune=now 2>&1 | Tee-Object -FilePath $LogFile -Append
                        Pop-Location
                    }
                }
            }
        }
    }
}

# Final fsck on clone if exists
if (Test-Path $ClonePath) {
    Log "Final fsck on clone (if .git present)"
    $cloneGitDir = Join-Path $ClonePath ".git"
    if (Test-Path $cloneGitDir) {
        $finalFsck = & git --git-dir="$cloneGitDir" fsck --full --no-reflogs 2>&1
        $finalFsck | Tee-Object -FilePath $LogFile -Append
    } else {
        Log "Clone appears to be bare or not contain .git dir: $ClonePath"
    }
}

Log "Recovery script finished. Check $LogFile for details."
Write-Output "Recovery log written to: $LogFile"
