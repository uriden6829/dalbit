import { words, phrases, grammar, say } from '../dsl.js';

export default {
  id: 'c09',
  b: -0.8,
  title: { ko: '날씨와 계절', en: 'Weather & Seasons' },
  blurb: 'Small talk’s favourite subject. Hot, cold, rain, the four seasons — and two little endings that make you sound natural.',
  lessons: [
    {
      id: 'c09-l1', title: { ko: '날씨', en: 'Weather' },
      items: words(`
        날씨 | weather | | 오늘 날씨 어때요? = How’s the weather today?
        덥다 | to be hot (weather) | Changes shape: 더워요.
        춥다 | to be cold (weather) | Changes shape: 추워요.
        따뜻하다 | to be warm
        시원하다 | to be cool, refreshing | Koreans also say it after hot soup — “that hits the spot”.
        비 | rain | | 비가 와요. = It’s raining.
        눈#snow | snow | Same spelling as 눈 (eye).
        바람 | wind
        하늘 | sky
        맑다 | to be clear, sunny | Sounds like [막따].
        봄 | spring
        여름 | summer
        가을 | autumn
        겨울 | winter
        우산 | umbrella
      `),
    },
    {
      id: 'c09-l2', title: { ko: '날씨 이야기', en: 'Small talk' },
      items: [
        ...phrases(`
          오늘 날씨가 좋네요. | The weather’s lovely today.
          비가 와요. | It’s raining.
          눈이 와요. | It’s snowing.
          너무 더워요. | It’s too hot.
          바람이 시원하네요. | The breeze feels nice.
          우산 있어요? | Do you have an umbrella?
          어떤 계절을 좋아해요? | Which season do you like?
          저는 가을을 좋아해요. | I like autumn.
        `),
        grammar({
          id: 'g:neyo', title: '-네요', en: 'oh, I notice…',
          explain: [
            'Stem + 네요 shows you’ve just noticed or felt something: 좋네요! = Oh, that’s nice!',
            'Perfect for reacting: 맛있네요, 춥네요, 예쁘네요.',
            'No vowel rule — just stem + 네요.',
          ],
          examples: [['오늘 날씨가 좋네요.', 'The weather’s nice today.'], ['좀 춥네요.', 'It’s a bit cold, isn’t it.']],
          drills: [
            ['와, 하늘이 정말 맑___!', ['네요', '세요', '예요'], 0, 'Wow, the sky is so clear!'],
            ['오늘 좀 춥___.', ['네요', '세요', '예요'], 0, 'It’s a bit cold today.'],
            ['이 커피 맛있___.', ['네요', '세요', '예요'], 0, 'This coffee is good.'],
            ['날씨가 좋___.', ['네요', '세요', '예요'], 0, 'The weather’s nice.'],
          ],
        }),
        grammar({
          id: 'g:jyo', title: '-지요 / -죠?', en: '…, right? …, isn’t it?',
          explain: [
            'Stem + 죠 (short for 지요) invites agreement: 날씨 좋죠? = Nice weather, isn’t it?',
            'Great for small talk — it practically asks for a 네!',
            'With nouns: 가을이죠? / 친구죠?',
          ],
          examples: [['날씨 좋죠?', 'Nice weather, isn’t it?'], ['내일 토요일이죠?', 'Tomorrow is Saturday, right?']],
          drills: [
            ['날씨 정말 좋___?', ['죠', '어', '니까'], 0, 'The weather is great, isn’t it?'],
            ['오늘 춥___?', ['죠', '어', '니까'], 0, 'It’s cold today, isn’t it?'],
            ['이거 맛있___?', ['죠', '니까', '세'], 0, 'This is tasty, right?'],
            ['내일 토요일이___?', ['죠', '어', '니까'], 0, 'Tomorrow is Saturday, right?'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep09',
    title: { ko: '한강 피크닉', en: 'Picnic by the Han River' },
    panels: [
      { scene: 'river', h: 'M', time: 'day', cast: [['me', 0.3, 'happy'], ['minji', 0.7, 'happy', { face: 'left' }]],
        note: { en: 'Saturday, three o’clock. Yeouido Han River Park.' },
        lines: [say('minji', '날씨 정말 좋죠?', 'Isn’t the weather great?'), say('me', '네, 하늘이 정말 맑네요!', 'Yes, the sky is so clear!')] },
      { scene: 'river', h: 'M', time: 'day', cast: [['jiji', 0.4, 'happy']],
        lines: [say('jiji', '치킨이에요!', 'It’s chicken!')], signs: [['치킨', 'fried chicken']] },
      { scene: 'river', h: 'M', time: 'day', cast: [['me', 0.3, 'talk'], ['minji', 0.7, 'smile', { face: 'left' }]],
        lines: [say('minji', '어떤 계절을 좋아해요?', 'Which season do you like?'), say('me', '저는 가을을 좋아해요. 시원해요.', 'I like autumn. It’s cool.')] },
      { scene: 'river', h: 'M', time: 'day', cast: [['me', 0.3, 'smile'], ['minji', 0.7, 'happy', { face: 'left' }]],
        lines: [say('minji', '저는 봄이요! 벚꽃이 예뻐요.', 'Spring for me! The cherry blossoms are so pretty.')] },
      { scene: 'river', h: 'M', time: 'dusk', cast: [['me', 0.3, 'smile'], ['minji', 0.7, 'sad', { face: 'left' }]],
        note: { en: 'The wind picks up.' },
        lines: [say('me', '바람이 시원하네요.', 'What a nice breeze.'), say('minji', '좀 춥네요…', 'It’s getting a bit cold…')] },
      { scene: 'river', h: 'M', rain: true, cast: [['me', 0.3, 'surprised'], ['minji', 0.7, 'surprised', { face: 'left' }]],
        note: { en: 'And then, out of nowhere—' },
        lines: [say('me', '비가 와요!', 'It’s raining!')] },
      { scene: 'river', h: 'M', rain: true, cast: [['me', 0.3, 'sad'], ['minji', 0.7, 'talk', { face: 'left' }]],
        lines: [say('minji', '우산 있어요?', 'Do you have an umbrella?'), say('me', '아니요, 없어요…', 'No, I don’t…')] },
      { scene: 'river', h: 'L', rain: true, cast: [['jiji', 0.5, 'smug', { zoom: 2.3 }]],
        lines: [say('jiji', '', 'A witch without an umbrella. Classic.')] },
      { scene: 'river', h: 'M', rain: true, cast: [['me', 0.32, 'happy'], ['minji', 0.66, 'happy', { face: 'left' }]],
        note: { en: 'They run all the way to the station, soaked and laughing.' } },
    ],
    quiz: [
      ['Which season does Minji like?', ['Spring', 'Summer', 'Autumn', 'Winter'], 0],
      ['맑네요 means…', ['Oh, it’s clear!', 'Oh, it’s cold!', 'Oh, it’s windy!', 'Oh, it’s raining!'], 0],
      ['What happened at the end?', ['It started raining', 'It started snowing', 'They lost the chicken', 'Minji went home early'], 0],
      ['날씨 정말 좋죠? expects…', ['Agreement (네!)', 'A price', 'Directions', 'An apology'], 0],
    ],
  },
};
