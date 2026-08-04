$ErrorActionPreference = "Stop"
Write-Host "TickMint Phase 2A release validation" -ForegroundColor Cyan
$required = @(
"app\page.tsx","app\layout.tsx","app\dashboard\page.tsx","app\phase-2a-2-premium.css",
"components\tickmint\TickMintApp.tsx","components\tickmint\brand\TickMintLogo.tsx",
"lib\tickmint\types.ts","lib\tickmint\mappers.ts","lib\tickmint\performance.ts",
"lib\tickmint\export.ts","hooks\useNetworkStatus.ts","public\tickmint-logo-premium.svg",
"public\tickmint-icon-premium.svg")
foreach($path in $required){if(-not(Test-Path $path)){throw "Missing required file: $path"};Write-Host "OK  $path" -ForegroundColor Green}
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
pnpm.cmd run build
Write-Host "Build passed. Complete MANUAL-QA-CHECKLIST.md before release." -ForegroundColor Green
