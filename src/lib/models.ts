export type CropGroup =
  | "WHEAT_POTATO_CARROT"
  | "WART"
  | "COCOA"
  | "CANE"
  | "CACTUS"
  | "MELON_PUMPKIN"
  | "MUSHROOM"
  | "SUNFLOWER_ROSE";

export type Model = {
  label: string;
  K: number;
  P: number;
  group: CropGroup;
};

export const models: Record<CropGroup, Model> = {
  // MELON/PUMPKIN previously:
  // 0.04        accurate @ G = 170
  // MELON_PUMPKIN: { group: "MELON_PUMPKIN", label: "✅ Melon / Pumpkin", K: 1, P: 1 / 25 },
  MELON_PUMPKIN: { group: "MELON_PUMPKIN", label: "✅ Melon / Pumpkin", K: 1, P: 0.12 },

  // 0.333333... accurate @ G = 200
  WHEAT_POTATO_CARROT: { group: "WHEAT_POTATO_CARROT", label: "✅ Wheat / Potato / Carrot", K: 7, P: 1 / 3 },

  // 0.166666... accurate @ G = 200
  SUNFLOWER_ROSE: { group: "SUNFLOWER_ROSE", label: "✅ Sunflower / Rose", K: 3, P: 1 / 6 },

  // 0.177777... accurate @ G = 150 and 180
  WART: { group: "WART", label: "✅ Wart", K: 3, P: 8 / 45 },

  // 0.08        *probably* accurate
  COCOA: { group: "COCOA", label: "✅ Cocoa", K: 2, P: 0.08 },

  // TODO: use a special model, as the current model cannot fit cactus / cane curves.
  // CACTUS: { group: "CACTUS", label: "⚠️ Cactus", K: 2, P: 0.1 },
  CANE: { group: "CANE", label: "⚠️ Cane", K: 2, P: 0.11 },

  // these values are a temporary workaround that fit the curve best
  // for what's possible with the current model.
  CACTUS: { group: "CACTUS", label: "⚠️ Cactus", K: 3, P: 0.1545 },

  // odd crop, every mushroom is affected by other surrounding mushrooms
  // k & p are at most just approximations
  MUSHROOM: { group: "MUSHROOM", label: "‼️ Mushroom", K: 3, P: 79 / 512 },
};
