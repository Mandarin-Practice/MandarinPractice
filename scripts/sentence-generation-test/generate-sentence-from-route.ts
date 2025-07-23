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
    { id: 1, chinese: "我", pinyin: "wǒ", english: "I/me", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 2, chinese: "是", pinyin: "shì", english: "to be", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 3, chinese: "学生", pinyin: "xuésheng", english: "student", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 4, chinese: "喜欢", pinyin: "xǐhuan", english: "to like", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 5, chinese: "学习", pinyin: "xuéxí", english: "to study", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 6, chinese: "中文", pinyin: "Zhōngwén", english: "Chinese language", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 7, chinese: "很", pinyin: "hěn", english: "very", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 8, chinese: "高兴", pinyin: "gāoxìng", english: "happy", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 9, chinese: "今天", pinyin: "jīntiān", english: "today", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 10, chinese: "天气", pinyin: "tiānqì", english: "weather", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
    { id: 11, chinese: "好", pinyin: "hǎo", english: "good", active: true, userId: 1, correctCount: 5, attemptCount: 5, percentCorrect: 100, lastPracticed: new Date(), category: null },
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
    process.exit()
  }
}

// Execute the test function
runSentenceGenerationTest();
