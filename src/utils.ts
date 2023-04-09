import * as fs from 'fs';

const hexExtractRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export function readFileString(path: string): string {
    return fs.readFileSync(path).toString();
}

export function insertStr(str: string, start: number, newSubStr: string) {
    return str.slice(0, start) + newSubStr + str.slice(start);
}

export function rgb100ToHex(colors: string[]): string {
    let hexString = '#';
    for (const color of colors) {
        const component = Math.floor(parseInt(color) / 100.0 * 255).toString(16);
        hexString += (component.length == 1 ? `0${component}` : component);
    }
    return hexString;
}

export type RgbColor = {
    r: number,
    g: number,
    b: number
}

export function hexToRgb(color: string): RgbColor | undefined {
    const colors = hexExtractRegex.exec(color);
    return colors ? {
        r: parseInt(colors[1], 16),
        g: parseInt(colors[2], 16),
        b: parseInt(colors[3], 16)
    } : undefined;
}

export function getMagnitudeColorDelta(color1: RgbColor, color2: RgbColor): number {
    return Math.abs(color1.r - color2.r) +
        Math.abs(color1.g - color2.g) +
        Math.abs(color1.b - color2.b);
}

export function getColorDelta(color1: RgbColor, color2: RgbColor): RgbColor {
    return {
        r: color1.r - color2.r,
        g: color1.g - color2.g,
        b: color1.b - color2.b
    };
}

export function findClosestColorVar(targetColor: RgbColor, colorMap: Map<RgbColor, string>): { var: string, foundColor: RgbColor, delta: number } {
    let minimumDelta = Infinity;
    let closestColorVar = '';
    let closestColor = targetColor;
    for (const [colorRgb, colorVar] of colorMap) {
        const delta = getMagnitudeColorDelta(targetColor, colorRgb);
        if (delta < minimumDelta) {
            minimumDelta = delta;
            closestColorVar = colorVar;
            closestColor = colorRgb;
        }
    }
    return {
        var: closestColorVar,
        foundColor: closestColor,
        delta: minimumDelta
    };
}

export function isDefined(val: unknown): boolean {
    return !(val === undefined || val === null);
}

export function invertColorName(color: string | undefined) {
    if (color === undefined) {
        return undefined;
    }
    if (color.contains('light')) {
        return color.replace('light', 'dark');
    } else {
        return color.replace('dark', 'light');
    }
}