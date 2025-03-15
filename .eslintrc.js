module.exports = {
  env: {
    browser: true,
    node: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended',
    'plugin:prettier/recommended', // Integrates Prettier with ESLint
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Disable Node.js version-specific rules since Electron bundles its own Node.js
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unsupported-features/node-builtins': 'off',
    'node/no-unpublished-require': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-missing-import': 'off',
    // Relax process.exit rule for scripts
    'no-process-exit': 'warn',
    // General rules
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prettier/prettier': 'error',
    // Relax conditional expect for tests
    'jest/no-conditional-expect': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/', 'build/', '*.min.js'],
};
