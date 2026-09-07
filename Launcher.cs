using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace LesaIO
{
    static class Program
    {
        private static HttpListener listener;
        private static bool isRunning = true;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            int port = 8080;

            // Find an open port starting from 8080
            bool serverAlreadyRunning = IsPortResponding(port);
            if (!serverAlreadyRunning)
            {
                while (!TryStartServer(baseDir, port) && port < 8090)
                {
                    port++;
                }
            }

            string gameUrl = "http://127.0.0.1:" + port + "/";

            // Locate Chrome or Edge
            string browserPath = FindBestBrowser();

            Process gameProcess = null;

            if (!string.IsNullOrEmpty(browserPath) && File.Exists(browserPath))
            {
                string tempProfile = Path.Combine(Path.GetTempPath(), "LesaIO_GameProfile");
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = browserPath;
                psi.Arguments = "--app=\"" + gameUrl + "\" --user-data-dir=\"" + tempProfile + "\" --autoplay-policy=no-user-gesture-required --no-first-run --no-default-browser-check --disable-features=Translate,InterestFeedContentSuggestions";
                psi.UseShellExecute = false;
                try
                {
                    gameProcess = Process.Start(psi);
                }
                catch
                {
                    gameProcess = Process.Start(new ProcessStartInfo(gameUrl) { UseShellExecute = true });
                }
            }
            else
            {
                // Fallback: Default system browser
                gameProcess = Process.Start(new ProcessStartInfo(gameUrl) { UseShellExecute = true });
            }

            // CRITICAL: Keep server alive while game window is open!
            if (gameProcess != null && !gameProcess.HasExited)
            {
                try
                {
                    gameProcess.WaitForExit();
                }
                catch { }
            }
            else
            {
                // If launched via system shell or browser singleton, keep server alive
                while (isRunning)
                {
                    Thread.Sleep(1000);
                }
            }

            // Clean shutdown
            isRunning = false;
            try
            {
                if (listener != null && listener.IsListening)
                {
                    listener.Stop();
                    listener.Close();
                }
            }
            catch { }
        }

        static string FindBestBrowser()
        {
            string[] possiblePaths = new string[]
            {
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
            };

            foreach (string path in possiblePaths)
            {
                if (File.Exists(path)) return path;
            }
            return null;
        }

        static bool IsPortResponding(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(300);
                    return success && client.Connected;
                }
            }
            catch
            {
                return false;
            }
        }

        static bool TryStartServer(string rootDir, int port)
        {
            try
            {
                listener = new HttpListener();
                listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
                listener.Start();

                Thread serverThread = new Thread(() =>
                {
                    while (isRunning && listener != null && listener.IsListening)
                    {
                        try
                        {
                            HttpListenerContext ctx = listener.GetContext();
                            ThreadPool.QueueUserWorkItem((state) => HandleRequest(ctx, rootDir));
                        }
                        catch
                        {
                            if (!isRunning) break;
                        }
                    }
                });
                serverThread.IsBackground = true;
                serverThread.Start();
                return true;
            }
            catch
            {
                return false;
            }
        }

        static void HandleRequest(HttpListenerContext ctx, string rootDir)
        {
            try
            {
                string rawUrl = ctx.Request.RawUrl.Split('?')[0].TrimStart('/');
                rawUrl = Uri.UnescapeDataString(rawUrl);
                if (string.IsNullOrEmpty(rawUrl)) rawUrl = "index.html";

                string filePath = Path.Combine(rootDir, rawUrl.Replace('/', Path.DirectorySeparatorChar));

                if (File.Exists(filePath))
                {
                    ctx.Response.ContentType = GetMimeType(filePath);
                    ctx.Response.Headers.Add("Accept-Ranges", "bytes");
                    ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");

                    long totalBytes = new FileInfo(filePath).Length;
                    string rangeHeader = ctx.Request.Headers["Range"];

                    if (!string.IsNullOrEmpty(rangeHeader) && rangeHeader.StartsWith("bytes="))
                    {
                        string[] range = rangeHeader.Substring(6).Split('-');
                        long start = long.Parse(range[0]);
                        long end = range.Length > 1 && !string.IsNullOrEmpty(range[1]) ? long.Parse(range[1]) : totalBytes - 1;
                        if (end >= totalBytes) end = totalBytes - 1;
                        long length = end - start + 1;

                        ctx.Response.StatusCode = 206; // Partial Content
                        ctx.Response.AddHeader("Content-Range", string.Format("bytes {0}-{1}/{2}", start, end, totalBytes));
                        ctx.Response.ContentLength64 = length;

                        using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                        {
                            fs.Seek(start, SeekOrigin.Begin);
                            byte[] buffer = new byte[64 * 1024];
                            long bytesToRead = length;
                            while (bytesToRead > 0)
                            {
                                int read = fs.Read(buffer, 0, (int)Math.Min(buffer.Length, bytesToRead));
                                if (read <= 0) break;
                                ctx.Response.OutputStream.Write(buffer, 0, read);
                                bytesToRead -= read;
                            }
                        }
                    }
                    else
                    {
                        ctx.Response.StatusCode = 200;
                        ctx.Response.ContentLength64 = totalBytes;
                        using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                        {
                            byte[] buffer = new byte[64 * 1024];
                            int read;
                            while ((read = fs.Read(buffer, 0, buffer.Length)) > 0)
                            {
                                ctx.Response.OutputStream.Write(buffer, 0, read);
                            }
                        }
                    }
                }
                else
                {
                    if (rawUrl.ToLowerInvariant().Contains("favicon"))
                    {
                        ctx.Response.StatusCode = 204;
                    }
                    else
                    {
                        ctx.Response.StatusCode = 404;
                        byte[] errBytes = System.Text.Encoding.UTF8.GetBytes("404 Not Found: " + rawUrl);
                        ctx.Response.ContentType = "text/plain";
                        ctx.Response.ContentLength64 = errBytes.Length;
                        ctx.Response.OutputStream.Write(errBytes, 0, errBytes.Length);
                    }
                }
            }
            catch { }
            finally
            {
                try { ctx.Response.OutputStream.Close(); } catch { }
            }
        }

        static string GetMimeType(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            switch (ext)
            {
                case ".html": case ".htm": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg": case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                case ".svg": return "image/svg+xml";
                case ".mp3": return "audio/mpeg";
                case ".wav": return "audio/wav";
                case ".ogg": return "audio/ogg";
                case ".json": return "application/json";
                case ".ico": return "image/x-icon";
                case ".webp": return "image/webp";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".ttf": return "font/ttf";
                default: return "application/octet-stream";
            }
        }
    }
}
