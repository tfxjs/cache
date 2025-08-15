import { defineConfig } from 'tsup';

export default defineConfig({
	format: ['cjs', 'esm'],
	entryPoints: ['src/index.ts'],
	outDir: 'dist',
	dts: true,
	shims: true,
	skipNodeModulesBundle: true,
	clean: true,
	ignoreWatch: ['local/**/*', 'dist/**/*'],
});
