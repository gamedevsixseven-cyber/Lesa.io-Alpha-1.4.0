Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\nikol\.gemini\antigravity-ide\brain\307094c9-2075-411c-b7ef-e4827c09066d\.user_uploaded\media_1788288254173.png"
$outDir = "c:\Lesa.io\assets\icons"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source Image Size: $($bmp.Width) x $($bmp.Height)"

# Let's define the 7 bounding boxes based on proportional coordinates or grid
# Width: $bmp.Width, Height: $bmp.Height
$W = $bmp.Width
$H = $bmp.Height

# Top row (4 items): Y from approx 0.05 to 0.48
# Bottom row (3 items): Y from approx 0.50 to 0.95

# Let's crop with safety bounds and then trim white space + make background transparent
$boxes = @(
    @{ Name = "icon_heroes.png";    X = [int]($W * 0.01); Y = [int]($H * 0.05); Width = [int]($W * 0.25); Height = [int]($H * 0.44) },
    @{ Name = "icon_weapons.png";   X = [int]($W * 0.26); Y = [int]($H * 0.05); Width = [int]($W * 0.24); Height = [int]($H * 0.44) },
    @{ Name = "icon_skills.png";    X = [int]($W * 0.50); Y = [int]($H * 0.05); Width = [int]($W * 0.23); Height = [int]($H * 0.44) },
    @{ Name = "icon_upgrades.png";  X = [int]($W * 0.74); Y = [int]($H * 0.05); Width = [int]($W * 0.25); Height = [int]($H * 0.44) },
    @{ Name = "icon_gear.png";      X = [int]($W * 0.01); Y = [int]($H * 0.50); Width = [int]($W * 0.30); Height = [int]($H * 0.45) },
    @{ Name = "icon_inventory.png"; X = [int]($W * 0.32); Y = [int]($H * 0.50); Width = [int]($W * 0.28); Height = [int]($H * 0.45) },
    @{ Name = "icon_talents.png";   X = [int]($W * 0.63); Y = [int]($H * 0.50); Width = [int]($W * 0.33); Height = [int]($H * 0.45) }
)

function CropAndMakeTransparent($srcBmp, $rect, $savePath) {
    # 1. Crop rough area
    $cropBmp = new-object System.Drawing.Bitmap $rect.Width, $rect.Height
    $g = [System.Drawing.Graphics]::FromImage($cropBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $srcRect = new-object System.Drawing.Rectangle $rect.X, $rect.Y, $rect.Width, $rect.Height
    $destRect = new-object System.Drawing.Rectangle 0, 0, $rect.Width, $rect.Height
    $g.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # 2. Find tight non-white bounding box & make white background transparent
    $minX = $cropBmp.Width; $maxX = 0
    $minY = $cropBmp.Height; $maxY = 0

    $transBmp = new-object System.Drawing.Bitmap $cropBmp.Width, $cropBmp.Height
    for ($y = 0; $y -lt $cropBmp.Height; $y++) {
        for ($x = 0; $x -lt $cropBmp.Width; $x++) {
            $pixel = $cropBmp.GetPixel($x, $y)
            # Check if pixel is white or near white background
            if ($pixel.R -gt 242 -and $pixel.G -gt 242 -and $pixel.B -gt 242) {
                $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
            } else {
                $transBmp.SetPixel($x, $y, $pixel)
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $cropBmp.Dispose()

    # 3. If valid tight bounds found, crop to tight bounds with a 4px padding
    if ($maxX -gt $minX -and $maxY -gt $minY) {
        $pad = 6
        $tightX = [Math]::Max(0, $minX - $pad)
        $tightY = [Math]::Max(0, $minY - $pad)
        $tightW = [Math]::Min($transBmp.Width - $tightX, ($maxX - $minX) + $pad * 2)
        $tightH = [Math]::Min($transBmp.Height - $tightY, ($maxY - $minY) + $pad * 2)

        $finalBmp = new-object System.Drawing.Bitmap $tightW, $tightH
        $fg = [System.Drawing.Graphics]::FromImage($finalBmp)
        $sRect = new-object System.Drawing.Rectangle $tightX, $tightY, $tightW, $tightH
        $dRect = new-object System.Drawing.Rectangle 0, 0, $tightW, $tightH
        $fg.DrawImage($transBmp, $dRect, $sRect, [System.Drawing.GraphicsUnit]::Pixel)
        $fg.Dispose()
        $transBmp.Dispose()

        $finalBmp.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $finalBmp.Dispose()
        Write-Host "Saved tight transparent icon: $savePath ($tightW x $tightH)"
    } else {
        $transBmp.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $transBmp.Dispose()
        Write-Host "Saved icon: $savePath"
    }
}

foreach ($box in $boxes) {
    $targetPath = Join-Path $outDir $box.Name
    CropAndMakeTransparent $bmp $box $targetPath
}

$bmp.Dispose()
Write-Host "All icons successfully cropped and saved!"
