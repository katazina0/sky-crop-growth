import type { CropGroup } from "./models.ts";

const jsons = import.meta.glob("./data/*.json", { eager: true });

export const datasetsByName: Record<string, unknown> = {};

for (const [path, mod] of Object.entries(jsons)) {
  const file = path.split("/").pop()!;
  const name = file.replace(/\.json$/i, "");
  datasetsByName[name] = (mod as any).default ?? mod;
}

export type Dataset = {
  name: string;
  group: CropGroup;
  g: number;
};

export const datasets: Dataset[] = [
  { name: "cactus150", group: "CACTUS", g: 150 },
  { name: "cactus170", group: "CACTUS", g: 170 },
  { name: "cane150", group: "CANE", g: 150 },
  { name: "cocoa150", group: "COCOA", g: 150 },
  { name: "cocoa150_2", group: "COCOA", g: 150 },
  { name: "cocoa170", group: "COCOA", g: 170 },
  { name: "cocoa170_2", group: "COCOA", g: 170 },
  { name: "melon150", group: "MELON_PUMPKIN", g: 150 },
  { name: "potato200", group: "WHEAT_POTATO_CARROT", g: 200 },
  { name: "rose200", group: "SUNFLOWER_ROSE", g: 200 },
  { name: "sunflower150", group: "SUNFLOWER_ROSE", g: 150 },
  { name: "wart150", group: "WART", g: 150 },
  { name: "wart180", group: "WART", g: 180 },
  { name: "wheat30", group: "WHEAT_POTATO_CARROT", g: 30 },
  { name: "wheat150", group: "WHEAT_POTATO_CARROT", g: 150 },
  { name: "melon170", group: "MELON_PUMPKIN", g: 170 },
  { name: "cane190lazzi", group: "CANE", g: 190 },

  // mushroom needs a different formula
  { name: "mushroom150", group: "MUSHROOM", g: 150 },
  { name: "mushroom130", group: "MUSHROOM", g: 130 },
];
