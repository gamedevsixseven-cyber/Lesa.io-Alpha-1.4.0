param (
    [int]$Port = 8080
)

# Determine base directory dynamically from script location
$baseDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$baseDir = [System.IO.Path]::GetFullPath($baseDir)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")

try {
    $listener.Start()
    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "  Lesa.io Local Server Running" -ForegroundColor Green
    Write-Host "  URL: http://localhost:$Port/ or http://127.0.0.1:$Port/" -ForegroundColor Yellow
    Write-Host "  Root: $baseDir" -ForegroundColor Gray
    Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "Failed to start listener on port $Port : $_" -ForegroundColor Red
    Write-Host "Tip: Make sure port $Port is not in use, or specify a different port: .\serve.ps1 -Port 8081" -ForegroundColor Yellow
    exit 1
}

function Get-ContentType([string]$path) {
    $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
    switch ($ext) {
        ".html" { return "text/html; charset=utf-8" }
        ".htm"  { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".mjs"  { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".map"  { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        ".webp" { return "image/webp" }
        ".mp3"  { return "audio/mpeg" }
        ".wav"  { return "audio/wav" }
        ".ogg"  { return "audio/ogg" }
        ".mp4"  { return "video/mp4" }
        ".webm" { return "video/webm" }
        ".woff" { return "font/woff" }
        ".woff2"{ return "font/woff2" }
        ".ttf"  { return "font/ttf" }
        ".otf"  { return "font/otf" }
        ".txt"  { return "text/plain; charset=utf-8" }
        default { return "application/octet-stream" }
    }
}

try {
    while ($listener.IsListening) {
        $context = $null
        try {
            $context = $listener.GetContext()
        } catch {
            # Listener was stopped or closed
            break
        }

        $request = $context.Request
        $response = $context.Response

        try {
            # 1. Standard Response Headers for Local Dev (CORS, Audio Range, No-Cache)
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Accept-Ranges", "bytes")
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Pragma", "no-cache")
            $response.Headers.Add("Expires", "0")

            # 2. Extract and sanitize request path
            $rawPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "/") {
                $rawPath = "/index.html"
            }

            # Normalize path separators
            $relPath = $rawPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
            $localPath = Join-Path $baseDir $relPath

            # If path points to a directory, look for index.html inside it
            if (Test-Path -Path $localPath -PathType Container) {
                $localPath = Join-Path $localPath "index.html"
            }

            # 3. Security: Prevent Directory Traversal
            $resolvedPath = [System.IO.Path]::GetFullPath($localPath)
            $normalizedBase = $baseDir.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
            $isSafe = ($resolvedPath + [System.IO.Path]::DirectorySeparatorChar).StartsWith($normalizedBase, [System.StringComparison]::OrdinalIgnoreCase) -or ($resolvedPath -eq $baseDir)

            if (-not $isSafe) {
                $response.StatusCode = 403
                $msg = [System.Text.Encoding]::UTF8.GetBytes("403 Forbidden: Access Denied")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $msg.Length
                $response.OutputStream.Write($msg, 0, $msg.Length)
                Write-Host "[$($response.StatusCode)] $rawPath (Blocked Traversal)" -ForegroundColor Red
            }
            elseif (Test-Path -Path $resolvedPath -PathType Leaf) {
                $fileInfo = New-Object System.IO.FileInfo($resolvedPath)
                $totalBytes = $fileInfo.Length
                $contentType = Get-ContentType $resolvedPath
                $response.ContentType = $contentType

                # 4. Handle HTTP Range Requests (Essential for HTML5 audio seeking/streaming)
                $rangeHeader = $request.Headers["Range"]
                if (-not [string]::IsNullOrEmpty($rangeHeader) -and $rangeHeader.StartsWith("bytes=")) {
                    $range = $rangeHeader.Substring(6).Split('-')
                    $start = [int64]$range[0]
                    $end = if ($range.Length -gt 1 -and -not [string]::IsNullOrEmpty($range[1])) { [int64]$range[1] } else { $totalBytes - 1 }
                    if ($end -ge $totalBytes) { $end = $totalBytes - 1 }
                    $length = $end - $start + 1

                    $response.StatusCode = 206 # Partial Content
                    $response.AddHeader("Content-Range", "bytes $start-$end/$totalBytes")
                    $response.ContentLength64 = $length

                    $fs = New-Object System.IO.FileStream($resolvedPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
                    try {
                        $null = $fs.Seek($start, [System.IO.SeekOrigin]::Begin)
                        $buffer = New-Object byte[] 65536
                        $remaining = $length
                        while ($remaining -gt 0) {
                            $toRead = [int][Math]::Min($buffer.Length, $remaining)
                            $read = $fs.Read($buffer, 0, $toRead)
                            if ($read -le 0) { break }
                            $response.OutputStream.Write($buffer, 0, $read)
                            $remaining -= $read
                        }
                    } finally {
                        $fs.Close()
                        $fs.Dispose()
                    }
                    Write-Host "[$($response.StatusCode)] $rawPath (Range: $start-$end / $totalBytes)" -ForegroundColor Cyan
                } else {
                    # Standard 200 OK Response
                    $response.StatusCode = 200
                    $response.ContentLength64 = $totalBytes

                    $fs = New-Object System.IO.FileStream($resolvedPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read)
                    try {
                        $buffer = New-Object byte[] 65536
                        while (($read = $fs.Read($buffer, 0, $buffer.Length)) -gt 0) {
                            $response.OutputStream.Write($buffer, 0, $read)
                        }
                    } finally {
                        $fs.Close()
                        $fs.Dispose()
                    }
                    Write-Host "[$($response.StatusCode)] $rawPath ($([math]::Round($totalBytes / 1KB, 1)) KB)" -ForegroundColor Green
                }
            } else {
                # 404 Not Found
                $response.StatusCode = 404
                $response.ContentType = "text/plain; charset=utf-8"
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawPath")
                $response.ContentLength64 = $msg.Length
                $response.OutputStream.Write($msg, 0, $msg.Length)
                Write-Host "[$($response.StatusCode)] $rawPath" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Error serving request $rawPath : $_" -ForegroundColor Red
            try {
                if ($response.OutputStream.CanWrite) {
                    $response.StatusCode = 500
                    $errMsg = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error")
                    $response.ContentType = "text/plain; charset=utf-8"
                    $response.ContentLength64 = $errMsg.Length
                    $response.OutputStream.Write($errMsg, 0, $errMsg.Length)
                }
            } catch {}
        } finally {
            # CRITICAL: Always close the response stream to prevent connection hanging/leaks
            try {
                $response.OutputStream.Flush()
                $response.Close()
            } catch {}
        }
    }
} finally {
    # Clean shutdown of listener
    if ($listener -and $listener.IsListening) {
        $listener.Stop()
        $listener.Close()
        Write-Host "Server stopped." -ForegroundColor Gray
    }
}
