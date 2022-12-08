import fs from "fs";

export type Vote = {
    timestamp: number;
    projectRef: string;
    voter: string;
    amount: string;
    token: string;
}

type Project = {
    id: string;
    votes: Vote[];
    match: number;
    donated: number;
}

export class Round {
    matchingPool: number;
    token: string;
    projects: Project[];

    constructor(matchingPool: number, token: string, projectCount: number) {
        this.matchingPool = matchingPool;
        this.token = token;
        this.projects = [];

        for(let i = 0; i <= (projectCount); i++) {
            this.projects.push({id: i.toString(), votes: [], match: 0, donated: 0});
        }
    }

    vote(votes: Vote[]): boolean {
        console.log("Voting...");
        console.log("Round State");
        console.log("Matching Pool: " + this.matchingPool + " " +this.token);
        console.table(this.projects);
        console.log("Votes");
        console.table(votes);
        // group votes by project
        const votesByProject = votes.reduce((acc: any, vote: Vote) => {
            if (!acc[vote.projectRef]) {
                acc[vote.projectRef] = [];
            }
            acc[vote.projectRef].push(vote);
            return acc;
        }, {});
        // save the votes to round state
        this.projects.forEach((project: Project) => {
            if (votesByProject[project.id]) {
                project.votes = votesByProject[project.id];
            }
        });

        // calculate the total amount of votes per project
        const totalVotesByProject = Object.keys(votesByProject).reduce((acc: any, projectId: string) => {
            let exchangeRate: number;
            acc[projectId] = votesByProject[projectId].reduce((acc: number, vote: Vote) => {
                exchangeRate = getExchangeRate(vote.token, vote.timestamp);
                return acc + (Number(vote.amount) * exchangeRate);
            }, 0);
            // save to the total donated
            this.projects.forEach((project: Project) => {
                if (project.id === projectId) {
                    project.donated = acc[projectId];
                }
            });
            return acc;
        }, {});


        let totalCaclulatedMatch = 0;
        // calculate the linear quadratic funding for each project
        Object.keys(totalVotesByProject).forEach((projectId: string) => {
            let sumOfSqrtVotes = 0;
            let sumOfVotes = 0;
            votesByProject[projectId].forEach((vote: Vote) => {
                const exchangeRate = getExchangeRate(vote.token, vote.timestamp);
                sumOfSqrtVotes += Math.sqrt(Number(vote.amount) * exchangeRate);
                sumOfVotes += Number(vote.amount) * exchangeRate;
            });
            const match = Math.pow(sumOfSqrtVotes, 2);
            totalCaclulatedMatch += match;
            // @ts-ignore
            this.projects.find((project: any) => project.id === projectId).match = match;
        });

        // calculate the total match percentage of each project
        this.projects.forEach((project: any) => {
            const matchPercentage = project.match / totalCaclulatedMatch;
            project.match = matchPercentage * this.matchingPool;
        });
        console.log("Round State (Post Vote)");
        console.log("Matching Pool: " + this.matchingPool + " " +this.token);
        console.table(this.projects);
        console.log("Voting Complete");
        return true;
    }

}

function getExchangeRate(token: string, timestamp: number): number {
    // Exchange rate relative to the round token
    const exchangeRates = {
        "ftm": {
            0: 23,
            1: 27,
            2: 10,
            3: 35,
        },
        "dai": {
            0: 1,
            1: 1,
            2: 1,
            3: 1,
        },
        "eth": {
            0: 1200,
            1: 1300,
            2: 1100,
            3: 800,
        }
    }
    // @ts-ignore
    return exchangeRates[token][timestamp];
}
