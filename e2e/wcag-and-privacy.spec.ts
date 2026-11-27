import { expect, test, type Locator, type Page } from "@playwright/test";

const EMERGENCY_DISCLAIMER =
  "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.";

const REQUIRED_TEL_NUMBERS = ["180", "190", "192", "197", "100"] as const;

const TRACKING_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "analytics.google.com",
  "hotjar.com",
  "mixpanel.com",
  "segment.io",
  "connect.facebook.net",
  "clarity.ms",
  "vitals.vercel-insights.com",
  "va.vercel-scripts.com",
];

async function expectTouchTargetAtLeast44Px(locator: Locator, label: string) {
  await expect(locator, `Expected "${label}" to be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `Expected "${label}" to have a bounding box`).not.toBeNull();
  expect(box!.width, `Width of "${label}" should be >= 44px`).toBeGreaterThanOrEqual(43.5);
  expect(box!.height, `Height of "${label}" should be >= 44px`).toBeGreaterThanOrEqual(43.5);
}

async function expectZeroClientStorageAndCookies(page: Page, stage: string) {
  const state = await page.evaluate(() => ({
    cookie: document.cookie,
    localStorageLen: window.localStorage.length,
    sessionStorageLen: window.sessionStorage.length,
  }));
  expect(state.cookie, `Cookies must stay empty (${stage})`).toBe("");
  expect(state.localStorageLen, `localStorage must stay empty (${stage})`).toBe(0);
  expect(state.sessionStorageLen, `sessionStorage must stay empty (${stage})`).toBe(0);
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function boxesOverlap(a: Box, b: Box, tolerance = 1): boolean {
  return !(
    a.x + a.width <= b.x + tolerance ||
    b.x + b.width <= a.x + tolerance ||
    a.y + a.height <= b.y + tolerance ||
    b.y + b.height <= a.y + tolerance
  );
}

async function expectNonOverlapping(a: Locator, aLabel: string, b: Locator, bLabel: string) {
  await expect(a, `Expected "${aLabel}" to be visible`).toBeVisible();
  await expect(b, `Expected "${bLabel}" to be visible`).toBeVisible();
  const boxA = await a.boundingBox();
  const boxB = await b.boundingBox();
  expect(boxA, `Expected "${aLabel}" to have a bounding box`).not.toBeNull();
  expect(boxB, `Expected "${bLabel}" to have a bounding box`).not.toBeNull();
  expect(
    boxesOverlap(boxA!, boxB!),
    `Expected "${aLabel}" (${JSON.stringify(boxA)}) not to overlap "${bLabel}" (${JSON.stringify(boxB)})`,
  ).toBe(false);
}

async function expectContrastAtLeast(locator: Locator, label: string, minRatio = 4.5) {
  await expect(locator, `Expected "${label}" to be visible`).toBeVisible();
  const result = await locator.evaluate((el) => {
    const parseRgba = (color: string): [number, number, number, number] => {
      const match = color.match(/rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
      if (!match) {
        return [0, 0, 0, 0];
      }
      return [
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        match[4] !== undefined ? Number(match[4]) : 1,
      ];
    };

    const compositeOver = (
      fg: [number, number, number, number],
      bg: [number, number, number],
    ): [number, number, number] => {
      const a = fg[3];
      return [
        fg[0] * a + bg[0] * (1 - a),
        fg[1] * a + bg[1] * (1 - a),
        fg[2] * a + bg[2] * (1 - a),
      ];
    };

    const layers: Array<[number, number, number, number]> = [];
    let current: HTMLElement | null = el as HTMLElement;
    while (current) {
      const bg = parseRgba(window.getComputedStyle(current).backgroundColor);
      if (bg[3] > 0) {
        layers.push(bg);
        if (bg[3] >= 1) {
          break;
        }
      }
      current = current.parentElement;
    }

    let resolvedBg: [number, number, number] = [255, 255, 255];
    for (let i = layers.length - 1; i >= 0; i -= 1) {
      resolvedBg = compositeOver(layers[i], resolvedBg);
    }

    const rawFg = parseRgba(window.getComputedStyle(el).color);
    const resolvedFg = compositeOver(rawFg, resolvedBg);

    const relLuminance = ([r, g, b]: [number, number, number]): number => {
      const [sr, sg, sb] = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
    };

    const l1 = relLuminance(resolvedFg);
    const l2 = relLuminance(resolvedBg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return { ratio, fg: resolvedFg, bg: resolvedBg };
  });

  expect(
    result.ratio,
    `Expected WCAG contrast >= ${minRatio}:1 for "${label}" (got ${result.ratio.toFixed(2)}:1, fg=${result.fg.map(Math.round).join(",")}, bg=${result.bg.map(Math.round).join(",")})`,
  ).toBeGreaterThanOrEqual(minRatio);
}

test.describe("Tecendo Vozes — WCAG 2.1 AA, Keyboard Navigation & Zero-Tracking Privacy", () => {
  test("home landmarks, emergency tel: links, Pernambuco mini-map, and >=44px touch targets", async ({
    page,
  }) => {
    await page.goto("/");

    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute("id", "conteudo-principal");

    const searchRegion = page.getByRole("search", { name: /busca e filtros de locais/i });
    await expect(searchRegion).toBeVisible();

    const miniMap = page.getByTestId("pernambuco-minimap");
    await expect(miniMap).toBeVisible();

    await expect(page.getByTestId("emergency-bar")).toHaveCount(0);
    await expect(page.getByText(/locais encontrados/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /visão em lista/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /voltar ao centro/i })).toHaveCount(0);

    await expectTouchTargetAtLeast44Px(
      page.getByRole("searchbox", { name: /buscar locais por nome/i }),
      "Search input",
    );
    await expectTouchTargetAtLeast44Px(
      page.getByTestId("three-dots-trigger"),
      "Three dots menu trigger",
    );
    await expectTouchTargetAtLeast44Px(
      page.getByRole("button", { name: /minha localização aproximada/i }),
      "Geolocation button",
    );
    await expectTouchTargetAtLeast44Px(
      page.getByTestId("map-theme-switch"),
      "Map theme switch",
    );

    const categoryGroup = page.getByRole("group", { name: /filtrar por categoria/i });
    const categoryButtons = categoryGroup.getByRole("button");
    const categoryCount = await categoryButtons.count();
    expect(categoryCount).toBe(6);
    for (let i = 0; i < categoryCount; i += 1) {
      await expectTouchTargetAtLeast44Px(categoryButtons.nth(i), `Category chip ${i + 1}`);
    }

    // Emergency tel: links, WhatsApp 180, and disclaimer remain accessible via ThreeDotsMenu -> Denuncie
    await page.getByTestId("three-dots-trigger").click();
    await page.getByRole("button", { name: /denuncie/i }).click();
    const reportDialog = page.getByRole("dialog", { name: /menu de informações e denúncia/i });
    await expect(reportDialog).toContainText(EMERGENCY_DISCLAIMER);

    for (const num of REQUIRED_TEL_NUMBERS) {
      const link = reportDialog.getByRole("link", { name: new RegExp(`ligar para ${num}`, "i") });
      await expect(link).toHaveAttribute("href", `tel:${num}`);
      await expectTouchTargetAtLeast44Px(link, `Emergency tel:${num}`);
    }

    const whatsappLink = reportDialog.getByRole("link", { name: /whatsapp.*180/i });
    await expect(whatsappLink).toHaveAttribute("href", "https://wa.me/556196100180");
    await expectTouchTargetAtLeast44Px(whatsappLink, "WhatsApp 180");
    await page.keyboard.press("Escape");
    await expect(reportDialog).toBeHidden();
  });

  test("full keyboard navigation across search, category chips, map markers, PlacePreview, PlaceDetailsModal, and ThreeDotsMenu", async ({
    page,
  }) => {
    await page.goto("/");

    // Skip link receives focus on first Tab
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /ir para o conteúdo principal/i });
    await expect(skipLink).toBeFocused();

    // Search via keyboard + clear via Enter
    const searchInput = page.getByRole("searchbox", { name: /buscar locais por nome/i });
    await searchInput.focus();
    await searchInput.fill("ubs");
    await expect(page.getByRole("button", { name: /limpar busca/i })).toBeVisible();

    await page.keyboard.press("Tab");
    const clearButton = page.getByRole("button", { name: /limpar busca/i });
    await expect(clearButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(searchInput).toHaveValue("");

    // Toggle category chip with keyboard
    const saudeChip = page
      .getByRole("group", { name: /filtrar por categoria/i })
      .getByRole("button", { name: "Saúde", exact: true });
    await saudeChip.focus();
    await page.keyboard.press("Enter");
    await expect(saudeChip).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(saudeChip).toHaveAttribute("aria-pressed", "false");

    // Filter to uncluster UBS Centro marker and open PlacePreview via keyboard Enter
    await searchInput.fill("UBS Centro");
    const ubsMarker = page.getByTestId("map-marker-ubs-centro-saude-mulher");
    await expect(ubsMarker).toBeVisible({ timeout: 10000 });
    await ubsMarker.focus();
    await page.keyboard.press("Enter");

    const preview = page.getByRole("region", {
      name: /pré-visualização de UBS Centro — Espaço Saúde da Mulher/i,
    });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("link", { name: /como chegar/i })).toHaveCount(0);

    // Open PlaceDetailsModal via keyboard Enter on "Conhecer mais"
    await expect(preview.getByTestId("place-preview-image")).toBeVisible();
    const openDetailsBtn = preview.getByRole("button", { name: /conhecer mais/i });
    await openDetailsBtn.focus();
    await page.keyboard.press("Enter");

    const detailsDialog = page.getByRole("dialog", {
      name: /UBS Centro — Espaço Saúde da Mulher/i,
    });
    await expect(detailsDialog).toBeVisible();

    const youtubeEmbed = detailsDialog.locator('iframe[src*="youtube-nocookie.com/embed/"]');
    await expect(youtubeEmbed).toHaveCount(1);
    await expect(detailsDialog.getByRole("link", { name: /como chegar/i })).toBeVisible();

    // Escape closes PlaceDetailsModal first, keeping PlacePreview open
    await page.keyboard.press("Escape");
    await expect(detailsDialog).toBeHidden();
    await expect(preview).toBeVisible();

    // Second Escape closes PlacePreview
    await page.keyboard.press("Escape");
    await expect(preview).toBeHidden();

    // Test ThreeDotsMenu (backdrop blur + exact 2 buttons)
    const threeDotsTrigger = page.getByTestId("three-dots-trigger");
    await threeDotsTrigger.focus();
    await page.keyboard.press("Enter");

    const backdrop = page.getByTestId("three-dots-backdrop");
    await expect(backdrop).toBeVisible();
    const backdropFilter = await backdrop.evaluate(
      (el) => window.getComputedStyle(el).backdropFilter,
    );
    expect(backdropFilter).toContain("blur");

    const menuDialog = page.getByRole("dialog", { name: /menu de informações e denúncia/i });
    const menuButtons = menuDialog.getByRole("button");
    await expect(menuButtons).toHaveCount(2);
    await expect(menuButtons.nth(0)).toHaveAccessibleName(/sobre nós/i);
    await expect(menuButtons.nth(1)).toHaveAccessibleName(/denuncie/i);

    // Escape closes ThreeDotsMenu and restores focus
    await page.keyboard.press("Escape");
    await expect(menuDialog).toBeHidden();
    await expect(threeDotsTrigger).toBeFocused();
  });

  test("zero cookies, zero localStorage/sessionStorage, zero analytics requests, and zero network requests during search/filtering", async ({
    page,
  }) => {
    const allExternalRequests: string[] = [];
    const requestsDuringSearchAndFilter: string[] = [];
    let recordingFilterPhase = false;

    // Abort remote tile requests so map settles deterministically before measuring search/filter phase
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());

    page.on("request", (req) => {
      const url = req.url();
      allExternalRequests.push(url);
      if (recordingFilterPhase) {
        requestsDuringSearchAndFilter.push(url);
      }
    });

    await page.goto("/");
    await expect(page.getByRole("main")).toHaveAttribute("data-map-error", "true");
    await expect(page.getByTestId("map-offline-fallback")).toBeVisible();
    await expect(page.getByTestId("emergency-bar")).toHaveCount(1);
    await expectZeroClientStorageAndCookies(page, "initial load");

    // Start recording strictly during client-side search & category filters
    recordingFilterPhase = true;
    const searchInput = page.getByRole("searchbox", { name: /buscar locais por nome/i });
    await searchInput.fill("serra do vento");
    const apoioChip = page
      .getByRole("group", { name: /filtrar por categoria/i })
      .getByRole("button", { name: "Apoio público", exact: true });
    await apoioChip.click();
    await page.getByRole("button", { name: /limpar busca/i }).click();
    await apoioChip.click();
    recordingFilterPhase = false;

    expect(
      requestsDuringSearchAndFilter,
      "Search, category filtering, and view toggling must make zero network requests",
    ).toEqual([]);
    await expectZeroClientStorageAndCookies(page, "after search and filtering");

    for (const url of allExternalRequests) {
      for (const tracker of TRACKING_DOMAINS) {
        expect(url, `Unexpected tracking request to ${tracker}`).not.toContain(tracker);
      }
    }
  });

  test("navigates to /privacidade and /termos from ThreeDotsMenu and List View footer with full LGPD content and emergency links", async ({
    page,
  }) => {
    await page.goto("/");

    // 1) Reach /privacidade via ThreeDotsMenu ("Sobre nós")
    await page.getByTestId("three-dots-trigger").click();
    await page.getByRole("button", { name: /sobre nós/i }).click();
    const privacyMenuLink = page
      .getByRole("dialog")
      .getByRole("link", { name: /política de privacidade/i });
    await expectTouchTargetAtLeast44Px(privacyMenuLink, "Menu link to /privacidade");
    await privacyMenuLink.click();

    await expect(page).toHaveURL(/\/privacidade$/, { timeout: 10000 });
    const privMain = page.getByRole("main");
    await expect(privMain.getByRole("heading", { level: 1 })).toContainText(
      /política de privacidade/i,
    );
    await expect(privMain).not.toContainText(/pedro xavier/i);
    await expect(privMain).toContainText(/vercel/i);
    await expect(privMain).toContainText(/youtube-nocookie\.com/i);
    await expect(privMain).toContainText(/aba anônima|navegação privada/i);

    const privEmergency = page.getByTestId("emergency-bar");
    await expect(privEmergency).toContainText(EMERGENCY_DISCLAIMER);
    for (const num of REQUIRED_TEL_NUMBERS) {
      await expect(
        privEmergency.getByRole("link", { name: new RegExp(`ligar para ${num}`, "i") }),
      ).toHaveAttribute("href", `tel:${num}`);
    }
    await expectZeroClientStorageAndCookies(page, "/privacidade");

    // 2) Footer has no navigation buttons; navigate from /privacidade to /termos via header link
    const privFooter = page.getByRole("contentinfo");
    await expect(privFooter.getByRole("link")).toHaveCount(0);

    const termsHeaderLink = page
      .getByRole("banner")
      .getByRole("link", { name: /termos de uso/i });
    await expectTouchTargetAtLeast44Px(termsHeaderLink, "Privacy header link to /termos");
    await termsHeaderLink.click();

    await expect(page).toHaveURL(/\/termos$/, { timeout: 10000 });
    const termsMain = page.getByRole("main");
    await expect(termsMain.getByRole("heading", { level: 1 })).toContainText(/termos de uso/i);
    await expect(termsMain).toContainText(/não é um canal oficial/i);
    await expect(termsMain).toContainText(/autorizacoes\.json/i);
    await expect(termsMain).toContainText(/abrigos|casas de acolhimento/i);
    await expect(termsMain).not.toContainText(/pedro xavier/i);

    const termsEmergency = page.getByTestId("emergency-bar");
    await expect(termsEmergency).toContainText(EMERGENCY_DISCLAIMER);
    for (const num of REQUIRED_TEL_NUMBERS) {
      await expect(
        termsEmergency.getByRole("link", { name: new RegExp(`ligar para ${num}`, "i") }),
      ).toHaveAttribute("href", `tel:${num}`);
    }
    await expectZeroClientStorageAndCookies(page, "/termos");

    // 3) Footer has no navigation buttons; return to / via header link
    await expect(page.getByRole("contentinfo").getByRole("link")).toHaveCount(0);
    await page.getByRole("banner").getByRole("link", { name: /voltar ao mapa/i }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
  });

  test("verifies computed WCAG 2.1 AA contrast (>= 4.5:1) across /, /privacidade, and /termos", async ({
    page,
  }) => {
    await page.goto("/");

    await expectContrastAtLeast(
      page.getByRole("searchbox", { name: /buscar locais por nome/i }),
      "Home search input",
    );

    const categoryGroup = page.getByRole("group", { name: /filtrar por categoria/i });
    const categoryButtons = categoryGroup.getByRole("button");
    const count = await categoryButtons.count();
    for (let i = 0; i < count; i += 1) {
      await expectContrastAtLeast(categoryButtons.nth(i), `Category chip ${i + 1}`);
    }

    // Verify /privacidade computed contrast
    await page.goto("/privacidade");
    await expectContrastAtLeast(
      page.getByRole("main").getByRole("heading", { level: 1 }),
      "/privacidade h1",
    );
    await expectContrastAtLeast(
      page.getByRole("main").getByRole("heading", { level: 2 }).first(),
      "/privacidade h2",
    );
    await expectContrastAtLeast(
      page.getByRole("main").locator("section p").first(),
      "/privacidade primary text",
    );
    await expectContrastAtLeast(
      page.getByTestId("emergency-bar").locator("p").first(),
      "/privacidade emergency disclaimer",
    );

    // Verify /termos computed contrast
    await page.goto("/termos");
    await expectContrastAtLeast(
      page.getByRole("main").getByRole("heading", { level: 1 }),
      "/termos h1",
    );
    await expectContrastAtLeast(
      page.getByRole("main").getByRole("heading", { level: 2 }).first(),
      "/termos h2",
    );
    await expectContrastAtLeast(
      page.getByRole("main").locator("section p").first(),
      "/termos primary text",
    );
    await expectContrastAtLeast(
      page.getByTestId("emergency-bar").locator("p").first(),
      "/termos emergency disclaimer",
    );
  });

  test("enforces responsive non-overlap and layered Escape priority across desktop and mobile", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    const searchRegion = page.getByRole("search", { name: /busca e filtros de locais/i });
    const geoBtn = page.getByRole("button", { name: /minha localização aproximada/i });
    const themeSwitch = page.getByTestId("map-theme-switch");
    const miniMap = page.getByTestId("pernambuco-minimap");
    const threeDotsTrigger = page.getByTestId("three-dots-trigger");

    // SearchAndFilters must never overlap map controls on either mobile or desktop
    await expectNonOverlapping(searchRegion, "SearchAndFilters", geoBtn, "Geolocation button");
    await expectNonOverlapping(searchRegion, "SearchAndFilters", themeSwitch, "Map theme switch");

    // Toggle Original <-> Rosa map theme switch without storage writes
    await expect(themeSwitch).toHaveAttribute("aria-checked", "false");
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute("aria-checked", "true");
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute("aria-checked", "false");
    await expectZeroClientStorageAndCookies(page, "after map theme switch");

    // Search for UBS Centro to uncluster its marker, open PlacePreview, then clear search
    const searchInput = page.getByRole("searchbox", { name: /buscar locais por nome/i });
    await searchInput.fill("UBS Centro");
    const ubsMarker = page.getByTestId("map-marker-ubs-centro-saude-mulher");
    await expect(ubsMarker).toBeVisible({ timeout: 10000 });
    await ubsMarker.click();

    const preview = page.getByRole("region", {
      name: /pré-visualização de UBS Centro — Espaço Saúde da Mulher/i,
    });
    await expect(preview).toBeVisible();
    await page.getByRole("button", { name: /limpar busca/i }).click();

    if (testInfo.project.name === "mobile") {
      // Mobile (390x844): Bottom Sheet hides PernambucoMiniMap and ThreeDotsMenu trigger
      await expect(miniMap).toBeHidden();
      await expect(threeDotsTrigger).toBeHidden();
      await expectNonOverlapping(searchRegion, "SearchAndFilters", preview, "Mobile PlacePreview");
    } else {
      // Desktop (1280x800): filters strip sits beside search bar on top row (scrollbar hidden),
      // and ~1/3 left PlacePreview, SearchAndFilters, PernambucoMiniMap, and geolocation button stay non-overlapping
      const categoryGroup = page.getByRole("group", { name: /filtrar por categoria/i });
      const searchBox = await searchRegion.boundingBox();
      const categoryGroupBox = await categoryGroup.boundingBox();
      expect(searchBox).not.toBeNull();
      expect(categoryGroupBox).not.toBeNull();
      expect(categoryGroupBox!.x).toBeGreaterThanOrEqual(searchBox!.x + searchBox!.width - 1);

      const previewBox = await preview.boundingBox();
      expect(previewBox).not.toBeNull();
      expect(previewBox!.width).toBeGreaterThanOrEqual(340);
      expect(previewBox!.width).toBeLessThanOrEqual(440);

      await expectNonOverlapping(searchRegion, "SearchAndFilters", preview, "Desktop PlacePreview");
      await expectNonOverlapping(categoryGroup, "Category chips", geoBtn, "Geolocation button");
      await expectNonOverlapping(preview, "Desktop PlacePreview", miniMap, "PernambucoMiniMap");
      await expectNonOverlapping(searchRegion, "SearchAndFilters", miniMap, "PernambucoMiniMap");

      // Layered Escape + bottom-right anchored ThreeDotsMenu above and slightly left of "..." trigger
      await threeDotsTrigger.click();
      const menuDialog = page.getByRole("dialog", { name: /menu de informações e denúncia/i });
      await expect(menuDialog).toBeVisible();

      const triggerBox = await threeDotsTrigger.boundingBox();
      const menuBox = await menuDialog.boundingBox();
      expect(triggerBox).not.toBeNull();
      expect(menuBox).not.toBeNull();
      expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(triggerBox!.y + 4);
      expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(
        triggerBox!.x + triggerBox!.width,
      );

      await page.keyboard.press("Escape");
      await expect(menuDialog).toBeHidden();
      await expect(preview).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(preview).toBeHidden();
    }
  });

  test("serves /maplibre-gl-worker.js cleanly and loads the map without worker errors", async ({
    page,
  }) => {
    const workerErrors: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("Worker failed to load")) {
        workerErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      if (error.message.includes("Worker failed to load")) {
        workerErrors.push(error.message);
      }
    });

    const workerResponse = await page.request.get("/maplibre-gl-worker.js");
    expect(workerResponse.status()).toBe(200);
    expect(workerResponse.headers()["content-type"] ?? "").toMatch(/javascript/);

    await page.goto("/");
    await expect(page.getByTestId("belo-jardim-map-canvas")).toBeVisible();
    await page.waitForTimeout(1500);

    expect(workerErrors).toEqual([]);
    const offlineFallback = page.getByTestId("map-offline-fallback");
    if ((await offlineFallback.count()) > 0) {
      await expect(offlineFallback).not.toContainText("Worker failed to load");
    }
  });
});
