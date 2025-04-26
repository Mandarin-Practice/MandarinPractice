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
    name: "Integrated Chinese Lesson 1",
    description: "Greetings - 15 essential words",
    words: [
      { chinese: "你", pinyin: "nǐ", english: "you" },
      { chinese: "好", pinyin: "hǎo", english: "good" },
      { chinese: "您", pinyin: "nín", english: "you (polite)" },
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
      { chinese: "再见", pinyin: "zài jiàn", english: "goodbye" }
    ]
  },
  {
    id: "ic-lesson2",
    name: "Integrated Chinese Lesson 2",
    description: "Family - 15 words about names & greetings",
    words: [
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
      { chinese: "爸爸", pinyin: "bà ba", english: "father" },
      { chinese: "妈妈", pinyin: "mā ma", english: "mother" }
    ]
  },
  {
    id: "ic-lesson3",
    name: "Integrated Chinese Lesson 3",
    description: "Dates and Time - 15 location-related words",
    words: [
      { chinese: "那", pinyin: "nà", english: "that" },
      { chinese: "的", pinyin: "de", english: "possessive marker" },
      { chinese: "家", pinyin: "jiā", english: "home, family" },
      { chinese: "人", pinyin: "rén", english: "person" },
      { chinese: "中国", pinyin: "zhōng guó", english: "China" },
      { chinese: "美国", pinyin: "měi guó", english: "America" },
      { chinese: "日本", pinyin: "rì běn", english: "Japan" },
      { chinese: "英国", pinyin: "yīng guó", english: "England" },
      { chinese: "这", pinyin: "zhè", english: "this" },
      { chinese: "北京", pinyin: "běi jīng", english: "Beijing" },
      { chinese: "上海", pinyin: "shàng hǎi", english: "Shanghai" },
      { chinese: "忙", pinyin: "máng", english: "busy" },
      { chinese: "呢", pinyin: "ne", english: "question particle" },
      { chinese: "哪", pinyin: "nǎ", english: "which" },
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
    name: "Integrated Chinese Lesson 4",
    description: "Hobbies - 15 time expressions",
    words: [
      { chinese: "现在", pinyin: "xiàn zài", english: "now" },
      { chinese: "几", pinyin: "jǐ", english: "how many" },
      { chinese: "点", pinyin: "diǎn", english: "o'clock" },
      { chinese: "分", pinyin: "fēn", english: "minute" },
      { chinese: "上午", pinyin: "shàng wǔ", english: "morning" },
      { chinese: "下午", pinyin: "xià wǔ", english: "afternoon" },
      { chinese: "晚上", pinyin: "wǎn shang", english: "evening" },
      { chinese: "星期", pinyin: "xīng qī", english: "week" },
      { chinese: "今天", pinyin: "jīn tiān", english: "today" },
      { chinese: "昨天", pinyin: "zuó tiān", english: "yesterday" },
      { chinese: "明天", pinyin: "míng tiān", english: "tomorrow" },
      { chinese: "小时", pinyin: "xiǎo shí", english: "hour" },
      { chinese: "有", pinyin: "yǒu", english: "to have" },
      { chinese: "没有", pinyin: "méi yǒu", english: "don't have" },
      { chinese: "课", pinyin: "kè", english: "class, lesson" }
    ]
  },
  {
    id: "ic-lesson5",
    name: "Integrated Chinese Lesson 5",
    description: "Visiting Friends - 15 question expressions",
    words: [
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
      { chinese: "怎么样", pinyin: "zěn me yàng", english: "how about" }
    ]
  },
  {
    id: "ic-lesson6",
    name: "Integrated Chinese Lesson 6",
    description: "Making Appointments - 15 food and activity words",
    words: [
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
      { chinese: "学习", pinyin: "xué xí", english: "to study" },
      { chinese: "聊天", pinyin: "liáo tiān", english: "to chat" },
      { chinese: "玩儿", pinyin: "wán'r", english: "to play" },
      { chinese: "累", pinyin: "lèi", english: "tired" }
    ]
  },
  {
    id: "ic-lesson7",
    name: "Integrated Chinese Lesson 7",
    description: "Studying Chinese - 15 study-related words",
    words: [
      { chinese: "教授", pinyin: "jiào shòu", english: "professor" },
      { chinese: "学院", pinyin: "xué yuàn", english: "college" },
      { chinese: "系", pinyin: "xì", english: "department" },
      { chinese: "专业", pinyin: "zhuān yè", english: "major" },
      { chinese: "年级", pinyin: "nián jí", english: "grade, year in school" },
      { chinese: "上课", pinyin: "shàng kè", english: "to attend class" },
      { chinese: "放学", pinyin: "fàng xué", english: "to get out of school" },
      { chinese: "复习", pinyin: "fù xí", english: "to review" },
      { chinese: "预习", pinyin: "yù xí", english: "to preview" },
      { chinese: "功课", pinyin: "gōng kè", english: "schoolwork" },
      { chinese: "练习", pinyin: "liàn xí", english: "to practice" },
      { chinese: "容易", pinyin: "róng yì", english: "easy" },
      { chinese: "难", pinyin: "nán", english: "difficult" },
      { chinese: "考试", pinyin: "kǎo shì", english: "to take a test" },
      { chinese: "问题", pinyin: "wèn tí", english: "question, problem" }
    ]
  },
  {
    id: "ic-lesson8", 
    name: "Integrated Chinese Lesson 8",
    description: "School Life - 15 campus experience words",
    words: [
      { chinese: "宿舍", pinyin: "sù shè", english: "dormitory" },
      { chinese: "同屋", pinyin: "tóng wū", english: "roommate" },
      { chinese: "帮助", pinyin: "bāng zhù", english: "to help" },
      { chinese: "马马虎虎", pinyin: "mǎ ma hū hū", english: "so-so" },
      { chinese: "打电话", pinyin: "dǎ diàn huà", english: "to make a phone call" },
      { chinese: "号码", pinyin: "hào mǎ", english: "number" },
      { chinese: "常常", pinyin: "cháng cháng", english: "often" },
      { chinese: "早上", pinyin: "zǎo shang", english: "morning" },
      { chinese: "起床", pinyin: "qǐ chuáng", english: "to get up" },
      { chinese: "睡觉", pinyin: "shuì jiào", english: "to sleep" },
      { chinese: "宿舍楼", pinyin: "sù shè lóu", english: "dormitory building" },
      { chinese: "图书馆", pinyin: "tú shū guǎn", english: "library" },
      { chinese: "自习室", pinyin: "zì xí shì", english: "study room" },
      { chinese: "教室", pinyin: "jiào shì", english: "classroom" },
      { chinese: "食堂", pinyin: "shí táng", english: "dining hall" }
    ]
  },
  {
    id: "hsk3",
    name: "HSK Level 3 Vocabulary",
    description: "45 essential intermediate words",
    words: [
      { chinese: "汉语", pinyin: "hàn yǔ", english: "Chinese language" },
      { chinese: "意思", pinyin: "yì si", english: "meaning" },
      { chinese: "问题", pinyin: "wèn tí", english: "question/problem" },
      { chinese: "事情", pinyin: "shì qíng", english: "matter/affair" },
      { chinese: "经常", pinyin: "jīng cháng", english: "often" },
      { chinese: "从来", pinyin: "cóng lái", english: "always/never" },
      { chinese: "努力", pinyin: "nǔ lì", english: "to work hard" },
      { chinese: "练习", pinyin: "liàn xí", english: "to practice" },
      { chinese: "考试", pinyin: "kǎo shì", english: "exam" },
      { chinese: "成绩", pinyin: "chéng jì", english: "score/grade" },
      { chinese: "教室", pinyin: "jiào shì", english: "classroom" },
      { chinese: "办公室", pinyin: "bàn gōng shì", english: "office" },
      { chinese: "游泳", pinyin: "yóu yǒng", english: "to swim" },
      { chinese: "跑步", pinyin: "pǎo bù", english: "to run" },
      { chinese: "锻炼", pinyin: "duàn liàn", english: "to exercise" },
      { chinese: "健康", pinyin: "jiàn kāng", english: "health/healthy" },
      { chinese: "参加", pinyin: "cān jiā", english: "to participate" },
      { chinese: "活动", pinyin: "huó dòng", english: "activity" },
      { chinese: "决定", pinyin: "jué dìng", english: "to decide" },
      { chinese: "笔记本", pinyin: "bǐ jì běn", english: "notebook" },
      { chinese: "手机", pinyin: "shǒu jī", english: "mobile phone" },
      { chinese: "电脑", pinyin: "diàn nǎo", english: "computer" },
      { chinese: "网上", pinyin: "wǎng shàng", english: "online" },
      { chinese: "网站", pinyin: "wǎng zhàn", english: "website" },
      { chinese: "图书馆", pinyin: "tú shū guǎn", english: "library" },
      { chinese: "超市", pinyin: "chāo shì", english: "supermarket" },
      { chinese: "公园", pinyin: "gōng yuán", english: "park" },
      { chinese: "宿舍", pinyin: "sù shè", english: "dormitory" },
      { chinese: "比赛", pinyin: "bǐ sài", english: "competition" },
      { chinese: "世界", pinyin: "shì jiè", english: "world" },
      { chinese: "城市", pinyin: "chéng shì", english: "city" },
      { chinese: "报纸", pinyin: "bào zhǐ", english: "newspaper" },
      { chinese: "音乐", pinyin: "yīn yuè", english: "music" },
      { chinese: "歌", pinyin: "gē", english: "song" },
      { chinese: "唱歌", pinyin: "chàng gē", english: "to sing" },
      { chinese: "跳舞", pinyin: "tiào wǔ", english: "to dance" },
      { chinese: "游戏", pinyin: "yóu xì", english: "game" },
      { chinese: "玩", pinyin: "wán", english: "to play" },
      { chinese: "颜色", pinyin: "yán sè", english: "color" },
      { chinese: "红", pinyin: "hóng", english: "red" },
      { chinese: "黄", pinyin: "huáng", english: "yellow" },
      { chinese: "蓝", pinyin: "lán", english: "blue" },
      { chinese: "黑", pinyin: "hēi", english: "black" },
      { chinese: "白", pinyin: "bái", english: "white" },
      { chinese: "便宜", pinyin: "pián yi", english: "cheap" }
    ]
  },
  {
    id: "business",
    name: "Business Chinese",
    description: "30 essential terms for professional settings",
    words: [
      { chinese: "公司", pinyin: "gōng sī", english: "company" },
      { chinese: "职位", pinyin: "zhí wèi", english: "position/job title" },
      { chinese: "经理", pinyin: "jīng lǐ", english: "manager" },
      { chinese: "老板", pinyin: "lǎo bǎn", english: "boss" },
      { chinese: "同事", pinyin: "tóng shì", english: "colleague" },
      { chinese: "客户", pinyin: "kè hù", english: "client/customer" },
      { chinese: "会议", pinyin: "huì yì", english: "meeting" },
      { chinese: "报告", pinyin: "bào gào", english: "report" },
      { chinese: "项目", pinyin: "xiàng mù", english: "project" },
      { chinese: "合同", pinyin: "hé tong", english: "contract" },
      { chinese: "签字", pinyin: "qiān zì", english: "to sign" },
      { chinese: "协议", pinyin: "xié yì", english: "agreement" },
      { chinese: "市场", pinyin: "shì chǎng", english: "market" },
      { chinese: "产品", pinyin: "chǎn pǐn", english: "product" },
      { chinese: "服务", pinyin: "fú wù", english: "service" },
      { chinese: "质量", pinyin: "zhì liàng", english: "quality" },
      { chinese: "价格", pinyin: "jià gé", english: "price" },
      { chinese: "销售", pinyin: "xiāo shòu", english: "sales" },
      { chinese: "利润", pinyin: "lì rùn", english: "profit" },
      { chinese: "竞争", pinyin: "jìng zhēng", english: "competition" },
      { chinese: "成功", pinyin: "chéng gōng", english: "success" },
      { chinese: "失败", pinyin: "shī bài", english: "failure" },
      { chinese: "机会", pinyin: "jī huì", english: "opportunity" },
      { chinese: "风险", pinyin: "fēng xiǎn", english: "risk" },
      { chinese: "投资", pinyin: "tóu zī", english: "investment" },
      { chinese: "发展", pinyin: "fā zhǎn", english: "development" },
      { chinese: "效率", pinyin: "xiào lǜ", english: "efficiency" },
      { chinese: "谈判", pinyin: "tán pàn", english: "negotiation" },
      { chinese: "决策", pinyin: "jué cè", english: "decision-making" },
      { chinese: "目标", pinyin: "mù biāo", english: "goal/target" }
    ]
  },
  {
    id: "tech",
    name: "Technology Terms",
    description: "25 modern technology vocabulary words",
    words: [
      { chinese: "科技", pinyin: "kē jì", english: "technology" },
      { chinese: "电脑", pinyin: "diàn nǎo", english: "computer" },
      { chinese: "手机", pinyin: "shǒu jī", english: "mobile phone" },
      { chinese: "软件", pinyin: "ruǎn jiàn", english: "software" },
      { chinese: "硬件", pinyin: "yìng jiàn", english: "hardware" },
      { chinese: "网络", pinyin: "wǎng luò", english: "network" },
      { chinese: "互联网", pinyin: "hù lián wǎng", english: "internet" },
      { chinese: "程序", pinyin: "chéng xù", english: "program" },
      { chinese: "数据", pinyin: "shù jù", english: "data" },
      { chinese: "信息", pinyin: "xìn xī", english: "information" },
      { chinese: "密码", pinyin: "mì mǎ", english: "password" },
      { chinese: "用户", pinyin: "yòng hù", english: "user" },
      { chinese: "下载", pinyin: "xià zài", english: "download" },
      { chinese: "上传", pinyin: "shàng chuán", english: "upload" },
      { chinese: "搜索", pinyin: "sōu suǒ", english: "search" },
      { chinese: "人工智能", pinyin: "rén gōng zhì néng", english: "artificial intelligence" },
      { chinese: "虚拟现实", pinyin: "xū nǐ xiàn shí", english: "virtual reality" },
      { chinese: "云计算", pinyin: "yún jì suàn", english: "cloud computing" },
      { chinese: "应用程序", pinyin: "yìng yòng chéng xù", english: "application" },
      { chinese: "备份", pinyin: "bèi fèn", english: "backup" },
      { chinese: "充电器", pinyin: "chōng diàn qì", english: "charger" },
      { chinese: "界面", pinyin: "jiè miàn", english: "interface" },
      { chinese: "更新", pinyin: "gēng xīn", english: "update" },
      { chinese: "安装", pinyin: "ān zhuāng", english: "install" },
      { chinese: "删除", pinyin: "shān chú", english: "delete" }
    ]
  },
  {
    id: "emotions",
    name: "Emotions & Feelings",
    description: "30 words to express emotions and feelings",
    words: [
      { chinese: "高兴", pinyin: "gāo xìng", english: "happy" },
      { chinese: "开心", pinyin: "kāi xīn", english: "happy/joyful" },
      { chinese: "快乐", pinyin: "kuài lè", english: "happy/cheerful" },
      { chinese: "兴奋", pinyin: "xīng fèn", english: "excited" },
      { chinese: "满意", pinyin: "mǎn yì", english: "satisfied" },
      { chinese: "感谢", pinyin: "gǎn xiè", english: "grateful" },
      { chinese: "喜欢", pinyin: "xǐ huān", english: "like" },
      { chinese: "爱", pinyin: "ài", english: "love" },
      { chinese: "希望", pinyin: "xī wàng", english: "hope" },
      { chinese: "担心", pinyin: "dān xīn", english: "worried" },
      { chinese: "紧张", pinyin: "jǐn zhāng", english: "nervous" },
      { chinese: "害怕", pinyin: "hài pà", english: "afraid" },
      { chinese: "恐惧", pinyin: "kǒng jù", english: "fear" },
      { chinese: "生气", pinyin: "shēng qì", english: "angry" },
      { chinese: "难过", pinyin: "nán guò", english: "sad" },
      { chinese: "悲伤", pinyin: "bēi shāng", english: "sorrowful" },
      { chinese: "沮丧", pinyin: "jǔ sàng", english: "depressed" },
      { chinese: "失望", pinyin: "shī wàng", english: "disappointed" },
      { chinese: "后悔", pinyin: "hòu huǐ", english: "regret" },
      { chinese: "羡慕", pinyin: "xiàn mù", english: "envy/admire" },
      { chinese: "嫉妒", pinyin: "jí dù", english: "jealous" },
      { chinese: "尴尬", pinyin: "gān gà", english: "embarrassed" },
      { chinese: "惊讶", pinyin: "jīng yà", english: "surprised" },
      { chinese: "困惑", pinyin: "kùn huò", english: "confused" },
      { chinese: "无聊", pinyin: "wú liáo", english: "bored" },
      { chinese: "疲倦", pinyin: "pí juàn", english: "tired" },
      { chinese: "平静", pinyin: "píng jìng", english: "calm" },
      { chinese: "自信", pinyin: "zì xìn", english: "confident" },
      { chinese: "骄傲", pinyin: "jiāo ào", english: "proud" },
      { chinese: "孤独", pinyin: "gū dú", english: "lonely" }
    ]
  },
  {
    id: "medical",
    name: "Medical & Health",
    description: "25 essential health and medical terms",
    words: [
      { chinese: "医生", pinyin: "yī shēng", english: "doctor" },
      { chinese: "护士", pinyin: "hù shi", english: "nurse" },
      { chinese: "患者", pinyin: "huàn zhě", english: "patient" },
      { chinese: "医院", pinyin: "yī yuàn", english: "hospital" },
      { chinese: "诊所", pinyin: "zhěn suǒ", english: "clinic" },
      { chinese: "门诊", pinyin: "mén zhěn", english: "outpatient clinic" },
      { chinese: "急诊", pinyin: "jí zhěn", english: "emergency" },
      { chinese: "药", pinyin: "yào", english: "medicine" },
      { chinese: "药房", pinyin: "yào fáng", english: "pharmacy" },
      { chinese: "疼痛", pinyin: "téng tòng", english: "pain" },
      { chinese: "头痛", pinyin: "tóu tòng", english: "headache" },
      { chinese: "发烧", pinyin: "fā shāo", english: "fever" },
      { chinese: "感冒", pinyin: "gǎn mào", english: "cold" },
      { chinese: "咳嗽", pinyin: "ké sou", english: "cough" },
      { chinese: "过敏", pinyin: "guò mǐn", english: "allergy" },
      { chinese: "血", pinyin: "xuè", english: "blood" },
      { chinese: "检查", pinyin: "jiǎn chá", english: "examination" },
      { chinese: "治疗", pinyin: "zhì liáo", english: "treatment" },
      { chinese: "手术", pinyin: "shǒu shù", english: "surgery" },
      { chinese: "预约", pinyin: "yù yuē", english: "appointment" },
      { chinese: "保险", pinyin: "bǎo xiǎn", english: "insurance" },
      { chinese: "锻炼", pinyin: "duàn liàn", english: "exercise" },
      { chinese: "健康", pinyin: "jiàn kāng", english: "health" },
      { chinese: "营养", pinyin: "yíng yǎng", english: "nutrition" },
      { chinese: "睡眠", pinyin: "shuì mián", english: "sleep" }
    ]
  },
  {
    id: "weather",
    name: "Weather & Seasons",
    description: "20 common weather expressions",
    words: [
      { chinese: "天气", pinyin: "tiān qì", english: "weather" },
      { chinese: "晴天", pinyin: "qíng tiān", english: "sunny day" },
      { chinese: "阴天", pinyin: "yīn tiān", english: "cloudy day" },
      { chinese: "下雨", pinyin: "xià yǔ", english: "rain" },
      { chinese: "下雪", pinyin: "xià xuě", english: "snow" },
      { chinese: "刮风", pinyin: "guā fēng", english: "windy" },
      { chinese: "雾", pinyin: "wù", english: "fog" },
      { chinese: "雷", pinyin: "léi", english: "thunder" },
      { chinese: "闪电", pinyin: "shǎn diàn", english: "lightning" },
      { chinese: "潮湿", pinyin: "cháo shī", english: "humid" },
      { chinese: "干燥", pinyin: "gān zào", english: "dry" },
      { chinese: "温度", pinyin: "wēn dù", english: "temperature" },
      { chinese: "春天", pinyin: "chūn tiān", english: "spring" },
      { chinese: "夏天", pinyin: "xià tiān", english: "summer" },
      { chinese: "秋天", pinyin: "qiū tiān", english: "autumn" },
      { chinese: "冬天", pinyin: "dōng tiān", english: "winter" },
      { chinese: "凉快", pinyin: "liáng kuai", english: "cool" },
      { chinese: "温暖", pinyin: "wēn nuǎn", english: "warm" },
      { chinese: "寒冷", pinyin: "hán lěng", english: "cold" },
      { chinese: "炎热", pinyin: "yán rè", english: "hot" }
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
  
  // Fetch word proficiency data for all words
  const [proficiencyData, setProficiencyData] = useState<Record<number, any>>({});
  const [isLoadingProficiency, setIsLoadingProficiency] = useState(false);
  
  useEffect(() => {
    if (vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0) {
      setIsLoadingProficiency(true);
      
      // Fetch proficiency data for each word
      const fetchProficiencyData = async () => {
        const proficiencyMap: Record<number, any> = {};
        
        const promises = vocabulary.map(async (word) => {
          try {
            const response = await apiRequest('GET', `/api/word-proficiency/${word.id}`);
            if (response.ok) {
              const data = await response.json();
              proficiencyMap[word.id] = data;
            }
          } catch (error) {
            console.error(`Failed to fetch proficiency for word ID ${word.id}:`, error);
          }
        });
        
        await Promise.all(promises);
        setProficiencyData(proficiencyMap);
        setIsLoadingProficiency(false);
      };
      
      fetchProficiencyData();
    }
  }, [vocabulary]);

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

  // Key function that handles word removal with optimistic UI updates
  const handleRemoveWord = (id: number) => {
    // Immediately update the UI before waiting for the server response
    if (vocabulary && Array.isArray(vocabulary)) {
      // Keep track of the current word list component's state
      const currentGroupByHomophones = groupByHomophones;
      
      // Only remove the exact word with matching ID - preserve other homophones
      const updatedVocabulary = vocabulary.filter(word => word.id !== id);
      
      // Optimistically update the query cache with our modified list
      queryClient.setQueryData(['/api/vocabulary'], updatedVocabulary);
      
      // Also update proficiency data for the removed word
      const updatedProficiencyData = { ...proficiencyData };
      delete updatedProficiencyData[id]; 
      setProficiencyData(updatedProficiencyData);
    }
    
    // Then perform the actual API call to delete on the server
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
    
    // Create a map to store homophone groups keyed by normalized pinyin
    const groups: { [key: string]: any[] } = {};
    
    // First pass: group by normalized pinyin (without tone marks)
    words.forEach(word => {
      // Skip words with empty pinyin
      if (!word.pinyin) return;
      
      const normalizedPinyin = normalizePinyin(word.pinyin);
      if (!groups[normalizedPinyin]) {
        groups[normalizedPinyin] = [];
      }
      groups[normalizedPinyin].push(word);
    });
    
    // Only keep groups with multiple words (actual homophones)
    return Object.values(groups).filter(group => group.length > 1);
  };
  
  // Calculate how many words from a list are already in the user's vocabulary
  const getWordListStats = (listId: string) => {
    // Default total count regardless of vocabulary state
    const wordList = SAMPLE_WORD_LISTS.find(list => list.id === listId);
    if (!wordList) return { total: 0, imported: 0 };
    
    const total = wordList.words.length;
    
    // If no vocabulary yet, return zero imported
    if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0) {
      return { total, imported: 0 };
    }
    
    let imported = 0;
    
    // Check how many words from this list are already in the user's vocabulary
    wordList.words.forEach(listWord => {
      const isImported = vocabulary.some(vocabWord => 
        vocabWord.chinese === listWord.chinese && 
        vocabWord.pinyin === listWord.pinyin
      );
      if (isImported) imported++;
    });
    
    return { total, imported };
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
                        {normalizePinyin(group[0].pinyin)} - Homophones
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {group.map((word) => (
                          <WordChip
                            key={word.id}
                            word={word}
                            proficiency={proficiencyData[word.id]}
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
                            proficiency={proficiencyData[word.id]}
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
                      proficiency={proficiencyData[word.id]}
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
            {SAMPLE_WORD_LISTS.map((list) => {
              const { total, imported } = getWordListStats(list.id);
              return (
              <div key={list.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{list.name}</h4>
                  <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    <span className={imported === total ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}>
                      {imported}/{total} words added
                    </span>
                  </div>
                </div>
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
                    disabled={importWordListMutation.isPending || (imported > 0 && imported === total)}
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      {imported > 0 && imported === total ? "All Added" : "Import All"}
                    </span>
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
