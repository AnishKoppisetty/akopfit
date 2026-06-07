import { AppData } from './types'
import { todayISO, daysAgoISO } from './utils'

export function seedData(): AppData {
  return {
    profile: {
      name: 'Alex',
      coachName: 'Coach Akop',
      goal: 'cut',
      heightCm: 180,
      startWeight: 198,
      goalWeight: 180,
      unit: 'lb',
    },
    targets: {
      calories: 2200,
      protein: 190,
      carbs: 210,
      fat: 60,
      steps: 10000,
      cardioMinutes: 30,
      water: 8,
    },
    split: [
      {
        id: 'd1', label: 'Day 1', focus: 'Push', rest: false,
        exercises: [
          { name: 'Incline Barbell Press', sets: 4, reps: '6-8' },
          { name: 'Flat DB Press', sets: 3, reps: '8-10' },
          { name: 'Cable Fly', sets: 3, reps: '12-15' },
          { name: 'Overhead Press', sets: 4, reps: '8-10' },
          { name: 'Lateral Raise', sets: 4, reps: '12-15' },
          { name: 'Tricep Pushdown', sets: 3, reps: '10-12' },
        ],
      },
      {
        id: 'd2', label: 'Day 2', focus: 'Pull', rest: false,
        exercises: [
          { name: 'Weighted Pull-up', sets: 4, reps: '6-8' },
          { name: 'Barbell Row', sets: 4, reps: '8-10' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12' },
          { name: 'Seated Cable Row', sets: 3, reps: '10-12' },
          { name: 'Face Pull', sets: 3, reps: '15-20' },
          { name: 'Barbell Curl', sets: 4, reps: '8-12' },
        ],
      },
      {
        id: 'd3', label: 'Day 3', focus: 'Legs', rest: false,
        exercises: [
          { name: 'Back Squat', sets: 4, reps: '6-8' },
          { name: 'Romanian Deadlift', sets: 4, reps: '8-10' },
          { name: 'Leg Press', sets: 3, reps: '10-12' },
          { name: 'Leg Curl', sets: 3, reps: '10-12' },
          { name: 'Walking Lunge', sets: 3, reps: '12 / leg' },
          { name: 'Standing Calf Raise', sets: 4, reps: '12-15' },
        ],
      },
      { id: 'd4', label: 'Day 4', focus: 'Rest', rest: true, exercises: [] },
      {
        id: 'd5', label: 'Day 5', focus: 'Upper', rest: false,
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '6-8' },
          { name: 'Chest-Supported Row', sets: 4, reps: '8-10' },
          { name: 'Arnold Press', sets: 3, reps: '10-12' },
          { name: 'Lat Pulldown', sets: 3, reps: '10-12' },
          { name: 'Incline Curl', sets: 3, reps: '10-12' },
          { name: 'Skullcrusher', sets: 3, reps: '10-12' },
        ],
      },
      {
        id: 'd6', label: 'Day 6', focus: 'Lower', rest: false,
        exercises: [
          { name: 'Deadlift', sets: 3, reps: '4-6' },
          { name: 'Front Squat', sets: 3, reps: '8-10' },
          { name: 'Bulgarian Split Squat', sets: 3, reps: '10 / leg' },
          { name: 'Leg Extension', sets: 3, reps: '12-15' },
          { name: 'Seated Calf Raise', sets: 4, reps: '15-20' },
        ],
      },
      { id: 'd7', label: 'Day 7', focus: 'Rest', rest: true, exercises: [] },
    ],
    weightLogs: [
      { date: daysAgoISO(35), weight: 198 },
      { date: daysAgoISO(28), weight: 196.4 },
      { date: daysAgoISO(21), weight: 195.1 },
      { date: daysAgoISO(14), weight: 193.8 },
      { date: daysAgoISO(7), weight: 192.0 },
      { date: daysAgoISO(2), weight: 191.2 },
    ],
    dailyLogs: {
      [daysAgoISO(2)]: { date: daysAgoISO(2), steps: 11240, cardioMinutes: 30, cardioType: 'Incline walk', calories: 2150, protein: 195, carbs: 200, fat: 58, workoutDone: true, water: 8 },
      [daysAgoISO(1)]: { date: daysAgoISO(1), steps: 8900, cardioMinutes: 25, cardioType: 'StairMaster', calories: 2240, protein: 188, carbs: 215, fat: 61, workoutDone: true, water: 7 },
      [todayISO()]: {
        date: todayISO(), steps: 4120, water: 3,
        foods: [
          { id: 'f1', name: 'Egg whites + 2 whole eggs', meal: 'Breakfast', calories: 290, protein: 30, carbs: 2, fat: 17 },
          { id: 'f2', name: 'Oats w/ banana', meal: 'Breakfast', calories: 320, protein: 10, carbs: 60, fat: 6 },
          { id: 'f3', name: 'Chicken, rice & broccoli', meal: 'Lunch', calories: 540, protein: 50, carbs: 62, fat: 9 },
        ],
      },
    },
    checkIns: [
      {
        id: 'c1', date: daysAgoISO(7), weight: 192.0,
        message: 'Solid week — hit all my workouts and steps every day except Sunday. Energy was high. Sleep dipped midweek from work stress.',
        photos: [], energy: 4, sleep: 3, hunger: 2, adherence: 92,
        coachReply: 'Great work Alex. Down 1.8lb, right on target. Let’s keep calories the same and bump steps to 11k next week. Proud of you.',
      },
    ],
    foodLibrary: [
      { id: 'l1', name: 'Chicken breast (6oz)', calories: 280, protein: 52, carbs: 0, fat: 6 },
      { id: 'l2', name: 'White rice (1 cup)', calories: 205, protein: 4, carbs: 45, fat: 0 },
      { id: 'l3', name: 'Whole eggs (2)', calories: 140, protein: 12, carbs: 1, fat: 10 },
      { id: 'l4', name: 'Egg whites (1 cup)', calories: 125, protein: 26, carbs: 2, fat: 0 },
      { id: 'l5', name: 'Oats (1/2 cup dry)', calories: 150, protein: 5, carbs: 27, fat: 3 },
      { id: 'l6', name: 'Greek yogurt (1 cup)', calories: 130, protein: 22, carbs: 8, fat: 0 },
      { id: 'l7', name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
      { id: 'l8', name: 'Whey shake (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 1 },
      { id: 'l9', name: 'Almonds (1oz)', calories: 165, protein: 6, carbs: 6, fat: 14 },
      { id: 'l10', name: 'Olive oil (1 tbsp)', calories: 120, protein: 0, carbs: 0, fat: 14 },
    ],
  }
}
