import { words, phrases, grammar, say } from '../dsl.js';

// A recap chapter: the episode retells everything from chapters 2–10 in the past tense.
export default {
  id: 'c11',
  b: -0.4,
  title: { ko: '지난 이야기', en: 'Telling Stories' },
  blurb: 'The past tense, the object marker, and a report to the headmistress that brings back everything you’ve learned so far.',
  lessons: [
    {
      id: 'c11-l1', title: { ko: '이야기 단어', en: 'Story words' },
      items: words(`
        지난주 | last week | 지난 = past, 주 = week.
        재미있다 | to be fun, interesting | | 재미있었어요! = It was fun!
        재미없다 | to be boring
        처음 | the first time | | 처음이에요. = It’s my first time.
        같이 | together | Sounds like [가치].
        만나다 | to meet | | 만났어요 = I met
        보다 | to see, to watch | | 봤어요 = I saw
        하다 | to do | | 했어요 = I did
        오다 | to come | | 왔어요 = I came
        가다 | to go | | 갔어요 = I went
        배우다 | to learn | | 배웠어요 = I learned
        일하다 | to work
        놀다 | to hang out, to play | | 친구하고 놀았어요. = I hung out with a friend.
        사진 | photo | | 사진을 찍어요. = I take a photo.
        여행 | trip, travel
      `),
    },
    {
      id: 'c11-l2', title: { ko: '지난 일 말하기', en: 'What happened' },
      items: [
        ...phrases(`
          주말에 뭐 했어요? | What did you do at the weekend? | Korea’s favourite Monday question.
          친구를 만났어요. | I met a friend.
          영화를 봤어요. | I watched a movie.
          정말 재미있었어요. | It was really fun.
          한국어를 배웠어요. | I learned Korean.
          어땠어요? | How was it?
          처음이에요. | It’s my first time.
          사진 좀 찍어 주시겠어요? | Would you take a photo for us? | Very polite — perfect for strangers.
        `),
        grammar({
          id: 'g:past', title: '-았어요 / -었어요 / 했어요', en: 'past tense',
          explain: [
            'The same vowel rule as the present tense, with ㅆ어요 at the end.',
            'ㅏ or ㅗ → 았어요: 가다 → 갔어요, 보다 → 봤어요, 만나다 → 만났어요.',
            'Other vowels → 었어요: 먹다 → 먹었어요, 배우다 → 배웠어요, 마시다 → 마셨어요.',
            '하다 → 했어요: 공부했어요. Nouns: 학생이었어요, 친구였어요.',
          ],
          examples: [['어제 친구를 만났어요.', 'I met a friend yesterday.'], ['비빔밥을 먹었어요.', 'I ate bibimbap.']],
          drills: [
            ['어제 친구를 ___. (만나다)', ['만났어요', '만나었어요', '만났아요'], 0, 'I met a friend yesterday.'],
            ['영화를 ___. (보다)', ['봤어요', '보었어요', '봤아요'], 0, 'I watched a movie.'],
            ['비빔밥을 ___. (먹다)', ['먹었어요', '먹았어요', '먹어요었'], 0, 'I ate bibimbap.'],
            ['한국어를 ___. (배우다)', ['배웠어요', '배우았어요', '배웄어요'], 0, 'I learned Korean.'],
            ['어제 열심히 ___. (공부하다)', ['공부했어요', '공부하았어요', '공부해었어요'], 0, 'I studied hard yesterday.'],
          ],
        }),
        grammar({
          id: 'g:eul-reul', title: '을 / 를', en: 'object marker',
          explain: [
            'Marks the object — the thing you eat, see, buy, meet: 영화를 봐요.',
            'After a consonant → 을: 밥을, 사진을. After a vowel → 를: 영화를, 커피를.',
            'In casual speech it’s often dropped: 커피 마셔요.',
          ],
          examples: [['영화를 봤어요.', 'I watched a movie.'], ['사진을 찍었어요.', 'I took a photo.']],
          drills: [
            ['영화___ 봤어요.', ['를', '을'], 0, 'I watched a movie.'],
            ['사진___ 찍었어요.', ['을', '를'], 0, 'I took a photo.'],
            ['한국어___ 배워요.', ['를', '을'], 0, 'I’m learning Korean.'],
            ['밥___ 먹었어요.', ['을', '를'], 0, 'I ate.'],
            ['친구___ 만났어요.', ['를', '을'], 0, 'I met a friend.'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep11',
    title: { ko: '교장 선생님께 보고', en: 'A Report to the Headmistress' },
    panels: [
      { scene: 'academy', h: 'M', cast: [['head', 0.3, 'smile'], ['me', 0.7, 'smile', { face: 'left' }]],
        note: { en: 'Moonlight Recap: the headmistress wants to hear about your field work.' },
        lines: [say('head', '오랜만이에요! 이번 달에 뭐 했어요?', 'Long time no see! What did you do this month?')] },
      { scene: 'academy', h: 'M', cast: [['me', 0.5, 'talk']],
        lines: [say('me', '카페에서 아이스 아메리카노를 주문했어요.', 'I ordered an iced americano at a café.'), say('me', '편의점에서 바나나 우유도 샀어요.', 'And I bought banana milk at the convenience store.')] },
      { scene: 'academy', h: 'M', cast: [['head', 0.3, 'happy'], ['me', 0.7, 'talk', { face: 'left' }]],
        lines: [say('me', '지하철을 타고 시청역에서 내렸어요.', 'I took the subway and got off at City Hall.')] },
      { scene: 'academy', h: 'M', cast: [['me', 0.5, 'happy']],
        lines: [say('me', '친구 집에서 추석 저녁을 먹었어요. 정말 맛있었어요!', 'I had Chuseok dinner at a friend’s home. It was so delicious!')] },
      { scene: 'academy', h: 'M', cast: [['head', 0.3, 'smile'], ['me', 0.7, 'happy', { face: 'left' }]],
        lines: [say('me', '시장에서 딸기를 샀어요. 할머니가 덤을 줬어요.', 'I bought strawberries at the market. The grandma gave me a little extra.')] },
      { scene: 'academy', h: 'M', cast: [['me', 0.5, 'happy']],
        lines: [say('me', '한강에서 친구하고 피크닉을 했어요. 정말 재미있었어요!', 'I had a picnic by the Han River with a friend. It was so much fun!')] },
      { scene: 'academy', h: 'M', cast: [['head', 0.3, 'surprised'], ['me', 0.7, 'sad', { face: 'left' }]],
        lines: [say('me', '그런데 비가 와서 감기에 걸렸어요.', 'But it rained, so I caught a cold.'), say('head', '아이고! 지금은 괜찮아요?', 'Oh dear! Are you all right now?')] },
      { scene: 'academy', h: 'M', cast: [['head', 0.3, 'happy'], ['me', 0.7, 'smile', { face: 'left' }]],
        lines: [say('me', '네, 약국에서 약을 사서 푹 쉬었어요.', 'Yes, I bought medicine at the pharmacy and rested well.'), say('head', '정말 잘했어요. 한국어가 많이 늘었네요!', 'Wonderful. Your Korean has really grown!')] },
      { scene: 'academy', h: 'L', cast: [['jiji', 0.5, 'smug', { zoom: 2.3 }]],
        lines: [say('jiji', '', 'Every sentence you just said is a spell you learned. That’s what remembering is.')] },
    ],
    quiz: [
      ['Where did she buy strawberries?', ['At the market', 'At the café', 'At the convenience store', 'At the pharmacy'], 0],
      ['Why did she catch a cold?', ['It rained during the picnic', 'She ate too much', 'She studied too late', 'The subway was cold'], 0],
      ['재미있었어요 means…', ['It was fun', 'It is fun', 'It will be fun', 'It was boring'], 0],
      ['Which one is past tense?', ['샀어요', '사요', '살게요', '사고 싶어요'], 0],
    ],
  },
};
