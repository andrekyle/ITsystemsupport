// Shared slide content for the four US 114051 deck sets — one deck per
// Specific Outcome, mirroring how US 114050 ships four lesson decks.
// Consumed by make-114051-ppt.mjs (PPTX) and make-114051-pdf.ts (PDF).

/** @typedef {{icon:string,text:string,d?:string}} CardItem */

export const UNIT_FOOT = "US 114051 · Conduct a technical practitioners meeting · NQF 5 · 4 credits";

export const DECKS = [
  /* ================================================================
     DECK 1 — SO 1 · Knowledge of technical practitioners meetings
     ================================================================ */
  {
    file: "US-114051-L1-Knowledge-of-Meetings",
    deckName: "SO 1 — Knowledge of Technical Meetings",
    title: "US 114051 — Knowledge of Technical Practitioners Meetings",
    slides: [
      {
        type: "cover",
        pill: "US 114051 · SO 1 · NQF LEVEL 5 · 4 CREDITS",
        title: "Knowledge of Technical Practitioners Meetings",
        subtitle: "Meeting types and their uses, leadership styles, decision-making processes and the conventions that keep meetings fair",
        icon: "people",
        meta: [
          ["TIME", "90-minute lessons · Self & Group"],
          ["SESSION", "Friday, 4 Sep 2026 · 09h00 – 14h00"],
          ["MODULE", "Module 1 · Personal Development"],
          ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Specific outcome 1 & assessment criteria",
        title: "What you must be able to demonstrate",
        intro: "Demonstrate knowledge of different types of technical practitioners meetings. You will be assessed against these criteria:",
        cols: 3,
        rowH: 2.15,
        y: 2.1,
        items: [
          { icon: "briefcase", text: "Meeting types & uses", d: "Contract meetings, technical review meetings and project review meetings." },
          { icon: "people", text: "Leadership styles", d: "Democratic, autocratic and facilitative meeting procedures." },
          { icon: "check", text: "Decision-making processes", d: "Voting, consensus, criteria-based rating, ranking, paired comparisons." },
          { icon: "pen", text: "Meeting conventions", d: "Moving, seconding, amending and voting procedures." },
          { icon: "book", text: "The note taker", d: "Why the note taker requires a technical background." },
          { icon: "target", text: "Why it matters", d: "Meetings are where technical teams decide, plan and stay accountable." },
        ],
      },
      {
        type: "bullets",
        eyebrow: "Introduction",
        title: "Why technical practitioners meet",
        y: 1.8,
        items: [
          "Meetings are very important for the work of any organisation — they are where the technical team decides, plans and holds itself accountable.",
          "Good meetings support collective decision-making, planning and follow-up, accountability and democracy.",
          "The principal activities of a technical committee are the development and maintenance of its standards, technical reports and data files.",
          "A badly run meeting wastes the scarcest resource a technical team has — its practitioners' time.",
        ],
        callout: { icon: "check", text: "By the end of this unit you will have prepared, chaired and minuted a technical practitioners meeting yourself — that is the evidence in your logbook." },
      },
      {
        type: "cards",
        eyebrow: "Types of technical practitioners meetings",
        title: "Three meetings you must know",
        intro: "Organisations hold many kinds of meetings — general members, special, executive, AGMs. For technical practitioners, three types matter most:",
        cols: 3,
        rowH: 2.9,
        y: 2.2,
        items: [
          { icon: "briefcase", text: "Contract meetings", d: "Discuss, review and manage contractual obligations and deliverables related to technical projects or services." },
          { icon: "search", text: "Technical review meetings", d: "Evaluate technical solutions, designs and implementations, and resolve technical issues and problems." },
          { icon: "chart", text: "Project review meetings", d: "Assess project progress, timelines, resource allocation and project deliverables." },
        ],
      },
      {
        type: "table",
        eyebrow: "Types of technical practitioners meetings",
        title: "Which meeting, when?",
        header: ["Meeting", "Typical use", "Example"],
        colW: [3.0, 5.0, 4.23],
        rowH: 0.62,
        y: 1.95,
        rows: [
          ["Contract meeting", "Negotiate or review a contract, SLA or deliverable with a client or supplier", "Quarterly SLA review with the support vendor"],
          ["Technical review", "Evaluate a design, system or implementation against requirements and standards", "Design review before a network upgrade"],
          ["Project review", "Track progress, risks, resources and milestones on a running project", "Month-end review of the LAN rollout project"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Leadership styles",
        title: "Who decides — the chair, the group, or both?",
        intro: "Three main leadership styles are used in meeting procedures. Choose the style that fits the meeting's purpose:",
        cols: 3,
        rowH: 3.0,
        y: 2.05,
        items: [
          { icon: "people", text: "Democratic", d: "Appointed or nominated delegates all have a voice and participate in decision-making — the chair guides the process, the group decides." },
          { icon: "person", text: "Autocratic", d: "The chairperson runs the entire meeting and gives most of the input; attendees contribute only when instructed. Fast — use with care." },
          { icon: "chat", text: "Facilitative", d: "A group effort: the facilitator ensures all members actively participate to reach the outcome, guiding while staying neutral." },
        ],
      },
      {
        type: "table",
        eyebrow: "Leadership styles",
        title: "Matching the style to the meeting",
        header: ["Style", "Who decides", "Best when"],
        colW: [2.6, 4.4, 5.23],
        rowH: 0.62,
        y: 1.95,
        rows: [
          ["Democratic", "The members, by discussion and vote", "Decisions need buy-in from every department or area represented"],
          ["Autocratic", "The chairperson", "Time is critical, or one accountable owner must direct the outcome"],
          ["Facilitative", "The group, guided by a neutral facilitator", "Ideas and problem-solving matter more than a formal ruling"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Decision-making processes",
        title: "Five ways meetings reach a decision",
        cols: 3,
        rowH: 2.3,
        y: 1.75,
        items: [
          { icon: "check", text: "Voting", d: "Show of hands or ballot; the most votes wins — simple majority (50% + 1) or supermajority." },
          { icon: "people", text: "Consensus", d: "Discussion and compromise continue until every member can accept the decision." },
          { icon: "chart", text: "Criteria-based rating", d: "Rate each option against predetermined criteria; the best total score wins." },
          { icon: "layers", text: "Ranking", d: "Rank options best to worst; scores per position are totalled across participants." },
          { icon: "design", text: "Paired comparisons", d: "Compare options two at a time; the option preferred most often is selected." },
          { icon: "target", text: "Match the process", d: "Pick the process that fits the decision's importance, urgency and need for buy-in." },
        ],
      },
      {
        type: "cards",
        eyebrow: "Meeting conventions & procedures",
        title: "Order, fairness and effective decisions",
        cols: 2,
        rowH: 1.95,
        y: 1.7,
        items: [
          { icon: "pen", text: "Moving", d: "Formally propose a motion for the meeting to consider." },
          { icon: "person", text: "Seconding", d: "A second member supports the motion — unseconded motions fall away." },
          { icon: "document", text: "Amending", d: "Modify the motion before the vote; amendments are voted on first." },
          { icon: "check", text: "Voting procedures", d: "Show of hands, ballot or poll — counted and recorded by the chair." },
        ],
        callout: { icon: "book", text: "The note taker needs a technical background — minutes must capture the terminology, decisions and reasons accurately." },
      },
      {
        type: "cards",
        eyebrow: "Now prove it",
        title: "Your work for Specific Outcome 1",
        cols: 3,
        rowH: 2.9,
        y: 2.0,
        items: [
          { icon: "chat", text: "Questioning session", d: "\u201cTypes of meetings, leadership styles and decision processes\u201d — typed answers, AI-marked." },
          { icon: "dashboard", text: "Quizzes 1 & 2", d: "Meeting types & leadership styles · decision-making & conventions. 80%+ is competent." },
          { icon: "book", text: "Gate quizzes", d: "Answer each lesson's gate quiz as you work through lessons 1\u20135 on the Lesson tab." },
        ],
      },
      {
        type: "closing",
        icon: "people",
        quote: "Know the meeting before you run the meeting.",
        text: "Contract, technical review and project review meetings » democratic, autocratic and facilitative styles » five decision processes » the conventions that keep it fair — the knowledge every chairperson stands on.",
      },
    ],
  },

  /* ================================================================
     DECK 2 — SO 2 · Prepare for a technical practitioners meeting
     ================================================================ */
  {
    file: "US-114051-L2-Preparing-the-Meeting",
    deckName: "SO 2 — Preparing the Meeting",
    title: "US 114051 — Preparing for a Technical Practitioners Meeting",
    slides: [
      {
        type: "cover",
        pill: "US 114051 · SO 2 · NQF LEVEL 5 · 4 CREDITS",
        title: "Preparing for a Technical Practitioners Meeting",
        subtitle: "Venue, facilities, technology and supporting information — with documented outcomes, timeous invitations and a distributed agenda",
        icon: "calendar",
        meta: [
          ["TIME", "90-minute lesson · Self & Group"],
          ["SESSION", "Friday, 11 Sep 2026 · 09h00 – 14h00"],
          ["MODULE", "Module 1 · Personal Development"],
          ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Specific outcome 2 & assessment criteria",
        title: "What you must be able to do",
        intro: "Prepare for a technical practitioners meeting. You will be assessed against these criteria:",
        cols: 2,
        rowH: 2.2,
        y: 2.1,
        items: [
          { icon: "globe", text: "Physical arrangements", d: "Venue, facilities, technology and supporting information are in place." },
          { icon: "target", text: "Documented outcomes", d: "The intended outcomes of the meeting are clear, concise and well documented." },
          { icon: "calendar", text: "Timeous invitations", d: "Participants are invited early enough to prepare and attend." },
          { icon: "pen", text: "Agenda distributed", d: "The agenda and supporting documentation are completed and distributed." },
        ],
      },
      {
        type: "cards",
        eyebrow: "Prepare the meeting",
        title: "Physical arrangements — nothing left to chance",
        intro: "Preparation is where a meeting is won. Four arrangements must be in place before anyone walks in:",
        cols: 2,
        rowH: 2.15,
        y: 2.0,
        items: [
          { icon: "globe", text: "Venue", d: "Booked, accessible and set up for the meeting style — seating that lets practitioners face each other." },
          { icon: "folder", text: "Facilities", d: "Whiteboards, flip charts, stationery, refreshments — everything the discussion will need." },
          { icon: "dashboard", text: "Technology", d: "Projector, video conferencing, network access — prepared and tested before the meeting starts." },
          { icon: "document", text: "Supporting information", d: "Reports, designs and data the discussion depends on — available to every participant." },
        ],
      },
      {
        type: "twocol",
        eyebrow: "Prepare the meeting",
        title: "Outcomes and invitations",
        left: {
          label: "DOCUMENT THE OUTCOMES",
          items: [
            "Intended outcomes are clear, concise and well documented",
            "The agenda is built around the outcomes",
            "Participants know what the meeting must achieve",
            "Afterwards, success is measured against the outcomes",
          ],
        },
        right: {
          label: "INVITE TIMEOUSLY",
          items: [
            "Participants get time to prepare and study the documentation",
            "Schedules can be arranged so the right people attend",
            "Include date, time, venue and the meeting's purpose",
            "Confirm attendance and arrange stand-ins where needed",
          ],
        },
      },
      {
        type: "table",
        eyebrow: "Prepare the meeting",
        title: "The agenda — the meeting's roadmap",
        intro: "Complete the agenda and distribute it with the supporting documentation before the meeting.",
        header: ["Agenda element", "What it does"],
        colW: [3.6, 8.63],
        rowH: 0.6,
        y: 2.1,
        rows: [
          ["Purpose & outcomes", "States why the meeting is held and what it must achieve"],
          ["Items in priority order", "Important and urgent topics first — minor items at the end"],
          ["Time per item", "Discussion time allocated according to importance and complexity"],
          ["Supporting documents", "Reports and designs attached so participants arrive prepared"],
          ["Roles", "Chairperson, note taker (with a technical background) and presenters"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Now prove it",
        title: "Your work for Specific Outcome 2",
        cols: 3,
        rowH: 2.9,
        y: 2.0,
        items: [
          { icon: "chat", text: "Questioning session", d: "\u201cPreparing for a technical practitioners meeting\u201d — typed answers, AI-marked." },
          { icon: "dashboard", text: "Quiz 3", d: "Preparing and chairing the meeting. 80%+ is competent." },
          { icon: "folder", text: "Meeting portfolio", d: "Draft the notice, agenda and invitations for the meeting you will chair — logbook evidence." },
        ],
      },
      {
        type: "closing",
        icon: "calendar",
        quote: "A meeting is won before it starts.",
        text: "Venue » facilities » technology » supporting information » documented outcomes » timeous invitations » a distributed agenda — preparation turns meeting time into decision time.",
      },
    ],
  },

  /* ================================================================
     DECK 3 — SO 3 · Chair a technical practitioners meeting
     ================================================================ */
  {
    file: "US-114051-L3-Chairing-the-Meeting",
    deckName: "SO 3 — Chairing the Meeting",
    title: "US 114051 — Chairing a Technical Practitioners Meeting",
    slides: [
      {
        type: "cover",
        pill: "US 114051 · SO 3 · NQF LEVEL 5 · 4 CREDITS",
        title: "Chairing a Technical Practitioners Meeting",
        subtitle: "Rules the members own, conventions applied fairly, a published agenda followed — and clear decisions with timeframes",
        icon: "presenter",
        meta: [
          ["TIME", "90-minute lesson · Self & Group"],
          ["SESSION", "Friday, 11 Sep 2026 · 09h00 – 14h00"],
          ["MODULE", "Module 1 · Personal Development"],
          ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Specific outcome 3 & assessment criteria",
        title: "What you must be able to do",
        intro: "Chair a technical practitioners meeting. You will be assessed against these criteria:",
        cols: 3,
        rowH: 2.15,
        y: 2.1,
        items: [
          { icon: "pen", text: "Establish rules", d: "Rules and guidelines agreed in conjunction with the meeting members." },
          { icon: "check", text: "Apply conventions", d: "The meeting conventions the members agreed are applied consistently." },
          { icon: "document", text: "Follow the agenda", d: "The published agenda is followed item by item." },
          { icon: "people", text: "Enable participation", d: "Active participation by all members; conflict is minimised." },
          { icon: "clock", text: "Prioritise & time-box", d: "Topics prioritised; discussion time allocated per item." },
          { icon: "target", text: "Land clear decisions", d: "Decisions are clear, accurate and include timeframes." },
        ],
      },
      {
        type: "twocol",
        eyebrow: "Chair the meeting",
        title: "Open with rules the members own",
        left: {
          label: "ESTABLISH RULES & GUIDELINES",
          items: [
            "Agree the rules in conjunction with the members at the start",
            "How to get the floor, how long contributions may run",
            "How decisions will be taken — and what is in scope",
            "Agreed rules create buy-in and prevent procedural disputes",
          ],
        },
        right: {
          label: "APPLY THE AGREED CONVENTIONS",
          items: [
            "Run motions through moving, seconding and amending",
            "Follow the published agenda item by item",
            "Park unrelated issues and keep an eye on the clock",
            "Apply the conventions consistently — the same rules for everyone",
          ],
        },
      },
      {
        type: "bullets",
        eyebrow: "Chair the meeting",
        title: "Participation, priorities and decisions",
        y: 1.75,
        items: [
          "Provide for active participation by ALL members — invite quiet members by name, use round-robin turns, acknowledge every contribution.",
          "Keep debate on the issue, not the person — that is how conflict is minimised.",
          "Prioritise topics and allocate discussion time according to importance, urgency and complexity.",
          "Move minor items to the end of the agenda — or carry them over to the next meeting.",
          "Ensure agreed decisions are clear, accurate and include a time frame for action.",
          "Confirm each decision — and who owns it — with the members before moving on.",
        ],
      },
      {
        type: "table",
        eyebrow: "Chair the meeting",
        title: "Managing difficult behaviours",
        header: ["Behaviour", "What the chair does"],
        colW: [3.6, 8.63],
        rowH: 0.62,
        y: 1.75,
        rows: [
          ["The heckler", "Stay calm; acknowledge any valid point and return to the agenda and agreed rules."],
          ["The overly talkative", "Thank them, summarise their point, and invite someone who has not yet spoken."],
          ["The cynic", "Ask for evidence and an alternative — turn the criticism into an agenda item or action."],
          ["The silent member", "Invite their input by name on a topic they know well."],
          ["Conflicting egos", "Keep debate on the issue, not the person; restate the meeting's outcomes."],
          ["Side conversations", "Pause the meeting and draw the conversation back to the floor."],
          ["Factually wrong statements", "Correct tactfully with the facts — or park the point for verification and record it."],
        ],
      },
      {
        type: "cards",
        eyebrow: "Now prove it",
        title: "Your work for Specific Outcome 3",
        cols: 3,
        rowH: 2.9,
        y: 2.0,
        items: [
          { icon: "presenter", text: "Chair a meeting", d: "Role-play practical: chair a 10-minute technical meeting from a scenario card — observed evidence." },
          { icon: "chat", text: "Questioning session", d: "\u201cChairing a technical practitioners meeting\u201d — typed answers, AI-marked." },
          { icon: "dashboard", text: "Quiz 3", d: "Preparing and chairing the meeting. 80%+ is competent." },
        ],
      },
      {
        type: "closing",
        icon: "presenter",
        quote: "Run the meeting — don't let the meeting run you.",
        text: "Rules agreed with the members » conventions applied » the agenda followed » everyone heard » topics prioritised » decisions that are clear, accurate and time-framed.",
      },
    ],
  },

  /* ================================================================
     DECK 4 — SO 4 · Post-meeting follow-up
     ================================================================ */
  {
    file: "US-114051-L4-Post-Meeting-Follow-Up",
    deckName: "SO 4 — Post-Meeting Follow-Up",
    title: "US 114051 — Post-Meeting Follow-Up for a Technical Meeting",
    slides: [
      {
        type: "cover",
        pill: "US 114051 · SO 4 · NQF LEVEL 5 · 4 CREDITS",
        title: "Post-Meeting Follow-Up for a Technical Meeting",
        subtitle: "Accurate minutes in line with organisational policy, decisions communicated on time, and actions summarised and tracked",
        icon: "document",
        meta: [
          ["TIME", "90-minute lesson · Self & Group"],
          ["SESSION", "Friday, 11 Sep 2026 · 09h00 – 14h00"],
          ["MODULE", "Module 1 · Personal Development"],
          ["QUALITY ASSURANCE", "QCTO / MICT SETA"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Specific outcome 4 & assessment criteria",
        title: "What you must be able to do",
        intro: "Conduct post-meeting follow-up for a technical meeting. You will be assessed against these criteria:",
        cols: 3,
        rowH: 2.9,
        y: 2.1,
        items: [
          { icon: "document", text: "Accurate minutes", d: "Minutes are accurately produced and comply with organisational policy." },
          { icon: "chat", text: "Decisions communicated", d: "In the required format and within the required timeframe." },
          { icon: "check", text: "Actions summarised", d: "Summaries of discussions and actions meet the format requirements." },
        ],
      },
      {
        type: "table",
        eyebrow: "Post-meeting follow-up",
        title: "What good minutes contain",
        intro: "Produce the minutes in the organisation's format, check them, and distribute them within the required time.",
        header: ["Section", "Contents"],
        colW: [3.6, 8.63],
        rowH: 0.6,
        y: 2.1,
        rows: [
          ["Header", "Meeting name, date, time, venue and the chairperson"],
          ["Attendance", "Members present, apologies and absentees"],
          ["Agenda items", "Each topic with a concise, accurate record of the discussion"],
          ["Decisions", "What was decided — clear, accurate and within the meeting's mandate"],
          ["Actions", "Each action with its responsible person and deadline"],
          ["Next meeting", "Carried-over items, date and venue"],
        ],
      },
      {
        type: "cards",
        eyebrow: "Post-meeting follow-up",
        title: "Communicate decisions and track actions",
        cols: 3,
        rowH: 3.0,
        y: 1.8,
        items: [
          { icon: "chat", text: "Communicate decisions", d: "To all affected stakeholders, in the required format — minutes, e-mail or report — and within the required timeframe." },
          { icon: "check", text: "Summarise actions", d: "Each action with its owner and deadline; unresolved items carried over to the next agenda." },
          { icon: "trend", text: "Track to done", d: "Follow up on actions before the next meeting — decisions only count once they are implemented." },
        ],
        note: "Decisions that are not communicated and tracked might as well not have been taken.",
      },
      {
        type: "cards",
        eyebrow: "Now prove it",
        title: "Your work for Specific Outcome 4",
        cols: 3,
        rowH: 2.9,
        y: 2.0,
        items: [
          { icon: "chat", text: "Questioning session", d: "\u201cPost-meeting follow-up\u201d — typed answers, AI-marked." },
          { icon: "dashboard", text: "Quiz 4 & self assessment", d: "Post-meeting follow-up quiz, then the honest tick-box self assessment." },
          { icon: "folder", text: "Logbook — Meeting portfolio", d: "Notice and agenda, invitations, attendance register, minutes and action summary. Mark it 114051." },
        ],
      },
      {
        type: "closing",
        icon: "document",
        quote: "The meeting is not over when it ends.",
        text: "Accurate minutes per organisational policy » decisions communicated in format and on time » actions summarised, owned and tracked — follow-up is what turns discussion into delivery.",
      },
    ],
  },
];
