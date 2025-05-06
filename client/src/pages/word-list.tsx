import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import WordChip from "@/components/word-chip";
import { Separator } from "@/components/ui/separator";
import { LESSON11_WORDLIST } from "@/data/word-lists";
import { LESSON12_WORDLIST } from "@/data/lesson12-wordlist";
import { LESSON13_WORDLIST } from "@/data/lesson13-wordlist";
import { LESSON14_WORDLIST } from "@/data/lesson14-wordlist";
import { LESSON15_WORDLIST } from "@/data/lesson15-wordlist";
import { LESSON16_WORDLIST } from "@/data/lesson16-wordlist";
import { LESSON17_WORDLIST } from "@/data/lesson17-wordlist";
import { LESSON18_WORDLIST } from "@/data/lesson18-wordlist";
import { LESSON19_WORDLIST } from "@/data/lesson19-wordlist";
import { LESSON20_WORDLIST } from "@/data/lesson20-wordlist";

interface WordList {
  id: string;
  name: string;
  description: string;
  category?: string; // Category/folder to group word lists
  words: {
    chinese: string;
    pinyin: string;
    english: string;
  }[];
}

const SAMPLE_WORD_LISTS: WordList[] = [
  {
    id: "ic-lesson01",
    name: "Integrated Chinese Lesson 1",
    description: "Greetings - 25 essential words",
    category: "Integrated Chinese",
    words: [
      { chinese: "你", pinyin: "nǐ", english: "you" },
      { chinese: "好", pinyin: "hǎo", english: "fine; good; nice; O.K.; it's settled" },
      { chinese: "请", pinyin: "qǐng", english: "please (polite form of request); to treat or to invite" },
      { chinese: "问", pinyin: "wèn", english: "to ask (a question)" },
      { chinese: "贵", pinyin: "guì", english: "honorable; expensive" },
      { chinese: "姓", pinyin: "xìng", english: "(one's) surname is...; to be surnamed" },
      { chinese: "我", pinyin: "wǒ", english: "I; me" },
      { chinese: "呢", pinyin: "ne", english: "(question particle)" },
      { chinese: "小姐", pinyin: "xiǎo jiě", english: "Miss; young lady" },
      { chinese: "叫", pinyin: "jiào", english: "to be called; to call" },
      { chinese: "什么", pinyin: "shén me", english: "what" },
      { chinese: "名字", pinyin: "míng zì", english: "name" },
      { chinese: "先生", pinyin: "xiān sheng", english: "Mr.; husband; teacher" },
      { chinese: "李友", pinyin: "Lǐ Yǒu", english: "(a personal name)" },
      { chinese: "李", pinyin: "Lǐ", english: "(a surname); plum" },
      { chinese: "王朋", pinyin: "Wáng Péng", english: "(a personal name)" },
      { chinese: "王", pinyin: "Wáng", english: "(a surname); king" },
      { chinese: "是", pinyin: "shì", english: "to be" },
      { chinese: "老师", pinyin: "lǎo shī", english: "teacher" },
      { chinese: "吗", pinyin: "ma", english: "(question particle)" },
      { chinese: "不", pinyin: "bù", english: "not; no" },
      { chinese: "学生", pinyin: "xué shēng", english: "student" },
      { chinese: "也", pinyin: "yě", english: "too; also" },
      { chinese: "人", pinyin: "rén", english: "people; person" },
      { chinese: "中国", pinyin: "Zhōng guó", english: "China" },
      { chinese: "北京", pinyin: "Běi jīng", english: "Beijing" },
      { chinese: "美国", pinyin: "Měi guó", english: "America" },
      { chinese: "纽约", pinyin: "Niǔ yuē", english: "New York" }
    ]
  },
  {
    id: "ic-lesson02",
    name: "Integrated Chinese Lesson 2",
    description: "Family - 38 family-related words",
    category: "Integrated Chinese",
    words: [
      { chinese: "那", pinyin: "nà", english: "that" },
      { chinese: "的", pinyin: "de", english: "(a possessive or descriptive particle)" },
      { chinese: "照片", pinyin: "zhào piàn", english: "picture; photo" },
      { chinese: "这", pinyin: "zhè", english: "this" },
      { chinese: "爸爸", pinyin: "bà ba", english: "father; dad" },
      { chinese: "妈妈", pinyin: "mā ma", english: "mother; mom" },
      { chinese: "个", pinyin: "gè", english: "(measure word for many common everyday objects)" },
      { chinese: "女", pinyin: "nǚ", english: "female" },
      { chinese: "孩子", pinyin: "hái zi", english: "child" },
      { chinese: "谁", pinyin: "shéi", english: "who" },
      { chinese: "她", pinyin: "tā", english: "she; her" },
      { chinese: "姐姐", pinyin: "jiě jie", english: "older sister" },
      { chinese: "男", pinyin: "nán", english: "male" },
      { chinese: "弟弟", pinyin: "dì di", english: "younger brother" },
      { chinese: "他", pinyin: "tā", english: "he; him" },
      { chinese: "哥哥", pinyin: "gē ge", english: "older brother" },
      { chinese: "家", pinyin: "jiā", english: "home; family; house" },
      { chinese: "有", pinyin: "yǒu", english: "to have; there is" },
      { chinese: "没有", pinyin: "méi yǒu", english: "does not have; there is not" },
      { chinese: "二", pinyin: "èr", english: "two" },
      { chinese: "一", pinyin: "yī", english: "one" },
      { chinese: "忙", pinyin: "máng", english: "busy" },
      { chinese: "很", pinyin: "hěn", english: "very" },
      { chinese: "做", pinyin: "zuò", english: "to do" },
      { chinese: "律师", pinyin: "lǜ shī", english: "lawyer" },
      { chinese: "医生", pinyin: "yī shēng", english: "doctor" },
      { chinese: "大夫", pinyin: "dài fu", english: "doctor" },
      { chinese: "都", pinyin: "dōu", english: "all; both" },
      { chinese: "妹妹", pinyin: "mèi mei", english: "younger sister" },
      { chinese: "漂亮", pinyin: "piào liang", english: "pretty; beautiful" },
      { chinese: "高兴", pinyin: "gāo xìng", english: "happy; pleased" },
      { chinese: "认识", pinyin: "rèn shi", english: "to know (sb.); to recognize" },
      { chinese: "会", pinyin: "huì", english: "can; to know how to; will; to be able to" },
      { chinese: "说", pinyin: "shuō", english: "to speak; to say" },
      { chinese: "英文", pinyin: "Yīng wén", english: "English (language)" },
      { chinese: "法文", pinyin: "Fǎ wén", english: "French (language)" },
      { chinese: "法国", pinyin: "Fǎ guó", english: "France" },
      { chinese: "英国", pinyin: "Yīng guó", english: "Britain; England" }
    ]
  },
  {
    id: "ic-lesson03",
    name: "Integrated Chinese Lesson 3",
    description: "Basic conversation and introductions",
    category: "Integrated Chinese",
    words: [
      { chinese: "大家", pinyin: "dà jiā", english: "everybody; everyone" },
      { chinese: "现在", pinyin: "xiàn zài", english: "now" },
      { chinese: "认识", pinyin: "rèn shi", english: "to know (sb.); to recognize" },
      { chinese: "一下", pinyin: "yí xià", english: "(used after a verb to indicate a brief or casual action)" },
      { chinese: "美国人", pinyin: "Měi guó rén", english: "American" },
      { chinese: "中国人", pinyin: "Zhōng guó rén", english: "Chinese (person)" },
      { chinese: "同学", pinyin: "tóng xué", english: "classmate" },
      { chinese: "朋友", pinyin: "péng you", english: "friend" },
      { chinese: "都", pinyin: "dōu", english: "all; both" },
      { chinese: "会", pinyin: "huì", english: "can; will; to know how to" },
      { chinese: "说", pinyin: "shuō", english: "to speak; to say" },
      { chinese: "汉语", pinyin: "Hàn yǔ", english: "Chinese language" },
      { chinese: "法国", pinyin: "Fǎ guó", english: "France" },
      { chinese: "法国人", pinyin: "Fǎ guó rén", english: "French person" }
    ]
  },
  {
    id: "ic-lesson11",
    name: "Integrated Chinese Lesson 11",
    description: "Seasons and weather - 25 essential terms",
    category: "Integrated Chinese",
    words: LESSON11_WORDLIST.words
  },
  {
    id: "ic-lesson12",
    name: "Integrated Chinese Lesson 12",
    description: "Restaurant and dining vocabulary",
    category: "Integrated Chinese",
    words: LESSON12_WORDLIST.words
  },
  {
    id: "ic-lesson13",
    name: "Integrated Chinese Lesson 13",
    description: "Direction and location terms",
    category: "Integrated Chinese",
    words: LESSON13_WORDLIST.words
  },
  {
    id: "ic-lesson14",
    name: "Integrated Chinese Lesson 14",
    description: "Family, gifts, and physical descriptions",
    category: "Integrated Chinese",
    words: LESSON14_WORDLIST.words
  },
  {
    id: "ic-lesson15",
    name: "Integrated Chinese Lesson 15",
    description: "Health and medical terminology",
    category: "Integrated Chinese",
    words: LESSON15_WORDLIST.words
  },
  {
    id: "ic-lesson16",
    name: "Integrated Chinese Lesson 16",
    description: "Moving, travel, and daily life vocabulary",
    category: "Integrated Chinese",
    words: LESSON16_WORDLIST.words
  },
  {
    id: "ic-lesson17",
    name: "Integrated Chinese Lesson 17",
    description: "Housing, apartments, and furniture vocabulary",
    category: "Integrated Chinese",
    words: LESSON17_WORDLIST.words
  },
  {
    id: "ic-lesson18",
    name: "Integrated Chinese Lesson 18",
    description: "Sports, activities, and physical fitness vocabulary",
    category: "Integrated Chinese",
    words: LESSON18_WORDLIST.words
  },
  {
    id: "ic-lesson19",
    name: "Integrated Chinese Lesson 19",
    description: "Travel, vacation, and tourism vocabulary",
    category: "Integrated Chinese",
    words: LESSON19_WORDLIST.words
  },
  {
    id: "ic-lesson20",
    name: "Integrated Chinese Lesson 20",
    description: "Travel, airport, and luggage vocabulary",
    category: "Integrated Chinese",
    words: LESSON20_WORDLIST.words
  },
  {
    id: "hsk1",
    name: "HSK Level 1 Basics",
    description: "60 essential words for beginners",
    category: "HSK",
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
    category: "HSK",
    words: [
      { chinese: "工作", pinyin: "gōng zuò", english: "work/job" },
      { chinese: "学习", pinyin: "xué xí", english: "to study" },
      { chinese: "开始", pinyin: "kāi shǐ", english: "to begin" },
      { chinese: "结束", pinyin: "jié shù", english: "to end" },
      { chinese: "高兴", pinyin: "gāo xìng", english: "happy" },
      { chinese: "漂亮", pinyin: "piào liàng", english: "pretty/beautiful" },
      { chinese: "便宜", pinyin: "pián yí", english: "cheap" },
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
      { chinese: "觉得", pinyin: "jué dé", english: "to feel/to think" },
      { chinese: "知道", pinyin: "zhī dào", english: "to know" },
      { chinese: "认识", pinyin: "rèn shi", english: "to recognize/to know" },
      { chinese: "可以", pinyin: "kě yǐ", english: "can/may" },
      { chinese: "会", pinyin: "huì", english: "can/will" },
      { chinese: "能", pinyin: "néng", english: "can/to be able to" },
      { chinese: "要", pinyin: "yào", english: "to want/to need" },
      { chinese: "喜欢", pinyin: "xǐ huān", english: "to like" },
      { chinese: "希望", pinyin: "xī wàng", english: "to hope" },
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
    category: "Topics",
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
    id: "food",
    name: "Food & Dining",
    description: "35 common food and dining terms",
    category: "Topics",
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
  }
];

// Record to group word lists by category
type GroupedWordLists = Record<string, WordList[]>;

export default function WordList() {
  const [selectedWordList, setSelectedWordList] = useState<WordList | null>(null);
  const [homophoneGroups, setHomophoneGroups] = useState<HomophoneGroup[]>([]);

  // Group by category for display
  const wordListsByCategory: GroupedWordLists = SAMPLE_WORD_LISTS.reduce((acc, list) => {
    const category = list.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(list);
    return acc;
  }, {} as GroupedWordLists);

  // Type for grouped words with the same pronunciation
  type HomophoneGroup = {
    type: 'pronoun' | 'pinyin';
    words: Array<{
      id: number;
      chinese: string;
      pinyin: string;
      english: string;
      active: string;
    }>;
  };

  function handleCardClick(wordList: WordList) {
    setSelectedWordList(wordList);
    findHomophones(wordList.words);
  }

  function findHomophones(words: WordList['words']) {
    // Group by pinyin
    const pinyinGroups: Record<string, typeof words> = {};
    
    words.forEach(word => {
      const pinyinKey = word.pinyin.toLowerCase();
      if (!pinyinGroups[pinyinKey]) {
        pinyinGroups[pinyinKey] = [];
      }
      pinyinGroups[pinyinKey].push(word);
    });
    
    // Find groups with more than one word
    const groups: HomophoneGroup[] = [];
    
    Object.entries(pinyinGroups).forEach(([pinyin, words], index) => {
      if (words.length > 1) {
        groups.push({
          type: 'pinyin',
          words: words.map((word, wordIndex) => ({
            id: index * 100 + wordIndex,
            chinese: word.chinese,
            pinyin: word.pinyin,
            english: word.english,
            active: "true"
          }))
        });
      }
    });
    
    setHomophoneGroups(groups);
  }

  const backToSelection = () => {
    setSelectedWordList(null);
    setHomophoneGroups([]);
  };

  return (
    <div className="container my-6">
      {selectedWordList ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{selectedWordList.name}</h2>
            <Button variant="outline" onClick={backToSelection}>Back to list</Button>
          </div>
          
          <p className="text-muted-foreground mb-6">{selectedWordList.description}</p>
          
          <div className="grid gap-4">
            <Card>
              <CardHeader className="bg-white/80 sticky top-0 z-10 backdrop-blur-md opaque-header">
                <CardTitle>All Words</CardTitle>
                <CardDescription>
                  Total: {selectedWordList.words.length} words
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-3">
                {selectedWordList.words.map((word, index) => (
                  <WordChip
                    key={`${word.chinese}-${index}`}
                    chinese={word.chinese}
                    pinyin={word.pinyin}
                    english={word.english}
                  />
                ))}
              </CardContent>
            </Card>
            
            {homophoneGroups.length > 0 && (
              <Card>
                <CardHeader className="bg-white/80 sticky top-0 z-10 backdrop-blur-md opaque-header">
                  <CardTitle>Similar Pronunciations</CardTitle>
                  <CardDescription>
                    Words with the same pinyin: {homophoneGroups.length} groups
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-3">
                  {homophoneGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border rounded-lg p-3">
                      <h3 className="font-medium mb-2">Group {groupIndex + 1}: {group.words[0].pinyin}</h3>
                      <div className="grid gap-2">
                        {group.words.map((word) => (
                          <WordChip
                            key={word.id}
                            chinese={word.chinese}
                            pinyin={word.pinyin}
                            english={word.english}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold mb-6">Vocabulary Lists</h1>
          {Object.entries(wordListsByCategory).map(([category, lists]) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 bg-white/80 sticky top-0 z-10 py-2 backdrop-blur-md opaque-header">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((list) => (
                  <Card 
                    key={list.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleCardClick(list)}
                  >
                    <CardHeader>
                      <CardTitle>{list.name}</CardTitle>
                      <CardDescription>{list.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {list.words.length} words
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
