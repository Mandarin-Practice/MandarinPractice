-- Add lesson_id and category columns to vocabulary table
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS lesson_id INTEGER;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS category TEXT;

-- Update specific lesson words to lessons 11-20
-- Note: These are just examples, in a real implementation you'd have a more comprehensive mapping

-- Lesson 11: Food vocabulary
UPDATE vocabulary SET lesson_id = 11, category = 'food' 
WHERE chinese IN ('烤鸭', '饺子', '面条', '蛋糕', '米饭', '好吃');

-- Lesson 12: Travel vocabulary
UPDATE vocabulary SET lesson_id = 12, category = 'travel' 
WHERE chinese IN ('行李', '登机', '公司', '长城', '旅游', '酒店');

-- Lesson 13: Technology vocabulary
UPDATE vocabulary SET lesson_id = 13, category = 'technology' 
WHERE chinese IN ('网络', '电脑', '手机', '软件', '上网');

-- Lesson 14: Entertainment vocabulary
UPDATE vocabulary SET lesson_id = 14, category = 'entertainment' 
WHERE chinese IN ('唱歌', '跳舞', '电影', '音乐', '游戏');

-- Lesson 15: Shopping vocabulary
UPDATE vocabulary SET lesson_id = 15, category = 'shopping' 
WHERE chinese IN ('礼物', '便宜', '贵', '商店', '买');

-- Lesson 16: Appearance/Personality vocabulary
UPDATE vocabulary SET lesson_id = 16, category = 'appearance' 
WHERE chinese IN ('漂亮', '可爱', '高', '矮', '胖', '瘦');

-- Lesson 17-20: Other advanced vocabulary
UPDATE vocabulary SET lesson_id = 17, category = 'advanced' 
WHERE chinese IN ('已经', '刚才', '虽然', '但是', '因为', '所以');

-- Set earlier lesson words (lessons 1-10)
UPDATE vocabulary SET lesson_id = CASE 
    WHEN id BETWEEN 1000 AND 1100 THEN 1
    WHEN id BETWEEN 1101 AND 1200 THEN 2
    WHEN id BETWEEN 1201 AND 1300 THEN 3
    WHEN id BETWEEN 1301 AND 1400 THEN 4
    WHEN id BETWEEN 1401 AND 1500 THEN 5
    WHEN id BETWEEN 1501 AND 1600 THEN 6
    WHEN id BETWEEN 1601 AND 1700 THEN 7
    WHEN id BETWEEN 1701 AND 1800 THEN 8
    WHEN id BETWEEN 1801 AND 1900 THEN 9
    WHEN id BETWEEN 1901 AND 2000 THEN 10
    ELSE lesson_id
END
WHERE lesson_id IS NULL;