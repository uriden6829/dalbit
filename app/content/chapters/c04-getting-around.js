import { words, phrases, grammar, say } from '../dsl.js';

export default {
  id: 'c04',
  b: -1.8,
  title: { ko: '길 찾기', en: 'Getting Around' },
  blurb: 'Subway exits, transfers, “where is…?”, and telling a taxi where to go.',
  lessons: [
    {
      id: 'c04-l1', title: { ko: '길 단어', en: 'Places and directions' },
      items: words(`
        지하철 | subway | 지하 = underground, 철 = iron (rail).
        역 | station | | 서울역 = Seoul Station
        정류장 | bus stop | | 버스 정류장 = bus stop
        출구 | exit | Big stations have a dozen numbered exits. | 3번 출구 = exit 3
        화장실 | restroom | Free and clean in almost every subway station.
        어디 | where | | 어디예요? = Where is it?
        왼쪽 | the left (side)
        오른쪽 | the right (side)
        앞 | front, in front of | | 역 앞 = in front of the station
        옆 | next to, beside | | 카페 옆 = next to the café
        저기 | over there | Point while you say it.
        똑바로 | straight ahead | | 똑바로 가세요. = Go straight.
        타다 | to get on, to ride | 타요 = I take (the bus).
        내리다 | to get off | 내려요 = I get off.
        갈아타다 | to transfer, change lines | | 2호선으로 갈아타세요. = Change to Line 2.
      `),
    },
    {
      id: 'c04-l2', title: { ko: '길 묻기', en: 'Asking the way' },
      items: [
        ...phrases(`
          화장실이 어디예요? | Where is the restroom?
          지하철역이 어디예요? | Where is the subway station?
          몇 번 출구예요? | Which exit number is it?
          이 버스 시청에 가요? | Does this bus go to City Hall?
          어디에서 갈아타요? | Where do I transfer?
          서울역으로 가 주세요. | To Seoul Station, please. | What you say when you get in a taxi.
          여기서 세워 주세요. | Please stop here. | For taxis.
          저기 오른쪽이에요. | It’s over there on the right.
        `),
        grammar({
          id: 'g:i-ga', title: '이 / 가', en: 'subject marker — “where is X?”',
          explain: [
            'Marks the subject — often the thing you’re asking about: 화장실이 어디예요?',
            'After a consonant → 이: 역이, 화장실이. After a vowel → 가: 출구가, 버스가.',
            '은/는 sets a topic; 이/가 points at the thing itself. For “where is X?” use 이/가.',
          ],
          examples: [['화장실이 어디예요?', 'Where is the restroom?'], ['출구가 어디예요?', 'Where is the exit?']],
          drills: [
            ['화장실___ 어디예요?', ['이', '가'], 0, 'Where is the restroom?'],
            ['출구___ 어디예요?', ['가', '이'], 0, 'Where is the exit?'],
            ['지하철역___ 어디예요?', ['이', '가'], 0, 'Where is the subway station?'],
            ['버스 정류장___ 어디예요?', ['이', '가'], 0, 'Where is the bus stop?'],
            ['택시___ 와요.', ['가', '이'], 0, 'A taxi is coming.'],
          ],
        }),
        grammar({
          id: 'g:e-ro', title: '에 가요 / (으)로 가 주세요', en: 'going somewhere',
          explain: [
            'Place + 에 가요 = I go to the place: 역에 가요.',
            'In a taxi: place + (으)로 가 주세요 = please go to…',
            'Ends in a vowel or ㄹ → 로: 학교로, 호텔로. Other consonants → 으로: 서울역으로, 공항으로.',
          ],
          examples: [['학교에 가요.', 'I’m going to school.'], ['공항으로 가 주세요.', 'To the airport, please.']],
          drills: [
            ['학교___ 가요.', ['에', '을', '이'], 0, 'I go to school.'],
            ['서울역___ 가 주세요.', ['으로', '로'], 0, 'To Seoul Station, please.'],
            ['호텔___ 가 주세요.', ['로', '으로'], 0, 'To the hotel, please.'],
            ['공항___ 가 주세요.', ['으로', '로'], 0, 'To the airport, please.'],
            ['내일 시장___ 가요.', ['에', '를', '은'], 0, 'I’m going to the market tomorrow.'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep04',
    title: { ko: '지하의 미로', en: 'The Underground Maze' },
    panels: [
      { scene: 'subway', h: 'M', cast: [['me', 0.38, 'think'], ['jiji', 0.7, 'idle']],
        note: { en: 'The academy has sent you across the city with a parcel. Line 2, the green one.' },
        signs: [['시청', 'City Hall'], ['을지로입구', 'Euljiro 1-ga'], ['동대문', 'Dongdaemun'], ['성수', 'Seongsu']] },
      { scene: 'subway', h: 'M', cast: [['me', 0.38, 'surprised'], ['jiji', 0.7, 'surprised']],
        lines: [say('woman', '이번 역은 시청, 시청역입니다.', 'This stop is City Hall.'), say('jiji', '내려요! 여기서 내려요!', 'Get off! We get off here!')] },
      { scene: 'subway', h: 'M', cast: [['me', 0.3, 'talk'], ['man', 0.72, 'neutral', { face: 'left' }]],
        lines: [say('me', '저기요, 3번 출구가 어디예요?', 'Excuse me, where is exit 3?'), say('man', '저기 오른쪽이에요.', 'Over there on the right.')] },
      { scene: 'subway', h: 'S', cast: [['me', 0.3, 'happy'], ['man', 0.72, 'smile', { face: 'left', arms: 'point' }]],
        lines: [say('me', '감사합니다!', 'Thank you!')] },
      { scene: 'street', h: 'M', time: 'night', cast: [['me', 0.3, 'talk', { arms: 'wave' }], ['jiji', 0.6, 'sad']],
        note: { en: 'Outside it’s dark, and much too far to walk.' },
        lines: [say('me', '택시!', 'Taxi!')] },
      { scene: 'taxi', h: 'M', cast: [['driver', 0.3, 'smile'], ['me', 0.7, 'talk', { face: 'left' }]],
        lines: [say('driver', '어디로 가세요?', 'Where to?'), say('me', '서촌으로 가 주세요.', 'To Seochon, please.')] },
      { scene: 'taxi', h: 'M', cast: [['driver', 0.3, 'neutral'], ['me', 0.7, 'talk', { face: 'left' }]],
        note: { en: 'Twenty minutes later.' },
        lines: [say('me', '여기서 세워 주세요.', 'Please stop here.'), say('driver', '네, 사천팔백 원입니다.', 'Okay, that’s 4,800 won.')] },
      { scene: 'street', h: 'M', time: 'night', cast: [['me', 0.32, 'happy'], ['jiji', 0.68, 'smug']],
        lines: [say('jiji', '', 'One subway, one exit, one taxi, zero tears. Not bad for a first-year.')] },
    ],
    quiz: [
      ['Where did they get off the subway?', ['City Hall', 'Dongdaemun', 'Seongsu', 'Seoul Station'], 0],
      ['Where was exit 3?', ['Over there on the right', 'Straight ahead', 'On the left', 'Behind them'], 0],
      ['How do you tell a taxi driver where to go?', ['서촌으로 가 주세요', '서촌이 어디예요?', '서촌에 있어요', '서촌 주세요'], 0],
      ['여기서 세워 주세요 means…', ['Please stop here', 'Please go straight', 'Please hurry', 'Please turn right'], 0],
    ],
  },
};
