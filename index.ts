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
    content?: string
    rolls: string[]
    blind: boolean
    timestamp: number
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

    natural20: number
    natural1: number

    checks: Record<string, number>
    critSuccess: Record<string, number>
    success: Record<string, number>
    failure: Record<string, number>
    critFailure: Record<string, number>
    

    // These are all totals
    messages: number
    totalChecksMade: number // d20 rolled

    attacksMade: number
    spellsCasted: number

    dmgDealt: number // non-d20 rolled
    healDealt: number // non-d20 rolled for heals
    dmgTaken: number
    dmgHealed: number

    rerollsMade: number
}

interface Compiled {
    total: Statistics
    overall: Statistics[]
    lastSession: Statistics[]
    lastUpdated: Date
}

function init(name: string | undefined): Statistics {
    return {
        userName: name,
        messages: 0,
        totalChecksMade: 0,
        attacksMade: 0,

        dmgDealt: 0,
        healDealt: 0,
        dmgTaken: 0,
        dmgHealed: 0,
        
        checks: {},
        critSuccess: {},
        success: {},
        failure: {},
        critFailure: {},

        natural20: 0,
        natural1: 0,
        spellsCasted: 0,
        rerollsMade: 0,
    }
}

function parseContent(stats: Statistics, content: string) {
    // Damage taken
    const dmgTakenRegex = /takes\s(\d+)\sdamage/;
    const dmgTakenArray = content.match(dmgTakenRegex);
    if (dmgTakenArray !== null && dmgTakenArray.length > 1) {
        try {
            stats.dmgTaken += Number(dmgTakenArray[1]);
        } catch (e: unknown) {
            console.log('[parseContent][dmgTaken]  Error: ', e);
        }
    }
    
    // Damage healed
    const dmgHealedRegex = /healed\sfor\s(\d+)\sdamage/;
    const dmgHealedArray = content.match(dmgHealedRegex);
    if (dmgHealedArray !== null && dmgHealedArray.length > 1) {
        try {
            stats.dmgHealed += Number(dmgHealedArray[1]);
        } catch (e: unknown) {
            console.log('[parseContent][dmgHealed] Error: ', e);
        }
    }
}

function incrementMap(map: Record<string, number>, key: string | undefined) {
    if (key === undefined) key = 'free';
    if (!map[key]) map[key] = 0;
    map[key]++;
}

function addToStatistics(stats: Statistics, msg: Message) {
    if (!stats || !msg) return;
    stats.messages++;

    const type = msg.flags?.pf2e?.context?.type;
    switch (type) {
    case 'spell-attack-roll':
    case 'attack-roll':
        stats.attacksMade++;
        break;
    case 'skill-check':
        break;
    case 'spell-cast':
        stats.spellsCasted++;
        break;
    case 'saving-throw':
        break;
    case 'initiative':
    case 'perception-check':
    case 'damage-roll':
    case 'flat-check':
        break;
    case undefined:
        // Parse for heal and dmg
        if (msg.flags?.pf2e && msg.content)
            parseContent(stats, msg.content.toString());
        break;
    default:
        console.log(`${msg.type} ${type}`);
        break;
    }
    
    const origin = msg.flags?.pf2e?.origin?.type;
    if (origin !== undefined) {
    }

    if (msg.rolls === undefined || msg.rolls.length === 0) return;

    let rolls: Roll[] = msg.rolls.map(roll => JSON.parse(roll));
    rolls.forEach(roll => {
        switch (roll.class) {
            case 'CheckRoll':
            case 'Roll':
            case 'StrikeAttackRoll':
                stats.totalChecksMade++;
                incrementMap(stats.checks, type);
    
                if (roll.options.isReroll) stats.rerollsMade++;
    
                switch(roll.options.degreeOfSuccess) {
                    case 0: incrementMap(stats.critFailure, type); break;
                    case 1: incrementMap(stats.failure, type); break;
                    case 2: incrementMap(stats.success, type); break;
                    case 3: incrementMap(stats.critSuccess, type); break;
                    default: break;
                }
                
                if (roll.terms && roll.terms.length > 0) {
                    roll.terms.forEach(term => {
                        if (term.class !== 'Die') return;
                        if (term.faces === 20) {
                            const result = term.results && term.results.length > 0 ? term.results[0] : null;
                            if (!result) return;
                            if (result.result === 20) {
                                stats.natural20++;
                                if (roll.options.degreeOfSuccess !== 3)
                                    incrementMap(stats.critSuccess, type);
                            }
                            if (result.result === 1) {
                                stats.natural1++;
                                if (roll.options.degreeOfSuccess !== 0)
                                    incrementMap(stats.critFailure, type);
                            }
                        }
                    });
                }
                break;
            case 'DamageRoll':
                if (roll.formula.includes("[healing]")) {
                    stats.healDealt += roll.total;
                } else if (type === 'damage-roll') {
                    stats.dmgDealt += roll.total;
                }
                break;
            default:
                console.log('Unknown roll', roll.class);
                break;
        }
    });
}

function processFiles() {
    // Users
    const userStr: string = fs.readFileSync(userDBFile).toString();
    const users: Record<string, User> = {};
    const userStatistics: Record<string, Statistics> = {};
    const lastSessionStats: Record<string, Statistics> = {};
    userStr.split('\n').forEach(line => {
        if (!line) return;
        const user: User = JSON.parse(line);
        users[user._id] = user;
        userStatistics[user._id] = init(user.name);
        lastSessionStats[user._id] = init(user.name);
    });

    const overall: Statistics = init("overall");
    const lastSessionDate = new Date("2023-04-16");

    const msgStr: string = fs.readFileSync(messageDBFile).toString();
    const messages: Message[] = [];
    let lastUpdated: Date;
    msgStr.split('\n').forEach(line => {
        if (!line) return;
        const msg: Message = JSON.parse(line);
        messages.push(msg);

        const msgDate = new Date(msg.timestamp);
        if (!lastUpdated || msgDate > lastUpdated) {
            lastUpdated = msgDate;
        }
        
        addToStatistics(overall, msg);
        addToStatistics(userStatistics[msg.user], msg);

        if (msgDate.toDateString() === lastSessionDate.toDateString())
            addToStatistics(lastSessionStats[msg.user], msg);
    });

    const statsList = Object.values(userStatistics)
        .filter(stat => stat.messages > 0)
        .sort((a: Statistics, b: Statistics) => a.userName > b.userName ? 1 : -1);

    const lastSessionList = Object.values(lastSessionStats)
        .filter(stat => stat.messages > 0)
        .sort((a: Statistics, b: Statistics) => a.userName > b.userName ? 1 : -1);


    const data: Compiled = {
        total: overall,
        overall: statsList,
        lastUpdated,
        lastSession: lastSessionList
    }
    console.log('Stats', data);

    fs.writeFileSync('stats.json', JSON.stringify(data));
    Object.values(users).forEach(user => {
        fs.writeFileSync(`msg_${user.name}.db`, JSON.stringify(messages.filter(msg => msg.user === user._id)));
    })
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
    //await downloadFiles(); // No need to download
    processFiles();
})()