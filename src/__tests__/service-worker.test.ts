import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const scope = "https://example.test/mermaid-theme-builder/";

function harness() {
  const handlers = new Map<string, (event: any) => void>();
  const stores = new Map<string, Map<string, Response>>();
  const key = (req: string | Request) => (typeof req === "string" ? req : req.url);
  const caches = {
    keys: async () => [...stores.keys()],
    delete: vi.fn(async (name: string) => stores.delete(name)),
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name)!;
      return {
        match: async (req: string | Request) => store.get(key(req))?.clone(),
        put: async (req: string | Request, response: Response) => {
          store.set(key(req), response.clone());
        },
        addAll: async () => {},
      };
    },
    match: async (req: string | Request) => {
      for (const store of stores.values())
        if (store.has(key(req))) return store.get(key(req))!.clone();
    },
  };
  const fetch = vi.fn(async () => response("fresh", "text/javascript"));
  runInNewContext(source, {
    self: {
      location: new URL(`${scope}sw.js`),
      registration: { scope },
      addEventListener: (name: string, handler: (event: any) => void) =>
        handlers.set(name, handler),
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
    },
    caches,
    fetch,
    URL,
    Request,
    Response,
  });
  async function dispatch(type: string, request?: Request) {
    const waits: Promise<unknown>[] = [];
    let result: Promise<Response> | undefined;
    handlers.get(type)!({
      request,
      waitUntil: (p: Promise<unknown>) => waits.push(p),
      respondWith: (p: Promise<Response>) => {
        result = p;
      },
    });
    await Promise.all(waits);
    return result;
  }
  return { stores, caches, fetch, dispatch };
}

function response(body: string, type = "text/html", status = 200) {
  const res = new Response(body, { status, headers: { "content-type": type } });
  Object.defineProperty(res, "type", { value: "basic" });
  return res;
}
function navigation(path = "") {
  const req = new Request(`${scope}${path}`, { headers: { accept: "text/html" } });
  Object.defineProperty(req, "mode", { value: "navigate" });
  return req;
}

describe("application-scoped offline cache", () => {
  it("preserves sibling and ambiguous legacy caches during activation", async () => {
    const h = harness();
    for (const name of ["sibling-app", "mtb-cache-v1", `mtb:${scope}:old`])
      await h.caches.open(name);
    await h.dispatch("activate");
    expect(h.stores.has("sibling-app")).toBe(true);
    expect(h.stores.has("mtb-cache-v1")).toBe(true);
    expect(h.stores.has(`mtb:${scope}:old`)).toBe(false);
  });

  it("does not intercept development modules, sibling paths, POSTs, or external requests", async () => {
    const h = harness();
    for (const req of [
      new Request(`${scope}src/main.tsx`),
      new Request(`${scope}@vite/client`),
      new Request("https://example.test/sibling/a.js"),
      new Request("https://fonts.example.test/font.woff2"),
      new Request(scope, { method: "POST" }),
    ]) {
      expect(await h.dispatch("fetch", req)).toBeUndefined();
    }
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it("caches only successful hashed assets and reads only its own cache", async () => {
    const h = harness();
    const req = new Request(`${scope}assets/app-abcdefgh.js`);
    await (await h.caches.open("sibling-app")).put(req, response("wrong"));
    expect(await (await h.dispatch("fetch", req))!.text()).toBe("fresh");
    expect(await (await h.dispatch("fetch", req))!.text()).toBe("fresh");
    expect(h.fetch).toHaveBeenCalledTimes(1);
  });

  it("does not cache failed asset responses or HTML returned for a script", async () => {
    const h = harness();
    const req = new Request(`${scope}assets/app-abcdefgh.js`);
    h.fetch.mockResolvedValueOnce(response("error", "text/html", 503));
    h.fetch.mockResolvedValueOnce(response("fallback", "text/html"));
    await h.dispatch("fetch", req);
    await h.dispatch("fetch", req);
    await h.dispatch("fetch", req);
    expect(h.fetch).toHaveBeenCalledTimes(3);
  });

  it("warms one canonical shell and returns it offline without retaining URL queries", async () => {
    const h = harness();
    h.fetch.mockResolvedValueOnce(response("<html>current app</html>"));
    await h.dispatch("fetch", navigation("?private=not-cached"));
    h.fetch.mockRejectedValueOnce(new Error("offline"));
    expect(await (await h.dispatch("fetch", navigation()))!.text()).toBe(
      "<html>current app</html>"
    );
    expect([...h.stores.values()].flatMap((store) => [...store.keys()])).toEqual([
      `${scope}index.html`,
    ]);
  });

  it("does not replace a good shell with a development page or an error page", async () => {
    const h = harness();
    h.fetch.mockResolvedValueOnce(response("<html>production</html>"));
    await h.dispatch("fetch", navigation());
    h.fetch.mockResolvedValueOnce(response('<script type="module" src="/@vite/client"></script>'));
    await h.dispatch("fetch", navigation());
    h.fetch.mockResolvedValueOnce(response("temporary failure", "text/html", 503));
    await h.dispatch("fetch", navigation());
    h.fetch.mockRejectedValueOnce(new Error("offline"));
    expect(await (await h.dispatch("fetch", navigation()))!.text()).toBe("<html>production</html>");
  });

  it("returns an actionable offline response when no shell is cached", async () => {
    const h = harness();
    h.fetch.mockRejectedValueOnce(new Error("offline"));
    const res = await h.dispatch("fetch", navigation());
    expect(res!.status).toBe(503);
    expect(await res!.text()).toContain("online");
  });
});
