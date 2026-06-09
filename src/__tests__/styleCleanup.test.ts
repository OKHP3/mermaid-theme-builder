// @vitest-environment happy-dom

/**
 * Unit tests for the createStyleCapture helper in src/lib/style-cleanup.ts.
 *
 * These tests run under happy-dom so that document.head, HTMLStyleElement,
 * and MutationObserver are all available.
 *
 * NOTE: happy-dom fires MutationObserver callbacks as microtasks (not
 * synchronously), so each test awaits Promise.resolve() after mutating the
 * DOM so the observer callback runs before finish() is called.
 *
 * Coverage:
 *  - Injected <style> elements are captured and removed from document.head
 *  - Combined CSS text is returned by finish()
 *  - Elements added before observation starts are NOT captured
 *  - Multiple sequential captures are independent (no cross-contamination)
 *  - ZenUML → flowchart sequence: no style orphans remain after each cycle
 *  - Non-style elements (div) added during observation are ignored
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createStyleCapture } from "@/lib/style-cleanup";

async function addStyleToHead(css: string): Promise<HTMLStyleElement> {
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
  await Promise.resolve();
  return el;
}

function countHeadStyles(): number {
  return document.head.querySelectorAll("style").length;
}

beforeEach(() => {
  document.head.querySelectorAll("style").forEach((el) => el.remove());
});

afterEach(() => {
  document.head.querySelectorAll("style").forEach((el) => el.remove());
});

describe("createStyleCapture — basic capture", () => {
  it("captures a <style> injected after observation starts", async () => {
    const capture = createStyleCapture();
    await addStyleToHead(".zenuml { color: red; }");
    const css = capture.finish();
    expect(css).toContain(".zenuml");
    expect(css).toContain("color: red");
  });

  it("removes captured <style> elements from document.head", async () => {
    const capture = createStyleCapture();
    await addStyleToHead(".leak { background: green; }");
    expect(countHeadStyles()).toBe(1);
    capture.finish();
    expect(countHeadStyles()).toBe(0);
  });

  it("concatenates multiple injected <style> elements", async () => {
    const capture = createStyleCapture();
    await addStyleToHead(".a { color: red; }");
    await addStyleToHead(".b { color: blue; }");
    const css = capture.finish();
    expect(css).toContain(".a");
    expect(css).toContain(".b");
    expect(countHeadStyles()).toBe(0);
  });

  it("returns empty string when no styles are injected", () => {
    const capture = createStyleCapture();
    const css = capture.finish();
    expect(css).toBe("");
  });

  it("does NOT capture a <style> element added before observation starts", async () => {
    await addStyleToHead(".pre-existing { color: purple; }");
    const capture = createStyleCapture();
    const css = capture.finish();
    expect(css).not.toContain(".pre-existing");
    expect(countHeadStyles()).toBe(1);
  });
});

describe("createStyleCapture — no cross-contamination between captures", () => {
  it("second capture does not see styles injected during first capture", async () => {
    const first = createStyleCapture();
    await addStyleToHead(".zenuml-style { font-size: 14px; }");
    first.finish();

    const second = createStyleCapture();
    await addStyleToHead(".flowchart-style { fill: #abc; }");
    const secondCss = second.finish();

    expect(secondCss).not.toContain(".zenuml-style");
    expect(secondCss).toContain(".flowchart-style");
    expect(countHeadStyles()).toBe(0);
  });

  it("ZenUML → flowchart sequence: head is clean after both renders", async () => {
    const zenumlCapture = createStyleCapture();
    await addStyleToHead(".zenuml-actor { background: #333; }");
    await addStyleToHead(".zenuml-lifeline { border-left: 1px solid #ccc; }");
    const zenumlCss = zenumlCapture.finish();

    expect(zenumlCss).toContain(".zenuml-actor");
    expect(zenumlCss).toContain(".zenuml-lifeline");
    expect(countHeadStyles()).toBe(0);

    const flowchartCapture = createStyleCapture();
    const flowchartCss = flowchartCapture.finish();

    expect(flowchartCss).toBe("");
    expect(countHeadStyles()).toBe(0);
  });

  it("flowchart render after venn render: no venn styles remain in head", async () => {
    const vennCapture = createStyleCapture();
    await addStyleToHead(".venn-circle { fill-opacity: 0.25; }");
    vennCapture.finish();

    expect(countHeadStyles()).toBe(0);

    const flowchartCapture = createStyleCapture();
    const flowchartCss = flowchartCapture.finish();

    expect(flowchartCss).toBe("");
    expect(countHeadStyles()).toBe(0);
  });
});

describe("createStyleCapture — non-style elements are ignored", () => {
  it("does not capture a <div> element added during observation", async () => {
    const capture = createStyleCapture();
    const div = document.createElement("div");
    document.head.appendChild(div);
    await Promise.resolve();
    const css = capture.finish();
    expect(css).toBe("");
    div.remove();
  });

  it("does not capture a <meta> element added during observation", async () => {
    const capture = createStyleCapture();
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width";
    document.head.appendChild(meta);
    await Promise.resolve();
    const css = capture.finish();
    expect(css).toBe("");
    meta.remove();
  });
});

describe("createStyleCapture — custom head target", () => {
  it("observes a provided container element instead of document.head", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const capture = createStyleCapture(container);
    const el = document.createElement("style");
    el.textContent = ".scoped { color: pink; }";
    container.appendChild(el);
    await Promise.resolve();

    const css = capture.finish();
    expect(css).toContain(".scoped");
    expect(container.querySelectorAll("style").length).toBe(0);

    container.remove();
  });

  it("does not interfere with document.head when using a custom target", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const capture = createStyleCapture(container);
    await addStyleToHead(".head-style { color: black; }");
    capture.finish();

    expect(countHeadStyles()).toBe(1);
    container.remove();
  });
});
