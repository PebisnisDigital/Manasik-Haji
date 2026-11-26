import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALFAMART_PRODUCTS, ALFAMART_SALES, alfamartOffers, alfamartResponse } from '../src/alfamartProducts.ts';
import { insideAlfamart } from '../src/alfamartStore.ts';
import { escortDestination, loadSales, marketWalkable, planEscortRoute, saveSales } from '../src/buburMarket.ts';

afterEach(() => vi.unstubAllGlobals());

describe('Alfamart sales', () => {
  it('provides seven simulated prices and enough interested customers to earn the voucher', () => {
    expect(ALFAMART_PRODUCTS.map(product => product.price)).toEqual([5000, 8000, 6000, 10000, 9000, 3500, 15000]);
    const prospects = Array.from({ length: 16 }, (_, id) => id);
    const willing = prospects.filter(id => alfamartResponse(id, alfamartOffers(id)[0]!).ok);
    expect(willing).toHaveLength(12);
    expect(prospects.some(id => !alfamartResponse(id, alfamartOffers(id)[0]!).ok)).toBe(true);
    expect(willing.some(id => !alfamartResponse(id, alfamartOffers(id)[1]!).ok)).toBe(true);
    expect(ALFAMART_SALES.commission * ALFAMART_SALES.target).toBe(30000);
    expect(ALFAMART_SALES.registration - ALFAMART_SALES.voucher).toBe(75000);
  });

  it('routes a customer through the door along walkable aisles', () => {
    const start = new THREE.Vector3(-26, 0, -5.35);
    const route = planEscortRoute(start, 'alfamart');
    const goal = escortDestination('alfamart');
    expect(route.at(-1)).toEqual(goal);
    expect(insideAlfamart(goal.x, goal.z)).toBe(true);
    expect(marketWalkable(16.5, -3.15)).toBe(true);
    expect(marketWalkable(19.5, -3.15)).toBe(false);
    expect(marketWalkable(14.05, -6.55)).toBe(false);
    for (const [i, end] of route.entries()) {
      const from = i === 0 ? start : route[i - 1]!;
      const samples = Math.ceil(from.distanceTo(end) / .1);
      for (let j = 1; j <= samples; j++) {
        const p = from.clone().lerp(end, j / samples);
        expect(marketWalkable(p.x, p.z)).toBe(true);
      }
    }
  });

  it('restores old jobs and rejects a duplicate in-flight Alfamart sale', () => {
    const records = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => records.set(key, value),
    });
    records.set('hajji-market-sales-v1', JSON.stringify({
      job: 'hijab', accepted: [0], rejected: [], pending: 2, serving: null, claimed: false,
    }));
    const hijab = loadSales();
    expect(hijab).toMatchObject({ job: 'hijab', pending: 2, product: null });
    saveSales({ ...hijab, pending: null });
    saveSales({ job: 'alfamart', accepted: [1, 1], rejected: [], pending: null, serving: 1, claimed: false, product: 3 });
    expect(loadSales()).toMatchObject({ job: 'alfamart', accepted: [1], serving: null });
    expect(loadSales('hijab')).toMatchObject({ job: 'hijab', accepted: [0] });
    saveSales({ ...loadSales(), serving: 2, product: 6 });
    expect(loadSales()).toMatchObject({ serving: 2, product: 6 });
  });
});
