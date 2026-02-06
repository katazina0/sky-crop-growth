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
  // 0.04        accurate @ G = 170
  MELON_PUMPKIN: { group: "MELON_PUMPKIN", label: "✅ Melon / Pumpkin", K: 1, P: 1 / 25 },

  // 0.333333... accurate @ G = 200
  WHEAT_POTATO_CARROT: { group: "WHEAT_POTATO_CARROT", label: "✅ Wheat / Potato / Carrot", K: 7, P: 1 / 3 },

  // 0.166666... accurate @ G = 200
  SUNFLOWER_ROSE: { group: "SUNFLOWER_ROSE", label: "✅ Sunflower / Rose", K: 3, P: 1 / 6 },

  // 0.177777... accurate @ G = 150 and 180
  WART: { group: "WART", label: "✅ Wart", K: 3, P: 8 / 45 },

  // 0.08        *probably* accurate
  COCOA: { group: "COCOA", label: "✅ Cocoa", K: 2, P: 0.08 },

  // cactus/cane are bugged. they also seem to have the same speed.
  // crop growth is most likely broken for them and the curves look OK at G=0, P=0.43
  // for the datasets:
  //   G=170 cane was sampled properly without early stopping, curve should fit that
  //   G=190 cane was stopped early during farming - the tail doesn't "plateau" completely
  //   G=150 cane doesn't have enough samples to make any assumptions
  CACTUS: { group: "CACTUS", label: "⚠️ Cactus", K: 8, P: 0.43 },
  CANE: { group: "CANE", label: "⚠️ Cane", K: 8, P: 0.43 },

  // odd crop, every mushroom is affected by other surrounding mushrooms
  // k & p are at most just approximations
  MUSHROOM: { group: "MUSHROOM", label: "‼️ Mushroom", K: 3, P: 79 / 512 },
};
