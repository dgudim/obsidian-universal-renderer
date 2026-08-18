import { normalizePath } from 'obsidian';
import type GraphvizPlugin from './main';
import type { ColorPalette } from './setting';
import { type RgbColor, hexToRgb, invertColorName } from './utils';

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
    ],
    ['dracula',
        new Map([
            ['red',    new Map([['', '#ff5555'], ['light', '#ff6e6e'], ['dark', '#c23636']])],
            ['green',  new Map([['', '#50fa7b'], ['light', '#69ff94'], ['dark', '#2fb85a']])],
            ['yellow', new Map([['', '#f1fa8c'], ['light', '#ffffa5'], ['dark', '#c9d16a']])],
            ['blue',   new Map([['', '#bd93f9'], ['light', '#d6acff'], ['dark', '#9a6ee0']])],
            ['purple', new Map([['', '#ff79c6'], ['light', '#ff92df'], ['dark', '#e04ba0']])],
            ['cyan',   new Map([['', '#8be9fd'], ['light', '#a4ffff'], ['dark', '#5bbfd6']])],
            ['orange', new Map([['', '#ffb86c'], ['light', '#ffca8c'], ['dark', '#e0954a']])]
        ])  
    ],
    ['nord',
        new Map([
            ['red',    new Map([['', '#bf616a'], ['light', '#cf7079'], ['dark', '#a54e57']])],
            ['green',  new Map([['', '#a3be8c'], ['light', '#b1cc9c'], ['dark', '#8aa676']])],
            ['yellow', new Map([['', '#ebcb8b'], ['light', '#f0d59f'], ['dark', '#d9b56f']])],
            ['blue',   new Map([['', '#81a1c1'], ['light', '#8fb3d0'], ['dark', '#5e81ac']])],
            ['purple', new Map([['', '#b48ead'], ['light', '#c29dbc'], ['dark', '#9d7897']])],
            ['cyan',   new Map([['', '#88c0d0'], ['light', '#9fd0de'], ['dark', '#6fa8ba']])],
            ['orange', new Map([['', '#d08770'], ['light', '#dc9885'], ['dark', '#b56f59']])]
        ])  
    ],
    ['tokyo_night',
        new Map([
            ['red',    new Map([['', '#f7768e'], ['light', '#ff8ea3'], ['dark', '#db5a75']])],
            ['green',  new Map([['', '#9ece6a'], ['light', '#b9e389'], ['dark', '#7fb04e']])],
            ['yellow', new Map([['', '#e0af68'], ['light', '#f0c07d'], ['dark', '#c69551']])],
            ['blue',   new Map([['', '#7aa2f7'], ['light', '#93b5ff'], ['dark', '#5d84d8']])],
            ['purple', new Map([['', '#bb9af7'], ['light', '#cbb0ff'], ['dark', '#9d7cdb']])],
            ['cyan',   new Map([['', '#7dcfff'], ['light', '#99dbff'], ['dark', '#5fb4e6']])],
            ['orange', new Map([['', '#ff9e64'], ['light', '#ffb37f'], ['dark', '#e0834b']])]
        ])  
    ],
    ['one_dark',
        new Map([
            ['red',    new Map([['', '#e06c75'], ['light', '#f07a83'], ['dark', '#be5046']])],
            ['green',  new Map([['', '#98c379'], ['light', '#a9d189'], ['dark', '#7ea262']])],
            ['yellow', new Map([['', '#e5c07b'], ['light', '#f0cd8c'], ['dark', '#c9a35f']])],
            ['blue',   new Map([['', '#61afef'], ['light', '#7bc0ff'], ['dark', '#4d8fce']])],
            ['purple', new Map([['', '#c678dd'], ['light', '#d68aec'], ['dark', '#a660bd']])],
            ['cyan',   new Map([['', '#56b6c2'], ['light', '#6fccd8'], ['dark', '#429aa5']])],
            ['orange', new Map([['', '#d19a66'], ['light', '#e0ab78'], ['dark', '#b07f4f']])]
        ])  
    ],
    ['solarized',
        new Map([
            ['red',    new Map([['', '#dc322f'], ['light', '#ec4b48'], ['dark', '#b52926']])],
            ['green',  new Map([['', '#859900'], ['light', '#9db300'], ['dark', '#6a7a00']])],
            ['yellow', new Map([['', '#b58900'], ['light', '#cf9e14'], ['dark', '#916e00']])],
            ['blue',   new Map([['', '#268bd2'], ['light', '#3ba0e6'], ['dark', '#1e6fa8']])],
            ['purple', new Map([['', '#6c71c4'], ['light', '#8186d6'], ['dark', '#565aa0']])],
            ['cyan',   new Map([['', '#2aa198'], ['light', '#35bdb2'], ['dark', '#21807a']])],
            ['orange', new Map([['', '#cb4b16'], ['light', '#e05f28'], ['dark', '#a33c12']])]
        ])  
    ],
    ['everforest',
        new Map([
            ['red',    new Map([['', '#e67e80'], ['light', '#f28e90'], ['dark', '#c96668']])],
            ['green',  new Map([['', '#a7c080'], ['light', '#b8ce93'], ['dark', '#8ba368']])],
            ['yellow', new Map([['', '#dbbc7f'], ['light', '#e8cb91'], ['dark', '#bf9f64']])],
            ['blue',   new Map([['', '#7fbbb3'], ['light', '#93cbc3'], ['dark', '#669d95']])],
            ['purple', new Map([['', '#d699b6'], ['light', '#e3aac6'], ['dark', '#b77c98']])],
            ['cyan',   new Map([['', '#83c092'], ['light', '#97cfa4'], ['dark', '#679f77']])],
            ['orange', new Map([['', '#e69875'], ['light', '#f0a988'], ['dark', '#c67a59']])]
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
    ],
    ['dracula', 
        new Map([
            ['light100-hard', '#ffffff'], ['light100',      '#f8f8f2'],
            ['light100-soft', '#e8e8e2'], ['light90',       '#d0d0cc'],
            ['light80',       '#b8b8b4'], ['light70',       '#9a9db5'],
            ['light60',       '#7b7fa3'], ['dark60',        '#6272a4'],
            ['dark70',        '#545876'], ['dark80',        '#44475a'],
            ['dark90',        '#383a4a'], ['dark100-soft',  '#282a36'],
            ['dark100',       '#21222c'], ['dark100-hard',  '#191a21']
        ])
    ],
    ['nord', 
        new Map([
            ['light100-hard', '#ffffff'], ['light100',      '#eceff4'],
            ['light100-soft', '#e5e9f0'], ['light90',       '#d8dee9'],
            ['light80',       '#c2ccd8'], ['light70',       '#abb8c9'],
            ['light60',       '#94a3b8'], ['dark60',        '#6b7688'],
            ['dark70',        '#4c566a'], ['dark80',        '#434c5e'],
            ['dark90',        '#3b4252'], ['dark100-soft',  '#2e3440'],
            ['dark100',       '#272c38'], ['dark100-hard',  '#21252f']
        ])
    ],
    ['tokyo_night', 
        new Map([
            ['light100-hard', '#ffffff'], ['light100',      '#c0caf5'],
            ['light100-soft', '#a9b1d6'], ['light90',       '#9aa5ce'],
            ['light80',       '#828bb8'], ['light70',       '#6b73a0'],
            ['light60',       '#565f89'], ['dark60',        '#444b6e'],
            ['dark70',        '#363b54'], ['dark80',        '#292e42'],
            ['dark90',        '#24283b'], ['dark100-soft',  '#1a1b26'],
            ['dark100',       '#16161e'], ['dark100-hard',  '#101014']
        ])
    ],
    ['one_dark', 
        new Map([
            ['light100-hard', '#ffffff'], ['light100',      '#d7dae0'],
            ['light100-soft', '#c8ccd4'], ['light90',       '#abb2bf'],
            ['light80',       '#9096a1'], ['light70',       '#757b86'],
            ['light60',       '#5c6370'], ['dark60',        '#4b5263'],
            ['dark70',        '#3e4451'], ['dark80',        '#333842'],
            ['dark90',        '#2c313a'], ['dark100-soft',  '#282c34'],
            ['dark100',       '#21252b'], ['dark100-hard',  '#1b1d23']
        ])
    ],
    ['solarized', 
        new Map([
            ['light100-hard', '#ffffff'], ['light100',      '#fdf6e3'],
            ['light100-soft', '#eee8d5'], ['light90',       '#d9d3c0'],
            ['light80',       '#b8b8ab'], ['light70',       '#93a1a1'],
            ['light60',       '#839496'], ['dark60',        '#657b83'],
            ['dark70',        '#586e75'], ['dark80',        '#12454f'],
            ['dark90',        '#073642'], ['dark100-soft',  '#04303b'],
            ['dark100',       '#002b36'], ['dark100-hard',  '#00242e']
        ])
    ],
    ['everforest', 
        new Map([
            ['light100-hard', '#ffffff'], ['light100',      '#fdf6e3'],
            ['light100-soft', '#efebd4'], ['light90',       '#d3c6aa'],
            ['light80',       '#b6ad97'], ['light70',       '#9da9a0'],
            ['light60',       '#859289'], ['dark60',        '#7a8478'],
            ['dark70',        '#56635f'], ['dark80',        '#475258'],
            ['dark90',        '#3d484d'], ['dark100-soft',  '#343f44'],
            ['dark100',       '#2d353b'], ['dark100-hard',  '#232a2e']
        ])
    ]
]); 
//@ts-format-ignore-endregion

// Per-palette neutral gray for `--g-gray`
const shadeGrays: Map<ColorPalette, string> = new Map([
    ['gruvbox',     '#928374'],
    ['catppuccin',  '#7f849c'],
    ['dracula',     '#6272a4'],
    ['nord',        '#616e88'],
    ['tokyo_night', '#565f89'],
    ['one_dark',    '#5c6370'],
    ['solarized',   '#839496'],
    ['everforest',  '#859289'],
]);

// Palette names usable by buildPaletteCss / the colorgen CLI.
export const availablePalettes: ColorPalette[] = [...colors.keys()];

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
    const cssPath = normalizePath(`${plugin.app.vault.configDir}/plugins/${plugin.manifest.id}/styles.css`);
    const adapter = plugin.app.vault.adapter;

    if (!force && await adapter.exists(cssPath)) {
        return;
    }

    return adapter.write(cssPath, buildPaletteCss(plugin.settings.colorPalette));
}

function firstMapValue<K, V>(map: Map<K, V>): V {
    for (const value of map.values()) {
        return value;
    }
    throw new Error('Palette map is empty');
}

export function buildPaletteCss(paletteName: ColorPalette): string {

    const palette = colors.get(paletteName) ?? firstMapValue(colors);
    const shadePalette = shades.get(paletteName) ?? firstMapValue(shades);
    const gray = shadeGrays.get(paletteName) ?? firstMapValue(shadeGrays);

    let globalDeclaration = ':root {\n';
    let asciidocStyles = '';

    let darkThemeColorMappings = '/* normal colors for dark mode, !important for .keep-color class */\n.theme-dark, .keep-color {\n';
    let darkThemeShadeMappings = '/* normal shades for dark mode, !important for .keep-shade class */\n.theme-dark, .keep-shade {\n';

    let lightThemeMappings = '/* inverted colors for light mode */\n.theme-light {\n';

    let mathStyles = 'mjx-mstyle { --stroke: 0.3px }\n';

    let combinedDeclaration = '.theme-dark, .theme-light {\n';
    combinedDeclaration += getColorDeclaration('--g-gray', gray, hexToRgb(gray));

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

    return `${baseCss}
\n\n${globalDeclaration}\n}
\n\n${combinedDeclaration}\n}
\n\n${lightThemeMappings}\n}
\n\n${darkThemeColorMappings}\n}
\n\n${darkThemeShadeMappings}\n}
\n\n${asciidocStyles}
\n\n${mathStyles}`;
}

