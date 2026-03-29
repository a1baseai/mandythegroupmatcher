/**
 * Mandy interview engine — Amata-style facilitator flow for multi-person groups.
 * Produces structured JSON: whether to reply, what to say, extracted profile fields.
 */

const claudeService = require('./claude-service');

/** Ordered interview beats (goals, not scripts — model chooses wording). */
const INTERVIEW_PHASES = [
  { id: 'name', goal: 'Learn what this group wants to be called' },
  { id: 'size', goal: 'Roughly how many people / who is in the chat' },
  { id: 'hangs', goal: 'What they like to do together, hobbies, hangout style' },
  { id: 'looking', goal: 'What they are looking for in another group to meet' },
  { id: 'vibe', goal: 'Overall energy / vibe in a line or two' },
  { id: 'extra', goal: 'One light optional question (music, fictional squad, etc.)' },
  { id: 'done', goal: 'Close: thank them; notes are saved; matching is run later by staff — no instant matches in chat' }
];

/** FAQ snippets the model may use verbatim or paraphrase when users ask. */
const COMMON_FAQS = [
  {
    q: 'What happens next?',
    a: 'I jot down your vibe here so the team can match groups later. Nothing goes out automatically from this chat—you’ll hear from organizers when it’s time.'
  },
  {
    q: 'Who sees this?',
    a: 'Your answers are used for matching and seen by the program team running the event—not broadcast to other groups in real time.'
  },
  {
    q: 'Do we get matched right now?',
    a: 'Nope—I’m only collecting the story of your group. Pairing happens when staff runs matching on their side.'
  },
  {
    q: 'Can one person answer for everyone?',
    a: 'Totally. If a few of you jump in, I’ll blend it into one picture of the group.'
  },
  {
    q: 'Why aren’t you answering every message?',
    a: "So the chat doesn't blow up—I'll chime in for questions or to move the interview forward."
  }
];

function parseJsonObject(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function mergeUniqueStrings(a, b) {
  const set = new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].map(s => String(s || '').trim().toLowerCase()).filter(Boolean));
  return [...set].map(s => s.replace(/\b\w/g, c => c.toUpperCase()));
}

/**
 * @param {Object} opts
 * @returns {Promise<Object>}
 */
async function decideInterviewTurn(opts) {
  const {
    userMessage,
    userDisplayName,
    conversation,
    interviewState,
    existingProfile,
    messagesSinceLastMandy,
    userMessageCount
  } = opts;

  const phaseIndex = Math.min(
    interviewState?.phaseIndex ?? 0,
    INTERVIEW_PHASES.length - 1
  );
  const currentPhase = INTERVIEW_PHASES[phaseIndex];
  const existingVibe = existingProfile?.vibeProfile || {};

  const historyText = (conversation || [])
    .slice(-24)
    .map(m => {
      const role = m.role === 'assistant' ? 'Mandy' : (m.senderName || 'Group member');
      const c = String(m.content || '').replace(/^[^:]+:\s*/, '').trim();
      return `${role}: ${c}`;
    })
    .join('\n');

  const faqText = COMMON_FAQS.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');
  const phasesText = INTERVIEW_PHASES.map((p, i) => `${i}. [${p.id}] ${p.goal}`).join('\n');

  const userPrompt = `CURRENT INTERVIEW PHASE INDEX: ${phaseIndex} (${currentPhase.id})
CURRENT PHASE GOAL: ${currentPhase.goal}
MESSAGES SINCE MANDY LAST SPOKE (user turns): ${messagesSinceLastMandy}
USER MESSAGE # IN THIS INTERVIEW: ${userMessageCount}
LATEST MESSAGE FROM: ${userDisplayName || 'someone'}
LATEST MESSAGE TEXT: ${userMessage}

EXISTING SAVED PROFILE (merge new facts in; do not erase unless corrected):
${JSON.stringify(
    {
      groupName: existingProfile?.groupName || existingVibe.groupName,
      memberCountEstimate: existingVibe.memberCountEstimate,
      interests: existingVibe.interests,
      activitiesTheyEnjoy: existingVibe.activitiesTheyEnjoy,
      lookingForInOthers: existingVibe.lookingForInOthers,
      vibeNotes: existingVibe.vibeNotes,
      extras: existingVibe.extras,
      narrativeSummary: existingVibe.narrativeSummary
    },
    null,
    2
  )}

RECENT CONVERSATION (newest at bottom):
${historyText || '(empty)'}

---

Return ONLY a JSON object with this shape (no markdown):
{
  "shouldReply": boolean,
  "replyKind": "silent" | "answer_question" | "faq" | "next_topic" | "wrap_up",
  "replyText": string or null,
  "extracted": {
    "groupName": string or null,
    "memberCountEstimate": number or null,
    "interests": string[],
    "activitiesTheyEnjoy": string or null,
    "lookingForInOthers": string or null,
    "vibeNotes": string or null,
    "extras": string or null,
    "narrativeSummary": string or null
  },
  "nextPhaseIndex": number,
  "interviewComplete": boolean,
  "internalNote": string
}

RULES (match the *feel* of a facilitator like Amata: warm, calm, a little enthusiastic—not a form):
- Multiple people may talk and interrupt. Merge everything into ONE group profile.
- **Acknowledge before you advance:** When moving to the next topic, start with a short genuine beat (e.g. "That sounds great," "Love that," "Got it—") then **mirror one concrete detail** you heard ("so you're mostly about…", "sounds like you all…") when you have something to reflect. Then ask **one** clear follow-up or the next question. Keep the whole reply tight (2–4 short sentences max).
- **One question at a time.** Never stack three questions in one message.
- **Anti-spam:** Set shouldReply false for pure filler ("lol", "same", "facts", "+1", single emoji) UNLESS it is clearly answering the current phase or someone asked a question.
- **Questions:** If someone asks a real question (to Mandy, the bot, or "how does this work"), set shouldReply true, replyKind answer_question or faq, and give a SHORT helpful answer. Use COMMON FAQS when it fits; you may paraphrase.
- **Interview flow:** When shouldReply true and you are moving the interview, replyKind next_topic or wrap_up. Sound human and conversational—like texting, not a survey.
- **Never** promise instant matches, never say "here are your matches," never present other groups or profiles in this chat (Amata does that for dating; Mandy only collects notes for staff).
- **narrativeSummary:** Whenever you have enough new substance, set narrativeSummary to a short **third-person** paragraph about the group as a whole (like a matchmaker's case file): who they are, what they like, what they're looking for. Refresh it as you learn more. This is for organizers' records—not shown automatically to users as a profile card.
- When phase is "done" or you have enough for matching (name + some sense of size/interests/looking), set interviewComplete true and replyKind wrap_up with a short thank-you and reminder that staff runs matching later.
- nextPhaseIndex must be >= current phase index; advance by 0–2 steps max per turn unless closing.
- If interviewComplete true, nextPhaseIndex should be ${INTERVIEW_PHASES.length - 1} (done).

COMMON FAQs (use when relevant):
${faqText}

PHASE LIST:
${phasesText}`;

  const systemPrompt = `You are the decision engine for "Mandy", a friendly group interviewer in a multi-person chat (same conversational DNA as apps like Amata: acknowledge, mirror briefly, go deeper with one question at a time). Your job is to update structured notes—including an evolving third-person narrativeSummary for staff—and decide if Mandy should send a message this turn. Output valid JSON only.`;

  const raw = await claudeService.generateText(userPrompt, {
    systemPrompt,
    temperature: 0.35,
    maxTokens: 900,
    timeout: 10000
  });

  const parsed = parseJsonObject(raw);
  if (!parsed || typeof parsed.shouldReply !== 'boolean') {
    return {
      shouldReply: true,
      replyKind: 'next_topic',
      replyText:
        "Hey — I'm here! Quick reset on my side. What should I call your group?",
      extracted: {},
      nextPhaseIndex: phaseIndex,
      interviewComplete: false,
      internalNote: 'parse_fallback'
    };
  }

  let nextPhaseIndex = Number.isInteger(parsed.nextPhaseIndex)
    ? parsed.nextPhaseIndex
    : phaseIndex;
  nextPhaseIndex = Math.max(phaseIndex, Math.min(nextPhaseIndex, INTERVIEW_PHASES.length - 1));

  const ex = parsed.extracted || {};
  const extracted = {
    groupName: ex.groupName != null ? String(ex.groupName).trim() || null : null,
    memberCountEstimate:
      typeof ex.memberCountEstimate === 'number' && !Number.isNaN(ex.memberCountEstimate)
        ? ex.memberCountEstimate
        : null,
    interests: Array.isArray(ex.interests) ? ex.interests.map(s => String(s).trim()).filter(Boolean) : [],
    activitiesTheyEnjoy: ex.activitiesTheyEnjoy != null ? String(ex.activitiesTheyEnjoy).trim() || null : null,
    lookingForInOthers: ex.lookingForInOthers != null ? String(ex.lookingForInOthers).trim() || null : null,
    vibeNotes: ex.vibeNotes != null ? String(ex.vibeNotes).trim() || null : null,
    extras: ex.extras != null ? String(ex.extras).trim() || null : null,
    narrativeSummary:
      ex.narrativeSummary != null && String(ex.narrativeSummary).trim()
        ? String(ex.narrativeSummary).trim()
        : null
  };

  return {
    shouldReply: parsed.shouldReply,
    replyKind: parsed.replyKind || 'next_topic',
    replyText: parsed.replyText != null ? String(parsed.replyText).trim() : null,
    extracted,
    nextPhaseIndex,
    interviewComplete: !!parsed.interviewComplete,
    internalNote: parsed.internalNote || ''
  };
}

function mergeVibeProfile(prev, extracted) {
  const p = prev || {};
  return {
    groupName: extracted.groupName || p.groupName,
    memberCountEstimate: extracted.memberCountEstimate ?? p.memberCountEstimate ?? null,
    interests: mergeUniqueStrings(p.interests, extracted.interests),
    activitiesTheyEnjoy: extracted.activitiesTheyEnjoy || p.activitiesTheyEnjoy || null,
    lookingForInOthers: extracted.lookingForInOthers || p.lookingForInOthers || null,
    vibeNotes: extracted.vibeNotes || p.vibeNotes || null,
    extras: extracted.extras || p.extras || null,
    narrativeSummary: extracted.narrativeSummary || p.narrativeSummary || null,
    lastUpdatedAt: new Date().toISOString()
  };
}

/**
 * Heuristic pre-check before paying for an LLM call (optional fast path).
 */
function mightNeedReplyHeuristic(userMessage, interviewState) {
  const m = String(userMessage || '').trim();
  if (!m) return false;
  if (interviewState?.interviewComplete) {
    return /\?/.test(m) || /\bmandy\b/i.test(m) || /how (does|do) (this|we)/i.test(m);
  }
  const n = interviewState?.userMessageCount || 0;
  if (n <= 4) return true;
  if (/\?/.test(m)) return true;
  if (/\bmandy\b/i.test(m)) return true;
  if ((interviewState?.messagesSinceLastMandy || 0) >= 2) return true;
  if (m.length >= 40) return true;
  return false;
}

module.exports = {
  INTERVIEW_PHASES,
  COMMON_FAQS,
  decideInterviewTurn,
  mergeVibeProfile,
  mightNeedReplyHeuristic
};
