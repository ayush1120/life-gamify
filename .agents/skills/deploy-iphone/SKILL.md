---
name: deploy-iphone
description: Build, bundle, sign, wirelessly install, and launch the Life Gamify app on the connected iPhone over Wi-Fi.
---

# Deploy on iPhone Skill

Use this skill whenever deploying or running the latest version of the app directly on the user's physical iPhone wirelessly over Wi-Fi.

## Execution

Run the deployment script:
```bash
/Users/ayushsharma/code/life-gamify/scripts/deploy-ios.sh
```

## Steps performed:
1. **Web Build**: `npm run build` compiles TypeScript and Vite bundle.
2. **Asset Sync**: Copies `dist/` into `life-gamify-ios/LifeGamify/Resources/dist`.
3. **Xcode Build**: `xcodebuild` compiles and codesigns `LifeGamify.app`.
4. **Wireless Installation**: `xcrun devicectl device install app --device "Ayush’s iPhone" <app_path>`.
5. **App Launch**: `xcrun devicectl device process launch --device "Ayush’s iPhone" com.lifegamify.app`.
