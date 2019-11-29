import winston from "winston";

const transports = [];
if (process.env.NODE_ENV !== "development") {
    transports.push(
        new winston.transports.Console()
    );
} else {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.cli(),
                winston.format.splat(),
            )
        })
    );
}

const Logger = winston.createLogger({
    level: "debug",
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.errors({stack: true}),
        winston.format.colorize({all: true}),
        winston.format.splat(),
        winston.format.simple()
    ),
    transports
});

export default Logger;
