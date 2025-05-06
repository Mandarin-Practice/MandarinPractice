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
  // Integrated Chinese Word Lists (Lesson 1-20)
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
    description: "Dates and time vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "日", pinyin: "rì", english: "day; sun" },
      { chinese: "月", pinyin: "yuè", english: "month; moon" },
      { chinese: "星期", pinyin: "xīng qī", english: "week" },
      { chinese: "点", pinyin: "diǎn", english: "o'clock; point" },
      { chinese: "分钟", pinyin: "fēn zhōng", english: "minute" },
      { chinese: "现在", pinyin: "xiàn zài", english: "now" },
      { chinese: "今天", pinyin: "jīn tiān", english: "today" },
      { chinese: "明天", pinyin: "míng tiān", english: "tomorrow" },
      { chinese: "昨天", pinyin: "zuó tiān", english: "yesterday" },
      { chinese: "上午", pinyin: "shàng wǔ", english: "morning" },
      { chinese: "中午", pinyin: "zhōng wǔ", english: "noon" },
      { chinese: "下午", pinyin: "xià wǔ", english: "afternoon" },
      { chinese: "晚上", pinyin: "wǎn shang", english: "evening" },
      { chinese: "号", pinyin: "hào", english: "date; number" },
      { chinese: "年", pinyin: "nián", english: "year" },
      { chinese: "课", pinyin: "kè", english: "lesson; class" },
      { chinese: "电影", pinyin: "diàn yǐng", english: "movie" },
      { chinese: "看", pinyin: "kàn", english: "to watch; to see" },
      { chinese: "去", pinyin: "qù", english: "to go" },
      { chinese: "想", pinyin: "xiǎng", english: "to want; to think" }
    ]
  },
  {
    id: "ic-lesson04",
    name: "Integrated Chinese Lesson 4",
    description: "Hobbies and activities vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "学习", pinyin: "xué xí", english: "to study" },
      { chinese: "喜欢", pinyin: "xǐ huān", english: "to like" },
      { chinese: "爱好", pinyin: "ài hào", english: "hobby; interest" },
      { chinese: "运动", pinyin: "yùn dòng", english: "to exercise; sports" },
      { chinese: "踢足球", pinyin: "tī zú qiú", english: "to play soccer" },
      { chinese: "打篮球", pinyin: "dǎ lán qiú", english: "to play basketball" },
      { chinese: "游泳", pinyin: "yóu yǒng", english: "to swim" },
      { chinese: "唱歌", pinyin: "chàng gē", english: "to sing" },
      { chinese: "跳舞", pinyin: "tiào wǔ", english: "to dance" },
      { chinese: "听音乐", pinyin: "tīng yīn yuè", english: "to listen to music" },
      { chinese: "看书", pinyin: "kàn shū", english: "to read books" },
      { chinese: "打电话", pinyin: "dǎ diàn huà", english: "to make a phone call" },
      { chinese: "玩电脑游戏", pinyin: "wán diàn nǎo yóu xì", english: "to play computer games" },
      { chinese: "上网", pinyin: "shàng wǎng", english: "to surf the internet" },
      { chinese: "做饭", pinyin: "zuò fàn", english: "to cook" },
      { chinese: "休息", pinyin: "xiū xi", english: "to rest" }
    ]
  },
  {
    id: "ic-lesson05",
    name: "Integrated Chinese Lesson 5",
    description: "Visiting friends vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "认识", pinyin: "rèn shi", english: "to know (someone)" },
      { chinese: "介绍", pinyin: "jiè shào", english: "to introduce" },
      { chinese: "高兴", pinyin: "gāo xìng", english: "happy" },
      { chinese: "见面", pinyin: "jiàn miàn", english: "to meet" },
      { chinese: "进", pinyin: "jìn", english: "to enter" },
      { chinese: "坐", pinyin: "zuò", english: "to sit" },
      { chinese: "请坐", pinyin: "qǐng zuò", english: "please sit" },
      { chinese: "喝茶", pinyin: "hē chá", english: "to drink tea" },
      { chinese: "咖啡", pinyin: "kā fēi", english: "coffee" },
      { chinese: "水果", pinyin: "shuǐ guǒ", english: "fruit" },
      { chinese: "苹果", pinyin: "píng guǒ", english: "apple" },
      { chinese: "香蕉", pinyin: "xiāng jiāo", english: "banana" },
      { chinese: "吃", pinyin: "chī", english: "to eat" },
      { chinese: "喝", pinyin: "hē", english: "to drink" }
    ]
  },
  {
    id: "ic-lesson06",
    name: "Integrated Chinese Lesson 6",
    description: "Making appointments vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "约会", pinyin: "yuē huì", english: "appointment; date" },
      { chinese: "等", pinyin: "děng", english: "to wait" },
      { chinese: "迟到", pinyin: "chí dào", english: "to be late" },
      { chinese: "早", pinyin: "zǎo", english: "early" },
      { chinese: "早到", pinyin: "zǎo dào", english: "to arrive early" },
      { chinese: "准时", pinyin: "zhǔn shí", english: "on time" },
      { chinese: "几点", pinyin: "jǐ diǎn", english: "what time" },
      { chinese: "应该", pinyin: "yīng gāi", english: "should; ought to" },
      { chinese: "会", pinyin: "huì", english: "will; can" },
      { chinese: "知道", pinyin: "zhī dào", english: "to know" },
      { chinese: "对不起", pinyin: "duì bù qǐ", english: "sorry" },
      { chinese: "没关系", pinyin: "méi guān xi", english: "it doesn't matter" },
      { chinese: "真", pinyin: "zhēn", english: "really; truly" },
      { chinese: "事情", pinyin: "shì qing", english: "matter; affair" }
    ]
  },
  {
    id: "ic-lesson07",
    name: "Integrated Chinese Lesson 7",
    description: "Studying Chinese vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "学校", pinyin: "xué xiào", english: "school" },
      { chinese: "大学", pinyin: "dà xué", english: "university" },
      { chinese: "专业", pinyin: "zhuān yè", english: "major" },
      { chinese: "中文", pinyin: "zhōng wén", english: "Chinese language" },
      { chinese: "汉语", pinyin: "hàn yǔ", english: "Chinese language" },
      { chinese: "课", pinyin: "kè", english: "class; lesson" },
      { chinese: "难", pinyin: "nán", english: "difficult" },
      { chinese: "容易", pinyin: "róng yì", english: "easy" },
      { chinese: "有意思", pinyin: "yǒu yì si", english: "interesting" },
      { chinese: "没意思", pinyin: "méi yì si", english: "boring" },
      { chinese: "汉字", pinyin: "hàn zì", english: "Chinese character" },
      { chinese: "语法", pinyin: "yǔ fǎ", english: "grammar" },
      { chinese: "发音", pinyin: "fā yīn", english: "pronunciation" },
      { chinese: "写", pinyin: "xiě", english: "to write" },
      { chinese: "读", pinyin: "dú", english: "to read" },
      { chinese: "说", pinyin: "shuō", english: "to speak" }
    ]
  },
  {
    id: "ic-lesson08",
    name: "Integrated Chinese Lesson 8",
    description: "School life vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "教室", pinyin: "jiào shì", english: "classroom" },
      { chinese: "食堂", pinyin: "shí táng", english: "dining hall" },
      { chinese: "宿舍", pinyin: "sù shè", english: "dormitory" },
      { chinese: "图书馆", pinyin: "tú shū guǎn", english: "library" },
      { chinese: "上课", pinyin: "shàng kè", english: "to attend class" },
      { chinese: "下课", pinyin: "xià kè", english: "class is over" },
      { chinese: "考试", pinyin: "kǎo shì", english: "to take an exam" },
      { chinese: "复习", pinyin: "fù xí", english: "to review" },
      { chinese: "练习", pinyin: "liàn xí", english: "to practice" },
      { chinese: "问题", pinyin: "wèn tí", english: "question; problem" },
      { chinese: "回答", pinyin: "huí dá", english: "to answer" },
      { chinese: "懂", pinyin: "dǒng", english: "to understand" },
      { chinese: "不懂", pinyin: "bù dǒng", english: "to not understand" }
    ]
  },
  {
    id: "ic-lesson09",
    name: "Integrated Chinese Lesson 9",
    description: "Shopping vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "商店", pinyin: "shāng diàn", english: "store" },
      { chinese: "超市", pinyin: "chāo shì", english: "supermarket" },
      { chinese: "买东西", pinyin: "mǎi dōng xi", english: "to shop" },
      { chinese: "衣服", pinyin: "yī fu", english: "clothes" },
      { chinese: "裤子", pinyin: "kù zi", english: "pants" },
      { chinese: "衬衫", pinyin: "chèn shān", english: "shirt" },
      { chinese: "鞋", pinyin: "xié", english: "shoes" },
      { chinese: "颜色", pinyin: "yán sè", english: "color" },
      { chinese: "红", pinyin: "hóng", english: "red" },
      { chinese: "蓝", pinyin: "lán", english: "blue" },
      { chinese: "黄", pinyin: "huáng", english: "yellow" },
      { chinese: "白", pinyin: "bái", english: "white" },
      { chinese: "黑", pinyin: "hēi", english: "black" },
      { chinese: "好看", pinyin: "hǎo kàn", english: "good-looking" },
      { chinese: "漂亮", pinyin: "piào liang", english: "pretty" },
      { chinese: "多少钱", pinyin: "duō shǎo qián", english: "how much" },
      { chinese: "便宜", pinyin: "pián yi", english: "inexpensive" },
      { chinese: "贵", pinyin: "guì", english: "expensive" }
    ]
  },
  {
    id: "ic-lesson10",
    name: "Integrated Chinese Lesson 10",
    description: "Transportation vocabulary",
    category: "Integrated Chinese",
    words: [
      { chinese: "怎么", pinyin: "zěn me", english: "how" },
      { chinese: "去", pinyin: "qù", english: "to go" },
      { chinese: "走", pinyin: "zǒu", english: "to walk" },
      { chinese: "坐", pinyin: "zuò", english: "to take (transportation)" },
      { chinese: "开车", pinyin: "kāi chē", english: "to drive" },
      { chinese: "骑自行车", pinyin: "qí zì xíng chē", english: "to ride a bike" },
      { chinese: "公共汽车", pinyin: "gōng gòng qì chē", english: "bus" },
      { chinese: "出租车", pinyin: "chū zū chē", english: "taxi" },
      { chinese: "地铁", pinyin: "dì tiě", english: "subway" },
      { chinese: "火车", pinyin: "huǒ chē", english: "train" },
      { chinese: "飞机", pinyin: "fēi jī", english: "airplane" },
      { chinese: "慢", pinyin: "màn", english: "slow" },
      { chinese: "快", pinyin: "kuài", english: "fast" },
      { chinese: "近", pinyin: "jìn", english: "near" },
      { chinese: "远", pinyin: "yuǎn", english: "far" },
      { chinese: "路", pinyin: "lù", english: "road" },
      { chinese: "右边", pinyin: "yòu bian", english: "right side" },
      { chinese: "左边", pinyin: "zuǒ bian", english: "left side" },
      { chinese: "前面", pinyin: "qián miàn", english: "front" },
      { chinese: "后面", pinyin: "hòu miàn", english: "behind" }
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
  // HSK Word Lists
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
      { chinese: "觉得", pinyin: "jué dé", english: "to feel/to think" },
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
    id: "hsk3",
    name: "HSK Level 3 Vocabulary",
    description: "45 essential intermediate words",
    category: "HSK",
    words: [
      { chinese: "经常", pinyin: "jīng cháng", english: "often" },
      { chinese: "差不多", pinyin: "chà bù duō", english: "almost" },
      { chinese: "一般", pinyin: "yī bān", english: "generally" },
      { chinese: "突然", pinyin: "tū rán", english: "suddenly" },
      { chinese: "已经", pinyin: "yǐ jīng", english: "already" },
      { chinese: "正在", pinyin: "zhèng zài", english: "in the process of" },
      { chinese: "通过", pinyin: "tōng guò", english: "through/by means of" },
      { chinese: "虽然", pinyin: "suī rán", english: "although" },
      { chinese: "而且", pinyin: "ér qiě", english: "moreover" },
      { chinese: "或者", pinyin: "huò zhě", english: "or" },
      { chinese: "因为", pinyin: "yīn wèi", english: "because" },
      { chinese: "所以", pinyin: "suǒ yǐ", english: "therefore" },
      { chinese: "但是", pinyin: "dàn shì", english: "but" },
      { chinese: "如果", pinyin: "rú guǒ", english: "if" },
      { chinese: "觉得", pinyin: "jué de", english: "to feel/to think" },
      { chinese: "意思", pinyin: "yì si", english: "meaning" },
      { chinese: "关系", pinyin: "guān xì", english: "relation/relationship" },
      { chinese: "问题", pinyin: "wèn tí", english: "question/problem" },
      { chinese: "办法", pinyin: "bàn fǎ", english: "way/method" },
      { chinese: "机会", pinyin: "jī huì", english: "opportunity" },
      { chinese: "经验", pinyin: "jīng yàn", english: "experience" },
      { chinese: "信息", pinyin: "xìn xī", english: "information" },
      { chinese: "计划", pinyin: "jì huà", english: "plan" },
      { chinese: "变化", pinyin: "biàn huà", english: "change" },
      { chinese: "原因", pinyin: "yuán yīn", english: "reason/cause" },
      { chinese: "历史", pinyin: "lì shǐ", english: "history" },
      { chinese: "文化", pinyin: "wén huà", english: "culture" },
      { chinese: "教育", pinyin: "jiào yù", english: "education" },
      { chinese: "研究", pinyin: "yán jiū", english: "research" },
      { chinese: "发展", pinyin: "fā zhǎn", english: "development" },
      { chinese: "城市", pinyin: "chéng shì", english: "city" },
      { chinese: "环境", pinyin: "huán jìng", english: "environment" },
      { chinese: "国家", pinyin: "guó jiā", english: "country" },
      { chinese: "政府", pinyin: "zhèng fǔ", english: "government" },
      { chinese: "经济", pinyin: "jīng jì", english: "economy" },
      { chinese: "公司", pinyin: "gōng sī", english: "company" },
      { chinese: "服务", pinyin: "fú wù", english: "service" },
      { chinese: "质量", pinyin: "zhì liàng", english: "quality" },
      { chinese: "价格", pinyin: "jià gé", english: "price" },
      { chinese: "数量", pinyin: "shù liàng", english: "quantity" },
      { chinese: "项目", pinyin: "xiàng mù", english: "project" },
      { chinese: "系统", pinyin: "xì tǒng", english: "system" },
      { chinese: "技术", pinyin: "jì shù", english: "technology" },
      { chinese: "资料", pinyin: "zī liào", english: "information/data" },
      { chinese: "方面", pinyin: "fāng miàn", english: "aspect" }
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
  }
];

export default function WordList() {
  const [wordInput, setWordInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupByHomophones, setGroupByHomophones] = useState(false);
  const [previewList, setPreviewList] = useState<WordList | null>(null);
  const [selectedWords, setSelectedWords] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's vocabulary
  const { data: vocabulary, isLoading } = useQuery({
    queryKey: ["/api/vocabulary"],
    queryFn: async () => {
      const res = await fetch("/api/vocabulary");
      if (!res.ok) {
        throw new Error("Failed to fetch vocabulary");
      }
      return res.json();
    },
  });

  // Get unique categories from word lists
  const categories = Array.from(
    new Set(SAMPLE_WORD_LISTS.map((list) => list.category || "Uncategorized"))
  ).sort();
  
  // Group word lists by category
  const wordListsByCategory = categories.reduce<Record<string, WordList[]>>(
    (acc, category) => {
      acc[category] = SAMPLE_WORD_LISTS.filter(
        (list) => (list.category || "Uncategorized") === category
      ).sort((a, b) => a.name.localeCompare(b.name));
      return acc;
    },
    {}
  );

  // Add word to vocabulary
  const addWordMutation = useMutation({
    mutationFn: async (word: { chinese: string; pinyin: string; english: string }) => {
      const res = await apiRequest("POST", "/api/vocabulary", word);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to add word");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Word added",
        description: "The word has been added to your vocabulary.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      setWordInput("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add a batch of words
  const addWordsMutation = useMutation({
    mutationFn: async (words: { chinese: string; pinyin: string; english: string }[]) => {
      // Create a promise for each word
      const promises = words.map(async (word) => {
        const res = await apiRequest("POST", "/api/vocabulary", word);
        if (!res.ok) {
          const error = await res.text();
          throw new Error(error || "Failed to add word");
        }
        return res.json();
      });

      // Wait for all promises to resolve
      return Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Words added",
        description: `${variables.length} words have been added to your vocabulary.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary"] });
      setSelectedWords({});
      setPreviewList(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add a word from input
  const handleAddWord = () => {
    const [chinese = "", pinyin = "", english = ""] = wordInput.split(",").map((s) => s.trim());
    if (!chinese || !pinyin || !english) {
      toast({
        title: "Invalid input",
        description: "Please enter Chinese, pinyin, and English separated by commas",
        variant: "destructive",
      });
      return;
    }

    addWordMutation.mutate({ chinese, pinyin, english });
  };

  // Preview a word list
  const handlePreviewList = (list: WordList) => {
    setPreviewList(list);
    setSelectedWords({});
  };

  // Toggle selection of a word
  const toggleWordSelection = (index: number) => {
    setSelectedWords((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Select all words
  const selectAllWords = () => {
    if (!previewList) return;
    
    const allSelected = previewList.words.reduce<Record<number, boolean>>((acc, _, index) => {
      acc[index] = true;
      return acc;
    }, {});
    
    setSelectedWords(allSelected);
  };

  // Deselect all words
  const deselectAllWords = () => {
    setSelectedWords({});
  };

  // Add selected words to vocabulary
  const addSelectedWords = () => {
    if (!previewList) return;
    
    const selectedWordsList = Object.entries(selectedWords)
      .filter(([_, isSelected]) => isSelected)
      .map(([index]) => previewList.words[Number(index)]);
    
    if (selectedWordsList.length === 0) {
      toast({
        title: "No words selected",
        description: "Please select at least one word to add",
        variant: "destructive",
      });
      return;
    }
    
    addWordsMutation.mutate(selectedWordsList);
  };

  // Check if a word is already in vocabulary
  const isWordInVocabulary = (chinese: string) => {
    if (!vocabulary) return false;
    return vocabulary.some((word: any) => word.chinese === chinese);
  };

  return (
    <div className="container max-w-5xl py-6">
      <h1 className="text-3xl font-bold mb-6">Word Lists</h1>
      
      {!previewList ? (
        <>
          {/* Categories and Word Lists */}
          <div className="space-y-6">
            {categories.map((category) => (
              <Card key={category} className="overflow-hidden">
                <CardHeader className="bg-card/80 backdrop-blur-sm sticky top-0 z-10 opaque-header">
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {wordListsByCategory[category].map((list) => (
                    <Card key={list.id} className="h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        <CardDescription>{list.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {list.words.slice(0, 5).map((word, i) => (
                            <WordChip key={i} chinese={word.chinese} />
                          ))}
                          {list.words.length > 5 && (
                            <span className="text-sm text-muted-foreground">
                              +{list.words.length - 5} more
                            </span>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="default" 
                          className="w-full"
                          onClick={() => handlePreviewList(list)}
                        >
                          View Words
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Add Custom Word */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Add Custom Word</CardTitle>
              <CardDescription>
                Enter a Chinese word, pinyin, and English translation separated by commas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Textarea
                  placeholder="你好, nǐ hǎo, hello"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  className="h-12"
                />
                <Button 
                  onClick={handleAddWord} 
                  disabled={addWordMutation.isPending}
                  className="whitespace-nowrap"
                >
                  Add Word
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Word List Preview */}
          <Card>
            <CardHeader className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm opaque-header">
              <CardTitle className="flex items-center justify-between">
                <span>{previewList.name}</span>
                <Button variant="outline" onClick={() => setPreviewList(null)}>
                  Back to Lists
                </Button>
              </CardTitle>
              <CardDescription>{previewList.description}</CardDescription>
              <div className="flex items-center justify-between mt-2">
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={selectAllWords}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAllWords}>
                    Deselect All
                  </Button>
                </div>
                <Button 
                  onClick={addSelectedWords} 
                  disabled={addWordsMutation.isPending || Object.values(selectedWords).filter(Boolean).length === 0}
                >
                  Add Selected Words
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {previewList.words.map((word, index) => {
                  const isInVocabulary = isWordInVocabulary(word.chinese);
                  const isSelected = selectedWords[index] || false;
                  
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-md flex items-center gap-2 border ${
                        isInVocabulary 
                          ? "bg-muted text-muted-foreground border-muted" 
                          : isSelected
                            ? "bg-primary/10 border-primary/30"
                            : "border-border"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleWordSelection(index)}
                        disabled={isInVocabulary}
                        className="h-4 w-4"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-grow">
                        <div className="text-lg font-bold">{word.chinese}</div>
                        <div className="text-sm text-muted-foreground">{word.pinyin}</div>
                        <div>{word.english}</div>
                      </div>
                      {isInVocabulary && (
                        <span className="text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-1 rounded">
                          Already in vocabulary
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}