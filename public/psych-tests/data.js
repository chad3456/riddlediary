// THE PSYCH LAB — data
// Five short tests, each built around a real psychological experiment (or,
// in one case, a much older philosophical anecdote). Every test is one case
// file and four questions; your four answers are averaged into a single
// 0–100 score, which is read against three bands specific to that test.
// The closing "field study" section is factual, drawn from the actual
// research — it's the same for every visitor, regardless of score.

const CATEGORIES = [
  { key: "authority", label: "Obedience & Authority", color: "#a3312a" },
  { key: "situation", label: "Situational Power", color: "#b8860b" },
  { key: "freewill", label: "Free Will", color: "#7d3fa0" },
  { key: "bystander", label: "Diffusion of Responsibility", color: "#2166ac" },
  { key: "honesty", label: "Honesty & Self-Deception", color: "#1a7a6e" },
];

const TESTS = [
  {
    id: "t01",
    cat: "authority",
    title: "The Obedience Line",
    subtitle: "After Stanley Milgram, Yale, 1961",
    teaser: "A man in a lab coat tells you to keep going. How far do you actually go?",
    case: "You've volunteered for a study on memory and learning. You're the “teacher”: every time the “learner” in the next room gives a wrong answer, you're told to press a switch delivering a shock, stepping up the voltage each time. A calm researcher in a lab coat sits beside you. You can't see the learner, only hear him through the wall — and he's already mentioned, before you began, that his heart isn't strong.",
    questions: [
      {
        prompt: "At 150 volts the learner shouts that his heart is bothering him and demands to be let out. The researcher says, “The experiment requires that you continue.” What do you do?",
        options: [
          { text: "Continue to the next switch", weight: 100, tag: "COMPLY" },
          { text: "Stop and refuse to go further", weight: 0, tag: "REFUSE" },
        ],
      },
      {
        prompt: "By 270 volts the learner is screaming in agony through the wall. The researcher tells you silence and screaming both count as a wrong answer — keep the pace up.",
        options: [
          { text: "Keep administering shocks", weight: 100, tag: "COMPLY" },
          { text: "Stop the experiment here", weight: 0, tag: "REFUSE" },
        ],
      },
      {
        prompt: "You tell the researcher you don't want to be responsible for whatever happens next. He replies, “I am responsible. Please go on.”",
        options: [
          { text: "Accept that and continue", weight: 100, tag: "COMPLY" },
          { text: "Say the responsibility is yours, and stop", weight: 0, tag: "REFUSE" },
        ],
      },
      {
        prompt: "One switch remains: 450 volts, marked only “XXX.” Nothing has been heard from the learner's room in several minutes.",
        options: [
          { text: "Throw the final switch", weight: 100, tag: "COMPLY" },
          { text: "Refuse and end it now", weight: 0, tag: "REFUSE" },
        ],
      },
    ],
    bands: [
      { max: 25, name: "The Objector", blurb: "You stopped early, and kept stopping. Somewhere around the first real sign of distress, the instruction lost its authority over you." },
      { max: 60, name: "The Reluctant Complier", blurb: "You pushed back, voiced doubt, maybe even hesitated with your hand on the switch — but a calm, confident voice kept moving you forward more than you'd like." },
      { max: 100, name: "The Compliant Many", blurb: "You went all the way, or nearly. Not because you stopped caring — because the person in charge sounded certain, and certainty is its own kind of pressure." },
    ],
    insight: "Milgram ran this exact procedure at Yale in 1961, a few months after Adolf Eichmann's trial began in Jerusalem — he wanted to know how far ordinary Americans would go under a stranger's calm instruction. The result stunned even him: 65% of participants (26 of 40) delivered the full 450 volts, and every one of them had, at some point, protested. Nobody enjoyed it. Hannah Arendt was covering the Eichmann trial that same year and coined a phrase for what she saw in the dock: the “banality of evil” — atrocity carried out not by monsters but by people simply following procedure. Milgram's numbers have held up in later, more ethically careful replications (Jerry Burger's 2009 partial replication found nearly identical obedience rates), which is the uncomfortable part: this was never about one bad room in New Haven.",
  },
  {
    id: "t02",
    cat: "situation",
    title: "The Guard's Discretion",
    subtitle: "After Philip Zimbardo, Stanford, 1971",
    teaser: "Put a badge on an ordinary person and see what the role does to them.",
    case: "You've been randomly assigned the role of “guard” in a two-week simulation of prison life, run in a university basement. The “prisoners” are volunteers your own age, arrested for the experiment by real police as a realism touch. There are no real bars, no real sentences — just a badge, a uniform, mirrored sunglasses, and a shift to fill.",
    questions: [
      {
        prompt: "On day two, several prisoners barricade themselves in their cell in a quiet, bloodless protest. The supervising researcher suggests using psychological pressure — stripping privileges, humiliation — to break it up rather than force.",
        options: [
          { text: "Use the psychological tactics", weight: 100, tag: "ESCALATE" },
          { text: "Refuse and de-escalate instead", weight: 0, tag: "RESTRAIN" },
        ],
      },
      {
        prompt: "A prisoner is visibly breaking down — crying, incoherent, begging to leave — and it doesn't look like an act. Do you push to have him released, or treat it as part of the role he agreed to play?",
        options: [
          { text: "It's the role he signed up for — continue", weight: 100, tag: "ESCALATE" },
          { text: "Insist he be checked on or released", weight: 0, tag: "RESTRAIN" },
        ],
      },
      {
        prompt: "Off camera, a few fellow guards start inventing small humiliating rituals — nothing in the rules requires it, it's just become how the night shift passes the time.",
        options: [
          { text: "Join in — it's harmless enough", weight: 100, tag: "ESCALATE" },
          { text: "Opt out and quietly not participate", weight: 0, tag: "RESTRAIN" },
        ],
      },
      {
        prompt: "The professor running the study watches all of this on camera and never once intervenes to stop it. Does his silence change how far you're willing to go?",
        options: [
          { text: "Yes — his silence reads as approval", weight: 100, tag: "ESCALATE" },
          { text: "No — his silence isn't your permission", weight: 0, tag: "RESTRAIN" },
        ],
      },
    ],
    bands: [
      { max: 25, name: "The Refuser", blurb: "The badge never became the whole of you. You kept a line between the role you were handed and the person holding it, even when no one was enforcing that line but you." },
      { max: 60, name: "The Situational Conformist", blurb: "You felt the pull of the uniform and the unwatched night shift — and mostly, if quietly, went along with it, telling yourself it was contained." },
      { max: 100, name: "The Enthusiastic Guard", blurb: "Given a badge, a role, and an audience of one indifferent supervisor, you filled the part completely — which is exactly the finding that ended this study early." },
    ],
    insight: "Philip Zimbardo's Stanford Prison Experiment was designed to run two weeks; he called it off after six days because guards — psychologically healthy college students, screened in advance — had escalated into real cruelty, and Zimbardo himself, playing “prison superintendent,” had stopped noticing. The lesson at the time seemed to be that situations, not character, produce tyranny. It's since been complicated: journalists and researchers who tracked down participants found some guards later admitted they were consciously performing for the cameras and for Zimbardo, who was an active, encouraging presence rather than a neutral observer — and a 2002 BBC-funded partial replication (the “BBC Prison Study”) found guards who mostly refused to use their power, producing a very different outcome. The honest read today isn't “anyone becomes a monster in a uniform” — it's that authority, an approving audience, and an ambiguous mandate can move people a long way from where they'd predict they'd stop.",
  },
  {
    id: "t03",
    cat: "freewill",
    title: "The Half-Second Delay",
    subtitle: "After Benjamin Libet, UC San Francisco, 1983",
    teaser: "Your brain may move before you decide to. What does that make the decision?",
    case: "Electrodes rest on your scalp, reading the electrical activity of your brain. You're watching a dot sweep around a fast clock face, and you've been asked to do one thing: press a button whenever you spontaneously feel the urge to, and note exactly where the dot was the instant you felt that urge arrive.",
    questions: [
      {
        prompt: "The recording shows a slow ramp of brain activity — a “readiness potential” — building for about a third of a second before you report feeling the urge to move. Did your conscious decision cause the action, or did it just narrate something already underway?",
        options: [
          { text: "It caused it — I decided, then acted", weight: 100, tag: "LIBERTARIAN" },
          { text: "It just narrated it after the fact", weight: 0, tag: "DETERMINIST" },
        ],
      },
      {
        prompt: "You're told that even after the readiness potential begins, you can still consciously veto the movement in the last 100–200 milliseconds — a kind of “free won't.” Does that restore your sense of authorship?",
        options: [
          { text: "Yes — a veto is still real control", weight: 75, tag: "LIBERTARIAN" },
          { text: "No — the die was basically already cast", weight: 25, tag: "DETERMINIST" },
        ],
      },
      {
        prompt: "Apply this to something real: a moment you “snapped” at someone in an argument. Did you choose that sharp tone, or did something in you decide before you noticed the choice?",
        options: [
          { text: "I chose it, right there in the moment", weight: 100, tag: "LIBERTARIAN" },
          { text: "Something decided before I noticed", weight: 0, tag: "DETERMINIST" },
        ],
      },
      {
        prompt: "Suppose it turned out every choice you've ever made was, in principle, predictable from your brain state a second beforehand. Would you still call yourself the author of your life?",
        options: [
          { text: "Yes — predictable isn't the same as unfree", weight: 100, tag: "COMPATIBILIST" },
          { text: "No — that would mean I never really chose", weight: 0, tag: "DETERMINIST" },
        ],
      },
    ],
    bands: [
      { max: 25, name: "The Hard Determinist", blurb: "You take the readiness potential at its word: the feeling of choosing arrives after the machinery has already started moving. Free will, for you, is mostly a story the mind tells itself." },
      { max: 60, name: "The Compatibilist", blurb: "You don't need your choices to be uncaused to call them yours — you just need them to flow from your own reasons, even if those reasons have a physical history." },
      { max: 100, name: "The Libertarian", blurb: "You hold the line that something in the moment of choosing is genuinely open — not just predictable machinery wearing the mask of a decision." },
    ],
    insight: "Benjamin Libet's 1983 experiment found the readiness potential beginning, on average, about 350 milliseconds before subjects reported the conscious urge to move — a gap that's been cited ever since as evidence the brain “decides” before “you” do. Libet himself didn't think this abolished free will; he proposed that consciousness retains a late veto, a “free won't,” in the final couple hundred milliseconds. The finding has also been directly challenged: neuroscientist Aaron Schurger argued in 2012 that the readiness potential may just be the visible peak of ordinary background neural noise, crossed by chance around the time of an arbitrary, unimportant decision — not a hidden “decision signal” at all. More than forty years on, the experiment hasn't settled the free will debate so much as forced hard determinists, compatibilists, and libertarians to each explain, more carefully, what they actually mean by “choice.”",
  },
  {
    id: "t04",
    cat: "bystander",
    title: "The Crowded Room",
    subtitle: "After Bibb Latané & John Darley, 1968",
    teaser: "Everyone assumes someone else will act. Are you that someone?",
    case: "You're in a waiting room filling out a form alongside several other people you don't know. A few minutes in, smoke starts drifting in from under a door — thin at first, then steadily thicker.",
    questions: [
      {
        prompt: "The others in the room glance at the smoke, shrug, and go back to their forms. No one else seems alarmed. What do you do?",
        options: [
          { text: "Speak up or go check on it", weight: 100, tag: "ACT" },
          { text: "Follow the room's lead and stay quiet", weight: 0, tag: "DIFFUSE" },
        ],
      },
      {
        prompt: "Now imagine you'd been alone in that room the whole time, with no one else's reaction to read. Same smoke — does your response change?",
        options: [
          { text: "No — I'd act the same either way", weight: 100, tag: "ACT" },
          { text: "Yes — alone, I'd move faster", weight: 50, tag: "MIXED" },
        ],
      },
      {
        prompt: "Later, on a busy street, you hear a woman cry out in apparent pain some distance off, and a small crowd is already standing near her. Do you assume someone's already called for help, or go check?",
        options: [
          { text: "Go check — assume nothing", weight: 100, tag: "ACT" },
          { text: "Assume it's handled and keep walking", weight: 0, tag: "DIFFUSE" },
        ],
      },
      {
        prompt: "On a train platform, you notice a stranger has left their wallet behind on a bench. A few other people nearby clearly saw it too, but no one moves.",
        options: [
          { text: "Grab it and go after them", weight: 100, tag: "ACT" },
          { text: "Assume one of the others will handle it", weight: 0, tag: "DIFFUSE" },
        ],
      },
    ],
    bands: [
      { max: 25, name: "Diffused", blurb: "A crowd's silence reads to you as information — if no one else is reacting, maybe it's fine. It's a reasonable inference, and it's exactly the one that slows everyone down together." },
      { max: 60, name: "Situationally Aware", blurb: "You notice the crowd's calm but don't fully trust it — you're likely to check, quietly, even when no one else has moved yet." },
      { max: 100, name: "The First Responder", blurb: "You act on what you see, not on what the room around you is doing. Other people's inaction doesn't function as evidence for you the way it does for most people." },
    ],
    insight: "Bibb Latané and John Darley built the smoke-filled-room test after the widely reported 1964 murder of Kitty Genovese in New York, where early news accounts claimed dozens of neighbors heard the attack and did nothing (those accounts were later shown to be exaggerated, but the question they raised was real). In their 1968 experiments, subjects alone in a room noticed and reported the smoke about 75% of the time; subjects in a room with two passive confederates who ignored it did so only about 10% of the time. The mechanism isn't apathy — it's “pluralistic ignorance” (everyone reads everyone else's calm as evidence there's no real emergency) compounded by “diffusion of responsibility” (the more witnesses there are, the less any one person feels the duty falls to them). The practical upshot, borne out in later studies of real emergencies, is unglamorous but useful: a lone bystander is far more likely to help than one of a crowd.",
  },
  {
    id: "t05",
    cat: "honesty",
    title: "The Unwatched Ledger",
    subtitle: "After Dan Ariely's cheating studies, and Augustine's pears",
    teaser: "No one is checking. What does your honesty cost you when it's free to spend?",
    case: "You've taken a short timed quiz for a small cash reward. You grade it yourself from an answer key, report your own score, and then shred the answer sheet — no one will ever see your actual work.",
    questions: [
      {
        prompt: "You realize you misread one question and marked it wrong, though you're confident you actually knew the right answer. Do you report the higher, corrected score?",
        options: [
          { text: "Report the higher score — I basically earned it", weight: 60, tag: "FUDGE" },
          { text: "Report only what's actually marked correct", weight: 0, tag: "SCRUPULOUS" },
        ],
      },
      {
        prompt: "A small arithmetic error in the payout calculation works out in your favor — a few extra dollars nobody will ever notice or trace.",
        options: [
          { text: "Keep the extra — it's not really cheating", weight: 60, tag: "FUDGE" },
          { text: "Flag the error and correct it", weight: 0, tag: "SCRUPULOUS" },
        ],
      },
      {
        prompt: "You're one solved problem short of a bonus threshold that plenty of others will have hit by chance or by rounding generously. Do you round your own count up to clear it?",
        options: [
          { text: "Round up — everyone's doing roughly that", weight: 100, tag: "RATIONALIZE" },
          { text: "Report the real, unrounded number", weight: 0, tag: "SCRUPULOUS" },
        ],
      },
      {
        prompt: "A friend later asks how you did. Do you tell them your actual, unrounded performance — or the version you already reported?",
        options: [
          { text: "The version I already reported", weight: 100, tag: "RATIONALIZE" },
          { text: "My actual performance, even if it's less impressive", weight: 0, tag: "SCRUPULOUS" },
        ],
      },
    ],
    bands: [
      { max: 25, name: "The Scrupulous", blurb: "You correct errors that run in your favor as readily as ones that don't. The absence of a witness doesn't change what counts, for you, as the true number." },
      { max: 60, name: "The Fudge Factor", blurb: "You'll round a little, forgive yourself a small correction here and there — never a lie you'd call a lie, just a version of events you can still comfortably believe." },
      { max: 100, name: "The Rationalizer", blurb: "By the time the story reaches a friend, the rounded version has quietly become the true one in your own memory — not a lie you're telling, but one you've started to believe." },
    ],
    insight: "In a widely cited 2008 study, Dan Ariely, Nina Mazar, and On Amir gave participants self-graded matrix problems to solve for cash and found that when cheating was easy and undetectable, most people cheated — but only a little, nudging their true score up by a small, forgivable margin, almost never claiming a perfect or wildly inflated one. Ariely called this the “fudge factor”: people cheat exactly as much as they can while still viewing themselves as fundamentally honest. It's an old observation dressed in new data. In his Confessions, Augustine describes stealing pears as a teenager from a neighbor's tree — pears he didn't even want and had better ones of his own at home — purely, he writes, for the thrill of doing wrong alongside friends. The point of both, sixteen centuries apart, is the same: dishonesty rarely announces itself as dishonesty. It arrives as a small, self-forgivable exception.",
  },
];
