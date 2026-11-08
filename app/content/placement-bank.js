// Entrance-exam item bank. Levels follow TOPIK (0 = Hangul, 1..6 = TOPIK 1..6).
// The CORRECT option is always written FIRST; options are shuffled when shown.
// Difficulty (b) comes from the level by hand — not yet calibrated on real answers.
// Skills: hangul, vocab, grammar, reading, listening.
// A listening conversation has one turn per line ('질문?\n대답.'): a woman and a man read the turns (voicecast.js).

const LEVEL_B = { 0: -3.4, 1: -2.2, 2: -1.0, 3: 0.2, 4: 1.3, 5: 2.3, 6: 3.2 };
let n = 0;
const mk = (skill, level, prompt, options, extra = {}) => ({ id: `pl${++n}`, skill, level, b: LEVEL_B[level] + (extra.db || 0), prompt, options });

const read = (level, ko, options, db) => mk('hangul', level, { ko, ask: 'What does this say?' }, options, { db });
const hear = (level, audio, options, db) => mk('hangul', level, { audio, ask: 'Which one did you hear?' }, options, { db });
const V = (level, ko, options, db) => mk('vocab', level, { ko, ask: 'What does it mean?' }, options, { db });
const VK = (level, en, options, db) => mk('vocab', level, { en, ask: 'Which is it in Korean?' }, options, { db });
const G = (level, cloze, options, en, db) => mk('grammar', level, { cloze, en, ask: 'Fill in the blank' }, options, { db });
const R = (level, passage, q, options, db) => mk('reading', level, { passage, q, ask: 'Read and answer' }, options, { db });
const L = (level, audio, q, options, db) => mk('listening', level, { audio, q, ask: 'Listen and answer' }, options, { db });

export const BANK = [
  // ---- Hangul ----
  read(0, '바나나', ['banana', 'pizza', 'camera', 'taxi']),
  read(0, '커피', ['coffee', 'cookie', 'café', 'copy']),
  read(0, '서울', ['Seoul', 'Busan', 'Korea', 'school'], 0.2),
  hear(0, '고', ['고', '구', '거', '기']),
  read(0, '택시', ['taxi', 'tennis', 'text', 'bus'], 0.2),
  hear(0, '라면', ['라면', '나면', '러면', '라민'], 0.3),
  read(0, '김치', ['kimchi', 'kimbap', 'kitchen', 'cheese'], 0.1),
  read(0, '아이스크림', ['ice cream', 'ice coffee', 'cream cake', 'iced tea'], 0.4),

  // ---- TOPIK 1 ----
  V(1, '물', ['water', 'fire', 'rice', 'tea'], -0.3),
  V(1, '학교', ['school', 'hospital', 'store', 'house'], -0.2),
  V(1, '고양이', ['cat', 'dog', 'bird', 'fish']),
  V(1, '감사합니다', ['thank you', 'hello', 'sorry', 'goodbye'], -0.3),
  V(1, '어제', ['yesterday', 'today', 'tomorrow', 'now'], 0.2),
  V(1, '사과', ['apple', 'pear', 'grape', 'strawberry']),
  VK(1, 'book', ['책', '집', '차', '밥'], 0.1),
  G(1, '저는 학생___.', ['이에요', '예요', '을', '에'], 'I am a student.', -0.2),
  G(1, '이것은 사과___.', ['예요', '이에요', '가', '을'], 'This is an apple.'),
  G(1, '친구___ 커피를 마셔요.', ['가', '이', '을', '에서'], 'My friend drinks coffee.', 0.2),
  G(1, '지금 집___ 있어요.', ['에', '을', '가', '와'], 'I’m at home now.', 0.2),
  G(1, '저는 밥을 ___.', ['먹어요', '먹아요', '먹요', '먹어다'], 'I eat rice.', 0.3),
  R(1, '저는 민지예요. 한국 사람이에요. 학생이에요.', 'Who is Minji?', ['A Korean student', 'A Korean teacher', 'A Japanese student', 'A cat'], -0.2),
  R(1, '카페 메뉴\n아메리카노 3,000원\n라떼 3,500원', 'How much is a latte?', ['3,500 won', '3,000 won', '5,300 won', '3,050 won']),
  R(1, '오늘은 토요일이에요. 저는 친구를 만나요.', 'What day is it today?', ['Saturday', 'Sunday', 'Friday', 'Monday'], 0.2),
  R(1, '지지는 고양이예요. 지지는 생선을 좋아해요.', 'What does Jiji like?', ['Fish', 'Milk', 'Meat', 'Bread'], 0.3),
  L(1, '안녕하세요.', 'What did you hear?', ['Hello', 'Thank you', 'Sorry', 'Goodbye'], -0.4),
  L(1, '커피 한 잔 주세요.', 'What does the person want?', ['One coffee', 'Two coffees', 'One tea', 'Water']),
  L(1, '이거 얼마예요?', 'What is the person asking?', ['How much is this?', 'What is this?', 'Where is this?', 'Is this yours?'], 0.1),
  L(1, '내일 만나요.', 'What did they say?', ['See you tomorrow', 'See you today', 'I met you yesterday', 'Let’s eat tomorrow'], 0.2),

  // ---- TOPIK 2 ----
  V(2, '병원', ['hospital', 'bank', 'library', 'post office'], -0.3),
  V(2, '시장', ['market', 'station', 'park', 'airport']),
  V(2, '비싸다', ['to be expensive', 'to be cheap', 'to be big', 'to be delicious']),
  V(2, '피곤하다', ['to be tired', 'to be hungry', 'to be busy', 'to be sick'], 0.1),
  V(2, '주말', ['weekend', 'weekday', 'vacation', 'morning'], -0.2),
  V(2, '날씨', ['weather', 'time', 'season', 'sky'], 0.1),
  VK(2, 'to wait', ['기다리다', '가르치다', '기억하다', '기르다'], 0.3),
  G(2, '어제 영화를 ___.', ['봤어요', '봐요', '볼 거예요', '보세요'], 'I watched a movie yesterday.', -0.2),
  G(2, '배가 고파___ 밥을 먹었어요.', ['서', '지만', '고', '면'], 'I was hungry, so I ate.'),
  G(2, '내일 친구를 만날 ___.', ['거예요', '고 있어요', '어요', '았어요'], 'I will meet a friend tomorrow.'),
  G(2, '한국어를 배우___ 싶어요.', ['고', '서', '면', '지만'], 'I want to learn Korean.', -0.1),
  G(2, '여기에 앉___ 돼요?', ['아도', '어도', '지만', '고'], 'May I sit here?', 0.3),
  R(2, '민지 씨, 내일 저녁 7시에 강남역 2번 출구에서 만나요. 늦지 마세요!', 'Where will they meet?', ['Gangnam Station, exit 2', 'Gangnam Station, exit 7', 'Seoul Station, exit 2', 'A restaurant in Gangnam']),
  R(2, '[안내] 이번 주 토요일은 도서관이 쉽니다. 일요일에는 오전 10시에 문을 엽니다.', 'When does the library open this weekend?', ['Sunday at 10 a.m.', 'Saturday at 10 a.m.', 'Sunday at 10 p.m.', 'It is closed all weekend'], 0.2),
  R(2, '오늘 회사에 일이 많아서 조금 늦을 것 같아요. 먼저 드세요.', 'What does the writer say?', ['They will be late — start eating', 'They can’t come at all', 'They are already there', 'They want to eat first'], 0.3),
  R(2, '저는 주말에 보통 집에서 쉬어요. 그런데 이번 주말에는 부산에 여행을 가요.', 'What will the writer do this weekend?', ['Travel to Busan', 'Rest at home', 'Work in Busan', 'Have a party at home']),
  L(2, '지하철역이 어디예요?', 'The speaker is looking for…', ['the subway station', 'the bus stop', 'a restroom', 'a hospital'], -0.2),
  L(2, '오늘은 바빠서 못 가요. 미안해요.', 'What does the speaker mean?', ['They can’t go today because they’re busy', 'They will go later today', 'They are not busy today', 'They went yesterday']),
  L(2, '이 옷 좀 입어 봐도 돼요?', 'Where is this most likely said?', ['A clothing store', 'A restaurant', 'A hospital', 'A bank'], 0.1),
  L(2, '두 시에 회의가 있어요.', 'What did you hear?', ['There is a meeting at two', 'There is a meeting at twelve', 'The meeting is in two days', 'There are two meetings'], 0.2),

  // ---- TOPIK 3 ----
  V(3, '경험', ['experience', 'exam', 'economy', 'scenery'], -0.2),
  V(3, '준비하다', ['to prepare', 'to hurry', 'to promise', 'to explain'], -0.3),
  V(3, '불편하다', ['to be uncomfortable / inconvenient', 'to be unfamiliar', 'to be unfair', 'to be unhealthy']),
  V(3, '이사하다', ['to move house', 'to quit a job', 'to travel', 'to get married'], 0.1),
  V(3, '소개하다', ['to introduce', 'to invite', 'to consult', 'to deliver']),
  V(3, '갑자기', ['suddenly', 'slowly', 'always', 'finally'], 0.2),
  G(3, '한국에 온 지 1년___ 됐어요.', ['이', '을', '에', '와'], 'It has been a year since I came to Korea.'),
  G(3, '비가 오___ 우산을 가져가세요.', ['니까', '지만', '다가', '려고'], 'It’s raining, so take an umbrella.', -0.2),
  G(3, '시간이 있으면 같이 영화를 볼___?', ['까요', '래서', '니까', '지만'], 'If you have time, shall we watch a movie?', -0.2),
  G(3, '이 책은 읽___ 쉬워요.', ['기', '고', '게', '서'], 'This book is easy to read.', 0.2),
  G(3, '저는 매운 음식을 먹___ 수 있어요.', ['을', '는', '은', '던'], 'I can eat spicy food.'),
  R(3, '저는 작년에 한국에 왔습니다. 처음에는 한국어를 잘 몰라서 많이 힘들었습니다. 하지만 지금은 친구들과 한국어로 이야기할 수 있습니다.', 'Which is true?', ['It was hard at first, but now they can talk in Korean', 'They came to Korea this year', 'They still cannot speak Korean', 'They studied Korean before coming']),
  R(3, '엘리베이터 점검 안내: 3월 5일 오전 9시부터 12시까지 엘리베이터를 사용할 수 없습니다. 계단을 이용해 주시기 바랍니다.', 'What should residents do on the morning of March 5?', ['Use the stairs', 'Use the elevator before 9', 'Call the office', 'Stay home until 12'], 0.2),
  R(3, '요즘 날씨가 갑자기 추워져서 감기에 걸린 사람이 많습니다. 외출할 때는 따뜻한 옷을 입으세요.', 'What is the main message?', ['Dress warmly — colds are going around', 'The weather is getting warmer', 'Many people go out in winter', 'Colds are not serious']),
  R(3, '이 식당은 음식이 맛있지만 항상 사람이 많아서 오래 기다려야 해요.', 'Which is true?', ['The food is good, but you have to wait a long time', 'The food is bad but cheap', 'There are never many people', 'You never need to wait'], -0.1),
  L(3, '죄송하지만 지금 자리가 없어서 삼십 분쯤 기다리셔야 해요.', 'What is the situation?', ['No seats now — about a 30-minute wait', 'The restaurant is closed', 'Seats will be free in 3 minutes', 'The food will take 30 minutes']),
  L(3, '주말에 뭐 할 거예요?\n친구 결혼식이 있어서 대전에 가요.', 'Why is the second speaker going to Daejeon?', ['A friend’s wedding', 'A business trip', 'To visit family', 'A concert'], 0.2),
  L(3, '이 약은 하루에 세 번, 식사 후에 드세요.', 'How should the medicine be taken?', ['Three times a day, after meals', 'Once a day, before meals', 'Three pills at once', 'Only before sleep'], 0.1),

  // ---- TOPIK 4 ----
  V(4, '꾸준히', ['steadily, consistently', 'rarely', 'urgently', 'roughly']),
  V(4, '해결하다', ['to solve', 'to explain', 'to cancel', 'to decide'], -0.2),
  V(4, '영향', ['influence', 'income', 'image', 'impression'], 0.1),
  V(4, '줄이다', ['to reduce', 'to line up', 'to hand over', 'to wake up']),
  G(4, '한국어 실력이 늘___ 매일 연습하고 있어요.', ['도록', '더니', '자마자', '는데도'], 'I practise every day so that my Korean improves.'),
  G(4, '아무리 바빠___ 아침은 꼭 먹어요.', ['도', '서', '면', '니까'], 'No matter how busy I am, I always eat breakfast.', -0.2),
  G(4, '그 영화가 그렇게 재미있___? 저도 봐야겠어요.', ['다면서요', '더라도', '고서', '느라고'], 'I heard that movie is that good? I should see it too.', 0.3),
  G(4, '어제 시험 공부를 하___ 잠을 못 잤어요.', ['느라고', '도록', '다가는', '더라도'], 'I couldn’t sleep because I was studying for the exam.'),
  R(4, '최근 혼자 사는 사람이 늘면서 소포장 식품의 판매가 크게 증가했다. 한 번에 먹을 만큼만 사려는 소비자가 많아졌기 때문이다.', 'Why have small-package food sales increased?', ['More people live alone and buy only what they need', 'Food prices have fallen', 'Families are getting bigger', 'Supermarkets have closed']),
  R(4, '이 공원은 시민들의 의견을 반영하여 새로 단장되었다. 산책로가 넓어졌고 밤에도 안전하게 이용할 수 있도록 조명이 설치되었다.', 'Which is true?', ['Lights were installed so it is safe at night', 'The park was closed to citizens', 'The paths became narrower', 'Citizens opposed the renovation'], 0.1),
  R(4, '고객들의 불만이 계속되자 회사는 결국 서비스 요금 인상 계획을 취소하기로 했다.', 'What happened?', ['The company cancelled its price rise after complaints', 'Customers agreed to higher prices', 'The company raised its prices', 'The service was discontinued'], -0.1),
  L(4, '이번 프로젝트 마감이 언제까지죠?\n원래는 금요일이었는데 다음 주 수요일로 연기됐어요.', 'When is the new deadline?', ['Next Wednesday', 'This Friday', 'Next Friday', 'This Wednesday']),
  L(4, '이번 역은 시청, 시청역입니다. 내리실 문은 오른쪽입니다. 1호선으로 갈아타실 고객께서는 이번 역에서 내리시기 바랍니다.', 'What should passengers changing to Line 1 do?', ['Get off at City Hall', 'Get off at the next station', 'Use the left-side door', 'Stay on the train'], -0.1),
  L(4, '요즘 일이 너무 많아서 운동할 시간이 없어요. 그래서 출퇴근할 때 한 정거장 먼저 내려서 걸어요.', 'What does the speaker do?', ['Walks part of the commute to get exercise', 'Goes to the gym after work', 'Quit their job', 'Takes a taxi to work'], 0.2),

  // ---- TOPIK 5 ----
  V(5, '불가피하다', ['to be unavoidable', 'to be unbelievable', 'to be irreversible', 'to be incomparable']),
  V(5, '간과하다', ['to overlook', 'to oversee', 'to persuade', 'to imitate'], 0.2),
  V(5, '우려', ['concern, worry', 'prospect', 'custom', 'consent'], -0.2),
  V(5, '신중하다', ['to be careful, prudent', 'to be stubborn', 'to be generous', 'to be anxious']),
  G(5, '그 사람은 돈이 많___ 행복해 보이지 않는다.', ['음에도 불구하고', '을 테니까', '더라', '다시피'], 'Despite having a lot of money, he doesn’t look happy.', -0.2),
  G(5, '시간이 없어서 숙제를 대충 하___ 말았어요.', ['고', '게', '지', '서'], 'I had no time, so I ended up doing my homework carelessly.'),
  G(5, '그렇게 무리하___는 건강을 해칠 수도 있어요.', ['다가', '도록', '더니', '자'], 'If you keep overdoing it like that, you could ruin your health.', 0.2),
  R(5, '전문가들은 무분별한 개발이 지역 생태계에 돌이킬 수 없는 피해를 줄 수 있다고 경고하며, 개발에 앞서 철저한 환경 영향 평가가 이루어져야 한다고 강조했다.', 'What do the experts emphasise?', ['A thorough environmental assessment before development', 'Stopping all development permanently', 'Developing the region faster', 'That ecosystems recover quickly']),
  R(5, '저출산 문제를 해결하기 위해서는 단순히 출산 장려금을 지급하는 것을 넘어, 일과 육아를 병행할 수 있는 사회적 환경을 조성하는 것이 무엇보다 중요하다.', 'What is the writer’s main point?', ['An environment for balancing work and childcare matters most', 'Childbirth subsidies alone are enough', 'The low birth rate is not a real problem', 'Parents should quit their jobs'], 0.2),
  R(5, '이 제품은 출시 직후 품질 논란에 휩싸였으나, 회사가 신속하게 문제를 인정하고 전량 교환해 주면서 오히려 소비자의 신뢰를 얻게 되었다.', 'What happened?', ['The company admitted the problem quickly and gained trust', 'The product launched with no problems', 'The company denied the quality issue', 'Consumers lost trust in the company']),
  L(5, '이번 정책이 시행되면 중소기업의 부담이 커질 거라는 지적이 있는데요.\n네, 그래서 정부는 일정 기간 동안 지원금을 제공해 그 부담을 덜어 줄 계획입니다.', 'How will the government respond to the concern?', ['Provide subsidies for a period to ease the burden', 'Cancel the policy', 'Raise taxes on small firms', 'Delay the policy indefinitely']),
  L(5, '전문가들은 수면 시간보다 수면의 질이 더 중요하다며, 잠들기 전 스마트폰 사용을 줄일 것을 권고했습니다.', 'What do the experts recommend?', ['Using phones less before bed — quality of sleep matters more', 'Sleeping more than eight hours', 'Using phones to fall asleep', 'Focusing on sleep time over quality'], -0.1),

  // ---- TOPIK 6 ----
  V(6, '일맥상통하다', ['to have something in common', 'to contradict', 'to compete', 'to be isolated']),
  V(6, '미봉책', ['a stopgap measure', 'a masterpiece', 'a long-term plan', 'a compromise'], 0.1),
  V(6, '반추하다', ['to reflect on, ruminate', 'to reject', 'to retake a test', 'to reverse'], -0.1),
  G(6, '그는 자신의 실수를 인정하기는___ 오히려 남의 탓으로 돌렸다.', ['커녕', '물론', '고사하고는', '마저'], 'Far from admitting his mistake, he blamed others instead.'),
  G(6, '아무리 사소한 일이___ 소홀히 해서는 안 된다.', ['라도', '라서', '라면서', '라니'], 'However trivial a task is, you must not neglect it.', -0.2),
  G(6, '경기가 회복될 기미가 보이지 않자 정부는 추가 대책을 마련하기___ 이르렀다.', ['에', '로', '를', '와'], 'With no sign of recovery, the government came to prepare further measures.', 0.2),
  R(6, '언어는 단순한 의사소통의 도구를 넘어 그 언어를 사용하는 공동체의 세계관을 반영한다. 따라서 한 언어가 소멸한다는 것은 하나의 고유한 세계관이 사라지는 것과 다름없다.', 'According to the passage, a language dying means…', ['the loss of a unique worldview', 'the end of all communication', 'people learn new languages faster', 'nothing more than losing words']),
  R(6, '인공지능 기술의 발전이 일자리를 감소시킬 것이라는 우려가 있지만, 역사적으로 기술 혁신은 기존 일자리를 대체하는 동시에 새로운 형태의 일자리를 창출해 왔다.', 'What is the writer’s view?', ['Innovation has historically created new jobs as well', 'AI will certainly eliminate most jobs', 'Technology never affects employment', 'AI development should stop'], -0.1),
  L(6, '이번 연구는 표본의 크기가 작아 결과를 일반화하기에는 한계가 있지만, 후속 연구의 방향을 제시했다는 점에서 의의가 있다고 평가됩니다.', 'How is the study evaluated?', ['Limited generalisability, but it points the way for future research', 'Its results apply to everyone', 'It was a complete failure', 'Its sample was very large']),
  L(6, '도시 재생 사업이 오히려 원주민을 내몰고 있다는 비판에 대해서는 어떻게 보십니까?\n그 점을 겸허히 받아들이고, 기존 주민들이 계속 거주할 수 있도록 임대료 상승을 제한하는 방안을 마련하겠습니다.', 'What does the second speaker propose?', ['Limiting rent rises so existing residents can stay', 'Stopping the project entirely', 'Moving residents to new towns', 'Ignoring the criticism'], 0.2),
];

// Read-aloud lines for the optional speaking check, by level.
export const SPEAK_LINES = {
  1: ['안녕하세요. 만나서 반가워요.', '커피 한 잔 주세요.'],
  2: ['주말에 친구하고 영화를 봤어요.', '지하철역이 어디에 있어요?'],
  3: ['한국에 온 지 일 년이 됐어요.', '비가 오니까 우산을 가져가세요.'],
  4: ['요즘 일이 많아서 운동할 시간이 없어요.', '한국어 실력이 늘도록 매일 연습하고 있어요.'],
  5: ['전문가들은 수면의 질이 더 중요하다고 말했습니다.', '회사가 문제를 신속하게 인정했습니다.'],
  6: ['언어는 공동체의 세계관을 반영합니다.', '기술 혁신은 새로운 일자리를 창출해 왔습니다.'],
};
