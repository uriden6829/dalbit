import { words, phrases, grammar } from '../dsl.js';

export default {
  id: 'c12',
  b: -0.2,
  title: { ko: '전화와 메시지', en: 'Phone & Messages' },
  blurb: 'Phone calls without panic: “once more”, “slowly please”, addresses — and ordering delivery like a local.',
  lessons: [
    {
      id: 'c12-l1', title: { ko: '전화 단어', en: 'Phone words' },
      items: words(`
        전화 | phone call; telephone | | 전화할게요. = I’ll call.
        핸드폰 | mobile phone | From “hand phone”.
        문자 | text message | | 문자 보낼게요. = I’ll text you.
        번호 | number | | 전화번호 = phone number
        배달 | delivery | Almost anything can be delivered in Korea, day or night.
        주소 | address
        주문 | an order (food, shopping)
        잠깐만요 | just a moment | The most useful word on the phone.
        다시 | again
        천천히 | slowly
        알다 | to know | | 알겠습니다. = Understood.
        모르다 | to not know | | 몰라요. = I don’t know.
        이해하다 | to understand
        보내다 | to send
        기다리다 | to wait
      `),
    },
    {
      id: 'c12-l2', title: { ko: '전화하기', en: 'On the phone' },
      items: [
        ...phrases(`
          여보세요? | Hello? (on the phone only)
          다시 한 번 말해 주세요. | Please say that once more.
          천천히 말해 주세요. | Please speak slowly.
          잘 모르겠어요. | I’m not sure. / I don’t quite get it. | A soft, polite way to say “I don’t know”.
          잠깐만 기다려 주세요. | Please wait a moment.
          문자로 보내 주세요. | Please send it by text.
          배달 돼요? | Do you deliver?
          주소가 어떻게 되세요? | What’s the address? (polite)
        `),
        grammar({
          id: 'g:a-juseyo', title: '-아/어 주세요', en: 'please do it (for me)',
          explain: [
            'Verb + 아/어 주세요 asks someone to do something for you: 말해 주세요 = please tell me.',
            'Same vowel rule: 기다리다 → 기다려 주세요, 보내다 → 보내 주세요, 찍다 → 찍어 주세요.',
            'Compare: 물 주세요 (give me water) and 도와 주세요 (please help me).',
          ],
          examples: [['천천히 말해 주세요.', 'Please speak slowly.'], ['잠깐만 기다려 주세요.', 'Please wait a moment.']],
          drills: [
            ['천천히 말___ 주세요. (말하다)', ['해', '하', '해서'], 0, 'Please speak slowly.'],
            ['잠깐만 기다___ 주세요. (기다리다)', ['려', '리어서', '리'], 0, 'Please wait a moment.'],
            ['문자로 보___ 주세요. (보내다)', ['내', '내어서', '네'], 0, 'Please send it by text.'],
            ['사진 좀 찍___ 주세요. (찍다)', ['어', '아', '고'], 0, 'Please take a photo.'],
          ],
        }),
        grammar({
          id: 'g:kkayo', title: '-(으)ㄹ까요?', en: 'shall we…? / shall I…?',
          explain: [
            'Stem + (으)ㄹ까요? suggests or offers: 갈까요? = Shall we go?',
            'Vowel stem → ㄹ까요: 할까요, 볼까요, 만날까요.',
            'Consonant stem → 을까요: 먹을까요, 앉을까요.',
            'It can also wonder aloud: 비가 올까요? = Do you think it’ll rain?',
          ],
          examples: [['치킨 시킬까요?', 'Shall we order chicken?'], ['어디에서 만날까요?', 'Where shall we meet?']],
          drills: [
            ['같이 영화 ___? (보다)', ['볼까요', '보을까요', '봐까요'], 0, 'Shall we watch a movie together?'],
            ['뭐 ___? (먹다)', ['먹을까요', '먹ㄹ까요', '멀까요'], 0, 'What shall we eat?'],
            ['어디에서 ___? (만나다)', ['만날까요', '만나을까요', '만났까요'], 0, 'Where shall we meet?'],
            ['제가 전화___? (하다)', ['할까요', '하을까요', '해까요'], 0, 'Shall I call?'],
          ],
        }),
      ],
    },
  ],
  // The webtoon episode for this chapter lives in content/story/season1.js.
};
