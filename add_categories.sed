# Add HSK category to HSK word lists
/id: "hsk[0-9]"/ {
  n
  n
  n
  s/words/category: "HSK",\n    words/
}

# Add Integrated Chinese category to IC lessons
/id: "ic-lesson[0-9]/ {
  n
  n
  n
  s/words/category: "Integrated Chinese",\n    words/
}

# Add Topics category to topic-based lists
/id: "travel"/ {
  n
  n
  n
  s/words/category: "Topics",\n    words/
}

/id: "food"/ {
  n
  n
  n
  s/words/category: "Topics",\n    words/
}

/id: "business"/ {
  n
  n
  n
  s/words/category: "Topics",\n    words/
}

/id: "tech"/ {
  n
  n
  n
  s/words/category: "Topics",\n    words/
}

/id: "emotions"/ {
  n
  n
  n
  s/words/category: "Topics",\n    words/
}

/id: "medical"/ {
  n
  n
  n
  s/words/category: "Topics",\n    words/
}

/id: "weather"/ {
  n
  n
  n
  s/words/category: "Topics",\n    words/
}
