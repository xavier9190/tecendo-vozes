import { describe, expect, it } from "vitest";
import type { Local } from "@/lib/data/schema";
import type { CategoryId } from "@/lib/theme/categories";
import { filterPlaces, normalizeText } from "./filter-places";

const FIXTURE_PLACES: readonly Local[] = [
  {
    id: "ubs-centro",
    nome: "UBS Centro — Espaço Saúde da Mulher",
    categoria: "saude",
    descricaoCurta: "Atendimento integral à saúde da mulher.",
    distrito: "Sede",
    endereco: "Rua Coronel Antônio Marinho, 145",
    coordinates: [-36.424, -8.3358],
    verificado: true,
  },
  {
    id: "cram-protecao",
    nome: "Centro de Referência de Atendimento à Mulher (CRAM)",
    categoria: "protecao-apoio",
    descricaoCurta: "Acolhimento psicossocial e orientação jurídica.",
    distrito: "Sede",
    endereco: "Rua Pedro Firmino, 88",
    coordinates: [-36.4292, -8.3298],
    verificado: true,
  },
  {
    id: "casa-artesas-agua-fria",
    nome: "Casa das Artesãs de Água Fria",
    categoria: "artesanato",
    descricaoCurta: "Bordado manual, palha e cerâmica.",
    distrito: "Água Fria",
    endereco: "Rua da Matriz, 32",
    coordinates: [-36.3554, -8.3852],
    verificado: true,
  },
  {
    id: "atelie-xucuru",
    nome: "Ateliê Fios de Xucuru",
    categoria: "artesanato",
    descricaoCurta: "Crochê e fuxico comunitário.",
    distrito: "Xucuru",
    endereco: "Sítio Lage Grande",
    coordinates: [-36.4951, -8.3154],
    verificado: false,
  },
];

describe("normalizeText", () => {
  it("removes Portuguese diacritics, lowercases text, and collapses outer/inner spaces", () => {
    expect(normalizeText("Saúde & Proteção")).toBe("saude & protecao");
    expect(normalizeText("  ÁGUA   FRIA  ")).toBe("agua fria");
    expect(normalizeText("Ateliê Conceição")).toBe("atelie conceicao");
  });
});

describe("filterPlaces", () => {
  it("returns all places when query is blank and no categories are selected", () => {
    const result = filterPlaces(FIXTURE_PLACES, {
      query: "   ",
      selectedCategories: new Set<CategoryId>(),
    });

    expect(result.map((p) => p.id)).toEqual([
      "ubs-centro",
      "cram-protecao",
      "casa-artesas-agua-fria",
      "atelie-xucuru",
    ]);
  });

  it("matches place names case-insensitively and without accent sensitivity", () => {
    expect(
      filterPlaces(FIXTURE_PLACES, {
        query: "saude",
        selectedCategories: new Set<CategoryId>(),
      }).map((p) => p.id),
    ).toEqual(["ubs-centro"]);

    expect(
      filterPlaces(FIXTURE_PLACES, {
        query: "ARTESAS DE AGUA",
        selectedCategories: new Set<CategoryId>(),
      }).map((p) => p.id),
    ).toEqual(["casa-artesas-agua-fria"]);

    expect(
      filterPlaces(FIXTURE_PLACES, {
        query: "atelie",
        selectedCategories: new Set<CategoryId>(),
      }).map((p) => p.id),
    ).toEqual(["atelie-xucuru"]);
  });

  it("returns an empty list when no place name matches the query", () => {
    expect(
      filterPlaces(FIXTURE_PLACES, {
        query: "xyz-inexistente",
        selectedCategories: new Set<CategoryId>(),
      }),
    ).toEqual([]);
  });

  it("supports multi-select category filtering and combines it with name search", () => {
    const multiCategory = filterPlaces(FIXTURE_PLACES, {
      query: "",
      selectedCategories: new Set<CategoryId>(["saude", "artesanato"]),
    });
    expect(multiCategory.map((p) => p.id)).toEqual([
      "ubs-centro",
      "casa-artesas-agua-fria",
      "atelie-xucuru",
    ]);

    const combined = filterPlaces(FIXTURE_PLACES, {
      query: "xucuru",
      selectedCategories: new Set<CategoryId>(["saude", "artesanato"]),
    });
    expect(combined.map((p) => p.id)).toEqual(["atelie-xucuru"]);
  });
});
