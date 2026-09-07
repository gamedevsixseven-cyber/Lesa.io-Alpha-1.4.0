param(
    [int]$ListenPort = 8081,
    [int]$TargetPort = 8080
)

$source = @'
#pragma warning disable 4014
using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

public class LanBridge {
    private static TcpListener _listener;

    public static void Start(int listenPort, int targetPort) {
        _listener = new TcpListener(IPAddress.Any, listenPort);
        _listener.Start();
        Console.WriteLine("LAN Bridge active: Listening on 0.0.0.0:" + listenPort + " -> 127.0.0.1:" + targetPort);

        Task.Run(async () => {
            while (true) {
                try {
                    var client = await _listener.AcceptTcpClientAsync();
                    Task.Run(async () => {
                        try {
                            using (client)
                            using (var backend = new TcpClient()) {
                                await backend.ConnectAsync("127.0.0.1", targetPort);
                                using (var cs = client.GetStream())
                                using (var bs = backend.GetStream()) {
                                    byte[] buf = new byte[8192];
                                    int read = await cs.ReadAsync(buf, 0, buf.Length);
                                    if (read > 0) {
                                        string req = Encoding.UTF8.GetString(buf, 0, read);
                                        string modifiedReq = Regex.Replace(req, @"Host:\s*[^\r\n]+", "Host: localhost:" + targetPort);
                                        byte[] modBytes = Encoding.UTF8.GetBytes(modifiedReq);
                                        await bs.WriteAsync(modBytes, 0, modBytes.Length);
                                    }
                                    var t1 = cs.CopyToAsync(bs);
                                    var t2 = bs.CopyToAsync(cs);
                                    await Task.WhenAny(t1, t2);
                                }
                            }
                        } catch {}
                    });
                } catch {
                    break;
                }
            }
        });
    }

    public static void Stop() {
        if (_listener != null) {
            try { _listener.Stop(); } catch {}
        }
    }
}
'@

Add-Type -TypeDefinition $source -Language CSharp
[LanBridge]::Start($ListenPort, $TargetPort)

Write-Host "LAN Bridge running on port $ListenPort!" -ForegroundColor Green
while ($true) {
    Start-Sleep -Seconds 1000
}
