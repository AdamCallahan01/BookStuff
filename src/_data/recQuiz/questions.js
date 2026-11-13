export default [
  {
    "id": "setting-question-1",
    "prompt": "What is your favorite book setting?",
    "answers": [
      {
        "text": "Medieval. Castles, Villages, etc.",
        "scores": {
          "fantasy": 100,
          "epic": 60
        }
      },
      {
        "text": "Modern or Futuristic Earth",
        "scores": {
          "fantasy": 80,
          "scienceFiction": 20
        }
      },
      {
        "text": "Ancient Earth",
        "scores": {
          "fantasy": 70
        }
      },
      {
        "text": "Space",
        "scores": {
          "scienceFiction": 100
        }
      },
      {
        "text": "Something completely unique",
        "scores": {
          "fantasy": 70,
          "highFantasy": 30
        }
      }
    ]
  },
  {
    "id": "magic-question-2",
    "prompt": "What is the best type of magic?",
    "answers": [
      {
        "text": "None",
        "scores": {
          "scienceFiction": 40,
          "highFantasy": 0,
          "hardMagic": 0
        }
      },
      {
        "text": "Mysterious",
        "scores": {
          "highFantasy": 50
        }
      },
      {
        "text": "Well-defined with clear rules and limits",
        "scores": {
          "highFantasy": 50,
          "hardMagic": 100
        }
      },
      {
        "text": "Magic not very common in the setting",
        "scores": {
          "highFantasy": 10,
          "hardMagic": 50
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
    "prompt": "Favorite type of creature?",
    "answers": [
      {
        "text": "Dragon",
        "scores": {
          "fantasy": 30,
          "epic": 40,
          "highFantasy": 40,
          "dragons": 70,
          "animals": 30
        }
      },
      {
        "text": "Dog",
        "scores": {
          "animals": 100
        }
      },
      {
        "text": "Horse",
        "scores": {
          "animals": 50
        }
      },
      {
        "text": "None",
        "scores": {
          "scienceFiction": 10,
          "dragons": 0,
          "animals": 0
        }
      }
    ]
  },
  {
    "id": "audiobook-question-5",
    "prompt": "How do you feel about audiobooks?",
    "answers": [
      {
        "text": "Great",
        "scores": {
          "audiobook": 100
        }
      },
      {
        "text": "Neutral",
        "scores": {
          "audiobook": 50
        }
      },
      {
        "text": "Not for me",
        "scores": {
          "audiobook": 0
        }
      }
    ]
  },
  {
    "id": "test-question-6",
    "prompt": "Test",
    "answers": [
      {
        "text": "1",
        "scores": {
          "longSeries": 100,
          "grimdark": 100,
          "cozy": 100,
          "progression": 10,
          "humor": 100
        }
      },
      {
        "text": "2",
        "scores": {
          "audiobook": 30,
          "epic": 70,
          "romance": 70,
          "progression": 70
        }
      },
      {
        "text": "3",
        "scores": {
          "fantasy": 100,
          "scienceFiction": 100,
          "audiobook": 100,
          "longSeries": 100,
          "grimdark": 100,
          "epic": 100,
          "romance": 100,
          "heist": 100,
          "cozy": 100,
          "progression": 100,
          "characterDriven": 100,
          "humor": 100,
          "highFantasy": 100,
          "hardMagic": 100,
          "dragons": 100,
          "animals": 100
        }
      },
      {
        "text": "4",
        "scores": {
          "fantasy": 10,
          "scienceFiction": 10,
          "audiobook": 10,
          "longSeries": 10,
          "grimdark": 10,
          "epic": 10,
          "romance": 10,
          "heist": 10,
          "cozy": 10,
          "progression": 10,
          "characterDriven": 10,
          "humor": 10,
          "highFantasy": 10,
          "hardMagic": 10,
          "dragons": 10,
          "animals": 10
        }
      }
    ]
  }
];
