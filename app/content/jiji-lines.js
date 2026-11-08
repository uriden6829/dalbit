// Things Jiji says. Keep them short, cheeky and kind — a cat, not a cheerleader.
// {name} is her name (may be empty). In the corner, Jiji says the Korean part of a line out loud in her own studio
// voice, so a new Korean bit needs a clip: run node tools/voice/build-voice.mjs --check after adding one.
export default {
  morning: ['Coffee first, then spells.', 'Morning light. Not my favourite, but I’ll allow it.', 'A few words before the day starts? Wise.'],
  afternoon: ['A good hour for a few words.', 'I was napping. Let’s study anyway.', 'Afternoon tea and a little Korean. Civilised.'],
  evening: ['The moon’s up — so is class.', 'The candles are lit. Shall we?', 'Evening is when spells stick best. Ask any witch.'],
  night: ['A short session, then sleep.', 'The best spells are learned at night. Everyone knows that.', 'Late again. I approve.'],
  correct: ['잘했어요!', '맞아요.', 'Exactly.', 'Clean. Like a well-cast spell.', '좋아요!', 'Mm. Correct.', '완벽해요.'],
  wrong: ['Close. Look once more — it will come back to you.', 'Not this time. I’ll bring it back in a moment.', 'That one is slippery. We’ll practise it again.', '괜찮아요. Mistakes are how spells set.'],
  graduated: ['That word is yours now.', 'Filed in your spellbook.', 'Learned. I’ll check on it tomorrow.'],
  done: ['수고했어요! Good work tonight.', 'That’s a proper study session. I’m almost impressed.', 'Done. Go have some tea.'],
  recap: ['I found some old pages. Let’s make sure they’re still bright.', 'Old spells fade if you never cast them. Shall we?'],
  noDue: ['Nothing is due. Either you’re very diligent, or I’m very generous.', 'All caught up. Something new tonight?'],
  welcomeBack: ['다시 왔네요! I kept your spellbook warm.', 'Back again. Good. Where were we?'],
  // Jiji in the corner (ui/companion.js)
  pet: ['Mrrr.', '…Fine. One more scratch.', '고마워요. Now, back to work.', 'Purring is not a sign of approval. (It is.)', 'I was guarding your words.'],
  idle: ['Still here.', 'Take your time. I have nine lives.', 'Hold Shift over any Korean word — I’ll explain it.', 'Ctrl+click a word to keep it in your word bank.'],
  listen: ['Ears up.', 'Shh. Listen.'],
  slowOn: ['Slowly now. 천천히.'],
  slowOff: ['Normal speed.'],
};
