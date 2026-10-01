const fs = require('fs');

// 1. Update bridge.ts
let bridgeCode = fs.readFileSync('src/services/native/bridge.ts', 'utf8');
const searchBridge = `  clearPendingLogs: () => 
    nativeBridge.sendRequest<{ cleared: boolean }>('assistant', 'clearPendingLogs', {}),
};`;
const replaceBridge = `  clearPendingLogs: () => 
    nativeBridge.sendRequest<{ cleared: boolean }>('assistant', 'clearPendingLogs', {}),
  syncHabitVocabulary: (habits: string[]) => 
    nativeBridge.sendRequest<{ success: boolean }>('assistant', 'syncHabitVocabulary', { habits }),
};`;
bridgeCode = bridgeCode.replace(searchBridge, replaceBridge);
fs.writeFileSync('src/services/native/bridge.ts', bridgeCode);

// 2. Update AppContext.tsx to call syncHabitVocabulary whenever habits change
let appCode = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
const searchApp = `  // Save changes to LocalStorage for offline resilience
  useEffect(() => { saveStoredHabits(habits); }, [habits]);`;
const replaceApp = `  // Save changes to LocalStorage for offline resilience
  useEffect(() => { 
    saveStoredHabits(habits); 
    if (habits.length > 0) {
      import('../services/native/bridge').then(({ nativeAssistantService }) => {
        nativeAssistantService.syncHabitVocabulary(habits.filter(h => h.active).map(h => h.name));
      }).catch(console.error);
    }
  }, [habits]);`;
appCode = appCode.replace(searchApp, replaceApp);
fs.writeFileSync('src/context/AppContext.tsx', appCode);

