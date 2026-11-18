export default [
  {
    "id": "age-question",
    "type": "choice",
    "prompt": "How mature of a book do you want?",
    "answers": [
      {
        "text": "Any"
      },
      {
        "text": "Kids book",
        "traits": {
          "age": 10
        }
      },
      {
        "text": "YA / Teen",
        "traits": {
          "age": 15
        }
      },
      {
        "text": "Adult",
        "traits": {
          "age": 18
        }
      }
    ]
  },
  {
    "id": "fantasy-question-1",
    "type": "slider",
    "category": "fantasy",
    "prompt": "How many fantasy elements do you want? (Magic, different world, etc.)"
  },
  {
    "id": "scifi-question-2",
    "type": "slider",
    "category": "scienceFiction",
    "prompt": "How much Science Fiction do you want? (Space travel, futuristic, dystopian, etc.)"
  },
  {
    "id": "epic-question-3",
    "type": "slider",
    "category": "epic",
    "prompt": "How epic of a story are you looking for? (Grand scale, far reaching implications or large battles)"
  },
  {
    "id": "grimdark-question-4",
    "type": "slider",
    "category": "grimdark",
    "prompt": "How dark do you want the story to be?"
  },
  {
    "id": "romance-question-5",
    "type": "slider",
    "category": "romance",
    "prompt": "How much romance do you want?"
  },
  {
    "id": "heist-question-6",
    "type": "slider",
    "category": "heist",
    "prompt": "Do you like a heist story? (Follow a group of criminals pulling off a crime)"
  },
  {
    "id": "cozy-question-7",
    "type": "slider",
    "category": "cozy",
    "prompt": "Do you enjoy a cozier story with low stake?"
  },
  {
    "id": "progression-question-8",
    "type": "slider",
    "category": "progression",
    "prompt": "How much do you enjoy seeing a main character progress and grow stronger?"
  },
  {
    "id": "character-question-9",
    "type": "slider",
    "category": "characterDriven",
    "prompt": "How important are character relationships and dialogue?"
  },
  {
    "id": "humor-question-10",
    "type": "slider",
    "category": "humor",
    "prompt": "Do you enjoy humor and jokes in a book?"
  },
  {
    "id": "highfantasy-question-11",
    "type": "slider",
    "category": "highFantasy",
    "prompt": "Do you prefer fantasy with more real settings or more magic and unexplainable phenomena?"
  },
  {
    "id": "hardmagic-question-12",
    "type": "slider",
    "category": "hardMagic",
    "prompt": "Do you prefer magic to be mysterious or well-defined and explained?"
  },
  {
    "id": "dragons-question-13",
    "type": "slider",
    "category": "dragons",
    "prompt": "How much dragons?"
  },
  {
    "id": "animals-question-14",
    "type": "slider",
    "category": "animals",
    "prompt": "How important are animal companions to you?"
  },
  {
    "id": "audiobook-question",
    "type": "slider",
    "category": "audiobook",
    "prompt": "Do you enjoy audiobooks?"
  },
  {
    "id": "longseries-question",
    "type": "slider",
    "category": "longSeries",
    "prompt": "Are you trying to find a short, standalone book or a long series"
  }
];
