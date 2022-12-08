#! /usr/bin/env node
import { Round, Vote } from "./round";

const { Command } = require("commander");
const fs = require("fs");
const program = new Command();
program
    .name('QF-spec-tool')
    .description("Quadartic Funding Spec CLI Test Tool")
    .version('0.0.1');

program
    .description("Gitcoin Quadratic Funding CLI tool.")
    .option("-r, --round", "New Round")
    .option("-d, --match-pool <value>", "Round pool amount")
    .option("-t, --token <value>", "Round token")
    .option("-p, --project-count <value>", "Round projects to generate")
    .option("-v, --vote <value>", "Vote with a file")

program.parse(process.argv);
const options = program.opts();

if (options.round) {
    createRound();
}

if (options.vote) {
    vote(options.vote);
}

async function createRound() {
    try {
        let data = new Round(options.matchPool ?? 100, options.token ?? "eth", options.projectCount ?? 3);
        console.log("Round State: Initialized");
        console.log("Matching Pool: " + data.matchingPool + " " + data.token);
        console.table(data.projects);
        if (options.token) {
            data.token = options.token;
        }
        if (options.pool) {
            data.matchingPool = Number(options.pool);
        }
        fs.writeFile('data.json', JSON.stringify(data), 'utf8', function (err: any) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log("JSON file has been saved.");
        } );

    } catch (error) {
        console.error("Error occurred while reading the directory!", error);
    }
}

async function vote(voteFile: string) {
    try {
        const votes: Vote[] = JSON.parse(fs.readFileSync(voteFile, "utf8"));
        const roundState = JSON.parse(fs.readFileSync("data.json", "utf8"));
        // create a new round, vote, and overwrite the file
        const round = new Round(roundState.matchingPool, roundState.token, roundState.projects.length);
        round.vote(votes);
        fs.writeFile('data.json', JSON.stringify(round), 'utf8', function (err: any) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log("JSON file has been saved.");
        });
    } catch (error) {
        console.error("Error occurred while reading the directory!", error);
    }
}
