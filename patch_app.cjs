const fs = require('fs');
let code = fs.readFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/App/LifeGamifyApp.swift', 'utf8');

code = code.replace('import SwiftUI', 'import SwiftUI\nimport AppIntents');
code = code.replace('LocalHTTPServer.shared.start()', 'LocalHTTPServer.shared.start()\n        LifeGamifyShortcuts.updateAppShortcutParameters()');

fs.writeFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/App/LifeGamifyApp.swift', code);
