Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
foreach ($size in @(192, 512)) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::FromArgb(238, 241, 245))
  $margin = [int]($size * 0.14)
  $diameter = $size - 2 * $margin
  $blue = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 103, 216))
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $graphics.FillEllipse($blue, $margin, $margin, $diameter, $diameter)
  $font = New-Object System.Drawing.Font('Arial', [single]($size * 0.40), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString([string][char]0x017D, $font, $white, [System.Drawing.RectangleF]::new(0, 0, $size, $size), $format)
  $output = Join-Path $root "public/icon-$size.png"
  $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
  $format.Dispose(); $font.Dispose(); $white.Dispose(); $blue.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
