import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import * as fs from 'fs';
import * as readline from 'readline';
import { createInterface } from 'readline/promises';
import { exit, stdin as input, stdout as output } from 'process';

const { db } = await import('../server/db.js');
const { characterDefinitions } = await import('../shared/schema.js');
const { convertNumericPinyinToTonal } = await import('../server/utils/pinyin-converter.js');

const filePath = './scripts/HSK1from2021_cleaned.txt';

interface Definition {
    characters: string,
    pinyin: string,
    definition: string
}

async function processFile() {
    console.log("Print");

    const fileReader = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity // Handles both \r\n and \n line endings
    });
    
    const terminalReader = createInterface({ input, output });
    
    const parsedDefinitions: Definition[] = [];
    const needsChecking: Definition[] = [];
    
    for await (const line of fileReader) {
        // Process each line here
        const splitLine = line.split('\t');
        const pinyins = splitLine[2].split(', ');
        const definitions = splitLine[3].split(';; ');
        const tonedPinyin = pinyins.map((pinyin) => convertNumericPinyinToTonal(pinyin));
        if (pinyins.length !== definitions.length) {
            const newDefinition = { characters: splitLine[0], pinyin: tonedPinyin.join(', '), definition: definitions.join('; ') };
            if (definitions.length == 1) {
                parsedDefinitions.push(newDefinition);
            }
            else {
                needsChecking.push(newDefinition);
            }
        }
        else {
            parsedDefinitions.push({ characters: splitLine[0], pinyin: tonedPinyin[0], definition: definitions[0] });
            for (let i = 1; i < tonedPinyin.length; i++) {
                needsChecking.push({ characters: splitLine[0], pinyin: tonedPinyin[i], definition: definitions[i] });
            }
        }
    };
    for (let i = 0; i < needsChecking.length; i++) {
        const answer = await terminalReader.question("Is this correct, and does it belong in HSK1?(y/n)\n================\nChinese: " + needsChecking[i].characters + "\nPinyin: " + needsChecking[i].pinyin + "\nDefinition: " + needsChecking[i].definition + "\n================\n");
        if (answer.toLowerCase() == "y" || answer.toLowerCase() == "yes") {
            parsedDefinitions.push(needsChecking[i]);
        }
    }
    const response = await db.insert(characterDefinitions).values(parsedDefinitions.map((definition) => ({ ...definition, partOfSpeech: null, example: null }))).returning();
    console.log("Imported " + response.length + " words");
    exit(0);
}

processFile();