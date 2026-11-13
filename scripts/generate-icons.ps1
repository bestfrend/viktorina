Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sourcePath = Join-Path $projectRoot 'assets/quiz-icon-source.jpg'
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

function Save-ResizedImage {
  param(
    [System.Drawing.Image]$Source,
    [int]$Width,
    [int]$Height,
    [double]$Padding,
    [string]$Output
  )

  $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $availableWidth = $Width * (1 - 2 * $Padding)
  $availableHeight = $Height * (1 - 2 * $Padding)
  $scale = [Math]::Min($availableWidth / $Source.Width, $availableHeight / $Source.Height)
  $drawWidth = [int][Math]::Round($Source.Width * $scale)
  $drawHeight = [int][Math]::Round($Source.Height * $scale)
  $left = [int][Math]::Floor(($Width - $drawWidth) / 2)
  $top = [int][Math]::Floor(($Height - $drawHeight) / 2)
  $graphics.DrawImage($Source, [System.Drawing.Rectangle]::new($left, $top, $drawWidth, $drawHeight))
  $bitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

try {
  Save-ResizedImage -Source $sourceImage -Width 100 -Height 127 -Padding 0 -Output (Join-Path $projectRoot 'public/quiz-logo.png')
  foreach ($size in @(192, 512)) {
    Save-ResizedImage -Source $sourceImage -Width $size -Height $size -Padding 0.06 -Output (Join-Path $projectRoot "public/icon-$size.png")
  }
} finally {
  $sourceImage.Dispose()
}
