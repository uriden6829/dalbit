import { words, phrases, grammar, say } from '../dsl.js';

export default {
  id: 'c06',
  b: -1.4,
  title: { ko: '가족과 저녁', en: 'Family Dinner' },
  blurb: 'Family words, the phrases every Korean meal begins and ends with, and how to speak respectfully to elders.',
  lessons: [
    {
      id: 'c06-l1', title: { ko: '가족', en: 'Family' },
      items: words(`
        가족 | family
        어머니 | mother (respectful) | 엄마 is “mom”.
        아버지 | father (respectful) | 아빠 is “dad”.
        어머님 | mother (extra respectful); mother-in-law | Daughters-in-law call their husband’s mother 어머님.
        아버님 | father (extra respectful); father-in-law
        할머니 | grandmother | Also any elderly woman, warmly.
        할아버지 | grandfather
        언니 | older sister (said by a woman) | Women also call close older women 언니.
        오빠 | older brother (said by a woman) | Men say 형 and 누나 instead.
        동생 | younger sibling
        남편 | husband
        아내 | wife
        집 | home, house | | 집에 가요. = I’m going home.
        저녁 | dinner; evening | | 저녁 먹었어요? = Have you had dinner?
        선물 | gift | Bring one when you visit someone’s home — fruit is classic.
      `),
    },
    {
      id: 'c06-l2', title: { ko: '식탁 예절', en: 'Table manners' },
      items: [
        ...phrases(`
          잘 먹겠습니다. | I’ll enjoy this meal. | Said before the first bite. At family meals it’s a must.
          정말 맛있었어요. | It was really delicious.
          맛있게 드세요. | Enjoy your meal.
          많이 드세요. | Please eat a lot. | Hosts say this constantly. Accept another helping.
          천천히 드세요. | Take your time eating.
          이거 드세요. | Please have this. | Offering food to an elder — use both hands.
          안녕히 주무세요. | Good night. (to elders)
          다녀오겠습니다. | I’m heading out! (leaving home)
          다녀왔습니다. | I’m home!
        `),
        grammar({
          id: 'g:euseyo', title: '-(으)세요', en: 'polite requests and respect',
          explain: [
            'Verb stem + 세요 makes a polite request, or talks respectfully about someone: 가세요, 앉으세요.',
            'Stem ends in a vowel → 세요: 가세요, 오세요, 쉬세요.',
            'Stem ends in a consonant → 으세요: 앉으세요, 읽으세요.',
            'For elders some verbs change completely: 드세요 (eat/drink), 주무세요 (sleep), 계세요 (be/stay).',
          ],
          examples: [['여기 앉으세요.', 'Please have a seat here.'], ['안녕히 가세요.', 'Goodbye (go safely).']],
          drills: [
            ['여기 앉___. (앉다)', ['으세요', '세요'], 0, 'Please have a seat here.'],
            ['안녕히 가___. (가다)', ['세요', '으세요'], 0, 'Goodbye.'],
            ['이 책 읽___. (읽다)', ['으세요', '세요'], 0, 'Please read this book.'],
            ['푹 쉬___. (쉬다)', ['세요', '으세요'], 0, 'Get some good rest.'],
            ['어머님, 이쪽으로 오___. (오다)', ['세요', '으세요'], 0, 'Mother, please come this way.'],
          ],
        }),
        grammar({
          id: 'g:honor-verbs', title: '드시다 · 주무시다 · 계시다', en: 'respect verbs for elders',
          explain: [
            'When an elder does the action, Korean swaps in special verbs.',
            '먹다 / 마시다 → 드시다 (드세요).  자다 → 주무시다 (주무세요).  있다 (be somewhere) → 계시다 (계세요).',
            'Never use them about yourself: 저는 먹어요, but 할머니는 드세요.',
          ],
          examples: [['할머니, 많이 드세요.', 'Grandma, eat lots.'], ['아버님은 지금 주무세요.', 'Father is sleeping now.']],
          drills: [
            ['할머니, 많이 ___. (eat)', ['드세요', '먹으세요', '먹어요'], 0, 'Grandma, please eat lots.'],
            ['아버님은 지금 ___. (is sleeping)', ['주무세요', '자세요', '자요'], 0, 'Father is sleeping now.'],
            ['어머님은 집에 ___. (is at home)', ['계세요', '있으세요', '있어요'], 0, 'Mother is at home.'],
            ['저는 김치를 ___. (I eat)', ['먹어요', '드세요', '주무세요'], 0, 'I eat kimchi.'],
            ['할아버지, 안녕히 ___. (sleep well)', ['주무세요', '자요', '드세요'], 0, 'Good night, grandfather.'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep06',
    title: { ko: '추석 저녁', en: 'Chuseok Dinner' },
    panels: [
      { scene: 'street', h: 'M', time: 'dusk', cast: [['me', 0.3, 'think', { arms: 'hold', prop: '#c98b6b' }], ['minji', 0.68, 'smile', { face: 'left' }]],
        note: { en: 'Chuseok, the harvest festival. Minji has invited you home for dinner.' },
        lines: [say('minji', '긴장하지 마세요!', 'Don’t be nervous!')] },
      { scene: 'home', h: 'M', cast: [['mom', 0.25, 'happy'], ['dad', 0.5, 'smile'], ['grandma', 0.78, 'smile', { face: 'left' }]],
        lines: [say('mom', '어서 와요! 반가워요.', 'Come in! Lovely to meet you.')] },
      { scene: 'home', h: 'M', cast: [['me', 0.5, 'talk', { arms: 'hold', prop: '#c98b6b' }]],
        lines: [say('me', '처음 뵙겠습니다. 이거 선물이에요.', 'It’s an honour to meet you. This is a small gift.')] },
      { scene: 'home', h: 'M', cast: [['dad', 0.3, 'smile'], ['grandma', 0.7, 'happy', { face: 'left' }]],
        lines: [say('dad', '뭘 이런 걸 다…', 'Oh, you shouldn’t have…'), say('grandma', '고마워요.', 'Thank you, dear.')] },
      { scene: 'home', h: 'M', cast: [['me', 0.32, 'happy'], ['minji', 0.68, 'smile', { face: 'left' }]],
        note: { en: 'The table is covered: japchae, golden jeon, and little half-moon rice cakes — songpyeon.' },
        lines: [say('me', '잘 먹겠습니다!', 'I’ll enjoy this meal!')] },
      { scene: 'home', h: 'M', cast: [['grandma', 0.6, 'talk', { face: 'left' }]],
        lines: [say('grandma', '많이 드세요. 천천히 드세요.', 'Eat lots. Take your time.')] },
      { scene: 'home', h: 'M', cast: [['me', 0.3, 'smile'], ['grandma', 0.72, 'happy', { face: 'left' }]],
        lines: [say('me', '할머니, 이거 드세요.', 'Grandma, please have this.'), say('grandma', '아이고, 착하네.', 'Oh my, what a sweet girl.')] },
      { scene: 'home', h: 'M', cast: [['mom', 0.3, 'talk'], ['me', 0.7, 'happy', { face: 'left' }]],
        lines: [say('mom', '송편 맛있어요?', 'Is the songpyeon good?'), say('me', '네, 정말 맛있어요!', 'Yes, it’s really delicious!')] },
      { scene: 'room', h: 'M', cast: [['me', 0.35, 'sleepy'], ['jiji', 0.72, 'sleepy']],
        note: { en: 'Back at the academy, very full.' },
        lines: [say('me', '지지야, 잘 자.', 'Good night, Jiji.'), say('jiji', '안녕히 주무세요.', 'Good night (most respectfully).')] },
    ],
    quiz: [
      ['What do you say before eating?', ['잘 먹겠습니다', '잘 먹었습니다', '많이 드세요', '안녕히 주무세요'], 0],
      ['Grandma keeps saying 많이 드세요. What does it mean?', ['Eat a lot', 'It’s delicious', 'Take this', 'Good night'], 0],
      ['What is songpyeon?', ['Half-moon rice cakes', 'Kimchi stew', 'A gift box', 'Grilled fish'], 0],
      ['Which word is the respectful “eat” for elders?', ['드세요', '먹어요', '마셔요', '주세요'], 0],
    ],
  },
};
