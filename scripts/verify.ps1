# Ralph Loop Verification Script
Write-Host "Starting Ralph Loop Verification (v3)..." -ForegroundColor Cyan

# 1. Linting
Write-Host "Step 1: Linting..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Linting failed!" -ForegroundColor Red
    exit 1 
}

# 2. Typechecking
Write-Host "Step 2: Typechecking..." -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Typechecking failed!" -ForegroundColor Red
    exit 1 
}

# 3. Tests
Write-Host "Step 3: Running Tests..." -ForegroundColor Yellow
npm run test
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Tests failed!" -ForegroundColor Red
    exit 1 
}

# 4. Build
Write-Host "Step 4: Production Build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1 
}

Write-Host "Ralph Loop Verification PASSED!" -ForegroundColor Green
exit 0
