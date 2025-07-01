import { LESSON5_WORDLIST } from '../client/src/data/lesson5-wordlist.js';
import fetch from 'node-fetch';

async function importViaAPI() {
  try {
    const words = LESSON5_WORDLIST.words.map(word => ({
      chinese: word.chinese,
      pinyin: word.pinyin,
      english: word.english,
      active: true,
      lessonId: parseInt(LESSON5_WORDLIST.id),
      category: LESSON5_WORDLIST.category,
    }));

    const response = await fetch('http://localhost:3000/api/vocabulary/import/actual-vocab', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(words)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Import successful:', result);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importViaAPI();