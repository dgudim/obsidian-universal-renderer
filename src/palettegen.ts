import { type RgbColor, hexToRgb, invertColorName } from 'src/utils.js';
import { promises as fsp } from 'fs';
import * as fs from 'fs';
import type { ColorPalette } from './setting';
import type GraphvizPlugin from './main';
import { FileSystemAdapter } from 'obsidian';

type ColorType = 'dark' | '' | 'light';
type ColorName = 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'cyan' | 'orange'
type ShadeName = 'light100-hard' | 'light100' | 'light100-soft' | 'light90' | 'light80' | 'light70' | 'light60' |
    'dark60' | 'dark70' | 'dark80' | 'dark90' | 'dark100-soft' | 'dark100' | 'dark100-hard'

// TODO: Expand support to extended color theme definitions (default color and faded color for that theme, same for shades)
//@ts-format-ignore-region
const colors: Map<ColorPalette, Map<ColorName, Map<ColorType, string>>> = new Map([
    ['gruvbox', 
        new Map([
            ['red',    new Map([['', '#cc241d'], ['light', '#fb4934'], ['dark', '#9d0006']])],
            ['green',  new Map([['', '#98971a'], ['light', '#b8bb26'], ['dark', '#79740e']])],
            ['yellow', new Map([['', '#d79921'], ['light', '#fabd2f'], ['dark', '#b57614']])],
            ['blue',   new Map([['', '#458588'], ['light', '#83a598'], ['dark', '#076678']])],
            ['purple', new Map([['', '#b16286'], ['light', '#d3869b'], ['dark', '#8f3f71']])],
            ['cyan',   new Map([['', '#689d6a'], ['light', '#8ec07c'], ['dark', '#427b58']])],
            ['orange', new Map([['', '#d65d0e'], ['light', '#fe8019'], ['dark', '#af3a03']])]
        ])  
    ],
    ['catppuccin',
        new Map([
            ['red',    new Map([['', '#e78284'], ['light', '#f38ba8'], ['dark', '#d20f39']])],
            ['green',  new Map([['', '#a6d189'], ['light', '#a6e3a1'], ['dark', '#40a02b']])],
            ['yellow', new Map([['', '#e5c890'], ['light', '#f9e2af'], ['dark', '#df8e1d']])],
            ['blue',   new Map([['', '#8caaee'], ['light', '#89b4fa'], ['dark', '#1e66f5']])],
            ['purple', new Map([['', '#ca9ee6'], ['light', '#cba6f7'], ['dark', '#8839ef']])],
            ['cyan',   new Map([['', '#85c1dc'], ['light', '#74c7ec'], ['dark', '#209fb5']])],
            ['orange', new Map([['', '#ef9f76'], ['light', '#fab387'], ['dark', '#af3a03']])]
        ])  
    ]
]); 

const shades: Map<ColorPalette, Map<ShadeName, string>> = new Map([
    ['catppuccin', 
            new Map([
            ['light100-hard', '#eff1f5'], ['light100',      '#e6e9ef'],
            ['light100-soft', '#dce0e8'], ['light90',       '#ccd0da'],
            ['light80',       '#bcc0cc'], ['light70',       '#acb0be'],
            ['light60',       '#9399b2'], ['dark60',        '#737994'],
            ['dark70',        '#626880'], ['dark80',        '#51576d'],
            ['dark90',        '#414559'], ['dark100-soft',  '#303446'],
            ['dark100',       '#292c3c'], ['dark100-hard',  '#232634']
        ]) 
    ],
    ['gruvbox', 
        new Map([
            ['light100-hard', '#f9f5d7'], ['light100',      '#fbf1c7'],
            ['light100-soft', '#f2e5bc'], ['light90',       '#ebdbb2'],
            ['light80',       '#d5c4a1'], ['light70',       '#bdae93'],
            ['light60',       '#a89984'], ['dark60',        '#7c6f64'],
            ['dark70',        '#665c54'], ['dark80',        '#504945'],
            ['dark90',        '#3c3836'], ['dark100-soft',  '#32302f'],
            ['dark100',       '#282828'], ['dark100-hard',  '#1d2021']
        ])
    ]
]); 
//@ts-format-ignore-endregion

const shadeGray = '#7f849c';

const baseCss = `/* proper sizing */

.multi-graph svg {
    max-width: 100%;
    height: auto;
}

/* tables for asciidoc */

.block-language-asciidoc p.tableblock:last-child{margin-bottom:0.3em; margin-top:0.3em}

.block-language-asciidoc table.frame-none>colgroup+*>:first-child>*,table.frame-sides>colgroup+*>:first-child>*{border-top-width:0}
.block-language-asciidoc table.frame-none>:last-child>:last-child>*,table.frame-sides>:last-child>:last-child>*{border-bottom-width:0}
.block-language-asciidoc table.frame-none>*>tr>:first-child,table.frame-ends>*>tr>:first-child{border-left-width:0}
.block-language-asciidoc table.frame-none>*>tr>:last-child,table.frame-ends>*>tr>:last-child{border-right-width:0}

.block-language-asciidoc th.halign-left,td.halign-left{text-align:left}
.block-language-asciidoc th.halign-right,td.halign-right{text-align:right}
.block-language-asciidoc th.halign-center,td.halign-center{text-align:center}
.block-language-asciidoc th.valign-top,td.valign-top{vertical-align:top}
.block-language-asciidoc th.valign-bottom,td.valign-bottom{vertical-align:bottom}
.block-language-asciidoc th.valign-middle,td.valign-middle{vertical-align:middle}
`;

function getColorDeclaration(fullName: string, hexColor: string, rgbColor?: RgbColor): string {
    let declaration = '';

    declaration += `${fullName}_r: ${rgbColor?.r};\n`;
    declaration += `${fullName}_g: ${rgbColor?.g};\n`;
    declaration += `${fullName}_b: ${rgbColor?.b};\n`;
    declaration += `${fullName}: ${hexColor};\n\n`;

    return declaration;
}

function getColorMapping(target: string, declaration: string): string {

    let mapping = '';

    mapping += `${target}: var(${declaration});\n`;
    mapping += `${target}_r: var(${declaration}_r);\n`;
    mapping += `${target}_g: var(${declaration}_g);\n`;
    mapping += `${target}_b: var(${declaration}_b);\n\n`;

    return mapping;
}

// TODO: Add ascidoc/mjx coloring documentation to readme

export async function genCSS(plugin: GraphvizPlugin, force = false): Promise<void> {

    let cssPath = '';
    const settings = plugin.settings;

    const adapter = plugin.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
        cssPath = `${adapter.getBasePath()}/${
            plugin.app.vault.configDir
        }/plugins/${plugin.manifest.id}/styles.css`;
    } else {
        throw TypeError('plugin.app.vault.adapter is not a FileSystemAdapter');
    }

    if (!force && fs.existsSync(cssPath)) {
        return;
    }

    console.log(`Generating CSS for color palette: ${settings.colorPalette}`)

    const palette = colors.get(settings.colorPalette) || colors.values().next().value;
    const shadePalette = shades.get(settings.colorPalette) || colors.values().next().value;

    let globalDeclaration = ':root {\n';
    let asciidocStyles = '';

    let darkThemeColorMappings = '/* normal colors for dark mode, !important for .keep-color class */\n.theme-dark, .keep-color {\n';
    let darkThemeShadeMappings = '/* normal shades for dark mode, !important for .keep-shade class */\n.theme-dark, .keep-shade {\n';

    let lightThemeMappings = '/* inverted colors for light mode */\n.theme-light {\n';

    let mathStyles = 'mjx-mstyle { --stroke: 0.3px }\n';

    let combinedDeclaration = '.theme-dark, .theme-light {\n';
    combinedDeclaration += getColorDeclaration('--g-gray', shadeGray, hexToRgb(shadeGray));

    for (const [name, unionColor] of palette) {
        for (const [type, color] of unionColor) {
            const rgbColor = hexToRgb(color);

            const fullType = type ? `${type}-` : '';
            const shortType = type ? `${type[0]}-` : '';

            const shortName = `${shortType}${name}`;
            const declarationName = `--theme-${fullType}${name}`;
            const fullName_inverted = invertColorName(declarationName);
            const targetFullName = `--g-${fullType}${name}`;

            globalDeclaration += getColorDeclaration(declarationName, color, rgbColor);

            asciidocStyles += `.block-language-asciidoc td.tableblock:has(.${shortName}-cell) { background: var(${targetFullName}); }\n`;
            asciidocStyles += `.block-language-asciidoc .${shortName} { color: var(${targetFullName}); }\n\n`;

            if (!type) {
                combinedDeclaration += getColorDeclaration(targetFullName, color, rgbColor);
            } else {
                darkThemeColorMappings += getColorMapping(targetFullName, declarationName);
                lightThemeMappings += getColorMapping(targetFullName, fullName_inverted);
            }
        }
        mathStyles += `
mjx-mstyle[style*="color: ${name};"] {
    color: var(--g-light-${name}) !important;
    -webkit-text-stroke-width: var(--stroke);
    -webkit-text-stroke-color: var(--g-light-${name});
}\n\n`;
        darkThemeColorMappings += '\n';
        lightThemeMappings += '\n\n';
        asciidocStyles += '\n';
        globalDeclaration += '\n';
    }

    for (const [name, color] of shadePalette) {
        const rgbColor = hexToRgb(color);

        const fullName = `--theme-${name}`;
        const fullName_g = `--g-${name}`;

        globalDeclaration += getColorDeclaration(fullName, color, rgbColor);
        darkThemeShadeMappings += getColorMapping(fullName_g, fullName);
        lightThemeMappings += getColorMapping(fullName_g, invertColorName(fullName));
    }

    return fsp.writeFile(cssPath, `${baseCss}
\n\n${globalDeclaration}\n}
\n\n${combinedDeclaration}\n}
\n\n${lightThemeMappings}\n}
\n\n${darkThemeColorMappings}\n}
\n\n${darkThemeShadeMappings}\n}
\n\n${asciidocStyles}
\n\n${mathStyles}`);
}

