import * as fs from 'fs';

export function readFileString(path: string): string {
    return fs.readFileSync(path).toString();
}

export function insertStr(str: string, start: number, newSubStr: string) {
    return str.slice(0, start) + newSubStr + str.slice(start);
}