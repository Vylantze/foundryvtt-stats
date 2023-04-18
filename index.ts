const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

const dataURL = "https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/data"; 

const userDBFile = "users.db";
const messageDBFile = "messages.db";

interface User {
    _id: string
    name: string
}

interface Message {
    user: string
    type: number
    flavor: string
    speaker: {
        alias: string
    }
    rolls: string[]
    blind: boolean
    flags?: {
        pf2e?: {
            context?: {
                type?: string
            }
            origin?: {
                type?: string
            }
        }
    }
}

interface Term {
    class: string
    evaluated?: boolean
    number?: number
    faces?: number
    results?: {
        result?: number
        active?: boolean
    }[]
    operator?: string
}

interface Roll {
    class: string
    type: number
    domains: string[]
    formula: string
    options: {
        rollerId: string
        isReroll: boolean
        domains: string[]
        degreeOfSuccess?: number
        flavor?: string
    }
    terms: Term[]
    total?: number
    flags?: {
        pf2e?: {
            context?: {
                type?: string
            }
        }
    }
}

interface Statistics {
    userName: string

    // These are all totals
    messages: number
    checksMade: number // d20 rolled

    attacksMade: number
    spellsCasted: number
    skillChecksMade: number
    savingThrowsMade: number

    dmgDealt: number // non-d20 rolled
    healed: number // non-d20 rolled for heals

    critSuccess: number
    natural20: number
    natural1: number

    rerollsMade: number
}

function init(name: string | undefined): Statistics {
    return {
        userName: name,
        messages: 0,
        checksMade: 0,
        attacksMade: 0,
        dmgDealt: 0,
        healed: 0,
        skillChecksMade: 0,
        savingThrowsMade: 0,
        critSuccess: 0,
        natural20: 0,
        natural1: 0,
        spellsCasted: 0,
        rerollsMade: 0,
    }
}

function addToStatistics(stats: Statistics, msg: Message) {
    stats.messages++;

    const type = msg.flags?.pf2e?.context?.type;
    switch (type) {
    case 'spell-attack-roll':
    case 'attack-roll':
        stats.attacksMade++;
        break;
    case 'skill-check':
        stats.skillChecksMade++;
        break;
    case 'spell-cast':
        stats.spellsCasted++;
        break;
    case 'saving-throw':
        stats.savingThrowsMade++;
        break;
    case 'initiative':
    case 'perception-check':
    case 'damage-roll':
    case undefined:
        break;
    default:
        console.log(`${msg.type} ${type}`);
        break;
    }
    
    const origin = msg.flags?.pf2e?.origin?.type;
    if (origin !== undefined) {
    }

    if (msg.rolls && msg.rolls.length > 0) {
        let rolls: Roll[] = msg.rolls.map(roll => JSON.parse(roll));
        rolls.forEach(roll => {

            let isReroll = false;
            let isCritSuccess = false;
            let isNatural20 = false;
            let isNatural1 = false;
            stats.checksMade++;

            if (roll.class === 'CheckRoll') {
                if (roll.options.isReroll) isReroll = true;
                if (roll.options.degreeOfSuccess === 3) isCritSuccess = true;
                
                if (roll.terms && roll.terms.length > 0) {
                    roll.terms.forEach(term => {
                        if (term.class !== 'Die') return;
                        if (term.faces === 20) {
                            const result = term.results && term.results.length > 0 ? term.results[0] : null;
                            if (!result) return;
                            if (result.result === 20) isNatural20 = true;
                            if (result.result === 1) isNatural1 = true;
                        }
                    });
                }
            }
            if (roll.class === 'DamageRoll') {
                if (roll.terms && roll.terms.length > 0) {
                    roll.terms.forEach(term => {
                        if (term.class !== 'Die') return;
                        if (term.faces === 20) {
                            const result = term.results && term.results.length > 0 ? term.results[0] : null;
                            if (!result) return;
                            if (result.result === 20) isNatural20 = true;
                            if (result.result === 1) isNatural1 = true;
                        }
                    });
                }
                if (roll.formula.includes("[healing]")) {
                    stats.healed += roll.total;
                }
                if (type === 'damage-roll') {
                    stats.dmgDealt += roll.total;
                }
            }
            if (isReroll) stats.rerollsMade++;
            if (isCritSuccess) stats.critSuccess++;
            if (isNatural20) stats.natural20++;
            if (isNatural1) stats.natural1++;
        });
    }
}

function processFiles() {
    // Users
    const userStr: string = fs.readFileSync(userDBFile).toString();
    const users: Record<string, User> = {};
    const userStatistics: Record<string, Statistics> = {};
    userStr.split('\n').forEach(line => {
        if (!line) return;
        const user: User = JSON.parse(line);
        users[user._id] = user;
        userStatistics[user._id] = init(user.name);
    });

    const overall: Statistics = init("overall");
    userStatistics['overall'] = overall;

    const msgStr: string = fs.readFileSync(messageDBFile).toString();
    const messages: Message[] = [];
    msgStr.split('\n').forEach(line => {
        if (!line) return;
        const msg: Message = JSON.parse(line);
        messages.push(msg);
        
        addToStatistics(overall, msg);
        const stats = userStatistics[msg.user];
        if (!stats) {
            console.log('Unidentified user: ', msg.user);
            return;
        }
        addToStatistics(stats, msg);
    });

    const statsList = Object.values(userStatistics).filter(
        stat => stat.messages > 0
    );

    console.log(`
    Total Messages: ${messages.length}
    Statistics: `, statsList);

    fs.writeFileSync('stats.json', JSON.stringify(statsList));
}

// Download file
async function downloadFiles() {
    const array = [userDBFile, messageDBFile];
    return await Promise.all(array.map(async (fileName) => {
        return new Promise((resolve) => {
            const file = fs.createWriteStream(fileName);
            const url = `${dataURL}/${fileName}`;
            console.log('Downloading from ', url);
            https.get(url, function(response) {
                response.pipe(file);

                // after download completed close filestream
                file.on("finish", () => {
                    file.close();
                    console.log("Download Completed");
                    resolve("Done");
                });
            });
        })
    }));
}

// Run
(async function () {
    await downloadFiles();
    processFiles();
})()