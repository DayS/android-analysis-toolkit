#!/usr/bin/env node

import commander from 'commander';
import FileFetcher from "./utils/fileFetcher";
import FridaModule from "./modules/frida";

let fileFetcher = new FileFetcher();

commander
    .version('0.1.0')
    .description('Set of tools for dynamic analysis with Frida');

FridaModule.prepare(fileFetcher).apply(commander);

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp()
}

