# xode: Xode in the terminal. Installs it with npm, then `xode` works in any project folder.
#   irm https://x0bot.com/install.ps1 | iex

if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "xode needs Node.js 20 or later. Get it at https://nodejs.org, then run this again."
  return
}

$major = [int](node -p "process.versions.node.split('.')[0]")
if ($major -lt 20) {
  Write-Host "xode needs Node.js 20 or later; this computer has $(node -v). Update it at https://nodejs.org, then run this again."
  return
}

Write-Host "Installing xode..."
npm install -g @xooteqlab/xode@latest
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "That didn't finish. Open PowerShell as administrator and run this again."
  return
}

Write-Host ""
Write-Host "Done. Open a new terminal, go to your project's folder, and run:"
Write-Host "  xode"
