Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$Port = 3000
$Url = "http://localhost:$Port"
$PidFile = Join-Path $env:TEMP "tecendo-vozes.pid"
$OutLog = Join-Path $env:TEMP "tecendo-vozes.log"
$ErrLog = Join-Path $env:TEMP "tecendo-vozes.err.log"
$NoBrowser = ($env:TECENDO_VOZES_NO_BROWSER -eq "1")
$NoPause = ($env:TECENDO_VOZES_NO_PAUSE -eq "1")

function Get-NodeProcessesForProject {
  $matches = @()
  try {
    $procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop
    if ($procs) {
      foreach ($p in $procs) {
        if ($p.CommandLine -and ($p.CommandLine.IndexOf($ProjectDir, [StringComparison]::OrdinalIgnoreCase) -ge 0)) {
          $matches += $p
        }
      }
    }
  }
  catch {
    # CIM pode estar indisponivel em ambientes restritos; fallback via PID file
  }
  return $matches
}

function Get-TecendoPids {
  $pidSet = New-Object 'System.Collections.Generic.HashSet[int]'

  if (Test-Path $PidFile) {
    $raw = (Get-Content -Path $PidFile -ErrorAction SilentlyContinue | Out-String).Trim()
    $parsedPid = 0
    if ([int]::TryParse($raw, [ref]$parsedPid) -and $parsedPid -gt 0) {
      $existing = Get-Process -Id $parsedPid -ErrorAction SilentlyContinue
      if ($existing) {
        [void]$pidSet.Add($parsedPid)
      }
    }
  }

  $nodeProcs = Get-NodeProcessesForProject
  foreach ($np in $nodeProcs) {
    [void]$pidSet.Add([int]$np.ProcessId)
  }

  $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($listeners) {
    foreach ($conn in $listeners) {
      $ownerId = [int]$conn.OwningProcess
      if ($pidSet.Contains($ownerId)) {
        continue
      }
      try {
        $ownerProc = Get-CimInstance Win32_Process -Filter "ProcessId = $ownerId" -ErrorAction Stop
        if ($ownerProc) {
          $isChildOfTracked = $pidSet.Contains([int]$ownerProc.ParentProcessId)
          $matchesDir = ($ownerProc.CommandLine -and ($ownerProc.CommandLine.IndexOf($ProjectDir, [StringComparison]::OrdinalIgnoreCase) -ge 0))
          if ($isChildOfTracked -or $matchesDir) {
            [void]$pidSet.Add($ownerId)
          }
        }
      }
      catch {
        # Ignore CIM errors when inspecting listener owner
      }
    }
  }

  return @($pidSet)
}

function Stop-ProcessTree {
  param([int]$TargetPid)

  if (Get-Process -Id $TargetPid -ErrorAction SilentlyContinue) {
    & cmd /c "taskkill /PID $TargetPid /T /F >nul 2>&1"
  }
}

function Stop-TecendoServer {
  param([int[]]$Pids)

  Write-Host "Encerrando Tecendo Vozes..." -ForegroundColor Yellow

  foreach ($targetPid in $Pids) {
    Stop-ProcessTree -TargetPid $targetPid
  }

  $deadline = (Get-Date).AddSeconds(5)
  while ((Get-Date) -lt $deadline) {
    $remaining = @(Get-TecendoPids)
    if ($remaining.Count -eq 0) {
      break
    }
    Start-Sleep -Milliseconds 250
  }

  $survivors = @(Get-TecendoPids)
  foreach ($survPid in $survivors) {
    Stop-ProcessTree -TargetPid $survPid
    Stop-Process -Id $survPid -Force -ErrorAction SilentlyContinue
  }

  if (Test-Path $PidFile) {
    Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
  }

  Write-Host "[OK] Tecendo Vozes encerrado!" -ForegroundColor Green
  if (-not $NoPause) {
    Start-Sleep -Seconds 2
  }
  exit 0
}

function Start-TecendoServer {
  if (Test-Path $PidFile) {
    Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
  }

  $portListeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($portListeners) {
    $firstConn = @($portListeners)[0]
    Write-Host "[ERRO] A porta $Port ja esta em uso por outro processo (PID $($firstConn.OwningProcess))." -ForegroundColor Red
    exit 1
  }

  $nextBin = Join-Path $ProjectDir "node_modules\next\dist\bin\next"
  if (-not (Test-Path $nextBin)) {
    Write-Host "[ERRO] Dependencias nao encontradas ($nextBin). Execute 'npm install' primeiro." -ForegroundColor Red
    exit 1
  }

  $workerTarget = Join-Path $ProjectDir "public\maplibre-gl-worker.js"
  if (-not (Test-Path $workerTarget)) {
    $syncScript = Join-Path $ProjectDir "scripts\sync-maplibre-worker.mjs"
    if (Test-Path $syncScript) {
      Write-Host "Sincronizando worker do MapLibre..."
      & node $syncScript
      if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao sincronizar o worker do MapLibre." -ForegroundColor Red
        exit 1
      }
    }
  }

  Write-Host "Iniciando Tecendo Vozes..." -ForegroundColor Cyan

  $proc = Start-Process -FilePath "node" `
    -ArgumentList @("node_modules\next\dist\bin\next", "dev", "-p", "$Port") `
    -WorkingDirectory $ProjectDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -PassThru

  Set-Content -Path $PidFile -Value $proc.Id -Encoding Ascii

  $ready = $false
  $maxChecks = 90
  for ($i = 0; $i -lt $maxChecks; $i++) {
    $proc.Refresh()
    if ($proc.HasExited) {
      if (Test-Path $PidFile) {
        Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
      }
      Write-Host "[ERRO] O servidor falhou ao iniciar. Log: $ErrLog" -ForegroundColor Red
      if (Test-Path $ErrLog) {
        Get-Content -Path $ErrLog -Tail 20 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
      }
      exit 1
    }

    try {
      $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
        $ready = $true
        break
      }
    }
    catch {
      # Ainda compilando ou subindo a porta
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not $ready) {
    Stop-ProcessTree -TargetPid $proc.Id
    if (Test-Path $PidFile) {
      Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[ERRO] Tempo limite atingido ao iniciar o servidor. Log: $ErrLog" -ForegroundColor Red
    if (Test-Path $ErrLog) {
      Get-Content -Path $ErrLog -Tail 20 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
    }
    exit 1
  }

  Write-Host "[OK] Tecendo Vozes iniciado em $Url" -ForegroundColor Green
  Write-Host "Clique novamente no atalho para encerrar."

  if (-not $NoBrowser) {
    Start-Process $Url
  }

  if (-not $NoPause) {
    Start-Sleep -Seconds 2
  }
  exit 0
}

$activePids = @(Get-TecendoPids)
if ($activePids.Count -gt 0) {
  Stop-TecendoServer -Pids $activePids
}
else {
  Start-TecendoServer
}
