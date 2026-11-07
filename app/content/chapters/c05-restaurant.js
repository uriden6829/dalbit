import { words, phrases, grammar } from '../dsl.js';

export default {
  id: 'c05',
  b: -1.6,
  title: { ko: '식당에서', en: 'At a Restaurant' },
  blurb: 'Calling the staff, asking how spicy, more side dishes — and the present tense that makes every verb work.',
  lessons: [
    {
      id: 'c05-l1', title: { ko: '음식 단어', en: 'Food and eating' },
      items: words(`
        식당 | restaurant
        밥 | rice; a meal | 밥 먹었어요? (Have you eaten?) is also a friendly greeting.
        김치찌개 | kimchi stew | 찌개 = stew.
        비빔밥 | bibimbap (mixed rice bowl) | 비비다 = to mix.
        불고기 | bulgogi (marinated beef) | 불 = fire, 고기 = meat.
        반찬 | side dishes | Free and refillable at most restaurants.
        메뉴판 | menu (the physical menu)
        맛있다 | to be delicious | | 맛있어요! = It’s delicious!
        맵다 | to be spicy | Changes shape: 매워요. | 이거 매워요? = Is this spicy?
        짜다 | to be salty | | 좀 짜요. = It’s a bit salty.
        숟가락 | spoon
        젓가락 | chopsticks | Korean chopsticks are usually metal and flat.
        먹다 | to eat | | 먹어요 = I eat
        마시다 | to drink | | 마셔요 = I drink
        계산 | the bill, paying | | 계산해 주세요. = The bill, please.
      `),
    },
    {
      id: 'c05-l2', title: { ko: '식당에서 말하기', en: 'At the table' },
      items: [
        ...phrases(`
          저기요! | Excuse me! (to call staff) | Perfectly polite in a Korean restaurant — say it clearly.
          메뉴판 좀 주세요. | Could I see the menu?
          이거 매워요? | Is this spicy?
          덜 맵게 해 주세요. | Less spicy, please.
          반찬 좀 더 주세요. | Could we have more side dishes?
          맛있어요! | It’s delicious!
          계산해 주세요. | The bill, please.
          잘 먹었습니다. | Thank you for the meal. | Said after eating — to the cook, the host, or the staff as you leave.
        `),
        grammar({
          id: 'g:ayo', title: '-아요 / -어요 / 해요', en: 'present tense, polite',
          explain: [
            'Take the dictionary form, drop 다, and look at the last vowel.',
            'ㅏ or ㅗ → 아요: 가다 → 가요, 보다 → 봐요, 앉다 → 앉아요.',
            'Any other vowel → 어요: 먹다 → 먹어요, 마시다 → 마셔요, 맛있다 → 맛있어요.',
            '하다 → 해요: 계산하다 → 계산해요.',
            'A few change shape: 맵다 → 매워요 (ㅂ turns into 워).',
          ],
          examples: [['비빔밥을 먹어요.', 'I eat bibimbap.'], ['물을 마셔요.', 'I drink water.'], ['식당에 가요.', 'I go to a restaurant.']],
          drills: [
            ['저는 비빔밥을 ___. (먹다)', ['먹어요', '먹아요', '먹요'], 0, 'I eat bibimbap.'],
            ['물을 ___. (마시다)', ['마셔요', '마시아요', '마시요'], 0, 'I drink water.'],
            ['식당에 ___. (가다)', ['가요', '가아요', '거요'], 0, 'I go to a restaurant.'],
            ['이 김치찌개 정말 ___! (맛있다)', ['맛있어요', '맛있아요', '맛있요'], 0, 'This kimchi stew is really delicious!'],
            ['지금 계산___. (하다)', ['해요', '하요', '하아요'], 0, 'I’m paying now.'],
          ],
        }),
        grammar({
          id: 'g:an', title: '안 + verb', en: 'not, don’t',
          explain: [
            'Put 안 right in front of the verb: 안 먹어요 = I don’t eat.',
            'Works for descriptions too: 안 매워요 = it’s not spicy.',
            'For 하다 verbs, 안 goes before 하다: 운동 안 해요.',
          ],
          examples: [['이거 안 매워요.', 'This isn’t spicy.'], ['커피를 안 마셔요.', 'I don’t drink coffee.']],
          drills: [
            ['이거 ___ 매워요. (not spicy)', ['안', '못', '잘'], 0, 'This isn’t spicy.'],
            ['저는 고기를 ___ 먹어요.', ['안', '아니요', '없어요'], 0, 'I don’t eat meat.'],
            ['커피를 ___ 마셔요.', ['안', '아니', '못해'], 0, 'I don’t drink coffee.'],
            ['오늘은 운동 ___ 해요.', ['안', '아니', '없어'], 0, 'I’m not exercising today.'],
          ],
        }),
      ],
    },
  ],
  // The webtoon episode for this chapter lives in content/story/season1.js.
};
