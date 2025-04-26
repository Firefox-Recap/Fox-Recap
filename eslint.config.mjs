import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: ["dist", "node_modules"],
    files: ["src/**/*.js", "models/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        browser: "readonly",
        WebAssembly: "readonly",
        XMLHttpRequest: "readonly",
        TextDecoder: "readonly",
        performance: "readonly",
        crypto: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      }
    },
    rules: {
      "no-undef": "off",
      "no-prototype-builtins": "off",
      "no-empty": "off",
      "no-func-assign": "off",
      "no-fallthrough": "off",
      "no-unused-vars": "warn",
      "no-useless-escape": "off",
      "no-self-assign": "off",
      "no-cond-assign": "off",
    }
  },
  // Add this block for Node.js config files:
  {
    files: ["*.config.js", "webpack.config.js", "jest.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
      }
    }
  },
  pluginJs.configs.recommended,
];
