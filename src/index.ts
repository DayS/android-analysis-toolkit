#!/usr/bin/env node

import commander from 'commander';
import FileFetcher from "./utils/fileFetcher";
import FridaModule from "./modules/frida";
import ApkModule from "./modules/apk";
import MitmModule from "./modules/mitm";

let fileFetcher = new FileFetcher();

commander
    .version('0.1.0')
    .description('Set of tools for dynamic analysis with Frida');

FridaModule.prepare(fileFetcher).apply(commander);
MitmModule.prepare(fileFetcher).apply(commander);
ApkModule.prepare().apply(commander);

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp()
}

