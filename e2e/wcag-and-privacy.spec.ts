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

    const emergencyBars = page.getByTestId("emergency-bar");
    const emergencyBar = emergencyBars.last();
    await expect(emergencyBar).toBeVisible();
    await expect(emergencyBar).toContainText(EMERGENCY_DISCLAIMER);

    for (const num of REQUIRED_TEL_NUMBERS) {
      const link = emergencyBar.getByRole("link", { name: new RegExp(`ligar para ${num}`, "i") });
      await expect(link).toHaveAttribute("href", `tel:${num}`);
      await expectTouchTargetAtLeast44Px(link, `Emergency tel:${num}`);
    }

    const whatsappLink = emergencyBar.getByRole("link", { name: /whatsapp.*180/i });
    await expect(whatsappLink).toHaveAttribute("href", "https://wa.me/556196100180");
    await expectTouchTargetAtLeast44Px(whatsappLink, "WhatsApp 180");

    await expectTouchTargetAtLeast44Px(
      page.getByRole("searchbox", { name: /buscar locais por nome/i }),
      "Search input",
    );
    await expectTouchTargetAtLeast44Px(
      page.getByRole("button", { name: "Visão em Lista", exact: true }),
      "List view toggle",
    );
    await expectTouchTargetAtLeast44Px(
      page.getByTestId("three-dots-trigger"),
      "Three dots menu trigger",
    );
    await expectTouchTargetAtLeast44Px(
      page.getByRole("button", { name: /voltar ao centro de belo jardim/i }),
      "Recenter map button",
    );
    await expectTouchTargetAtLeast44Px(
      page.getByRole("button", { name: /minha localização aproximada/i }),
      "Geolocation button",
    );

    const categoryGroup = page.getByRole("group", { name: /filtrar por categoria/i });
    const categoryButtons = categoryGroup.getByRole("button");
    const categoryCount = await categoryButtons.count();
    expect(categoryCount).toBe(6);
    for (let i = 0; i < categoryCount; i += 1) {
      await expectTouchTargetAtLeast44Px(categoryButtons.nth(i), `Category chip ${i + 1}`);
    }
  });

  test("full keyboard navigation across search, category chips, List View, PlacePreview, PlaceDetailsModal, and ThreeDotsMenu", async ({
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
    const saudeChip = page.getByRole("button", { name: "Saúde" });
    await saudeChip.focus();
    await page.keyboard.press("Enter");
    await expect(saudeChip).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(saudeChip).toHaveAttribute("aria-pressed", "false");

    // Toggle to Accessible List View via keyboard
    const listToggle = page.getByRole("button", { name: "Visão em Lista", exact: true });
    await listToggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toHaveAttribute("data-view-mode", "list");

    // Open PlacePreview from List View via keyboard Enter
    const ubsButton = page.getByRole("button", {
      name: /ver detalhes de UBS Centro — Espaço Saúde da Mulher/i,
    });
    await ubsButton.focus();
    await page.keyboard.press("Enter");

    const preview = page.getByRole("region", {
      name: /pré-visualização de UBS Centro — Espaço Saúde da Mulher/i,
    });
    await expect(preview).toBeVisible();
    await expect(preview.getByRole("link", { name: /como chegar/i })).toHaveCount(0);

    // Open PlaceDetailsModal via keyboard Enter
    const openDetailsBtn = preview.getByRole("button", { name: /ver detalhes/i });
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

    // Return to Map View and test ThreeDotsMenu (backdrop blur + exact 2 buttons)
    await page.getByRole("button", { name: /ver no mapa/i }).click();
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

    // Start recording strictly during client-side search, category filters & view toggle
    recordingFilterPhase = true;
    const searchInput = page.getByRole("searchbox", { name: /buscar locais por nome/i });
    await searchInput.fill("serra do vento");
    await page.getByRole("button", { name: "Apoio público" }).click();
    await page.getByRole("button", { name: "Visão em Lista", exact: true }).click();
    await page.getByRole("button", { name: /limpar busca/i }).click();
    await page.getByRole("button", { name: "Apoio público" }).click();
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

    await expect(page).toHaveURL(/\/privacidade$/);
    const privMain = page.getByRole("main");
    await expect(privMain.getByRole("heading", { level: 1 })).toContainText(
      /política de privacidade/i,
    );
    await expect(privMain).toContainText(/pedro xavier/i);
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

    // 2) Navigate from /privacidade to /termos via footer link
    const privFooter = page.getByRole("contentinfo");
    const termsFooterLink = privFooter.getByRole("link", { name: /termos de uso/i });
    await expectTouchTargetAtLeast44Px(termsFooterLink, "Privacy footer link to /termos");
    await termsFooterLink.click();

    await expect(page).toHaveURL(/\/termos$/);
    const termsMain = page.getByRole("main");
    await expect(termsMain.getByRole("heading", { level: 1 })).toContainText(/termos de uso/i);
    await expect(termsMain).toContainText(/não é um canal oficial/i);
    await expect(termsMain).toContainText(/autorizacoes\.json/i);
    await expect(termsMain).toContainText(/abrigos|casas de acolhimento/i);
    await expect(termsMain).toContainText(/pedro xavier/i);

    const termsEmergency = page.getByTestId("emergency-bar");
    await expect(termsEmergency).toContainText(EMERGENCY_DISCLAIMER);
    for (const num of REQUIRED_TEL_NUMBERS) {
      await expect(
        termsEmergency.getByRole("link", { name: new RegExp(`ligar para ${num}`, "i") }),
      ).toHaveAttribute("href", `tel:${num}`);
    }
    await expectZeroClientStorageAndCookies(page, "/termos");

    // 3) Return to / and verify List View footer links to /privacidade and /termos
    await page.getByRole("contentinfo").getByRole("link", { name: /voltar ao mapa/i }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: "Visão em Lista", exact: true }).click();
    const listLegalNav = page.getByRole("navigation", { name: /links legais/i });
    const listPrivacyLink = listLegalNav.getByRole("link", { name: /política de privacidade/i });
    const listTermsLink = listLegalNav.getByRole("link", { name: /termos de uso/i });
    await listPrivacyLink.scrollIntoViewIfNeeded();
    await expectTouchTargetAtLeast44Px(listPrivacyLink, "List footer /privacidade");
    await expectTouchTargetAtLeast44Px(listTermsLink, "List footer /termos");
    await expect(listPrivacyLink).toHaveAttribute("href", "/privacidade");
    await expect(listTermsLink).toHaveAttribute("href", "/termos");
  });

  test("verifies computed WCAG 2.1 AA contrast (>= 4.5:1) across /, /privacidade, and /termos", async ({
    page,
  }) => {
    await page.goto("/");

    await expectContrastAtLeast(
      page.getByRole("searchbox", { name: /buscar locais por nome/i }),
      "Home search input",
    );
    await expectContrastAtLeast(
      page.getByRole("button", { name: "Visão em Lista", exact: true }),
      "Home list view toggle",
    );
    await expectContrastAtLeast(
      page.getByTestId("emergency-bar").last().locator("p").first(),
      "Home emergency disclaimer",
    );

    const categoryGroup = page.getByRole("group", { name: /filtrar por categoria/i });
    const categoryButtons = categoryGroup.getByRole("button");
    const count = await categoryButtons.count();
    for (let i = 0; i < count; i += 1) {
      await expectContrastAtLeast(categoryButtons.nth(i), `Category chip ${i + 1}`);
    }

    // Verify primary text and headings in List View
    await page.getByRole("button", { name: "Visão em Lista", exact: true }).click();
    const firstCard = page.getByRole("list", { name: /lista de locais/i }).getByRole("listitem").first();
    await expectContrastAtLeast(firstCard.locator("h2"), "List View place heading");
    await expectContrastAtLeast(firstCard.locator("p").first(), "List View place description");

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
    const recenterBtn = page.getByRole("button", { name: /voltar ao centro de belo jardim/i });
    const geoBtn = page.getByRole("button", { name: /minha localização aproximada/i });
    const miniMap = page.getByTestId("pernambuco-minimap");
    const threeDotsTrigger = page.getByTestId("three-dots-trigger");

    // SearchAndFilters must never overlap map action buttons on either mobile or desktop
    await expectNonOverlapping(searchRegion, "SearchAndFilters", recenterBtn, "Recenter button");
    await expectNonOverlapping(searchRegion, "SearchAndFilters", geoBtn, "Geolocation button");

    // Select a place via List View then switch back to Map View with PlacePreview open
    await page.getByRole("button", { name: "Visão em Lista", exact: true }).click();
    await page
      .getByRole("button", {
        name: /ver detalhes de UBS Centro — Espaço Saúde da Mulher/i,
      })
      .click();

    const preview = page.getByRole("region", {
      name: /pré-visualização de UBS Centro — Espaço Saúde da Mulher/i,
    });
    await expect(preview).toBeVisible();

    await page.getByRole("button", { name: /ver no mapa/i }).click();
    await expect(page.getByRole("main")).toHaveAttribute("data-view-mode", "map");
    await expect(preview).toBeVisible();

    if (testInfo.project.name === "mobile") {
      // Mobile (390x844): Bottom Sheet hides PernambucoMiniMap and ThreeDotsMenu trigger
      await expect(miniMap).toBeHidden();
      await expect(threeDotsTrigger).toBeHidden();
      await expectNonOverlapping(searchRegion, "SearchAndFilters", preview, "Mobile PlacePreview");
    } else {
      // Desktop (1280x800): SearchAndFilters, PlacePreview (left side panel), and PernambucoMiniMap
      // stay simultaneously visible with zero bounding-box overlap
      await expectNonOverlapping(searchRegion, "SearchAndFilters", preview, "Desktop PlacePreview");
      await expectNonOverlapping(preview, "Desktop PlacePreview", miniMap, "PernambucoMiniMap");
      await expectNonOverlapping(searchRegion, "SearchAndFilters", miniMap, "PernambucoMiniMap");

      // Layered Escape: opening ThreeDotsMenu over PlacePreview -> 1st Escape closes ONLY menu,
      // keeping PlacePreview open until 2nd Escape
      await threeDotsTrigger.click();
      const menuDialog = page.getByRole("dialog", { name: /menu de informações e denúncia/i });
      await expect(menuDialog).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(menuDialog).toBeHidden();
      await expect(preview).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(preview).toBeHidden();
    }
  });
});
