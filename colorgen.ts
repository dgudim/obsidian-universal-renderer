import { writeFileSync } from 'fs';
import { availablePalettes, buildPaletteCss } from './src/palettegen';
import type { ColorPalette } from './src/setting';

// Usage: bun run colorgen.ts [palette] [outFile]
//   palette  one of the available palettes (default: first available)
//   outFile  where to write the generated CSS (default: styles.css)

// Obsidian polyfills the non-standard `contains` on String/Array at runtime;
// provide it here so the shared rendering code can run outside Obsidian.
// biome-ignore lint/suspicious/noExplicitAny: minimal runtime shim
const proto = (obj: any, fn: string) => {
	if (!(fn in obj)) {
		obj[fn] = function (this: { includes: (s: unknown) => boolean }, search: unknown) {
			return this.includes(search);
		};
	}
};
proto(String.prototype, 'contains');
proto(Array.prototype, 'contains');

const requested = process.argv[2];
const outFile = process.argv[3] ?? 'styles.css';

if (requested && !availablePalettes.includes(requested as ColorPalette)) {
	console.error(`Unknown palette "${requested}".`);
	console.error(`Available palettes: ${availablePalettes.join(', ')}`);
	process.exit(1);
}

const palette = (requested ?? availablePalettes[0]) as ColorPalette;

writeFileSync(outFile, buildPaletteCss(palette));

console.log(`Generated ${outFile} for palette "${palette}"`);
