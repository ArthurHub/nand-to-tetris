import { Transpiler } from './transpiler.js';
import * as utils from './utils.js';

try {
    const topFolders = utils.getTopFolders('./08/');
    for await (const folder of topFolders) {
        try {
            console.log(`Transpiling folder "${folder}"`);
            const transpiler = new Transpiler(folder);
            const asmLines = await transpiler.transpile();
            console.debug(`Done "${transpiler.folderPath}" with ${asmLines} assembly lines`);
        } catch (error) {
            console.error(`Error transpiling folder ${folder}: ${error}`);
        }
    }
} catch (error) {
    console.error(`Fatal error in main: ${error}`);
}
