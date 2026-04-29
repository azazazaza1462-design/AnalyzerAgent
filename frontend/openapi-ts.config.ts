import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://localhost:5049/swagger/v1/swagger.json",
  output: {
    path: "src/services/generated",
    format: "prettier",
  },
  plugins: [
    { name: "@hey-api/client-axios", runtimeConfigPath: "./src/services/api.ts" },
    "@hey-api/typescript",
    "@hey-api/sdk",
  ],
});
