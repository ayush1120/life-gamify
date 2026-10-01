const fs = require('fs');
let handlerCode = fs.readFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/Bridge/Handlers/AssistantHandler.swift', 'utf8');

const searchHandler = `    public func syncHabitVocabulary(payload: AnyCodablePayload?) throws -> [String: Any] {
        if let dict = payload?.value as? [String: Any], let habits = dict["habits"] as? [String] {
            defaults.set(habits, forKey: "siriHabitVocabulary")
        }
        return ["success": true]
    }`;

const replaceHandler = `    public func syncHabitVocabulary(payload: AnyCodablePayload?) throws -> [String: Any] {
        if let dict = payload?.value as? [String: Any], let habits = dict["habits"] as? [String] {
            defaults.set(habits, forKey: "siriHabitVocabulary")
            if #available(iOS 16.0, *) {
                LifeGamifyShortcuts.updateAppShortcutParameters()
            }
        }
        return ["success": true]
    }`;

handlerCode = handlerCode.replace(searchHandler, replaceHandler);
fs.writeFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/Bridge/Handlers/AssistantHandler.swift', handlerCode);
