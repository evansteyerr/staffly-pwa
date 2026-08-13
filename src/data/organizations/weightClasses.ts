import type { WeightClass } from "@/types";

export const WEIGHT_CLASSES: WeightClass[] = [
  { id: "m_flyweight", label: "Poids mouche", gender: "male", maxWeightKg: 56.7 },
  { id: "m_bantamweight", label: "Poids coq", gender: "male", maxWeightKg: 61.2 },
  { id: "m_featherweight", label: "Poids plume", gender: "male", maxWeightKg: 65.8 },
  { id: "m_lightweight", label: "Poids leger", gender: "male", maxWeightKg: 70.3 },
  { id: "m_welterweight", label: "Poids mi-moyen", gender: "male", maxWeightKg: 77.1 },
  { id: "m_middleweight", label: "Poids moyen", gender: "male", maxWeightKg: 83.9 },
  { id: "m_light_heavyweight", label: "Poids mi-lourd", gender: "male", maxWeightKg: 93.0 },
  { id: "m_heavyweight", label: "Poids lourd", gender: "male", maxWeightKg: 120.2 },
  { id: "f_strawweight", label: "Poids paille", gender: "female", maxWeightKg: 52.2 },
  { id: "f_flyweight", label: "Poids mouche", gender: "female", maxWeightKg: 56.7 },
  { id: "f_bantamweight", label: "Poids coq", gender: "female", maxWeightKg: 61.2 },
  { id: "f_featherweight", label: "Poids plume", gender: "female", maxWeightKg: 65.8 },
];

export function weightClassesForGender(gender: "male" | "female"): WeightClass[] {
  return WEIGHT_CLASSES.filter((w) => w.gender === gender);
}

export function getWeightClass(id: string): WeightClass {
  const wc = WEIGHT_CLASSES.find((w) => w.id === id);
  if (!wc) throw new Error(`Weight class inconnue: ${id}`);
  return wc;
}
