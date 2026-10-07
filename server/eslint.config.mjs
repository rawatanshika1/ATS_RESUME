import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**']
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: globals.node
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }]
    }
  }
];
