#!/usr/bin/env node

import commander from "commander";
import FileFetcher from "./utils/fileFetcher";
import FridaModule from "./modules/frida";
import ApkModule from "./modules/apk";
import MitmModule from "./modules/mitm";
import DeviceModule from "./modules/device";

const fileFetcher = new FileFetcher();

FridaModule.prepare(fileFetcher).apply(commander);
MitmModule.prepare(fileFetcher).apply(commander);
DeviceModule.prepare(fileFetcher).apply(commander);
ApkModule.prepare().apply(commander);

commander
    .version("0.1.0")
    .description("Set of tools for dynamic analysis with Frida")
    .on("command:*", function () {
        console.error("Invalid command: %s\n", commander.args.join(" "));
        commander.outputHelp();
    })
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    commander.outputHelp();
}

