#################################################################################
#
#   https://github.com/pawalan/adobe-fonts-liberator
#   kudos to Steven Kalinke <https://github.com/kalaschnik/adobe-fonts-revealer>
#
################################################################################



# Configuration - usually no need to change something, but suit yourself
$AdobeFontsDir = "$env:APPDATA\Adobe\CoreSync\plugins\livetype\r"
$DesktopDir = [Environment]::GetFolderPath("Desktop")
$DestinationDir = Join-Path -Path $DesktopDir -ChildPath 'Adobe Fonts'



######################### script code - don't change unless you know what you do! ###############################################

# Reads the PostScript name (name ID 6) directly from a font file's binary name table.
# Replaces the otfinfo.exe dependency — works with both TrueType and OpenType fonts.
function Get-FontPostScriptName {
    param([string]$FilePath)
    try {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $numTables = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt16($bytes, 4))
        for ($i = 0; $i -lt $numTables; $i++) {
            $off = 12 + $i * 16
            $tag = [System.Text.Encoding]::ASCII.GetString($bytes, $off, 4)
            if ($tag -eq 'name') {
                $tblOff = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt32($bytes, $off + 8))
                $count  = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt16($bytes, $tblOff + 2))
                $strOff = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt16($bytes, $tblOff + 4))
                for ($j = 0; $j -lt $count; $j++) {
                    $nOff   = $tblOff + 6 + $j * 12
                    $platID = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt16($bytes, $nOff))
                    $nameID = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt16($bytes, $nOff + 6))
                    $len    = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt16($bytes, $nOff + 8))
                    $sOff   = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt16($bytes, $nOff + 10))
                    if ($nameID -eq 6) {
                        $abs = $tblOff + $strOff + $sOff
                        if ($platID -eq 3) {
                            return [System.Text.Encoding]::BigEndianUnicode.GetString($bytes, $abs, $len).Trim()
                        } else {
                            return [System.Text.Encoding]::ASCII.GetString($bytes, $abs, $len).Trim()
                        }
                    }
                }
            }
        }
    } catch {}
    return $null
}

Clear-Host

Write-Output "`n`rLiberating Adobe Fonts`n`r`n`rfrom`t$AdobeFontsDir`n`rto`t`t$DestinationDir`n`r`n`r"


if ( Test-Path -Path "$DestinationDir\*" ) {
    Write-Error "Destination directory is not empty, aborting."
    exit 1
} else {
    New-Item -Path $DestinationDir -ItemType Directory -Force | Out-Null
}


Get-ChildItem -Path $AdobeFontsDir | ForEach-Object {

    $fontName = Get-FontPostScriptName -FilePath $_.FullName

    if (-not $fontName) {
        Write-Error "Could not read font name for $_, skipping."
        return
    }

    $fontFile = Join-Path -Path $DestinationDir -ChildPath "$fontName.otf"

    Copy-Item -Path $_.FullName -Destination $fontFile
    if ($? -eq $true) {
        Write-Output "Liberated`t$_`tto`t$fontName.otf"
    } else {
        Write-Error "Failed to copy`t$_`to`t$fontFile"
    }

}

Write-Output "`n`r`n`rLong live the free fonts!`n`r`n`rBye!`n`r"
