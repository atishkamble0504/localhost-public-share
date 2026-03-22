[Setup]
AppName=Localhost Public Share
AppVersion=2.0.0
AppPublisher=Localhost Public Share
AppPublisherURL=https://github.com/atishkamble0504
DefaultDirName={commonpf}\LocalhostPublicShare
DefaultGroupName=Localhost Public Share
OutputBaseFilename=LocalhostPublicShareSetup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
UninstallDisplayIcon={app}\local-bridge.exe
DisableProgramGroupPage=yes
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
Source: "local-bridge.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "cloudflared.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "nssm.exe"; DestDir: "{app}"; Flags: ignoreversion

[Run]
; Install Windows Service
Filename: "{app}\nssm.exe"; Parameters: "install LocalhostBridge ""{app}\local-bridge.exe"""; Flags: runhidden
Filename: "{app}\nssm.exe"; Parameters: "set LocalhostBridge AppDirectory ""{app}"""; Flags: runhidden
Filename: "{app}\nssm.exe"; Parameters: "set LocalhostBridge Start SERVICE_AUTO_START"; Flags: runhidden
Filename: "{app}\nssm.exe"; Parameters: "set LocalhostBridge AppStdout ""{app}\service.log"""; Flags: runhidden
Filename: "{app}\nssm.exe"; Parameters: "set LocalhostBridge AppStderr ""{app}\service-error.log"""; Flags: runhidden
Filename: "{app}\nssm.exe"; Parameters: "start LocalhostBridge"; Flags: runhidden

[UninstallRun]
; Stop service
Filename: "{app}\nssm.exe"; Parameters: "stop LocalhostBridge"; Flags: runhidden; RunOnceId: "StopService"

; Remove service completely
Filename: "{app}\nssm.exe"; Parameters: "remove LocalhostBridge confirm"; Flags: runhidden; RunOnceId: "RemoveService"

[UninstallDelete]
; Remove logs
Type: files; Name: "{app}\service.log"
Type: files; Name: "{app}\service-error.log"
Type: files; Name: "{app}\bridge-token.txt"

[Code]
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    MsgBox('Localhost Bridge service has been completely removed from your system.',
      mbInformation, MB_OK);
  end;
end;