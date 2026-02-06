<script lang="ts">
  import uPlot from "uplot";
  import "uplot/dist/uPlot.min.css";

  import { type CropGroup, models } from "$lib/models";
  import { datasets } from "$lib/datasets";
  import { datasetToPlot, modelToPlot, percentileByTicks, ticksForPercentile } from "$lib/math";
  import Input from "$lib/components/ui/input/input.svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Switch } from "$lib/components/ui/switch";
  import { Separator } from "$lib/components/ui/separator";
  import * as Select from "$lib/components/ui/select";

  const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

  const cropGroups: CropGroup[] = [
    "WHEAT_POTATO_CARROT",
    "MELON_PUMPKIN",
    "SUNFLOWER_ROSE",
    "WART",
    "COCOA",
    "CANE",
    "CACTUS",
    "MUSHROOM",
  ];

  let uplot: uPlot | undefined;
  let container: HTMLDivElement | undefined = $state();

  let selected = $state<CropGroup>("WHEAT_POTATO_CARROT");
  let model = $derived(models[selected]);

  const DEFAULT_S = 4096;
  const DEFAULT_R = 7;
  const DEFAULT_G = 150;

  let override = $state(false);
  let overrideS = $state(DEFAULT_S);
  let overrideR = $state(DEFAULT_R);
  let overrideK = $derived(model.K);
  let overrideP = $derived(model.P);

  // section size: 16x16x16 = 4096
  let S = $derived(override ? overrideS : DEFAULT_S);

  // randomTickSpeed: 7
  let R = $derived(override ? overrideR : DEFAULT_R);

  // crop growth: 0..200, steps of 10
  let G = $state(DEFAULT_G);

  // stages
  let K = $derived(override ? overrideK : model.K);

  // stage probability
  let P = $derived(override ? overrideP : model.P);
  let PText = $derived(P.toFixed(4));

  let regrowth = $state(99.9);
  let regrowthText = $derived(regrowth.toFixed(2));

  let crops = $derived(ticksForPercentile(S, R, G, K, P, regrowth));
  let mode = $state<"ticks" | "percentile">("ticks");

  function formatRegrowth() {
    const n = Number(regrowthText);
    if (Number.isFinite(n)) {
      // pretend this is 100%, actual 100% would result in Infinity
      regrowth = clamp(n, 0, 99.9999);
    }
  }

  function formatP() {
    const n = Number(PText);
    if (Number.isFinite(n)) {
      P = clamp(n, 0.0001, 1);
    }
  }

  $effect(() => {
    if (mode === "ticks") {
      regrowth = percentileByTicks(S, R, G, K, P, crops);
    } else {
      crops = ticksForPercentile(S, R, G, K, P, regrowth);
    }
  });

  function matchingDatasets(group: CropGroup, g: number) {
    return datasets.filter((d) => d.group === group && d.g === g);
  }

  function render() {
    if (!container) {
      return;
    }

    const overlays = matchingDatasets(selected, G)
      .map((dataset) => {
        const series = datasetToPlot(dataset);
        return { label: dataset.name, series };
      });

    const modelPlot = modelToPlot(S, R, G, override ? { ...model, K, P } : model, overlays);

    uplot?.destroy();
    uplot = new uPlot(
      {
        pxAlign: false,
        width: container.clientWidth,
        height: container.clientHeight * 0.94,
        scales: { x: { time: false }, y: { range: [0, 100] } },
        axes: [
          { label: "T (ticks)", stroke: "#cfcfcf", grid: { stroke: "#3a3a3a", width: 1 } },
          { label: "% fully grown", stroke: "#cfcfcf", grid: { stroke: "#3a3a3a", width: 1 } },
        ],
        series: modelPlot.series,
        legend: { show: true },
      },
      modelPlot.data as any,
      container,
    );
  }

  $effect(() => {
    selected;
    S;
    R;
    G;
    K;
    P;
    render();
  });
</script>

<svelte:window onresize={render}></svelte:window>
<svelte:head>
  <title>SkyBlock Growth Calculator</title>
</svelte:head>

<div class="flex h-screen w-full min-h-0 gap-4 p-4 text-sm select-none">
  <Card class="w-120 shrink-0">
    <CardContent class="flex flex-1 flex-col justify-between">
      <div class="flex flex-col gap-6">
        <div class="text-lg font-semibold">Config</div>

        <div class="flex flex-col gap-2">
          <Label for="crop">Crop(s)</Label>
          <Select.Root type="single" bind:value={selected}>
            <Select.Trigger class="w-full">
              {models[selected].label}
            </Select.Trigger>
            <Select.Content>
              {#each cropGroups as group}
                <Select.Item value={group}>{models[group].label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>

          <div class="flex items-center justify-between w-full gap-2 text-muted-foreground">
            <span>✅ - accurate</span>
            <span>⚠️ - might be inaccurate</span>
            <span>‼️ - wrong</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label for="g">G <span class="text-muted-foreground">(crop growth)</span></Label>
            <span class="font-mono text-xs text-muted-foreground">{G}</span>
          </div>

          <input
            id="g"
            type="range"
            min="0"
            max="200"
            step="10"
            list="g-steps"
            bind:value={G}
            class="w-full accent-neutral-200"
          />

          <datalist id="g-steps">
            {#each Array.from({ length: 21 }, (_, i) => i * 10) as v}
              <option value={v}></option>
            {/each}
          </datalist>
        </div>
      </div>

      <Separator />

      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold">Calculator</div>
          <div class="flex items-center gap-1 text-muted-foreground">
            <span class="font-mono text-xs">{regrowth.toFixed(2)}% regrown</span>
            →
            <span class="font-mono text-xs">{crops} ticks</span>
          </div>
        </div>

        <div class="flex flex-col rounded-xl border bg-muted/20">
          <div class="flex items-center justify-between p-3">
            <Label for="input-regrowth" class="text-sm text-muted-foreground">Target regrowth (%)</Label>
            <Input
              bind:value={regrowthText}
              onblur={formatRegrowth}
              class="h-8 w-48 font-mono text-right"
              id="input-regrowth"
              inputmode="decimal"
            />
          </div>

          <Separator />

          <div class="flex items-center justify-between p-3">
            <Label for="input-ticks" class="text-sm text-muted-foreground">Loop length (ticks or crops)</Label>
            <Input
              bind:value={crops}
              class="h-8 w-48 font-mono text-right"
              id="input-ticks"
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="text-lg font-semibold">Model</div>
          <div class="flex items-center gap-2">
            <Label for="override" class="text-muted-foreground">Override</Label>
            <Switch id="override" bind:checked={override} />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label for="s">S <span class="text-muted-foreground">(section size)</span></Label>
            <Input
              bind:value={S}
              disabled={!override}
              class="h-8 w-48 font-mono text-right"
              id="s"
              type="number"
              min="0"
              max="4096"
              step="256"
            />
          </div>
          <input
            bind:value={S}
            disabled={!override}
            class="w-full accent-neutral-200 disabled:opacity-50"
            type="range"
            min="0"
            max="4096"
            step="256"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label for="r">R <span class="text-muted-foreground">(random tick speed)</span></Label>
            <Input
              bind:value={R}
              disabled={!override}
              class="h-8 w-48 font-mono text-right"
              id="r"
              type="number"
              min="0"
              max="256"
              step="1"
            />
          </div>
          <input
            bind:value={R}
            disabled={!override}
            class="w-full accent-neutral-200 disabled:opacity-50"
            type="range"
            min="0"
            max="256"
            step="1"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label for="k">K <span class="text-muted-foreground">(stages)</span></Label>
            <Input
              class="h-8 w-48 font-mono text-right"
              bind:value={K}
              id="k"
              type="number"
              min="0"
              max="32"
              step="1"
              disabled={!override}
            />
          </div>
          <input
            type="range"
            min="0"
            max="32"
            step="1"
            bind:value={K}
            disabled={!override}
            class="w-full accent-neutral-200 disabled:opacity-50"
          />
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <Label for="p">P <span class="text-muted-foreground">(stage probability)</span></Label>
            <Input
              bind:value={PText}
              disabled={!override}
              class="h-8 w-48 font-mono text-right"
              id="p"
              inputmode="decimal"
              onblur={formatP}
            />
          </div>
          <input
            bind:value={P}
            disabled={!override}
            class="w-full accent-neutral-200 disabled:opacity-50"
            type="range"
            min="0.0001"
            max="1"
            step="any"
          />
        </div>
      </div>

      <Separator />

      <footer class="flex flex-col items-center w-full text-muted-foreground">
        <span>made by @katazina for <a href="https://elitebot.dev/">Elite</a></span>
      </footer>
    </CardContent>
  </Card>

  <Card class="flex min-h-0 flex-1 overflow-hidden">
    <CardHeader class="py-3">
      <CardTitle class="text-base">Growth curve</CardTitle>
    </CardHeader>
    <CardContent class="min-h-0 flex-1 p-0">
      <div class="h-full min-h-0 w-full" bind:this={container}></div>
    </CardContent>
  </Card>
</div>
