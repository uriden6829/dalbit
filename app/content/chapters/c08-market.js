import { words, phrases, grammar } from '../dsl.js';

export default {
  id: 'c08',
  b: -1.0,
  title: { ko: '시장에서', en: 'At the Market' },
  blurb: 'This, that, that over there. Prices, bargaining with a smile, trying things on — and the vendor’s little extra.',
  lessons: [
    {
      id: 'c08-l1', title: { ko: '시장 단어', en: 'Market words' },
      items: words(`
        시장 | market | | 전통 시장 = traditional market
        과일 | fruit
        사과 | apple | Also means “apology” — a different word that sounds the same.
        딸기 | strawberry
        비싸다 | to be expensive | | 너무 비싸요. = It’s too expensive.
        싸다 | to be cheap
        크다 | to be big | Changes shape: 커요.
        작다 | to be small
        이거 | this (thing) | Near me.
        그거 | that (thing) | Near you.
        저거 | that (thing) over there | Far from both of us.
        사다 | to buy | | 사요 = I buy
        팔다 | to sell
        개 | piece, item (counter) | | 사과 세 개 = three apples
        덤 | a little extra, free | Market vendors love adding a bit of 덤.
      `),
    },
    {
      id: 'c08-l2', title: { ko: '흥정하기', en: 'Buying and bargaining' },
      items: [
        ...phrases(`
          딸기 한 팩에 얼마예요? | How much for a pack of strawberries?
          너무 비싸요. | That’s too expensive.
          좀 깎아 주세요. | Could you give me a discount? | Fine at markets, not in department stores.
          사과 세 개 주세요. | Three apples, please.
          다른 색깔 있어요? | Do you have it in another colour?
          이거 입어 봐도 돼요? | Can I try this on?
          이걸로 할게요. | I’ll take this one.
          그냥 구경하는 거예요. | I’m just looking.
        `),
        grammar({
          id: 'g:bwado', title: '-아/어 봐도 돼요?', en: 'may I try…?',
          explain: [
            '-아/어 보다 = to try doing; -아/어도 돼요? = is it okay if…?',
            'Together: 입어 봐도 돼요? = May I try it on?',
            'Same vowel rule as -아요/어요: 먹어 봐도 돼요? (taste), 신어 봐도 돼요? (shoes).',
            'The answer: 네, 돼요 or 그럼요 (of course).',
          ],
          examples: [['이거 입어 봐도 돼요?', 'May I try this on?'], ['하나 먹어 봐도 돼요?', 'May I taste one?']],
          drills: [
            ['이거 입___ 봐도 돼요?', ['어', '아'], 0, 'May I try this on?'],
            ['하나 먹___ 봐도 돼요?', ['어', '아'], 0, 'May I taste one?'],
            ['이 신발 신___ 봐도 돼요?', ['어', '아'], 0, 'May I try these shoes on?'],
            ['이거 만져 봐도 ___?', ['돼요', '해요', '줘요'], 0, 'May I touch this?'],
            ['네, ___.', ['돼요', '되요', '됬어요'], 0, 'Yes, you may.'],
          ],
        }),
        grammar({
          id: 'g:eulge', title: '-(으)ㄹ게요', en: 'I’ll… (telling someone your decision)',
          explain: [
            'Use it to tell someone what you’ve decided to do: 이걸로 할게요 = I’ll take this one.',
            'Stem ends in a vowel → ㄹ게요: 할게요, 갈게요, 볼게요.',
            'Stem ends in a consonant → 을게요: 먹을게요, 앉을게요.',
            'It sounds considerate: you’re letting the listener know your plan.',
          ],
          examples: [['이걸로 할게요.', 'I’ll take this one.'], ['내일 다시 올게요.', 'I’ll come back tomorrow.']],
          drills: [
            ['이걸로 ___. (하다)', ['할게요', '하을게요', '핼게요'], 0, 'I’ll take this one.'],
            ['여기서 ___. (먹다)', ['먹을게요', '멀게요', '먹할게요'], 0, 'I’ll eat here.'],
            ['조금 더 ___. (보다)', ['볼게요', '보을게요', '봘게요'], 0, 'I’ll look around a bit more.'],
            ['내일 다시 ___. (오다)', ['올게요', '오을게요', '왈게요'], 0, 'I’ll come back tomorrow.'],
          ],
        }),
      ],
    },
  ],
  // The webtoon episode for this chapter lives in content/story/season1.js.
};
