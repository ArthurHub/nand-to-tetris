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

/**
 * Get all the top-folders under the given base folder.
 * A top folder is a folder that does not contain any sub-folders.
 */
export function getTopFolders(baseFolder: string): string[] {
    const topFolders: string[] = [];

    // Read the contents of the base folder
    const folderContents = fs.readdirSync(baseFolder, { recursive: true, encoding: 'utf8' });

    for (const item of folderContents) {
        const itemPath = path.join(baseFolder, item);

        // Check if the item is a directory
        if (fs.statSync(itemPath).isDirectory()) {
            // Check if the directory is empty (no sub-folders)
            const subFolders = fs.readdirSync(itemPath);
            const hasSubFolders = subFolders.some((subItem) =>
                fs.statSync(path.join(itemPath, subItem)).isDirectory()
            );

            if (!hasSubFolders) {
                topFolders.push(itemPath);
            }
        }
    }

    return topFolders;
}

export function readFileLines(path: fs.PathOrFileDescriptor): string[] {
    return fs.readFileSync(path, 'utf8').split('\n');
}

export function writeFileLines(path: fs.PathOrFileDescriptor, lines: string[]): void {
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
}
