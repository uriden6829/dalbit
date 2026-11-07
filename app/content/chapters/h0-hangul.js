import { words } from '../dsl.js';

// Letter rows: key | sound | name | memory hint | syllable to play for listening
function letters(text) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [key, en, name, hint, sayAs] = l.split('|').map((f) => f.trim());
    return { kind: 'letter', key, ko: key.replace(/^-/, ''), en, name, hint, say: sayAs, batchim: key.startsWith('-') };
  });
}

export default {
  id: 'h0',
  b: -3.4,
  title: { ko: '한글', en: 'Hangul' },
  blurb: 'Learn to read Korean letters. Twenty-four basic letters, built like a puzzle. Most people can read in a few evenings.',
  lessons: [
    {
      id: 'h0-l1', title: { ko: '모음 1', en: 'Simple vowels' },
      intro: 'Korean letters stack into syllable blocks. A vowel can’t stand alone, so it borrows a silent circle ㅇ in front of it: 아, 어, 오.',
      items: letters(`
        ㅏ | a | 아 | A tall line with a branch pointing right: “ah”, as in father. | 아
        ㅓ | eo | 어 | The branch points left: an open “uh”, as in up. | 어
        ㅗ | o | 오 | The branch points up: round lips, “oh”. | 오
        ㅜ | u | 우 | The branch points down: “oo”, as in moon. | 우
        ㅡ | eu | 으 | A flat line for flat lips: say “oo” without rounding. | 으
        ㅣ | i | 이 | A standing line: “ee”, as in see. | 이
        ㅇ | silent / ng | 이응 | A circle: a silent placeholder at the start, “ng” at the bottom of a block. | 앙
      `),
    },
    {
      id: 'h0-l2', title: { ko: '자음 1', en: 'First consonants' },
      intro: 'Consonants sit to the left of tall vowels (가) or on top of wide ones (고). The shapes sketch where your tongue and lips go.',
      items: letters(`
        ㄱ | g / k | 기역 | The tongue’s back lifts to the roof of the mouth, like this corner: a soft g. | 가
        ㄴ | n | 니은 | The tongue tip touches behind the teeth: n. | 나
        ㄷ | d / t | 디귿 | ㄴ with a lid: a soft d, between d and t. | 다
        ㄹ | r / l | 리을 | A winding road: a quick tongue flap, like the dd in ladder. | 라
        ㅁ | m | 미음 | A closed square, like closed lips: m. | 마
        ㅂ | b / p | 비읍 | A little bucket: a soft b. | 바
        ㅅ | s | 시옷 | A tooth shape: s (it turns into “sh” before ㅣ: 시). | 사
        ㅈ | j | 지읒 | ㅅ with a lid on top: j. | 자
        ㅎ | h | 히읗 | A small hat over a round head: h. | 하
      `),
    },
    {
      id: 'h0-l3', title: { ko: '모음 2', en: 'Y-vowels and ㅐ ㅔ' },
      intro: 'One extra stroke adds a “y” sound. And two vowels side by side melt into a new one.',
      items: letters(`
        ㅑ | ya | 야 | ㅏ with a second branch: ya. | 야
        ㅕ | yeo | 여 | ㅓ with a second branch: yuh. | 여
        ㅛ | yo | 요 | ㅗ with two strokes up: yo, as in yoga. | 요
        ㅠ | yu | 유 | ㅜ with two strokes down: you. | 유
        ㅐ | ae | 애 | ㅏ + ㅣ: e as in bed. | 애
        ㅔ | e | 에 | ㅓ + ㅣ: also e as in bed. Today ㅐ and ㅔ sound nearly the same. | 에
        ㅒ | yae | 얘 | ㅐ with an extra stroke: ye. Rare. | 얘
        ㅖ | ye | 예 | ㅔ with an extra stroke: ye, as in yes. You’ll see it in 예요. | 예
      `),
    },
    {
      id: 'h0-l4', title: { ko: '자음 2', en: 'Breathy and tense consonants' },
      intro: 'An extra stroke means an extra puff of air. A doubled letter means tight and tense, with no puff at all.',
      items: letters(`
        ㅋ | k | 키읔 | ㄱ plus a stroke = a k with a puff of air. | 카
        ㅌ | t | 티읕 | ㄷ plus a stroke = a breathy t. | 타
        ㅍ | p | 피읖 | A breathy p. Hold a hand to your mouth and feel the air. | 파
        ㅊ | ch | 치읓 | ㅈ with a little hat = a breathy ch. | 차
        ㄲ | kk | 쌍기역 | Double ㄱ: tight throat, no air, like the k in “ski”. | 까
        ㄸ | tt | 쌍디귿 | Double ㄷ: a tense t, like the t in “stop”. | 따
        ㅃ | pp | 쌍비읍 | Double ㅂ: a tense p, like the p in “spy”. | 빠
        ㅆ | ss | 쌍시옷 | Double ㅅ: a sharp, hissing s. | 싸
        ㅉ | jj | 쌍지읒 | Double ㅈ: a tense j. | 짜
      `),
    },
    {
      id: 'h0-l5', title: { ko: '모음 3', en: 'Combined vowels' },
      intro: 'Glide vowels are built from two vowels you already know. Say both quickly and they turn into a w-sound.',
      items: letters(`
        ㅘ | wa | 와 | ㅗ + ㅏ: o-a, said fast, becomes wa. | 와
        ㅙ | wae | 왜 | ㅗ + ㅐ: we, as in wet. 왜 means “why?” | 왜
        ㅚ | oe | 외 | ㅗ + ㅣ: today it sounds like “we”. | 외
        ㅝ | wo | 워 | ㅜ + ㅓ: wuh, as in won (the currency). | 워
        ㅞ | we | 웨 | ㅜ + ㅔ: we. Rare. | 웨
        ㅟ | wi | 위 | ㅜ + ㅣ: wee. | 위
        ㅢ | ui | 의 | ㅡ + ㅣ: slide from eu to ee. | 의
      `),
    },
    {
      id: 'h0-l6', title: { ko: '받침', en: 'Bottom consonants (batchim)' },
      intro: 'A consonant can sit at the bottom of a block. There are many spellings but only seven sounds, and the sound stops short without a puff.',
      items: letters(`
        -ㄱ | final k | 받침 ㄱ | ㄱ ㅋ ㄲ at the bottom all stop like a short k: 국, 밖. | 악
        -ㄴ | final n | 받침 ㄴ | A clear n: 산 (mountain), 눈 (eye). | 안
        -ㄷ | final t | 받침 ㄷ | ㄷ ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ at the bottom all stop like a short t: 옷, 꽃. | 앋
        -ㄹ | final l | 받침 ㄹ | At the bottom, ㄹ is a real l: 물 (water), 별 (star). | 알
        -ㅁ | final m | 받침 ㅁ | Lips close: 밤 (night), 김치. | 암
        -ㅂ | final p | 받침 ㅂ | ㅂ and ㅍ at the bottom: lips close and stop. 밥 (rice), 앞 (front). | 압
        -ㅇ | final ng | 받침 ㅇ | At the bottom, ㅇ is “ng”, as in sing: 강 (river), 방 (room). | 앙
      `),
    },
    {
      id: 'h0-l7', title: { ko: '진짜 단어', en: 'Read real words' },
      intro: 'Time to read real words. Many are borrowed from English, so you already know them. You just haven’t seen them in Hangul yet.',
      items: words(`
        커피 | coffee | Sounds just like English. | 커피 주세요. = Coffee, please.
        바나나 | banana | 바-나-나: three easy blocks.
        피자 | pizza | Breathy ㅍ + 자.
        택시 | taxi | 택 has a bottom ㄱ: taek-si.
        버스 | bus | The ㅡ in 스 is almost silent: beo-seu.
        호텔 | hotel | 호 + 텔, with ㄹ at the bottom.
        카메라 | camera | Breathy ㅋ at the start.
        아이스크림 | ice cream | 아이스 = ice, 크림 = cream.
        라면 | ramyeon (instant noodles) | Korea’s favourite late-night snack.
        김치 | kimchi | 김 ends in ㅁ, 치 has a breathy ㅊ.
        서울 | Seoul | Two syllables: seo-ul.
        한국 | Korea | 한 (Han) + 국 (country).
        우유 | milk | 우-유: two round vowels. | 바나나 우유 = banana milk
        엄마 | mom | Close to “mama”.
        아빠 | dad | Tense ㅃ: a-ppa.
        나무 | tree | 나-무: easy as it looks.
      `),
    },
  ],
  // The webtoon episode for this chapter lives in content/story/season1.js.
};
