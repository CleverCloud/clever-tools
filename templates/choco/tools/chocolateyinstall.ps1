$ErrorActionPreference = 'Stop';
$packageName= '<%= name %>'
$toolsDir   = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"

$packageArgs = @{
  packageName   = $packageName
  unzipLocation = $toolsDir
  url           = 'https://clever-tools.clever-cloud.com/releases/<%= version %>/clever-tools-<%= version %>_win.zip'
  checksum      = '<%= sha256 %>'
  checksumType  = 'sha256'
}

Install-ChocolateyZipPackage @packageArgs
