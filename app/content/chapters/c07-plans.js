import { words, phrases, grammar, say } from '../dsl.js';

export default {
  id: 'c07',
  b: -1.2,
  title: { ko: '시간과 약속', en: 'Time & Plans' },
  blurb: 'Telling the time (two number systems at once!), days of the week, and making plans with a friend.',
  lessons: [
    {
      id: 'c07-l1', title: { ko: '시간', en: 'Time words' },
      items: words(`
        시간 | time; hour | | 시간 있어요? = Do you have time?
        지금 | now
        오늘 | today
        내일 | tomorrow
        어제 | yesterday
        주말 | weekend
        아침 | morning; breakfast
        점심 | lunch; midday
        시#hour | o’clock | Hours use native numbers: 세 시 = three o’clock.
        분 | minute | Minutes use Sino numbers: 삼십 분 = thirty minutes.
        반 | half | 세 시 반 = half past three.
        월요일 | Monday | 월 = moon.
        금요일 | Friday | 금 = gold. Everyone’s favourite.
        토요일 | Saturday
        일요일 | Sunday | 일 = sun.
        약속 | plans, an appointment | | 약속이 있어요. = I have plans.
      `),
    },
    {
      id: 'c07-l2', title: { ko: '약속 잡기', en: 'Making plans' },
      items: [
        ...phrases(`
          지금 몇 시예요? | What time is it now?
          세 시에 만나요. | Let’s meet at three.
          내일 시간 있어요? | Are you free tomorrow?
          주말에 뭐 해요? | What are you doing this weekend?
          같이 갈래요? | Do you want to go together?
          좋아요! | Sounds good!
          미안해요, 그날은 약속이 있어요. | Sorry, I have plans that day.
          어디에서 만날까요? | Where shall we meet?
        `),
        grammar({
          id: 'g:time', title: '___ 시 ___ 분', en: 'telling the time',
          explain: [
            'Hours take native numbers: 한 시, 두 시, 세 시, 네 시, 다섯 시 … 열두 시.',
            'Minutes take Sino numbers: 십 분, 삼십 분 — or 반 for half past.',
            'Add 에 for “at”: 세 시에 만나요.',
            '오전 = a.m., 오후 = p.m.: 오후 두 시.',
          ],
          examples: [['지금 세 시 반이에요.', 'It’s half past three now.'], ['오후 두 시에 만나요.', 'Let’s meet at 2 p.m.']],
          drills: [
            ['3:00 → ___ 시', ['세', '삼', '셋'], 0, 'three o’clock'],
            ['1:30 → 한 시 ___', ['반', '삼', '셋'], 0, 'half past one'],
            ['5:10 → 다섯 시 ___ 분', ['십', '열', '하나'], 0, 'ten past five'],
            ['12:00 → ___ 시', ['열두', '십이', '열둘'], 0, 'twelve o’clock'],
            ['세 시___ 만나요.', ['에', '를', '가'], 0, 'Let’s meet at three.'],
          ],
        }),
        grammar({
          id: 'g:go-sipeo', title: '-고 싶어요', en: 'I want to…',
          explain: [
            'Verb stem + 고 싶어요 = I want to…: 가고 싶어요 = I want to go.',
            'No vowel rules: 먹고 싶어요, 보고 싶어요, 쉬고 싶어요.',
            '보고 싶어요 also means “I miss you”.',
          ],
          examples: [['한강에 가고 싶어요.', 'I want to go to the Han River.'], ['보고 싶어요.', 'I miss you.']],
          drills: [
            ['한강에 가___ 싶어요.', ['고', '서', '요'], 0, 'I want to go to the Han River.'],
            ['치킨 먹고 ___.', ['싶어요', '있어요', '주세요'], 0, 'I want to eat chicken.'],
            ['뭐 하고 ___?', ['싶어요', '주세요', '이에요'], 0, 'What do you want to do?'],
            ['엄마가 보고 ___. (I miss mom.)', ['싶어요', '있어요', '봐요'], 0, 'I miss my mom.'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep07',
    title: { ko: '토요일 세 시', en: 'Saturday at Three' },
    panels: [
      { scene: 'room', h: 'M', cast: [['me', 0.35, 'neutral', { arms: 'phone' }], ['jiji', 0.75, 'sleepy']],
        note: { en: 'A message from Minji.' },
        lines: [say('minji', '내일 시간 있어요?', 'Are you free tomorrow?')] },
      { scene: 'room', h: 'M', cast: [['me', 0.4, 'talk', { arms: 'phone' }]],
        lines: [say('me', '내일은 수업이 있어요. 왜요?', 'I have class tomorrow. Why?'), say('minji', '그럼 주말에 뭐 해요?', 'Then what are you doing this weekend?')] },
      { scene: 'room', h: 'M', cast: [['me', 0.4, 'happy', { arms: 'phone' }]],
        lines: [say('me', '아무것도 안 해요!', 'Nothing!'), say('minji', '한강에 같이 갈래요? 피크닉!', 'Want to go to the Han River together? A picnic!')] },
      { scene: 'room', h: 'M', cast: [['me', 0.4, 'talk', { arms: 'phone' }]],
        lines: [say('me', '좋아요! 몇 시에 만날까요?', 'Sounds good! What time shall we meet?'), say('minji', '토요일 세 시 어때요?', 'How about Saturday at three?')] },
      { scene: 'room', h: 'L', cast: [['jiji', 0.5, 'think', { zoom: 2.3 }]],
        lines: [say('jiji', '', 'Three o’clock is 세 시 — native number. Say 삼 시 and the whole city will know you’re a first-year.')] },
      { scene: 'room', h: 'M', cast: [['me', 0.4, 'talk', { arms: 'phone' }]],
        lines: [say('me', '토요일 세 시, 좋아요. 어디에서 만나요?', 'Saturday at three, great. Where do we meet?'), say('minji', '여의나루역 2번 출구에서 만나요!', 'Let’s meet at Yeouinaru Station, exit 2!')] },
      { scene: 'room', h: 'M', cast: [['me', 0.35, 'happy', { arms: 'phone' }], ['jiji', 0.72, 'happy']],
        lines: [say('me', '네, 그때 봐요!', 'Okay, see you then!'), say('jiji', '저도 가고 싶어요. 치킨 먹고 싶어요.', 'I want to go too. I want to eat chicken.')] },
    ],
    quiz: [
      ['When will they meet?', ['Saturday at 3', 'Sunday at 3', 'Saturday at 2', 'Friday at 3'], 0],
      ['Where will they meet?', ['Yeouinaru Station, exit 2', 'City Hall, exit 3', 'Seoul Station', 'The café'], 0],
      ['Why is 삼 시 wrong?', ['Hours use native numbers (세 시)', '삼 means four', '시 needs 분', 'It is too formal'], 0],
      ['What does Jiji want to eat?', ['Chicken', 'Fish', 'Kimchi stew', 'Cake'], 0],
    ],
  },
};
