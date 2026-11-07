import { words, phrases, grammar } from '../dsl.js';

export default {
  id: 'c01',
  b: -2.4,
  title: { ko: '첫인사', en: 'First Greetings' },
  blurb: 'Hello, thank you, sorry, and how to say who you are. The spells every day begins with.',
  lessons: [
    {
      id: 'c01-l1', title: { ko: '인사말', en: 'Everyday words' },
      items: words(`
        안녕하세요 | hello (polite) | Literally “are you at peace?” Works morning, noon and night. | 안녕하세요, 지지 씨! = Hello, Jiji!
        감사합니다 | thank you (formal) | ㅂ before ㄴ sounds like ㅁ: gam-sa-ham-ni-da. | 정말 감사합니다. = Thank you so much.
        고마워요 | thanks (warm, polite) | Softer than 감사합니다. For people you know.
        네 | yes | Also “uh-huh, I see” while listening. | 네, 맞아요. = Yes, that’s right.
        아니요 | no | | 아니요, 괜찮아요. = No, I’m fine.
        죄송합니다 | I’m sorry (formal) | The serious, respectful apology.
        미안해요 | sorry (softer) | For small things, with people you know.
        괜찮아요 | it’s okay / I’m fine | One of the most useful words in Korea. | 괜찮아요? = Are you okay?
        이름 | name | | 이름이 뭐예요? = What’s your name?
        저 | I, me (humble) | Use 저 with anyone you’re polite to. | 저는 학생이에요. = I’m a student.
        학생 | student | 학 = learning, 생 = life/person.
        선생님 | teacher | Also a respectful way to address doctors and professionals.
        사람 | person | | 한국 사람 = a Korean person
        친구 | friend | | 제 친구예요. = This is my friend.
        고양이 | cat | 고-양-이 rolls like a purr. | 지지는 고양이예요. = Jiji is a cat.
        마법 | magic | | 마법 학교 = magic school
      `),
    },
    {
      id: 'c01-l2', title: { ko: '자기소개', en: 'Introducing yourself' },
      items: [
        ...phrases(`
          처음 뵙겠습니다. | Nice to meet you. (very polite) | Literally “I am seeing you for the first time.”
          만나서 반가워요. | Nice to meet you. (warm) | 만나서 = since we met, 반가워요 = I’m glad.
          이름이 뭐예요? | What’s your name? | Fine with peers; with elders, 성함이 어떻게 되세요?
          제 이름은 지지예요. | My name is Jiji. | 제 = my (humble form).
          저는 학생이에요. | I’m a student.
          안녕히 가세요. | Goodbye. (to someone who is leaving) | “Go in peace.”
          안녕히 계세요. | Goodbye. (when you are the one leaving) | “Stay in peace.”
          또 만나요. | See you again.
        `),
        grammar({
          id: 'g:ieyo', title: '이에요 / 예요', en: '“to be”: am / is / are',
          explain: [
            'Attach it straight to a noun: 학생이에요 = (I) am a student.',
            'Noun ends in a consonant (has a bottom letter) → 이에요: 학생이에요, 선생님이에요.',
            'Noun ends in a vowel → 예요: 친구예요, 고양이예요.',
            'Raise your voice at the end to ask: 학생이에요? ↗',
          ],
          examples: [['저는 학생이에요.', 'I’m a student.'], ['지지는 고양이예요.', 'Jiji is a cat.'], ['제 친구예요.', 'This is my friend.']],
          drills: [
            ['저는 학생___.', ['이에요', '예요'], 0, 'I am a student.'],
            ['지지는 고양이___.', ['이에요', '예요'], 1, 'Jiji is a cat.'],
            ['제 친구___.', ['이에요', '예요'], 1, 'This is my friend.'],
            ['서 선생님___.', ['이에요', '예요'], 0, 'This is Teacher Seo.'],
            ['한국 사람___?', ['이에요', '예요'], 0, 'Are you Korean?'],
            ['커피___.', ['이에요', '예요'], 1, 'It’s coffee.'],
          ],
        }),
        grammar({
          id: 'g:eun-neun', title: '은 / 는', en: 'topic marker: “as for…”',
          explain: [
            'Marks what the sentence is about: 저는… = as for me…',
            'After a consonant → 은: 이름은, 선생님은.',
            'After a vowel → 는: 저는, 지지는.',
            'It often adds a little contrast: 저는 학생이에요 (as for me, I’m a student).',
          ],
          examples: [['저는 학생이에요.', 'I’m a student.'], ['제 이름은 지지예요.', 'My name is Jiji.']],
          drills: [
            ['저___ 학생이에요.', ['은', '는'], 1, 'I am a student.'],
            ['제 이름___ 지지예요.', ['은', '는'], 0, 'My name is Jiji.'],
            ['선생님___ 한국 사람이에요.', ['은', '는'], 0, 'The teacher is Korean.'],
            ['지지___ 고양이예요.', ['은', '는'], 1, 'Jiji is a cat.'],
            ['친구___ 학생이에요.', ['은', '는'], 1, 'My friend is a student.'],
          ],
        }),
      ],
    },
  ],
  // The webtoon episode for this chapter lives in content/story/season1.js.
};
