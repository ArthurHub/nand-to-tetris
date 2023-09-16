import * as fs from 'fs';
import * as path from 'path';

export function getAllVmFiles(basePath: string): string[] {
    return getAllFiles(basePath, 'vm');
}

export function getAllFiles(basePath: string, ext: string): string[] {
    const extension = ext[0] === '.' ? ext : '.' + ext;
    const files: string[] = fs.readdirSync(basePath, { recursive: true, encoding: 'utf8' });
    return files.filter((file: string) => path.extname(file) === extension)
        .map((file: string) => path.join(basePath, file));
}

export function readFileLines(path: fs.PathOrFileDescriptor): string[] {
    return fs.readFileSync(path, 'utf8').split('\n');
}

export function writeFileLines(path: fs.PathOrFileDescriptor, lines: string[]): void {
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
}
