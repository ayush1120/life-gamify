const fs = require('fs');

let content = fs.readFileSync('src/pages/HabitsPage.tsx', 'utf8');

// add import
content = content.replace(
  "import { HabitModal } from '../components/HabitModal';",
  "import { HabitModal } from '../components/HabitModal';\nimport { motion, AnimatePresence } from 'framer-motion';"
);

// wrap map in AnimatePresence
content = content.replace(
  "filteredHabits.map((habit, idx) => (",
  "<AnimatePresence mode=\"popLayout\">\n          {filteredHabits.map((habit, idx) => ("
);

// replace div with motion.div
content = content.replace(
  /key={habit\.id}\s*className={`glass-panel/g,
  "layout\n              initial={{ opacity: 0, y: 20 }}\n              animate={{ opacity: 1, y: 0 }}\n              exit={{ opacity: 0, scale: 0.95 }}\n              key={habit.id}\n              className={`glass-panel"
);

content = content.replace(
  /filteredHabits\.map\(\(habit, idx\) => \(\s*<div/g,
  "filteredHabits.map((habit, idx) => (\n            <motion.div"
);

// find the closing div of the map and close AnimatePresence
// It's line 295.
content = content.replace(
  "          ))\n        )}",
  "          ))}\n          </AnimatePresence>\n        )}"
);

fs.writeFileSync('src/pages/HabitsPage.tsx', content);
