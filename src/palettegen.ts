import { RgbColor, hexToRgb, invertColorName } from 'src/utils.js';

type ColorType = 'dark' | '' | 'light';

//@ts-format-ignore-region
const colors: Map<string, Map<ColorType, string>> = new Map([
    ['red',    new Map([['', '#cc241d'], ['light', '#fb4934'], ['dark', '#9d0006']])],
    ['green',  new Map([['', '#98971a'], ['light', '#b8bb26'], ['dark', '#79740e']])],
    ['yellow', new Map([['', '#d79921'], ['light', '#fabd2f'], ['dark', '#b57614']])],
    ['blue',   new Map([['', '#458588'], ['light', '#83a598'], ['dark', '#076678']])],
    ['purple', new Map([['', '#b16286'], ['light', '#d3869b'], ['dark', '#8f3f71']])],
    ['cyan',   new Map([['', '#689d6a'], ['light', '#8ec07c'], ['dark', '#427b58']])],
    ['orange', new Map([['', '#d65d0e'], ['light', '#fe8019'], ['dark', '#af3a03']])]
]);

const shades: Map<string, string> = new Map([
    ['light100-hard', '#f9f5d7'], ['light100',      '#fbf1c7'],
    ['light100-soft', '#f2e5bc'], ['light90',       '#ebdbb2'],
    ['light80',       '#d5c4a1'], ['light70',       '#bdae93'],
    ['light60',       '#a89984'], ['dark60',        '#7c6f64'],
    ['dark70',        '#665c54'], ['dark80',        '#504945'],
    ['dark90',        '#3c3836'], ['dark100-soft',  '#32302f'],
    ['dark100',       '#282828'], ['dark100-hard',  '#1d2021']
]);
//@ts-format-ignore-endregion

const shadeGray = '#928374';

function getColorDeclaration(fullName: string, hexColor: string, rgbColor?: RgbColor): string {
    let declaration = '';

    declaration += `/* ${hexColor} */\n`;
    declaration += `${fullName}_r: ${rgbColor?.r};\n`;
    declaration += `${fullName}_g: ${rgbColor?.g};\n`;
    declaration += `${fullName}_b: ${rgbColor?.b};\n`;
    declaration += `${fullName}: ${hexColor};\n\n`;

    return declaration;
}

function getColorMapping(nameFrom: string, nameTo: string, important: boolean): string {

    let mapping = '';
    const importantStr = important ? ' !important' : '';

    mapping += `${nameFrom}: var(${nameTo})${importantStr};\n`;
    mapping += `${nameFrom}_r: var(${nameTo}_r)${importantStr};\n`;
    mapping += `${nameFrom}_g: var(${nameTo}_g)${importantStr};\n`;
    mapping += `${nameFrom}_b: var(${nameTo}_b)${importantStr};\n\n`;

    return mapping;
}

export function genCSS(): string {

    let globalDeclaration = ':root {\n';
    let asciidocStyles = '';

    let darkThemeColorMappings = '/* normal colors for dark mode, !important for .keep-color class */\n.theme-dark, .keep-color {\n';
    let darkThemeShadeMappings = '/* normal shades for dark mode, !important for .keep-shade class */\n.theme-dark, .keep-shade {\n';

    let lightThemeMappings = '/* inverted colors for light mode */\n.theme-light {\n';

    let mathStyles = 'mjx-mstyle { --stroke: 0.5px }\n';

    globalDeclaration += getColorDeclaration('--g-gray', shadeGray, hexToRgb(shadeGray));

    for (const [name, unionColor] of colors) {
        for (const [type, color] of unionColor) {
            const rgbColor = hexToRgb(color);

            const fullType = type ? type + '-' : '';
            const shortType = type ? type[0] + '-' : '';

            const shortName = `${shortType}${name}`;
            const fullName = `--theme-${fullType}${name}`;
            const fullName_inverted = invertColorName(fullName) || fullName;
            const fullName_g = `--g-${fullType}${name}`;

            globalDeclaration += getColorDeclaration(fullName, color, rgbColor);

            asciidocStyles += `.block-language-asciidoc td.tableblock:has(.${shortName}-cell) { background: var(${fullName}); }\n`;
            asciidocStyles += `.block-language-asciidoc .${shortName} { color: var(${fullName}); }\n\n`;

            darkThemeColorMappings += getColorMapping(fullName_g, fullName, true);
            lightThemeMappings += getColorMapping(fullName_g, fullName_inverted, false);

        }
        mathStyles += `
mjx-mstyle[style*="color: ${name};"] {
    color: var(--g-light-${name}) !important;
    -webkit-text-stroke-width: var(--stroke);
    -webkit-text-stroke-color: var(--g-light-${name});
}\n\n`;
        darkThemeColorMappings += '\n';
        lightThemeMappings += '\n';
        asciidocStyles += '\n';
        globalDeclaration += '\n';
    }

    for (const [name, color] of shades) {
        const rgbColor = hexToRgb(color);

        const fullName = `--theme-${name}`;
        const fullName_g = `--g-${name}`;

        globalDeclaration += getColorDeclaration(fullName, color, rgbColor);
        darkThemeShadeMappings += getColorMapping(fullName_g, fullName, true);
    }

    globalDeclaration += '\n}';
    lightThemeMappings += '\n}';
    darkThemeColorMappings += '\n}';
    darkThemeShadeMappings += '\n}';

    return `${globalDeclaration}\n\n\n${lightThemeMappings}\n\n\n${darkThemeColorMappings}\n\n\n${darkThemeShadeMappings}\n\n\n${asciidocStyles}\n\n\n${mathStyles}`;
}

