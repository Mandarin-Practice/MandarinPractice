  app.post("/api/sentence/generate", async (req, res) => {
    try {
      const { difficulty = "beginner" } = req.body;
      
      // Get all vocabulary words
      const allVocabulary = await storage.getAllVocabulary();
      
      // Filter for only active words
      const activeVocabulary = allVocabulary.filter(word => word.active === "true");
      
      if (activeVocabulary.length === 0) {
        return res.status(400).json({ message: "No active vocabulary words available. Please add or activate some words first." });
      }
      
      // Safe pre-vetted beginner sentences
      const safeBeginnerSentences = [
        { chinese: "我很好。", pinyin: "Wǒ hěn hǎo.", english: "I am very well." },
        { chinese: "你好吗？", pinyin: "Nǐ hǎo ma?", english: "How are you?" },
        { chinese: "请喝水。", pinyin: "Qǐng hē shuǐ.", english: "Please drink water." },
        { chinese: "谢谢你。", pinyin: "Xièxiè nǐ.", english: "Thank you." },
        { chinese: "我喜欢。", pinyin: "Wǒ xǐhuān.", english: "I like it." },
        { chinese: "你吃了吗？", pinyin: "Nǐ chī le ma?", english: "Have you eaten?" },
        { chinese: "我不知道。", pinyin: "Wǒ bù zhīdào.", english: "I don't know." },
        { chinese: "再见。", pinyin: "Zàijiàn.", english: "Goodbye." }
      ];
      
      // Create fallback sentences for other difficulty levels
      const fallbackSentences = {
        intermediate: [
          { chinese: "这本书很有意思。", pinyin: "Zhè běn shū hěn yǒuyìsi.", english: "This book is very interesting." },
          { chinese: "中国菜很好吃。", pinyin: "Zhōngguó cài hěn hǎochī.", english: "Chinese food is delicious." },
          { chinese: "你能帮我吗？", pinyin: "Nǐ néng bāng wǒ ma?", english: "Can you help me?" },
          { chinese: "我在学校。", pinyin: "Wǒ zài xuéxiào.", english: "I am at school." },
          { chinese: "我们明天见。", pinyin: "Wǒmen míngtiān jiàn.", english: "See you tomorrow." },
          { chinese: "我认为很好。", pinyin: "Wǒ rènwéi hěn hǎo.", english: "I think it's very good." }
        ],
        advanced: [
          { chinese: "我认为学习语言很重要。", pinyin: "Wǒ rènwéi xuéxí yǔyán hěn zhòngyào.", english: "I think learning languages is important." },
          { chinese: "虽然很难，但是很有用。", pinyin: "Suīrán hěn nán, dànshì hěn yǒuyòng.", english: "Although it's difficult, it's very useful." },
          { chinese: "今天我们学了新的单词。", pinyin: "Jīntiān wǒmen xué le xīn de dāncí.", english: "Today we learned new words." },
          { chinese: "下次我会做得更好。", pinyin: "Xià cì wǒ huì zuò de gèng hǎo.", english: "Next time I will do better." }
        ]
      };
      
      let sentence;
      
      // Helper function to check if all chars in a sentence are in the vocabulary list
      const containsOnlyKnownChars = (text: string, vocabList: string[]) => {
        // Create a set of all characters in the vocabulary
        const knownChars = new Set<string>();
        vocabList.forEach(word => {
          for (const char of word) {
            knownChars.add(char);
          }
        });
        
        // Common punctuation to ignore
        const punctuation = new Set(["。", "，", "？", "！", "、", "：", "；", "（", "）", """, """, "…", "—"]);
        
        // Check each character
        for (const char of text) {
          if (!knownChars.has(char) && !punctuation.has(char)) {
            return false;
          }
        }
        return true;
      };
      
      // First try to generate a proper sentence with OpenAI
      try {
        sentence = await generateSentence(activeVocabulary, difficulty);
        
        // For beginner level, verify all characters are known
        if (difficulty === "beginner") {
          const allWordsAreKnown = containsOnlyKnownChars(
            sentence.chinese, 
            activeVocabulary.map(v => v.chinese)
          );
          
          if (!allWordsAreKnown) {
            throw new Error("Generated sentence contains unknown characters");
          }
        }
      } catch (error) {
        // If generation fails, use fallback sentences
        console.log("Error generating sentence, using fallback:", error);
        
        // Choose appropriate fallback sentence set
        let options;
        if (difficulty === "beginner") {
          options = safeBeginnerSentences;
        } else {
          options = fallbackSentences[difficulty as keyof typeof fallbackSentences] || safeBeginnerSentences;
        }
        
        // Pick a random fallback sentence
        const randomIndex = Math.floor(Math.random() * options.length);
        sentence = {
          ...options[randomIndex],
          difficulty,
          fromFallback: true
        };
      }
      
      // Return the sentence (either generated or fallback)
      return res.json(sentence);
    } catch (error) {
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate sentence"
      });
    }
  });