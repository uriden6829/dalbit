import { words, phrases, grammar, say } from '../dsl.js';

export default {
  id: 'c10',
  b: -0.6,
  title: { ko: '아플 때', en: 'When You’re Sick' },
  blurb: 'Describing what hurts, getting medicine at a pharmacy, giving reasons with -아서, and saying what you can’t do.',
  lessons: [
    {
      id: 'c10-l1', title: { ko: '몸과 증상', en: 'Body and symptoms' },
      items: words(`
        아프다 | to hurt, to be sick | Changes shape: 아파요.
        머리 | head; hair
        배#belly | stomach, belly | 배 also means pear — and boat!
        목 | throat; neck
        감기 | a cold | | 감기에 걸렸어요. = I caught a cold.
        열 | fever | Same spelling as 열 (ten). | 열이 있어요. = I have a fever.
        기침 | cough | | 기침이 나요. = I’m coughing.
        콧물 | runny nose | Sounds like [콘물].
        약 | medicine
        약국 | pharmacy | Look for a sign with a big 약.
        병원 | hospital, clinic | Small neighbourhood clinics are also 병원.
        피곤하다 | to be tired
        쉬다 | to rest
        푹 | deeply, well (rest or sleep) | | 푹 쉬세요. = Get plenty of rest.
        하루 | one day | | 하루에 세 번 = three times a day
      `),
    },
    {
      id: 'c10-l2', title: { ko: '약국에서', en: 'At the pharmacy' },
      items: [
        ...phrases(`
          머리가 아파요. | I have a headache.
          감기에 걸렸어요. | I caught a cold.
          목이 아프고 기침이 나요. | My throat hurts and I’m coughing.
          감기약 있어요? | Do you have cold medicine?
          하루에 세 번 드세요. | Take it three times a day.
          식후 삼십 분에 드세요. | Take it thirty minutes after meals. | 식후 = after meals, 식전 = before meals.
          푹 쉬세요. | Get plenty of rest.
          몸조심하세요. | Take care of yourself.
        `),
        grammar({
          id: 'g:aseo', title: '-아서 / -어서', en: 'so, because (reason → result)',
          explain: [
            'Stem + 아서/어서 links a reason to its result: 아파서 쉬어요 = I’m sick, so I’m resting.',
            'Same vowel rule as -아요/어요: 아프다 → 아파서, 피곤하다 → 피곤해서, 춥다 → 추워서.',
            'The reason comes first, and the -서 part never takes past tense: 아파서 못 갔어요.',
          ],
          examples: [['피곤해서 집에서 쉬어요.', 'I’m tired, so I’m resting at home.'], ['비가 와서 우산을 샀어요.', 'It was raining, so I bought an umbrella.']],
          drills: [
            ['피곤___ 집에서 쉬어요. (피곤하다)', ['해서', '하서', '해고'], 0, 'I’m tired, so I’m resting at home.'],
            ['머리가 아___ 약을 먹어요. (아프다)', ['파서', '프서', '파고서'], 0, 'My head hurts, so I’m taking medicine.'],
            ['비가 와___ 우산을 샀어요. (오다)', ['서', '어서', '니서'], 0, 'It was raining, so I bought an umbrella.'],
            ['추___ 창문을 닫았어요. (춥다)', ['워서', '어서', '와서'], 0, 'It was cold, so I closed the window.'],
          ],
        }),
        grammar({
          id: 'g:mot', title: '못 + verb', en: 'can’t',
          explain: [
            'Put 못 before a verb: 못 가요 = I can’t go.',
            '안 = don’t (a choice). 못 = can’t (no ability, or something stops you).',
            'For 하다 verbs it goes before 하다: 운동 못 해요.',
            'It loves -아서: 아파서 못 가요 = I’m sick, so I can’t go.',
          ],
          examples: [['아파서 못 가요.', 'I’m sick, so I can’t go.'], ['매운 음식은 못 먹어요.', 'I can’t eat spicy food.']],
          drills: [
            ['아파서 학교에 ___ 가요. (can’t)', ['못', '안', '잘'], 0, 'I’m sick, so I can’t go to school.'],
            ['저는 수영을 ___ 해요. (can’t)', ['못', '안', '못해'], 0, 'I can’t swim.'],
            ['매운 음식은 ___ 먹어요. (can’t)', ['못', '안', '없'], 0, 'I can’t eat spicy food.'],
            ['바빠서 오늘은 ___ 만나요. (can’t)', ['못', '안', '아니'], 0, 'I’m busy, so I can’t meet today.'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep10',
    title: { ko: '약국에서', en: 'At the Pharmacy' },
    panels: [
      { scene: 'room', h: 'M', cast: [['me', 0.38, 'sick'], ['jiji', 0.75, 'think']],
        note: { en: 'The morning after the picnic.' },
        lines: [say('me', '머리가 아파요…', 'My head hurts…'), say('jiji', '', 'Soaked witch, sore throat. Pharmacy. Now.')] },
      { scene: 'pharmacy', h: 'M', cast: [['me', 0.3, 'sick'], ['pharm', 0.75, 'smile', { face: 'left' }]],
        signs: [['약국', 'pharmacy'], ['약', 'medicine']],
        lines: [say('pharm', '어서 오세요. 어디가 아프세요?', 'Hello. Where does it hurt?')] },
      { scene: 'pharmacy', h: 'M', cast: [['me', 0.3, 'talk'], ['pharm', 0.75, 'think', { face: 'left' }]],
        lines: [say('me', '감기에 걸렸어요. 목이 아프고 기침이 나요.', 'I caught a cold. My throat hurts and I’m coughing.')] },
      { scene: 'pharmacy', h: 'M', cast: [['me', 0.3, 'sick'], ['pharm', 0.75, 'talk', { face: 'left' }]],
        lines: [say('pharm', '열도 있어요?', 'Do you have a fever too?'), say('me', '네, 조금 있어요.', 'Yes, a little.')] },
      { scene: 'pharmacy', h: 'M', cast: [['me', 0.3, 'neutral'], ['pharm', 0.75, 'talk', { face: 'left', arms: 'hold', prop: '#a9c8d8' }]],
        lines: [say('pharm', '이 감기약 하루에 세 번 드세요.', 'Take this cold medicine three times a day.'), say('pharm', '식후 삼십 분에 드세요.', 'Thirty minutes after meals.')] },
      { scene: 'pharmacy', h: 'S', cast: [['me', 0.5, 'think', { zoom: 1.5 }]],
        lines: [say('me', '', '식후 — after meals. So 식전 must be before meals.')] },
      { scene: 'pharmacy', h: 'M', cast: [['me', 0.3, 'smile'], ['pharm', 0.75, 'smile', { face: 'left' }]],
        lines: [say('pharm', '푹 쉬세요. 몸조심하세요.', 'Rest well. Take care of yourself.'), say('me', '감사합니다.', 'Thank you.')] },
      { scene: 'room', h: 'M', cast: [['me', 0.38, 'sleepy'], ['jiji', 0.75, 'sleepy']],
        lines: [say('jiji', '오늘은 공부 안 해요. 푹 쉬어요.', 'No studying today. Rest well.')] },
    ],
    quiz: [
      ['What symptoms did she have?', ['A sore throat and a cough', 'A stomach ache', 'A broken arm', 'Only a runny nose'], 0],
      ['How often should she take the medicine?', ['Three times a day', 'Once a day', 'Every hour', 'Twice a day'], 0],
      ['식후 means…', ['After meals', 'Before meals', 'Before bed', 'With water'], 0],
      ['푹 쉬세요 means…', ['Get plenty of rest', 'Eat a lot', 'Come again', 'Go slowly'], 0],
    ],
  },
};
