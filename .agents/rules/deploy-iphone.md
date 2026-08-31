---
name: Wireless iPhone Deployment Rule
description: Automatically builds, syncs, installs, and launches Life Gamify on Ayush's iPhone over Wi-Fi when requested.
---

# Wireless iPhone Deployment Rule

When the user says **"deploy on iphone"**, **"run on iphone"**, **"install on iphone"**, **"test on iphone"**, or asks to run the app on their phone/iPhone:

You MUST execute the deployment workflow automatically:
1. Run `/Users/ayushsharma/code/life-gamify/scripts/deploy-ios.sh`
2. This script automatically:
   - Builds web production assets (`npm run build`)
   - Syncs assets into `life-gamify-ios/LifeGamify/Resources/dist`
   - Compiles and signs the iOS app via `xcodebuild`
   - Wirelessly installs `LifeGamify.app` to **Ayush's iPhone** via `xcrun devicectl device install app`
   - Launches `com.lifegamify.app` on the iPhone screen via `xcrun devicectl device process launch`
3. Report success once complete.
