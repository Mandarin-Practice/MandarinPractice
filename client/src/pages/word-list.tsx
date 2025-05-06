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
    description: "Dates and Time - 31 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "现在", pinyin: "xiàn zài", english: "now; at present" },
      { chinese: "点", pinyin: "diǎn", english: "o'clock; point" },
      { chinese: "分", pinyin: "fēn", english: "minute; part" },
      { chinese: "早上", pinyin: "zǎo shang", english: "morning" },
      { chinese: "上午", pinyin: "shàng wǔ", english: "morning; forenoon" },
      { chinese: "中午", pinyin: "zhōng wǔ", english: "noon" },
      { chinese: "下午", pinyin: "xià wǔ", english: "afternoon" },
      { chinese: "晚上", pinyin: "wǎn shang", english: "evening; night" },
      { chinese: "吃饭", pinyin: "chī fàn", english: "to eat (a meal)" },
      { chinese: "三", pinyin: "sān", english: "three" },
      { chinese: "午饭", pinyin: "wǔ fàn", english: "lunch" },
      { chinese: "太", pinyin: "tài", english: "too; extremely" },
      { chinese: "晚", pinyin: "wǎn", english: "late" },
      { chinese: "早", pinyin: "zǎo", english: "early" },
      { chinese: "回", pinyin: "huí", english: "to return" },
      { chinese: "去", pinyin: "qù", english: "to go" },
      { chinese: "上", pinyin: "shàng", english: "to go to (work, school, etc.)" },
      { chinese: "班", pinyin: "bān", english: "work (as opposed to rest)" },
      { chinese: "行", pinyin: "xíng", english: "all right; OK" },
      { chinese: "想", pinyin: "xiǎng", english: "to want to; would like to" },
      { chinese: "可是", pinyin: "kě shì", english: "but" },
      { chinese: "今天", pinyin: "jīn tiān", english: "today" },
      { chinese: "明天", pinyin: "míng tiān", english: "tomorrow" },
      { chinese: "昨天", pinyin: "zuó tiān", english: "yesterday" },
      { chinese: "星期", pinyin: "xīng qī", english: "week" },
      { chinese: "日", pinyin: "rì", english: "sun; day" },
      { chinese: "月", pinyin: "yuè", english: "moon; month" },
      { chinese: "号", pinyin: "hào", english: "date; day of the month" },
      { chinese: "年", pinyin: "nián", english: "year" },
      { chinese: "几", pinyin: "jǐ", english: "how many; a few" },
      { chinese: "生日", pinyin: "shēng rì", english: "birthday" }
    ]
  },
  {
    id: "ic-lesson04",
    name: "Integrated Chinese Lesson 4",
    description: "Hobbies and activities - 30 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "爱好", pinyin: "ài hào", english: "hobby; interest" },
      { chinese: "什么样", pinyin: "shén me yàng", english: "what kind" },
      { chinese: "的", pinyin: "de", english: "(a possessive or descriptive particle)" },
      { chinese: "运动", pinyin: "yùn dòng", english: "sports; exercise; to move" },
      { chinese: "打", pinyin: "dǎ", english: "to play (a ball game)" },
      { chinese: "网球", pinyin: "wǎng qiú", english: "tennis" },
      { chinese: "喜欢", pinyin: "xǐ huan", english: "to like" },
      { chinese: "乒乓球", pinyin: "pīng pāng qiú", english: "ping-pong; table tennis" },
      { chinese: "足球", pinyin: "zú qiú", english: "soccer" },
      { chinese: "篮球", pinyin: "lán qiú", english: "basketball" },
      { chinese: "打球", pinyin: "dǎ qiú", english: "to play ball" },
      { chinese: "因为", pinyin: "yīn wèi", english: "because" },
      { chinese: "所以", pinyin: "suǒ yǐ", english: "so; therefore" },
      { chinese: "觉得", pinyin: "jué de", english: "to think; to feel" },
      { chinese: "很", pinyin: "hěn", english: "very" },
      { chinese: "有意思", pinyin: "yǒu yì si", english: "interesting; meaningful" },
      { chinese: "没意思", pinyin: "méi yì si", english: "boring; not interesting" },
      { chinese: "踢足球", pinyin: "tī zú qiú", english: "to play soccer" },
      { chinese: "为什么", pinyin: "wèi shén me", english: "why" },
      { chinese: "迷", pinyin: "mí", english: "fan" },
      { chinese: "音乐", pinyin: "yīn yuè", english: "music" },
      { chinese: "听音乐", pinyin: "tīng yīn yuè", english: "to listen to music" },
      { chinese: "电影", pinyin: "diàn yǐng", english: "movie" },
      { chinese: "看电影", pinyin: "kàn diàn yǐng", english: "to see a movie" },
      { chinese: "唱歌", pinyin: "chàng gē", english: "to sing (a song)" },
      { chinese: "跳舞", pinyin: "tiào wǔ", english: "to dance" },
      { chinese: "游泳", pinyin: "yóu yǒng", english: "to swim" },
      { chinese: "喝咖啡", pinyin: "hē kā fēi", english: "to drink coffee" },
      { chinese: "咖啡", pinyin: "kā fēi", english: "coffee" },
      { chinese: "跟", pinyin: "gēn", english: "with" }
    ]
  },
  {
    id: "ic-lesson05",
    name: "Integrated Chinese Lesson 5",
    description: "Transportation and directions - 25 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "怎么", pinyin: "zěn me", english: "how" },
      { chinese: "走", pinyin: "zǒu", english: "to walk; to go" },
      { chinese: "远", pinyin: "yuǎn", english: "far" },
      { chinese: "近", pinyin: "jìn", english: "close; near" },
      { chinese: "路", pinyin: "lù", english: "road; way; distance" },
      { chinese: "坐", pinyin: "zuò", english: "to sit; to take (a bus, train, etc.)" },
      { chinese: "公共汽车", pinyin: "gōng gòng qì chē", english: "bus" },
      { chinese: "汽车", pinyin: "qì chē", english: "automobile; car" },
      { chinese: "开", pinyin: "kāi", english: "to drive; to operate" },
      { chinese: "骑", pinyin: "qí", english: "to ride (a bike, a horse, etc.)" },
      { chinese: "自行车", pinyin: "zì xíng chē", english: "bicycle" },
      { chinese: "走路", pinyin: "zǒu lù", english: "to walk" },
      { chinese: "怎么样", pinyin: "zěn me yàng", english: "how about" },
      { chinese: "得", pinyin: "déi/děi", english: "have to; must" },
      { chinese: "要", pinyin: "yào", english: "to want; to need; to be going to" },
      { chinese: "不用", pinyin: "bú yòng", english: "need not" },
      { chinese: "时间", pinyin: "shí jiān", english: "time" },
      { chinese: "快", pinyin: "kuài", english: "fast; quick" },
      { chinese: "慢", pinyin: "màn", english: "slow" },
      { chinese: "半", pinyin: "bàn", english: "half" },
      { chinese: "小时", pinyin: "xiǎo shí", english: "hour" },
      { chinese: "等", pinyin: "děng", english: "to wait" },
      { chinese: "别", pinyin: "bié", english: "don't" },
      { chinese: "地铁", pinyin: "dì tiě", english: "subway" },
      { chinese: "可能", pinyin: "kě néng", english: "may; likely" }
    ]
  },
  {
    id: "ic-lesson06",
    name: "Integrated Chinese Lesson 6",
    description: "Making appointments - 26 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "忙", pinyin: "máng", english: "busy" },
      { chinese: "知道", pinyin: "zhī dào", english: "to know" },
      { chinese: "关于", pinyin: "guān yú", english: "regarding; with regard to" },
      { chinese: "电脑", pinyin: "diàn nǎo", english: "computer" },
      { chinese: "可以", pinyin: "kě yǐ", english: "can; may" },
      { chinese: "帮助", pinyin: "bāng zhù", english: "to help; assistance" },
      { chinese: "介绍", pinyin: "jiè shào", english: "to introduce" },
      { chinese: "高文中", pinyin: "Gāo Wén zhōng", english: "(a person's name)" },
      { chinese: "互联网", pinyin: "hù lián wǎng", english: "Internet" },
      { chinese: "专家", pinyin: "zhuān jiā", english: "expert" },
      { chinese: "没问题", pinyin: "méi wèn tí", english: "no problem" },
      { chinese: "但是", pinyin: "dàn shì", english: "but; however" },
      { chinese: "最好", pinyin: "zuì hǎo", english: "had better; it would be best" },
      { chinese: "先", pinyin: "xiān", english: "first; in advance" },
      { chinese: "给", pinyin: "gěi", english: "to give; for" },
      { chinese: "打电话", pinyin: "dǎ diàn huà", english: "to make a telephone call" },
      { chinese: "号码", pinyin: "hào mǎ", english: "number" },
      { chinese: "手机", pinyin: "shǒu jī", english: "mobile phone; cell phone" },
      { chinese: "然后", pinyin: "rán hòu", english: "then; after that" },
      { chinese: "电子邮件", pinyin: "diàn zǐ yóu jiàn", english: "e-mail" },
      { chinese: "地址", pinyin: "dì zhǐ", english: "address" },
      { chinese: "见面", pinyin: "jiàn miàn", english: "to meet" },
      { chinese: "以后", pinyin: "yǐ hòu", english: "after; later; afterwards" },
      { chinese: "方便", pinyin: "fāng biàn", english: "convenient" },
      { chinese: "找", pinyin: "zhǎo", english: "to look for; to seek" },
      { chinese: "事", pinyin: "shì", english: "matter; affair; business" }
    ]
  },
  {
    id: "ic-lesson07",
    name: "Integrated Chinese Lesson 7",
    description: "Learning Chinese - 28 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "学习", pinyin: "xué xí", english: "to learn; to study" },
      { chinese: "汉语", pinyin: "Hàn yǔ", english: "Chinese (language)" },
      { chinese: "难", pinyin: "nán", english: "difficult" },
      { chinese: "容易", pinyin: "róng yì", english: "easy" },
      { chinese: "语法", pinyin: "yǔ fǎ", english: "grammar" },
      { chinese: "复杂", pinyin: "fù zá", english: "complicated" },
      { chinese: "简单", pinyin: "jiǎn dān", english: "simple; uncomplicated" },
      { chinese: "词语", pinyin: "cí yǔ", english: "word; term" },
      { chinese: "语言", pinyin: "yǔ yán", english: "language" },
      { chinese: "发音", pinyin: "fā yīn", english: "pronunciation" },
      { chinese: "特别", pinyin: "tè bié", english: "especially; particularly" },
      { chinese: "声调", pinyin: "shēng diào", english: "tone" },
      { chinese: "有的", pinyin: "yǒu de", english: "some; there are some who" },
      { chinese: "就是", pinyin: "jiù shì", english: "precisely; exactly; just" },
      { chinese: "写", pinyin: "xiě", english: "to write" },
      { chinese: "汉字", pinyin: "Hàn zì", english: "Chinese character" },
      { chinese: "以前", pinyin: "yǐ qián", english: "before; formerly" },
      { chinese: "开始", pinyin: "kāi shǐ", english: "to begin; to start" },
      { chinese: "觉得", pinyin: "jué de", english: "to feel; to think" },
      { chinese: "不过", pinyin: "bú guò", english: "however; but" },
      { chinese: "有一点儿", pinyin: "yǒu yì diǎn(r)", english: "a little bit" },
      { chinese: "进步", pinyin: "jìn bù", english: "progress; to improve" },
      { chinese: "练习", pinyin: "liàn xí", english: "to practice; exercise" },
      { chinese: "口语", pinyin: "kǒu yǔ", english: "spoken language" },
      { chinese: "啊", pinyin: "ā/á/ǎ/à", english: "(a particle)" },
      { chinese: "着急", pinyin: "zhe jí", english: "to worry; to feel anxious" },
      { chinese: "快", pinyin: "kuài", english: "fast; quick" },
      { chinese: "慢慢", pinyin: "màn màn", english: "slowly" }
    ]
  },
  {
    id: "ic-lesson08",
    name: "Integrated Chinese Lesson 8",
    description: "School life - 33 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "学校", pinyin: "xué xiào", english: "school" },
      { chinese: "在", pinyin: "zài", english: "at; in; on" },
      { chinese: "文学院", pinyin: "wén xué yuàn", english: "College of Liberal Arts" },
      { chinese: "学中文", pinyin: "xué Zhōng wén", english: "to study Chinese" },
      { chinese: "是吗", pinyin: "shì ma", english: "Is that so?" },
      { chinese: "历史", pinyin: "lì shǐ", english: "history" },
      { chinese: "系", pinyin: "xì", english: "department (in a college or university)" },
      { chinese: "年级", pinyin: "nián jí", english: "grade; year (in school)" },
      { chinese: "大学", pinyin: "dà xué", english: "college; university" },
      { chinese: "教授", pinyin: "jiào shòu", english: "professor" },
      { chinese: "怎么样", pinyin: "zěn me yàng", english: "how about; how is/was" },
      { chinese: "都", pinyin: "dōu", english: "all; both" },
      { chinese: "女生", pinyin: "nǚ shēng", english: "female student; schoolgirl" },
      { chinese: "男生", pinyin: "nán shēng", english: "male student; schoolboy" },
      { chinese: "宿舍", pinyin: "sù shè", english: "dormitory" },
      { chinese: "睡觉", pinyin: "shuì jiào", english: "to sleep" },
      { chinese: "每天", pinyin: "měi tiān", english: "every day" },
      { chinese: "很多", pinyin: "hěn duō", english: "many; very much" },
      { chinese: "作业", pinyin: "zuò yè", english: "homework; assignment" },
      { chinese: "跑步", pinyin: "pǎo bù", english: "to run" },
      { chinese: "以为", pinyin: "yǐ wéi", english: "to think (wrongly)" },
      { chinese: "意思", pinyin: "yì si", english: "meaning; idea" },
      { chinese: "课", pinyin: "kè", english: "class; course" },
      { chinese: "这样", pinyin: "zhè yàng", english: "this way; like this" },
      { chinese: "常常", pinyin: "cháng cháng", english: "often; frequently" },
      { chinese: "别人", pinyin: "bié rén", english: "other people" },
      { chinese: "帮忙", pinyin: "bāng máng", english: "to help; to lend a hand" },
      { chinese: "可是", pinyin: "kě shì", english: "but; however" },
      { chinese: "事情", pinyin: "shì qing", english: "matter; affair; thing" },
      { chinese: "晚会", pinyin: "wǎn huì", english: "party; evening entertainment" },
      { chinese: "不好意思", pinyin: "bù hǎo yì si", english: "to feel embarrassed; to be shy" },
      { chinese: "参加", pinyin: "cān jiā", english: "to attend; to take part in" },
      { chinese: "活动", pinyin: "huó dòng", english: "activity" }
    ]
  },
  {
    id: "ic-lesson09",
    name: "Integrated Chinese Lesson 9",
    description: "Shopping - 31 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "商店", pinyin: "shāng diàn", english: "store; shop" },
      { chinese: "想", pinyin: "xiǎng", english: "to want to; would like to" },
      { chinese: "衬衫", pinyin: "chèn shān", english: "shirt" },
      { chinese: "颜色", pinyin: "yán sè", english: "color" },
      { chinese: "红", pinyin: "hóng", english: "red" },
      { chinese: "的", pinyin: "de", english: "(a possessive or descriptive particle)" },
      { chinese: "喜欢", pinyin: "xǐ huan", english: "to like" },
      { chinese: "蓝", pinyin: "lán", english: "blue" },
      { chinese: "白", pinyin: "bái", english: "white" },
      { chinese: "黄", pinyin: "huáng", english: "yellow" },
      { chinese: "黑", pinyin: "hēi", english: "black" },
      { chinese: "还是", pinyin: "hái shì", english: "or" },
      { chinese: "毛衣", pinyin: "máo yī", english: "sweater" },
      { chinese: "穿", pinyin: "chuān", english: "to wear" },
      { chinese: "号", pinyin: "hào", english: "size" },
      { chinese: "大", pinyin: "dà", english: "big; large" },
      { chinese: "小", pinyin: "xiǎo", english: "small" },
      { chinese: "件", pinyin: "jiàn", english: "measure word for shirt, coat, etc." },
      { chinese: "试", pinyin: "shì", english: "to try" },
      { chinese: "啊", pinyin: "a", english: "(exclamatory particle)" },
      { chinese: "觉得", pinyin: "jué de", english: "to feel; to think" },
      { chinese: "怎么样", pinyin: "zěn me yàng", english: "how" },
      { chinese: "太", pinyin: "tài", english: "too" },
      { chinese: "肥", pinyin: "féi", english: "fat" },
      { chinese: "长", pinyin: "cháng", english: "long" },
      { chinese: "瘦", pinyin: "shòu", english: "thin" },
      { chinese: "合适", pinyin: "hé shì", english: "suitable; appropriate" },
      { chinese: "短", pinyin: "duǎn", english: "short" },
      { chinese: "便宜", pinyin: "pián yi", english: "cheap; inexpensive" },
      { chinese: "贵", pinyin: "guì", english: "expensive" },
      { chinese: "块", pinyin: "kuài", english: "unit of money = yuan" }
    ]
  },
  {
    id: "ic-lesson10",
    name: "Integrated Chinese Lesson 10",
    description: "Weather and seasons - 28 essential terms",
    category: "Integrated Chinese",
    words: [
      { chinese: "天气", pinyin: "tiān qì", english: "weather" },
      { chinese: "怎么样", pinyin: "zěn me yàng", english: "how" },
      { chinese: "冷", pinyin: "lěng", english: "cold" },
      { chinese: "今天", pinyin: "jīn tiān", english: "today" },
      { chinese: "有一点儿", pinyin: "yǒu yì diǎn(r)", english: "a little bit" },
      { chinese: "就", pinyin: "jiù", english: "exactly; precisely" },
      { chinese: "去年", pinyin: "qù nián", english: "last year" },
      { chinese: "热", pinyin: "rè", english: "hot" },
      { chinese: "今年", pinyin: "jīn nián", english: "this year" },
      { chinese: "夏天", pinyin: "xià tiān", english: "summer" },
      { chinese: "比", pinyin: "bǐ", english: "than; to compare" },
      { chinese: "舒服", pinyin: "shū fu", english: "comfortable; feeling well" },
      { chinese: "刮风", pinyin: "guā fēng", english: "to be windy" },
      { chinese: "下雨", pinyin: "xià yǔ", english: "to rain" },
      { chinese: "出门", pinyin: "chū mén", english: "to go out" },
      { chinese: "带", pinyin: "dài", english: "to bring" },
      { chinese: "把", pinyin: "bǎ", english: "(a pivotal construction)" },
      { chinese: "伞", pinyin: "sǎn", english: "umbrella" },
      { chinese: "最", pinyin: "zuì", english: "most; -est" },
      { chinese: "冬天", pinyin: "dōng tiān", english: "winter" },
      { chinese: "春天", pinyin: "chūn tiān", english: "spring" },
      { chinese: "秋天", pinyin: "qiū tiān", english: "autumn/fall" },
      { chinese: "下雪", pinyin: "xià xuě", english: "to snow" },
      { chinese: "季节", pinyin: "jì jié", english: "season" },
      { chinese: "明显", pinyin: "míng xiǎn", english: "obvious; notable" },
      { chinese: "度", pinyin: "dù", english: "degree" },
      { chinese: "华氏度", pinyin: "huá shì dù", english: "Fahrenheit degree" },
      { chinese: "摄氏度", pinyin: "shè shì dù", english: "Celsius degree" }
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
  }
];

export default function WordList() {
  const { toast } = useToast();
  const [wordLists, setWordLists] = useState<{ [key: string]: WordList[] }>({});
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [wordListsToShow, setWordListsToShow] = useState<WordList[]>([]);
  const [importText, setImportText] = useState<string>("");
  const [expandedWordLists, setExpandedWordLists] = useState<{ [key: string]: boolean }>({});
  const [wordProficiency, setWordProficiency] = useState<{ [wordId: string]: { correct: number, incorrect: number } }>({});
  
  // Query server for vocabulary
  const { data: vocabularyData } = useQuery({
    queryKey: ['/api/vocabulary'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const queryClient = useQueryClient();
  
  // Mutation for adding vocabulary
  const addWordsMutation = useMutation({
    mutationFn: async (words: { chinese: string, pinyin: string, english: string }[]) => {
      const promises = words.map(word => 
        apiRequest("POST", "/api/vocabulary", {
          ...word,
          pinyin: word.pinyin.replace(/v/g, "ü"),
          active: "true"
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Import successful",
        description: "Words have been added to your vocabulary.",
      });
      setImportText("");
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for deleting vocabulary
  const deleteWordMutation = useMutation({
    mutationFn: async (wordId: number) => {
      return apiRequest("DELETE", `/api/vocabulary/${wordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary'] });
      toast({
        title: "Word removed",
        description: "The word has been removed from your vocabulary.",
      });
    },
    onError: (error) => {
      toast({
        title: "Removal failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Query server for word proficiency
  const { data: proficiencyData } = useQuery({
    queryKey: ['/api/proficiency'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for resetting proficiency
  const resetProficiencyMutation = useMutation({
    mutationFn: async (wordId: number) => {
      return apiRequest("DELETE", `/api/proficiency/${wordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proficiency'] });
      toast({
        title: "Progress reset",
        description: "The word's practice progress has been reset.",
      });
    },
    onError: (error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Initialize word lists and categories
  useEffect(() => {
    // Combine sample word lists with user's vocabulary
    const allWordLists = [...SAMPLE_WORD_LISTS];
    
    // Group word lists by category
    const groupedLists: { [key: string]: WordList[] } = {};
    
    allWordLists.forEach(list => {
      const category = list.category || "Uncategorized";
      if (!groupedLists[category]) {
        groupedLists[category] = [];
      }
      groupedLists[category].push(list);
    });
    
    // Sort categories alphabetically, but keep "Integrated Chinese" first
    const sortedGroups: { [key: string]: WordList[] } = {};
    const sortedKeys = Object.keys(groupedLists).sort((a, b) => {
      if (a === "Integrated Chinese") return -1;
      if (b === "Integrated Chinese") return 1;
      return a.localeCompare(b);
    });
    
    sortedKeys.forEach(key => {
      // Sort lists within each category
      sortedGroups[key] = groupedLists[key].sort((a, b) => {
        // Sort Integrated Chinese lessons by number
        if (a.id.startsWith("ic-lesson") && b.id.startsWith("ic-lesson")) {
          const aNum = parseInt(a.id.replace("ic-lesson", ""));
          const bNum = parseInt(b.id.replace("ic-lesson", ""));
          return aNum - bNum;
        }
        // Sort HSK levels by number
        if (a.id.startsWith("hsk") && b.id.startsWith("hsk")) {
          const aNum = parseInt(a.id.replace("hsk", ""));
          const bNum = parseInt(b.id.replace("hsk", ""));
          return aNum - bNum;
        }
        // Default alpha sort
        return a.name.localeCompare(b.name);
      });
    });
    
    setWordLists(sortedGroups);
    
    // Initialize expanded state for all categories (expanded by default)
    const initialExpanded: { [key: string]: boolean } = {};
    Object.keys(sortedGroups).forEach(cat => {
      initialExpanded[cat] = true;
    });
    setExpandedCategories(initialExpanded);
    
    // Prepare word proficiency data
    if (proficiencyData) {
      const proficiencyMap: { [wordId: string]: { correct: number, incorrect: number } } = {};
      proficiencyData.forEach((item: any) => {
        proficiencyMap[item.wordId] = {
          correct: item.correctCount,
          incorrect: item.incorrectCount
        };
      });
      setWordProficiency(proficiencyMap);
    }
    
  }, [proficiencyData]);

  // Organize user's vocabulary into a list
  useEffect(() => {
    if (vocabularyData && vocabularyData.length > 0) {
      const userWords = vocabularyData.map((word: any) => ({
        chinese: word.chinese,
        pinyin: word.pinyin,
        english: word.english,
        id: word.id,
        active: word.active
      }));
      
      const userWordList: WordList = {
        id: "user-vocabulary",
        name: "My Vocabulary",
        description: `${userWords.length} words you've added`,
        category: "My Lists",
        words: userWords
      };
      
      setWordLists(prev => ({
        ...prev,
        "My Lists": [userWordList]
      }));
    }
  }, [vocabularyData]);

  // Function to toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Function to toggle word list expansion
  const toggleWordList = (listId: string) => {
    setExpandedWordLists(prev => ({
      ...prev,
      [listId]: !prev[listId]
    }));
  };

  // Function to handle import
  const handleImport = () => {
    try {
      const wordsToImport = [];
      const lines = importText.split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(line);
          if (jsonData.chinese && jsonData.pinyin && jsonData.english) {
            wordsToImport.push(jsonData);
            continue;
          }
        } catch (e) {
          // Not JSON, try other formats
        }
        
        // Try tab-separated format
        const tabParts = line.split('\t');
        if (tabParts.length >= 3) {
          wordsToImport.push({
            chinese: tabParts[0].trim(),
            pinyin: tabParts[1].trim(),
            english: tabParts[2].trim()
          });
          continue;
        }
        
        // Try comma-separated format
        const commaParts = line.split(',');
        if (commaParts.length >= 3) {
          wordsToImport.push({
            chinese: commaParts[0].trim(),
            pinyin: commaParts[1].trim(),
            english: commaParts[2].trim()
          });
          continue;
        }
        
        // Try space-separated format (less reliable)
        const spaceParts = line.split(/\s+/);
        if (spaceParts.length >= 3) {
          const chinese = spaceParts[0].trim();
          const pinyin = spaceParts[1].trim();
          const english = spaceParts.slice(2).join(' ').trim();
          
          if (chinese && pinyin && english) {
            wordsToImport.push({ chinese, pinyin, english });
          }
        }
      }
      
      if (wordsToImport.length > 0) {
        addWordsMutation.mutate(wordsToImport);
      } else {
        toast({
          title: "Import failed",
          description: "Could not parse any valid words from the input.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "An error occurred while parsing the input.",
        variant: "destructive",
      });
    }
  };

  // Function to handle adding a word to the user's vocabulary
  const handleAddWord = (word: { chinese: string, pinyin: string, english: string }) => {
    addWordsMutation.mutate([word]);
  };

  // Function to handle deleting a word from the user's vocabulary
  const handleDeleteWord = (wordId: number) => {
    deleteWordMutation.mutate(wordId);
  };
  
  // Function to reset a word's proficiency
  const handleResetProficiency = (wordId: number) => {
    resetProficiencyMutation.mutate(wordId);
  };
  
  // Group words by first pinyin letter for easier browsing
  const groupWordsByPinyin = (words: any[]) => {
    if (!Array.isArray(words) || words.length === 0) return [];
    
    // Create groups by first letter of pinyin
    const pinyinGroups: { [key: string]: any[] } = {};
    
    words.forEach(word => {
      // Normalize pinyin by removing tones and spaces
      const normalizedPinyin = word.pinyin
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .charAt(0)
        .toUpperCase();
      
      if (!pinyinGroups[normalizedPinyin]) {
        pinyinGroups[normalizedPinyin] = [];
      }
      
      pinyinGroups[normalizedPinyin].push(word);
    });
    
    // Sort the keys alphabetically
    const sortedKeys = Object.keys(pinyinGroups).sort();
    
    // Build the result array with headers
    const result: any[] = [];
    
    sortedKeys.forEach(key => {
      result.push({ 
        isHeader: true, 
        value: key 
      });
      
      // Sort words within each group
      const sortedWords = pinyinGroups[key].sort((a, b) => {
        const aPinyin = a.pinyin
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        
        const bPinyin = b.pinyin
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        
        return aPinyin.localeCompare(bPinyin);
      });
      
      result.push(...sortedWords);
    });
    
    return result;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Word Lists</CardTitle>
            <CardDescription>
              Browse vocabulary lists and add words to your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(wordLists).map(([category, lists]) => (
                <div key={category} className="border rounded-lg shadow-sm overflow-hidden">
                  <div 
                    className="bg-secondary/30 p-3 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    <h3 className="font-semibold text-lg">{category}</h3>
                    <Button variant="ghost" size="sm">
                      {expandedCategories[category] ? "▼" : "►"}
                    </Button>
                  </div>
                  
                  {expandedCategories[category] && (
                    <div className="p-3 space-y-3">
                      {lists.map((list) => (
                        <Card key={list.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg">{list.name}</CardTitle>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleWordList(list.id)}
                              >
                                {expandedWordLists[list.id] ? "▼" : "►"}
                              </Button>
                            </div>
                            <CardDescription>{list.description}</CardDescription>
                          </CardHeader>
                          
                          {expandedWordLists[list.id] && (
                            <CardContent>
                              <div className="space-y-3 pt-2">
                                {list.id === "user-vocabulary" ? (
                                  groupWordsByPinyin(list.words).map((item, index) => {
                                    if (item.isHeader) {
                                      return (
                                        <div key={`header-${item.value}`} className="font-bold text-lg pt-2">
                                          {item.value}
                                        </div>
                                      );
                                    }
                                    
                                    const proficiency = wordProficiency[item.id] || { correct: 0, incorrect: 0 };
                                    const totalAttempts = proficiency.correct + proficiency.incorrect;
                                    const successRate = totalAttempts > 0 
                                      ? Math.round((proficiency.correct / totalAttempts) * 100) 
                                      : 0;
                                    
                                    const progressColor = successRate > 70 
                                      ? "bg-green-500" 
                                      : successRate > 40 
                                        ? "bg-yellow-500" 
                                        : "bg-red-500";
                                    
                                    return (
                                      <div 
                                        key={`word-${item.id}`} 
                                        className="flex flex-wrap items-center gap-1 p-2 border rounded-md"
                                      >
                                        <WordChip 
                                          word={item} 
                                          variant={item.active === "true" ? "default" : "outline"} 
                                          onClick={() => {}}
                                        />
                                        
                                        <div className="ml-auto flex gap-2 items-center">
                                          {totalAttempts > 0 && (
                                            <div className="flex items-center gap-1 text-sm">
                                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                  className={`h-full ${progressColor}`} 
                                                  style={{ width: `${successRate}%` }}
                                                ></div>
                                              </div>
                                              <span>{successRate}%</span>
                                              <span className="text-xs text-gray-500">
                                                ({proficiency.correct}/{totalAttempts})
                                              </span>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-7 ml-1 text-xs" 
                                                onClick={() => handleResetProficiency(item.id)}
                                              >
                                                Reset
                                              </Button>
                                            </div>
                                          )}
                                          
                                          <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            className="h-7"
                                            onClick={() => handleDeleteWord(item.id)}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {list.words.map((word, wordIndex) => (
                                      <WordChip 
                                        key={`${list.id}-${wordIndex}`} 
                                        word={word} 
                                        variant="outline"
                                        onClick={() => handleAddWord(word)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Import Words</CardTitle>
            <CardDescription>
              Paste words in Chinese/Pinyin/English format, one word per line
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="你 nǐ you" 
              className="font-mono min-h-32"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleImport}
              disabled={!importText.trim() || addWordsMutation.isPending}
            >
              {addWordsMutation.isPending ? "Importing..." : "Import Words"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}