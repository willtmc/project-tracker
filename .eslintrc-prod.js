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
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Stricter rules for production code
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-process-exit': 'error',
    'no-prototype-builtins': 'error',
    'no-case-declarations': 'error',
    'no-inner-declarations': 'error',
    'prettier/prettier': 'error',
    'jest/no-conditional-expect': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        // Relaxed rules for test files
        'jest/no-conditional-expect': 'warn',
      },
    },
    {
      // Relaxed rules for utility scripts
      files: ['*.js'],
      excludedFiles: ['src/**/*.js', 'tests/**/*.js'],
      rules: {
        'no-unused-vars': 'warn',
        'no-process-exit': 'warn',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/', 'build/', '*.min.js'],
};
