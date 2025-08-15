### **1. Install testing deps** (run in project root)

```bash
npm i -D vitest @testing-library/react @testing-library/dom jsdom
```

---

### **2. Create Vitest config**

**`vitest.config.ts`** (root)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  }
});
```

---

### **3. Add test directory & files**

In **`src/__tests__/`** create:

#### **`stac.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { searchStacItems, normalizeStacItem } from '../lib/stac';

describe('STAC client', () => {
  it('builds correct /search body', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      })
    );
    global.fetch = mockFetch as any;

    await searchStacItems({ bbox: [-107, 37, -106, 38], limit: 5 });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.bbox).toEqual([-107, 37, -106, 38]);
  });

  it('normalizes item with thumbnail fallback', () => {
    const normalized = normalizeStacItem({
      id: 'test',
      assets: {},
      properties: { datetime: '2025-08-14T12:00:00Z', 'eo:cloud_cover': 5 },
      geometry: {}
    });
    expect(normalized.thumbUrl).toContain('placeholder');
  });
});
```

---

#### **`store.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { useSearchStore } from '../store/useSearchStore';

describe('Search store', () => {
  it('initializes with default filters', () => {
    const state = useSearchStore.getState();
    expect(state.filters.cloud).toBeLessThanOrEqual(20);
  });

  it('updates filters correctly', () => {
    useSearchStore.getState().setFilters({ cloud: 10 });
    expect(useSearchStore.getState().filters.cloud).toBe(10);
  });
});
```

---

#### **`urlState.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { toUrlParams, fromUrlParams } from '../lib/urlState';

describe('URL state', () => {
  it('round-trips filters to/from URL', () => {
    const filters = { cloud: 5, bbox: [-107, 37, -106, 38] };
    const params = toUrlParams(filters);
    const parsed = fromUrlParams(params);
    expect(parsed.cloud).toBe(5);
  });
});
```

---

### **4. Run tests**

```bash
npm test
```

---

This keeps your **API + state + URL logic** guarded without slowing the Codex CLI’s React/Tailwind build.

If you want, I can also give you a **`public/sample.json`** fallback file so those tests pass even if Earth Search is down during the demo. That would make your “offline mode” bulletproof.
