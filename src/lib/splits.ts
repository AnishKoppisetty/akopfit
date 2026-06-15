import { TrainingDay, Exercise } from '../types'
import { uid } from '../utils'

// Coach methodology: 2 sets in the 8-10 range for everything, one exercise per
// muscle group, machines prioritized over free weights, kept simple + stable.
function ex(name: string): Exercise {
  return { id: uid(), name, sets: 2, reps: '8-10' }
}

// Machine-first exercise picks, one per muscle group.
const CHEST = 'Smith Machine Incline Press'
const LATS = 'Lat Pulldown'
const MIDBACK = 'Seated Cable Row'
const SHOULDERS = 'Machine Shoulder Press'
const SIDE_DELTS = 'Machine Lateral Raise'
const REAR_DELTS = 'Reverse Pec Deck'
const BICEPS = 'Cable Curl'
const TRICEPS = 'Tricep Pushdown'
const QUADS = 'Leg Press'
const HAMS = 'Seated Leg Curl'
const GLUTES = 'Hip Thrust Machine'
const CALVES = 'Seated Calf Raise'

const FULL_BODY = [CHEST, LATS, MIDBACK, SHOULDERS, SIDE_DELTS, QUADS, HAMS, BICEPS, TRICEPS, CALVES]
const UPPER = [CHEST, LATS, MIDBACK, SHOULDERS, SIDE_DELTS, REAR_DELTS, BICEPS, TRICEPS]
const LOWER = [QUADS, HAMS, GLUTES, CALVES]
const PUSH = [CHEST, SHOULDERS, SIDE_DELTS, TRICEPS]
const PULL = [LATS, MIDBACK, REAR_DELTS, BICEPS]
const LEGS = [QUADS, HAMS, GLUTES, CALVES]
const ARNOLD_CHEST_BACK = [CHEST, LATS, MIDBACK]
const ARNOLD_SHOULDERS_ARMS = [SHOULDERS, SIDE_DELTS, REAR_DELTS, BICEPS, TRICEPS]
const ARNOLD_LEGS = [QUADS, HAMS, GLUTES, CALVES]

function day(n: number, focus: string, names: string[]): TrainingDay {
  return { id: uid(), label: `Day ${n}`, focus, rest: false, exercises: names.map(ex) }
}

// Assign a split based on how many days per week the client trains.
export function assignSplit(daysPerWeek: number): { name: string; days: TrainingDay[] } {
  const d = Math.max(2, Math.min(6, daysPerWeek))
  if (d <= 3) {
    return {
      name: 'Full Body',
      days: Array.from({ length: d }, (_, i) => day(i + 1, 'Full Body', FULL_BODY)),
    }
  }
  if (d === 4) {
    return {
      name: 'Upper / Lower',
      days: [day(1, 'Upper', UPPER), day(2, 'Lower', LOWER), day(3, 'Upper', UPPER), day(4, 'Lower', LOWER)],
    }
  }
  if (d === 5) {
    return {
      name: 'Arnold',
      days: [
        day(1, 'Chest & Back', ARNOLD_CHEST_BACK),
        day(2, 'Shoulders & Arms', ARNOLD_SHOULDERS_ARMS),
        day(3, 'Legs', ARNOLD_LEGS),
        day(4, 'Chest & Back', ARNOLD_CHEST_BACK),
        day(5, 'Shoulders & Arms', ARNOLD_SHOULDERS_ARMS),
      ],
    }
  }
  // 6 days
  return {
    name: 'Push / Pull / Legs',
    days: [
      day(1, 'Push', PUSH), day(2, 'Pull', PULL), day(3, 'Legs', LEGS),
      day(4, 'Push', PUSH), day(5, 'Pull', PULL), day(6, 'Legs', LEGS),
    ],
  }
}
