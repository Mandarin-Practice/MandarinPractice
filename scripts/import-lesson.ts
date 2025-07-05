import { LESSON4_WORDLIST } from '../client/src/data/lesson4-wordlist.ts';
import { LESSON3_WORDLIST } from '../client/src/data/lesson3-wordlist.ts';
import { LESSON2_WORDLIST } from '../client/src/data/lesson2-wordlist.ts';
import { LESSON1_WORDLIST } from '../client/src/data/lesson1-wordlist.ts';
import { LESSON5_WORDLIST } from '../client/src/data/lesson5-wordlist.ts';
import { LESSON6_WORDLIST } from '../client/src/data/lesson6-wordlist.ts';
import { LESSON7_WORDLIST } from '../client/src/data/lesson7-wordlist.ts';
import { LESSON8_WORDLIST } from '../client/src/data/lesson8-wordlist.ts';
import { LESSON9_WORDLIST } from '../client/src/data/lesson9-wordlist.ts';


import fetch from 'node-fetch';

async function importViaAPI() {
  const WORDLISTS = [
    LESSON1_WORDLIST,
    LESSON2_WORDLIST,
    LESSON3_WORDLIST,
    LESSON4_WORDLIST,
    LESSON5_WORDLIST,
    LESSON6_WORDLIST,
    LESSON7_WORDLIST,
    LESSON8_WORDLIST,
    LESSON9_WORDLIST,
  ];
  try {
    for (const wordlist of WORDLISTS) {
      const words = wordlist.words.map(word => ({
        userId: 18,
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        active: true,
        lessonId: parseInt(wordlist.id),
        category: wordlist.category,
      }));

      const response = await fetch('http://localhost:3000/api/vocabulary/import/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(words)
      });

      if (!response.ok) {
        throw new Error(`HTTP error on lesson ${wordlist.id}! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Import successful for ${wordlist.id}:`, result);
    }
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importViaAPI();