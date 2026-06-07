import { CoachData, CoachClient } from './types'
import { daysAgoISO } from '../utils'
import { seedData } from '../seed'

const DEFAULT_PROGRAM = seedData().split

function w(weights: [number, number][]): { date: string; weight: number }[] {
  // [daysAgo, weight] -> WeightLog[]
  return weights.map(([d, weight]) => ({ date: daysAgoISO(d), weight })).sort((a, b) => a.date.localeCompare(b.date))
}

export function coachSeed(): CoachData {
  const clients: Omit<CoachClient, 'program'>[] = [
      {
        id: 'alex',
        name: 'Alex Rivera',
        goal: 'cut',
        unit: 'lb',
        startWeight: 198,
        goalWeight: 180,
        joinedDaysAgo: 38,
        splitName: 'Push / Pull / Legs',
        targets: { calories: 2200, protein: 190, carbs: 210, fat: 60, steps: 10000, cardioMinutes: 30, water: 8 },
        weightLogs: w([[35, 198], [28, 196.4], [21, 195.1], [14, 193.8], [7, 192.0], [2, 191.2]]),
        today: { calories: 1150, protein: 92, steps: 6420, cardioMinutes: 15, water: 4, workoutDone: true },
        checkIns: [
          {
            id: 'a1', date: daysAgoISO(2), weight: 191.2,
            message: 'Strong week — hit all sessions and steps every day except Sunday. Energy high, sleep dipped midweek from work. Hunger creeping up a bit in the evenings.',
            photos: [], energy: 4, sleep: 3, hunger: 3, adherence: 92,
          },
        ],
      },
      {
        id: 'jordan',
        name: 'Jordan Lee',
        goal: 'bulk',
        unit: 'lb',
        startWeight: 155,
        goalWeight: 175,
        joinedDaysAgo: 60,
        splitName: 'Upper / Lower',
        targets: { calories: 3100, protein: 175, carbs: 380, fat: 80, steps: 8000, cardioMinutes: 15, water: 10 },
        weightLogs: w([[28, 159.0], [21, 160.2], [14, 161.0], [7, 162.1], [1, 163.0]]),
        today: { calories: 2780, protein: 168, steps: 7900, cardioMinutes: 10, water: 8, workoutDone: true },
        checkIns: [
          {
            id: 'j1', date: daysAgoISO(1), weight: 163.0,
            message: 'Lifts are flying up — added 10lb on bench and squat felt easy. Appetite is strong, hitting all my meals. Feeling great.',
            photos: [], energy: 5, sleep: 4, hunger: 2, adherence: 96,
          },
          {
            id: 'j0', date: daysAgoISO(8), weight: 162.1,
            message: 'Good week, all meals in. Sleep was solid.',
            photos: [], energy: 4, sleep: 4, hunger: 2, adherence: 90,
            coachReply: 'Beautiful progress Jordan. Gaining lean and lifts up — exactly what we want. Keep calories here for now.',
          },
        ],
      },
      {
        id: 'sam',
        name: 'Sam Patel',
        goal: 'cut',
        unit: 'lb',
        startWeight: 210,
        goalWeight: 185,
        joinedDaysAgo: 45,
        splitName: 'Full Body 3x',
        targets: { calories: 2000, protein: 200, carbs: 170, fat: 55, steps: 12000, cardioMinutes: 40, water: 10 },
        // weight stalled the last 2 weeks
        weightLogs: w([[30, 204], [23, 201.5], [16, 199.8], [9, 199.5], [3, 199.6]]),
        today: { calories: 980, protein: 70, steps: 3100, cardioMinutes: 0, water: 2, workoutDone: false },
        checkIns: [
          {
            id: 's1', date: daysAgoISO(9), weight: 199.5,
            message: 'Scale hasn’t moved in two weeks and I’m getting frustrated. Weekends are tough — had a few meals out. Steps lower because of a busy work stretch.',
            photos: [], energy: 2, sleep: 2, hunger: 4, adherence: 68,
            coachReply: 'Appreciate the honesty Sam. The stall is almost certainly weekend calories — let’s tighten Sat/Sun and get steps back to 12k. You’ve got this.',
          },
        ],
      },
      {
        id: 'maria',
        name: 'Maria Gomez',
        goal: 'maintain',
        unit: 'kg',
        startWeight: 64,
        goalWeight: 63,
        joinedDaysAgo: 6,
        splitName: 'Push / Pull / Legs',
        targets: { calories: 2050, protein: 130, carbs: 220, fat: 65, steps: 9000, cardioMinutes: 20, water: 8 },
        weightLogs: w([[5, 64.0], [1, 63.8]]),
        today: { calories: 1420, protein: 88, steps: 8200, cardioMinutes: 20, water: 6, workoutDone: true },
        checkIns: [],
      },
  ]
  return {
    coachName: 'Coach Akop',
    clients: clients.map(c => ({ ...c, program: DEFAULT_PROGRAM })),
  }
}
