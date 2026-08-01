// THE PARADOX ARCHIVE — data
// Illustrative "crowd" percentages are fixed sample numbers for a self-contained
// static page (no backend, no real respondent pool) — they exist to make each
// case feel populated, not to represent a real survey.

const CATEGORIES = [
  { key: "ethics", label: "Ethics & Moral Philosophy", color: "#c0392b" },
  { key: "political", label: "Political & Social Philosophy", color: "#b8860b" },
  { key: "epistemology", label: "Epistemology", color: "#2166ac" },
  { key: "metaphysics", label: "Metaphysics & Identity", color: "#7d3fa0" },
  { key: "mind", label: "Philosophy of Mind", color: "#1a7a6e" },
  { key: "logic", label: "Logic & Classical Paradoxes", color: "#5b5b5b" },
  { key: "religion", label: "Philosophy of Religion", color: "#8a6d1a" },
  { key: "decision", label: "Decision & Game Theory", color: "#2f7d3a" },
];

const TAGS = {
  UTIL: "Consequentialist — you weigh acts by their outcomes and the total good they produce.",
  DEON: "Deontological — some acts are right or wrong by rule, whatever the consequences.",
  VIRTUE: "Character-first — you ask what a person of good character would do, not just the sum of outcomes.",
  CONTRACT: "Contractualist — fairness of process and rules everyone would agree to matters more than raw totals.",
  LIBERTY: "Liberty-first — individual rights set hard limits outcomes can't override.",
  COLLECTIVE: "Collective-first — you're willing to constrain individuals for a shared good.",
  EGOIST: "Self-interest realist — you expect behavior to track incentives and consequences for the self.",
  RATIONALIST: "Rationalist — you trust reason and argument to settle hard questions.",
  EMPIRICIST: "Empiricist — you trust evidence and experience over pure argument.",
  SKEPTIC: "Skeptic — you're comfortable concluding some questions may not have a knowable answer.",
  COMPATIBILIST: "Compatibilist — free will and a determined universe can coexist for you.",
  HARD_DETERMINIST: "Hard determinist — if the universe is fixed, 'could have done otherwise' doesn't survive.",
  LIBERTARIAN_FW: "Metaphysical libertarian — real freedom requires genuine, undetermined openness.",
  PHYSICALIST: "Physicalist — the mind is ultimately nothing over and above the physical.",
  DUALIST: "Dualist-leaning — you suspect experience is something more than physical description captures.",
  THEIST: "Theist-leaning — your answers tend to leave room for a good, powerful God.",
  ATHEIST: "Atheist-leaning — your answers find classical theism's puzzles unresolved.",
};

const CASES = [
  // ───────── ETHICS ─────────
  {
    id: "c01", cat: "ethics", title: "The Ring of Gyges", thinker: "Plato, Republic — c. 380 BCE",
    scenario: "A ring renders its wearer completely invisible; every act, seen or unseen, carries no worldly consequence at all. Plato has Glaucon ask whether anyone would remain just if certain no one would ever find out.",
    question: "If you found such a ring, would every promise you make still hold?",
    choices: [
      { text: "Yes — I'd act the same, unseen.", tag: "VIRTUE", pct: 42 },
      { text: "No — I'd take what I could get away with.", tag: "EGOIST", pct: 58 },
    ],
    note: "Glaucon argues justice is upheld only by fear of getting caught; Socrates counters that injustice corrupts the soul's own harmony regardless of who's watching — a good in itself, not a transaction with an audience.",
  },
  {
    id: "c02", cat: "ethics", title: "The Utility Monster", thinker: "Robert Nozick — 1974",
    scenario: "One being converts resources into happiness far more efficiently than anyone else — every unit handed to it yields more total pleasure than spreading it among a thousand others. Strict utilitarian arithmetic says feed everything to the monster.",
    question: "Should all resources go to whoever produces the most total happiness from them?",
    choices: [
      { text: "Yes — maximize the total, wherever it lands.", tag: "UTIL", pct: 22 },
      { text: "No — fairness of distribution matters, not just the sum.", tag: "CONTRACT", pct: 58 },
      { text: "No — this violates a basic right to a share, however inefficient.", tag: "LIBERTY", pct: 20 },
    ],
    note: "Nozick devised the monster to show classical utilitarianism can demand total redistribution to one insatiable being — proof, for critics, that 'maximize the sum' needs a fairness constraint utilitarianism doesn't itself supply.",
  },
  {
    id: "c03", cat: "ethics", title: "The Experience Machine", thinker: "Robert Nozick — 1974",
    scenario: "A machine can plug you in for life, generating any experience you want — joy, love, achievement, indistinguishable from real — while your body floats in a tank. Once inside, you won't remember it's a simulation.",
    question: "Would you plug in for a lifetime of guaranteed perfect experience?",
    choices: [
      { text: "Yes — only felt experience matters.", tag: "UTIL", pct: 26 },
      { text: "No — I want to actually do things, not just feel like I did.", tag: "VIRTUE", pct: 74 },
    ],
    note: "Nozick used this to argue pleasure alone can't be the whole of the good — most refusals suggest we value contact with reality, achievement, and authentic identity beyond subjective states.",
  },
  {
    id: "c04", cat: "ethics", title: "Omelas", thinker: "Ursula K. Le Guin, 1973 — descended from Dostoevsky's 'one tear of a child', 1880",
    scenario: "A city's perfect happiness depends entirely on one child kept in permanent misery in a locked cellar; every citizen knows the price. Freeing the child ends the happiness of all.",
    question: "Is a whole society's flourishing justified if it depends on one innocent's suffering?",
    choices: [
      { text: "Yes — net welfare across everyone outweighs one person's suffering.", tag: "UTIL", pct: 17 },
      { text: "No — some costs may never be paid by an innocent, whatever the total.", tag: "DEON", pct: 83 },
    ],
    note: "Dostoevsky's Ivan Karamazov posed nearly the same trade to reject any heaven bought with a tortured child's tear — a limit case against pure aggregation of welfare.",
  },
  {
    id: "c05", cat: "ethics", title: "Moral Luck", thinker: "Bernard Williams & Thomas Nagel — 1976",
    scenario: "Two equally reckless drunk drivers speed home. One's street is empty; he arrives safely. The other's street has a child crossing, and he kills her. Both made the identical choice.",
    question: "Does the driver who killed the child deserve more blame than the one who got home safely?",
    choices: [
      { text: "Yes — the outcome is part of what he did.", tag: "UTIL", pct: 45 },
      { text: "No — blame should track the choice, not what luck did with it.", tag: "DEON", pct: 55 },
    ],
    note: "Nagel argued this exposes 'moral luck': our judgments plainly do track outcomes we didn't control, sitting uneasily against the Kantian idea that only the will, not luck, should be judged.",
  },
  {
    id: "c06", cat: "ethics", title: "The Repugnant Conclusion", thinker: "Derek Parfit, Reasons and Persons — 1984",
    scenario: "Compare a smaller population living wonderful lives to a vastly larger population, each life barely worth living, but summing to more total welfare. Total-utilitarian math favors the huge, barely-adequate population every time.",
    question: "Is more total welfare always better, even spread across lives barely worth living?",
    choices: [
      { text: "Yes — a bigger sum is a bigger sum.", tag: "UTIL", pct: 15 },
      { text: "No — quality of life should matter, not headcount times welfare.", tag: "VIRTUE", pct: 85 },
    ],
    note: "Parfit named this the 'Repugnant Conclusion' and treated it as a live challenge population ethics still hasn't cleanly solved — every proposed fix seems to create an equally strange result elsewhere.",
  },

  // ───────── POLITICAL & SOCIAL ─────────
  {
    id: "c07", cat: "political", title: "The Veil of Ignorance", thinker: "John Rawls, A Theory of Justice — 1971",
    scenario: "Design society's rules before knowing which position in it you'll occupy — rich or poor, healthy or disabled, majority or minority. Rawls argues this 'original position' forces genuine fairness.",
    question: "Behind such a veil, what rules would you choose?",
    choices: [
      { text: "Strict equality of outcome for everyone.", tag: "CONTRACT", pct: 24 },
      { text: "Allow inequality, only if it also raises the floor for the worst-off.", tag: "CONTRACT", pct: 63 },
      { text: "Whatever maximizes the average, even if some fall very low.", tag: "UTIL", pct: 13 },
    ],
    note: "Rawls's own answer was the 'difference principle': inequality is just only when it improves the position of the least advantaged — the rational choice under genuine uncertainty about your own future place.",
  },
  {
    id: "c08", cat: "political", title: "The Paradox of Tolerance", thinker: "Karl Popper, The Open Society and Its Enemies — 1945",
    scenario: "A tolerant society extends free speech and rights even to those who would use them to destroy tolerance itself. Popper warned unlimited tolerance can hand the intolerant the very tools to end tolerance for good.",
    question: "Should a free society tolerate movements openly organizing to abolish that same freedom?",
    choices: [
      { text: "Yes — tolerance must be unconditional or it isn't real tolerance.", tag: "LIBERTY", pct: 31 },
      { text: "No — a society may refuse tolerance to those who'd use it to destroy tolerance.", tag: "CONTRACT", pct: 69 },
    ],
    note: "Popper's own formulation drew the line at suppression only when the intolerant 'answer us with the fist' rather than argument — tolerance of ideas, not of violence.",
  },
  {
    id: "c09", cat: "political", title: "Tragedy of the Commons", thinker: "William Forster Lloyd, 1833; Garrett Hardin, 1968",
    scenario: "A shared pasture is open to every herder. Each individually gains by adding one more animal, even though the pasture collapses if everyone does. Rational self-interest, taken by all, destroys the shared resource.",
    question: "Left alone, will individually rational choices reliably wreck a shared resource?",
    choices: [
      { text: "Yes — self-interest scales up to collective ruin without outside rules.", tag: "COLLECTIVE", pct: 71 },
      { text: "No — communities can self-organize sustainable norms without outside enforcement.", tag: "LIBERTY", pct: 29 },
    ],
    note: "Hardin's pessimistic reading argued for privatization or state regulation; Elinor Ostrom later won a Nobel showing many real commons are managed successfully through community-built institutions, neither purely private nor state-run.",
  },
  {
    id: "c10", cat: "political", title: "'Forced to Be Free'", thinker: "Jean-Jacques Rousseau, The Social Contract — 1762",
    scenario: "Rousseau argues that submitting to the collectively willed law of the community, even against your immediate individual wish, is what makes you truly free — the alternative is being ruled by mere impulse or by another's arbitrary power.",
    question: "Can being compelled to obey a law you personally disagree with ever count as an act of your own freedom?",
    choices: [
      { text: "Yes — obeying self-given collective law is real freedom, not its opposite.", tag: "CONTRACT", pct: 39 },
      { text: "No — being compelled against your will is coercion, whatever it's called.", tag: "LIBERTY", pct: 61 },
    ],
    note: "Critics call this formula a gateway to justifying tyranny in freedom's name; defenders read it narrowly — binding only to laws you helped author through legitimate democratic process, not to any ruler's decree.",
  },
  {
    id: "c11", cat: "political", title: "Civil Disobedience", thinker: "Henry David Thoreau, 1849; Martin Luther King Jr., Letter from Birmingham Jail, 1963",
    scenario: "A law is legally valid but, in your judgment, deeply unjust. King argued there is a duty to break an unjust law openly, without violence, and accept the penalty, to appeal to the community's conscience.",
    question: "Is it right to break a law you believe unjust, even in a functioning democracy with legal channels to change it?",
    choices: [
      { text: "Yes — conscience can outrank a legally passed law.", tag: "LIBERTY", pct: 66 },
      { text: "No — work only within legal channels, or the rule of law itself erodes.", tag: "CONTRACT", pct: 34 },
    ],
    note: "King distinguished this from anarchism by insisting on openness and accepting punishment — disobedience as an appeal to a higher, shared law, not a rejection of law itself.",
  },
  {
    id: "c12", cat: "political", title: "Tyranny of the Majority", thinker: "Alexis de Tocqueville, 1835; John Stuart Mill, On Liberty, 1859",
    scenario: "A democratic majority votes, through entirely legitimate procedure, to strip a minority of some liberty the majority merely dislikes. No law is broken; the process is procedurally clean.",
    question: "Can a fair, legitimate vote ever be wrong to enforce?",
    choices: [
      { text: "No — if the process was fair, the outcome must be accepted.", tag: "CONTRACT", pct: 19 },
      { text: "Yes — some liberties should be off the table no matter how large the majority.", tag: "LIBERTY", pct: 81 },
    ],
    note: "Mill's answer was the 'harm principle': majorities may not restrict liberty merely because they disapprove — only to prevent concrete harm to others, a limit meant to sit above ordinary vote-counting.",
  },

  // ───────── EPISTEMOLOGY ─────────
  {
    id: "c13", cat: "epistemology", title: "Brain in a Vat", thinker: "Hilary Putnam, 1981 — descendant of Descartes' demon, 1641",
    scenario: "Suppose your brain has always been in a vat, fed perfectly convincing false signals by a machine, and every 'experience' you've had is simulated. You'd have no internal way to detect the difference.",
    question: "Can you ever be certain the external world you perceive is real?",
    choices: [
      { text: "Yes — reason or evidence can rule this out.", tag: "RATIONALIST", pct: 21 },
      { text: "No — the scenario is built to be experimentally indistinguishable from reality.", tag: "SKEPTIC", pct: 79 },
    ],
    note: "Putnam actually argued the scenario is self-refuting — if you really were a vat-brain, the word 'vat' in your language couldn't refer to a real vat, so 'I am a brain in a vat' could never be truly assertable by you.",
  },
  {
    id: "c14", cat: "epistemology", title: "The Gettier Problem", thinker: "Edmund Gettier — 1963",
    scenario: "You hold a justified true belief formed entirely by luck — you correctly believe a coworker will get a job because they told you so, they don't, but by coincidence you get it yourself, making your original belief's substitute content true. Justified, true, yet clearly not knowledge.",
    question: "Is 'justified true belief' enough to count as knowledge?",
    choices: [
      { text: "Yes — that's the classical definition, and it should hold.", tag: "RATIONALIST", pct: 24 },
      { text: "No — Gettier-style luck shows something more is needed.", tag: "EMPIRICIST", pct: 76 },
    ],
    note: "Gettier's three-page 1963 paper broke a definition of knowledge that had stood since Plato's Theaetetus, launching decades of attempts to patch it with 'no false lemmas', reliabilism, and other repair theories — none universally accepted.",
  },
  {
    id: "c15", cat: "epistemology", title: "The Problem of Induction", thinker: "David Hume — 1739",
    scenario: "The sun has risen every day of recorded history. Hume points out that no amount of past regularity logically guarantees it rises tomorrow — inferring the future from the past requires assuming nature stays uniform, itself only justifiable by more induction.",
    question: "Is trusting the future will resemble the past a rationally justified belief, or just an unavoidable habit?",
    choices: [
      { text: "Rationally justified — the evidence for uniformity is overwhelming.", tag: "EMPIRICIST", pct: 44 },
      { text: "Just a psychological habit reason alone can't fully underwrite.", tag: "SKEPTIC", pct: 56 },
    ],
    note: "Hume concluded induction rests on custom, not reason — a conclusion later thinkers (Popper's falsificationism, Bayesian confirmation theory) have tried to soften but never fully dissolved.",
  },
  {
    id: "c16", cat: "epistemology", title: "The Münchhausen Trilemma", thinker: "Hans Albert, 1968 — rooted in ancient Agrippan skepticism",
    scenario: "Any attempt to prove a belief either loops back circularly, regresses infinitely backward justifying each justification, or stops arbitrarily at some unproven axiom. All three endings are unsatisfying, and there's no fourth option.",
    question: "Which is the least bad way to end a chain of justification?",
    choices: [
      { text: "Stop at an arbitrary axiom (foundationalism).", tag: "RATIONALIST", pct: 47 },
      { text: "Accept a circle, if wide and coherent enough (coherentism).", tag: "EMPIRICIST", pct: 33 },
      { text: "Accept the chain never really ends (infinitism).", tag: "SKEPTIC", pct: 20 },
    ],
    note: "Named for Baron Münchhausen supposedly pulling himself from a swamp by his own hair — the trilemma is the classic argument that certainty of any belief's foundation is structurally out of reach.",
  },
  {
    id: "c17", cat: "epistemology", title: "The Paradox of the Preface", thinker: "D.C. Makinson — 1965",
    scenario: "An author is confident in every single claim in her book, yet writes in the preface 'any errors that remain are my own' — rationally certain, in aggregate, that at least one claim is false, while believing each one individually.",
    question: "Can it be rational to believe every claim in a set, while believing the set as a whole contains an error?",
    choices: [
      { text: "Yes — both beliefs can be reasonable at once.", tag: "EMPIRICIST", pct: 58 },
      { text: "No — this is a genuine contradiction in belief.", tag: "RATIONALIST", pct: 42 },
    ],
    note: "The paradox challenges the assumption that rational belief must be 'closed' under conjunction — believing A and believing B doesn't obviously commit you to believing 'A and B' without qualification.",
  },
  {
    id: "c18", cat: "epistemology", title: "Zhuangzi's Butterfly Dream", thinker: "Zhuangzi, Warring States China — c. 3rd century BCE",
    scenario: "Zhuangzi dreams he is a butterfly, fluttering with no awareness of being a man. On waking, he cannot tell whether he is a man who dreamed of being a butterfly, or now a butterfly dreaming he is a man.",
    question: "Once inside an experience, can you reliably tell whether you're dreaming or awake?",
    choices: [
      { text: "Yes — waking life has a distinct coherence dreams lack.", tag: "RATIONALIST", pct: 36 },
      { text: "No — a sufficiently coherent dream would feel identical from the inside.", tag: "SKEPTIC", pct: 64 },
    ],
    note: "Zhuangzi told the story not to despair but to dissolve the question — for him it illustrates the constant 'transformation of things', where fixed identity itself is the illusion, not just the dream/reality boundary.",
  },

  // ───────── METAPHYSICS & IDENTITY ─────────
  {
    id: "c19", cat: "metaphysics", title: "The Ship of Theseus", thinker: "Plutarch — 1st century CE",
    scenario: "A ship has every one of its planks replaced over years of repair, one at a time, until no original wood remains. Separately, someone collects every discarded original plank and reassembles them into a second ship.",
    question: "Which one, if either, is the 'real' original ship?",
    choices: [
      { text: "The continuously repaired ship — identity follows continuity of form and function.", tag: "RATIONALIST", pct: 54 },
      { text: "The reassembled one — identity follows the original matter.", tag: "EMPIRICIST", pct: 28 },
      { text: "Neither — 'the same ship' stopped being a well-defined question.", tag: "SKEPTIC", pct: 18 },
    ],
    note: "There's no settled answer after two thousand years of debate — it probes whether identity over time tracks matter, form, function, or is simply a useful fiction we impose on gradual change.",
  },
  {
    id: "c20", cat: "metaphysics", title: "The Teleporter Paradox", thinker: "Popularized by Derek Parfit, 1984; cf. Davidson's Swampman, 1987",
    scenario: "A teleporter destroys your body, scans it completely, and reconstructs an atom-for-atom identical you elsewhere. The copy remembers being you, with total continuity of thought and personality — but the original body was destroyed.",
    question: "Did you survive the trip, or did you die and a mere copy take your place?",
    choices: [
      { text: "I survived — same memories, same personality, same person.", tag: "COMPATIBILIST", pct: 62 },
      { text: "I died — the copy is someone else who merely thinks it's me.", tag: "HARD_DETERMINIST", pct: 38 },
    ],
    note: "Parfit's own view was radical: personal identity isn't what fundamentally matters — psychological continuity, even without one continuous 'self', is enough for what we actually care about in survival.",
  },
  {
    id: "c21", cat: "metaphysics", title: "Parfit's Fission", thinker: "Derek Parfit, Reasons and Persons — 1984",
    scenario: "Your brain's two hemispheres are separately transplanted into two different bodies; each half preserves full psychological continuity, memories, and personality. Both resulting people are equally, completely 'you' by every psychological measure.",
    question: "Are both resulting people you, or does something about 'you' not survive division at all?",
    choices: [
      { text: "Both are me equally — identity can branch.", tag: "COMPATIBILIST", pct: 34 },
      { text: "Neither is fully me anymore — one-to-one continuity got broken by branching.", tag: "HARD_DETERMINIST", pct: 44 },
      { text: "Only one can really be me — identity can't be shared.", tag: "LIBERTARIAN_FW", pct: 22 },
    ],
    note: "Parfit used this to argue strict 'identity' is the wrong concept here — what matters is that psychological continuity survives, even split, rather than there being one true numerically identical successor.",
  },
  {
    id: "c22", cat: "metaphysics", title: "The Grandfather Paradox", thinker: "René Barjavel, Le Voyageur Imprudent — 1943",
    scenario: "A time traveler goes back and prevents their own grandfather from ever meeting their grandmother, seemingly erasing the very condition of their own birth — and thus their own ability to have traveled back at all.",
    question: "If backward time travel were physically possible, could you actually change the past this way?",
    choices: [
      { text: "Yes — the past would simply be altered.", tag: "LIBERTARIAN_FW", pct: 21 },
      { text: "No — some deeper consistency would prevent it (Novikov self-consistency).", tag: "HARD_DETERMINIST", pct: 51 },
      { text: "No — it would spawn a separate branching timeline, leaving the original untouched.", tag: "COMPATIBILIST", pct: 28 },
    ],
    note: "Physicist Igor Novikov proposed that any physically possible time travel could only ever produce self-consistent history — you'd find yourself unable to prevent your own birth, not by magic, but because physics itself would conspire against the contradiction.",
  },
  {
    id: "c23", cat: "metaphysics", title: "Laplace's Demon", thinker: "Pierre-Simon Laplace — 1814",
    scenario: "If a demon could know the exact position and momentum of every particle in the universe, physical law alone would let it calculate the entire future — including every choice you will ever 'decide' to make.",
    question: "If the universe is fully deterministic this way, can your choices still be meaningfully free?",
    choices: [
      { text: "Yes — freedom just means acting from your own reasons, uncoerced (compatibilism).", tag: "COMPATIBILIST", pct: 49 },
      { text: "No — real freedom requires being able to have done otherwise (hard determinism).", tag: "HARD_DETERMINIST", pct: 33 },
      { text: "Freedom requires the universe not be fully deterministic in the first place (libertarian free will).", tag: "LIBERTARIAN_FW", pct: 18 },
    ],
    note: "This three-way split has run since antiquity; contemporary surveys of professional philosophers still find compatibilism the plurality view, though all three positions retain serious, active defenders.",
  },
  {
    id: "c24", cat: "metaphysics", title: "The Sorites Paradox", thinker: "Eubulides of Miletus — 4th century BCE",
    scenario: "One grain of sand is not a heap. Adding a single grain to a non-heap never turns it into a heap. Apply that rule enough times, though, and you must conclude ten million grains are still 'not a heap'.",
    question: "Is there a precise, exact grain-count at which 'not a heap' becomes 'a heap'?",
    choices: [
      { text: "Yes, in principle — vagueness is just our ignorance of a sharp line.", tag: "RATIONALIST", pct: 27 },
      { text: "No — 'heap' is inherently vague; there's no fact of the matter.", tag: "EMPIRICIST", pct: 73 },
    ],
    note: "The sorites paradox founded the modern study of vagueness in logic and language — competing responses include fuzzy logic, 'supervaluationism', and epistemicism (a sharp line exists, we just can't ever know it).",
  },

  // ───────── PHILOSOPHY OF MIND ─────────
  {
    id: "c25", cat: "mind", title: "The Chinese Room", thinker: "John Searle — 1980",
    scenario: "A person who speaks no Chinese sits in a room, manipulating Chinese symbols purely by following a rulebook, and produces fluent Chinese answers passed out under the door. To an interrogator outside, the room is indistinguishable from a genuine Chinese speaker.",
    question: "Does the room (or the person in it) actually understand Chinese, or only appear to?",
    choices: [
      { text: "It genuinely understands — the system as a whole produces real comprehension.", tag: "PHYSICALIST", pct: 33 },
      { text: "It's only simulating — fluent symbol manipulation isn't semantic understanding.", tag: "DUALIST", pct: 67 },
    ],
    note: "Searle aimed this at 'strong AI' claims — his argument that pure symbol-manipulation can never produce genuine understanding remains one of the most argued-over thought experiments in cognitive science, especially as language models pass more of Turing's test.",
  },
  {
    id: "c26", cat: "mind", title: "Mary's Room", thinker: "Frank Jackson — 1982",
    scenario: "Mary is a brilliant scientist who has lived her entire life in a black-and-white room, but has learned every physical fact there is to know about color vision and the brain. One day she steps outside and sees red for the first time.",
    question: "Does Mary learn something genuinely new when she finally sees red?",
    choices: [
      { text: "Yes — she gains new knowledge, so physical facts can't be the whole story.", tag: "DUALIST", pct: 61 },
      { text: "No — she just gains a new ability, not new propositional knowledge.", tag: "PHYSICALIST", pct: 39 },
    ],
    note: "Jackson originally used this against pure physicalism about the mind; he later reversed his own position, arguing Mary only gains a new ability to recognize and imagine — the debate over which reading is right continues.",
  },
  {
    id: "c27", cat: "mind", title: "The Philosophical Zombie", thinker: "David Chalmers, 1996 — concept traces to Robert Kirk, 1974",
    scenario: "Imagine a being physically identical to you, atom for atom, behaving exactly as you do — flinching from pain, saying 'that hurts' — but with no inner subjective experience at all. Nothing it is like to be it.",
    question: "Is such a being even conceivable — physically identical, but with no consciousness inside?",
    choices: [
      { text: "Yes, conceivable — showing consciousness is something over and above the physical facts.", tag: "DUALIST", pct: 46 },
      { text: "No — identical physics and behavior necessarily means identical inner experience.", tag: "PHYSICALIST", pct: 54 },
    ],
    note: "Chalmers uses mere conceivability to argue for a real explanatory gap — the 'hard problem of consciousness' — while physicalist critics deny the zombie is coherently conceivable once you take physics seriously.",
  },
  {
    id: "c28", cat: "mind", title: "Twin Earth", thinker: "Hilary Putnam — 1975",
    scenario: "On a distant twin Earth, everything is identical except the clear, drinkable liquid they call 'water' is chemically XYZ, not H2O. A twin-Earth speaker in 1750, before chemistry existed, uses the word 'water' exactly as you do, with an identical mental state.",
    question: "When you and your twin both think 'water,' are you thinking about the same thing?",
    choices: [
      { text: "Yes — meaning is fixed by what's in your head, and your mental states match.", tag: "RATIONALIST", pct: 29 },
      { text: "No — meaning depends on what's actually in the environment, H2O versus XYZ.", tag: "EMPIRICIST", pct: 71 },
    ],
    note: "Putnam's slogan — 'meaning just ain't in the head' — helped found externalism about mental content: what your words and thoughts refer to depends partly on your environment, not just your internal state.",
  },
  {
    id: "c29", cat: "mind", title: "The Problem of Other Minds", thinker: "Descartes' Meditations, 1641; formalized by J.S. Mill, 1865",
    scenario: "You have direct access only to your own conscious experience. Everyone else's inner life — whether they truly feel anything at all — you infer solely from their outward behavior and your own case, by analogy.",
    question: "Can you ever really know that other people are conscious, rather than just behaving as if they were?",
    choices: [
      { text: "Yes — the analogy from my own case to theirs is solid enough for knowledge.", tag: "EMPIRICIST", pct: 68 },
      { text: "No — strictly, it remains an inference we can never fully verify.", tag: "SKEPTIC", pct: 32 },
    ],
    note: "This puzzle underlies the modern debate over animal and AI consciousness — if we can't be fully certain even of other humans, judging non-human minds is harder still, yet we clearly must make some such judgment to function at all.",
  },
  {
    id: "c30", cat: "mind", title: "The Inverted Spectrum", thinker: "John Locke, 1690 — formalized in the 20th century",
    scenario: "Suppose what you experience as 'red' is what someone else experiences as 'green,' and vice versa, consistently from birth — yet you both learned to call the same wavelength 'red' and would never behave any differently, since the inversion is perfectly self-consistent.",
    question: "Could two people's color experiences be inverted like this with no way, even in principle, to detect it?",
    choices: [
      { text: "Yes — subjective quality could differ while function and behavior stay identical.", tag: "DUALIST", pct: 58 },
      { text: "No — rich enough relations between colors would rule out a full inversion.", tag: "PHYSICALIST", pct: 42 },
    ],
    note: "Locke first raised this as an idle curiosity; it became central to debates over qualia and functionalism — if consciousness is entirely determined by function, systematic inversion should be impossible, which is exactly what functionalism's critics dispute.",
  },

  // ───────── LOGIC & CLASSICAL PARADOXES ─────────
  {
    id: "c31", cat: "logic", title: "The Liar Paradox", thinker: "Eubulides of Miletus — 4th century BCE",
    scenario: "Consider the sentence: 'This sentence is false.' If it's true, then what it says is so, meaning it's false. If it's false, then what it says is so, meaning it's true. Either assumption flips into its opposite.",
    question: "Is 'This sentence is false' true, false, or something else entirely?",
    choices: [
      { text: "Meaningless — self-reference like this breaks the true/false framework.", tag: "RATIONALIST", pct: 55 },
      { text: "Both true and false at once (dialetheism) — some contradictions are real.", tag: "EMPIRICIST", pct: 22 },
      { text: "It has a definite value; we just need a better logical framework to see it.", tag: "SKEPTIC", pct: 23 },
    ],
    note: "Alfred Tarski's response was that natural language can't consistently contain its own truth predicate — 'true' must live in a strictly higher-level metalanguage, a fix formal logic and computer science still rely on today.",
  },
  {
    id: "c32", cat: "logic", title: "The Unexpected Hanging", thinker: "First recorded 1943–48, likely a wartime radio riddle",
    scenario: "A judge tells a prisoner he'll be hanged on one weekday next week, but the day will be a surprise. The prisoner reasons it can't be Friday (he'd know by Thursday night), so eliminates it, then Thursday the same way, and so on — concluding no surprise hanging is possible. It happens Wednesday, and he's completely surprised.",
    question: "Was the prisoner's elimination logic sound, even though the surprise happened anyway?",
    choices: [
      { text: "Sound — the paradox is with self-referential predictions like 'surprise', not his reasoning.", tag: "RATIONALIST", pct: 41 },
      { text: "Flawed somewhere, even if we can't pinpoint exactly where.", tag: "EMPIRICIST", pct: 34 },
      { text: "It depends how 'surprise' is defined — precision dissolves the paradox.", tag: "SKEPTIC", pct: 25 },
    ],
    note: "Despite decades of formal analysis there's still no fully agreed resolution — a genuine open problem at the intersection of logic, epistemology, and game theory.",
  },
  {
    id: "c33", cat: "logic", title: "Buridan's Ass", thinker: "Attributed to (likely a satire of) Jean Buridan — 14th century",
    scenario: "A donkey stands exactly equidistant between two identical, equally appealing piles of hay. With no reason to prefer one over the other, pure rationality offers no basis for choosing — and, by hypothesis, the donkey starves.",
    question: "Could a perfectly rational agent, faced with two truly identical options, ever actually choose at all?",
    choices: [
      { text: "Yes — some tie-breaking mechanism, rational or not, would still resolve it.", tag: "RATIONALIST", pct: 66 },
      { text: "No — without a differentiating reason, rational choice is genuinely paralyzed.", tag: "LIBERTARIAN_FW", pct: 34 },
    ],
    note: "Used to probe whether choice requires a sufficient reason (Leibniz's 'principle of sufficient reason') or whether arbitrary 'will' can break ties reason alone cannot — modern decision theory just builds in randomization to sidestep it.",
  },
  {
    id: "c34", cat: "logic", title: "Newcomb's Paradox", thinker: "William Newcomb, 1960; popularized by Robert Nozick, 1969",
    scenario: "A near-infallible predictor has already placed money in two boxes: Box A always holds $1,000 visibly; Box B holds either $1,000,000 or $0, decided in advance from a prediction of your choice. You may take only Box B, or both boxes — but if the predictor foresaw you'd take both, Box B was left empty.",
    question: "Do you take just Box B, or both boxes?",
    choices: [
      { text: "Just Box B — trust the predictor's track record, maximize expected payoff.", tag: "UTIL", pct: 57 },
      { text: "Both boxes — the money's already placed; my choice now can't reach back and change it.", tag: "RATIONALIST", pct: 43 },
    ],
    note: "Nozick reported the split among philosophers he polled was almost even — it remains a live dividing line between causal and evidential decision theory.",
  },
  {
    id: "c35", cat: "logic", title: "The Raven Paradox", thinker: "Carl Gustav Hempel — 1945",
    scenario: "'All ravens are black' is logically equivalent to 'All non-black things are non-ravens.' So spotting a green apple (a non-black non-raven) technically counts as confirming evidence for 'all ravens are black' — without ever seeing a single raven.",
    question: "Does observing a green apple really give you evidence, however small, that all ravens are black?",
    choices: [
      { text: "Yes — logically, it has to count as some tiny confirming evidence.", tag: "RATIONALIST", pct: 39 },
      { text: "No — something about the reasoning must be misleading, even if formally valid.", tag: "EMPIRICIST", pct: 61 },
    ],
    note: "Hempel intended the paradox to show our intuitive notion of 'confirming evidence' doesn't line up cleanly with formal logical equivalence — a gap that shaped decades of work in confirmation theory.",
  },
  {
    id: "c36", cat: "logic", title: "Achilles and the Tortoise", thinker: "Zeno of Elea — 5th century BCE",
    scenario: "Swift Achilles races a tortoise given a head start. By the time he reaches its starting point, it has moved slightly ahead; by the time he closes that gap, it has moved further still — seemingly requiring infinitely many steps, so Achilles can never actually catch it.",
    question: "Does the argument show Achilles genuinely, physically could never catch the tortoise?",
    choices: [
      { text: "No — infinitely many steps can still sum to a finite time (convergent series).", tag: "RATIONALIST", pct: 74 },
      { text: "Yes, in some deeper sense — it reveals a real puzzle about motion and infinite divisibility.", tag: "SKEPTIC", pct: 26 },
    ],
    note: "Calculus resolves the arithmetic cleanly, but some philosophers of physics still argue Zeno points to a genuine, unresolved puzzle about whether space and time are infinitely divisible or granular at bottom.",
  },

  // ───────── PHILOSOPHY OF RELIGION ─────────
  {
    id: "c37", cat: "religion", title: "The Problem of Evil", thinker: "Attributed to Epicurus, 3rd century BCE; formalized by J.L. Mackie, 1955",
    scenario: "If God is all-powerful, all-knowing, and perfectly good, evil and suffering should not exist — a good God would want to prevent it, an all-knowing one would know how, and an all-powerful one could. Yet suffering plainly exists.",
    question: "Is the amount and kind of suffering in the world compatible with an all-powerful, all-knowing, perfectly good God?",
    choices: [
      { text: "Yes — a sufficient reason (free will, soul-building, greater goods) is compatible with all three.", tag: "THEIST", pct: 53 },
      { text: "No — the sheer scale and randomness of suffering is hard to square with all three at once.", tag: "ATHEIST", pct: 47 },
    ],
    note: "Alvin Plantinga's 'free will defense' is the most cited theist response to the logical version; the harder, still-contested 'evidential' version argues gratuitous, unexplainable suffering specifically counts as evidence against theism, short of disproof.",
  },
  {
    id: "c38", cat: "religion", title: "Pascal's Wager", thinker: "Blaise Pascal, Pensées — 1670",
    scenario: "You can't know for certain whether God exists. Pascal argues the payoff is lopsided: believe and be right, infinite reward; believe and be wrong, minor cost; disbelieve and be wrong, infinite loss; disbelieve and be right, minor gain.",
    question: "Is betting on belief in God, purely on this expected-value logic, actually the rational move?",
    choices: [
      { text: "Yes — infinite stakes should dominate the calculation regardless of the odds.", tag: "RATIONALIST", pct: 29 },
      { text: "No — you can't choose belief on command, and the logic equally favors any rival religion promising infinite reward.", tag: "SKEPTIC", pct: 71 },
    ],
    note: "The classic rebuttal is the 'many gods objection' — the same wager logic equally recommends belief in any of thousands of mutually exclusive deities each promising infinite reward, cancelling out any single one's supposed advantage.",
  },
  {
    id: "c39", cat: "religion", title: "The Euthyphro Dilemma", thinker: "Plato, Euthyphro — c. 380 BCE",
    scenario: "Socrates asks the priest Euthyphro: is an act pious because the gods love it, or do the gods love it because it is already pious? Swap in any moral authority for 'the gods' and the dilemma still bites.",
    question: "Is something good because an authority commands it, or does the authority command it because it's already good?",
    choices: [
      { text: "Good because commanded — morality depends entirely on the authority's will.", tag: "DEON", pct: 24 },
      { text: "Commanded because good — the authority tracks a standard independent of it.", tag: "RATIONALIST", pct: 76 },
    ],
    note: "The first horn makes morality arbitrary (goodness would flip if the command flipped); the second implies a standard of goodness independent of even a divine will — a tension theologians have wrestled with for over two thousand years.",
  },
  {
    id: "c40", cat: "religion", title: "The Omnipotence Paradox", thinker: "Formalized in medieval scholastic debate, e.g. Aquinas",
    scenario: "Can an all-powerful being create a stone so heavy that even it cannot lift it? If yes, there's now something it can't do. If no, there's already something it can't do. Either way, omnipotence seems to break.",
    question: "Does this puzzle actually disprove the coherence of 'omnipotence'?",
    choices: [
      { text: "Yes — it shows unlimited, unrestricted omnipotence is logically incoherent.", tag: "ATHEIST", pct: 44 },
      { text: "No — omnipotence means the power to do anything logically possible; this was never a real task.", tag: "THEIST", pct: 56 },
    ],
    note: "Aquinas's own resolution was essentially the second option — genuine omnipotence was never meant to include the power to do the logically incoherent, since a 'logically impossible task' isn't a task at all.",
  },
  {
    id: "c41", cat: "religion", title: "Divine Hiddenness", thinker: "J.L. Schellenberg — 1993",
    scenario: "A perfectly loving God would presumably want a relationship with every capable, willing person. Yet some people, sincerely and non-culpably searching, report finding no convincing evidence of God at all.",
    question: "Is God's apparent hiddenness from sincere, non-resistant seekers evidence against a perfectly loving God?",
    choices: [
      { text: "Yes — a perfectly loving being wouldn't stay hidden from a genuine, non-resistant seeker.", tag: "ATHEIST", pct: 49 },
      { text: "No — there could be good reasons for hiddenness we simply don't see.", tag: "THEIST", pct: 51 },
    ],
    note: "Schellenberg intended this as a distinct argument from the traditional problem of evil — targeting God's hiddenness itself as the evidential problem, rather than suffering.",
  },
  {
    id: "c42", cat: "religion", title: "Theological Fatalism", thinker: "Boethius, The Consolation of Philosophy — c. 524 CE",
    scenario: "If God infallibly knows, from eternity, every choice you will ever make, it seems your choices were already fixed before you were born — true foreknowledge appears to leave no room for your choice to have gone otherwise.",
    question: "Can God know your future choices infallibly and those choices still be genuinely free?",
    choices: [
      { text: "Yes — foreknowledge just observes a choice still genuinely yours; knowing isn't causing.", tag: "COMPATIBILIST", pct: 58 },
      { text: "No — infallible knowledge of a fixed future rules out the choice ever being open.", tag: "HARD_DETERMINIST", pct: 42 },
    ],
    note: "Boethius's own resolution argued God exists outside of time altogether, viewing all history in a single eternal 'present' — so divine knowledge doesn't precede your choice in a way that could fix it in advance.",
  },

  // ───────── DECISION & GAME THEORY ─────────
  {
    id: "c43", cat: "decision", title: "The Prisoner's Dilemma", thinker: "Merrill Flood & Melvin Dresher, 1950; named by Albert W. Tucker",
    scenario: "Two suspects, held separately, are each offered: betray the other and go free while they get 10 years, stay silent and both get 1 year, or both betray and both get 5 years. Neither can communicate.",
    question: "Playing purely rationally, with no way to communicate or trust, would you stay silent or betray?",
    choices: [
      { text: "Stay silent — cooperate for the better joint outcome, trusting reciprocity.", tag: "CONTRACT", pct: 39 },
      { text: "Betray — it's the individually dominant strategy no matter what the other does.", tag: "UTIL", pct: 61 },
    ],
    note: "Betraying is each player's individually 'dominant' strategy — rational for both, yet it produces a worse outcome for both than mutual cooperation, the founding puzzle of game theory's distinction between individual and collective rationality.",
  },
  {
    id: "c44", cat: "decision", title: "The Ultimatum Game", thinker: "Werner Güth, Rolf Schmittberger & Bernd Schwarze — 1982",
    scenario: "One player proposes how to split a sum of money with a second player; if the second player rejects the split, neither gets anything. Purely self-interested logic says accept literally any nonzero offer.",
    question: "If offered just 10% of a sum, take-it-or-leave-it, would you accept it or reject it to deny the proposer anything?",
    choices: [
      { text: "Accept — something is still strictly better than nothing.", tag: "UTIL", pct: 34 },
      { text: "Reject — punishing an unfair split is worth more to me than the money.", tag: "VIRTUE", pct: 66 },
    ],
    note: "Real experimental subjects overwhelmingly reject offers below roughly 20–30%, worldwide — direct evidence humans optimize for fairness norms and punishing unfairness, not pure individual payoff maximization as classical economics assumed.",
  },
  {
    id: "c45", cat: "decision", title: "Pascal's Mugging", thinker: "Nick Bostrom, 2009 — building on Pascal's Wager logic",
    scenario: "A stranger claims vast, near-magical powers and threatens unimaginable suffering to an astronomically huge number of people unless you hand over your wallet. The claimed probability is tiny, but the claimed stakes are so enormous that naive expected-value math says pay up anyway.",
    question: "Should vanishingly small probabilities of astronomically large outcomes actually dominate your decisions this way?",
    choices: [
      { text: "Yes — expected value is expected value, however small the odds, if stakes are big enough.", tag: "RATIONALIST", pct: 21 },
      { text: "No — extreme claims need proportionally extreme evidence; raw expected-value math breaks down here.", tag: "SKEPTIC", pct: 79 },
    ],
    note: "Bostrom devised this to expose a genuine flaw in naive expected-utility reasoning: it seems exploitable by anyone willing to claim a big enough threat, which most decision theorists now agree requires some principled discount for extremity.",
  },
  {
    id: "c46", cat: "decision", title: "The Doomsday Argument", thinker: "Brandon Carter, 1983; developed by John Leslie",
    scenario: "Assume you're a randomly selected observer among all humans who will ever live. Statistically, you're far more likely to be born somewhere in the 'middle' of the total count than right near the start of a vastly larger population still to come.",
    question: "Does the mere fact of your birth rank among all humans give you genuine evidence about how soon humanity will end?",
    choices: [
      { text: "Yes — as a random sample, your birth rank is real statistical evidence for a sooner end.", tag: "RATIONALIST", pct: 31 },
      { text: "No — this reasoning about your own existence is a statistical illusion, not real evidence.", tag: "SKEPTIC", pct: 69 },
    ],
    note: "A favorite of both defenders and critics of 'anthropic reasoning' — the same self-sampling logic underlies serious debates in cosmology and the simulation argument, making this one of the rare purely philosophical arguments taken seriously by working physicists.",
  },
  {
    id: "c47", cat: "decision", title: "The Simulation Argument", thinker: "Nick Bostrom — 2003",
    scenario: "If advanced civilizations eventually run vast numbers of detailed ancestor-simulations of their own history, simulated minds would vastly outnumber 'originally real' ones — meaning a randomly selected mind is far more likely to be one of the simulated many.",
    question: "Given this reasoning, do you think it's more likely than not that we're living in a simulation?",
    choices: [
      { text: "More likely than not — the numbers argument is genuinely persuasive.", tag: "RATIONALIST", pct: 24 },
      { text: "No more likely than not — the premises themselves are too uncertain to lean on.", tag: "SKEPTIC", pct: 76 },
    ],
    note: "Bostrom's own point was narrower than headlines suggest: at least one of three propositions must be true (civilizations rarely survive to that stage, rarely bother simulating history, or we probably are simulated) — not that simulation is the confirmed answer.",
  },
  {
    id: "c48", cat: "decision", title: "The Sleeping Beauty Problem", thinker: "Arnold Zuboff, 1981; named by Adam Elga, 2000",
    scenario: "Sleeping Beauty is put to sleep. A coin is flipped: on heads she's woken once; on tails she's woken twice, with her memory wiped between wakings so she can't tell which waking it is. Each time she wakes, she's asked her credence the coin landed heads.",
    question: "When woken, not knowing which waking this is, what should her credence in 'heads' be?",
    choices: [
      { text: "1/2 — the coin itself is still fair; waking shouldn't change that.", tag: "RATIONALIST", pct: 41 },
      { text: "1/3 — being woken at all is twice as likely under tails, so waking is itself evidence for tails.", tag: "EMPIRICIST", pct: 59 },
    ],
    note: "One of the most stubbornly contested puzzles in contemporary formal epistemology — professional philosophers of probability remain close to evenly split between 'halfer' and 'thirder' camps, decades after Elga's original paper.",
  },
];
