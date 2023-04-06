/* eslint-disable no-constant-condition */
import { DataAdapter, MarkdownPostProcessorContext, MetadataCache } from 'obsidian';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import GraphvizPlugin from './main';

import { GraphvizSettings } from './setting';

import * as crypto from 'crypto';
import { insertStr, readFileString } from './utils';
const md5 = (contents: string) => crypto.createHash('md5').update(contents).digest('hex');

export const renderTypes = ['dot', 'latex', 'ditaa', 'blockdiag', 'asciidoc', 'refgraph', 'dynamic-svg'] as const;
type RenderType = typeof renderTypes[number];

const svgTags = ['text', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'] as const;

const svgStyleTags = ['fill', 'stroke'] as const;
const svgStyleRegex = new RegExp(`(?:${svgStyleTags.join('|')})=".*?"`, 'g');

type SSMap = Map<string, string>;

type ColorType = 'color' | 'shade' | 'unknown';

//@ts-format-ignore-region
const svgColors = [

    // dark colors
    [[
        ['darkred',       '#8B0000'], // intuitive
        ['firebrick',     '#B22222'],
        ['maroon',        '#800000'],
        ['brown',         '#A52A2A']], '--g-color-dark-red'],

    [[
        ['darkmagenta',   '#8B008B'],
        ['darkviolet',    '#9400D3'],
        ['darkorchid',    '#9932CC'],
        ['blueviolet',    '#8A2BE2'],
        ['indigo',        '#4B0082']], '--g-color-dark-purple'],

    [[
        ['darkgreen',     '#006400']], '--g-color-dark-green'],

    [[
        ['darkblue',      '#00008B'], // intuitive
        ['midnightblue',  '#191970'],
        ['navy',          '#000080']], '--g-color-dark-blue'],

    [[
        ['chocolate',     '#D2691E']], '--g-color-dark-orange'],

    [[
        ['goldenrod',     '#DAA520'],
        ['darkgoldenrod', '#B8860B']], '--g-color-dark-yellow'],

    [[
        ['darkcyan',      '#008B8B'], // intuitive
        ['lightseagreen', '#20B2AA'],
        ['teal',          '#008080']], '--g-color-dark-cyan'],

    // neutral colors
    [[
        ['red',           '#FF0000'], // intuitive
        ['tomato',        '#FF6347']], '--g-color-red'],
    [[
        ['purple',        '#800080'], // intuitive
        ['mediumpurple',  '#9370DB'],
        ['magenta',       '#FF00FF']], '--g-color-purple'],
    [[
        ['green',         '#008000']], '--g-color-green'], // intuitive
    [[
        ['blue',          '#0000FF']], '--g-color-blue'], // intuitive
    [[
        ['darkorange',    '#FF8C00']], '--g-color-orange'],
    [[
        ['yellow',        '#FFFF00']], '--g-color-yellow'], // intuitive
    [[
        ['cyan', 'aqua',  '#00FFFF']], '--g-color-cyan'], // intuitive

    // light colors
    [[
        ['lightcoral',    '#F08080'],
        ['salmon',        '#FA8072'],
        ['pink',          '#FFC0CB'],
        ['lightsalmon',   '#FFA07A'],
        ['indianred',     '#CD5C5C']], '--g-color-light-red'],

    [[
        ['plum',          '#DDA0DD'],
        ['violet',        '#EE82EE'],
        ['magenta',       '#DA70D6'],
        ['mediumorchid',  '#BA55D3']], '--g-color-light-purple'],
    [[
        ['lightgreen',    '#90EE90'], // intuitive
        ['palegreen',     '#98FB98']], '--g-color-light-green'],
    [[
        ['powderblue',    '#B0E0E6'],
        ['lightblue',     '#ADD8E6'], // intuitive
        ['skyblue',       '#87CEEB'],
        ['lightskyblue',  '#87CEFA']], '--g-color-light-blue'],

    [[
        ['orange',        '#FFA500'], 
        ['coral',         '#FF7F50']], '--g-color-light-orange'],

    [[
        ['gold',          '#FFD700']], '--g-color-light-yellow'],
    [[
        ['paleturquoise', '#AFEEEE'],
        ['aquamarine',    '#7FFFD4']], '--g-color-light-cyan']
];
let colorToVar: SSMap;
let hexColorToVar: SSMap;


const svgShades = [

    // gray colors
    [[
        ['ghostwhite',              '#F8F8FF']], '--g-color-light100-hard'],  // #F9F5D7
    [[
        ['white',                   '#FFFFFF']], '--g-color-light100'],       // #FBF1C7
    [[
        ['seashell',                '#FFF5EE']], '--g-color-light100-soft'],  // #F2E5BC
    [[
        ['snow',                    '#FFFAFA']], '--g-color-light90'],        // #EBDBB2                    
    [[
        ['whitesmoke',              '#F5F5F5']], '--g-color-light80'],        // #D5C4A1
    [[
        ['lightgray', 'lightgrey',  '#D3D3D3']], '--g-color-light70'],        // #BDAE93
    [[
        ['silver',                  '#C0C0C0']], '--g-color-light60'],        // #A89984

    //['--g-color-dark100-hard']                     // #1D2021 unused
    [[
        ['black',                            '#000000']], '--g-color-dark100'],      // #282828           
    [[
        ['dimgray', 'dimgrey',               '#696969']], '--g-color-dark100-soft'], // #32302F
    [[
        ['darkslategray', 'darkslategrey',   '#2F4F4F']], '--g-color-dark90'],       // #3C3836
    [[
        ['slategray', 'slategrey',           '#708090']], '--g-color-dark80'],       // #504945
    [[
        ['lightslategray', 'lightslategrey', '#778899']], '--g-color-dark70'],       // #665C54
    [[
        ['gray', 'grey',                     '#808080']], '--g-color-dark60'],       // #7C6F64
    [[
        ['darkgray', 'darkgrey',             '#A9A9A9']], '--g-color-gray'],         // #928374

];
let shadeToVar: SSMap;
let hexShadeToVar: SSMap;
//@ts-format-ignore-endregion

const presets = new Map<string, Map<string, string>>([
    ['math-graph', new Map<string, string>([
        ['ellipse-fill', 'keep-shade'],
        ['text-fill', 'keep-shade']
    ])]
]);

function transformColorMap(colorList: (string | string[][])[][]): { colorToVar: SSMap, hexToVar: SSMap } {
    const colorToVar = new Map<string, string>();
    const hexToVar = new Map<string, string>();
    for (const entry of colorList) {
        const colorVar = entry[1] as string;
        for (const colorEntries of entry[0]) {
            for (const color of colorEntries) {
                if (color.startsWith('#')) {
                    hexToVar.set(color, colorVar);
                }
                colorToVar.set(color, colorVar);
            }
        }
    }
    return {
        colorToVar: colorToVar,
        hexToVar: hexToVar
    };
}

function mapColor(color: string, mapClosestColor: boolean): { color: string | undefined, type: ColorType } {

    if (!shadeToVar) {
        const transformed = transformColorMap(svgShades);
        shadeToVar = transformed.colorToVar;
        hexShadeToVar = transformed.hexToVar;
    }

    if (!colorToVar) {
        const transformed = transformColorMap(svgColors);
        colorToVar = transformed.colorToVar;
        hexColorToVar = transformed.hexToVar;
    }

    const remappedColor = colorToVar.get(color);
    const remappedShade = shadeToVar.get(color);
    if (remappedColor) {
        return {
            color: remappedColor,
            type: 'color'
        };
    } else if (remappedShade) {
        return {
            color: remappedShade,
            type: 'shade'
        };
    }
    return {
        color: undefined,
        type: 'unknown'
    };
}

function invertColor(color: string | undefined) {
    if (color === undefined) {
        return undefined;
    }
    if (color.contains('light')) {
        return color.replace('light', 'dark');
    } else {
        return color.replace('dark', 'light');
    }
}

export function getTempDir(type: RenderType): string {
    return path.join(os.tmpdir(), `obsidian-${type}`);
}

export class Processors {
    pluginSettings: GraphvizSettings;
    vaultAdapter: DataAdapter;
    metadataCache: MetadataCache;

    referenceGraphMap: Map<string, { sourcePath: string, extras: Map<string, string> }> = new Map();

    constructor(plugin: GraphvizPlugin) {
        this.pluginSettings = plugin.settings;
        this.vaultAdapter = plugin.app.vault.adapter;
        this.metadataCache = plugin.app.metadataCache;
    }

    private getRendererParameters(type: RenderType, sourceFile: string, outputFile: string): [string, string[], boolean] {
        switch (type) {
            case 'dot':
                return [this.pluginSettings.dotPath, ['-Tsvg', sourceFile, '-o', outputFile], false];
            case 'latex':
                return [this.pluginSettings.pdflatexPath, ['-shell-escape', '-output-directory', getTempDir(type), sourceFile], false];
            case 'ditaa':
                return [this.pluginSettings.ditaaPath, [sourceFile, '--transparent', '--svg', '--overwrite'], false];
            case 'blockdiag':
                return [this.pluginSettings.blockdiagPath, ['--antialias', '-Tsvg', sourceFile, '-o', outputFile], false];
            case 'asciidoc':
                return [this.pluginSettings.asciidocPath, ['-e', sourceFile, '-o', outputFile], true];
            default:
                return ['', [], true];
        }
    }

    public getProcessorForType(type: RenderType) {
        return (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> => {
            return this.imageProcessor(source, el, ctx, type);
        };
    }

    private spawnProcess(cmdPath: string, parameters: string[]): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            console.debug(`Starting external process ${cmdPath}, ${parameters}`);
            const process = spawn(cmdPath, parameters);
            let errData = '';
            process.stderr.on('data', (data) => { errData += data; });
            process.on('error', (err: Error) => reject(`"${cmdPath} ${parameters}" failed, ${err}`));
            process.stdin.end();

            process.on('exit', (code) => {
                if (code !== 0) {
                    return reject(`"${cmdPath} ${parameters}" failed, error code: ${code}, stderr: ${errData}`);
                }
                resolve('ok');
            });
        });
    }

    private async writeRenderedFile(inputFile: string, outputFile: string, type: RenderType, conversionParams: SSMap) {

        const [cmdPath, params, skipDynamicSvg] = this.getRendererParameters(type, inputFile, outputFile);

        await this.spawnProcess(cmdPath, params);
        if (type === 'latex') {
            await this.spawnProcess(this.pluginSettings.pdf2svgPath, [`${inputFile}.pdf`, outputFile]);
        }

        const renderedContent = readFileString(outputFile);

        if (!skipDynamicSvg) {
            const svg = this.makeDynamicSvg(renderedContent, conversionParams);
            fs.writeFileSync(outputFile, svg.svgData);
            return svg;
        }

        return {
            svgData: renderedContent,
            extras: conversionParams
        };
    }

    private makeDynamicSvg(svgSource: string, conversionParams: SSMap) {
        // replace colors with dynamic colors
        // TODO: parse svg groups
        const width = conversionParams.get('width');
        if (width) {
            svgSource = svgSource.replace('<svg', `<svg style="width: ${width}" `);
        }
        const svgStart = svgSource.indexOf('<svg') + 4;
        let currentIndex;

        for (const svgTag of svgTags) {
            currentIndex = svgStart;
            while (true) {
                currentIndex = svgSource.indexOf(`<${svgTag}`, currentIndex);

                if (currentIndex == -1) {
                    break;
                }

                currentIndex += svgTag.length + 2; // 2 because of '<' and ' '
                const styleSubstring = svgSource.substring(currentIndex, svgSource.indexOf('>', currentIndex));

                let newStyle = 'style="';
                let additionalTag = '';

                for (const svgStyleTag of svgStyleTags) {

                    const tagStyle = styleSubstring.match(`${svgStyleTag}=".*?"`);

                    console.error(tagStyle);

                    if (!tagStyle?.length && svgStyleTag == 'stroke' && !conversionParams.get(`${svgTag}-implicit-stroke`)) {
                        continue;
                    }

                    const tagColor = tagStyle?.length ? tagStyle[0].replaceAll(/.*=|"/g, '') : 'black';
                    const rcolor = mapColor(tagColor, false);

                    if (!rcolor.color) {
                        // we were unable to parse color
                        newStyle += `${svgStyleTag}:${tagColor};`;
                        continue;
                    }

                    const params = (conversionParams.get(`${svgTag}-${svgStyleTag}`) || '').split(',');
                    let skip = false;
                    for (const param of params) {
                        switch (param) {
                            case 'keep-color':
                                additionalTag = 'class="keep-color"';
                                break;
                            case 'keep-shade':
                                additionalTag = 'class="keep-shade"';
                                break;
                            case 'keep-all':
                                additionalTag = 'class="keep-color keep-shade"';
                                break;
                            case 'invert-color':
                                if (rcolor.type === 'color') {
                                    rcolor.color = invertColor(rcolor.color);
                                }
                                break;
                            case 'invert-shade':
                                if (rcolor.type === 'shade') {
                                    rcolor.color = invertColor(rcolor.color);
                                }
                                break;
                            case 'invert-all':
                                rcolor.color = invertColor(rcolor.color);
                                break;
                            case 'skip':
                                skip = true;
                                break;
                        }
                        if (skip) {
                            break;
                        }
                    }
                    if (!skip) {
                        newStyle += `${svgStyleTag}:var(${rcolor.color});`;
                    }
                }

                newStyle += `" ${additionalTag} `;

                svgSource = insertStr(svgSource, currentIndex, newStyle);
            }
        }

        svgSource = svgSource.replaceAll(svgStyleRegex, '');
        return {
            svgData: svgSource,
            extras: conversionParams
        };
    }

    private parseFrontMatter(source: string, outputFile: string) {
        const conversionParams = new Map<string, string>();
        let referenceName = '';
        let preset;

        // TODO: color matching: to source palette, to target palette, to source with tint

        if (source.startsWith('---')) {

            const lastIndex = source.indexOf('---', 3);
            const frontMatter = source.substring(3, lastIndex);
            const parameters = frontMatter.trim().split('\n');

            for (const parameter of parameters) {
                const parameter_split = parameter.split(':');
                const parameter_name = parameter_split[0].trim();
                const parameter_value = parameter_split[1].trim();

                switch (parameter_name) {
                    case 'ref-name':
                    case 'graph-name':
                    case 'name':
                        referenceName = parameter_value;
                        break;
                    case 'preset':
                        preset = presets.get(parameter_value);
                        if (!preset) {
                            break;
                        }
                        for (const [preset_key, preset_value] of preset) {
                            conversionParams.set(preset_key, preset_value);
                        }
                        break;
                    default:
                        conversionParams.set(parameter_name, parameter_value);
                }
            }

            source = source.substring(lastIndex + 3);

            if (referenceName.length > 0) {
                this.referenceGraphMap.set(referenceName, {
                    sourcePath: outputFile,
                    extras: conversionParams
                });
            }

        }
        return {
            cleanedSource: source.replace(/^\n|\n$/g, ''), // only trim newlines
            extras: conversionParams
        };
    }

    private async renderImage(type: RenderType, source: string): Promise<{ svgData: string, extras: SSMap }> {

        if (type === 'refgraph') {
            const graphData = this.referenceGraphMap.get(source.trim());
            if (!graphData) {
                throw Error(`Graph with name ${source} does not exist`);
            }
            return {
                svgData: readFileString(graphData.sourcePath),
                extras: graphData.extras
            };
        }

        const temp_dir = getTempDir(type);
        const graph_hash = md5(source);
        const inputFile = path.join(temp_dir, graph_hash);
        const outputFile = `${inputFile}.svg`;

        if (!fs.existsSync(temp_dir)) {
            fs.mkdirSync(temp_dir);
        }

        const graphData = this.parseFrontMatter(source, outputFile);

        if (type === 'dynamic-svg') {
            const resolvedLink = this.metadataCache.getFirstLinkpathDest(graphData.cleanedSource.slice(2, -2), '')?.path;
            if (!resolvedLink) {
                throw Error(`Invalid link: ${graphData.cleanedSource}`);
            }
            return this.makeDynamicSvg((await this.vaultAdapter.read(resolvedLink)).toString(), graphData.extras);
        }

        if (!fs.existsSync(inputFile)) {
            fs.writeFileSync(inputFile, graphData.cleanedSource);
        } else if (fs.existsSync(outputFile)) {
            return {
                svgData: readFileString(outputFile),
                extras: graphData.extras
            };
        }

        return this.writeRenderedFile(inputFile, outputFile, type, graphData.extras);
    }

    private async imageProcessor(source: string, el: HTMLElement, _: MarkdownPostProcessorContext, type: RenderType): Promise<void> {
        try {
            console.debug(`Call image processor for ${type}`);

            const image = await this.renderImage(type, source.trim());

            el.classList.add(image.extras.get('inverted') ? 'multi-graph-inverted' : 'multi-graph-normal');
            el.innerHTML = image.svgData;

        } catch (errMessage) {
            console.error('convert to image error: ' + errMessage);
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.setText(errMessage);
            pre.appendChild(code);
            el.appendChild(pre);
        }
    }
}
