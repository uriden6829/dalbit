import { words, phrases, grammar, say } from '../dsl.js';

export default {
  id: 'c03',
  b: -2.0,
  title: { ko: '숫자와 돈', en: 'Numbers & Money' },
  blurb: 'Prices, the second number system, and a midnight trip to the convenience store.',
  lessons: [
    {
      id: 'c03-l1', title: { ko: '숫자', en: 'Sino-Korean numbers' },
      items: words(`
        일 | one (Sino-Korean) | Sino numbers are for prices, dates and phone numbers. | 일 층 = first floor
        이 | two (Sino-Korean) | Same sound as 이 in 이거 (this). Context helps.
        삼 | three (Sino-Korean) | 삼겹살 = “three-layer” pork belly.
        사 | four (Sino-Korean) | Sounds like the word for death, so some lifts skip the 4th floor.
        오 | five (Sino-Korean)
        육 | six (Sino-Korean)
        칠 | seven (Sino-Korean)
        팔 | eight (Sino-Korean)
        구 | nine (Sino-Korean)
        십 | ten | 십일 = 11, 이십 = 20.
        백 | hundred | 오백 = 500
        천 | thousand | 천 원 = 1,000 won
        만 | ten thousand | Korean counts big numbers in 10,000s: 만 원 = 10,000 won.
        원 | won (currency) | | 삼천 원 = 3,000 won
        얼마 | how much | | 얼마예요? = How much is it?
      `),
    },
    {
      id: 'c03-l2', title: { ko: '편의점에서', en: 'At the convenience store' },
      items: [
        ...words(`
          편의점 | convenience store | Open all night, on every corner.
          봉투 | bag (shopping bag) | Shops charge a little for bags.
          영수증 | receipt
          현금 | cash
          카드 | card (credit/debit)
        `),
        ...phrases(`
          얼마예요? | How much is it?
          이거 얼마예요? | How much is this?
          봉투 필요하세요? | Do you need a bag? | The clerk’s question. 필요하다 = to need.
          아니요, 괜찮아요. | No thanks, I’m fine. | A polite way to refuse almost anything.
          봉투 하나 주세요. | One bag, please.
          카드로 할게요. | I’ll pay by card.
          영수증 버려 주세요. | Please throw away the receipt. | Very common at Korean shops.
          데워 드릴까요? | Shall I heat it up? | Convenience stores warm up lunch boxes for you.
        `),
        grammar({
          id: 'g:sino-num', title: '일, 이, 삼… 원', en: 'reading prices',
          explain: [
            'Prices, dates and phone numbers use Sino-Korean numbers: 일, 이, 삼, 사, 오…',
            'Read big numbers in chunks: 3,500 = 삼천 오백.',
            'No 일 in front of 십, 백, 천 or 만: 1,000 = 천, 10,000 = 만.',
            'Korean groups by 만 (10,000): 15,000 = 만 오천.',
          ],
          examples: [['천 원이에요.', 'It’s 1,000 won.'], ['삼천오백 원이에요.', 'It’s 3,500 won.'], ['만 오천 원이에요.', 'It’s 15,000 won.']],
          drills: [
            ['1,000원 = ___ 원', ['천', '일천백', '하나천'], 0, 'one thousand won'],
            ['3,500원 = ___ 원', ['삼천오백', '삼백오천', '셋천오백'], 0, 'three thousand five hundred won'],
            ['10,000원 = ___ 원', ['만', '십천', '천만'], 0, 'ten thousand won'],
            ['2,800원 = ___ 원', ['이천팔백', '이천팔십', '둘천팔백'], 0, 'two thousand eight hundred won'],
            ['15,000원 = ___ 원', ['만 오천', '십오천', '오천만'], 0, 'fifteen thousand won'],
          ],
        }),
        grammar({
          id: 'g:isseoyo', title: '있어요 / 없어요', en: 'there is, I have / there isn’t, I don’t have',
          explain: [
            '___ 있어요 = there is… / I have…   ___ 없어요 = there isn’t… / I don’t have…',
            'Raise your voice to ask a shop: 봉투 있어요? = Do you have bags?',
            'With the subject marker: 봉투가 있어요. 시간이 없어요.',
          ],
          examples: [['봉투 있어요?', 'Do you have bags?'], ['현금이 없어요.', 'I don’t have cash.']],
          drills: [
            ['봉투 ___? (Do you have bags?)', ['있어요', '이에요', '주세요'], 0, 'Do you have bags?'],
            ['죄송해요, 지금 우유가 ___.', ['없어요', '있어요', '예요'], 0, 'Sorry, we’re out of milk right now.'],
            ['화장실 ___? (Is there a restroom?)', ['있어요', '이에요', '얼마예요'], 0, 'Is there a restroom?'],
            ['현금이 ___. 카드로 할게요.', ['없어요', '있어요', '주세요'], 0, 'I don’t have cash. I’ll pay by card.'],
          ],
        }),
      ],
    },
  ],
  episode: {
    id: 'ep03',
    title: { ko: '한밤의 편의점', en: 'The Midnight Convenience Store' },
    panels: [
      { scene: 'street', h: 'M', time: 'night', cast: [['me', 0.35, 'sleepy'], ['jiji', 0.7, 'idle']],
        note: { en: 'Midnight. Studying is hungry work.' },
        lines: [say('jiji', '', 'Convenience store. Bring your counting spells.')] },
      { scene: 'store', h: 'M', cast: [['me', 0.32, 'think'], ['jiji', 0.12, 'idle']],
        note: { en: 'Triangle kimbap, banana milk — and a sign you can almost read.' },
        signs: [['1+1', 'buy one, get one free'], ['행사 상품', 'items on sale'], ['편의점', 'convenience store']] },
      { scene: 'store', h: 'M', cast: [['me', 0.3, 'talk'], ['clerk', 0.75, 'neutral', { face: 'left' }]],
        lines: [say('me', '이거 얼마예요?', 'How much is this?'), say('clerk', '천오백 원이에요.', 'It’s 1,500 won.')] },
      { scene: 'store', h: 'S', cast: [['me', 0.5, 'think', { zoom: 1.5 }]],
        lines: [say('me', '', '천오백… one thousand, five hundred. I got that!')] },
      { scene: 'store', h: 'M', cast: [['me', 0.3, 'smile'], ['clerk', 0.75, 'talk', { face: 'left' }]],
        lines: [say('clerk', '봉투 필요하세요?', 'Do you need a bag?'), say('me', '아니요, 괜찮아요.', 'No thanks, I’m fine.')] },
      { scene: 'store', h: 'M', cast: [['me', 0.3, 'surprised'], ['clerk', 0.75, 'talk', { face: 'left' }]],
        lines: [say('clerk', '데워 드릴까요?', 'Shall I heat it up?'), say('me', '네? 아… 네!', 'Huh? Oh… yes!')] },
      { scene: 'store', h: 'M', cast: [['me', 0.3, 'talk'], ['clerk', 0.75, 'smile', { face: 'left' }]],
        lines: [say('clerk', '모두 삼천 원이에요.', 'That’s 3,000 won altogether.'), say('me', '카드로 할게요.', 'I’ll pay by card.')] },
      { scene: 'store', h: 'L', cast: [['jiji', 0.5, 'smug', { zoom: 2.3 }]],
        lines: [say('jiji', '바나나 우유 1+1이에요.', 'Banana milk is buy-one-get-one.'), say('jiji', '하나는 제 거예요.', 'One of them is mine.')] },
    ],
    quiz: [
      ['How much was the first item?', ['1,500 won', '15,000 won', '500 won', '5,000 won'], 0],
      ['봉투 필요하세요? means…', ['Do you need a bag?', 'Do you need a receipt?', 'Is that everything?', 'Card or cash?'], 0],
      ['How much was the total?', ['3,000 won', '1,500 won', '300 won', '30,000 won'], 0],
      ['1+1 on a sign means…', ['Buy one, get one free', 'Two for 1,000 won', 'One per customer', 'Sold out'], 0],
    ],
  },
};
