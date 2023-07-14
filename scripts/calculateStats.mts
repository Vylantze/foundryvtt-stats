import https from 'https'; // or 'https' for https:// URLs
import fs from 'fs';
import path from 'path';
import { IncomingMessage } from 'http';

import { fileURLToPath } from 'url';
import User from '@/scripts/models/User';
import Statistics from '@/scripts/models/Statistics'
import { Message, Messages, Roll } from '@/scripts/models/Raw';
import CompiledStats from '@/scripts/models/CompiledStats';
import Session from '@/scripts/models/Session';

const firstSessionDate = new Date("2023-03-19");
const specialSessionDates: Date[] = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataURL = "https://vylantze-foundry-bucket.s3.ap-southeast-1.amazonaws.com/data"; 

const dataLocation = "../data/";
const userDBFile = "users.db";
const messageSubFolder = "messages/";
const messageDBFile = "messages.db";

const DATA_PATH = path.resolve(__dirname, dataLocation);

const empty = function (): Statistics {
  return {
    user: {
      _id: '',
      name: '',
    },
    messages: 0,
    totalChecksMade: 0,
    attacksMade: 0,

    dmgDealt: 0,
    healDealt: 0,
    dmgTaken: 0,
    dmgHealed: 0,
    positiveDealt: 0,
    negativeDealt: 0,
    
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
    spellTypes: {},
    spellLevels: {},

    rerollsMade: 0,
  }
}

function init(user: User): Statistics {
  const stats = empty();
  stats.user = user;
  return stats;
}

function getAllSessionDates(): Date[] {
  const dates: Date[] = [];
  let todayDate = new Date();
  let trackingDate = new Date(firstSessionDate.toISOString());
  do {
    dates.push(new Date(trackingDate.toDateString()));
    trackingDate.setDate(trackingDate.getDate() + 7);
  } while (trackingDate <= todayDate);
  
  return dates.concat(specialSessionDates).sort((date1, date2) => {
    return date1 < date2 ? 1 : -1;
  });
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
function decrementMap(map: Record<string, number>, key: string | undefined) {
  if (key === undefined) key = 'free';
  if (!map[key]) map[key] = 0;
  map[key]--;
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
  case 'saving-throw':
    break;
  case 'skill-check':
  case 'initiative':
  case 'perception-check':
  case 'damage-roll':
  case 'flat-check':
  case 'spell-cast':
  case 'counteract-check':
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

  
  const casting = msg.flags?.pf2e?.casting;
  if (casting !== undefined) {
    stats.spellsCasted++;

    const msgFlavor = msg.flavor ?? ''
    const msgContent = msg.content ?? ''
    const domains = msg.flags?.pf2e?.context?.domains

    // SpellTypes
    if (msgContent.includes('{Lay on Hands (Vs. Undead)}' )) {
      incrementMap(stats.spellTypes, 'dc');
    } else if (msgContent.includes('Healing')) {
      incrementMap(stats.spellTypes, 'healing');
    } else if (domains?.includes('spell-dc')) {
      incrementMap(stats.spellTypes, 'dc');
    } else if (msgContent.includes('spell-attack-button')) {
      incrementMap(stats.spellTypes, 'attack');
    } else {
      incrementMap(stats.spellTypes, 'support');
    }

    // Spell level
    if (msgContent.includes('Cantrip')) {
      incrementMap(stats.spellLevels, 'cantrip');
    } else if (msgContent.includes('Focus')) {
      incrementMap(stats.spellLevels, 'focus');
    } else if (msgContent.includes('Ritual')) {
      incrementMap(stats.spellLevels, 'ritual');
    } else {
      const spellLevel = casting.level ?? -1;
      incrementMap(stats.spellLevels, spellLevel.toString());
    }
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
                incrementMap(stats.natural20, type);
                
                if (roll.options.degreeOfSuccess !== 3)
                  incrementMap(stats.critSuccess, type);
              }
              if (result.result === 1) {
                stats.natural.min++;
                incrementMap(stats.natural1, type);

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
        const rollTrait = roll.options.damage?.traits;
        const isAttackTrait =  rollTrait !== undefined && rollTrait.length > 0 && rollTrait[0] === 'attack';
        roll.terms.map(term => {
          term.rolls?.map(rollTerm => {
            if (!rollTerm.evaluated) return;
            if (rollTerm.formula.includes("[healing]")) {
              stats.healDealt += rollTerm.total ?? 0;
            } else if (rollTerm.formula.includes("[positive]") && !isAttackTrait) {
                stats.positiveDealt += rollTerm.total ?? 0;
            } else if (rollTerm.formula.includes("[negative]") && !isAttackTrait) {
                stats.negativeDealt += rollTerm.total ?? 0;
            } else if (type === 'damage-roll') {
              stats.dmgDealt += rollTerm.total ?? 0;
            }
          })
        })
        break;
      default:
        console.log('Unknown roll', roll.class);
        break;
    }
  });
}

function convertToListAndSort(stats: Record<string, Statistics>): Statistics[] {
  if (stats === undefined || stats === null) return [];
  return Object.values(stats)
    .filter(stat => stat.messages > 0)
    .sort((a: Statistics, b: Statistics) => {
      if (a.user.name === 'Gamemaster') return 1;
      if (b.user.name === 'Gamemaster') return -1;
      return a.user.name > b.user.name ? 1 : -1
    });
}

function getUsers(): Record<string, User> {
  const userDBFilePath = path.resolve(DATA_PATH, userDBFile);

  // Users
  const userStr: string = fs.readFileSync(userDBFilePath).toString();
  const users: Record<string, User> = {};
  userStr.split('\n').forEach(line => {
      if (!line) return;
      const user: User = JSON.parse(line);
      users[user._id] = user;
  });

  return users;
}

function getMessages(): Messages {
  const messageFolderPath = path.resolve(DATA_PATH, messageSubFolder);

  const messages: Message[] = [];
  let lastUpdated: Date | undefined = undefined;

  fs.readdirSync(messageFolderPath).forEach(file => {
    const filepath = path.resolve(messageFolderPath, file);
    if (!fs.existsSync(filepath)) return;
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) return;
    
    const msgStr: string = fs.readFileSync(filepath).toString();
    if (path.extname(filepath) === '.json') {
      const jsonData: Record<string, string> = JSON.parse(msgStr);
      Object.values(jsonData).forEach(value => {
        messages.push(JSON.parse(value));
      });
      return;
    }
    msgStr.split('\n').forEach(line => {
        if (!line) return;
        const dataLineFirst = line.substring(line.search('{'));
        const dataLineSplit = dataLineFirst.split('}');
        dataLineSplit.pop();
        const dataLine = dataLineSplit.join('}') + '}';
        try {
          const msg: Message = JSON.parse(dataLine);
          messages.push(msg);

          const msgDate = new Date(msg.timestamp);
          if (!lastUpdated || msgDate > lastUpdated) {
            lastUpdated = msgDate;
          }
        } catch (e) {
          console.error('Error with dataLine', dataLine);
          throw e;
        }
    });
  });

  const compiled: Messages = {
    messages, lastUpdated
  }
  return compiled;
}

function processFiles(messageObj: Messages, users: Record<string, User> = {}) {
  const dates = getAllSessionDates();

  // User statistics
  const userStatistics: Record<string, Statistics> = {};
  const sessionStats: Record<string, Record<string, Statistics>> = {};

  dates.forEach(date => {
    const id = date.toLocaleDateString();
    sessionStats[id] = {}
  })

  for (const key in users) {
    const user = users[key];
    const basicUser = {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
    };
    userStatistics[user._id] = init(basicUser);
    dates.forEach(date => {
      const id = date.toLocaleDateString();
      sessionStats[id][user._id] = init(basicUser);
    })
  }

  const overall: Statistics = init({
      _id: 'overall',
      name: 'overall'
  });

  const messages = messageObj.messages;
  const lastUpdated = messageObj.lastUpdated;

  messages.forEach((msg: Message) => {
    const msgDate = new Date(msg.timestamp);
    
    addToStatistics(overall, msg);
    addToStatistics(userStatistics[msg.user], msg);

    dates.forEach((date: Date) => {
      if (msgDate.toLocaleDateString() !== date.toLocaleDateString()) return;
      
      const id = date.toLocaleDateString();
      addToStatistics(sessionStats[id][msg.user], msg);
    })
  });

  const statsList = convertToListAndSort(userStatistics)

  const sessionsList = dates.map(date => {
    const id = date.toISOString();
    const session: Session = {
      id, date,
      data: convertToListAndSort(sessionStats[date.toLocaleDateString()])
    }
    return session;
  }).filter(session => session.data.length > 0);

  const data: CompiledStats = {
    total: overall,
    overall: statsList,
    lastUpdated,
    sessions: sessionsList
  }
  console.log('Stats', data);

  fs.writeFileSync(path.resolve(DATA_PATH, "stats.json"), JSON.stringify(data));
  Object.values(users).forEach(user => {
    if (user.name !== 'Arc') return;
    fs.writeFileSync(path.resolve(DATA_PATH, `msg_${user.name}.db`), JSON.stringify(messages
      .filter(msg => msg.user === user._id)
      .sort((msg1, msg2) => msg1.timestamp > msg2.timestamp ? 1 : -1))
    );
  });
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

  const messageOBj = getMessages();
  const users = getUsers();
  processFiles(messageOBj, users);
})()