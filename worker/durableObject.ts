import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Preset } from '@shared/types';
import { MARKSIX_DRAWS } from '@shared/mock-data';
const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'default-balanced',
    name: 'Default Balanced',
    weights: {
      freq: 0.28,
      recency: 0.18,
      pair: 0.12,
      overdue: 0.10,
      lastdigit: 0.06,
      range: 0.12,
      parity: 0.06,
      sumrange: 0.08,
    },
  },
];
// **DO NOT MODIFY THE CLASS NAME**
export class GlobalDurableObject extends DurableObject {
    async getCounterValue(): Promise<number> {
      const value = (await this.ctx.storage.get("counter_value")) || 0;
      return value as number;
    }
    async increment(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value += amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async decrement(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value -= amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async getDemoItems(): Promise<DemoItem[]> {
      const items = await this.ctx.storage.get("demo_items");
      if (items) {
        return items as DemoItem[];
      }
      // Transform MARKSIX_DRAWS into DemoItem[]
      const transformedItems = MARKSIX_DRAWS.map((draw, index) => ({
        id: `draw-${index + 1}`,
        name: `Draw #${index + 1}`,
        value: draw.reduce((sum, num) => sum + num, 0),
      }));
      await this.ctx.storage.put("demo_items", transformedItems);
      return transformedItems;
    }
    async addDemoItem(item: DemoItem): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = [...items, item];
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async updateDemoItem(id: string, updates: Partial<Omit<DemoItem, 'id'>>): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async deleteDemoItem(id: string): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.filter(item => item.id !== id);
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    // --- Preset Methods ---
    async getPresets(): Promise<Preset[]> {
      const presets = await this.ctx.storage.get<Preset[]>("lottery_presets_v1");
      if (presets) {
        return presets;
      }
      // Initialize with default if not exists
      await this.ctx.storage.put("lottery_presets_v1", DEFAULT_PRESETS);
      return DEFAULT_PRESETS;
    }
    async addPreset(preset: Omit<Preset, 'id'>): Promise<Preset[]> {
      const presets = await this.getPresets();
      const newPreset: Preset = {
        ...preset,
        id: crypto.randomUUID(),
      };
      const updatedPresets = [...presets, newPreset];
      await this.ctx.storage.put("lottery_presets_v1", updatedPresets);
      return updatedPresets;
    }
    async updatePreset(id: string, preset: Preset): Promise<Preset[]> {
      const presets = await this.getPresets();
      const updatedPresets = presets.map(p => (p.id === id ? { ...p, ...preset, id } : p));
      await this.ctx.storage.put("lottery_presets_v1", updatedPresets);
      return updatedPresets;
    }
    async deletePreset(id: string): Promise<Preset[]> {
      const presets = await this.getPresets();
      const updatedPresets = presets.filter(p => p.id !== id);
      await this.ctx.storage.put("lottery_presets_v1", updatedPresets);
      return updatedPresets;
    }
}