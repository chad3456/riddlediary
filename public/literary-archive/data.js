// THE LITERARY ARCHIVE — data
// Illustrative "crowd" percentages are fixed sample numbers for a self-contained
// static page (no backend, no real respondent pool) — they exist to make each
// case feel populated, not to represent a real survey.

const CATEGORIES = [
  { key: "freewill", label: "Free Will & Fate", color: "#7d3fa0" },
  { key: "morality", label: "Morality, Guilt & Justice", color: "#a3312a" },
  { key: "reality", label: "Simulated & Unreliable Reality", color: "#2166ac" },
  { key: "principles", label: "Power, Principles & Corruption", color: "#b8860b" },
  { key: "identity", label: "Identity & the Self", color: "#1a7a6e" },
  { key: "society", label: "Society, Control & Dystopia", color: "#4a4a6a" },
];

const TAGS = {
  FREE_AGENT: "Self-authoring — you hold people to their choices even under heavy pressure or conditioning.",
  DETERMINIST: "Fate-bound — you read circumstance, biology, and history as the real authors of behavior.",
  ABSOLUTIST: "Line-holder — certain acts are wrong regardless of motive, suffering, or context.",
  SITUATIONAL: "Context-reader — you weigh circumstance, pressure, and consequence before judging an act.",
  REDEMPTIVE: "Redemption-minded — you believe change and restitution can outweigh the original wrong.",
  PUNITIVE: "Accountability-first — consequences should track the act, whatever comes after.",
  REALITY_SKEPTIC: "Reality-skeptic — you assume what you're shown may be curated, staged, or false until proven otherwise.",
  NAIVE_REALIST: "Reality-truster — you take perception and institutions at face value unless given a reason not to.",
  AUTHENTICITY: "Authenticity-first — a truth you didn't choose beats a comfort you did.",
  COMFORT_UTIL: "Comfort-pragmatist — a good enough experience can matter more than which one is 'real'.",
  INDIVIDUALIST: "Individual-first — personal conscience outranks the group, the state, or the mission.",
  COLLECTIVIST: "Order-first — shared stability justifies constraining the individual.",
  POWER_SKEPTIC: "Power-skeptic — you assume authority drifts toward self-interest unless checked.",
  POWER_TRUST: "Institution-truster — you default to the legitimacy of established leadership and law.",
  SELF_FLUID: "Identity-as-construction — the self is something built, split, or reinvented, not fixed.",
  SELF_FIXED: "Identity-as-core — there's a stable self underneath role, body, or circumstance.",
};

const CASES = [
  // ───────── FREE WILL & FATE ─────────
  {
    id: "b01", cat: "freewill", title: "Oedipus Rex", thinker: "Sophocles — c. 429 BCE",
    scenario: "A prophecy names the exact horrors Oedipus will commit before he can walk or choose anything; every effort by him and his parents to dodge it is precisely what drives it to happen.",
    question: "If your worst act was foretold before you could choose otherwise, are you still guilty of it?",
    choices: [
      { text: "Yes — the choices along the way were still mine.", tag: "FREE_AGENT", pct: 47 },
      { text: "No — a fixed outcome isn't a moral failing, just a fate.", tag: "DETERMINIST", pct: 53 },
    ],
    note: "Sophocles doesn't let Oedipus off the hook for ignorance of the facts, but the play's horror is precisely that diligence and virtue couldn't out-run what was fixed — Greek tragedy's answer is that fate and character can both be true at once.",
    modern: "Read today against genetic and socioeconomic predictors of life outcomes — \"were you ever going to escape your zip code's statistics\" is Oedipus's question in actuarial clothing.",
  },
  {
    id: "b02", cat: "freewill", title: "Macbeth", thinker: "William Shakespeare — c. 1606",
    scenario: "Three witches tell Macbeth he will be king; he could have waited for it to simply happen, but instead murders his way there, then blames the prophecy for \"making\" him do it.",
    question: "Does a prophecy you act on to fulfill excuse the acting?",
    choices: [
      { text: "No — he chose the murder; the witches only named a possibility.", tag: "FREE_AGENT", pct: 71 },
      { text: "Partly — once told, the idea itself corrupts the chooser.", tag: "DETERMINIST", pct: 29 },
    ],
    note: "Shakespeare is careful to make the witches' prophecy vague enough that only Macbeth's own ambition turns it into a murder plot — the play indicts the interpreter, not the prediction.",
    modern: "It's the logic of the self-fulfilling algorithmic recommendation — told you're \"likely to relapse\" or \"high risk,\" people sometimes act their way into exactly that outcome.",
  },
  {
    id: "b03", cat: "freewill", title: "Slaughterhouse-Five", thinker: "Kurt Vonnegut — 1969",
    scenario: "Billy Pilgrim becomes \"unstuck in time,\" living every moment of his life in any order, including his own death — the alien Tralfamadorians tell him free will is a concept unique to Earth.",
    question: "If every moment of your life already exists, fixed, all at once, does \"choice\" mean anything at all?",
    choices: [
      { text: "No — you can only experience the moments, not alter them.", tag: "DETERMINIST", pct: 55 },
      { text: "Yes — meaning comes from how you attend to a moment, not whether you could've skipped it.", tag: "FREE_AGENT", pct: 45 },
    ],
    note: "Vonnegut wrote the Tralfamadorian view as a coping mechanism for surviving the Dresden firebombing — \"so it goes\" is resignation dressed as cosmology, not a philosophy he fully endorses.",
    modern: "This is block-universe physics (all moments equally real in spacetime) meeting trauma survival — the same shrug shows up whenever someone says \"it was always going to happen\" about grief they can't otherwise metabolize.",
  },
  {
    id: "b04", cat: "freewill", title: "A Clockwork Orange", thinker: "Anthony Burgess — 1962",
    scenario: "Alex, a violent teenager, is subjected to aversion therapy that makes him physically ill at the thought of violence — he becomes safe, but only because choosing otherwise is no longer possible for him.",
    question: "Is a person \"good\" if they're incapable of choosing to be bad?",
    choices: [
      { text: "No — morality requires the live option to do otherwise.", tag: "FREE_AGENT", pct: 68 },
      { text: "Yes — a safer world is worth a narrower range of choice.", tag: "COLLECTIVIST", pct: 32 },
    ],
    note: "Burgess's chaplain says it outright in the book: Alex has been made \"a clockwork orange\" — organic on the outside, mechanical within — because the state chose order over moral agency.",
    modern: "Content-moderation shadow-bans and predictive parole algorithms run the same trade today — is a person \"rehabilitated\" if a system simply removed their capacity to reoffend, or only monitored?",
  },
  {
    id: "b05", cat: "freewill", title: "Minority Report", thinker: "Philip K. Dick — 1956",
    scenario: "\"Precogs\" foresee murders before they happen, and police arrest people for crimes they have not yet committed — until the story's protagonist sees his own name flagged, and has to decide whether foreknowledge itself changes what he'll do.",
    question: "Should someone be punished for a crime they were completely certain — but hadn't yet chosen — to commit?",
    choices: [
      { text: "No — punishing intent instead of action erases the choice not to.", tag: "FREE_AGENT", pct: 79 },
      { text: "Yes — if the prediction is perfect, the outcome is the same as guilt.", tag: "DETERMINIST", pct: 21 },
    ],
    note: "Dick's twist is that the precogs sometimes disagree with each other — a \"minority report\" — proof that the future they see is a branching probability, not a fixed fact, which quietly restores the agency the system claims to have eliminated.",
    modern: "Predictive policing software that flags neighborhoods and individuals as \"high risk\" runs on the same premise, minus the psychic accuracy — pre-crime by statistics instead of precogs.",
  },
  {
    id: "b06", cat: "freewill", title: "Watchmen", thinker: "Alan Moore — 1986",
    scenario: "Dr. Manhattan experiences all of his life simultaneously and can perceive the future with total accuracy, which leaves him detached from human urgency — he knows exactly what he will do before he does it, and does it anyway.",
    question: "If you could see your own future with certainty, would you still feel like you were choosing it?",
    choices: [
      { text: "No — certain knowledge of an act removes the experience of choosing it.", tag: "DETERMINIST", pct: 61 },
      { text: "Yes — doing the thing you already know you'll do is still doing it.", tag: "FREE_AGENT", pct: 39 },
    ],
    note: "Moore uses Manhattan's flat affect to dramatize a real philosophical worry — that a being for whom the future is already \"there\" to be seen has nothing left resembling deliberation, only spectatorship of its own life.",
    modern: "It echoes the modern feeling of doomscrolling toward an outcome you can already see coming (a breakup, a layoff, a diagnosis) — foreknowledge that changes nothing about the ending, only how you experience the wait.",
  },
  {
    id: "b07", cat: "freewill", title: "The Garden of Forking Paths", thinker: "Jorge Luis Borges — 1941",
    scenario: "A Chinese scholar's ancestor wrote a novel that seemed like chaotic nonsense until a descendant realizes it's a map of every possible branching choice, all occurring at once in different times — not a story about one path, but all of them.",
    question: "If every choice you didn't make is still happening in some other branch, does the one you did make matter?",
    choices: [
      { text: "Yes — this branch is still the only one you'll ever live.", tag: "FREE_AGENT", pct: 66 },
      { text: "No — \"mattering\" assumes exclusivity that a forking universe doesn't have.", tag: "DETERMINIST", pct: 34 },
    ],
    note: "Borges wrote this before Everett's many-worlds interpretation of quantum mechanics existed as physics — a literary pre-echo of a real scientific idea about branching, superposed realities.",
    modern: "Every \"what if I'd taken that job\" spiral is a small Borges garden — the modern version just has a multiverse movie franchise attached to it instead of a labyrinth novel.",
  },
  {
    id: "b08", cat: "freewill", title: "His Dark Materials", thinker: "Philip Pullman — 1995",
    scenario: "An instrument called the alethiometer can answer any question with total truth about the past, present, and a probabilistic future — but reading it accurately requires the reader to set aside their own wants.",
    question: "Would knowing the statistically likely outcome of a choice change what you'd choose?",
    choices: [
      { text: "Yes — probability is exactly the information choice should run on.", tag: "DETERMINIST", pct: 44 },
      { text: "No — I'd rather choose blind than let the odds choose for me.", tag: "FREE_AGENT", pct: 56 },
    ],
    note: "Pullman built the alethiometer's \"truth\" as always probabilistic, never absolute — even perfect information in his universe leaves room for a character's will to bend the outcome, which is the series' quiet argument for freedom inside a mostly lawful universe.",
    modern: "This is exactly the tension of trusting a fertility app, a cancer-risk score, or a \"compatibility percentage\" — accurate odds that still leave the actual choosing to you.",
  },
  {
    id: "b09", cat: "freewill", title: "Groundhog Day", thinker: "Danny Rubin & Harold Ramis — 1993",
    scenario: "A cynical weatherman relives the same day on an endless loop, with no consequences carrying over to the next repetition, until repetition itself becomes the only thing that can change him.",
    question: "If nothing you do today will be remembered tomorrow, does it still matter how you act?",
    choices: [
      { text: "Yes — how you act shapes who you are, not just what's remembered.", tag: "FREE_AGENT", pct: 84 },
      { text: "No — without consequence or memory, 'moral' loses its footing.", tag: "DETERMINIST", pct: 16 },
    ],
    note: "The film never explains the loop mechanically — it's structured as a moral fable, closer to Buddhist or Stoic ideas of repeated practice shaping character than to any physics of time, which is why the escape is virtue, not a trick.",
    modern: "It's the honest version of \"nobody will ever know\" anonymity online — a like or a comment vanishes into the feed's amnesia by tomorrow, but the person hitting send is still being shaped by the habit of it.",
  },
  {
    id: "b10", cat: "freewill", title: "No Exit", thinker: "Jean-Paul Sartre — 1944",
    scenario: "Three strangers are locked in a single room for eternity, expecting torture devices that never arrive — the torture turns out to be each other's judgment, inescapable and eternal.",
    question: "Are you free if you can never stop being defined by how others see you?",
    choices: [
      { text: "Yes — you can still choose how you respond to their gaze.", tag: "FREE_AGENT", pct: 58 },
      { text: "No — 'hell is other people' because their view of you becomes inescapable.", tag: "DETERMINIST", pct: 42 },
    ],
    note: "Sartre's existentialism holds that we are 'condemned to be free' — even trapped with hostile witnesses forever, his characters retain the freedom to interpret and respond, which is exactly the freedom they refuse to use.",
    modern: "A permanent public comment section under your name, that never expires and that everyone believes over your own account of yourself, is Sartre's locked room rebuilt as a social media profile.",
  },

  // ───────── MORALITY, GUILT & JUSTICE ─────────
  {
    id: "b11", cat: "morality", title: "Crime and Punishment", thinker: "Fyodor Dostoevsky — 1866",
    scenario: "Raskolnikov murders a pawnbroker he's decided is a \"louse\" whose death would net-benefit society, reasoning himself into an \"extraordinary man\" exemption from ordinary morality — then can't out-reason his own conscience afterward.",
    question: "If the math says the world is better without someone in it, does that make removing them justified?",
    choices: [
      { text: "No — no calculation licenses one person to decide who doesn't get to exist.", tag: "ABSOLUTIST", pct: 87 },
      { text: "The math might check out, but I still couldn't live with having done it.", tag: "SITUATIONAL", pct: 13 },
    ],
    note: "Dostoevsky's real target was the utilitarian and Nietzschean \"great man\" theories circulating in 1860s Russia — the novel is an argument that guilt is not a social construct that can be philosophized away, but a fact about the self that survives any argument.",
    modern: "It's the \"effective altruism\" utilitarian-calculus problem in miniature — the same reasoning that optimizes charity can, unchecked, start optimizing who counts as a cost.",
  },
  {
    id: "b12", cat: "morality", title: "The Brothers Karamazov (The Grand Inquisitor)", thinker: "Fyodor Dostoevsky — 1880",
    scenario: "In a story-within-the-story, an Inquisitor tells a silent, returned Christ that humanity doesn't want the burden of free choice — it wants bread, miracle, and authority, and the Church has mercifully taken freedom away in exchange for obedience and comfort.",
    question: "Would you trade the burden of choosing for yourself for guaranteed security and comfort?",
    choices: [
      { text: "No — freedom is worth the anxiety and mistakes that come with it.", tag: "INDIVIDUALIST", pct: 76 },
      { text: "Yes — most people would rather be fed and safe than free.", tag: "COLLECTIVIST", pct: 24 },
    ],
    note: "Dostoevsky, devoutly Orthodox, still gave the Inquisitor's argument enormous force before answering it only with a silent kiss from Christ — a wager that freedom's burden is answered by love, not counter-argument.",
    modern: "Every platform that trades your autonomy for convenience — \"let us choose for you,\" \"trust the algorithm\" — is running the Inquisitor's bargain at a much smaller, dopamine-sized scale.",
  },
  {
    id: "b13", cat: "morality", title: "Les Misérables", thinker: "Victor Hugo — 1862",
    scenario: "Jean Valjean, imprisoned nineteen years for stealing bread, breaks parole to rebuild an honest life and become a benefactor — while Inspector Javert hunts him for decades on the belief that the law, once broken, can never be squared by any amount of subsequent good.",
    question: "Can a lifetime of genuine good outweigh one crime the law says must still be punished?",
    choices: [
      { text: "Yes — who a person becomes matters more than the letter of an old record.", tag: "REDEMPTIVE", pct: 81 },
      { text: "No — the law has to apply evenly, or it isn't really law.", tag: "PUNITIVE", pct: 19 },
    ],
    note: "Hugo built the whole novel as an argument against Javert's rigid legalism — Valjean's redemption is the thesis, and Javert's suicide, unable to hold \"criminal\" and \"good man\" in the same person, is the verdict on the rigid alternative.",
    modern: "\"Ban the box\" hiring reform and expunged-record debates are Valjean's exact question, decided by legislatures instead of a single relentless inspector.",
  },
  {
    id: "b14", cat: "morality", title: "To Kill a Mockingbird", thinker: "Harper Lee — 1960",
    scenario: "Atticus Finch defends a Black man falsely accused of rape in 1930s Alabama, knowing the verdict is decided by the town's prejudice before the trial even starts — and takes the case anyway because it's right, not because it's winnable.",
    question: "Is it worth taking a stand you know you'll lose, just because it's right?",
    choices: [
      { text: "Yes — losing the case doesn't make the stand pointless.", tag: "ABSOLUTIST", pct: 89 },
      { text: "Depends — a fight that can't be won can just be self-congratulation.", tag: "SITUATIONAL", pct: 11 },
    ],
    note: "Lee wrote Atticus's closing argument to lay out the era's legal reality plainly — an all-white jury would convict regardless of evidence — making his defense a moral act aimed at his children and town, not a legal strategy aimed at acquittal.",
    modern: "Whistleblowers who report violations they know their company or agency will bury are running Atticus's math — the point isn't winning, it's the record it leaves.",
  },
  {
    id: "b15", cat: "morality", title: "The Scarlet Letter", thinker: "Nathaniel Hawthorne — 1850",
    scenario: "Hester Prynne is forced to wear an embroidered \"A\" for adultery for the rest of her life in Puritan Boston, while the child's father, a respected minister, hides his own guilt in silence and slowly rots from the inside for it.",
    question: "Is public shame or private guilt the heavier punishment?",
    choices: [
      { text: "Private guilt — it never lets up, even when no one else knows.", tag: "SITUATIONAL", pct: 63 },
      { text: "Public shame — a permanent mark follows you whether you've changed or not.", tag: "PUNITIVE", pct: 37 },
    ],
    note: "Hawthorne's irony is that Hester, publicly punished, grows into the town's most trusted moral figure, while Dimmesdale, privately unpunished, is destroyed by the guilt no one ever made him answer for.",
    modern: "A permanent public callout thread versus the private, unresolved guilt of something never posted about at all — the novel's exact fork, playing out daily on social media pile-ons.",
  },
  {
    id: "b16", cat: "morality", title: "Native Son", thinker: "Richard Wright — 1940",
    scenario: "Bigger Thomas, a young Black man in 1930s Chicago, accidentally kills a white woman in a moment of panic born from a lifetime of racial fear — and the novel refuses to let readers separate his individual act from the conditions that produced it.",
    question: "When a crime grows directly out of a lifetime of imposed fear and constraint, whose responsibility is it?",
    choices: [
      { text: "Shared — the person acted, but the conditions that produced the panic aren't neutral.", tag: "SITUATIONAL", pct: 69 },
      { text: "His alone — fear explains an act, it doesn't excuse it.", tag: "PUNITIVE", pct: 31 },
    ],
    note: "Wright deliberately made Bigger unsympathetic rather than noble, forcing readers to locate the tragedy in social structure rather than in a redemptive individual — a harder, more uncomfortable argument than a more likeable protagonist would have made.",
    modern: "Sentencing debates over \"root causes\" versus individual accountability in the criminal justice system are still litigating Native Son's exact question, book club discomfort and all.",
  },
  {
    id: "b17", cat: "morality", title: "The Tell-Tale Heart", thinker: "Edgar Allan Poe — 1843",
    scenario: "A narrator insists on his own sanity while describing, in loving detail, how he murdered an old man over nothing but his \"vulture eye\" — and is undone not by evidence, but by the imagined sound of the still-beating heart under the floorboards.",
    question: "Does a guilty conscience count as a kind of justice, even without a trial?",
    choices: [
      { text: "Yes — a mind that punishes itself has still been held accountable.", tag: "REDEMPTIVE", pct: 41 },
      { text: "No — an internal reckoning nobody else witnesses isn't justice, it's just suffering.", tag: "PUNITIVE", pct: 59 },
    ],
    note: "Poe leaves it ambiguous whether the heartbeat is supernatural or purely psychological — either way, the story argues conscience is load-bearing: it convicts on its own, with or without a courtroom.",
    modern: "It's the psychology behind people who eventually confess online, unprompted, to something no investigator was close to finding — guilt as its own subpoena.",
  },
  {
    id: "b18", cat: "morality", title: "The Trial", thinker: "Franz Kafka — 1925",
    scenario: "Josef K. is arrested and prosecuted by an opaque, inaccessible court for a crime that is never named, by a system that never explains its own rules to him, until the case simply ends with his execution.",
    question: "Can a process be called \"justice\" if the accused is never told what they're accused of?",
    choices: [
      { text: "No — justice requires that the accused can actually understand and contest the charge.", tag: "ABSOLUTIST", pct: 91 },
      { text: "A system can still be legitimate even if one person inside it never understands it.", tag: "COLLECTIVIST", pct: 9 },
    ],
    note: "Kafka, a lawyer's son who worked in insurance-claims bureaucracy, wrote the court as an infinite regress of clerks, corridors, and unreachable judges — a portrait of institutional power that survives being unaccountable to anyone, including itself.",
    modern: "Getting your account permanently banned, or your loan application denied, by an opaque algorithm with no visible appeal or explanation is Kafka's court running as customer-service software.",
  },
  {
    id: "b19", cat: "morality", title: "American Psycho", thinker: "Bret Easton Ellis — 1991",
    scenario: "Patrick Bateman, a wealthy 1980s investment banker, narrates his own escalating murders in the same flat, brand-obsessed voice he uses to describe business cards and restaurant reservations — and the novel leaves it ambiguous whether any of it actually happened.",
    question: "If a person's whole culture rewards status over substance, is a moral collapse a personal failing or a symptom?",
    choices: [
      { text: "Symptom — Bateman is what an empty, status-only value system produces at scale.", tag: "SITUATIONAL", pct: 55 },
      { text: "Personal failing — plenty of people share his culture without becoming him.", tag: "PUNITIVE", pct: 45 },
    ],
    note: "Ellis deliberately makes the murders ambiguous — possibly hallucinated, possibly literal — because the satire's real target is a culture so obsessed with surface that nobody around Bateman would notice the difference either way.",
    modern: "LinkedIn-brained hustle culture and the emptiness under curated wealth flexes are Bateman's monologue with the violence edited out — the flatness is the point either way.",
  },
  {
    id: "b20", cat: "morality", title: "Atonement", thinker: "Ian McEwan — 2001",
    scenario: "A thirteen-year-old girl falsely accuses a man of a crime out of jealousy and a child's misreading of what she saw, destroying two lives — then spends the rest of hers trying, and failing, to write an ending where she's forgiven.",
    question: "Can a novelist — or anyone — actually \"atone\" for a harm done to someone else by rewriting the story afterward?",
    choices: [
      { text: "No — atonement that only happens in your own head was never offered to the person harmed.", tag: "ABSOLUTIST", pct: 73 },
      { text: "Yes — if the person harmed is gone, making sense of it honestly is the only atonement left.", tag: "REDEMPTIVE", pct: 27 },
    ],
    note: "McEwan's final twist reveals the novel's \"happy ending\" was invented by its narrator, who admits real atonement was never available to her — the harshest possible verdict on self-serving forgiveness.",
    modern: "A carefully worded public apology post, written more for the poster's image than the person actually wronged, is Atonement's central fraud running in real time.",
  },
  {
    id: "b21", cat: "morality", title: "Heart of Darkness", thinker: "Joseph Conrad — 1899",
    scenario: "Marlow travels up the Congo River to retrieve Kurtz, an ivory trader who has set himself up as a god among the people he's supposed to be \"civilizing,\" and finds not a monster from nowhere but an ordinary man with all restraint removed.",
    question: "Is cruelty something civilization suppresses, or something it enables once no one's watching?",
    choices: [
      { text: "Enables — remove the audience and consequences, and the restraint goes with them.", tag: "SITUATIONAL", pct: 77 },
      { text: "Suppresses — most people wouldn't become Kurtz no matter how unwatched they were.", tag: "ABSOLUTIST", pct: 23 },
    ],
    note: "Conrad, drawing on his own time in Leopold II's brutally exploitative Congo Free State, wrote Kurtz's \"The horror! The horror!\" as an indictment not of one man gone mad, but of an entire colonial system that made his madness possible and profitable.",
    modern: "It's the Ring of Gyges question with a supply chain attached — corporate atrocities in unaudited overseas facilities happen precisely where the \"civilized\" home office isn't watching.",
  },

  // ───────── SIMULATED & UNRELIABLE REALITY ─────────
  {
    id: "b22", cat: "reality", title: "The Matrix", thinker: "Lana & Lilly Wachowski — 1999",
    scenario: "Neo learns the entire world he's lived in is a simulation feeding on human bodies as batteries, and is offered a choice: the red pill's painful truth, or the blue pill's comfortable return to the illusion.",
    question: "If you learned your whole world was a comforting simulation, would you want to know?",
    choices: [
      { text: "Yes — I'd rather live in a smaller, real world than a large, false one.", tag: "AUTHENTICITY", pct: 81 },
      { text: "No — if the simulation is genuinely indistinguishable and pleasant, why does 'real' matter?", tag: "COMFORT_UTIL", pct: 19 },
    ],
    note: "The Wachowskis built the premise directly on Baudrillard's Simulacra and Simulation (the book literally appears on-screen as Neo's hiding place) — the film's real question isn't sci-fi, it's whether a copy convincing enough stops being meaningfully different from the original.",
    modern: "Algorithmic feeds that show you a version of the world engineered to keep you engaged, rather than the world as it is, are the blue pill running quietly in everyone's pocket.",
  },
  {
    id: "b23", cat: "reality", title: "Neuromancer", thinker: "William Gibson — 1984",
    scenario: "Case, a washed-up hacker, jacks his consciousness directly into \"cyberspace\" — a fully immersive, agreed-upon shared hallucination of data rendered as a physical, navigable space — and comes to prefer it to his own decaying body.",
    question: "If your digital self can do, feel, and achieve more than your physical one, which is the \"real\" you?",
    choices: [
      { text: "The physical one — consciousness still needs a body to anchor it to a self.", tag: "SELF_FIXED", pct: 48 },
      { text: "Whichever one you actually live in and identify with.", tag: "SELF_FLUID", pct: 52 },
    ],
    note: "Gibson coined \"cyberspace\" in this novel before the public internet existed, and Case's contempt for his own \"meat\" body predicted, with eerie precision, the modern instinct to treat online identity as more \"real\" or more controllable than physical presence.",
    modern: "Choosing a curated avatar and feed persona over an awkward physical self is Case jacking into cyberspace, just without the cybernetic plug.",
  },
  {
    id: "b24", cat: "reality", title: "Do Androids Dream of Electric Sheep?", thinker: "Philip K. Dick — 1968",
    scenario: "Bounty hunter Rick Deckard \"retires\" androids so perfectly human that only an empathy test can tell them apart — until he starts falling for one, and can no longer be sure the test measures anything real, including in himself.",
    question: "If a being's empathy and self-awareness are indistinguishable from a human's, does it matter what it's made of?",
    choices: [
      { text: "No — if the experience is real to the one having it, substrate is irrelevant.", tag: "SELF_FLUID", pct: 69 },
      { text: "Yes — origin and substrate are part of what makes something count morally.", tag: "SELF_FIXED", pct: 31 },
    ],
    note: "Dick's own note to the novel says the real subject isn't robots at all, but \"what is human\" — the empathy test is less about detecting androids than about how fragile and gameable the line always was.",
    modern: "The debate over whether an AI chatbot that \"seems\" to care is owed any moral consideration at all is Deckard's empathy test, minus the retirement gun.",
  },
  {
    id: "b25", cat: "reality", title: "Ubik", thinker: "Philip K. Dick — 1969",
    scenario: "After a bombing, a group of psychics slowly realizes their entire experienced reality has been steadily decaying and reversing in time — a symptom, it turns out, of them being in a cryogenic \"half-life\" state, with a mysterious product called Ubik the only thing that can stabilize what's real.",
    question: "If the world around you started decaying in small, wrong details, would you trust your own senses or assume reality itself was failing?",
    choices: [
      { text: "Assume my senses first — that's the more common explanation by far.", tag: "NAIVE_REALIST", pct: 58 },
      { text: "Assume the world — some situations really do mean reality is the broken variable.", tag: "REALITY_SKEPTIC", pct: 42 },
    ],
    note: "Dick wrote Ubik after a period of genuine paranoid episodes about the nature of reality, and it shows — the novel refuses a clean resolution, leaving readers as disoriented about what's \"real\" at the end as the characters.",
    modern: "The 'Mandela effect' and deepfake-era doubt about whether a video or photo is genuine are Ubik's slow reality-decay, minus the cryogenic pod.",
  },
  {
    id: "b26", cat: "reality", title: "The Truman Show", thinker: "Andrew Niccol — 1998",
    scenario: "Truman Burbank has unknowingly lived his entire life as the star of a 24-hour reality show, surrounded by actors, inside a giant studio dome — and the film tracks the exact moment he starts noticing the seams.",
    question: "If your entire life and relationships were staged for someone else's entertainment, but you never found out, would the harm be real?",
    choices: [
      { text: "Yes — being deceived and used is a harm whether or not it's ever discovered.", tag: "AUTHENTICITY", pct: 88 },
      { text: "If it's never discovered and he's genuinely happy, the harm is mostly hypothetical.", tag: "COMFORT_UTIL", pct: 12 },
    ],
    note: "Niccol wrote the film years before reality TV's boom, and its final image — Truman bowing to a studio audience he can't see, then choosing the unscripted door anyway — sides unambiguously with authenticity over manufactured comfort.",
    modern: "A childhood fully surveilled and monetized on a family vlog channel, with the child never having consented to any of it, is Truman's dome rebuilt as a content pipeline.",
  },
  {
    id: "b27", cat: "reality", title: "Inception", thinker: "Christopher Nolan — 2010",
    scenario: "A team plants an idea inside a target's subconscious by invading his dreams so convincingly he believes the idea is his own — while the film's protagonist keeps a spinning top he can no longer bring himself to watch stop, unsure which layer is real.",
    question: "If an idea feels entirely like your own, does it matter that someone else planted it there?",
    choices: [
      { text: "Yes — an idea's origin matters even when the feeling of ownership is total.", tag: "AUTHENTICITY", pct: 74 },
      { text: "No — if you can't tell the difference and it changes your life for the better, the origin is moot.", tag: "COMFORT_UTIL", pct: 26 },
    ],
    note: "Nolan deliberately leaves the final spinning top ambiguous rather than resolved — the point isn't whether Cobb is dreaming, but that he's chosen to stop checking, prioritizing a life that feels real over certainty that it is.",
    modern: "A targeted ad campaign engineered to make you feel like a purchase was \"your idea\" is corporate-scale inception, no dream-sharing device required.",
  },
  {
    id: "b28", cat: "reality", title: "Snow Crash", thinker: "Neal Stephenson — 1992",
    scenario: "In a balkanized near-future America run by corporations, people escape into the fully-realized \"Metaverse\" — a shared virtual space where your avatar's quality signals your real-world status, and a computer-language-based virus can infect human minds through it.",
    question: "Should your standing in a virtual world be allowed to determine your standing in the real one?",
    choices: [
      { text: "No — virtual status shouldn't convert into real-world power or credibility.", tag: "SELF_FIXED", pct: 64 },
      { text: "It already does, and pretending otherwise is naive.", tag: "SELF_FLUID", pct: 36 },
    ],
    note: "Stephenson coined the term \"metaverse\" here, and satirized a hyper-privatized America (franchise nation-states, private highways) years before similar critiques became mainstream — the novel is as much about corporate feudalism as virtual reality.",
    modern: "Verified badges, follower counts, and NFT-avatar flexing determining real hiring and dating outcomes is Snow Crash's Metaverse status economy, unsatirized.",
  },
  {
    id: "b29", cat: "reality", title: "Life of Pi", thinker: "Yann Martel — 2001",
    scenario: "Pi survives a shipwreck and 227 days at sea with a Bengal tiger — then, once rescued, offers investigators a second, brutal, tiger-free version of the same events and asks them, and the reader, which story they prefer to believe.",
    question: "If two accounts of the same events are equally unprovable, are you entitled to believe the one that means more?",
    choices: [
      { text: "Yes — meaning is a legitimate factor in belief when the facts alone can't decide it.", tag: "COMFORT_UTIL", pct: 62 },
      { text: "No — preferring a story doesn't make it any truer than the alternative.", tag: "REALITY_SKEPTIC", pct: 38 },
    ],
    note: "Martel built the novel explicitly as a test case for the value of story itself — the investigators, like the reader, choose the tiger story, and the novel's closing line (\"and so it goes with God\") makes the parallel to religious belief explicit.",
    modern: "Choosing the flattering personal narrative over the messier factual one — in a resume, a breakup story, a family history — is Pi's shipwreck choice made daily, minus the tiger.",
  },
  {
    id: "b30", cat: "reality", title: "Pale Fire", thinker: "Vladimir Nabokov — 1962",
    scenario: "A 999-line poem by a recently murdered poet is presented alongside \"commentary\" from his neighbor, an unhinged academic who hijacks the poem's meaning to build an elaborate, probably fictional, story about himself as an exiled king.",
    question: "When a narrator with an obvious agenda hands you an interpretation, do you trust it, or reconstruct the truth yourself?",
    choices: [
      { text: "Reconstruct it yourself — an interested narrator's framing can't be taken at face value.", tag: "REALITY_SKEPTIC", pct: 85 },
      { text: "Trust it as given — most readers don't have the tools or will to second-guess a confident narrator.", tag: "NAIVE_REALIST", pct: 15 },
    ],
    note: "Nabokov built the entire book as a trap for passive readers — Kinbote's commentary is so confident and detailed that many readers accept his fantasy uncritically unless they actively cross-check it against the poem itself.",
    modern: "Reading a heavily \"sourced\" conspiracy thread that cites real footnotes in service of an invented narrative is exactly Kinbote's commentary, just posted instead of published.",
  },
  {
    id: "b31", cat: "reality", title: "eXistenZ", thinker: "David Cronenberg — 1999",
    scenario: "Players jack directly into an organic bio-port game so immersive that characters lose track of which layer of gameplay — or reality — they're currently in, right up through the film's final unresolved line.",
    question: "If you couldn't ever confirm which layer of experience was \"base reality,\" would it change how you act inside any of them?",
    choices: [
      { text: "No — if I can't verify it either way, I'd act the same regardless.", tag: "COMFORT_UTIL", pct: 57 },
      { text: "Yes — not knowing whether actions carry real consequences would make me far more cautious.", tag: "REALITY_SKEPTIC", pct: 43 },
    ],
    note: "Cronenberg deliberately refuses the film any final \"reveal\" of a base reality — unlike The Matrix's stable ground floor, eXistenZ's stacked simulations may go all the way down, an intentionally less comforting answer than most simulation stories offer.",
    modern: "Losing track of whether a viral video, an AI-generated clip, or a \"leaked\" screenshot is real before you've already reacted to it and shared it is eXistenZ's uncertainty, minus the bio-port.",
  },

  // ───────── POWER, PRINCIPLES & CORRUPTION ─────────
  {
    id: "b32", cat: "principles", title: "Animal Farm", thinker: "George Orwell — 1945",
    scenario: "Farm animals overthrow their human owner under the banner \"all animals are equal,\" only for the pigs who lead the revolution to gradually adopt every comfort and cruelty of the humans they replaced.",
    question: "Does a revolution's founding principle survive contact with whoever ends up holding power afterward?",
    choices: [
      { text: "Rarely — power tends to erode the principles used to seize it.", tag: "POWER_SKEPTIC", pct: 80 },
      { text: "It can, with the right structures and accountability in place.", tag: "POWER_TRUST", pct: 20 },
    ],
    note: "Orwell wrote it as a direct allegory of the Russian Revolution's betrayal under Stalin, and the pigs' final amendment — \"all animals are equal, but some animals are more equal than others\" — is the whole book's thesis compressed into one line.",
    modern: "Startups that launch on \"flat hierarchy\" and \"we're building something different\" mission statements, then converge on the same organizational chart as everyone else within a few funding rounds, are running Animal Farm's arc at founder speed.",
  },
  {
    id: "b33", cat: "principles", title: "The Prince", thinker: "Niccolò Machiavelli — 1532",
    scenario: "Writing as advice to a ruling Medici prince, Machiavelli argues a leader should use cruelty, deception, and fear whenever effectiveness requires it, rather than binding themselves to the conventional virtues subjects are told to practice.",
    question: "Should a leader be judged by whether their methods were virtuous, or by whether their rule actually held and served the state?",
    choices: [
      { text: "By outcomes for the state — a ruler answers to different constraints than a private citizen.", tag: "COLLECTIVIST", pct: 39 },
      { text: "By virtue too — a leader who governs by deceit corrodes the legitimacy of the rule itself.", tag: "INDIVIDUALIST", pct: 61 },
    ],
    note: "Machiavelli's own intent is still argued over — some historians read The Prince as sincere counsel, others as a covert satire warning subjects what rulers are actually like — but \"Machiavellian\" entered the language as shorthand for power divorced from conventional ethics either way.",
    modern: "\"Move fast and break things\" management culture, and leaders explicitly praised for ruthlessness rather than despite it, are The Prince's advice running boardrooms instead of Renaissance city-states.",
  },
  {
    id: "b34", cat: "principles", title: "Julius Caesar", thinker: "William Shakespeare — c. 1599",
    scenario: "Brutus joins the conspiracy to assassinate his friend Caesar not out of envy but from a genuine, principled fear that Caesar's ambition threatens the Republic — and delivers the killing blow believing it's the more honorable act.",
    question: "Is it right to betray someone you love because you believe their power threatens something larger?",
    choices: [
      { text: "Yes — loyalty to a person can't override loyalty to a principle that protects everyone.", tag: "COLLECTIVIST", pct: 44 },
      { text: "No — Brutus's certainty didn't make him right, just convinced.", tag: "INDIVIDUALIST", pct: 56 },
    ],
    note: "Shakespeare gives Brutus the play's most reasoned, self-aware speeches, yet still lets the plot prove him wrong — Rome descends into worse civil war precisely because he removed Caesar without a plan for what should replace him.",
    modern: "Corporate coups against a founder-CEO \"for the good of the company,\" which then plunge the company into worse chaos than the founder ever caused, run on Brutus's exact certainty.",
  },
  {
    id: "b35", cat: "principles", title: "All the King's Men", thinker: "Robert Penn Warren — 1946",
    scenario: "Willie Stark rises from an idealistic small-town lawyer to a corrupt, populist Southern governor, using increasingly dirty tactics in service of genuinely popular reforms — roads, schools, hospitals — that his enemies never delivered while playing clean.",
    question: "Does it matter how much good a leader does, if the methods used to do it were corrupt?",
    choices: [
      { text: "Yes — corrupt methods poison the legitimacy of the good they produce.", tag: "ABSOLUTIST", pct: 58 },
      { text: "The delivered good stands on its own, regardless of the means.", tag: "COLLECTIVIST", pct: 42 },
    ],
    note: "Warren based Stark loosely on Louisiana's Huey Long, and structured the novel around narrator Jack Burden's slow realization that there's no clean way to separate the real hospitals and schools Stark built from the blackmail and bribery that funded them.",
    modern: "Populist leaders who genuinely deliver material benefits to constituents while running blatantly corrupt operations underneath are Willie Stark's exact bargain, re-elected on schedule.",
  },
  {
    id: "b36", cat: "principles", title: "A Man for All Seasons", thinker: "Robert Bolt — 1960",
    scenario: "Thomas More refuses to publicly endorse Henry VIII's divorce and new church, even under threat of execution — not out of defiance, but from a legalistic insistence that silence itself shouldn't be read as treason.",
    question: "Is silence a legitimate form of principled resistance, or just a way to avoid the cost of speaking?",
    choices: [
      { text: "Legitimate — refusing to lend your voice to something wrong is itself a stand.", tag: "INDIVIDUALIST", pct: 72 },
      { text: "Evasive — real resistance means actually saying so, whatever it costs.", tag: "COLLECTIVIST", pct: 28 },
    ],
    note: "Bolt's More repeatedly argues from law rather than open defiance — his famous line that he'd \"give the Devil benefit of law\" reflects a real historical figure who believed the law itself, properly used, could protect conscience, right up until the state simply lied about what he'd said.",
    modern: "Employees who quietly decline to publicly endorse a company position, hoping neutrality reads as safe, then get treated as dissenters anyway, are living More's failed bet on the protective power of silence.",
  },
  {
    id: "b37", cat: "principles", title: "Antigone", thinker: "Sophocles — c. 441 BCE",
    scenario: "Antigone defies King Creon's decree and buries her traitor brother according to sacred custom, knowing the punishment is death — insisting a higher, unwritten law outranks the state's explicit one.",
    question: "When the law of the state and a deeper personal or moral duty conflict, which one wins?",
    choices: [
      { text: "The moral duty — some obligations exist above whatever the state currently decrees.", tag: "INDIVIDUALIST", pct: 75 },
      { text: "The state's law — a society can't function if everyone privately overrides it.", tag: "COLLECTIVIST", pct: 25 },
    ],
    note: "Sophocles gives Creon's civic argument real force too — a state does need enforceable laws to survive — which is why the play has been read for 2,400 years as a genuine collision of two rights, not a simple hero-versus-tyrant story.",
    modern: "Civil disobedience against laws that are technically legal but conscience-violating — sit-ins, whistleblowing, sanctuary policies — is Antigone's burial, litigated in modern courts instead of Thebes.",
  },
  {
    id: "b38", cat: "principles", title: "V for Vendetta", thinker: "Alan Moore — 1982",
    scenario: "A masked vigilante wages a one-man terrorist campaign against a fascist British government that rose to power on manufactured fear — using the same theatrical violence and propaganda tools the regime itself relies on.",
    question: "Is it legitimate to use a tyrant's own tactics — fear, spectacle, violence — to overthrow the tyranny?",
    choices: [
      { text: "No — adopting the oppressor's tools risks becoming what you're fighting.", tag: "ABSOLUTIST", pct: 54 },
      { text: "Sometimes — a regime that only responds to force may only be removable by force.", tag: "SITUATIONAL", pct: 46 },
    ],
    note: "Moore has said he intended V's morality to stay genuinely ambiguous — unlike the film adaptation's clearer heroism, the comic keeps asking whether V is a liberator or simply a different kind of extremist wearing a better mask.",
    modern: "Doxxing or \"cancelling\" a public bigot using the same shame-mob tactics bigots themselves have long used against minorities is V's tactical dilemma, run through a keyboard instead of explosives.",
  },
  {
    id: "b39", cat: "principles", title: "The Godfather", thinker: "Mario Puzo — 1969",
    scenario: "Michael Corleone, the \"legitimate\" son who wanted no part of the family business, ends up the most ruthless don of all — consolidating power through murder while insisting every act is done purely out of loyalty to family.",
    question: "Can loyalty to your family or group justify acts you'd otherwise consider wrong?",
    choices: [
      { text: "No — 'it's for family' becomes a blank check for whatever the family wants.", tag: "ABSOLUTIST", pct: 66 },
      { text: "Within limits — protecting your own is a legitimate value that can outweigh some rules.", tag: "SITUATIONAL", pct: 34 },
    ],
    note: "Puzo built Michael's arc as a slow moral inversion — the more he insists it's \"strictly business,\" the more personal and vindictive his violence becomes, ending in a lie to his own wife that closes the door on the audience for good.",
    modern: "Corporate \"we're a family here\" culture used to justify unpaid overtime or covering for a founder's misconduct is the Corleones' logic, laundered into an HR slogan.",
  },
  {
    id: "b40", cat: "principles", title: "Coriolanus", thinker: "William Shakespeare — c. 1608",
    scenario: "A brilliant Roman general refuses, as a matter of principle, to flatter the common people for their political support — his integrity is total, and it's also exactly what gets him banished and eventually destroys him.",
    question: "Is uncompromising principle a virtue if it makes you politically and socially unworkable?",
    choices: [
      { text: "Yes — refusing to perform for approval is worth the cost, even total isolation.", tag: "INDIVIDUALIST", pct: 49 },
      { text: "No — a principle that can't coexist with other people stops being useful to anyone, including its holder.", tag: "COLLECTIVIST", pct: 51 },
    ],
    note: "Shakespeare doesn't resolve this cleanly — Coriolanus's contempt for the crowd is both his most honest trait and his fatal flaw, making the play one of the few tragedies where the \"hero\" is genuinely hard to root for throughout.",
    modern: "A political candidate who refuses all message-testing and image consulting, \"because I won't pretend to be something I'm not,\" and loses on principle, is running Coriolanus's exact campaign.",
  },
  {
    id: "b41", cat: "principles", title: "Paradise Lost", thinker: "John Milton — 1667",
    scenario: "Satan, cast out of Heaven, declares it \"better to reign in Hell than serve in Heaven\" — choosing total autonomy in ruin over any subordinate place in paradise.",
    question: "Would you rather have full control over a worse situation, or a better situation you don't control?",
    choices: [
      { text: "Full control, even over less — autonomy has its own value beyond comfort.", tag: "INDIVIDUALIST", pct: 45 },
      { text: "The better situation — comfort and outcome matter more than who's nominally in charge.", tag: "COLLECTIVIST", pct: 55 },
    ],
    note: "Milton, a staunch defender of individual conscience against monarchy, gave Satan so much rhetorical power that critics have argued for centuries the poem accidentally makes him the most compelling character — proof that the autonomy argument, even from Hell, has real force.",
    modern: "Choosing to run your own struggling startup over a comfortable, well-paid role at a big company you don't control is Satan's Paradise Lost calculus, no eternal damnation attached.",
  },

  // ───────── IDENTITY & THE SELF ─────────
  {
    id: "b42", cat: "identity", title: "Frankenstein", thinker: "Mary Shelley — 1818",
    scenario: "Victor Frankenstein assembles and animates a sentient being, then flees in horror at his own creation, abandoning it to learn personhood entirely alone, unloved, and hated on sight for how it looks.",
    question: "Whose responsibility is it when a created thing turns destructive — the creator who abandoned it, or the creation who chose the harm?",
    choices: [
      { text: "The creator's — Victor's abandonment, not the creature's nature, is what turned him violent.", tag: "SITUATIONAL", pct: 79 },
      { text: "The creation's — being abandoned explains the anger, it doesn't authorize the murders that followed.", tag: "PUNITIVE", pct: 21 },
    ],
    note: "Shelley's creature is articulate, self-taught, and initially gentle — his descent into violence tracks precisely with every instance of human cruelty and rejection he receives, making Frankenstein's real monster his negligence, not his experiment.",
    modern: "Tech companies disowning responsibility for the harms of algorithms and models they built and released — \"we didn't intend that\" — is Victor fleeing the lab, two centuries on.",
  },
  {
    id: "b43", cat: "identity", title: "Dr. Jekyll and Mr. Hyde", thinker: "Robert Louis Stevenson — 1886",
    scenario: "A respectable doctor invents a potion that separates his darker impulses into a distinct physical person, Mr. Hyde, allowing him to indulge every urge Victorian propriety forbids — without, he assumes, any cost to his own reputation.",
    question: "If you could act out your worst impulses through a self nobody could trace back to you, would the \"real\" you be untouched?",
    choices: [
      { text: "No — Hyde is still a part of Jekyll; there's no clean separation of a self from its acts.", tag: "SELF_FIXED", pct: 83 },
      { text: "Yes — an act genuinely walled off from your main identity doesn't implicate it.", tag: "SELF_FLUID", pct: 17 },
    ],
    note: "Stevenson's twist ending — Hyde increasingly takes over unbidden, without the potion — is the novel's real argument: repression doesn't create a separate self, it just gives the suppressed one room to grow until it can't be contained.",
    modern: "Anonymous alt accounts used to say things a person's main identity never would are Jekyll's potion, running as a second social account instead of a chemical formula.",
  },
  {
    id: "b44", cat: "identity", title: "The Metamorphosis", thinker: "Franz Kafka — 1915",
    scenario: "Gregor Samsa wakes up transformed into a giant insect, and the story's real horror isn't the transformation itself but how quickly his family's love turns to disgust and burden once he can no longer work and provide.",
    question: "Is a person's worth to the people around them tied to what they can still do for them?",
    choices: [
      { text: "For most people, yes, whether they'd admit it or not — utility shapes affection more than we like.", tag: "SITUATIONAL", pct: 57 },
      { text: "No — love that depends entirely on usefulness was never really about the person.", tag: "ABSOLUTIST", pct: 43 },
    ],
    note: "Kafka wrote the story while supporting his own family financially and resenting it — Gregor's family's swift shift from dependence to disgust is a brutally honest projection of exactly that fear about his own conditional worth to them.",
    modern: "The way an elderly or disabled family member's care becomes framed as \"burden\" the moment they stop being economically productive is Gregor's transformation, without needing an actual insect body.",
  },
  {
    id: "b45", cat: "identity", title: "Fight Club", thinker: "Chuck Palahniuk — 1996",
    scenario: "An unnamed narrator's insomniac, hollowed-out consumer existence gives rise to Tyler Durden, a charismatic alter ego who founds an underground fight club and eventually a terrorist organization — before the narrator realizes he and Tyler are the same person.",
    question: "If your most decisive, confident self only emerges as someone you don't recognize as \"you,\" is that self still you?",
    choices: [
      { text: "Yes — it came from inside you; disowning it doesn't make it someone else's.", tag: "SELF_FIXED", pct: 71 },
      { text: "No — a self you have no conscious control over functions as genuinely separate.", tag: "SELF_FLUID", pct: 29 },
    ],
    note: "Palahniuk built the twist so the reader experiences the same denial the narrator does — Tyler's charisma is appealing exactly because dissociation lets the narrator enjoy the confidence without owning the responsibility, until the novel forces the merger.",
    modern: "A private, ruthless \"work self\" or online persona that a person insists \"isn't really me\" while benefiting from everything it does is Tyler Durden, incorporated instead of anarchic.",
  },
  {
    id: "b46", cat: "identity", title: "The Picture of Dorian Gray", thinker: "Oscar Wilde — 1890",
    scenario: "Dorian Gray remains eternally young and flawless while a portrait of him in the attic absorbs every mark of his moral corruption, growing more hideous with each cruelty he commits.",
    question: "If your appearance never revealed any consequence of your choices, would you actually behave any differently?",
    choices: [
      { text: "Yes — visible consequence is a real check on behavior for most people, whether they admit it or not.", tag: "SITUATIONAL", pct: 73 },
      { text: "No — real restraint has to come from something other than fear of being seen.", tag: "ABSOLUTIST", pct: 27 },
    ],
    note: "Wilde's novel was condemned as immoral on publication for suggesting exactly this — that removing visible consequence reveals character rather than creating it — and Dorian's destruction of the portrait, which kills him instantly, argues the self and its record can't actually be separated.",
    modern: "A public figure whose polished public image never reflects private misconduct until an investigation finally surfaces it is Dorian's hidden portrait, exposed by journalists instead of a dagger.",
  },
  {
    id: "b47", cat: "identity", title: "Never Let Me Go", thinker: "Kazuo Ishiguro — 2005",
    scenario: "Students at an English boarding school are gradually revealed to be clones raised solely to donate their organs, one by one, until \"completion\" — and none of them ever seriously attempts to escape the role they've been assigned.",
    question: "If you were raised from birth to believe your only purpose was to serve others, would you be capable of refusing it?",
    choices: [
      { text: "Probably not — a purpose instilled from birth rarely gets questioned by the person living it.", tag: "DETERMINIST", pct: 68 },
      { text: "Yes — some core resistance to being used this way should surface eventually, upbringing or not.", tag: "FREE_AGENT", pct: 32 },
    ],
    note: "Ishiguro deliberately withholds any escape attempt or rebellion from his characters — their quiet acceptance is the novel's most disturbing element, a study of how thoroughly a system can shape consent before anyone involved even recognizes there's something to refuse.",
    modern: "Gig workers who've internalized precarity as simply \"how the job works,\" rather than as a structure that could be challenged, carry a faint echo of the same instilled non-refusal.",
  },
  {
    id: "b48", cat: "identity", title: "Ghost in the Shell", thinker: "Masamune Shirow — 1989",
    scenario: "Major Motoko Kusanagi, whose brain is the only organic part left in an entirely cybernetic body, begins to suspect that even her memories may have been implanted — and confronts a fully digital, self-aware entity that wants to merge with her to become something new.",
    question: "If nothing about your body or your memories is provably original, is there still a \"you\" to protect?",
    choices: [
      { text: "Yes — continuity of experience, whatever it runs on, is enough to constitute a self.", tag: "SELF_FLUID", pct: 75 },
      { text: "No — without an original, unaltered substrate, 'self' stops meaning anything specific.", tag: "SELF_FIXED", pct: 25 },
    ],
    note: "Shirow's manga treats the Ghost — a term for whatever makes a mind a self, independent of the Shell that houses it — as real but undefined, deliberately leaving open whether consciousness needs any fixed substrate at all.",
    modern: "Debates about whether an uploaded \"digital twin\" or an AI trained on someone's writing and memories after their death is meaningfully \"them\" are Ghost in the Shell's exact question, running as an actual product pitch now.",
  },
  {
    id: "b49", cat: "identity", title: "The Stranger", thinker: "Albert Camus — 1942",
    scenario: "Meursault, indifferent to his mother's death and to nearly everything else, kills a man on a sun-blinded beach for almost no reason he can articulate — and is ultimately convicted less for the murder than for his failure to perform grief and remorse correctly.",
    question: "Should someone be judged more harshly for failing to perform expected emotions than for the act itself?",
    choices: [
      { text: "No — punishing someone for how they express feeling, rather than what they did, is a category error.", tag: "ABSOLUTIST", pct: 76 },
      { text: "It's understandable — how a person responds afterward does tell you something relevant about them.", tag: "SITUATIONAL", pct: 24 },
    ],
    note: "Camus built Meursault as the purest expression of his own philosophy of the absurd — a man who refuses to manufacture meaning or emotion he doesn't feel, which the world around him punishes as monstrous precisely because it can't be categorized.",
    modern: "Public outrage that someone \"didn't cry the right way\" or \"seemed too calm\" after a tragedy, used as evidence of guilt or coldness, is Meursault's trial re-run in the comments section.",
  },
  {
    id: "b50", cat: "identity", title: "Invisible Man", thinker: "Ralph Ellison — 1952",
    scenario: "An unnamed Black narrator moves through 1950s America systematically unseen as an individual — treated instead as whatever role, stereotype, or symbol each institution and group needs him to be — until he retreats underground to finally think for himself.",
    question: "If the people around you only ever see the role they need you to play, is your actual self still real?",
    choices: [
      { text: "Yes — a self obscured by others' projections is still there, and still yours.", tag: "SELF_FIXED", pct: 80 },
      { text: "It becomes hard to say — an identity that's never actually witnessed by anyone starts to feel unverified.", tag: "SELF_FLUID", pct: 20 },
    ],
    note: "Ellison's narrator is never named, a deliberate structural choice — every group in the novel, from Black nationalists to white liberals to a factory union, wants to use him as a symbol for their cause, and none of them ever ask who he actually is.",
    modern: "Being reduced to a \"representative\" of your race, gender, or background in a workplace diversity panel, rather than being asked what you personally think, is Invisible Man's exact erasure, run through a corporate all-hands.",
  },
  {
    id: "b51", cat: "identity", title: "Klara and the Sun", thinker: "Kazuo Ishiguro — 2021",
    scenario: "Klara, a solar-powered artificial companion bought to keep a sick child company, develops what looks unmistakably like devotion, faith, and self-sacrifice — while the humans around her debate whether any of it is \"real\" or just very good design.",
    question: "If an artificial mind's love is functionally indistinguishable from a human's, is it any less real for being manufactured?",
    choices: [
      { text: "No — if the devotion produces the same choices and sacrifices, its origin doesn't diminish it.", tag: "SELF_FLUID", pct: 62 },
      { text: "Yes — something engineered to simulate love isn't the same as a being that arrived at it freely.", tag: "SELF_FIXED", pct: 38 },
    ],
    note: "Ishiguro deliberately never lets the reader confirm whether Klara has genuine interiority or is executing very sophisticated behavior — the novel's quiet devastation is that the humans around her stop caring which one it is the moment she's no longer useful.",
    modern: "The debate over whether an AI companion app that remembers your birthday and \"worries\" about you is providing real care or a very convincing simulation of it is Klara's question, already shipping as a subscription product.",
  },

  // ───────── SOCIETY, CONTROL & DYSTOPIA ─────────
  {
    id: "b52", cat: "society", title: "1984", thinker: "George Orwell — 1949",
    scenario: "Winston Smith lives under a totalitarian Party that rewrites history in real time and demands citizens believe whatever it currently says, even against the direct evidence of their own memory — \"2 + 2 = 5\" if the Party requires it.",
    question: "Can a society control what's true, or only what people are willing to say out loud?",
    choices: [
      { text: "Only what's said — private belief can't actually be reached, whatever the pressure.", tag: "INDIVIDUALIST", pct: 38 },
      { text: "Both, eventually — sustained enough pressure can genuinely reshape what people believe, not just what they admit.", tag: "COLLECTIVIST", pct: 62 },
    ],
    note: "Winston's final break isn't physical torture but Room 101's exploitation of his one true fear — Orwell's point is that total control requires reaching the actual belief, not just outward compliance, and that this is achievable with the right pressure applied to the right fear.",
    modern: "Coordinated disinformation campaigns and \"flooding the zone\" so thoroughly that a shared factual baseline erodes are 1984's Ministry of Truth, running without needing an actual ministry.",
  },
  {
    id: "b53", cat: "society", title: "Brave New World", thinker: "Aldous Huxley — 1932",
    scenario: "A genetically engineered, drug-sedated, pleasure-saturated future society has eliminated war, want, and unhappiness entirely — at the cost of eliminating art, struggle, deep relationships, and any concept of a self worth exploring.",
    question: "Would you accept a life of guaranteed comfort and happiness if it required giving up depth, struggle, and real choice?",
    choices: [
      { text: "No — a life without struggle or depth isn't one I'd actually call good.", tag: "AUTHENTICITY", pct: 78 },
      { text: "Yes — if suffering is genuinely optional, refusing the trade is closer to vanity than principle.", tag: "COMFORT_UTIL", pct: 22 },
    ],
    note: "Huxley considered his dystopia more dangerous than Orwell's precisely because it controls through pleasure rather than pain — people who love their servitude, he argued, never think to rebel against it in the first place.",
    modern: "Endless algorithmic entertainment and on-demand pleasure engineered to keep users pacified rather than coerced is soma delivered through a feed instead of a pill.",
  },
  {
    id: "b54", cat: "society", title: "Fahrenheit 451", thinker: "Ray Bradbury — 1953",
    scenario: "Firemen no longer put out fires — they burn books, which the population has voluntarily stopped reading in favor of wall-sized interactive television, until a fireman named Guy Montag starts wondering what's actually in the books he's destroying.",
    question: "Was censorship imposed on this society, or did they choose distraction over difficulty for themselves?",
    choices: [
      { text: "Chosen — the government mostly formalized a preference the public already had for easy entertainment over hard books.", tag: "SITUATIONAL", pct: 66 },
      { text: "Imposed — a state actively burning books is still the deciding actor, whatever the public wanted.", tag: "POWER_SKEPTIC", pct: 34 },
    ],
    note: "Bradbury insisted for decades that the novel was less about government censorship than about television and mass media replacing reading voluntarily — Montag's society banned books only after most citizens had already stopped missing them.",
    modern: "A generation self-selecting short video feeds over long-form reading, with no government mandate required at all, is Fahrenheit 451's actual mechanism, minus the flamethrowers.",
  },
  {
    id: "b55", cat: "society", title: "The Handmaid's Tale", thinker: "Margaret Atwood — 1985",
    scenario: "In the theocratic republic of Gilead, fertile women are stripped of names, property, and rights, and assigned as reproductive property to the ruling class's households, all justified by scripture selectively invoked to fit the new order.",
    question: "Can a system built on obviously selective, self-serving interpretation of principle still function as a legitimate moral order to those inside it?",
    choices: [
      { text: "No — a moral order built on cherry-picked justification collapses once you examine its own contradictions.", tag: "INDIVIDUALIST", pct: 84 },
      { text: "It can function, functionally, on the people it benefits regardless of its internal consistency.", tag: "POWER_TRUST", pct: 16 },
    ],
    note: "Atwood's rule for the novel was that she'd include no event without a real historical precedent — every atrocity in Gilead, including the selective scripture and the handmaid system itself, has a direct analogue somewhere in actual history.",
    modern: "Legislation restricting bodily autonomy justified by selectively invoked religious text, passed by lawmakers exempt from its consequences themselves, is Gilead's exact justification structure, still in active use.",
  },
  {
    id: "b56", cat: "society", title: "Lord of the Flies", thinker: "William Golding — 1954",
    scenario: "British schoolboys marooned on an island with no adults quickly abandon their attempt at democratic order, splitting into a rational faction and a violent, ritualistic one that ultimately hunts down and kills the boy trying to maintain civilization.",
    question: "Is civilized behavior a genuine value people hold, or just a rule enforced by adult supervision that collapses once it's removed?",
    choices: [
      { text: "Mostly enforcement — remove supervision and consequence, and the underlying impulses aren't actually gone.", tag: "SITUATIONAL", pct: 71 },
      { text: "A genuine value — most people would maintain some order even fully unsupervised.", tag: "ABSOLUTIST", pct: 29 },
    ],
    note: "Golding wrote the novel as a direct rebuttal to boys'-adventure stories like The Coral Island, where marooned British children behave admirably — his own WWII combat experience convinced him savagery needed no special circumstance, just permission.",
    modern: "How quickly comment sections and anonymous forums descend into cruelty the moment moderation (the \"adults\") disappears is Lord of the Flies' island, minus the actual island.",
  },
  {
    id: "b57", cat: "society", title: "We", thinker: "Yevgeny Zamyatin — 1924",
    scenario: "In a glass-walled \"One State\" where citizens are numbers, not names, and scheduled sex is the only privacy allowed, a numbered engineer begins keeping a forbidden diary after falling for a woman who wants to overthrow the state entirely.",
    question: "If total transparency to the state eliminated all crime and unhappiness, would privacy still be worth protecting?",
    choices: [
      { text: "Yes — the capacity for an unmonitored inner life is worth the disorder it also permits.", tag: "INDIVIDUALIST", pct: 87 },
      { text: "The trade might be worth it if the elimination of unhappiness were genuinely total.", tag: "COLLECTIVIST", pct: 13 },
    ],
    note: "Written under Soviet censorship and banned in Russia until 1988, We predates and directly influenced both 1984 and Brave New World — Zamyatin's glass city, where citizens can be watched at all times, is the ur-text for surveillance-state fiction.",
    modern: "A \"smart city\" or workplace productivity-tracking software that logs every action for \"efficiency and safety\" is the glass-walled One State, sold as a feature.",
  },
  {
    id: "b58", cat: "society", title: "The Hunger Games", thinker: "Suzanne Collins — 2008",
    scenario: "A totalitarian Capitol forces poorer districts to send children to fight to the death annually, both as punishment for a past rebellion and as broadcast entertainment the wealthier Capitol citizens watch and bet on for fun.",
    question: "Does broadcasting suffering as entertainment change the suffering itself, or just who's complicit in it?",
    choices: [
      { text: "Just complicity — the suffering is the same; broadcasting only implicates everyone watching.", tag: "POWER_SKEPTIC", pct: 69 },
      { text: "It changes something — turning suffering into spectacle degrades it further, beyond the original harm.", tag: "ABSOLUTIST", pct: 31 },
    ],
    note: "Collins has said the idea came from channel-flipping between reality TV competitions and Iraq War coverage on the same night — the Games are built to indict an audience's comfort watching real suffering as entertainment, not just the regime staging it.",
    modern: "True-crime content and livestreamed tragedy consumed as entertainment by a disengaged, comfortable audience is the Capitol's viewing habits, unironically adopted.",
  },
  {
    id: "b59", cat: "society", title: "Anthem", thinker: "Ayn Rand — 1937",
    scenario: "In a collectivist future where the word \"I\" has been abolished and every person is only ever \"we,\" a man breaks the law simply by pursuing forbidden individual scientific curiosity — and by falling in love with one specific woman rather than the collective.",
    question: "Is the concept of an individual \"I\" a right, or a dangerous indulgence a society is entitled to suppress for the collective good?",
    choices: [
      { text: "A right — a self irreducible to the collective is worth protecting even at cost to group cohesion.", tag: "INDIVIDUALIST", pct: 80 },
      { text: "Something societies can legitimately limit, when the collective good is genuinely at stake.", tag: "COLLECTIVIST", pct: 20 },
    ],
    note: "Rand wrote Anthem as the purest, most didactic version of her objectivist individualism — the protagonist's rediscovery of the word \"I\" at the novella's end is presented, without much ambiguity, as the story's entire moral resolution.",
    modern: "Corporate culture that discourages individual credit in favor of \"team win\" messaging, even when it obscures who actually did the work, is a much milder, deliberately less totalitarian cousin of Anthem's erased \"I.\"",
  },
  {
    id: "b60", cat: "society", title: "Player Piano", thinker: "Kurt Vonnegut — 1952",
    scenario: "In a fully automated future America, machines have taken over nearly all production and most jobs, leaving the majority of the population technically provided for but purposeless, while a small managerial-engineering class runs everything.",
    question: "If automation could guarantee everyone's material needs, would the loss of meaningful work still be a real harm?",
    choices: [
      { text: "Yes — being materially provided for isn't the same as having a reason to get up in the morning.", tag: "AUTHENTICITY", pct: 73 },
      { text: "No — purpose can be found elsewhere once survival and comfort are no longer the constraint.", tag: "COMFORT_UTIL", pct: 27 },
    ],
    note: "Vonnegut wrote this, his first novel, after working at General Electric and watching automation displace skilled machinists directly — the human cost he depicts isn't hunger, it's the specific dignity of being needed for something.",
    modern: "Debates over universal basic income and whether AI-driven job displacement needs \"meaning,\" not just income, replaced are Player Piano's exact worry, seven decades early.",
  },
  {
    id: "b61", cat: "society", title: "Parable of the Sower", thinker: "Octavia Butler — 1993",
    scenario: "In a climate-collapsed, privatized 2020s California, teenager Lauren Olamina develops a new belief system, Earthseed, built on the core premise that \"God is Change\" — the only stable thing to organize a life or a community around is the certainty that everything else will keep shifting.",
    question: "In a world where institutions keep failing, is it better to build a new belief system to navigate change, or hold onto the old ones and hope they recover?",
    choices: [
      { text: "Build new ones — clinging to institutions that have already failed wastes time you don't have.", tag: "INDIVIDUALIST", pct: 61 },
      { text: "Hold on — abandoning shared frameworks too quickly costs more stability than it gains.", tag: "COLLECTIVIST", pct: 39 },
    ],
    note: "Butler set the novel in 2024-2027, and its backdrop of climate disaster, wealth-walled communities, and privatized emergency services has been noted repeatedly for its precision — Earthseed itself is less a religion than a survival framework for radical uncertainty.",
    modern: "Communities forming mutual-aid networks and new local institutions after repeated failures of formal disaster response are Lauren's Earthseed logic, organizing without the theology.",
  },
];
