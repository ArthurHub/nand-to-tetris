import { Transpiler } from './transpiler.js';
import * as utils from './utils.js';

try {
    const allFiles = utils.getAllVmFiles('./07/');
    for await (const inFile of allFiles) {
        try {
            console.log(`Transpiling file "${inFile}"`);
            const transpiler = new Transpiler(inFile);
            const asmLines = await transpiler.transpile();
            console.debug(`Done "${transpiler.fileName}" with ${asmLines} assembly lines`);
        } catch (error) {
            console.error(`Error transpiling file ${inFile}: ${error}`);
        }
    }
} catch (error) {
    console.error(`Fatal error in main: ${error}`);
}
