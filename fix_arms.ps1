$filePath = 'C:\Users\hp\Downloads\MTNRA\frontend\src\components\accessibility\ThreeDHumanAvatar.tsx'
$content = Get-Content $filePath -Raw

$old = '  neutre: {
    headRot: [0.05, 0, 0],
    leftArmRot: [-0.1, 0.2, -1.3], // Ventre / Bas
    leftForearmRot: [-0.6, 0.1, 0.2],
    leftWristRot: [0.1, 0.1, 0],
    rightArmRot: [-0.1, -0.2, 1.3],
    rightForearmRot: [-0.6, -0.1, -0.2],
    rightWristRot: [0.1, -0.1, 0],
  },'

$new = '  neutre: {
    headRot: [0.05, 0, 0],
    leftArmRot: [0.3, 0.2, -0.2], // Bras le long du corps, mains basses
    leftForearmRot: [-0.3, 0.1, 0.2],
    leftWristRot: [0.1, 0.1, 0],
    rightArmRot: [0.3, -0.2, 0.2],
    rightForearmRot: [-0.3, -0.1, -0.2],
    rightWristRot: [0.1, -0.1, 0],
  },'

$content = $content.Replace($old, $new)
$content | Set-Content $filePath

Write-Host "File updated!" -ForegroundColor Green
