import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "public/maplibre-gl-worker.js",
    ],
  },
];

export default eslintConfig;
