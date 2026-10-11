import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const base = process.env.AEROLAB_URL ?? "http://127.0.0.1:8001";
let count = 0;
async function check(name, run) {
  await run();
  count++;
  console.log(`PASS ${name}`);
}
try {
  const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/structure.html`);
  await page.waitForFunction(
    () => document.querySelector("#design-view").dataset.rendered === "true",
  );
  await check(
    "NACA geometry and actual 3D meshes, nodal counts, orbit/zoom/pan camera",
    async () => {
      assert.equal(
        await page.locator("#design-view").getAttribute("data-meshes"),
        "3",
      );
      assert.equal(
        await page.locator("#design-view").getAttribute("data-nodes"),
        "34",
      );
      const canvas = page.locator("#design-view canvas");
      const image = await canvas.screenshot();
      const camera = await page
        .locator("#design-view")
        .getAttribute("data-camera");
      await canvas.focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(100);
      assert.notEqual(
        await page.locator("#design-view").getAttribute("data-camera"),
        camera,
      );
      assert.notDeepEqual(await canvas.screenshot(), image);
      await page.keyboard.press("+");
      await page.keyboard.press("Shift+ArrowUp");
      await page.locator("#design-wing-sweep").fill("25");
      assert.match(
        await page.locator("#design-status").innerText(),
        /calculado/,
      );
      await page.locator("#design-wing-thickness").fill("0.003");
      assert.match(await page.locator("#design-kpi-mass").innerText(), /397/);
    },
  );
  await check(
    "3D viewer moves to loads tab, pressure/thermal and actual deformation animation",
    async () => {
      await page.locator("#design-object").selectOption("rocket");
      await page.locator("#design-section-count").selectOption("3");
      assert.equal(
        await page.locator("#design-view").getAttribute("data-meshes"),
        "7",
      );
      await page.locator("#tab-analysis").click();
      assert.ok(await page.locator("#design-load-mount canvas").isVisible());
      await page.locator("#design-case").selectOption("pressure");
      assert.match(
        await page.locator("#design-load-note").innerText(),
        /membranas/,
      );
      await page.locator("#design-fraction").fill("0");
      await page.waitForTimeout(100);
      assert.equal(
        await page.locator("#design-view").getAttribute("data-fraction"),
        "0.000",
      );
      await page.locator("#design-animate").click();
      await page.waitForTimeout(250);
      const first = await page
        .locator("#design-view")
        .getAttribute("data-fraction");
      await page.waitForTimeout(300);
      assert.notEqual(
        await page.locator("#design-view").getAttribute("data-fraction"),
        first,
      );
      await page.locator("#design-animate").click();
      await page.locator("#design-case").selectOption("thermal");
      await page.locator("#design-restraint").selectOption("fixed");
      assert.match(
        await page.locator("#design-load-note").innerText(),
        /0,000 mm/,
      );
    },
  );
  await check(
    "UD criteria and unsupported sphere are explicit; sphere is not a planet solver",
    async () => {
      await page.locator("#tab-simulation").click();
      await page.locator("#design-material").selectOption("carbon");
      await page.locator("#design-object").selectOption("sphere");
      await page.locator("#tab-theory").click();
      assert.match(
        await page.locator("#design-warnings").innerText(),
        /Solo geometría\/masa/,
      );
      assert.equal(await page.locator("#design-points tr").count(), 0);
      await page.locator("#tab-simulation").click();
      await page.locator("#design-material").selectOption("steel");
      await page.locator("#tab-analysis").click();
      await page.locator("#design-case").selectOption("pressure");
      await page.locator("#tab-theory").click();
      assert.equal(await page.locator("#design-points tr").count(), 2);
      assert.match(
        await page.locator("#design-results").innerText(),
        /MEMBRANA|MASA DE SUPERFICIES/,
      );
    },
  );
  await check(
    "Invalid state clears all fields and metrics; recovery works",
    async () => {
      await page.locator("#tab-simulation").click();
      await page.locator("#design-sphere-radius").fill("");
      assert.match(
        await page.locator("#design-status").innerText(),
        /Sin resultados/,
      );
      assert.equal(await page.locator("#design-kpi-mass").innerText(), "—");
      assert.ok(await page.locator("#design-save").isDisabled());
      await page.locator("#tab-theory").click();
      assert.equal(await page.locator("#design-points tr").count(), 0);
      assert.equal(await page.locator("#design-chart polyline").count(), 0);
      await page.locator("#tab-simulation").click();
      await page.locator("#design-sphere-radius").fill("1");
      assert.ok(await page.locator("#design-save").isEnabled());
    },
  );
  let link;
  await check(
    "Independent design save, full JSON/CSV and shared exact state restored paused",
    async () => {
      await page.locator("#design-save").click();
      const saved = await page.evaluate(() =>
        localStorage.getItem("aerolab.structure.design.v2"),
      );
      await page.locator("#design-sphere-radius").fill("2");
      await page.locator("#design-load").click();
      assert.equal(
        await page.locator("#design-sphere-radius").inputValue(),
        "1",
      );
      const [json] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#design-json").click(),
      ]);
      const record = JSON.parse(await readFile(await json.path(), "utf8"));
      assert.equal(record.version, 2);
      await page.locator("#tab-theory").click();
      const [csv] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("#design-csv").click(),
      ]);
      assert.match(await readFile(await csv.path(), "utf8"), /von_mises_Pa/);
      await page.locator("#share-simulation").click();
      await page.waitForFunction(() =>
        document.querySelector("#share-status").textContent.includes("copiado"),
      );
      link = await page.evaluate(() => navigator.clipboard.readText());
      await page.goto(link);
      await page.waitForFunction(() =>
        document
          .querySelector("#share-status")
          .textContent.includes("recuperada"),
      );
      assert.equal(
        await page.locator("#design-sphere-radius").inputValue(),
        "1",
      );
      assert.equal(
        await page.locator("#design-animate").innerText(),
        "Animar deformación",
      );
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem("aerolab.structure.design.v2"),
        ),
        saved,
      );
    },
  );
  await check(
    "Old structure links accepted; multi-part invalid link rejected before applying any values",
    async () => {
      const url = new URL(link),
        state = JSON.parse(url.searchParams.get("sim"));
      state.structure.configuration.force = 1234;
      state.design.configuration.sphere.radius = -1;
      url.searchParams.set("sim", JSON.stringify(state));
      await page.goto(url.href);
      assert.match(
        await page.locator("#share-status").innerText(),
        /rechazado/,
      );
      assert.equal(await page.locator("#str-force").inputValue(), "5000");
      delete state.design;
      url.searchParams.set("sim", JSON.stringify(state));
      await page.goto(url.href);
      assert.match(
        await page.locator("#share-status").innerText(),
        /recuperada/,
      );
      assert.equal(await page.locator("#str-force").inputValue(), "1234");
    },
  );
  await check(
    "Unsaved Aircraft data import recalculates lift and retains missing geometry",
    async () => {
      await page.goto(`${base}/aircraft.html`);
      await page.locator("#eng-area").fill("24");
      await page.locator("#eng-span").fill("12");
      await page.locator("#eng-thrust").fill("1400");
      await page.goto(`${base}/structure.html`);
      await page.locator("#design-import").click();
      assert.equal(await page.locator("#design-wing-span").inputValue(), "12");
      assert.match(
        await page.locator("#design-import-status").innerText(),
        /sustentación actual importadas/,
      );
      await page.locator("#tab-analysis").click();
      assert.ok(Number(await page.locator("#design-force").inputValue()) > 0);
    },
  );
  await check(
    "Mass export reviewed at Aircraft destination, changes only mass, applies once",
    async () => {
      await page.locator("#tab-theory").click();
      await page.locator("#design-export").click();
      assert.match(
        await page.locator("#design-export-status").innerText(),
        /Propuesta enviada/,
      );
      await page.locator("#design-export-link").click();
      assert.equal(await page.locator(".mass-inbox").count(), 1);
      assert.equal(await page.locator("#eng-mass").inputValue(), "1200");
      await page.locator("#eng-mass").fill("1600");
      assert.match(
        await page.locator(".mass-inbox p").innerText(),
        /1600\.000/,
      );
      const before = Number(await page.locator("#eng-mass").inputValue());
      await page.locator(".mass-inbox button").first().click();
      assert.ok(Number(await page.locator("#eng-mass").inputValue()) > before);
      assert.equal(await page.locator("#eng-thrust").inputValue(), "1200");
      assert.equal(await page.locator("#eng-area").inputValue(), "16");
      assert.equal(await page.locator(".mass-inbox").count(), 0);
      await page.reload();
      assert.equal(await page.locator(".mass-inbox").count(), 0);
    },
  );
  await check(
    "Rocket calculator dimensions import and mass proposal for multistage dry mass",
    async () => {
      await page.goto(`${base}/rocket.html`);
      await page.locator("#eng-length").fill("6");
      await page.locator("#eng-thrustPercent").fill("50");
      await page.goto(`${base}/structure.html`);
      await page.locator("#design-import-source").selectOption("calculator");
      await page.locator("#design-import").click();
      assert.equal(
        await page.locator("#design-rocket-sections-0-length").inputValue(),
        "4.800000000000001",
      );
      assert.match(
        await page.locator("#design-import-status").innerText(),
        /80 %/,
      );
      await page.locator("#design-import-source").selectOption("launch");
      await page.locator("#design-import").click();
      assert.match(
        await page.locator("#design-import-status").innerText(),
        /no define geometría/,
      );
      await page.locator("#tab-theory").click();
      await page.locator("#design-export-target").selectOption("launch");
      await page.locator("#design-export-stage").fill("2");
      await page.locator("#design-export").click();
      await page.locator("#design-export-link").click();
      const dry = Number(await page.locator("#stage-1-dry").inputValue());
      await page.locator(".mass-inbox button").first().click();
      assert.ok(Number(await page.locator("#stage-1-dry").inputValue()) > dry);
      assert.equal(
        await page.locator("#launch-outcome").innerText(),
        "Sin trayectoria vigente.",
      );
    },
  );
  await check(
    "Mobile layout and accessible tabs; reduced motion stays still, no page errors",
    async () => {
      await page.goto(`${base}/structure.html`);
      await page.waitForFunction(
        () =>
          document.querySelector("#design-view").dataset.rendered === "true",
      );
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const tab of ["simulation", "analysis", "theory"]) {
          await page.locator(`#tab-${tab}`).click();
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `overflow ${width}/${tab}`,
          );
        }
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#tab-analysis").click();
      await page.locator("#design-animate").click();
      await page.waitForTimeout(200);
      const a = await page
        .locator("#design-view")
        .getAttribute("data-fraction");
      await page.waitForTimeout(300);
      assert.equal(
        await page.locator("#design-view").getAttribute("data-fraction"),
        a,
      );
      assert.match(
        await page.locator("#design-load-note").innerText(),
        /Movimiento reducido/,
      );
      await page.locator("#tab-simulation").click();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.waitForTimeout(200);
      await page.screenshot({
        path: "/tmp/aerolab-structure-design-desktop.png",
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      await page.screenshot({
        path: "/tmp/aerolab-structure-design-mobile.png",
        fullPage: true,
      });
      assert.deepEqual(errors, []);
    },
  );
  await check(
    "WebGL unavailable and blocked local storage preserve calculations and show errors",
    async () => {
      const fallbackBrowser = await chromium.launch({
          executablePath: "/usr/bin/chromium",
          args: ["--no-sandbox", "--disable-webgl"],
        }),
        p = await fallbackBrowser.newPage();
      try {
        await p.goto(`${base}/structure.html`);
        await p.waitForFunction(() =>
          document
            .querySelector("#design-view-status")
            .textContent.includes("3D no disponible"),
        );
        assert.match(await p.locator("#design-kpi-mass").innerText(), /305/);
        await p.evaluate(() => {
          Storage.prototype.setItem = () => {
            throw new Error("blocked storage");
          };
        });
        await p.locator("#design-save").click();
        assert.match(
          await p.locator("#design-status").innerText(),
          /No se pudo guardar/,
        );
        await p.locator("#design-wing-span").fill("11");
        assert.match(
          await p.locator("#design-status").innerText(),
          /calculado/,
        );
      } finally {
        await fallbackBrowser.close();
      }
    },
  );
  console.log(`${count} structure design browser groups passed`);
} finally {
  await browser.close();
}
