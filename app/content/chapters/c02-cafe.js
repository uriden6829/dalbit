import { words, phrases, grammar } from '../dsl.js';

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
  // The webtoon episode for this chapter lives in content/story/season1.js.
};
