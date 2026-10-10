export default [
  {
    "id": "setting-question-1",
    "prompt": "Where do you want the story to take place?",
    "answers": [
      {
        "text": "Medieval setting,",
        "scores": {
          "audiobook": 5,
          "epicFantasy": 60
        }
      },
      {
        "text": "Modern city",
        "scores": {
          "audiobook": 0,
          "fantasy": 60
        }
      },
      {
        "text": "Other planet or in space",
        "scores": {
          "scienceFiction": 50
        }
      },
      {
        "text": "Unsure"
      }
    ]
  },
  {
    "id": "magic-question-2",
    "prompt": "How do you like your magic?",
    "answers": [
      {
        "text": "Strict rules",
        "scores": {
          "highFantasy": 50,
          "hardMagic": 80
        }
      },
      {
        "text": "Mysterious",
        "scores": {
          "highFantasy": 50
        }
      },
      {
        "text": "No magic",
        "scores": {
          "lowFantasy": 70
        }
      },
      {
        "text": "None",
        "scores": {
          "lowFantasy": 50
        }
      }
    ]
  },
  {
    "id": "age-question-3",
    "prompt": "How mature of a story do you want?",
    "answers": [
      {
        "text": "Adult",
        "traits": {
          "age": 19
        }
      },
      {
        "text": "YA",
        "traits": {
          "age": 12
        }
      },
      {
        "text": "Kids",
        "traits": {
          "age": 5
        }
      },
      {
        "text": "Any"
      }
    ]
  },
  {
    "id": "creatures-question-4",
    "prompt": "What types of creatures do you want to see?",
    "answers": [
      {
        "text": "Dragons",
        "scores": {
          "fantasy": 30,
          "scienceFiction": 0,
          "epicFantasy": 40,
          "highFantasy": 40,
          "dragons": 70
        }
      },
      {
        "text": "Robots",
        "scores": {
          "scienceFiction": 40
        }
      },
      {
        "text": "Animals",
        "scores": {
          "animals": 100
        }
      },
      {
        "text": "None"
      }
    ]
  },
  {
    "id": "audiobook-question-5",
    "prompt": "How do you feel about audiobooks?",
    "answers": [
      {
        "text": "Love them",
        "scores": {
          "audiobook": 80
        }
      },
      {
        "text": "No thanks",
        "scores": {
          "audiobook": 0
        }
      },
      {
        "text": "Neutral"
      },
      {
        "text": "Needs a good narrator",
        "scores": {
          "audiobook": 50
        }
      }
    ]
  }
];
