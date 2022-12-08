# Quadratic Funding CLI Tool

This is a command line interface (CLI) tool for managing a quadratic funding round. It allows users to create a new round and submit votes for projects in the round. The tool uses the `Round` class from `round.ts` to manage the round state and process votes.

## Usage

Build the tool with `npm build`. 

To use the tool, the user must first create a new round by running the command `QF-spec-tool -r` with optional arguments for `--match-pool`, `--token`, and `--project-count` to specify the matching pool amount, round token, and number of projects in the round, respectively. This will create a `data.json` file containing the round state.

An example of creating a new round with a matching pool of 1000 DAI, a round token of DAI, and 5 projects in the round:

```bash
node dist/index.js -r --match-pool 1000 --token dai --project-count 5
```

To submit votes for a project, the user must create a JSON file containing an array of `Vote` objects, each representing a single vote. The user can then run the command `QF-spec-tool -v <vote_file.json>` to submit the votes and update the round state in `data.json`.

An example vote data json, named `vote.json` file is shown below:

```json
[
  
    {
      "timestamp": 0,
      "projectRef": "0",
      "voter": "alice",
      "amount": "42",
      "token": "dai"
    },
    {
      "timestamp": 0,
      "projectRef": "1",
      "voter": "alice",
      "amount": "666",
      "token": "dai"
    },
    {
      "timestamp": 0,
      "projectRef": "0",
      "voter": "bob",
      "amount": "123",
      "token": "dai"
    },
    {
      "timestamp": 0,
      "projectRef": "2",
      "voter": "bob",
      "amount": "38",
      "token": "dai"
    },
    {
      "timestamp": 0,
      "projectRef": "2",
      "voter": "charlie",
      "amount": "22",
      "token": "dai"
    },
    {
      "timestamp": 0,
      "projectRef": "2",
      "voter": "hans",
      "amount": "0.23",
      "token": "eth"
    }
]
```

To vote with a file like the one shown above:

```bash
node dist/index.js -v vote.json
```

## Class Definitions

The `Round` class contains the following properties:
- `matchingPool`: a number representing the total amount of funds available for matching.
- `token`: a string representing the token used in the round.
- `projects`: an array of `Project` objects, each containing information about a specific project.

The `Project` type is an object containing the following properties:
- `id`: a string representing the unique identifier of the project.
- `votes`: an array of `Vote` objects, each containing information about a specific vote for the project.
- `match`: a number representing the total match percentage of the project.
- `donated`: a number representing the total amount of funds donated to the project.

The `Vote` type is an object containing the following properties:
- `timestamp`: a number representing the timestamp of the vote.
- `projectRef`: a string representing the unique identifier of the project being voted for.
- `voter`: a string representing the address of the voter.
- `amount`: a string representing the amount of funds being voted.
- `token`: a string representing the token of the funds being voted.

The `Round` class also contains a `vote` function that takes in an array of `votes` and processes them to determine the total amount of votes per project, the total match percentage of each project, and saves the votes to the round state. It does this by grouping the votes by project, calculating the total amount of votes per project, and then calculating the linear quadratic funding for each project. It then saves the calculated values to the `match` property of each `Project` object in the `projects` array.
