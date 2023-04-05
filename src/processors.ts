/* eslint-disable no-constant-condition */
import { DataAdapter, MarkdownPostProcessorContext } from 'obsidian';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import GraphvizPlugin from './main';

import { GraphvizSettings } from './setting';

import * as crypto from 'crypto';
const md5 = (contents: string) => crypto.createHash('md5').update(contents).digest('hex');

export const renderTypes = ['dot', 'latex', 'ditaa', 'blockdiag', 'refgraph', 'dynamic-svg'] as const;
type RenderType = typeof renderTypes[number];

const svgTags = ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'] as const;

const svgStyleTags = ['fill', 'stroke'] as const;

type SSMap = Map<string, string>

const svgColorMap = new Map<string, string>([

    // dark colors
    ['darkred', '--g-color-dark-red'],
    ['firebrick', '--g-color-dark-red'],
    ['maroon', '--g-color-dark-red'],
    ['brown', '--g-color-dark-red'],
    ['darkred', '--g-color-dark-red'],

    ['darkmagenta', '--g-color-dark-purple'],
    ['darkviolet', '--g-color-dark-purple'],
    ['blueviolet', '--g-color-dark-purple'],
    ['darkorchid', '--g-color-dark-purple'],
    ['indigo', '--g-color-dark-purple'],

    ['darkgreen', '--g-color-dark-green'],

    ['darkblue', '--g-color-dark-blue'],

    ['chocolate', '--g-color-dark-orange'],

    ['goldenrod', '--g-color-dark-yellow'],

    ['darkcyan', '--g-color-dark-cyan'],

    // neutral colors
    ['red', '--g-color-red'],
    ['purple', '--g-color-purple'],
    ['green', '--g-color-green'],
    ['blue', '--g-color-blue'],
    ['darkorange', '--g-color-orange'],
    ['yellow', '--g-color-yellow'],
    ['cyan', '--g-color-cyan'],

    // light colors
    ['tomato', '--g-color-light-red'],
    ['lightcoral', '--g-color-light-red'],
    ['indianred', '--g-color-light-red'],

    ['magenta', '--g-color-light-purple'],
    ['lightgreen', '--g-color-light-green'],
    ['lightblue', '--g-color-light-blue'],

    ['orange', '--g-color-light-orange'],
    ['coral', '--g-color-light-orange'],

    ['gold', '--g-color-light-yellow'],
    ['aqua', '--g-color-light-cyan'],
    ['aquamarine', '--g-color-light-cyan'],


    // gray colors
    ['ghostwhite', '--g-color-light100-hard'], // #F9F5D7
    ['white', '--g-color-light100'],           // #FBF1C7
    ['seashell', '--g-color-light100-soft'],   // #F2E5BC
    ['snow', '--g-color-light90'],             // #EBDBB2                    
    ['whitesmoke', '--g-color-light80'],       // #D5C4A1
    ['lightgray', '--g-color-light70'],        // #BDAE93
    ['silver', '--g-color-light60'],           // #A89984

    //['--g-color-dark100-hard']               // #1D2021 unused
    ['black', '--g-color-dark100'],            // #282828
    ['dimgray', '--g-color-dark100-soft'],     // #32302F
    ['darkslategray', '--g-color-dark90'],     // #3C3836
    ['slategray', '--g-color-dark80'],         // #504945
    ['lightslategray', '--g-color-dark70'],    // #665C54
    ['gray', '--g-color-dark60'],              // #7C6F64

    ['darkgray', '--g-color-gray']            // #928374
]);

export class Processors {
    pluginSettings: GraphvizSettings;
    vaultAdapter: DataAdapter;

    referenceGraphMap: Map<string, { sourcePath: string, extras: Map<string, string> }> = new Map();

    constructor(plugin: GraphvizPlugin) {
        this.pluginSettings = plugin.settings;
        this.vaultAdapter = plugin.app.vault.adapter;
    }

    private getRendererParameters(type: RenderType, sourceFile: string, outputFile: string): [string, string[]] {
        switch (type) {
            case 'dot':
                return [this.pluginSettings.dotPath, ['-Tsvg', sourceFile, '-o', outputFile]];
            case 'latex':
                return [this.pluginSettings.pdflatexPath, ['-shell-escape', '-output-directory', this.getTempDir(type), sourceFile]];
            case 'ditaa':
                return [this.pluginSettings.ditaaPath, [sourceFile, '--transparent', '--svg', '--overwrite']];
            case 'blockdiag':
                return [this.pluginSettings.blockdiagPath, ['--antialias', '-Tsvg', sourceFile, '-o', outputFile]];
            default:
                return ['', []];
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

        const [cmdPath, params] = this.getRendererParameters(type, inputFile, outputFile);

        await this.spawnProcess(cmdPath, params);
        if (type === 'latex') {
            await this.spawnProcess(this.pluginSettings.pdf2svgPath, [`${inputFile}.pdf`, outputFile]);
        }

        const svg = this.makeDynamicSvg(fs.readFileSync(outputFile).toString(), conversionParams);
        fs.writeFileSync(outputFile, svg.svgData);

        return svg;
    }

    private readFileString(path: string): string {
        return fs.readFileSync(path).toString();
    }

    private getTempDir(type: RenderType): string {
        return path.join(os.tmpdir(), `obsidian-${type}`);
    }

    private insertStr(str: string, start: number, newSubStr: string) {
        return str.slice(0, start) + newSubStr + str.slice(start);
    }

    private makeDynamicSvg(svgSource: string, conversionParams: SSMap) {
        // replace colors with dynamic colors

        for (const svgTag of svgTags) {
            let currentIndex = svgSource.indexOf('<svg') + 4;
            while (true) {
                currentIndex = svgSource.indexOf(svgTag, currentIndex) + svgTag.length + 1;

                if (currentIndex == -1) {
                    break;
                }

                const endIndex = svgSource.indexOf('>', currentIndex);
                const styleSubstring = svgSource.substring(currentIndex, endIndex);

                console.error(currentIndex);
                console.error(endIndex);
                console.error(styleSubstring);

                let newStyle = 'style="';

                for (const svgStyleTag of svgStyleTags) {
                    const tagStyle = styleSubstring.match(`/${svgStyleTag}=".*?"/`);
                    const tagColor = tagStyle?.length ? tagStyle[0].replace(/.*=|"/, '') : 'black';
                    const remappedColor = svgColorMap.get(tagColor) || tagColor;
                    console.error(`${tagStyle}, ${tagColor}, ${remappedColor}`);
                    newStyle += `${svgStyleTag}:var(${remappedColor});`;
                }

                newStyle += '" ';

                svgSource = this.insertStr(svgSource, currentIndex, newStyle);

                break;
            }
        }

        // strip font-family to inherit from note's font-family
        // TODO: set font-family to document's font-family
        //svgSource = svgSource.replaceAll(/font-family=".*?"/g, '');
        return {
            svgData: svgSource,
            extras: conversionParams
        };
    }

    private parseFrontMatter(source: string, outputFile: string) {
        const conversionParams = new Map<string, string>();
        let referenceName = '';
        if (source.startsWith('---')) {

            const lastIndex = source.indexOf('---', 3);
            const frontMatter = source.substring(3, lastIndex);
            const parameters = frontMatter.trim().split('\n');

            for (const parameter of parameters) {
                const parameter_split = parameter.split(':');
                const parameter_name = parameter_split[0].trim();
                const parameter_value = parameter_split[1].trim();

                if (parameter_name === 'ref-name') {
                    referenceName = parameter_value;
                } else {
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
            cleanedSource: source.trim(),
            extras: conversionParams
        };
    }

    private async renderImage(type: RenderType, source: string): Promise<{ svgData: string, extras: SSMap }> {

        if (type === 'refgraph') {
            const graphData = this.referenceGraphMap.get(source.trim());
            return {
                svgData: this.readFileString(graphData.sourcePath),
                extras: graphData.extras
            };
        }

        const temp_dir = this.getTempDir(type);
        const graph_hash = md5(source);
        const inputFile = path.join(temp_dir, graph_hash);
        const outputFile = `${inputFile}.svg`;

        if (!fs.existsSync(temp_dir)) {
            fs.mkdirSync(temp_dir);
        }

        const graphData = this.parseFrontMatter(source, outputFile);

        if (type === 'dynamic-svg') {
            return this.makeDynamicSvg((await this.vaultAdapter.read(graphData.cleanedSource)).toString(), graphData.extras);
        }

        if (!fs.existsSync(inputFile)) {
            fs.writeFileSync(inputFile, graphData.cleanedSource);
        } else if (fs.existsSync(outputFile)) {
            return {
                svgData: this.readFileString(outputFile),
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
