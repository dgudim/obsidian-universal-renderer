/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-constant-condition */
import { DataAdapter, MarkdownPostProcessorContext, MetadataCache } from 'obsidian';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import GraphvizPlugin from './main';

import { GraphvizSettings } from './setting';

import * as crypto from 'crypto';
import { RgbColor, findClosestColorVar, getColorDelta, hexToRgb, insertStr, invertColorName, isDefined, readFileString, rgb100ToHex } from './utils';
const md5 = (contents: string) => crypto.createHash('md5').update(contents).digest('hex');

export const renderTypes = [
    'dot', 'latex',
    'ditaa', 'blockdiag', 'asciidoc',
    'refgraph', 'dynamic-svg',
    'plantuml'] as const;
type RenderType = typeof renderTypes[number];

const svgTags = ['text', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'] as const;

const svgStyleTags = ['fill', 'stroke'] as const;
const regQotedStr = '(?:"|\').*?(?:"|\')';
const svgStyleRegex_g = new RegExp(`(?:${svgStyleTags.join('|')})=${regQotedStr}`, 'g');
const rgbRegex_g = /rgb\(|\)| |%/g;
const propertyNameRegex_g = /.*=|"|'/g;
const idRegex_g = new RegExp(`id=${regQotedStr}`, 'g');

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
let rgbColorToVar: Map<RgbColor, string>;


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
let rgbShadeToVar: Map<RgbColor, string>;
//@ts-format-ignore-endregion

const presets = new Map<string, Map<string, string>>([
    ['math-graph', new Map<string, string>([
        ['ellipse-fill', 'keep-shade'],
        ['text-fill', 'keep-shade']
    ])],
    ['default-latex', new Map<string, string>([
        ['invert-shade', '1'],
        ['width', '100%'],
        ['doc-start', '\\documentclass[preview,class=article]{standalone}\\usepackage{amsmath}\\usepackage{multicol}\\usepackage[table,usenames,dvipsnames]{xcolor}\\begin{document}'],
        ['doc-end', '\\end{document}'],
    ])],
    ['default-tikz', new Map<string, string>([
        ['invert-shade', '1'],
        ['width', '100%'],
        ['doc-start', '\\documentclass[tikz]{standalone}\\usepackage{tikz}\\begin{document}'],
        ['doc-end', '\\end{tikzpicture}\\end{document}']
    ])],
    ['default-plantuml', new Map<string, string>([
        ['invert-shade', '1'],
        ['width', '100%'],
        ['doc-start', '@startuml'],
        ['doc-end', '@enduml']
    ])]
]);

function transformColorMap(colorList: (string | string[][])[][]): { colorToVar: SSMap, hexToVar: Map<RgbColor, string> } {
    const colorToVar = new Map<string, string>();
    const rgbToVar = new Map<RgbColor, string>();
    for (const entry of colorList) {
        const colorVar = entry[1] as string;
        for (const colorEntries of entry[0]) {
            for (const color of colorEntries) {
                if (color.startsWith('#')) {
                    rgbToVar.set(hexToRgb(color)!, colorVar);
                }
                colorToVar.set(color.toLowerCase(), colorVar);
            }
        }
    }
    return {
        colorToVar: colorToVar,
        hexToVar: rgbToVar
    };
}

function mapColor(sourceColor: string): {
    colorVar?: string, sourceColor?: RgbColor,
    type: ColorType, delta: number, deltaColor?: RgbColor
} {

    if (!isDefined(shadeToVar)) {
        const transformed = transformColorMap(svgShades);
        shadeToVar = transformed.colorToVar;
        rgbShadeToVar = transformed.hexToVar;
    }

    if (!isDefined(colorToVar)) {
        const transformed = transformColorMap(svgColors);
        colorToVar = transformed.colorToVar;
        rgbColorToVar = transformed.hexToVar;
    }

    let colorVar = colorToVar.get(sourceColor);
    let shadeVar = shadeToVar.get(sourceColor);

    let delta = 0;
    let deltaColor = undefined;

    const sourceRgbColor = hexToRgb(sourceColor);

    if (!isDefined(colorVar) && !isDefined(shadeVar) && isDefined(sourceRgbColor)) {
        const closestColor = findClosestColorVar(sourceRgbColor!, rgbColorToVar);
        const closestShade = findClosestColorVar(sourceRgbColor!, rgbShadeToVar);
        if (closestColor.delta < closestShade.delta) {
            colorVar = closestColor.var;
            delta = closestColor.delta;
            deltaColor = getColorDelta(sourceRgbColor!, closestColor.foundColor);
        } else {
            shadeVar = closestShade.var;
            delta = closestShade.delta;
            deltaColor = getColorDelta(sourceRgbColor!, closestShade.foundColor);
        }
    }

    if (isDefined(colorVar)) {
        return {
            colorVar: colorVar,
            type: 'color',
            delta: delta,
            deltaColor: deltaColor,
            sourceColor: sourceRgbColor
        };
    } else if (isDefined(shadeVar)) {
        return {
            colorVar: shadeVar,
            type: 'shade',
            delta: delta,
            deltaColor: deltaColor,
            sourceColor: sourceRgbColor
        };
    }

    return {
        colorVar: undefined,
        type: 'unknown',
        delta: 0,
        deltaColor: undefined,
        sourceColor: sourceRgbColor
    };
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

    private getRendererParameters(type: RenderType, inputFile: string, outputFile: string): { execParams: { path: string, options: string[] }[], skipDynamicSvg: boolean } {
        switch (type) {
            case 'dot':
                return {
                    execParams: [
                        {
                            path: this.pluginSettings.dotPath,
                            options: ['-Tsvg', inputFile, '-o', outputFile]
                        }
                    ],
                    skipDynamicSvg: false,
                };
            case 'latex':
                return {
                    execParams: [
                        {
                            path: this.pluginSettings.pdflatexPath,
                            options: ['-shell-escape', '-output-directory', getTempDir(type), inputFile]
                        }, {
                            path: this.pluginSettings.pdfCropPath,
                            options: [`${inputFile}.pdf`]
                        }, {
                            path: this.pluginSettings.pdf2svgPath,
                            options: [`${inputFile}-crop.pdf`, outputFile]
                        }
                    ],
                    skipDynamicSvg: false,
                };
            case 'ditaa':
                return {
                    execParams: [
                        {
                            path: this.pluginSettings.ditaaPath,
                            options: [inputFile, '--transparent', '--svg', '--overwrite']
                        }
                    ],
                    skipDynamicSvg: false,
                };
            case 'blockdiag':
                return {
                    execParams: [
                        {
                            path: this.pluginSettings.blockdiagPath,
                            options: ['--antialias', '-Tsvg', inputFile, '-o', outputFile]
                        }
                    ],
                    skipDynamicSvg: false,
                };
            case 'asciidoc':
                return {
                    execParams: [
                        {
                            path: this.pluginSettings.asciidocPath,
                            options: ['-e', inputFile, '-o', outputFile]
                        }
                    ],
                    skipDynamicSvg: true,
                };
            case 'plantuml':
                return {
                    execParams: [
                        {
                            path: this.pluginSettings.plantumlPath,
                            options: ['-nbthread', 'auto', '-failfast2', '-tsvg', '-nometadata', '-overwrite', inputFile]
                        }
                    ],
                    skipDynamicSvg: false,
                };
            default:
                return {
                    execParams: [],
                    skipDynamicSvg: true,
                };
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

    private async writeRenderedFile(inputFile: string, outputFile: string, type: RenderType, conversionParams: SSMap, hash: string): Promise<{ svgData: string; }> {

        const renderer = this.getRendererParameters(type, inputFile, outputFile);

        for (const process of renderer.execParams) {
            await this.spawnProcess(process.path, process.options);
        }

        const renderedContent = readFileString(outputFile);

        if (!renderer.skipDynamicSvg) {
            const svg = this.makeDynamicSvg(renderedContent, conversionParams, hash);
            fs.writeFileSync(outputFile, svg.svgData);
            return svg;
        }

        return {
            svgData: renderedContent
        };
    }

    private makeDynamicSvg(svgSource: string, conversionParams: SSMap, hash: string): { svgData: string } {
        // replace colors with dynamic colors
        // TODO: parse svg groups
        const width = conversionParams.get('width');
        if (width) {
            svgSource = svgSource.replace('<svg', `<svg style="width: ${width}" `);
        }
        const svgStart = svgSource.indexOf('<svg') + 4;
        let currentIndex;

        const globalColorInvert = conversionParams.has('invert-color');
        const globalShadeInvert = conversionParams.has('invert-shade');

        for (const svgTag of svgTags) {
            currentIndex = svgStart;
            while (true) {
                currentIndex = svgSource.indexOf(`<${svgTag}`, currentIndex);

                if (currentIndex == -1) {
                    break;
                }

                currentIndex += svgTag.length + 2; // 2 because of '<' and ' '
                const styleSubstring = svgSource.substring(currentIndex, svgSource.indexOf('>', currentIndex));

                let style = '';
                let additionalTag = '';

                for (const svgStyleTag of svgStyleTags) {

                    const tagStyle = styleSubstring.match(`${svgStyleTag}=${regQotedStr}`);

                    if (!tagStyle?.length && svgStyleTag == 'stroke' && !conversionParams.get(`${svgTag}-implicit-stroke`)) {
                        continue;
                    }

                    let tagHexColor = tagStyle?.length ? tagStyle[0].replaceAll(propertyNameRegex_g, '') : 'black';

                    if (tagHexColor.startsWith('rgb')) {
                        tagHexColor = rgb100ToHex(tagHexColor.replaceAll(rgbRegex_g, '').split(','));
                    }

                    const params = (conversionParams.get(`${svgTag}-${svgStyleTag}`) || '').split(',');

                    if (params.contains('skip')) {
                        // skip it, use the original value
                        style += `${svgStyleTag}:${tagHexColor};`;
                        continue;
                    }

                    const rcolor = mapColor(tagHexColor);

                    if (!rcolor.colorVar) {
                        // we were unable to parse color, use original value
                        style += `${svgStyleTag}:${tagHexColor};`;
                        continue;
                    }

                    const localInvert = params.contains(`invert-${rcolor.type}`) || params.contains('invert-all');
                    const globalInvert = rcolor.type === 'color' ? globalColorInvert : globalShadeInvert;

                    if (globalInvert != localInvert) {
                        rcolor.colorVar = invertColorName(rcolor.colorVar);
                    }

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
                        }
                    }

                    const mixMultiplier = parseFloat(conversionParams.get('mix-multiplier') || '0');

                    if (mixMultiplier && rcolor.delta) {

                        const mixMode = conversionParams.get('mix-mode') || '';
                        const inverseMixMultiplier = 1 - mixMultiplier;

                        switch (mixMode) {
                            case 'mix':
                                const col = rcolor.sourceColor!;
                                style += `${svgStyleTag}:rgb(
                                    clamp(0, calc(${col.r * mixMultiplier} + ${inverseMixMultiplier} * var(${rcolor.colorVar}_r)), 255), 
                                    clamp(0, calc(${col.g * mixMultiplier} + ${inverseMixMultiplier} * var(${rcolor.colorVar}_g)), 255), 
                                    clamp(0, calc(${col.b * mixMultiplier} + ${inverseMixMultiplier} * var(${rcolor.colorVar}_b)), 255));`;
                                break;
                            case 'delta':
                            default:
                                const cdlt = rcolor.deltaColor!;
                                style += `${svgStyleTag}:rgb(
                                    clamp(0, calc(var(${rcolor.colorVar}_r) + ${cdlt.r * mixMultiplier}), 255), 
                                    clamp(0, calc(var(${rcolor.colorVar}_g) + ${cdlt.g * mixMultiplier}), 255), 
                                    clamp(0, calc(var(${rcolor.colorVar}_b) + ${cdlt.b * mixMultiplier}), 255));`;
                        }
                    } else {
                        style += `${svgStyleTag}:var(${rcolor.colorVar});`;
                    }

                }

                svgSource = insertStr(svgSource, currentIndex, `style="${style}" ${additionalTag} `);
            }
        }

        svgSource = svgSource.replaceAll(svgStyleRegex_g, ''); // remove fill, stroke, etc from direct svg tags


        const ids = svgSource.match(idRegex_g);
        if (ids) {  // make all ids unique
            for (const id of ids) {
                const idc = id.replaceAll(propertyNameRegex_g, '');
                svgSource = svgSource.replaceAll(idc, `${idc}-${hash}`);
            }
        }

        return {
            svgData: svgSource
        };
    }

    private preprocessSource(type: RenderType, source: string, outputFile: string): { source: string, extras: SSMap } {
        let conversionParams = new Map<string, string>();

        if (source.startsWith('---')) {

            const lastIndex = source.indexOf('---', 3);
            const frontMatter = source.substring(3, lastIndex);
            conversionParams = new Map(frontMatter.trim().split('\n').map((parameter) => {
                const parameter_split = parameter.split(':');
                if (parameter_split.length == 1) {
                    parameter_split.push('1');
                }
                return [parameter_split[0].trim(), parameter_split[1].trim()];
            }));

            source = source.substring(lastIndex + 3);
        }

        const preset = presets.get(conversionParams.get('preset') || `default-${type}`);
        if (preset) {
            for (const [preset_key, preset_value] of preset) {
                if (!conversionParams.has(preset_key)) {
                    conversionParams.set(preset_key, preset_value);
                }
            }
        }

        for (const [param_key, param_value] of conversionParams) {
            switch (param_key) {
                case 'ref-name':
                case 'graph-name':
                case 'name':
                    this.referenceGraphMap.set(param_value, {
                        sourcePath: outputFile,
                        extras: conversionParams
                    });
                    break;
                case 'doc-start':
                    source = param_value + '\n' + source;
                    break;
                case 'doc-end':
                    source = source + '\n' + param_value;
            }
        }

        return {
            source: source,
            extras: conversionParams
        };
    }

    private async renderImage(type: RenderType, source: string): Promise<{ svgData: string }> {

        if (type === 'refgraph') {
            const graphData = this.referenceGraphMap.get(source.trim());
            if (!graphData) {
                throw Error(`Graph with name ${source} does not exist`);
            }
            return {
                svgData: readFileString(graphData.sourcePath)
            };
        }

        const temp_dir = getTempDir(type);
        const graph_hash = md5(source);
        const inputFile = path.join(temp_dir, graph_hash);
        const outputFile = `${inputFile}.svg`;

        if (!fs.existsSync(temp_dir)) {
            fs.mkdirSync(temp_dir);
        }

        const graphData = this.preprocessSource(type, source, outputFile);

        if (type === 'dynamic-svg') {
            graphData.source = graphData.source.trim();
            const resolvedLink = this.metadataCache.getFirstLinkpathDest(graphData.source.slice(2, -2), '')?.path;
            if (!resolvedLink) {
                throw Error(`Invalid link: ${graphData.source}`);
            }
            return this.makeDynamicSvg((await this.vaultAdapter.read(resolvedLink)).toString(), graphData.extras, graph_hash);
        }

        if (!fs.existsSync(inputFile)) {
            fs.writeFileSync(inputFile, graphData.source);
        } else if (fs.existsSync(outputFile)) {
            return {
                svgData: readFileString(outputFile)
            };
        }

        return this.writeRenderedFile(inputFile, outputFile, type, graphData.extras, graph_hash);
    }

    private async imageProcessor(source: string, el: HTMLElement, _: MarkdownPostProcessorContext, type: RenderType): Promise<void> {
        try {
            console.debug(`Call image processor for ${type}`);

            const image = await this.renderImage(type, source.trim());

            el.classList.add('multi-graph');
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
