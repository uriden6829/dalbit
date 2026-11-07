import { words, phrases, grammar, say } from '../dsl.js';

export default {
  id: 'c02',
  b: -2.2,
  title: { ko: '카페에서', en: 'At the Café' },
  blurb: 'Your first real-world spell: ordering a drink. Thing, number, 주세요 — and the questions baristas always ask.',
  lessons: [
    {
      id: 'c02-l1', title: { ko: '카페 단어', en: 'Café words' },
      items: words(`
        차 | tea | Also means “car” — context tells you which. | 따뜻한 차 주세요. = A hot tea, please.
        물 | water | ㄹ at the bottom: mul. | 물 좀 주세요. = Some water, please.
        아메리카노 | americano | Korea runs on iced americanos, even in winter.
        라떼 | latte | | 바닐라 라떼 = vanilla latte
        녹차 | green tea | 녹 = green, 차 = tea.
        아이스 | iced | From English “ice”. | 아이스 아메리카노 = iced americano
        따뜻한 | hot, warm (drinks) | Literally “warm”. In cafés this is how you say hot. | 따뜻한 라떼 = a hot latte
        케이크 | cake
        빵 | bread, pastry | A short, tight ㅃ: ppang.
        잔 | cup (counter for drinks) | 한 잔, 두 잔 = one cup, two cups.
        하나 | one (native number) | For counting things: 하나, 둘, 셋… Before a counter it shrinks to 한.
        둘 | two (native number) | Before a counter: 두 → 두 잔.
        셋 | three (native number) | Before a counter: 세 → 세 잔.
        여기 | here | | 여기 있어요. = Here you go.
        메뉴 | menu
      `),
    },
    {
      id: 'c02-l2', title: { ko: '주문하기', en: 'Ordering' },
      items: [
        ...phrases(`
          아이스 아메리카노 한 잔 주세요. | One iced americano, please. | Possibly the most-said sentence in Korea.
          따뜻한 라떼 두 잔 주세요. | Two hot lattes, please.
          이거 주세요. | This one, please. | Point and say it — works everywhere.
          여기서 드세요? | For here? | The barista’s question. 드세요 = polite “eat/drink”.
          여기서 마실게요. | I’ll drink it here. | For food: 여기서 먹을게요.
          포장해 주세요. | To go, please. | 포장 = packaging, takeout.
          카드 돼요? | Can I pay by card? | 돼요 = does it work?
          진동벨 울리면 오세요. | Come up when the buzzer goes off. | 진동벨 is the vibrating pager they hand you.
        `),
        grammar({
          id: 'g:juseyo', title: '___ 주세요', en: '“…please” (please give me)',
          explain: [
            'Name the thing, then 주세요: 물 주세요 = water, please.',
            'Put the number and counter in between: 커피 한 잔 주세요.',
            'Pointing works: 이거 주세요 = this, please.',
            'Soften it with 좀: 물 좀 주세요 = could I have some water?',
          ],
          examples: [['물 주세요.', 'Water, please.'], ['커피 한 잔 주세요.', 'One coffee, please.'], ['이거 주세요.', 'This one, please.']],
          drills: [
            ['물 ___.', ['주세요', '이에요', '있어요'], 0, 'Water, please.'],
            ['아이스 아메리카노 한 ___ 주세요.', ['잔', '개', '명'], 0, 'One iced americano, please.'],
            ['이거 ___.', ['주세요', '예요', '고마워요'], 0, 'This one, please.'],
            ['녹차 두 ___ 주세요.', ['잔', '사람', '시'], 0, 'Two green teas, please.'],
            ['케이크 하나 ___.', ['주세요', '감사합니다', '미안해요'], 0, 'One piece of cake, please.'],
          ],
        }),
        grammar({
          id: 'g:native-count', title: '한, 두, 세, 네', en: 'counting things with native numbers',
          explain: [
            'Korean has two number systems. To count things you use native numbers: 하나, 둘, 셋, 넷, 다섯…',
            'Before a counter word the first four shrink: 하나→한, 둘→두, 셋→세, 넷→네.',
            'Counters: 잔 (cups), 개 (things), 명 (people), 병 (bottles).',
            'So: 한 잔, 두 잔, 세 개, 네 명.',
          ],
          examples: [['커피 한 잔 주세요.', 'One coffee, please.'], ['빵 세 개 주세요.', 'Three pastries, please.']],
          drills: [
            ['커피 ___ 잔 주세요. (1)', ['한', '하나', '일'], 0, 'One coffee, please.'],
            ['라떼 ___ 잔 주세요. (2)', ['두', '둘', '이'], 0, 'Two lattes, please.'],
            ['빵 ___ 개 주세요. (3)', ['세', '셋', '삼'], 0, 'Three pastries, please.'],
            ['물 ___ 병 주세요. (4)', ['네', '넷', '사'], 0, 'Four bottles of water, please.'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep02',
    title: { ko: '첫 번째 주문', en: 'The First Order' },
    panels: [
      { scene: 'street', h: 'M', time: 'day', cast: [['me', 0.35, 'think'], ['jiji', 0.7, 'smug']],
        note: { en: 'Your first field assignment: order a drink. In Korean.' },
        lines: [say('jiji', '', 'A simple spell. The thing, the number, 주세요. Go on.')],
        signs: [['카페', 'café']] },
      { scene: 'cafe', h: 'M', cast: [['me', 0.28, 'neutral'], ['minji', 0.74, 'smile', { face: 'left' }]],
        lines: [say('minji', '어서 오세요!', 'Welcome!')], signs: [['메뉴', 'menu'], ['아메리카노 4,500', 'americano 4,500 won'], ['녹차 4,500', 'green tea 4,500 won']] },
      { scene: 'cafe', h: 'M', cast: [['me', 0.3, 'talk'], ['minji', 0.74, 'smile', { face: 'left' }]],
        lines: [say('me', '아이스 아메리카노 한 잔 주세요.', 'One iced americano, please.')] },
      { scene: 'cafe', h: 'M', cast: [['me', 0.3, 'think'], ['minji', 0.74, 'talk', { face: 'left' }]],
        lines: [say('minji', '여기서 드세요?', 'For here?'), say('me', '네, 여기서 마실게요.', 'Yes, I’ll drink it here.')] },
      { scene: 'cafe', h: 'M', cast: [['me', 0.3, 'talk'], ['minji', 0.74, 'smile', { face: 'left' }]],
        lines: [say('minji', '사천오백 원이에요.', 'That’s 4,500 won.'), say('me', '카드 돼요?', 'Can I pay by card?'), say('minji', '네, 돼요!', 'Yes, of course!')] },
      { scene: 'cafe', h: 'L', cast: [['jiji', 0.42, 'surprised', { zoom: 2.2 }], ['minji', 0.8, 'surprised', { face: 'left' }]],
        lines: [say('jiji', '저도요! 우유 한 잔 주세요.', 'Me too! A cup of milk, please.'), say('minji', '고양이가… 말해요?!', 'The cat… talks?!')] },
      { scene: 'cafe', h: 'M', cast: [['me', 0.3, 'smile'], ['minji', 0.74, 'happy', { face: 'left', arms: 'hold' }]],
        lines: [say('minji', '진동벨 울리면 오세요.', 'Come up when the buzzer goes off.')] },
      { scene: 'cafe', h: 'M', cast: [['me', 0.3, 'happy', { arms: 'hold', prop: '#7a5236' }], ['minji', 0.74, 'smile', { face: 'left' }]],
        lines: [say('me', '감사합니다!', 'Thank you!'), say('minji', '맛있게 드세요!', 'Enjoy!')] },
    ],
    quiz: [
      ['What did you order?', ['One iced americano', 'Two hot lattes', 'One green tea', 'A cake'], 0],
      ['여기서 드세요? means…', ['For here?', 'Is it hot?', 'How many?', 'Card or cash?'], 0],
      ['What does Jiji order?', ['Milk', 'Coffee', 'Water', 'Cake'], 0],
      ['How much was the drink?', ['4,500 won', '5,000 won', '4,000 won', '1,500 won'], 0],
    ],
  },
};
