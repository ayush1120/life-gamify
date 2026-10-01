const fs = require('fs');

// 1. Update AssistantHandler.swift
let handlerCode = fs.readFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/Bridge/Handlers/AssistantHandler.swift', 'utf8');
const searchHandler = `    public func clearPendingLogs() throws -> [String: Any] {
        defaults.removeObject(forKey: "pendingSiriLogs")
        return ["cleared": true]
    }`;
const replaceHandler = searchHandler + `
    
    public func syncHabitVocabulary(payload: AnyCodablePayload?) throws -> [String: Any] {
        if let dict = payload?.value as? [String: Any], let habits = dict["habits"] as? [String] {
            defaults.set(habits, forKey: "siriHabitVocabulary")
        }
        return ["success": true]
    }`;
handlerCode = handlerCode.replace(searchHandler, replaceHandler);
fs.writeFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/Bridge/Handlers/AssistantHandler.swift', handlerCode);

// 2. Update NativeBridgeController.swift
let bridgeControllerCode = fs.readFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/Bridge/NativeBridgeController.swift', 'utf8');
const searchController = `            case ("assistant", "clearpendinglogs"):
                let clr = try AssistantHandler.shared.clearPendingLogs()
                resultData = AnyCodablePayload(clr)`;
const replaceController = searchController + `

            case ("assistant", "synchabitvocabulary"):
                let resSync = try AssistantHandler.shared.syncHabitVocabulary(payload: request.payload)
                resultData = AnyCodablePayload(resSync)`;
bridgeControllerCode = bridgeControllerCode.replace(searchController, replaceController);
fs.writeFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/Bridge/NativeBridgeController.swift', bridgeControllerCode);

// 3. Update LogActivityIntent.swift to use the vocabulary
let intentCode = fs.readFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/App/Intents/LogActivityIntent.swift', 'utf8');
const searchIntent = `    func suggestedEntities() async throws -> [HabitEntity] {
        return []
    }`;
const replaceIntent = `    func suggestedEntities() async throws -> [HabitEntity] {
        let defaults = UserDefaults(suiteName: "group.com.lifegamify") ?? UserDefaults.standard
        let habits = defaults.array(forKey: "siriHabitVocabulary") as? [String] ?? []
        return habits.map { HabitEntity(id: $0, name: $0) }
    }`;
intentCode = intentCode.replace(searchIntent, replaceIntent);
fs.writeFileSync('/Users/ayushsharma/code/life-gamify-ios/LifeGamify/App/Intents/LogActivityIntent.swift', intentCode);

