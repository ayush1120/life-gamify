const fs = require('fs');

let proj = fs.readFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify.xcodeproj/project.pbxproj', 'utf8');

const fileRefUUID = 'F10000012C70000100000001';
const buildFileUUID = 'F10000022C70000100000001';

// 1. Add PBXBuildFile
const buildFileLine = `\t\t${buildFileUUID} /* LogActivityIntent.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${fileRefUUID} /* LogActivityIntent.swift */; };\n`;
proj = proj.replace('/* Begin PBXBuildFile section */\n', '/* Begin PBXBuildFile section */\n' + buildFileLine);

// 2. Add PBXFileReference
const fileRefLine = `\t\t${fileRefUUID} /* LogActivityIntent.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = Intents/LogActivityIntent.swift; sourceTree = "<group>"; };\n`;
proj = proj.replace('/* Begin PBXFileReference section */\n', '/* Begin PBXFileReference section */\n' + fileRefLine);

// 3. Add to PBXSourcesBuildPhase
// find the block for PBXSourcesBuildPhase
const sourcesPhaseRegex = /isa = PBXSourcesBuildPhase;[\s\S]*?files = \(\n([\s\S]*?)\);/m;
const matchSources = proj.match(sourcesPhaseRegex);
if (matchSources) {
    const newFiles = matchSources[1] + `\t\t\t\t${buildFileUUID} /* LogActivityIntent.swift in Sources */,\n`;
    const newPhase = matchSources[0].replace(matchSources[1], newFiles);
    proj = proj.replace(matchSources[0], newPhase);
} else {
    console.error("PBXSourcesBuildPhase not found!");
}

// 4. Add to the main LifeGamify Group
// The LifeGamify group contains "AppEnvironment.swift"
const groupRegex = /isa = PBXGroup;[\s\S]*?children = \(\n([\s\S]*?)\);[\s\S]*?name = LifeGamify;/m;
// Let's just find where "AppEnvironment.swift" is in a group's children and append to it.
const groupSearchRegex = /children = \(\n([\s\S]*?A10000042C70000100000001 \/\* AppEnvironment\.swift \*\/,[\s\S]*?)\);/m;
const matchGroup = proj.match(groupSearchRegex);
if (matchGroup) {
    const newChildren = matchGroup[1] + `\t\t\t\t${fileRefUUID} /* LogActivityIntent.swift */,\n`;
    const newGroup = matchGroup[0].replace(matchGroup[1], newChildren);
    proj = proj.replace(matchGroup[0], newGroup);
} else {
    console.error("Main group not found!");
}

fs.writeFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify.xcodeproj/project.pbxproj', proj);
console.log("Successfully patched project.pbxproj");
