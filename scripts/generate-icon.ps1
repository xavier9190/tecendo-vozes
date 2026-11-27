param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "tecendo-vozes.ico")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $Radius * 2.0
  if ($d -le 0.5) {
    $path.AddRectangle((New-Object System.Drawing.RectangleF($X, $Y, $Width, $Height)))
    return $path
  }

  $path.AddArc($X, $Y, $d, $d, 180, 90)
  $path.AddArc($X + $Width - $d, $Y, $d, $d, 270, 90)
  $path.AddArc($X + $Width - $d, $Y + $Height - $d, $d, $d, 0, 90)
  $path.AddArc($X, $Y + $Height - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-PinPath {
  param(
    [float]$CenterX,
    [float]$CenterY,
    [float]$Radius,
    [float]$TipY
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $startAngleDeg = 145.0
  $sweepAngleDeg = 250.0
  $endAngleRad = (35.0 * [Math]::PI) / 180.0

  $cosA = [float][Math]::Cos($endAngleRad)
  $sinA = [float][Math]::Sin($endAngleRad)

  $rightX = $CenterX + ($Radius * $cosA)
  $rightY = $CenterY + ($Radius * $sinA)
  $leftX = $CenterX - ($Radius * $cosA)
  $leftY = $rightY

  $k1 = $Radius * 0.55

  $path.AddArc($CenterX - $Radius, $CenterY - $Radius, $Radius * 2.0, $Radius * 2.0, $startAngleDeg, $sweepAngleDeg)

  $c1x = $rightX - ($k1 * $sinA)
  $c1y = $rightY + ($k1 * $cosA)
  $c2x = $CenterX + ($Radius * 0.14)
  $c2y = $TipY - ($Radius * 0.28)
  $path.AddBezier($rightX, $rightY, $c1x, $c1y, $c2x, $c2y, $CenterX, $TipY)

  $c3x = $CenterX - ($Radius * 0.14)
  $c3y = $TipY - ($Radius * 0.28)
  $c4x = $leftX + ($k1 * $sinA)
  $c4y = $leftY + ($k1 * $cosA)
  $path.AddBezier($CenterX, $TipY, $c3x, $c3y, $c4x, $c4y, $leftX, $leftY)

  $path.CloseFigure()
  return $path
}

function Render-IconBitmap {
  param([int]$Size)

  $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  try {
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $pad = if ($Size -le 24) { [float]0.5 } else { [float]($Size * 0.04) }
    $tileSize = [float]$Size - (2.0 * $pad)
    $cornerRadius = [float]($tileSize * 0.22)

    $bgPath = New-RoundedRectPath -X $pad -Y $pad -Width $tileSize -Height $tileSize -Radius $cornerRadius
    $bgTop = [System.Drawing.ColorTranslator]::FromHtml("#5A3263")
    $bgBottom = [System.Drawing.ColorTranslator]::FromHtml("#3E1B45")
    $bgRect = New-Object System.Drawing.RectangleF($pad, $pad, $tileSize, $tileSize)
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, $bgTop, $bgBottom, 90.0)
    $g.FillPath($bgBrush, $bgPath)

    $borderWidth = [float][Math]::Max(1.0, $Size * 0.024)
    $inset = $pad + ($borderWidth * 0.5)
    $borderPath = New-RoundedRectPath -X $inset -Y $inset -Width ($Size - 2.0 * $inset) -Height ($Size - 2.0 * $inset) -Radius ([Math]::Max(1.0, $cornerRadius - $borderWidth * 0.5))
    $borderColor = [System.Drawing.Color]::FromArgb(120, 171, 139, 184)
    $borderPen = New-Object System.Drawing.Pen($borderColor, $borderWidth)
    $g.DrawPath($borderPen, $borderPath)

    $cx = [float]($Size * 0.50)
    $cy = [float]($Size * 0.40)
    $pr = [float]($Size * 0.245)
    $tipY = [float]($Size * 0.83)

    # Soft ground shadow under pin
    $shadowOvalBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(95, 22, 8, 28))
    $ovalW = [float]($pr * 1.45)
    $ovalH = [float][Math]::Max(1.5, $pr * 0.34)
    $g.FillEllipse($shadowOvalBrush, $cx - ($ovalW * 0.5), $tipY - ($ovalH * 0.35), $ovalW, $ovalH)

    # Subtle pin drop shadow
    $shadowShift = [float][Math]::Max(1.0, $Size * 0.025)
    $pinShadowPath = New-PinPath -CenterX $cx -CenterY ($cy + $shadowShift) -Radius $pr -TipY ($tipY + $shadowShift)
    $pinShadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(75, 22, 8, 28))
    $g.FillPath($pinShadowBrush, $pinShadowPath)

    # Coral to amber gradient map pin
    $pinPath = New-PinPath -CenterX $cx -CenterY $cy -Radius $pr -TipY $tipY
    $pinTop = [System.Drawing.ColorTranslator]::FromHtml("#EA4F29")
    $pinBottom = [System.Drawing.ColorTranslator]::FromHtml("#E89041")
    $pinBounds = New-Object System.Drawing.RectangleF(($cx - $pr), ($cy - $pr), ($pr * 2.0), ($tipY - ($cy - $pr)))
    $pinBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($pinBounds, $pinTop, $pinBottom, 90.0)
    $g.FillPath($pinBrush, $pinPath)

    # Subtle rim highlight on pin
    if ($Size -ge 32) {
      $pinRimPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(75, 249, 246, 231), [float][Math]::Max(1.0, $Size * 0.014))
      $g.DrawPath($pinRimPen, $pinPath)
      $pinRimPen.Dispose()
    }

    # Cream center emblem inside pin head
    $innerR = [float]($pr * 0.52)
    $creamColor = [System.Drawing.ColorTranslator]::FromHtml("#F9F6E7")
    $creamBrush = New-Object System.Drawing.SolidBrush($creamColor)
    $g.FillEllipse($creamBrush, $cx - $innerR, $cy - $innerR, $innerR * 2.0, $innerR * 2.0)

    # Woven / voice arc strokes inside the cream circle for >= 32px
    if ($Size -ge 32) {
      $arcWidth = [float][Math]::Max(1.2, $Size * 0.022)
      $deepColor = [System.Drawing.ColorTranslator]::FromHtml("#3E1B45")
      $midColor = [System.Drawing.ColorTranslator]::FromHtml("#79549E")

      $arcPen1 = New-Object System.Drawing.Pen($deepColor, $arcWidth)
      $arcPen1.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
      $arcPen1.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

      $arcPen2 = New-Object System.Drawing.Pen($midColor, [float][Math]::Max(1.0, $arcWidth * 0.85))
      $arcPen2.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
      $arcPen2.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

      # Center voice dot + two woven voice waves
      $dotR = [float][Math]::Max(1.2, $innerR * 0.22)
      $dotBrush = New-Object System.Drawing.SolidBrush($deepColor)
      $g.FillEllipse($dotBrush, $cx - $dotR, $cy - $dotR, $dotR * 2.0, $dotR * 2.0)

      $r1 = [float]($innerR * 0.52)
      $g.DrawArc($arcPen1, $cx - $r1, $cy - $r1, $r1 * 2.0, $r1 * 2.0, -45, 90)
      $g.DrawArc($arcPen1, $cx - $r1, $cy - $r1, $r1 * 2.0, $r1 * 2.0, 135, 90)

      $r2 = [float]($innerR * 0.78)
      $g.DrawArc($arcPen2, $cx - $r2, $cy - $r2, $r2 * 2.0, $r2 * 2.0, -35, 70)
      $g.DrawArc($arcPen2, $cx - $r2, $cy - $r2, $r2 * 2.0, $r2 * 2.0, 145, 70)

      $dotBrush.Dispose()
      $arcPen1.Dispose()
      $arcPen2.Dispose()
    }

    $creamBrush.Dispose()
    $pinBrush.Dispose()
    $pinPath.Dispose()
    $pinShadowBrush.Dispose()
    $pinShadowPath.Dispose()
    $shadowOvalBrush.Dispose()
    $borderPen.Dispose()
    $borderPath.Dispose()
    $bgBrush.Dispose()
    $bgPath.Dispose()
  }
  finally {
    $g.Dispose()
  }

  return $bmp
}

$sizes = @(256, 64, 48, 32, 16)
$frames = New-Object System.Collections.ArrayList

try {
  foreach ($sz in $sizes) {
    $bmp = Render-IconBitmap -Size $sz
    $ms = New-Object System.IO.MemoryStream
    try {
      $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
      $pngBytes = $ms.ToArray()
    }
    finally {
      $ms.Dispose()
      $bmp.Dispose()
    }

    [void]$frames.Add(@{
      Size = $sz
      Bytes = $pngBytes
    })
  }

  $outDir = Split-Path -Parent $OutputPath
  if ($outDir -and -not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
  }

  $fs = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
  $bw = New-Object System.IO.BinaryWriter($fs)
  try {
    # ICONDIR header: reserved (0), type (1 = ICO), count
    $bw.Write([uint16]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]$frames.Count)

    $offset = 6 + (16 * $frames.Count)
    foreach ($frame in $frames) {
      $sz = [int]$frame.Size
      $dimByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
      $dataLen = [uint32]$frame.Bytes.Length

      $bw.Write($dimByte)            # bWidth
      $bw.Write($dimByte)            # bHeight
      $bw.Write([byte]0)             # bColorCount
      $bw.Write([byte]0)             # bReserved
      $bw.Write([uint16]1)           # wPlanes
      $bw.Write([uint16]32)          # wBitCount
      $bw.Write($dataLen)            # dwBytesInRes
      $bw.Write([uint32]$offset)     # dwImageOffset

      $offset += [int]$dataLen
    }

    foreach ($frame in $frames) {
      $bw.Write([byte[]]$frame.Bytes)
    }
  }
  finally {
    $bw.Dispose()
    $fs.Dispose()
  }

  Write-Host "[OK] Icone gerado em $OutputPath" -ForegroundColor Green
}
catch {
  Write-Host "[ERRO] Falha ao gerar icone: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
