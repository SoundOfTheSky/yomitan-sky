// @ts-check
import skyEslintConfig from '@softsky/configs/eslint.config.mjs';

/** @type {import("typescript-eslint").Config} */
export default [
  ...skyEslintConfig,
  {
    rules: {
      'import-x/no-nodejs-modules': 0,
      'import-x/prefer-default-export': 0
    }
  }
];