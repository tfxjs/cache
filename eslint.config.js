import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    ignores: ['dist/**'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: false },
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
    },
  },
];