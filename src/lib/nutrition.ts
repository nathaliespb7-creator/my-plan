import { plan } from './planUtils'
import type { FoodDef, MenuMeal, MenuMealItem } from '../types/plan'

export interface Macros {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

export function foodById(id: string): FoodDef | undefined {
  return plan.foods[id]
}

export function macrosForItem(foodId: string, grams: number): Macros {
  const food = foodById(foodId)
  if (!food) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  }
  const f = grams / 100
  return {
    kcal: food.per100g.kcal * f,
    protein: food.per100g.protein * f,
    fat: food.per100g.fat * f,
    carbs: food.per100g.carbs * f,
  }
}

export function resolveMealItem(
  item: MenuMealItem,
  mealName: string,
  itemIndex: number,
  swaps: Record<string, string> | undefined,
): { foodId: string; grams: number; label: string } {
  const swapKey = `${mealName}:${itemIndex}`
  const foodId = swaps?.[swapKey] ?? item.food
  const food = foodById(foodId)
  if (!foodId || foodId === item.food || !food) {
    return { foodId: item.food, grams: item.grams, label: item.label }
  }
  const originalKcal = macrosForItem(item.food, item.grams).kcal
  const kcalPer100 = food.per100g.kcal || 1
  const grams = Math.round((originalKcal / kcalPer100) * 100)
  return { foodId, grams: Math.max(grams, 1), label: food.name }
}

export function mealTotalsEaten(
  meal: MenuMeal,
  eaten: boolean,
  swaps: Record<string, string> | undefined,
): Macros {
  if (!eaten) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  }
  return meal.items.reduce(
    (acc, item, idx) => {
      const resolved = resolveMealItem(item, meal.name, idx, swaps)
      const m = macrosForItem(resolved.foodId, resolved.grams)
      return {
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        fat: acc.fat + m.fat,
        carbs: acc.carbs + m.carbs,
      }
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  )
}

export function dayNutritionEaten(
  meals: MenuMeal[],
  eatenMap: Record<string, boolean>,
  swaps: Record<string, string> | undefined,
): Macros {
  return meals.reduce(
    (acc, meal) => {
      const part = mealTotalsEaten(meal, !!eatenMap[meal.name], swaps)
      return {
        kcal: acc.kcal + part.kcal,
        protein: acc.protein + part.protein,
        fat: acc.fat + part.fat,
        carbs: acc.carbs + part.carbs,
      }
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  )
}

export function swapGramsForSimilarKcal(
  fromFoodId: string,
  fromGrams: number,
  toFoodId: string,
): number {
  const kcal = macrosForItem(fromFoodId, fromGrams).kcal
  const toFood = foodById(toFoodId)
  if (!toFood || toFood.per100g.kcal <= 0) return fromGrams
  return Math.max(1, Math.round((kcal / toFood.per100g.kcal) * 100))
}
