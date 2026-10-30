import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const base = process.env.UI_BASE_URL || "http://127.0.0.1:3100";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const executablePath =
  process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
  (process.platform === "win32" ? edge : undefined);
const output = "output/playwright";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("404"))
    consoleErrors.push(message.text());
});
const report = {
  base,
  engine: "Chromium / Edge",
  widths: [],
  actions: [],
  consoleErrors,
};

async function count(expected) {
  await page.waitForFunction(
    (value) => document.querySelectorAll(".crest-tile").length === value,
    expected,
  );
}

async function loadedCapture(width, name = `after-${width}`) {
  await page.setViewportSize({ width, height: 1000 });
  const response = await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/${name}-hero.png` });
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 650) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
    await Promise.all(
      Array.from(document.images).map((image) => image.decode()),
    );
    window.scrollTo(0, 0);
  });
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    images: Array.from(document.images).every(
      (image) =>
        image.complete &&
        image.naturalWidth > 0 &&
        (image.classList.contains("trophy-poster") || Math.abs(image.width - image.height) < 2),
    ),
    title: document.querySelector("h1").textContent.trim(),
    controls: Array.from(document.querySelectorAll("button,input,select"))
      .filter((element) => element.getBoundingClientRect().width > 0)
      .map((element) => ({
        tag: element.tagName,
        height: element.getBoundingClientRect().height,
      })),
  }));
  assert.ok(layout.scrollWidth <= layout.viewport, JSON.stringify(layout));
  assert.ok(layout.images, "Imagen ausente o deformada");
  assert.ok(
    layout.controls.every((control) => control.height >= 44),
    "Control demasiado pequeño",
  );
  await page.screenshot({ path: `${output}/${name}-full.png`, fullPage: true });
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const accessibility = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
      },
    });
    return result.violations.map((issue) => ({
      id: issue.id,
      impact: issue.impact,
      elements: issue.nodes.map((node) => node.target),
    }));
  });
  report.widths.push({ ...layout, axeViolations: accessibility });
}

try {
  for (const width of [360, 390, 768, 1024, 1440]) await loadedCapture(width);
  await page.goto(base);
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent.trim()),
    "Saltar al contenido",
  );
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "contenido",
  );
  report.actions.push("Enlace de salto y teclado");
  await page
    .getByRole("link", { name: "Explorar los escudos", exact: true })
    .click();
  assert.ok(page.url().endsWith("#escudos"));
  const search = page.getByRole("searchbox", { name: "Buscar un escudo" });
  const select = page.getByRole("combobox", {
    name: "País o liga de inspiración",
  });
  for (const league of [
    "Inglaterra",
    "Italia",
    "España",
    "Alemania",
    "Francia",
    "Brasil",
    "México",
    "Argentina",
    "MLS",
    "Costa Rica",
  ]) {
    await select.selectOption(league);
    await page.waitForFunction(
      (name) =>
        document.querySelector(".gallery-count").textContent.includes(name),
      league,
    );
    await count(["MLS", "Costa Rica"].includes(league) ? 4 : 5);
  }
  await page.reload();
  await count(4);
  assert.equal(await select.inputValue(), "Costa Rica");
  await page.goBack();
  await count(4);
  assert.equal(await select.inputValue(), "MLS");
  report.actions.push("10 filtros, URL, recarga e historial");
  await select.selectOption("Todos");
  await search.fill("atletico");
  await count(1);
  assert.match(
    await page.locator(".crest-reference").textContent(),
    /Atlético/,
  );
  await search.fill("45");
  await page.waitForFunction(() =>
    document
      .querySelector(".crest-reference")
      ?.textContent.includes("Saprissa"),
  );
  await count(1);
  assert.match(
    await page.locator(".crest-reference").textContent(),
    /Saprissa/,
  );
  await search.fill("sin-resultados-xyz");
  await count(0);
  await page.getByText("No encontramos ese escudo", { exact: true }).waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${output}/after-empty.png` });
  await page
    .getByRole("button", { name: "Ver todos los escudos", exact: true })
    .click();
  await count(12);
  assert.equal(
    await search.evaluate((element) => element === document.activeElement),
    true,
  );
  report.actions.push(
    "Búsqueda sin acentos, número, estado vacío y recuperación del foco",
  );
  for (const expected of [24, 36, 48]) {
    await page
      .getByRole("button", { name: "Mostrar 12 más", exact: true })
      .click();
    await count(expected);
  }
  const complete = page.getByRole("button", {
    name: "Colección completa",
    exact: true,
  });
  assert.equal(await complete.getAttribute("aria-disabled"), "true");
  assert.equal(
    await complete.evaluate((element) => element === document.activeElement),
    true,
  );
  await count(48);
  report.actions.push(
    "Colección completa: 48 diseños, límite y foco conservado",
  );
  const catalog = JSON.parse(
    await fs.readFile("public/escudos/catalogo.json", "utf8"),
  );
  for (const crest of catalog.escudos) {
    const response = await page.request.get(
      new URL(`/escudos/${crest.file}`, base).href,
    );
    assert.equal(response.status(), 200, crest.file);
  }
  report.actions.push("48 rutas PNG responden 200");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(base);
  await page.getByRole("button", { name: "Menú", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Cerrar", exact: true })
      .getAttribute("aria-expanded"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Menú", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  await page.getByRole("button", { name: "Menú", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Cómo se juega", exact: true })
    .click();
  assert.ok(page.url().endsWith("#formato"));
  assert.equal(
    await page
      .getByRole("button", { name: "Menú", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  const late = page.getByText("¿Puede llegar tarde el tercer titular?", {
    exact: true,
  });
  await late.focus();
  await page.keyboard.press("Enter");
  assert.equal(
    await late.evaluate((element) => element.parentElement.open),
    true,
  );
  report.actions.push("Menú móvil, Escape, anclas y detalles con teclado");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".trophy-poster")
      .first()
      .evaluate((element) => window.getComputedStyle(element).animationName),
    "none",
  );
  await select.selectOption("Costa Rica");
  await count(4);
  report.actions.push("Movimiento reducido mantiene controles y resultados");
  const missing = await page.goto(new URL("/pagina-inexistente", base).href, {
    waitUntil: "networkidle",
  });
  assert.equal(missing.status(), 404);
  await page.screenshot({
    path: `${output}/after-404-mobile.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Volver al inicio", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Champions Fútbol Prohibido", exact: true })
    .waitFor();
  report.actions.push("404 y regreso al inicio");
  // Native Chromium zoom in a fresh, isolated profile (no user browser settings).
  const zoomProfile = await fs.mkdtemp(
    path.join(os.tmpdir(), "champions-native-zoom-"),
  );
  await fs.mkdir(path.join(zoomProfile, "Default"));
  await fs.writeFile(
    path.join(zoomProfile, "Default", "Preferences"),
    JSON.stringify({
      partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } },
    }),
  );
  const zoomContext = await chromium.launchPersistentContext(zoomProfile, {
    executablePath,
    headless: true,
    viewport: null,
    args: ["--window-size=1440,1000"],
  });
  const zoom = await zoomContext.newPage();
  await zoom.goto(base, { waitUntil: "networkidle" });
  await zoom.waitForTimeout(500);
  const zoomCdp = await zoomContext.newCDPSession(zoom);
  async function captureNativeZoom(filename) {
    const metrics = await zoomCdp.send("Page.getLayoutMetrics");
    // Native zoom changes DIP metrics. Playwright's default CSS clip cuts the
    // image in half here; use Chromium's physical/DIP bounds for evidence.
    const bounds = metrics.layoutViewport;
    const screenshot = await zoomCdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
      clip: {
        x: bounds.pageX,
        y: bounds.pageY,
        width: bounds.width || bounds.clientWidth,
        height: bounds.height || bounds.clientHeight,
        scale: 1,
      },
    });
    await fs.writeFile(filename, Buffer.from(screenshot.data, "base64"));
  }
  await captureNativeZoom(`${output}/native-zoom-200-hero.png`);
  const zoomMetrics = await zoom.evaluate(() => ({
    outerWidth: window.outerWidth,
    cssViewport: window.innerWidth,
    dpr: window.devicePixelRatio,
    cssZoom: window.getComputedStyle(document.documentElement).zoom,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.equal(zoomMetrics.dpr, 2);
  assert.ok(zoomMetrics.scrollWidth <= zoomMetrics.cssViewport);
  await zoom.getByRole("button", { name: "Menú", exact: true }).click();
  await zoom
    .getByRole("navigation")
    .getByRole("link", { name: "Escudos", exact: true })
    .click();
  await zoom.getByRole("combobox").selectOption("Costa Rica");
  await zoom.waitForFunction(
    () => document.querySelectorAll(".crest-tile").length === 4,
  );
  await zoom.waitForTimeout(500);
  await zoom.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((resolve) => window.setTimeout(resolve, 60));
    }
    await Promise.all(
      Array.from(document.images).map((image) => image.decode()),
    );
    window.scrollTo(0, 0);
  });
  await zoom.waitForTimeout(300);
  await zoom.locator(".crest-art").first().scrollIntoViewIfNeeded();
  await zoom.waitForTimeout(400);
  await captureNativeZoom(`${output}/after-zoom-200.png`);
  report.zoom200 = {
    method:
      "Native Edge/Chromium browser zoom 200% in isolated profile; default_zoom_level=log(2)/log(1.2), CSS zoom remains 1",
    ...zoomMetrics,
    controls: "PASS",
  };
  await zoomContext.close();
  assert.deepEqual(consoleErrors, []);
  const violations = report.widths.flatMap((layout) => layout.axeViolations);
  report.status = violations.length ? "FAIL_A11Y" : "PASS";
  await fs.writeFile(
    path.join(output, "verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        ...report,
        widths: report.widths.map((layout) => ({
          ...layout,
          controls: undefined,
        })),
      },
      null,
      2,
    ),
  );
  assert.equal(
    violations.length,
    0,
    "Revisar fallos de accesibilidad en verification.json",
  );
} finally {
  await browser.close();
}
