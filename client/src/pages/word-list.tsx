import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import WordChip from "@/components/word-chip";
import { Separator } from "@/components/ui/separator";

interface WordList {
  id: string;
  name: string;
  description: string;
  words: {
    chinese: string;
    pinyin: string;
    english: string;
  }[];
}

const SAMPLE_WORD_LISTS: WordList[] = [
  {
    id: "hsk1",
    name: "HSK Level 1 Basics",
    description: "60 essential words for beginners",
    words: [
      { chinese: "我", pinyin: "wǒ", english: "I/me" },
      { chinese: "你", pinyin: "nǐ", english: "you" },
      { chinese: "他", pinyin: "tā", english: "he/him" },
      { chinese: "她", pinyin: "tā", english: "she/her" },
      { chinese: "好", pinyin: "hǎo", english: "good" },
      { chinese: "是", pinyin: "shì", english: "to be" },
      { chinese: "不", pinyin: "bù", english: "no/not" },
      { chinese: "人", pinyin: "rén", english: "person" },
      { chinese: "的", pinyin: "de", english: "possessive particle" },
      { chinese: "在", pinyin: "zài", english: "at/in/on" },
      { chinese: "这", pinyin: "zhè", english: "this" },
      { chinese: "那", pinyin: "nà", english: "that" },
      { chinese: "个", pinyin: "gè", english: "individual/measure word" },
      { chinese: "们", pinyin: "men", english: "plural marker" },
      { chinese: "有", pinyin: "yǒu", english: "to have" },
      { chinese: "来", pinyin: "lái", english: "to come" },
      { chinese: "去", pinyin: "qù", english: "to go" },
      { chinese: "看", pinyin: "kàn", english: "to see/to look" },
      { chinese: "听", pinyin: "tīng", english: "to listen" },
      { chinese: "说", pinyin: "shuō", english: "to speak" },
      { chinese: "吃", pinyin: "chī", english: "to eat" },
      { chinese: "喝", pinyin: "hē", english: "to drink" },
      { chinese: "做", pinyin: "zuò", english: "to do" },
      { chinese: "想", pinyin: "xiǎng", english: "to think/to want" },
      { chinese: "爱", pinyin: "ài", english: "to love" },
      { chinese: "书", pinyin: "shū", english: "book" },
      { chinese: "钱", pinyin: "qián", english: "money" },
      { chinese: "什么", pinyin: "shén me", english: "what" },
      { chinese: "谁", pinyin: "shuí", english: "who" },
      { chinese: "哪里", pinyin: "nǎ lǐ", english: "where" },
      { chinese: "名字", pinyin: "míng zì", english: "name" },
      { chinese: "朋友", pinyin: "péng yǒu", english: "friend" },
      { chinese: "老师", pinyin: "lǎo shī", english: "teacher" },
      { chinese: "学生", pinyin: "xué shēng", english: "student" },
      { chinese: "家", pinyin: "jiā", english: "home/family" },
      { chinese: "学校", pinyin: "xué xiào", english: "school" },
      { chinese: "商店", pinyin: "shāng diàn", english: "store" },
      { chinese: "医院", pinyin: "yī yuàn", english: "hospital" },
      { chinese: "饭馆", pinyin: "fàn guǎn", english: "restaurant" },
      { chinese: "时间", pinyin: "shí jiān", english: "time" },
      { chinese: "年", pinyin: "nián", english: "year" },
      { chinese: "月", pinyin: "yuè", english: "month" },
      { chinese: "日", pinyin: "rì", english: "day" },
      { chinese: "星期", pinyin: "xīng qī", english: "week" },
      { chinese: "点", pinyin: "diǎn", english: "o'clock" },
      { chinese: "分钟", pinyin: "fēn zhōng", english: "minute" },
      { chinese: "现在", pinyin: "xiàn zài", english: "now" },
      { chinese: "今天", pinyin: "jīn tiān", english: "today" },
      { chinese: "明天", pinyin: "míng tiān", english: "tomorrow" },
      { chinese: "昨天", pinyin: "zuó tiān", english: "yesterday" },
      { chinese: "小", pinyin: "xiǎo", english: "small" },
      { chinese: "大", pinyin: "dà", english: "big" },
      { chinese: "多", pinyin: "duō", english: "many" },
      { chinese: "少", pinyin: "shǎo", english: "few" },
      { chinese: "热", pinyin: "rè", english: "hot" },
      { chinese: "冷", pinyin: "lěng", english: "cold" },
      { chinese: "开", pinyin: "kāi", english: "to open" },
      { chinese: "关", pinyin: "guān", english: "to close" },
      { chinese: "买", pinyin: "mǎi", english: "to buy" },
      { chinese: "卖", pinyin: "mài", english: "to sell" }
    ]
  },
  {
    id: "hsk2",
    name: "HSK Level 2 Vocabulary",
    description: "40 common intermediate words",
    words: [
      { chinese: "工作", pinyin: "gōng zuò", english: "work/job" },
      { chinese: "学习", pinyin: "xué xí", english: "to study" },
      { chinese: "开始", pinyin: "kāi shǐ", english: "to begin" },
      { chinese: "结束", pinyin: "jié shù", english: "to end" },
      { chinese: "高兴", pinyin: "gāo xìng", english: "happy" },
      { chinese: "漂亮", pinyin: "piào liang", english: "pretty/beautiful" },
      { chinese: "便宜", pinyin: "pián yi", english: "cheap" },
      { chinese: "贵", pinyin: "guì", english: "expensive" },
      { chinese: "累", pinyin: "lèi", english: "tired" },
      { chinese: "忙", pinyin: "máng", english: "busy" },
      { chinese: "饿", pinyin: "è", english: "hungry" },
      { chinese: "渴", pinyin: "kě", english: "thirsty" },
      { chinese: "睡觉", pinyin: "shuì jiào", english: "to sleep" },
      { chinese: "起床", pinyin: "qǐ chuáng", english: "to get up" },
      { chinese: "穿", pinyin: "chuān", english: "to wear" },
      { chinese: "脱", pinyin: "tuō", english: "to take off" },
      { chinese: "洗", pinyin: "xǐ", english: "to wash" },
      { chinese: "给", pinyin: "gěi", english: "to give" },
      { chinese: "懂", pinyin: "dǒng", english: "to understand" },
      { chinese: "觉得", pinyin: "jué de", english: "to feel/to think" },
      { chinese: "知道", pinyin: "zhī dào", english: "to know" },
      { chinese: "认识", pinyin: "rèn shi", english: "to recognize/to know" },
      { chinese: "可以", pinyin: "kě yǐ", english: "can/may" },
      { chinese: "会", pinyin: "huì", english: "can/will" },
      { chinese: "能", pinyin: "néng", english: "can/to be able to" },
      { chinese: "要", pinyin: "yào", english: "to want/to need" },
      { chinese: "喜欢", pinyin: "xǐ huan", english: "to like" },
      { chinese: "希望", pinyin: "xī wàng", english: "to hope" },
      { chinese: "觉得", pinyin: "jué de", english: "to feel/to think" },
      { chinese: "同意", pinyin: "tóng yì", english: "to agree" },
      { chinese: "准备", pinyin: "zhǔn bèi", english: "to prepare" },
      { chinese: "帮助", pinyin: "bāng zhù", english: "to help" },
      { chinese: "介绍", pinyin: "jiè shào", english: "to introduce" },
      { chinese: "需要", pinyin: "xū yào", english: "to need" },
      { chinese: "找", pinyin: "zhǎo", english: "to look for" },
      { chinese: "送", pinyin: "sòng", english: "to give/to deliver" },
      { chinese: "等", pinyin: "děng", english: "to wait" },
      { chinese: "问", pinyin: "wèn", english: "to ask" },
      { chinese: "回答", pinyin: "huí dá", english: "to answer" },
      { chinese: "告诉", pinyin: "gào sù", english: "to tell" }
    ]
  },
  {
    id: "travel",
    name: "Travel Phrases",
    description: "25 useful travel expressions",
    words: [
      { chinese: "你好", pinyin: "nǐ hǎo", english: "hello" },
      { chinese: "谢谢", pinyin: "xiè xiè", english: "thank you" },
      { chinese: "再见", pinyin: "zài jiàn", english: "goodbye" },
      { chinese: "请", pinyin: "qǐng", english: "please" },
      { chinese: "对不起", pinyin: "duì bù qǐ", english: "sorry" },
      { chinese: "没关系", pinyin: "méi guān xì", english: "it's okay" },
      { chinese: "厕所", pinyin: "cè suǒ", english: "toilet" },
      { chinese: "多少钱", pinyin: "duō shǎo qián", english: "how much money" },
      { chinese: "饭店", pinyin: "fàn diàn", english: "restaurant" },
      { chinese: "水", pinyin: "shuǐ", english: "water" },
      { chinese: "酒店", pinyin: "jiǔ diàn", english: "hotel" },
      { chinese: "机场", pinyin: "jī chǎng", english: "airport" },
      { chinese: "火车站", pinyin: "huǒ chē zhàn", english: "train station" },
      { chinese: "地铁", pinyin: "dì tiě", english: "subway" },
      { chinese: "公交车", pinyin: "gōng jiāo chē", english: "bus" },
      { chinese: "出租车", pinyin: "chū zū chē", english: "taxi" },
      { chinese: "左边", pinyin: "zuǒ biān", english: "left side" },
      { chinese: "右边", pinyin: "yòu biān", english: "right side" },
      { chinese: "前面", pinyin: "qián miàn", english: "in front" },
      { chinese: "后面", pinyin: "hòu miàn", english: "behind" },
      { chinese: "医院", pinyin: "yī yuàn", english: "hospital" },
      { chinese: "药店", pinyin: "yào diàn", english: "pharmacy" },
      { chinese: "银行", pinyin: "yín háng", english: "bank" },
      { chinese: "帮助", pinyin: "bāng zhù", english: "help" },
      { chinese: "紧急", pinyin: "jǐn jí", english: "emergency" }
    ]
  },
  {
    id: "ic-lesson1",
    name: "Integrated Chinese Level 1 Part 1",
    description: "45 words from Lesson 1-3",
    words: [
      { chinese: "你", pinyin: "nǐ", english: "you" },
      { chinese: "好", pinyin: "hǎo", english: "good" },
      { chinese: "请问", pinyin: "qǐng wèn", english: "may I ask" },
      { chinese: "是", pinyin: "shì", english: "to be" },
      { chinese: "老师", pinyin: "lǎo shī", english: "teacher" },
      { chinese: "吗", pinyin: "ma", english: "question particle" },
      { chinese: "不", pinyin: "bù", english: "no, not" },
      { chinese: "我", pinyin: "wǒ", english: "I, me" },
      { chinese: "学生", pinyin: "xué sheng", english: "student" },
      { chinese: "也", pinyin: "yě", english: "also, too" },
      { chinese: "认识", pinyin: "rèn shi", english: "to know (someone)" },
      { chinese: "很", pinyin: "hěn", english: "very" },
      { chinese: "高兴", pinyin: "gāo xìng", english: "happy, pleased" },
      { chinese: "贵姓", pinyin: "guì xìng", english: "your surname" },
      { chinese: "叫", pinyin: "jiào", english: "to be called" },
      { chinese: "什么", pinyin: "shén me", english: "what" },
      { chinese: "名字", pinyin: "míng zi", english: "name" },
      { chinese: "先生", pinyin: "xiān sheng", english: "Mr., sir" },
      { chinese: "小姐", pinyin: "xiǎo jiě", english: "Miss" },
      { chinese: "你们", pinyin: "nǐ men", english: "you (plural)" },
      { chinese: "他", pinyin: "tā", english: "he, him" },
      { chinese: "她", pinyin: "tā", english: "she, her" },
      { chinese: "们", pinyin: "men", english: "plural marker" },
      { chinese: "朋友", pinyin: "péng you", english: "friend" },
      { chinese: "同学", pinyin: "tóng xué", english: "classmate" },
      { chinese: "谁", pinyin: "shuí", english: "who" },
      { chinese: "那", pinyin: "nà", english: "that" },
      { chinese: "的", pinyin: "de", english: "possessive marker" },
      { chinese: "家", pinyin: "jiā", english: "home, family" },
      { chinese: "人", pinyin: "rén", english: "person" },
      { chinese: "中国", pinyin: "zhōng guó", english: "China" },
      { chinese: "美国", pinyin: "měi guó", english: "America" },
      { chinese: "日本", pinyin: "rì běn", english: "Japan" },
      { chinese: "英国", pinyin: "yīng guó", english: "England" },
      { chinese: "法国", pinyin: "fǎ guó", english: "France" },
      { chinese: "这", pinyin: "zhè", english: "this" },
      { chinese: "北京", pinyin: "běi jīng", english: "Beijing" },
      { chinese: "纽约", pinyin: "niǔ yuē", english: "New York" },
      { chinese: "老", pinyin: "lǎo", english: "old" },
      { chinese: "忙", pinyin: "máng", english: "busy" },
      { chinese: "呢", pinyin: "ne", english: "question particle" },
      { chinese: "哪", pinyin: "nǎ", english: "which" },
      { chinese: "来", pinyin: "lái", english: "to come" },
      { chinese: "哪里", pinyin: "nǎ li", english: "where" },
      { chinese: "住", pinyin: "zhù", english: "to live" }
    ]
  },
  {
    id: "food",
    name: "Food & Dining",
    description: "35 common food and dining terms",
    words: [
      { chinese: "饭", pinyin: "fàn", english: "rice/meal" },
      { chinese: "菜", pinyin: "cài", english: "dish/vegetable" },
      { chinese: "肉", pinyin: "ròu", english: "meat" },
      { chinese: "牛肉", pinyin: "niú ròu", english: "beef" },
      { chinese: "猪肉", pinyin: "zhū ròu", english: "pork" },
      { chinese: "鸡肉", pinyin: "jī ròu", english: "chicken meat" },
      { chinese: "鱼", pinyin: "yú", english: "fish" },
      { chinese: "面条", pinyin: "miàn tiáo", english: "noodles" },
      { chinese: "米饭", pinyin: "mǐ fàn", english: "cooked rice" },
      { chinese: "豆腐", pinyin: "dòu fu", english: "tofu" },
      { chinese: "鸡蛋", pinyin: "jī dàn", english: "egg" },
      { chinese: "蔬菜", pinyin: "shū cài", english: "vegetables" },
      { chinese: "水果", pinyin: "shuǐ guǒ", english: "fruit" },
      { chinese: "苹果", pinyin: "píng guǒ", english: "apple" },
      { chinese: "香蕉", pinyin: "xiāng jiāo", english: "banana" },
      { chinese: "橙子", pinyin: "chéng zi", english: "orange" },
      { chinese: "西瓜", pinyin: "xī guā", english: "watermelon" },
      { chinese: "茶", pinyin: "chá", english: "tea" },
      { chinese: "咖啡", pinyin: "kā fēi", english: "coffee" },
      { chinese: "啤酒", pinyin: "pí jiǔ", english: "beer" },
      { chinese: "牛奶", pinyin: "niú nǎi", english: "milk" },
      { chinese: "水", pinyin: "shuǐ", english: "water" },
      { chinese: "饮料", pinyin: "yǐn liào", english: "beverage" },
      { chinese: "筷子", pinyin: "kuài zi", english: "chopsticks" },
      { chinese: "碗", pinyin: "wǎn", english: "bowl" },
      { chinese: "盘子", pinyin: "pán zi", english: "plate" },
      { chinese: "杯子", pinyin: "bēi zi", english: "cup" },
      { chinese: "甜", pinyin: "tián", english: "sweet" },
      { chinese: "酸", pinyin: "suān", english: "sour" },
      { chinese: "辣", pinyin: "là", english: "spicy" },
      { chinese: "咸", pinyin: "xián", english: "salty" },
      { chinese: "点菜", pinyin: "diǎn cài", english: "to order food" },
      { chinese: "服务员", pinyin: "fú wù yuán", english: "waiter/waitress" },
      { chinese: "菜单", pinyin: "cài dān", english: "menu" },
      { chinese: "结账", pinyin: "jié zhàng", english: "to pay the bill" }
    ]
  },
  {
    id: "ic-lesson4",
    name: "Integrated Chinese Level 1 Part 2",
    description: "40 words from Lesson 4-6",
    words: [
      { chinese: "现在", pinyin: "xiàn zài", english: "now" },
      { chinese: "几", pinyin: "jǐ", english: "how many" },
      { chinese: "点", pinyin: "diǎn", english: "o'clock" },
      { chinese: "分", pinyin: "fēn", english: "minute" },
      { chinese: "上午", pinyin: "shàng wǔ", english: "morning" },
      { chinese: "下午", pinyin: "xià wǔ", english: "afternoon" },
      { chinese: "星期", pinyin: "xīng qī", english: "week" },
      { chinese: "今天", pinyin: "jīn tiān", english: "today" },
      { chinese: "昨天", pinyin: "zuó tiān", english: "yesterday" },
      { chinese: "明天", pinyin: "míng tiān", english: "tomorrow" },
      { chinese: "有", pinyin: "yǒu", english: "to have" },
      { chinese: "没有", pinyin: "méi yǒu", english: "don't have" },
      { chinese: "课", pinyin: "kè", english: "class, lesson" },
      { chinese: "电影", pinyin: "diàn yǐng", english: "movie" },
      { chinese: "时候", pinyin: "shí hou", english: "time" },
      { chinese: "想", pinyin: "xiǎng", english: "to want, to think" },
      { chinese: "去", pinyin: "qù", english: "to go" },
      { chinese: "看", pinyin: "kàn", english: "to watch" },
      { chinese: "和", pinyin: "hé", english: "and" },
      { chinese: "可以", pinyin: "kě yǐ", english: "can, may" },
      { chinese: "为什么", pinyin: "wèi shén me", english: "why" },
      { chinese: "因为", pinyin: "yīn wèi", english: "because" },
      { chinese: "所以", pinyin: "suǒ yǐ", english: "so, therefore" },
      { chinese: "跟", pinyin: "gēn", english: "with" },
      { chinese: "得", pinyin: "děi", english: "must, have to" },
      { chinese: "做", pinyin: "zuò", english: "to do" },
      { chinese: "作业", pinyin: "zuò yè", english: "homework" },
      { chinese: "怎么样", pinyin: "zěn me yàng", english: "how about" },
      { chinese: "喜欢", pinyin: "xǐ huan", english: "to like" },
      { chinese: "爱", pinyin: "ài", english: "to love" },
      { chinese: "有意思", pinyin: "yǒu yì si", english: "interesting" },
      { chinese: "菜", pinyin: "cài", english: "dish, vegetable" },
      { chinese: "吃", pinyin: "chī", english: "to eat" },
      { chinese: "饭", pinyin: "fàn", english: "food, meal" },
      { chinese: "喝", pinyin: "hē", english: "to drink" },
      { chinese: "茶", pinyin: "chá", english: "tea" },
      { chinese: "咖啡", pinyin: "kā fēi", english: "coffee" },
      { chinese: "东西", pinyin: "dōng xi", english: "thing" },
      { chinese: "中文", pinyin: "zhōng wén", english: "Chinese language" },
      { chinese: "学习", pinyin: "xué xí", english: "to study" }
    ]
  }
];

export default function WordList() {
  const [wordInput, setWordInput] = useState("");
  const [groupByHomophones, setGroupByHomophones] = useState(false);
  const [previewList, setPreviewList] = useState<WordList | null>(null);
  const [selectedWords, setSelectedWords] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's vocabulary
  const { data: vocabulary, isLoading } = useQuery({
    queryKey: ['/api/vocabulary'],
    refetchOnWindowFocus: false,
  });

  // Save vocabulary mutation
  const saveVocabularyMutation = useMutation({
    mutationFn: async (words: { chinese: string; pinyin: string; english: string }[]) => {
      const response = await apiRequest('POST', '/api/vocabulary', { words });
      return response.json();
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      
      const originalCount = variables.length;
      const savedCount = result.length;
      const duplicateCount = originalCount - savedCount;
      
      let description = "Your vocabulary list has been updated.";
      if (duplicateCount > 0) {
        description = `${savedCount} words saved. ${duplicateCount} duplicate ${duplicateCount === 1 ? 'word was' : 'words were'} skipped.`;
      }
      
      toast({
        title: "Words saved",
        description: description,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving words",
        description: error.message || "There was a problem saving your vocabulary.",
        variant: "destructive",
      });
    }
  });

  // Delete word mutation
  const deleteWordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/vocabulary/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Word removed",
        description: "The word has been removed from your vocabulary list.",
        variant: "default",
      });
    }
  });
  
  // Toggle word active status mutation
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number, active: string }) => {
      const response = await apiRequest('PATCH', `/api/vocabulary/${id}`, { active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
    }
  });

  // Clear all words mutation
  const clearWordsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/vocabulary');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "List cleared",
        description: "All words have been removed from your vocabulary list.",
        variant: "default",
      });
    }
  });

  // Import word list mutation
  const importWordListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const wordList = SAMPLE_WORD_LISTS.find(list => list.id === listId);
      if (!wordList) throw new Error("Word list not found");
      
      const response = await apiRequest('POST', '/api/vocabulary/import', { words: wordList.words });
      const result = await response.json();
      return {
        wordList,
        savedWords: result
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      
      const originalCount = data.wordList.words.length;
      const savedCount = data.savedWords.length;
      const duplicateCount = originalCount - savedCount;
      
      let description = "The word list has been added to your vocabulary.";
      if (duplicateCount > 0) {
        description = `${savedCount} words imported. ${duplicateCount} duplicate ${duplicateCount === 1 ? 'word was' : 'words were'} skipped.`;
      }
      
      toast({
        title: "Word list imported",
        description: description,
        variant: "default",
      });
    }
  });

  // Parse the textarea input into words
  const parseWords = () => {
    if (!wordInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some vocabulary words.",
        variant: "destructive",
      });
      return;
    }

    const lines = wordInput.split('\n').filter(line => line.trim());
    const words = lines.map(line => {
      // Try to parse lines in format: Chinese (pinyin) - English
      const pattern = /^(.+?)\s*\((.+?)\)\s*-\s*(.+)$/;
      const match = line.match(pattern);
      
      if (match) {
        return {
          chinese: match[1].trim(),
          pinyin: match[2].trim(),
          english: match[3].trim()
        };
      }
      
      // Fallback for unparseable lines
      return {
        chinese: line.trim(),
        pinyin: "",
        english: ""
      };
    });

    saveVocabularyMutation.mutate(words);
    setWordInput("");
  };

  const handleRemoveWord = (id: number) => {
    deleteWordMutation.mutate(id);
  };

  const handleClearWords = () => {
    if (confirm("Are you sure you want to clear all words?")) {
      clearWordsMutation.mutate();
    }
  };

  // Show word list preview
  const handleShowPreview = (listId: string) => {
    const list = SAMPLE_WORD_LISTS.find(l => l.id === listId);
    if (list) {
      setPreviewList(list);
      
      // Initialize all words as selected
      const initialSelectedState: Record<number, boolean> = {};
      list.words.forEach((_, index) => {
        initialSelectedState[index] = true;
      });
      setSelectedWords(initialSelectedState);
    }
  };
  
  // Close word list preview
  const handleClosePreview = () => {
    setPreviewList(null);
    setSelectedWords({});
  };
  
  // Toggle selection of a specific word
  const handleToggleWordSelection = (index: number) => {
    setSelectedWords(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Import entire word list without preview
  const handleImportWordList = (listId: string) => {
    importWordListMutation.mutate(listId);
  };
  
  // Import only selected words from preview
  const handleImportSelectedWords = () => {
    if (!previewList) return;
    
    // Filter words based on selection
    const selectedWordsToImport = previewList.words.filter((_, index) => selectedWords[index]);
    
    if (selectedWordsToImport.length === 0) {
      toast({
        title: "No words selected",
        description: "Please select at least one word to import.",
        variant: "destructive",
      });
      return;
    }
    
    // Save vocabulary and track duplicates
    saveVocabularyMutation.mutate(selectedWordsToImport, {
      onSuccess: (result) => {
        const originalCount = selectedWordsToImport.length;
        const savedCount = result.length;
        const duplicateCount = originalCount - savedCount;
        
        let description = `${savedCount} words have been imported from ${previewList.name}.`;
        if (duplicateCount > 0) {
          description = `${savedCount} words imported. ${duplicateCount} duplicate ${duplicateCount === 1 ? 'word was' : 'words were'} skipped.`;
        }
        
        toast({
          title: "Words imported",
          description: description,
          variant: "default",
        });
        
        handleClosePreview();
      }
    });
  };
  
  const handleToggleActive = (id: number, currentActive: string) => {
    const newActive = currentActive === "true" ? "false" : "true";
    toggleActiveStatusMutation.mutate({ id, active: newActive });
  };
  
  // Function to normalize pinyin by removing tone marks
  const normalizePinyin = (pinyin: string): string => {
    // Remove tone marks to get base pinyin
    return pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  
  // Group words by homophone (same pinyin without tones)
  const getHomophoneGroups = (words: any[]) => {
    if (!Array.isArray(words) || words.length === 0) return [];
    
    const groups: { [key: string]: any[] } = {};
    
    // First pass: group by normalized pinyin
    words.forEach(word => {
      const normalizedPinyin = normalizePinyin(word.pinyin);
      if (!groups[normalizedPinyin]) {
        groups[normalizedPinyin] = [];
      }
      groups[normalizedPinyin].push(word);
    });
    
    // Only keep groups with multiple words
    return Object.values(groups).filter(group => group.length > 1);
  };

  return (
    <div className="word-list-section">
      {/* Word List Preview Modal */}
      {previewList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-semibold">{previewList.name}</h3>
              <button 
                onClick={handleClosePreview}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="flex p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Select all words
                    const allSelected: Record<number, boolean> = {};
                    previewList.words.forEach((_, index) => {
                      allSelected[index] = true;
                    });
                    setSelectedWords(allSelected);
                  }}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Deselect all words
                    const noneSelected: Record<number, boolean> = {};
                    previewList.words.forEach((_, index) => {
                      noneSelected[index] = false;
                    });
                    setSelectedWords(noneSelected);
                  }}
                >
                  Deselect All
                </Button>
                <span className="ml-4 text-sm">
                  {Object.values(selectedWords).filter(Boolean).length} of {previewList.words.length} selected
                </span>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {previewList.words.map((word, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-2 transition-colors cursor-pointer ${
                      selectedWords[index] 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => handleToggleWordSelection(index)}
                  >
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={selectedWords[index] || false}
                        onChange={() => handleToggleWordSelection(index)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">{word.chinese}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{word.pinyin}</div>
                        <div className="text-sm">{word.english}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleClosePreview}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportSelectedWords}
                disabled={Object.values(selectedWords).filter(Boolean).length === 0}
              >
                Import Selected Words
              </Button>
            </div>
          </div>
        </div>
      )}
    
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Vocabulary Words</CardTitle>
          <CardDescription>Add the Mandarin words you want to practice</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <label htmlFor="word-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Words (one per line)
            </label>
            <Textarea
              id="word-input"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              rows={5}
              placeholder="学习 (xuéxí) - to study
喜欢 (xǐhuān) - to like
中文 (zhōngwén) - Chinese language"
              className="w-full px-4 py-3 rounded-lg"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Format: Chinese characters (pinyin) - English meaning
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Current Word List</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Group homophones</span>
                <div
                  className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer ${
                    groupByHomophones ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  onClick={() => setGroupByHomophones(!groupByHomophones)}
                >
                  <div
                    className={`bg-white dark:bg-gray-200 h-4 w-4 rounded-full shadow-md transform transition-transform ${
                      groupByHomophones ? "translate-x-5" : ""
                    }`}
                  ></div>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-wrap gap-2 mb-4">
                <p>Loading vocabulary...</p>
              </div>
            ) : vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
              groupByHomophones ? (
                // Homophone grouping mode
                <div className="space-y-4 mb-4">
                  {getHomophoneGroups(vocabulary).map((group, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                        {normalizePinyin(group[0].pinyin)} - Homophones with different tones
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {group.map((word) => (
                          <WordChip
                            key={word.id}
                            word={word}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Display words that don't have homophones */}
                  {vocabulary.filter(word => {
                    const normalizedPinyin = normalizePinyin(word.pinyin);
                    const group = vocabulary.filter(w => normalizePinyin(w.pinyin) === normalizedPinyin);
                    return group.length === 1;
                  }).length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                        Words without homophones
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {vocabulary.filter(word => {
                          const normalizedPinyin = normalizePinyin(word.pinyin);
                          const group = vocabulary.filter(w => normalizePinyin(w.pinyin) === normalizedPinyin);
                          return group.length === 1;
                        }).map((word) => (
                          <WordChip
                            key={word.id}
                            word={word}
                            onRemove={() => handleRemoveWord(word.id)}
                            onToggleActive={() => handleToggleActive(word.id, word.active)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Normal list mode
                <div className="flex flex-wrap gap-2 mb-4">
                  {vocabulary.map((word) => (
                    <WordChip
                      key={word.id}
                      word={word}
                      onRemove={() => handleRemoveWord(word.id)}
                      onToggleActive={() => handleToggleActive(word.id, word.active)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-gray-500 dark:text-gray-400 italic mb-4">
                No words in your vocabulary list yet.
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClearWords}
            disabled={isLoading || !vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0}
          >
            Clear List
          </Button>
          <Button
            onClick={parseWords}
            disabled={!wordInput.trim()}
          >
            Save Words
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-3">Suggested Word Lists</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Import pre-made lists to get started quickly</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_WORD_LISTS.map((list) => (
              <div key={list.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                <h4 className="font-medium mb-2">{list.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{list.description}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-sm"
                    onClick={() => handleShowPreview(list.id)}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      Preview & Select
                    </span>
                  </Button>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm text-primary hover:text-blue-700 dark:hover:text-blue-300"
                    onClick={() => handleImportWordList(list.id)}
                    disabled={importWordListMutation.isPending}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      Import All
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
