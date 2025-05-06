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
    id: "ic-lesson1",
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
    id: "ic-lesson2",
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
      { chinese: "大哥", pinyin: "dà gē", english: "eldest brother" },
      { chinese: "儿子", pinyin: "ér zi", english: "son" },
      { chinese: "有", pinyin: "yǒu", english: "to have; to exist" },
      { chinese: "女儿", pinyin: "nǚ ér", english: "daughter" },
      { chinese: "没", pinyin: "méi", english: "not" },
      { chinese: "高文中", pinyin: "Gāo Wén zhōng", english: "(a personal name)" },
      { chinese: "高", pinyin: "Gāo", english: "(a surname); tall; high" },
      { chinese: "家", pinyin: "jiā", english: "family; home" },
      { chinese: "几", pinyin: "jǐ", english: "how many; some; a few" },
      { chinese: "口", pinyin: "kǒu", english: "(measure word for number of family members)" },
      { chinese: "哥哥", pinyin: "gē ge", english: "older brother" },
      { chinese: "两", pinyin: "liǎng", english: "two; a couple of" },
      { chinese: "妹妹", pinyin: "mèi mei", english: "younger sister" },
      { chinese: "和", pinyin: "hé", english: "and" },
      { chinese: "大姐", pinyin: "dà jiě", english: "eldest sister" },
      { chinese: "二姐", pinyin: "èr jiě", english: "second oldest sister" },
      { chinese: "做", pinyin: "zuò", english: "to do" },
      { chinese: "工作", pinyin: "gōng zuò", english: "job; to work" },
      { chinese: "律师", pinyin: "lǜ shī", english: "lawyer" },
      { chinese: "英文", pinyin: "Yīng wén", english: "English (language)" },
      { chinese: "都", pinyin: "dōu", english: "both; all" },
      { chinese: "大学生", pinyin: "dà xué shēng", english: "college student" },
      { chinese: "大学", pinyin: "dà xué", english: "university; college" },
      { chinese: "医生", pinyin: "yī shēng", english: "doctor; physician" },
      { chinese: "白英爱", pinyin: "Bái Yīng'ài", english: "(a personal name)" }
    ]
  },
  {
    id: "ic-lesson3",
    name: "Integrated Chinese Lesson 3",
    description: "Dates and Time - 45 time expressions and daily activities",
    category: "Integrated Chinese",
    words: [
      { chinese: "九月", pinyin: "jiǔ yuè", english: "September" },
      { chinese: "月", pinyin: "yuè", english: "month" },
      { chinese: "十二", pinyin: "shí'èr", english: "twelve" },
      { chinese: "号", pinyin: "hào", english: "(measure word for number in a series; day of the month)" },
      { chinese: "星期", pinyin: "xīng qī", english: "week" },
      { chinese: "星期四", pinyin: "xīng qī sì", english: "Thursday" },
      { chinese: "天", pinyin: "tiān", english: "day" },
      { chinese: "生日", pinyin: "shēng rì", english: "birthday" },
      { chinese: "生", pinyin: "shēng", english: "to give birth to; to be born" },
      { chinese: "日", pinyin: "rì", english: "day; sun" },
      { chinese: "今年", pinyin: "jīn nián", english: "this year" },
      { chinese: "年", pinyin: "nián", english: "year" },
      { chinese: "多", pinyin: "duō", english: "how many/much; to what extent; many" },
      { chinese: "大", pinyin: "dà", english: "big; old" },
      { chinese: "十八", pinyin: "shí bā", english: "eighteen" },
      { chinese: "岁", pinyin: "suì", english: "year (of age)" },
      { chinese: "吃", pinyin: "chī", english: "to eat" },
      { chinese: "饭", pinyin: "fàn", english: "meal; (cooked) rice" },
      { chinese: "怎么样", pinyin: "zěn me yàng", english: "Is it O.K.? How is that? How does that sound?" },
      { chinese: "太...了", pinyin: "tài...le", english: "too; extremely" },
      { chinese: "谢谢", pinyin: "xiè xie", english: "to thank" },
      { chinese: "喜欢", pinyin: "xǐ huān", english: "to like" },
      { chinese: "菜", pinyin: "cài", english: "dishes; cuisine" },
      { chinese: "还是", pinyin: "hái shi", english: "or" },
      { chinese: "可是", pinyin: "kě shì", english: "but" },
      { chinese: "我们", pinyin: "wǒ men", english: "we" },
      { chinese: "点", pinyin: "diǎn", english: "o'clock (points on the clock)" },
      { chinese: "半", pinyin: "bàn", english: "half; half an hour" },
      { chinese: "晚上", pinyin: "wǎn shang", english: "evening; night" },
      { chinese: "见", pinyin: "jiàn", english: "to see" },
      { chinese: "再见", pinyin: "zài jiàn", english: "goodbye; see you again" },
      { chinese: "再", pinyin: "zài", english: "again" },
      { chinese: "英国", pinyin: "Yīng guó", english: "Britain; England" },
      { chinese: "现在", pinyin: "xiàn zài", english: "now" },
      { chinese: "刻", pinyin: "kè", english: "quarter (of an hour)" },
      { chinese: "事儿", pinyin: "shìr", english: "matter; affair; event" },
      { chinese: "今天", pinyin: "jīn tiān", english: "today" },
      { chinese: "很", pinyin: "hěn", english: "very" },
      { chinese: "忙", pinyin: "máng", english: "busy" },
      { chinese: "明天", pinyin: "míng tiān", english: "tomorrow" },
      { chinese: "晚饭", pinyin: "wǎn fàn", english: "dinner; supper" },
      { chinese: "为什么", pinyin: "wèi shén me", english: "why" },
      { chinese: "为", pinyin: "wèi", english: "for" },
      { chinese: "因为", pinyin: "yīn wèi", english: "because" },
      { chinese: "还", pinyin: "hái", english: "also; too; as well" },
      { chinese: "同学", pinyin: "tóng xué", english: "classmate" },
      { chinese: "认识", pinyin: "rèn shi", english: "to be acquainted with; to recognize" },
      { chinese: "朋友", pinyin: "péng yǒu", english: "friend" },
      { chinese: "那", pinyin: "nà", english: "that" },
      { chinese: "这", pinyin: "zhè", english: "this" },
      { chinese: "中国", pinyin: "Zhōng guó", english: "China" },
      { chinese: "美国", pinyin: "Měi guó", english: "America" },
      { chinese: "日本", pinyin: "Rì běn", english: "Japan" }
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
  },
  {
    id: "ic-lesson4",
    name: "Integrated Chinese Lesson 4",
    description: "Hobbies - 48 leisure activity words",
    category: "Integrated Chinese",
    words: [
      { chinese: "周末", pinyin: "zhōu mò", english: "weekend" },
      { chinese: "打球", pinyin: "dǎ qiú", english: "to play ball" },
      { chinese: "打", pinyin: "dǎ", english: "to hit" },
      { chinese: "球", pinyin: "qiú", english: "ball" },
      { chinese: "看", pinyin: "kàn", english: "to watch; to look; to read" },
      { chinese: "电视", pinyin: "diàn shì", english: "television" },
      { chinese: "电", pinyin: "diàn", english: "electricity" },
      { chinese: "视", pinyin: "shì", english: "vision" },
      { chinese: "唱歌儿", pinyin: "chàng gēr", english: "to sing (a song)" },
      { chinese: "唱", pinyin: "chàng", english: "to sing" },
      { chinese: "歌", pinyin: "gē", english: "song" },
      { chinese: "跳舞", pinyin: "tiào wǔ", english: "to dance" },
      { chinese: "跳", pinyin: "tiào", english: "to jump" },
      { chinese: "舞", pinyin: "wǔ", english: "dance" },
      { chinese: "听", pinyin: "tīng", english: "to listen" },
      { chinese: "音乐", pinyin: "yīn yuè", english: "music" },
      { chinese: "书", pinyin: "shū", english: "book" },
      { chinese: "对", pinyin: "duì", english: "right; correct" },
      { chinese: "有的", pinyin: "yǒu de", english: "some" },
      { chinese: "时候", pinyin: "shí hou", english: "(a point in) time; moment; (a duration of) time" },
      { chinese: "电影", pinyin: "diàn yǐng", english: "movie" },
      { chinese: "影", pinyin: "yǐng", english: "shadow" },
      { chinese: "常常", pinyin: "cháng cháng", english: "often" },
      { chinese: "那", pinyin: "nà", english: "in that case; then" },
      { chinese: "去", pinyin: "qù", english: "to go" },
      { chinese: "外国", pinyin: "wài guó", english: "foreign country" },
      { chinese: "请客", pinyin: "qǐng kè", english: "to invite someone (to dinner, coffee, etc.); to play the host" },
      { chinese: "昨天", pinyin: "zuó tiān", english: "yesterday" },
      { chinese: "所以", pinyin: "suǒ yǐ", english: "so" },
      { chinese: "小", pinyin: "xiǎo", english: "small; little" },
      { chinese: "好久", pinyin: "hǎo jiǔ", english: "a long time" },
      { chinese: "好", pinyin: "hǎo", english: "very" },
      { chinese: "久", pinyin: "jiǔ", english: "long (of time)" },
      { chinese: "不错", pinyin: "bú cuò", english: "pretty good" },
      { chinese: "错", pinyin: "cuò", english: "wrong" },
      { chinese: "想", pinyin: "xiǎng", english: "to want to; would like to; to think" },
      { chinese: "觉得", pinyin: "jué de", english: "to feel; to think" },
      { chinese: "有意思", pinyin: "yǒu yì si", english: "interesting" },
      { chinese: "意思", pinyin: "yì si", english: "meaning" },
      { chinese: "只", pinyin: "zhǐ", english: "only" },
      { chinese: "睡觉", pinyin: "shuì jiào", english: "to sleep" },
      { chinese: "睡", pinyin: "shuì", english: "to sleep" },
      { chinese: "觉", pinyin: "jiào", english: "sleep" },
      { chinese: "算了", pinyin: "suàn le", english: "forget it; never mind" },
      { chinese: "找", pinyin: "zhǎo", english: "to look for" },
      { chinese: "别人", pinyin: "bié rén", english: "other people; another person" },
      { chinese: "别的", pinyin: "bié de", english: "other" },
      { chinese: "现在", pinyin: "xiàn zài", english: "now" }
    ]
  },
  {
    id: "ic-lesson5",
    name: "Integrated Chinese Lesson 5",
    description: "Visiting Friends - 35 conversational expressions",
    category: "Integrated Chinese",
    words: [
      { chinese: "呀", pinyin: "ya", english: "(interjectory particle used to soften a question)" },
      { chinese: "进", pinyin: "jìn", english: "to enter" },
      { chinese: "快", pinyin: "kuài", english: "fast; quick; quickly" },
      { chinese: "进来", pinyin: "jìn lai", english: "to come in" },
      { chinese: "来", pinyin: "lái", english: "to come" },
      { chinese: "介绍", pinyin: "jiè shào", english: "to introduce" },
      { chinese: "一下", pinyin: "yí xià", english: "once; a bit" },
      { chinese: "高兴", pinyin: "gāo xìng", english: "happy; pleased" },
      { chinese: "漂亮", pinyin: "piào liang", english: "pretty" },
      { chinese: "坐", pinyin: "zuò", english: "to sit" },
      { chinese: "在", pinyin: "zài", english: "at; in; on" },
      { chinese: "哪儿", pinyin: "nǎr", english: "where" },
      { chinese: "学校", pinyin: "xué xiào", english: "school" },
      { chinese: "喝", pinyin: "hē", english: "to drink" },
      { chinese: "点儿", pinyin: "diǎnr", english: "a little; a bit; some" },
      { chinese: "茶", pinyin: "chá", english: "tea" },
      { chinese: "咖啡", pinyin: "kā fēi", english: "coffee" },
      { chinese: "吧", pinyin: "ba", english: "(a sentence-final particle)" },
      { chinese: "要", pinyin: "yào", english: "to want" },
      { chinese: "瓶", pinyin: "píng", english: "(measure word for bottles); bottle" },
      { chinese: "可乐", pinyin: "kě lè", english: "[Coke or Pepsi] cola" },
      { chinese: "可以", pinyin: "kě yǐ", english: "can; may" },
      { chinese: "对不起", pinyin: "duì bu qǐ", english: "sorry" },
      { chinese: "给", pinyin: "gěi", english: "to give" },
      { chinese: "杯", pinyin: "bēi", english: "(measure word for cup and glass)" },
      { chinese: "水", pinyin: "shuǐ", english: "water" },
      { chinese: "高小音", pinyin: "Gāo Xiǎo yīn", english: "(a personal name)" },
      { chinese: "玩儿", pinyin: "wánr", english: "to have fun; to play" },
      { chinese: "了", pinyin: "le", english: "(a dynamic particle)" },
      { chinese: "图书馆", pinyin: "tú shū guǎn", english: "library" },
      { chinese: "一起", pinyin: "yì qǐ", english: "together" },
      { chinese: "聊天儿", pinyin: "liáo tiānr", english: "to chat" },
      { chinese: "聊", pinyin: "liáo", english: "to chat" },
      { chinese: "天", pinyin: "tiān", english: "sky" },
      { chinese: "才", pinyin: "cái", english: "not until; only then" },
      { chinese: "回家", pinyin: "huí jiā", english: "to go home" },
      { chinese: "回", pinyin: "huí", english: "to return" }
    ]
  },
  {
    id: "ic-lesson6",
    name: "Integrated Chinese Lesson 6",
    description: "Making Appointments - 48 conversation and scheduling terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "给", pinyin: "gěi", english: "to; for" },
      { chinese: "打电话", pinyin: "dǎ diàn huà", english: "to make a phone call" },
      { chinese: "电话", pinyin: "diàn huà", english: "telephone" },
      { chinese: "喂", pinyin: "wéi/wèi", english: "(on telephone) Hello! Hey!" },
      { chinese: "在", pinyin: "zài", english: "to be present; to be at (a place)" },
      { chinese: "就", pinyin: "jiù", english: "precisely; exactly" },
      { chinese: "您", pinyin: "nín", english: "you (honorific for 你)" },
      { chinese: "哪", pinyin: "nǎ/něi", english: "which" },
      { chinese: "位", pinyin: "wèi", english: "(polite measure word for people)" },
      { chinese: "下午", pinyin: "xià wǔ", english: "afternoon" },
      { chinese: "时间", pinyin: "shí jiān", english: "time" },
      { chinese: "问题", pinyin: "wèn tí", english: "question; problem" },
      { chinese: "要", pinyin: "yào", english: "will; be going to; to want to; to have a desire to" },
      { chinese: "开会", pinyin: "kāi huì", english: "to have a meeting" },
      { chinese: "开", pinyin: "kāi", english: "to open; to hold (a meeting, party, etc.)" },
      { chinese: "会", pinyin: "huì", english: "meeting" },
      { chinese: "上午", pinyin: "shàng wǔ", english: "morning" },
      { chinese: "节", pinyin: "jié", english: "(measure word for class periods)" },
      { chinese: "课", pinyin: "kè", english: "class; course; lesson" },
      { chinese: "年级", pinyin: "nián jí", english: "grade in school" },
      { chinese: "考试", pinyin: "kǎo shì", english: "to give or take a test; test" },
      { chinese: "考", pinyin: "kǎo", english: "to give or take a test" },
      { chinese: "试", pinyin: "shì", english: "test; to try; to experiment" },
      { chinese: "以后", pinyin: "yǐ hòu", english: "after; from now on; later on" },
      { chinese: "空儿", pinyin: "kòngr", english: "free time" },
      { chinese: "要是", pinyin: "yào shi", english: "if" },
      { chinese: "方便", pinyin: "fāng biàn", english: "convenient" },
      { chinese: "到", pinyin: "dào", english: "to go to; to arrive" },
      { chinese: "办公室", pinyin: "bàn gōng shì", english: "office" },
      { chinese: "行", pinyin: "xíng", english: "all right; O.K." },
      { chinese: "等", pinyin: "děng", english: "to wait; to wait for" },
      { chinese: "别", pinyin: "bié", english: "don't" },
      { chinese: "客气", pinyin: "kè qi", english: "polite" },
      { chinese: "常老师", pinyin: "Cháng lǎo shī", english: "Teacher Chang" },
      { chinese: "下个", pinyin: "xià ge", english: "next one" },
      { chinese: "下", pinyin: "xià", english: "below; next" },
      { chinese: "中文", pinyin: "Zhōng wén", english: "Chinese language" },
      { chinese: "文", pinyin: "wén", english: "language; script; written language" },
      { chinese: "帮", pinyin: "bāng", english: "to help" },
      { chinese: "准备", pinyin: "zhǔn bèi", english: "to prepare" },
      { chinese: "练习", pinyin: "liàn xí", english: "to practice" },
      { chinese: "说", pinyin: "shuō", english: "to say; to speak" },
      { chinese: "啊", pinyin: "a", english: "(a sentence-final particle of exclamation, interrogation, etc.)" },
      { chinese: "但是", pinyin: "dàn shì", english: "but" },
      { chinese: "得", pinyin: "děi", english: "must; to have to" },
      { chinese: "跟", pinyin: "gēn", english: "with" },
      { chinese: "见面", pinyin: "jiàn miàn", english: "to meet up; to meet with" },
      { chinese: "面", pinyin: "miàn", english: "face" },
      { chinese: "回来", pinyin: "huí lai", english: "to come back" }
    ]
  },
  {
    id: "ic-lesson7",
    name: "Integrated Chinese Lesson 7",
    description: "Studying Chinese - 40 academic vocabulary words",
    category: "Integrated Chinese",
    words: [
      { chinese: "说话", pinyin: "shuō huà", english: "to talk" },
      { chinese: "话", pinyin: "huà", english: "word; speech" },
      { chinese: "上个", pinyin: "shàng ge", english: "the previous one" },
      { chinese: "得", pinyin: "de", english: "(a structural particle)" },
      { chinese: "复习", pinyin: "fù xí", english: "to review" },
      { chinese: "写", pinyin: "xiě", english: "to write" },
      { chinese: "字", pinyin: "zì", english: "character" },
      { chinese: "慢", pinyin: "màn", english: "slow" },
      { chinese: "枝", pinyin: "zhī", english: "(measure word for long, thin, inflexible objects such as pens, rifles, etc.)" },
      { chinese: "笔", pinyin: "bǐ", english: "pen" },
      { chinese: "张", pinyin: "zhāng", english: "(measure word for flat objects, paper, pictures, etc.)" },
      { chinese: "纸", pinyin: "zhǐ", english: "paper" },
      { chinese: "教", pinyin: "jiāo", english: "to teach" },
      { chinese: "怎么", pinyin: "zěn me", english: "how; how come" },
      { chinese: "懂", pinyin: "dǒng", english: "to understand" },
      { chinese: "真", pinyin: "zhēn", english: "really" },
      { chinese: "哪里", pinyin: "nǎ li", english: "where" },
      { chinese: "预习", pinyin: "yù xí", english: "to preview" },
      { chinese: "学", pinyin: "xué", english: "to study; to learn" },
      { chinese: "第", pinyin: "dì", english: "(prefix for ordinal numbers)" },
      { chinese: "语法", pinyin: "yǔ fǎ", english: "grammar" },
      { chinese: "容易", pinyin: "róng yì", english: "easy" },
      { chinese: "生词", pinyin: "shēng cí", english: "new words; vocabulary" },
      { chinese: "多", pinyin: "duō", english: "many; much" },
      { chinese: "汉字", pinyin: "Hàn zì", english: "Chinese characters" },
      { chinese: "难", pinyin: "nán", english: "difficult" },
      { chinese: "平常", pinyin: "píng cháng", english: "usually" },
      { chinese: "早", pinyin: "zǎo", english: "early" },
      { chinese: "这么", pinyin: "zhè me", english: "so; this (late, etc.)" },
      { chinese: "晚", pinyin: "wǎn", english: "late" },
      { chinese: "早上", pinyin: "zǎo shang", english: "morning" },
      { chinese: "功课", pinyin: "gōng kè", english: "homework; schoolwork" },
      { chinese: "大家", pinyin: "dà jiā", english: "everybody" },
      { chinese: "上课", pinyin: "shàng kè", english: "to go to a class; to start a class; to be in class" },
      { chinese: "开始", pinyin: "kāi shǐ", english: "to begin; to start; beginning" },
      { chinese: "念", pinyin: "niàn", english: "to read aloud" },
      { chinese: "课文", pinyin: "kè wén", english: "text of a lesson" },
      { chinese: "录音", pinyin: "lù yīn", english: "sound recording; to record" },
      { chinese: "学习", pinyin: "xué xí", english: "to study; to learn" },
      { chinese: "帅", pinyin: "shuài", english: "handsome" },
      { chinese: "酷", pinyin: "kù", english: "cool" }
    ]
  },
  {
    id: "ic-lesson8", 
    name: "Integrated Chinese Lesson 8",
    description: "School Life - 40 daily routine and campus vocabulary words",
    category: "Integrated Chinese",
    words: [
      { chinese: "篇", pinyin: "piān", english: "(measure word for essays, articles, etc.)" },
      { chinese: "日记", pinyin: "rì jì", english: "diary" },
      { chinese: "累", pinyin: "lèi", english: "tired" },
      { chinese: "起床", pinyin: "qǐ chuáng", english: "to get up" },
      { chinese: "床", pinyin: "chuáng", english: "bed" },
      { chinese: "洗澡", pinyin: "xǐ zǎo", english: "to take a bath/shower" },
      { chinese: "早饭", pinyin: "zǎo fàn", english: "breakfast" },
      { chinese: "一边", pinyin: "yì biān", english: "simultaneously; at the same time" },
      { chinese: "教室", pinyin: "jiào shì", english: "classroom" },
      { chinese: "发音", pinyin: "fā yīn", english: "pronunciation" },
      { chinese: "新", pinyin: "xīn", english: "new" },
      { chinese: "电脑", pinyin: "diàn nǎo", english: "computer" },
      { chinese: "脑", pinyin: "nǎo", english: "brain" },
      { chinese: "中午", pinyin: "zhōng wǔ", english: "noon" },
      { chinese: "餐厅", pinyin: "cān tīng", english: "dining room; cafeteria" },
      { chinese: "午饭", pinyin: "wǔ fàn", english: "lunch; midday meal" },
      { chinese: "上网", pinyin: "shàng wǎng", english: "to go online; to surf the internet" },
      { chinese: "宿舍", pinyin: "sù shè", english: "dormitory" },
      { chinese: "那儿", pinyin: "nàr", english: "there" },
      { chinese: "正在", pinyin: "zhèng zài", english: "in the middle of (doing something)" },
      { chinese: "以前", pinyin: "yǐ qián", english: "before" },
      { chinese: "告诉", pinyin: "gào su", english: "to tell" },
      { chinese: "已经", pinyin: "yǐ jīng", english: "already" },
      { chinese: "知道", pinyin: "zhī dào", english: "to know" },
      { chinese: "封", pinyin: "fēng", english: "(measure word for letters)" },
      { chinese: "信", pinyin: "xìn", english: "letter (correspondence)" },
      { chinese: "最近", pinyin: "zuì jìn", english: "recently" },
      { chinese: "最", pinyin: "zuì", english: "(of superlative degree; most, -est)" },
      { chinese: "近", pinyin: "jìn", english: "close; near" },
      { chinese: "学期", pinyin: "xué qī", english: "school term; semester/quarter" },
      { chinese: "除了...以外", pinyin: "chú le...yǐ wài", english: "in addition to; besides" },
      { chinese: "专业", pinyin: "zhuān yè", english: "major (in college); specialty" },
      { chinese: "会", pinyin: "huì", english: "can; know how to" },
      { chinese: "后来", pinyin: "hòu lái", english: "later" },
      { chinese: "音乐会", pinyin: "yīn yuè huì", english: "concert" },
      { chinese: "希望", pinyin: "xī wàng", english: "to hope; hope" },
      { chinese: "能", pinyin: "néng", english: "can; to be able to" },
      { chinese: "用", pinyin: "yòng", english: "to use" },
      { chinese: "笑", pinyin: "xiào", english: "to laugh at; to laugh; to smile" },
      { chinese: "祝", pinyin: "zhù", english: "to wish (well)" }
    ]
  },
  {
    id: "hsk3",
    name: "HSK Level 3 Vocabulary",
    description: "45 essential intermediate words",
    category: "HSK",
    words: [
      { chinese: "汉语", pinyin: "hàn yǔ", english: "Chinese language" },
      { chinese: "意思", pinyin: "yì sī", english: "meaning" },
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
      { chinese: "便宜", pinyin: "pián yí", english: "cheap" }
    ]
  },
  {
    id: "business",
    name: "Business Chinese",
    description: "30 essential terms for professional settings",
    category: "Topics",
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
    category: "Topics",
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
    id: "ic-lesson9",
    name: "Integrated Chinese Lesson 9",
    description: "Shopping - 50 shopping and money-related terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "商店", pinyin: "shāng diàn", english: "store; shop" },
      { chinese: "买", pinyin: "mǎi", english: "to buy" },
      { chinese: "东西", pinyin: "dōng xi", english: "things; objects" },
      { chinese: "售货员", pinyin: "shòu huò yuán", english: "shop assistant; salesclerk" },
      { chinese: "衣服", pinyin: "yī fu", english: "clothes" },
      { chinese: "件", pinyin: "jiàn", english: "(measure word for shirts, dresses, jackets, coats, etc.)" },
      { chinese: "衬衫", pinyin: "chèn shān", english: "shirt" },
      { chinese: "颜色", pinyin: "yán sè", english: "color" },
      { chinese: "黄", pinyin: "huáng", english: "yellow" },
      { chinese: "红", pinyin: "hóng", english: "red" },
      { chinese: "穿", pinyin: "chuān", english: "to wear; to put on" },
      { chinese: "条", pinyin: "tiáo", english: "(measure word for pants and long, thin objects)" },
      { chinese: "裤子", pinyin: "kù zi", english: "pants" },
      { chinese: "号", pinyin: "hào", english: "size" },
      { chinese: "中", pinyin: "zhōng", english: "medium; middle" },
      { chinese: "便宜", pinyin: "pián yi", english: "cheap; inexpensive" },
      { chinese: "如果...的话", pinyin: "rú guǒ...de huà", english: "if" },
      { chinese: "长度", pinyin: "cháng duǎn", english: "length" },
      { chinese: "长", pinyin: "cháng", english: "long" },
      { chinese: "短", pinyin: "duǎn", english: "short" },
      { chinese: "合适", pinyin: "hé shì", english: "suitable" },
      { chinese: "试", pinyin: "shì", english: "to try" },
      { chinese: "不用", pinyin: "bù yòng", english: "need not" },
      { chinese: "一共", pinyin: "yí gòng", english: "altogether" },
      { chinese: "多少钱", pinyin: "duō shao qián", english: "how much/many" },
      { chinese: "钱", pinyin: "qián", english: "money" },
      { chinese: "块", pinyin: "kuài", english: "(measure word for the basic Chinese monetary unit)" },
      { chinese: "毛", pinyin: "máo", english: "(measure word for 1/10 of a kuài, dime [in US money])" },
      { chinese: "分", pinyin: "fēn", english: "(measure word for 1/100 of a kuài, cent)" },
      { chinese: "百", pinyin: "bǎi", english: "hundred" },
      { chinese: "找钱", pinyin: "zhǎo qián", english: "to give change" },
      { chinese: "双", pinyin: "shuāng", english: "(measure word for a pair)" },
      { chinese: "鞋", pinyin: "xié", english: "shoes" },
      { chinese: "换", pinyin: "huàn", english: "to exchange; to change" },
      { chinese: "一样", pinyin: "yí yàng", english: "same; alike" },
      { chinese: "虽然", pinyin: "suī rán", english: "although" },
      { chinese: "大小", pinyin: "dà xiǎo", english: "size" },
      { chinese: "咖啡色", pinyin: "kā fēi sè", english: "brown; coffee color" },
      { chinese: "种", pinyin: "zhǒng", english: "(measure word for kinds, sorts, types)" },
      { chinese: "黑", pinyin: "hēi", english: "black" },
      { chinese: "样子", pinyin: "yàng zi", english: "style" },
      { chinese: "挺", pinyin: "tǐng", english: "very; rather" },
      { chinese: "它", pinyin: "tā", english: "it" },
      { chinese: "这儿", pinyin: "zhèr", english: "here" },
      { chinese: "刷卡", pinyin: "shuā kǎ", english: "to pay with a credit card" },
      { chinese: "刷", pinyin: "shuā", english: "to brush; to swipe" },
      { chinese: "卡", pinyin: "kǎ", english: "card" },
      { chinese: "收", pinyin: "shōu", english: "to receive; to accept" },
      { chinese: "信用卡", pinyin: "xìn yòng kǎ", english: "credit card" },
      { chinese: "不过", pinyin: "bú guò", english: "however; but" },
      { chinese: "再", pinyin: "zài", english: "again" },
      { chinese: "付钱", pinyin: "fù qián", english: "to pay money" },
      { chinese: "付", pinyin: "fù", english: "to pay" }
    ]
  },
  {
    id: "emotions",
    name: "Emotions & Feelings",
    description: "30 words to express emotions and feelings",
    category: "Topics",
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
    category: "Topics",
    words: [
      { chinese: "医生", pinyin: "yī shēng", english: "doctor" },
      { chinese: "护士", pinyin: "hù shì", english: "nurse" },
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
      { chinese: "咳嗽", pinyin: "ké sòu", english: "cough" },
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
    id: "ic-lesson10",
    name: "Integrated Chinese Lesson 10",
    description: "Transportation - 45 travel and transportation terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "寒假", pinyin: "hán jià", english: "winter vacation" },
      { chinese: "飞机", pinyin: "fēi jī", english: "airplane" },
      { chinese: "飞", pinyin: "fēi", english: "to fly" },
      { chinese: "机", pinyin: "jī", english: "machine" },
      { chinese: "票", pinyin: "piào", english: "ticket" },
      { chinese: "飞机场", pinyin: "fēi jī chǎng", english: "airport" },
      { chinese: "坐", pinyin: "zuò", english: "to travel by" },
      { chinese: "公共汽车", pinyin: "gōng gòng qì chē", english: "bus" },
      { chinese: "公共", pinyin: "gōng gòng", english: "public" },
      { chinese: "汽车", pinyin: "qì chē", english: "automobile" },
      { chinese: "车", pinyin: "chē", english: "vehicle; car" },
      { chinese: "或者", pinyin: "huò zhě", english: "or" },
      { chinese: "地铁", pinyin: "dì tiě", english: "subway" },
      { chinese: "走", pinyin: "zǒu", english: "to go by way of; to walk" },
      { chinese: "先", pinyin: "xiān", english: "first" },
      { chinese: "站", pinyin: "zhàn", english: "(measure word for stops of bus, train, etc.)" },
      { chinese: "下车", pinyin: "xià chē", english: "to get off (a bus, train, etc.)" },
      { chinese: "然后", pinyin: "rán hòu", english: "then" },
      { chinese: "绿", pinyin: "lǜ", english: "green" },
      { chinese: "线", pinyin: "xiàn", english: "line" },
      { chinese: "最后", pinyin: "zuì hòu", english: "final; last" },
      { chinese: "蓝", pinyin: "lán", english: "blue" },
      { chinese: "麻烦", pinyin: "má fan", english: "troublesome" },
      { chinese: "打车", pinyin: "dǎ chē", english: "to take a taxi" },
      { chinese: "出租汽车", pinyin: "chū zū qì chē", english: "taxi" },
      { chinese: "出租", pinyin: "chū zū", english: "to rent out; to let" },
      { chinese: "租", pinyin: "zū", english: "to rent" },
      { chinese: "开车", pinyin: "kāi chē", english: "to drive a car" },
      { chinese: "开", pinyin: "kāi", english: "to drive; to operate" },
      { chinese: "送", pinyin: "sòng", english: "to see off or out; to take (someone somewhere)" },
      { chinese: "电子邮件", pinyin: "diàn zǐ yóu jiàn", english: "email" },
      { chinese: "电子", pinyin: "diàn zǐ", english: "electron" },
      { chinese: "让", pinyin: "ràng", english: "to allow or cause (somebody to do something)" },
      { chinese: "花", pinyin: "huā", english: "to spend" },
      { chinese: "不好意思", pinyin: "bù hǎo yì si", english: "to feel embarrassed" },
      { chinese: "每", pinyin: "měi", english: "every; each" },
      { chinese: "城市", pinyin: "chéng shì", english: "city" },
      { chinese: "特别", pinyin: "tè bié", english: "especially" },
      { chinese: "高速公路", pinyin: "gāo sù gōng lù", english: "highway" },
      { chinese: "高速", pinyin: "gāo sù", english: "high speed" },
      { chinese: "公路", pinyin: "gōng lù", english: "highway; public road" },
      { chinese: "路", pinyin: "lù", english: "road; path" },
      { chinese: "紧张", pinyin: "jǐn zhāng", english: "nervous; anxious" },
      { chinese: "自己", pinyin: "zì jǐ", english: "oneself" },
      { chinese: "手机", pinyin: "shǒu jī", english: "cell phone" },
      { chinese: "发短信", pinyin: "fā duǎn xìn", english: "to send a text message" },
      { chinese: "新年", pinyin: "xīn nián", english: "new year" },
      { chinese: "快乐", pinyin: "kuài lè", english: "happy" }
    ]
  },
  {
    id: "weather",
    name: "Weather & Seasons",
    description: "20 common weather expressions",
    category: "Topics",
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
      { chinese: "凉快", pinyin: "liáng kuài", english: "cool" },
      { chinese: "温暖", pinyin: "wēn nuǎn", english: "warm" },
      { chinese: "寒冷", pinyin: "hán lěng", english: "cold" },
      { chinese: "炎热", pinyin: "yán rè", english: "hot" }
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
    onSuccess: (_, deletedId) => {
      // Perform a background refetch to refresh the data after deletion
      queryClient.refetchQueries({ queryKey: ['/api/vocabulary'] });
      
      toast({
        title: "Word removed",
        description: "The word has been removed from your vocabulary list.",
        variant: "default",
      });
    },
    onError: () => {
      // If there was an error, make sure to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Error removing word",
        description: "There was a problem removing the word.",
        variant: "destructive",
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
        description = `All ${originalCount} words now in your vocabulary. ${duplicateCount} ${duplicateCount === 1 ? 'word was' : 'words were'} already present and updated.`;
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

  // Fix to ensure removing a homophone doesn't affect the display of other homophones
  const handleRemoveWord = (id: number) => {
    // Get the current vocabulary data before deleting
    const currentVocabulary = queryClient.getQueryData(['/api/vocabulary']) as any[];
    
    if (currentVocabulary && Array.isArray(currentVocabulary)) {
      // Create a filtered list that doesn't include the word being deleted
      const filteredVocabulary = currentVocabulary.filter(word => word.id !== id);
      
      // Update the query cache with this filtered list (optimistic update)
      queryClient.setQueryData(['/api/vocabulary'], filteredVocabulary);
      
      // Also update proficiency data for the removed word
      const updatedProficiencyData = { ...proficiencyData };
      delete updatedProficiencyData[id];
      setProficiencyData(updatedProficiencyData);
    }
    
    // Then perform the server-side deletion
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
          description = `All ${originalCount} selected words now in your vocabulary. ${duplicateCount} ${duplicateCount === 1 ? 'word was' : 'words were'} already present and updated.`;
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
  
  // Chinese pronoun homophones that should be treated specially
  const chinesePronouns = ['他', '她', '它']; // he, she, it - all sound identical

  // Define the type for homophone groups
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
  
  // Simplified group words by homophone (same pinyin without tones)
  const getHomophoneGroups = (words: any[]): HomophoneGroup[] => {
    if (!Array.isArray(words) || words.length === 0) return [];
    
    // First, handle pronouns (他/她/它) separately
    const pronouns = words.filter(word => chinesePronouns.includes(word.chinese));
    const nonPronouns = words.filter(word => !chinesePronouns.includes(word.chinese));
    
    // Create groups by normalized pinyin
    const pinyinGroups: Record<string, any[]> = {};
    
    // Group non-pronouns by pinyin
    nonPronouns.forEach(word => {
      if (!word.pinyin) return;
      
      const normalizedPinyin = normalizePinyin(word.pinyin);
      if (!pinyinGroups[normalizedPinyin]) {
        pinyinGroups[normalizedPinyin] = [];
      }
      pinyinGroups[normalizedPinyin].push(word);
    });
    
    // Turn the pinyinGroups object into an array of groups
    const result: HomophoneGroup[] = Object.values(pinyinGroups)
      .filter(group => group.length > 1) // Only include groups with multiple words
      .map(group => ({ type: 'pinyin', words: group }));
    
    // Add pronouns as a separate group if there are at least 2
    if (pronouns.length > 1) {
      result.unshift({ type: 'pronoun', words: pronouns });
    }
    
    return result;
  };
  
  // Function to convert Chinese characters to pinyin using a mapping (simplified version)
  const chineseToPinyinMap: Record<string, string[]> = {
    '我': ['wo'],
    '你': ['ni'],
    '他': ['ta'],
    '她': ['ta'],
    '它': ['ta'],
    '们': ['men'],
    '是': ['shi'],
    '的': ['de'],
    '人': ['ren'],
    '有': ['you'],
    '在': ['zai'],
    '个': ['ge'],
    '好': ['hao'],
    '来': ['lai'],
    '这': ['zhe'],
    '去': ['qu'],
    '了': ['le'],
    '不': ['bu'],
    '会': ['hui'],
    '想': ['xiang'],
    '能': ['neng'],
    '吗': ['ma'],
    '做': ['zuo'],
    '说': ['shuo'],
    '看': ['kan'],
    '中': ['zhong'],
    '文': ['wen'],
    '和': ['he'],
    '什': ['shen'],
    '么': ['me'],
    '学': ['xue'],
    '习': ['xi'],
    '喜': ['xi'],
    '欢': ['huan'],
    '吃': ['chi'],
    '饭': ['fan'],
    '水': ['shui'],
    '茶': ['cha'],
    '工': ['gong'],
    '作': ['zuo'],
    '家': ['jia'],
    '大': ['da'],
    '小': ['xiao'],
    '多': ['duo'],
    '少': ['shao'],
    '朋': ['peng'],
    '友': ['you'],
    '年': ['nian'],
    '月': ['yue'],
    '日': ['ri'],
    '时': ['shi'],
    '分': ['fen'],
    '秒': ['miao'],
    '明': ['ming'],
    '天': ['tian'],
    '昨': ['zuo'],
    '今': ['jin'],
    '谢': ['xie'],
    '对': ['dui'],
    '起': ['qi'],
    '请': ['qing'],
    '再': ['zai'],
    '见': ['jian'],
  };

  // Function to attempt converting search query to pinyin or vice versa
  const getPossibleSearchPatterns = (query: string): string[] => {
    const result: string[] = [query]; // Always include original query
    
    // 1. If query is likely Chinese characters
    if (/[\u4e00-\u9fa5]/.test(query)) {
      // Try to convert each character to its pinyin
      const possiblePinyin = Array.from(query)
        .map(char => chineseToPinyinMap[char] || [char])
        .reduce((acc, curr) => {
          if (acc.length === 0) return curr;
          const newAcc: string[] = [];
          acc.forEach(a => {
            curr.forEach(c => {
              newAcc.push(a + c);
            });
          });
          return newAcc;
        }, [] as string[]);
      
      result.push(...possiblePinyin);
    } 
    // 2. If query is likely pinyin (latin characters)
    else if (/^[a-z]+$/i.test(query)) {
      // Find Chinese characters that match this pinyin
      Object.entries(chineseToPinyinMap).forEach(([char, pinyinOptions]) => {
        if (pinyinOptions.some(p => p.includes(query))) {
          result.push(char);
        }
      });
    }
    
    return result;
  };

  // Function to filter vocabulary based on search query
  const filterVocabulary = (words: any[]) => {
    if (!searchQuery.trim() || !Array.isArray(words)) {
      return words;
    }
    
    const query = searchQuery.toLowerCase();
    const possiblePatterns = getPossibleSearchPatterns(query);
    
    return words.filter(word => {
      // Check original fields
      if (
        word.chinese.toLowerCase().includes(query) || 
        word.pinyin.toLowerCase().includes(query) || 
        word.english.toLowerCase().includes(query)
      ) {
        return true;
      }
      
      // Check against all possible search patterns
      for (const pattern of possiblePatterns) {
        if (pattern !== query) { // Skip original query as we already checked it
          if (
            word.chinese.toLowerCase().includes(pattern) || 
            word.pinyin.toLowerCase().includes(pattern) ||
            word.english.toLowerCase().includes(pattern)
          ) {
            return true;
          }
        }
      }
      
      return false;
    });
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
    // We now only check the Chinese character to match how the server merges words
    wordList.words.forEach(listWord => {
      const isImported = vocabulary.some(vocabWord => 
        vocabWord.chinese === listWord.chinese
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
              <div>
                <h3 className="text-xl font-semibold">{previewList.name}</h3>
                <div className="flex items-center text-sm mt-1">
                  {previewList.category && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-xs mr-2 font-medium">
                      {previewList.category}
                    </span>
                  )}
                  <span className="text-gray-700 dark:text-white">{previewList.description}</span>
                </div>
              </div>
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
                <span className="ml-4 text-sm font-medium text-gray-800 dark:text-white">
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
                        <div className="text-xs text-gray-700 dark:text-gray-200 font-medium">{word.pinyin}</div>
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
    
      <Card className="mb-6 border-border overflow-hidden">
        <CardHeader className="sticky top-0 opaque-header">
          <CardTitle>Your Vocabulary Words</CardTitle>
          <CardDescription className="text-white">Add the Mandarin words you want to practice</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <label htmlFor="word-input" className="block text-sm font-bold mb-2">
              Add Words (one per line)
            </label>
            <div className="relative">
              <Textarea
                id="word-input"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                rows={6}
                placeholder="学习 (xuéxí) - to study"
                className="w-full px-4 py-3 rounded-md bg-background border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary/50 font-medium leading-normal"
              />
              {/* Removed misaligned decorative line */}
            </div>
            <p className="text-sm text-foreground/70 mt-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
                <path d="M12 3c-1.2 0-2.4.6-3 1.7A4 4 0 0 0 9 12a4 4 0 0 1 1 7.3A4 4 0 0 0 12 21a4 4 0 0 0 2-7.3A4 4 0 0 1 15 6a4 4 0 0 0-.1-1.3c-.5-1.1-1.7-1.7-2.9-1.7Z"></path>
              </svg>
              Format: Chinese characters (pinyin) - English meaning
            </p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
              <h3 className="text-lg font-bold">
                Current Word List
              </h3>
              <div className="flex items-center px-3 py-1.5">
                <span className="text-sm flex items-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Group Homophones
                </span>
                <button 
                  type="button"
                  className={`relative w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    groupByHomophones ? "bg-primary" : "bg-foreground/20"
                  }` as string}
                  onClick={() => setGroupByHomophones(!groupByHomophones)}
                  aria-label={groupByHomophones ? "Disable homophone grouping" : "Enable homophone grouping"}
                >
                  <div
                    className={`bg-background h-4 w-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      groupByHomophones ? "translate-x-5" : "translate-x-0"
                    }` as string}
                  ></div>
                </button>
              </div>
            </div>
            
            {/* Search input */}
            {vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
              <div className="relative mb-5 mt-2">
                <div className="text-sm font-bold mb-1">
                  Search Words
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Chinese character (我) or pinyin (wo)"
                  className="w-full px-10 py-2.5 border-2 border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors font-medium"
                  title="Type either Chinese characters or pinyin to search. For example, typing '我' will find words with '我', and typing 'wo' will find words with the pinyin 'wo'."
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 top-6">
                  <div className="group relative">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary cursor-help">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 hidden group-hover:block bg-card border border-border text-black dark:text-white text-xs rounded-md py-2 px-3 w-64 z-10 shadow-md font-medium">
                      You can search by typing either Chinese characters or pinyin. The search is smart enough to find matching words regardless of which you use.
                    </div>
                  </div>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 top-6 text-primary/60 hover:text-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            ) : null}
            
            {isLoading ? (
              <div className="flex flex-wrap gap-2 mb-4">
                <p>Loading vocabulary...</p>
              </div>
            ) : vocabulary && Array.isArray(vocabulary) && vocabulary.length > 0 ? (
              // Check if there are any results after filtering
              filterVocabulary(vocabulary).length === 0 ? (
                <div className="text-gray-900 dark:text-white italic mb-4 font-medium">
                  No words match your search query.
                </div>
              ) : (
              groupByHomophones ? (
                // Homophone grouping mode - new implementation
                <div className="space-y-4 mb-4">
                  {/* Display homophone groups */}
                  {getHomophoneGroups(filterVocabulary(vocabulary)).map((group, index) => (
                    <div key={index} className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md">
                      <h4 className="text-md font-bold mb-3 text-primary flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                        </svg>
                        {group.type === 'pronoun' 
                          ? <span><span className="font-bold">tā</span> - Pronoun Homophones (他/她/它)</span> 
                          : <span><span className="font-bold">{normalizePinyin(group.words[0].pinyin)}</span> - Homophones</span>}
                      </h4>
                      <div className="flex flex-wrap gap-2.5 ml-1">
                        {group.words.map((word) => (
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
                  
                  {/* Display words without homophones */}
                  {(() => {
                    // Get filtered vocabulary
                    const filteredVocab = filterVocabulary(vocabulary);
                    
                    // Get all words that are in homophone groups
                    const homophoneGroups = getHomophoneGroups(filteredVocab);
                    const wordsInHomophoneGroups = homophoneGroups.flatMap(group => 
                      group.words.map(word => word.id)
                    );
                    
                    // Find words that aren't in any homophone group
                    const singleWords = filteredVocab.filter(word => 
                      !wordsInHomophoneGroups.includes(word.id)
                    );
                    
                    return singleWords.length > 0 ? (
                      <div className="border-2 border-border rounded-md p-4 bg-accent/10 shadow-md">
                        <h4 className="text-md font-bold mb-3 text-primary flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                            <path d="M7 20h10"></path>
                            <path d="M10 20c5.5-2.5.8-6.4 3-10"></path>
                            <path d="M9.5 9.4c1.1.8 1.8 1.7 2.3 3.7"></path>
                            <path d="M14.1 6a7 7 0 0 0-4.2 0"></path>
                          </svg>
                          Words without homophones
                        </h4>
                        <div className="flex flex-wrap gap-2.5 ml-1">
                          {singleWords.map((word) => (
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
                    ) : null;
                  })()}
                </div>
              ) : (
                // Normal list mode
                <div className="border-2 border-border rounded-md p-4 mb-4 bg-accent/10 shadow-md">
                  <h4 className="text-md font-bold mb-3 text-primary flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                      <path d="M3 5v14"></path>
                      <path d="M8 5v14"></path>
                      <path d="M12 5v14"></path>
                      <path d="M17 5v14"></path>
                      <path d="M21 5v14"></path>
                    </svg>
                    All Vocabulary Words
                  </h4>
                  <div className="flex flex-wrap gap-2.5 ml-1">
                    {filterVocabulary(vocabulary).map((word) => (
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
              )
              )
            ) : (
              <div className="border-2 border-border rounded-md p-6 mb-4 bg-accent/10 shadow-md text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-primary/50">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect>
                  <path d="M9 22v-4h6v4"></path>
                  <path d="M8 8h8"></path>
                  <path d="M8 12h8"></path>
                  <path d="M8 16h8"></path>
                </svg>
                <p className="text-gray-900 dark:text-white font-semibold mb-1">No words in your vocabulary list yet.</p>
                <p className="text-sm text-gray-900 dark:text-white">Add words above or import a pre-made word list below.</p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between bg-accent border-t border-border opaque-footer">
          <Button
            variant="outline"
            onClick={handleClearWords}
            disabled={isLoading || !vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" x2="10" y1="11" y2="17"></line>
              <line x1="14" x2="14" y1="11" y2="17"></line>
            </svg>
            Clear List
          </Button>
          <Button
            onClick={parseWords}
            disabled={!wordInput.trim()}
            variant="chinese"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save Words
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="border-border overflow-hidden">
        <CardHeader className="bg-accent border-b border-border pb-4 opaque-header">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white mr-2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div>
              <CardTitle className="text-white">
                Suggested Word Lists
              </CardTitle>
              <CardDescription className="text-white/90">Import pre-made lists to get started quickly</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          
          {/* Group word lists by category */}
          {(() => {
            // Extract unique categories
            const categories = Array.from(
              new Set(SAMPLE_WORD_LISTS.map(list => list.category || "Other"))
            ).sort();
            
            return categories.map(category => {
              // Filter lists for current category
              const listsInCategory = SAMPLE_WORD_LISTS.filter(
                list => (list.category || "Other") === category
              );
              
              return (
                <div key={category} className="mb-8">
                  {/* Category header with count */}
                  <div className="flex items-center border-b border-primary/20 pb-3 mb-5">
                    <h4 className="text-xl font-bold text-primary flex items-center">
                      {category === "HSK" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M12 2v8"></path>
                          <path d="m4.93 10.93 1.41 1.41"></path>
                          <path d="M2 18h2"></path>
                          <path d="M20 18h2"></path>
                          <path d="m19.07 10.93-1.41 1.41"></path>
                          <path d="M22 22H2"></path>
                          <path d="m16 8-4 4-4-4"></path>
                          <path d="M16 16a4 4 0 0 0-8 0"></path>
                        </svg>
                      )}
                      {category === "Integrated Chinese" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                      )}
                      {category === "Topics" && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                        </svg>
                      )}
                      {category}
                    </h4>
                    <div className="ml-2 px-3 py-1.5 rounded-md bg-accent/30 border-2 border-primary/30 text-sm font-bold text-primary shadow-sm">
                      {listsInCategory.length} sets
                    </div>
                  </div>
                  
                  {/* Lists in this category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {listsInCategory.map((list) => {
                      const { total, imported } = getWordListStats(list.id);
                      return (
                        <div key={list.id} className="border-2 border-border rounded-md p-4 bg-accent/10 hover:border-primary/50 hover:bg-accent/20 transition-all shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-primary text-lg">{list.name}</h4>
                            <div className="text-sm px-3 py-1.5 rounded-md border-2 border-primary/30 bg-background shadow-sm">
                              <span className={imported === total ? "text-green-600 font-bold" : "text-primary font-bold"}>
                                {imported}/{total} words added
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white mb-3 font-medium">{list.description}</p>
                          <div className="flex gap-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-sm border-primary/50 text-primary hover:bg-primary/10"
                              onClick={() => handleShowPreview(list.id)}
                            >
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                Preview
                              </span>
                            </Button>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-sm text-primary"
                              onClick={() => handleImportWordList(list.id)}
                              disabled={importWordListMutation.isPending || (imported > 0 && imported === total)}
                            >
                              <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
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
                </div>
              );
            });
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
