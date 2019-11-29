import {Command} from "commander";

export default interface Module {

    apply(commander: Command): void;

}
