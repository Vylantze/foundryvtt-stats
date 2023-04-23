import https from 'https'; // or 'https' for https:// URLs
import fs from 'fs';
import path from 'path';
import { IncomingMessage } from 'http';
import Statistics from '@/scripts/models/Statistics'
import CompiledStats from '@/scripts/models/CompiledStats';

import { fileURLToPath } from 'url';
import User from '@/scripts/models/User';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataURL = "https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/data"; 

const dataLocation = "../data/";
const userDBFile = "users.db";
const messageDBFile = "messages.db";

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

function init(user: User): Statistics {
  return {
    user,
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
    noResult: {},
    natural20: {},
    natural1: {},

    natural: {
      max: 0,
      min: 0,
      sum: 0,
      count: 0
    },
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
        let hasD20 = false;
        if (roll.terms && roll.terms.length > 0) {
          roll.terms.forEach(term => {
            if (term.class !== 'Die') return;
            if (term.faces === 20) {
              const result = term.results && term.results.length > 0 ? term.results[0] : null;
              if (!result || !result.result) { return; }
              hasD20 = true;
              stats.natural.count++;
              stats.natural.sum += result.result;
              if (result.result === 20) {
                stats.natural.max++;
                
                if (roll.options.degreeOfSuccess !== 3)
                  incrementMap(stats.critSuccess, type);
              }
              if (result.result === 1) {
                stats.natural.min++;
                if (roll.options.degreeOfSuccess !== 0)
                  incrementMap(stats.critFailure, type);
              }
            }
          });
        }
        if (!hasD20) {
          break;
        }

        stats.totalChecksMade++;
        incrementMap(stats.checks, type);

        if (roll.options.isReroll) stats.rerollsMade++;

        switch(roll.options.degreeOfSuccess) {
          case 0: incrementMap(stats.critFailure, type); break;
          case 1: incrementMap(stats.failure, type); break;
          case 2: incrementMap(stats.success, type); break;
          case 3: incrementMap(stats.critSuccess, type); break;
          default: incrementMap(stats.noResult, type); break;
        }
        break;
      case 'DamageRoll':
        if (roll.formula.includes("[healing]")) {
          stats.healDealt += roll.total ?? 0;
        } else if (type === 'damage-roll') {
          stats.dmgDealt += roll.total ?? 0;
        }
        break;
      default:
        console.log('Unknown roll', roll.class);
        break;
    }
  });
}

function processFiles() {
  const dataPath = path.resolve(__dirname, dataLocation);
  const userDBFilePath = path.resolve(dataPath, userDBFile);
  const messageDBFilePath = path.resolve(dataPath, messageDBFile);

  // Users
  const userStr: string = fs.readFileSync(userDBFilePath).toString();
  const users: Record<string, User> = {};
  const userStatistics: Record<string, Statistics> = {};
  const lastSessionStats: Record<string, Statistics> = {};
  userStr.split('\n').forEach(line => {
      if (!line) return;
      const user: User = JSON.parse(line);
      users[user._id] = user;
      const basicUser = {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      };
  userStatistics[user._id] = init(basicUser);
      lastSessionStats[user._id] = init(basicUser);
  });

  const overall: Statistics = init({
      _id: 'overall',
      name: 'overall'
  });
  const lastSessionDate = new Date("2023-04-23");

  const msgStr: string = fs.readFileSync(messageDBFilePath).toString();
  const messages: Message[] = [];
  let lastUpdated: Date | undefined = undefined;
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
      .sort((a: Statistics, b: Statistics) => {
        if (a.user.name === 'Gamemaster') return 1;
        if (b.user.name === 'Gamemaster') return -1;
        return a.user.name > b.user.name ? 1 : -1
      });

  const lastSessionList = Object.values(lastSessionStats)
      .filter(stat => stat.messages > 0)
      .sort((a: Statistics, b: Statistics) => {
        if (a.user.name === 'Gamemaster') return 1;
        if (b.user.name === 'Gamemaster') return -1;
        return a.user.name > b.user.name ? 1 : -1
      });

  const data: CompiledStats = {
    total: overall,
    overall: statsList,
    lastUpdated,
    lastSession: lastSessionList,
    lastSessionDate
  }
  console.log('Stats', data);

  fs.writeFileSync(path.resolve(dataPath, "stats.json"), JSON.stringify(data));
  // Object.values(users).forEach(user => {
  //     fs.writeFileSync(path.resolve(dataPath, `msg_${user.name}.db`), JSON.stringify(messages.filter(msg => msg.user === user._id)));
  // })
  
  fs.writeFileSync(path.resolve(dataPath, `msg_last_session.db`), JSON.stringify(
    messages.filter(msg => {
      return new Date(msg.timestamp).toDateString() === lastSessionDate.toDateString();
      // const isLastSessionDate = new Date(msg.timestamp).toDateString() === lastSessionDate.toDateString();
      // if (!isLastSessionDate) return false;
      // const type = msg.flags?.pf2e?.context?.type;
      // return type === 'spell-cast';
    })
  ));
}

// Download file
async function downloadFiles() {
  const array = [userDBFile, messageDBFile];
  return await Promise.all(array.map(async (fileName) => {
    return new Promise((resolve) => {
      const file = fs.createWriteStream(fileName);
      const url = `${dataURL}/${fileName}`;
      console.log('Downloading from ', url);
      https.get(url, function(response: IncomingMessage) {
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