import express from 'express';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';
import { FullProficiency } from '@shared/schema';
import { pool } from '../../server/db'; // Import the database pool

async function runSentenceGenerationTest() {
  // Mock user ID - in a real scenario, this would come from authentication
  const mockUserId = 1; // Using a number as per storage.ts

  // Mock vocabulary words for testing
  const mockVocabulary: FullProficiency[] = [
    { id: 3135, chinese: "马上", pinyin: "mǎshàng", english: "immediately, right away", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3136, chinese: "放假", pinyin: "fàng jià", english: "go on vacation, have time off", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 2876, chinese: "放", pinyin: "fàng", english: "to let go, to set free", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:00.941Z"), category: null },
    { id: 3138, chinese: "假", pinyin: "jià", english: "vacation, holiday", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3139, chinese: "公司", pinyin: "gōngsī", english: "company", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3140, chinese: "实习", pinyin: "shíxí", english: "to intern", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3141, chinese: "打工", pinyin: "dā gōng", english: "to work at a temporary job (often part time)", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3142, chinese: "计划", pinyin: "jìhuà", english: "plan; to plan", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3143, chinese: "暑假", pinyin: "shūjià", english: "summer vacation", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3145, chinese: "父母", pinyin: "fùmǔ", english: "parents, father and mother", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3146, chinese: "首都", pinyin: "shǒudū", english: "capital city", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3147, chinese: "政治", pinyin: "zhèngzhì", english: "politics", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3148, chinese: "文化", pinyin: "wénhuà", english: "culture", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3149, chinese: "名胜古迹", pinyin: "míngshèng gǔjì", english: "famous scenic spots and historic sites", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3150, chinese: "有名", pinyin: "yǒumíng", english: "famous, well-known", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3151, chinese: "导游", pinyin: "dǎoyóu", english: "tour guide", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3152, chinese: "护照", pinyin: "hùzhào", english: "passport", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3153, chinese: "顶", pinyin: "dìng", english: "to reserve, to book (a ticket, hotel room, etc.)", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3154, chinese: "签证", pinyin: "qiānzhèng", english: "visa", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3155, chinese: "旅行社", pinyin: "lǚxíngshè", english: "travel agency", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3156, chinese: "长成", pinyin: "Chángchéng", english: "the Great Wall", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:11.765Z"), category: null },
    { id: 3063, chinese: "做饭", pinyin: "zuò fàn", english: "to cook, to prepare a meal", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3064, chinese: "报纸", pinyin: "bàozhǐ", english: "newspaper", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3065, chinese: "广告", pinyin: "guǎnggào", english: "advertisement", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3067, chinese: "套", pinyin: "tào", english: "(measure word for suite or set)", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3068, chinese: "公寓", pinyin: "gōngyù", english: "apartment", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3070, chinese: "走路", pinyin: "zǒu lù", english: "to walk", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3071, chinese: "分钟", pinyin: "fēnzhōng", english: "minute", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3072, chinese: "卧室", pinyin: "wòshì", english: "bedroom", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3073, chinese: "厨房", pinyin: "chúfáng", english: "kitchen", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3074, chinese: "卫生间", pinyin: "wèishēngjiān", english: "bathroom", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3075, chinese: "客厅", pinyin: "kètīng", english: "living room", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3076, chinese: "家具", pinyin: "jiājù", english: "furniture", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3077, chinese: "可能", pinyin: "kěnéng", english: "maybe, posible", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3078, chinese: "一房一厅", pinyin: "yì fáng yì tīng", english: "one bedroom and one living room", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3079, chinese: "干净", pinyin: "gānjìng", english: "clean", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3080, chinese: "沙发", pinyin: "shāfā", english: "sofa", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3081, chinese: "饭桌", pinyin: "fànzhuō", english: "dining table", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3082, chinese: "椅子", pinyin: "yǐzi", english: "chair", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3083, chinese: "书桌", pinyin: "shūzhuō", english: "desk", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3084, chinese: "书架", pinyin: "shūjià", english: "bookcase, bookshelf", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3085, chinese: "那里", pinyin: "nàli", english: "there", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3086, chinese: "安静", pinyin: "ānjìng", english: "quiet", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null },
    { id: 3087, chinese: "房租", pinyin: "fángzū", english: "rent", active: true, userId: 18, correctCount: 0, attemptCount: 0, percentCorrect: 0, lastPracticed: new Date("2025-07-21T11:53:08.913Z"), category: null }
  ];


  // Temporarily override storage.getAllVocabularyWithProficiency to return mock data
  const originalGetAllVocabularyWithProficiency = storage.getAllVocabularyWithProficiency;
  storage.getAllVocabularyWithProficiency = async (userId: number) => {
    if (userId === mockUserId) {
      return mockVocabulary;
    }
    return [];
  };

  // Create a mock Express app
  const app = express();
  app.use(express.json()); // Enable JSON body parsing

  // Mock authentication middleware
  app.use((req: any, res, next) => {
    req.authenticatedUserId = mockUserId;
    next();
  });

  // Register routes with the mock app
  const server = await registerRoutes(app);

  try {
    // Simulate a request to the sentence generation endpoint
    const mockReq = {
      body: { difficulty: "beginner" }, // Can be "beginner", "intermediate", or "advanced"
      authenticatedUserId: mockUserId, // Attach mock user ID
    };

    const mockRes = {
      json: (data: any) => {
        if (data.rejectionReason) {
          console.log(`Rejected sentence: "${data.rejectedOriginal}" - Reason: ${data.rejectionReason}`);
        }
        if (data.fromFallback) {
          console.log("USING BUM SENTENCE FALLBACK");
        }
        console.log("\n--- Generated Sentence ---");
        console.log("Chinese:", data.chinese);
        console.log("Pinyin:", data.pinyin);
        console.log("English:", data.english);
        console.log("Difficulty:", data.difficulty);
        console.log("--------------------------\n");
      },
      status: (statusCode: number) => {
        console.error(`API returned status: ${statusCode}`);
        return mockRes; // Allow chaining
      },
    };

    // Find the route handler for /api/sentence/generate POST
    // This is a simplified way to call the handler directly.
    // In a more complex test, you might use a supertest-like library.
    const route = app._router.stack.find((s: any) => s.route && s.route.path === '/api/sentence/generate' && s.route.methods.post);

    if (route && route.route && route.route.stack && route.route.stack.length > 0) {
      // The actual handler is usually the last one in the stack after middleware
      const handler = route.route.stack[route.route.stack.length - 1].handle;
      await handler(mockReq, mockRes);
    } else {
      console.error("Sentence generation route not found.");
    }

  } catch (error) {
    console.error("Error during sentence generation:", error);
  } finally {
    // Restore original function
    storage.getAllVocabularyWithProficiency = originalGetAllVocabularyWithProficiency;
    server.close(() => {
      console.log("Mock server closed.");
      pool.end().then(() => { // Close the database pool
        console.log("Database pool closed.");
      }).catch(err => {
        console.error("Error closing database pool:", err);
      });
    });
    process.exit();
  }
}

// Execute the test function
runSentenceGenerationTest();
