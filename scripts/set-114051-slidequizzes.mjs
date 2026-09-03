// One-off codemod: gives every US 114051 lesson slide a 5-question gate quiz.
// Rewrites the slideQuiz of all 28 slides in src/data/content.ts.
// Run: node scripts/set-114051-slidequizzes.mjs
import { readFileSync, writeFileSync } from "node:fs";

// [question, correct, distractor1, distractor2, distractor3, explanation]
const Q = [
  /* 1 · Introduction */
  [
    ["What is Unit Standard 114051 about?", "Conducting a technical practitioners meeting", "Writing business reports and proposals", "Designing IT systems and networks", "Managing hardware and software installations", "Unit Standard 114051 is about conducting a technical practitioners meeting — knowing, preparing, chairing and following up meetings."],
    ["What is the importance of good meetings?", "Collective decision-making, planning and follow-up, accountability, and democracy", "Only to discuss problems and complaints", "Only to announce company decisions to employees", "Only to socialise and build relationships", "Good meetings support collective decision-making, planning and follow-up, accountability, and democratic participation."],
    ["What are the principal activities of a technical committee?", "Development and maintenance of its standards, technical reports and data files", "Organising the year-end function and social events", "Hiring and dismissing the organisation's staff", "Auditing the organisation's financial statements", "The principal activities of a technical committee are the development and maintenance of its associated standards, technical reports, and data files."],
    ["What can happen when meetings are used badly?", "Long meetings discuss the same thing over and over without moving forward", "Decisions get made too quickly and too clearly", "Too few people get invited to too few meetings", "The organisation saves too much time", "Badly used meetings become long, repetitive and conflict-ridden — attending starts to feel like the work itself instead of a tool for getting work done."],
    ["What should we try to make our meetings?", "Places of democratic and constructive participation by every member", "Places where only the chairperson speaks", "As long and as frequent as possible", "Optional social gatherings without agendas", "The aim is democratic and constructive participation and involvement from all members."],
  ],
  /* 2 · Using meetings well */
  [
    ["When should a meeting be held?", "When there is a genuine need for a meeting", "Every day, regardless of whether there is anything to discuss", "Only when senior management wants to make announcements", "Whenever the venue happens to be available", "Meetings must not be too frequent or held just for the sake of it — there must be a need for a meeting."],
    ["What must members know before they attend a meeting?", "What type of meeting it is and what the meeting is for — its PURPOSE", "Only the dress code for the venue", "The full minutes of every previous meeting by heart", "Nothing — the agenda is revealed in the meeting", "Wherever possible, members must know what type of meeting they are going to and what it is for — the PURPOSE of the meeting."],
    ["Which is a sign that meetings are being used badly?", "The same issues are discussed over and over without progress", "The agenda is followed item by item", "Decisions include owners and timeframes", "The meeting starts and ends on time", "Repetitive meetings that never move forward are the classic sign of meetings not serving their purpose."],
    ["How can different kinds of business be separated across meetings?", "Some meetings discuss policy and others discuss organisation (practical work)", "All business must always be discussed in one long meeting", "Policy may never be discussed in any meeting", "Practical work is never a meeting topic", "Decide on the types of meetings needed — for example, some to discuss policy and others to discuss organisation (practical work)."],
    ["What is a special or extraordinary meeting?", "A meeting called for a specific issue outside the normal schedule", "The meeting held on the first day of every month", "A meeting where no decisions may be taken", "A social event without an agenda", "Sometimes an organisation calls a special or extraordinary meeting — planning should take account of the meeting type."],
  ],
  /* 3 · Organisational meeting types */
  [
    ["What is the general members meeting for?", "Informing members, involving them in decisions, and reporting on work done", "Electing new leaders every week", "Discussing one specific issue only", "Reviewing contracts with suppliers", "The general members meeting — usually monthly or every two weeks — is where members are informed, involved in decisions, and where the executive reports on work done."],
    ["How should special meetings be run?", "Focused only on the issues they were called to discuss", "Exactly like general meetings, with minutes and reports", "Without inviting any interested members", "As formal disciplinary hearings", "Special meetings are not run like general members meetings — they focus only on the issues they've been called to discuss."],
    ["What is the focus of executive meetings?", "Planning implementation, monitoring work, dealing with problems and watching finances", "Social team-building only", "Reading the constitution aloud", "Training new members in note-taking", "Executive meetings have a business-like focus: plan implementation, monitor work, deal with problems, discuss correspondence and monitor income and expenditure."],
    ["Which agenda item should every executive meeting include?", "Planning for the next general members meeting", "Electing a new executive", "Rewriting the constitution", "Approving the annual financial statements", "Every executive meeting should have an item on the agenda that plans for the next general members meeting."],
    ["What happens at the Annual General Meeting?", "The executive accounts for the year and new leaders are elected with a mandate", "Only refreshments are served to members", "Weekly operational tasks are allocated", "Suppliers present their new products", "The AGM is where the executive accounts to all members for the year's activities and finances, and where new leaders are elected and given a mandate."],
  ],
  /* 4 · The AGM's two reports */
  [
    ["What does the secretary's report list?", "The plans, actual activities, achievements and problems of the year", "All income and expenditure of the organisation", "The names of members who missed meetings", "The venue bookings for next year", "The secretary's report lists the plans of the organisation, the actual activities, the achievements of the year, and the problems experienced."],
    ["What does the treasurer's report contain?", "All income and expenditure, and the balance and where it is held", "The organisation's plans for the next year", "A list of agenda items for the AGM", "The minutes of every meeting of the year", "The treasurer's report is a detailed financial report listing all income (subscriptions, grants, donations, fundraising), all expenditure, and the balance and where it is held."],
    ["Where is the requirement for an AGM laid down?", "In the organisation's constitution", "In the treasurer's report", "In the previous meeting's minutes", "In the venue's booking terms", "Most organisations have an Annual General Meeting laid down in their constitution."],
    ["How should a financial report be made easier for members to understand?", "Put the main headings on news-prints and explain it in less financial language", "Hand it out after the meeting has closed", "Read every line item aloud twice", "Only show it to the executive", "Members often find financial reports difficult — put the main headings on news-prints and explain it in less financial language."],
    ["What do newly elected leaders receive at the AGM?", "A mandate to run the organisation for another year", "A guaranteed salary increase", "Ownership shares in the organisation", "Exemption from attending future meetings", "The AGM is where new leaders are elected and are given a mandate to run the organisation for another year."],
  ],
  /* 5 · The three technical practitioners meetings */
  [
    ["What are the three types of technical meetings covered in this standard?", "Contract meetings, technical review meetings, and project review meetings", "Board meetings, staff meetings, and training sessions", "Annual meetings, quarterly reviews, and monthly updates", "Planning meetings, execution meetings, and evaluation meetings", "The assessment criteria list contract meetings, technical review meetings, and project review meetings."],
    ["What is the primary purpose of a contract meeting?", "To discuss, review, and manage contractual obligations and deliverables", "To teach employees new technical skills", "To celebrate company milestones and achievements", "To plan social events and team building activities", "Contract meetings discuss, review and manage contractual obligations and deliverables related to technical projects or services."],
    ["What is discussed in a technical review meeting?", "Technical solutions, designs, implementations, and technical issues", "Salary reviews and employee performance ratings", "Marketing strategies and sales targets", "Financial reports and budget allocations", "Technical review meetings evaluate technical solutions, designs, implementations, and resolve technical issues and problems."],
    ["Why are project review meetings important?", "They assess project progress, timelines, resource allocation, and deliverables", "They assign blame for project delays", "They replace project managers with consultants", "They set the salaries of the project team", "Project review meetings assess project progress, timelines, resource allocation, and project deliverables."],
    ["A quarterly SLA review with a support vendor is an example of which meeting?", "A contract meeting", "A project review meeting", "A general members meeting", "An annual general meeting", "Reviewing a service level agreement with a vendor is managing contractual obligations — a contract meeting."],
  ],
  /* 6 · Leadership styles */
  [
    ["How many leadership styles are identified in meeting procedures?", "Three: democratic, autocratic, and facilitative", "Two: formal and informal", "Four: strict, flexible, collaborative, and directive", "Five: traditional, modern, participative, authoritative, and balanced", "The three leadership styles are democratic, autocratic, and facilitative."],
    ["Which leadership style gives all members equal voice in decision-making?", "Democratic", "Autocratic", "Facilitative", "Directive", "In democratic meetings, delegates all have a voice and participate in decision-making."],
    ["In an autocratic meeting, who primarily controls the discussion and decisions?", "The chairperson, with attendees giving input only when instructed", "All members equally, by vote", "A neutral facilitator", "The note taker", "Autocratic meetings are hosted and led by a chairperson who runs the entire meeting and gives most of the input."],
    ["What is the role of a facilitator in a facilitative meeting?", "To ensure all members actively participate while guiding the discussion", "To take all the decisions personally", "To record the minutes and stay silent", "To vote first so members know what to choose", "Facilitative meetings are group efforts — the leader ensures all members actively participate to achieve the outcome or goal."],
    ["Which style fits a decision that needs buy-in from every department?", "Democratic — delegates from each area participate in the decision", "Autocratic — the chair simply announces the outcome", "No meeting is needed for such decisions", "Whichever style finishes fastest", "Democratic meetings are held with appointed or nominated delegates from departments, organisations or areas so every area participates."],
  ],
  /* 7 · Decision-making processes */
  [
    ["Which decision-making processes are used in meetings?", "Voting, consensus, criteria-based rating, ranking, and paired comparisons", "Only voting and consensus", "Only majority rule and negotiation", "Random selection and coin-toss methods", "Meetings use voting, consensus, criteria-based rating, ranking, and paired comparisons for decision-making."],
    ["What is the main feature of a voting decision-making process?", "Each participant votes and the option with the most votes wins", "Everyone must agree before any decision is taken", "Options are scored against weighted criteria", "The chairperson decides after hearing opinions", "Voting is a direct democratic process — the option with the most votes wins, by simple majority or supermajority."],
    ["What does consensus mean in a meeting context?", "All participants agree or can at least accept the decision", "The majority outvotes the minority", "The most senior person decides", "A decision is postponed indefinitely", "Consensus requires discussion and compromise until all participants can support the outcome."],
    ["How does criteria-based rating work?", "Options are rated against predetermined criteria and scored to find the best", "Members shout out their favourite option", "Options are compared two at a time", "Options are ranked from best to worst only", "Criteria-based rating evaluates options against predetermined criteria, rating each option on each criterion, then scoring."],
    ["What is paired comparisons?", "Comparing options two at a time and scoring based on preferences", "Comparing only the top two options selected by vote", "Pairing team members to discuss options privately", "Comparing meeting notes from previous meetings", "Paired comparisons compare options two at a time, with scores based on how many times each option is preferred."],
  ],
  /* 8 · Voting in practice */
  [
    ["How does a show of hands work?", "The chair calls for hands for and against, counts them, and the majority decides", "Members write their vote on paper secretly", "Only the executive raises their hands", "The chairperson votes on behalf of everyone", "In a show of hands the chairperson calls on members to raise their hands for or against; the votes are counted and the majority decides."],
    ["How does a secret ballot work?", "Each person writes their support or objection on paper and the votes are counted", "Members raise their hands in silence", "The chair privately asks each member outside the room", "Only abstentions are recorded", "In a secret ballot each person writes whether they support the proposal; the votes are counted and the majority decides."],
    ["What happens when the majority accepts a proposal?", "It becomes binding on the organisation", "It must still be approved by the venue", "It only applies to those who voted for it", "It is recorded but never implemented", "One person proposes, another seconds, people vote — if the majority accept the proposal it becomes binding on the organisation."],
    ["Why is consensus usually better than voting?", "Compromises mean most people feel part of the decision", "It is always faster than voting", "It lets the chairperson decide alone", "It avoids having to record the decision", "Reaching consensus often means compromises from everyone, but it ensures most people feel part of the decision."],
    ["When does a vote need to be taken?", "In elections, or when the meeting cannot reach consensus", "At the start of every agenda item", "Only when the chairperson is absent", "Never — consensus is always possible", "Sometimes a vote is necessary — for example in elections or when the meeting cannot reach a decision through consensus."],
  ],
  /* 9 · Resolutions */
  [
    ["What is a resolution?", "A formal proposal that becomes policy of the organisation if passed", "An informal suggestion recorded nowhere", "A summary of the chairperson's opinions", "A list of members present at the meeting", "Resolutions are formal proposals put to the meeting; if passed, they become resolutions and therefore policy of the organisation."],
    ["What are the three parts of a resolution, in order?", "Noting, Believing, Therefore resolves", "Believing, Noting, Amending", "Moving, Seconding, Voting", "Opening, Discussion, Closing", "A resolution usually has three parts: NOTING the main issues, BELIEVING (your understanding of the causes), and THEREFORE RESOLVES (what the organisation will do)."],
    ["What goes in the NOTING part of a resolution?", "The main issues the organisation is concerned about", "The exact wording of the final policy", "The names of the proposer and seconder", "The votes for and against", "The resolution starts by noting — listing the main issues of concern."],
    ["What goes in the THEREFORE RESOLVES part?", "Exactly what the organisation has decided to do or its policy on the issue", "A summary of who attended the meeting", "The background causes of the issue", "The date of the next meeting", "The third part lists exactly what the organisation has decided to do or what its policy should be on the issue."],
    ["What happens if an amendment to a resolution is not accepted by everyone?", "A vote is held and the chair records those for, against and abstaining", "The whole resolution is abandoned immediately", "The chairperson decides without a vote", "The amendment is applied anyway", "If there is not total agreement on an amendment, a vote is held — if the majority support it, the original section falls away."],
  ],
  /* 10 · Meeting conventions */
  [
    ["What does 'moving' mean in a meeting context?", "Formally proposing a resolution or course of action", "Walking around the room to get attention", "Changing the meeting venue", "Postponing the meeting to another day", "Moving means formally proposing a motion — 'I move that we...'."],
    ["What is the purpose of seconding a motion?", "Showing another member agrees the motion is worthy of discussion", "Voting against the motion", "Adding a new item to the agenda", "Closing the meeting early", "Seconding indicates another member supports the motion — unseconded motions fall away."],
    ["What is an amendment in meeting procedures?", "A modification to a motion before voting", "The final vote count", "A new agenda distributed after the meeting", "The chairperson's closing remarks", "Amending means modifying a motion before voting — changing wording, scope or terms. All amendments must be voted on."],
    ["What do voting procedures include?", "Show of hands, ballot voting, and recording abstentions", "Only secret ballots are ever allowed", "The chairperson voting on behalf of everyone", "Votes counted only when unanimous", "Voting procedures ensure fair counting: raising hands, show of hands, ballot voting, and recording abstentions."],
    ["Why do meetings follow established conventions?", "To ensure order, fairness, and effective decisions", "To make meetings longer and more formal", "To prevent members from speaking", "To avoid ever taking decisions", "Good meetings follow established conventions and procedures to ensure order, fairness, and effectiveness."],
  ],
  /* 11 · Procedural points */
  [
    ["When is a Point of Order raised?", "When meeting procedure is not being stuck to and the meeting must return to order", "When a member wants tea or coffee", "When the meeting is running ahead of schedule", "When the chairperson wants to end the meeting", "A Point of Order is used when procedure is not being followed — for example, a speaker totally off the point."],
    ["What does a Point of Information allow?", "A member to speak out of turn to request or give information on the matter", "A member to take over as chairperson", "The meeting to skip the agenda entirely", "The note taker to stop taking minutes", "A Point of Information lets a member speak out of turn to request or give more information on the matter being discussed."],
    ["When can the chairperson rule a member Out of Order?", "When they ignore procedure, are rude, interject or misbehave", "When they ask too many relevant questions", "When they arrive exactly on time", "When they vote against the chairperson", "The chairperson may rule a member out of order for not sticking to procedure, rudeness, interjecting or misbehaving."],
    ["What can a speaker who is being harassed ask for?", "The protection of the chairperson", "An immediate end to the meeting", "The removal of all other members", "A private meeting with the executive", "A speaker who is being harassed while speaking can ask for the protection of the chairperson."],
    ["What is a quorum?", "The minimum number of members who must be present to take decisions", "The maximum number of people the venue allows", "The number of votes needed to amend the constitution", "The list of apologies received", "A quorum is the minimum number required to conduct business, stated in the constitution — decisions taken without it can be forced to be re-discussed."],
  ],
  /* 12 · The note taker */
  [
    ["Why should the note taker have technical background knowledge?", "So technical terminology and context are correctly recorded in the minutes", "So they can chair the meeting when needed", "Because organisational policy forbids non-technical staff", "So they can veto technical decisions", "A technically knowledgeable note taker ensures terminology is correctly recorded and technical context is properly documented."],
    ["What risk does a non-technical note taker create?", "Technical decisions and their reasons may be misrecorded or misunderstood", "The meeting may finish too early", "Too many members may attend", "The agenda may become too short", "Without technical background, the note taker may misinterpret the discussion — the minutes lose accuracy exactly where it matters."],
    ["What must the minutes capture about each technical decision?", "The decision, its reasons, the owner and the timeframe — accurately", "Only the time the meeting ended", "The personal opinions of the note taker", "A word-for-word transcript of all small talk", "Minutes must accurately capture the technical decisions, their reasons, and the actions with owners and timeframes."],
    ["How are motions and resolutions checked for accuracy during the meeting?", "They are recorded verbatim and read back to the meeting", "They are whispered to the chairperson only", "They are printed a week after the meeting", "They are never checked", "Motions and resolutions should be recorded verbatim and read back during the meeting to make sure they are accurately transcribed."],
    ["Who benefits from accurate technical minutes?", "Implementers, absent members and future members of the organisation", "Only the note taker", "Only the venue owner", "Nobody — minutes are a formality", "Accurate minutes remind people of assignments, inform those not present, and let future members build on past work."],
  ],
  /* 13 · Physical arrangements */
  [
    ["Why is venue selection important for a technical meeting?", "Venue size and interactive capabilities heavily affect the meeting outcome", "The venue determines who will chair the meeting", "Venues legally require a minimum attendance", "The venue decides the meeting agenda", "The size and interactive capabilities of the venue heavily affect the outcome — it must accommodate movement, be accessible, and minimise distractions."],
    ["What should facilities for a meeting include?", "Tables, chairs, flipcharts, whiteboards, screens and A/V equipment as needed", "Only chairs — everything else is optional", "A swimming pool and gym", "Personal offices for every attendee", "Facilities must match the meeting type and outcomes: tables, chairs, flipcharts, whiteboards, screens, audio/visual equipment, and breakout spaces."],
    ["What technology may a technical meeting require?", "Internet access, video conferencing and any equipment participants must use", "No technology is ever needed in meetings", "Only a landline telephone", "A printing press for the minutes", "Technology depends on the meeting type — online work needs internet access, and required equipment must be available and tested."],
    ["What is the importance of providing supporting information before a meeting?", "Participants can understand the topics and prepare adequately", "It replaces the need for anyone to attend", "It makes the meeting longer", "It is only needed for the chairperson", "Relevant supporting information — user guides, manuals, reference documents — lets participants understand and prepare."],
    ["Where should the venue be located?", "Somewhere accessible where participants will not be distracted", "As far from the participants as possible", "Wherever is cheapest, regardless of access", "Next to the noisiest part of the building", "If the venue is inaccessible the turnout suffers; inside the organisation it must be located where participants won't be distracted."],
  ],
  /* 14 · Notification and invitations */
  [
    ["What must the meeting notification include?", "The date, time and venue, and the main issues to be discussed", "Only the name of the chairperson", "The full minutes of all previous meetings", "The salaries of the attendees", "It is the organisers' responsibility to ensure everyone is notified of the date, time and venue, and the main issues to be discussed."],
    ["Why hold meetings on a consistent day, time and place?", "People make attendance a habit and notification costs drop", "It guarantees perfect attendance by law", "It removes the need for an agenda", "It allows the chair to skip preparation", "A consistent slot — e.g. the first Friday of every month — helps people make it a habit and cuts notification costs."],
    ["How should the meeting room be set up?", "Unlocked, with enough chairs, seating in a circle and the chair able to see everyone", "Locked until the exact starting minute", "With rows facing away from the chairperson", "With chairs for half the participants", "Make sure the room is open and set up properly — enough chairs, everyone in a circle, and the chairperson seated to see everyone."],
    ["What must the invitation say about outcomes?", "The intended outcomes, clear, concise and well documented, with the requirements", "Nothing — outcomes are a surprise", "Only that a meeting will happen", "That outcomes will be decided afterwards", "Meeting outcomes must be clear, concise and well documented — outlined in the invitation with the requirements of the meeting."],
    ["Why must invitations be sent timeously?", "So participants can prepare themselves and arrange their schedules", "So the venue can increase its booking fee", "To ensure fewer people can attend", "Because late invitations are illegal", "Invitations extended timeously give participants sufficient time to prepare and arrange their schedules."],
  ],
  /* 15 · Preparing the agenda */
  [
    ["When should meeting agendas be distributed?", "Before the meeting, ideally a week in advance", "At the end of the meeting", "Only when someone asks for a copy", "A month after the meeting", "The agenda and supporting documentation must be completed and distributed before the meeting, ideally a week in advance."],
    ["Where is the agenda drawn from?", "The Matters Arising of the previous meeting's minutes and executive discussions", "The chairperson's personal diary only", "A random selection of topics", "The venue's standard template", "The agenda is drawn from Matters Arising — tasks needing report-backs, matters needing more information, and deferred matters."],
    ["How should agenda items be arranged?", "In order of priority, with time allocated for each discussion", "Alphabetically by topic name", "In the order members arrive", "Longest discussions first, regardless of importance", "Items are arranged in order of priority and time is allocated for each discussion."],
    ["What is the last item on a standard agenda?", "General or Any Other Business, for short items not on the agenda", "The treasurer's report", "Approval of the previous minutes", "The attendance register", "An agenda should include a last item known as General or Any Other Business for short items not included on the agenda."],
    ["Is the agenda fixed once distributed?", "No — it can be added to and adjusted, even during the meeting", "Yes — no changes are ever allowed", "Only the venue may change it", "Only if the meeting is cancelled", "The agenda doesn't have to be set in stone — additions and adjustments can be made as needed, even during the meeting."],
  ],
  /* 16 · The chairperson */
  [
    ["What is the primary role of a chairperson in a meeting?", "Set the pace, keep people on topic, and ensure democratic decisions", "Take all the decisions personally", "Record the minutes of the meeting", "Prepare the refreshments", "The chairperson sets the pace, keeps people to the topics, ensures democratic decisions are taken and that everyone is on board."],
    ["What makes a GOOD chairperson?", "An active chair who introduces topics clearly and guides the discussion", "Someone who only keeps a list of speakers", "Someone who speaks more than everyone else", "Someone who avoids all difficult topics", "A good chairperson is an active chairperson — introducing each topic clearly and guiding the discussion, especially when points repeat."],
    ["Why should the chairing job be rotated?", "So more members can practise the great skill of chairing", "So nobody is ever responsible for the meeting", "Because the constitution forbids repeat chairs", "To confuse the note taker", "Chairing is a great skill — teach members to chair and rotate the job so more people can practise it."],
    ["What should the chair do when a discussion throws up opposing views?", "Summarise the positions and propose a way forward", "Immediately close the meeting", "Side with the loudest speaker", "Delete the item from the minutes", "The chairperson summarises the different positions and proposes a way forward — a vote, a further discussion, or a compromise."],
    ["Who should chair important meetings?", "An experienced chairperson", "Whoever arrives first at the venue", "The newest member of the organisation", "Nobody — important meetings run themselves", "It is always good to have an experienced chairperson for important meetings."],
  ],
  /* 17 · The six duties of the chair */
  [
    ["What should the chair do before the meeting starts?", "Agree rules and guidelines on behaviour with the members", "Distribute the previous year's budget", "Assign homework to all participants", "Decide all outcomes in advance", "The chair and members agree on rules and guidelines on behaviour — agreed rules create buy-in and prevent procedural disputes."],
    ["How must the agreed conventions be applied?", "Consistently throughout the meeting, per the organisation's standing procedures", "Only when the chairperson benefits", "Only in the last ten minutes", "Differently for senior and junior members", "The chair applies agreed meeting conventions throughout, according to the meeting type and the standing procedures of the organisation."],
    ["What is the chair's duty regarding the agenda?", "Ensure the published agenda is followed item by item", "Replace it with new topics on the day", "Keep it secret from the members", "Skip any item that seems difficult", "The chair ensures that the published agenda is followed, keeping discussion on track."],
    ["How does the chair minimise conflict?", "By providing for active participation by all members", "By forbidding anyone from speaking", "By taking every decision personally", "By ending the meeting at the first disagreement", "The chair provides for active participation by all members to avoid or minimise conflict."],
    ["What must be true of meeting decisions?", "Clear, accurate, time-framed and within the meeting's mandate", "Vague enough to allow reinterpretation", "Known only to the chairperson", "Recorded a month after the meeting", "Agreed decisions must be clear, accurate, include a time frame for action, and be within the mandate of the type of meeting conducted."],
  ],
  /* 18 · Running the agenda step by step */
  [
    ["How are those present and apologies handled?", "Apologies are recorded in the minutes; a register goes round for large meetings", "Attendance is never recorded", "Only latecomers are listed", "Apologies are ignored unless written", "The apologies of members not able to attend are recorded as part of the minutes; send round an attendance register if there are too many people."],
    ["What happens with the previous meeting's minutes?", "They are circulated or read, corrected if needed, and adopted as accurate", "They are destroyed after the meeting", "They are rewritten by the chairperson alone", "They are read only by the note taker", "Minutes must be adopted at the beginning of a meeting — everyone must agree they are an accurate record, with additions where items were left out."],
    ["What are 'matters arising'?", "Points from the last meeting that need report-backs or further discussion", "Complaints about the refreshments", "New topics never discussed before", "The chairperson's personal to-do list", "Matters arising covers points from the last meeting — tasks people were asked to do, or subsequent developments needing discussion."],
    ["How is correspondence dealt with?", "Letters are read out or listed, with the chair suggesting action on each", "All letters are ignored until year-end", "Only the treasurer may read letters", "Letters are answered without being reported", "Correspondence can be read out and discussed, or the secretary lists it with a brief explanation and the chairperson suggests action."],
    ["What should a report on an agenda item cover?", "What was completed, the problems, and what still needs to be done", "Only good news about the task", "The reporter's personal opinions of colleagues", "A summary of unrelated projects", "A report should cover whether the task was completed, what the problems were, and what still needs to be done."],
  ],
  /* 19 · Basic steps for chairing */
  [
    ["Why set a cut-off time at the start of the meeting?", "It encourages people to be brief", "It guarantees the meeting runs longer", "It lets the chair leave early alone", "It cancels the last agenda items automatically", "Start by setting a cut-off time everyone agrees on — this helps encourage people to be brief."],
    ["What must the chair ensure about participation?", "Everyone gets a chance to speak and no one dominates", "Only the executive speaks", "The loudest voice decides", "Silent members are removed", "The chair calls on individuals to lead points, gives everyone a chance to speak, and ensures no one dominates the discussion."],
    ["How should the chair summarise a discussion?", "Restate the ideas and proposals clearly, without repeating everything said", "Repeat every sentence word for word", "Only summarise their own opinions", "Skip summaries to save time", "The chair should summarise clearly, restating ideas and proposals put forward — but there is no need to repeat everything."],
    ["What does proper delegation of a decision include?", "The responsible person knows what to do, by when, and when to report back", "Assigning the task to whoever is absent", "Keeping the owner secret", "Delegating without any deadline", "The chair delegates the duty of carrying out the decision and ensures the person knows what to do, when it should be done and reported on."],
    ["What must always be set before the meeting ends?", "The date of the next meeting", "The venue's cleaning schedule", "Next year's budget", "The chairperson's successor", "The chair ensures that the date for the next meeting is always set at the meeting."],
  ],
  /* 20 · Facilitation skills */
  [
    ["How can the chair encourage group discussion?", "Turn questions back to the group and ask open-ended questions", "Answer every question personally", "Allow only written comments", "Limit discussion to two members", "Turn questions back to the group, ask people to comment, compliment ideas and ask open-ended questions."],
    ["How should the chair manage the speaking queue?", "Note speakers in order and let first-time speakers skip the queue", "Let whoever shouts loudest speak", "Alternate between the same two people", "Choose speakers alphabetically", "Jot down names in order; it can be good to let people who have not spoken yet skip the queue — no second turn until everyone has spoken once."],
    ["Why must the facilitator stay neutral?", "The chair's position gives their comments undue extra weight", "Neutrality makes meetings shorter", "The constitution forbids the chair from thinking", "Neutrality is only needed at AGMs", "Don't use your position to impose personal opinions — step aside if you feel strongly, and identify personal views as personal."],
    ["Which non-verbal habits help members speak?", "Eye contact, nodding, and spotting the half-raised hand", "Checking your phone while others speak", "Facing away from the speaker", "Interrupting to speed things up", "Be attentive — look at speakers, lean forward, nod, and make eye contact with people who may need encouragement to speak."],
    ["Why is silence a useful facilitation tool?", "It gives people a chance to consider and collect their thoughts", "It proves the meeting is over", "It signals that the topic is banned", "It forces the note taker to speak", "Don't be afraid of silence — it may encourage someone to voice a comment they have been hesitant to say."],
  ],
  /* 21 · Managing difficult behaviours */
  [
    ["How should the chairperson manage difficult meeting behaviours?", "Stay calm and use specific techniques for each type of behaviour", "Eject anyone who disagrees", "Ignore all behaviour and continue reading the agenda", "Cancel the meeting at the first interruption", "The chair manages each behaviour with its own technique — calmly, keeping the meeting constructive."],
    ["How do you handle the heckler?", "Stay calm, find merit in one point, express agreement, and move on", "Argue back until they stop", "Ask them to leave immediately", "Give them the chair's role", "Don't let the heckler upset you — stay calm, find merit in one of their points, express agreement, then move on."],
    ["How do you handle the overly talkative member?", "Wait for a breath, thank them, and ask to hear from someone else", "Let them speak for the whole meeting", "Turn off the lights until they stop", "Remove their agenda items", "Wait until they take a breath, thank them, and say something like 'Let's hear from someone else' — or slow them with a difficult question."],
    ["How do you draw in the silent member?", "Ask directly for their opinion and encourage their first contribution", "Force them to chair the next meeting", "Announce their silence to the group", "Ignore them completely", "Arouse interest by asking directly for their opinion, show respect for their experience — but never force them to speak."],
    ["What do you do when someone is defiantly wrong?", "Tactfully restate their point to show the error, or let the group correct it", "Announce loudly that they are wrong", "Record the wrong facts in the minutes", "End the meeting immediately", "Tactfully restate what they said to show how it may be incorrect, or leave the debate open so the group can provide the correct information."],
  ],
  /* 22 · Post-meeting follow-up intro */
  [
    ["Why is post-meeting follow-up important?", "It ensures decisions are properly implemented and outcomes match what was planned", "It replaces the need for future meetings", "It gives the chairperson extra authority", "It reduces the number of participants needed", "Decisions implemented without follow-up may generate outcomes different from those planned — follow-up closes that gap."],
    ["What can happen in the gap between a meeting and implementation?", "The decision can become inconsequent and get lost on the way to implementation", "Decisions automatically implement themselves", "The minutes rewrite themselves", "Nothing — the gap has no effect", "The gap between the end of a meeting and its post-meeting activities may turn the decision inconsequent."],
    ["What should accurate meeting minutes achieve?", "A reliable record of decisions, assignments and deadlines, per organisational policy", "A word-for-word transcript of all conversation", "A summary of the chairperson's feelings", "A list of future meeting venues only", "Minutes are produced accurately and in line with the policy of the organisation — the record of decisions, assignments and deadlines."],
    ["To whom are agreed records of discussion communicated?", "Interested parties, in the format and time frame the meeting type requires", "Only the chairperson", "Nobody — records stay in the minute book", "Only people who attended", "The follow-up communicates agreed records to interested parties in a format and time frame that meet the requirements — contractual, technical review or project specific."],
    ["What should a summary of discussions and actions include?", "What was discussed and what must be done, by whom and by when", "Only the discussions with no actions", "The lunch menu of the meeting", "A copy of the organisation's constitution", "The summary meets format requirements — clarity about what was discussed and what actions must be taken, by whom and when."],
  ],
  /* 23 · Taking good minutes — three skills */
  [
    ["What does the listening skill require of a note taker?", "Not just hearing what is said but making sure you understand it", "Writing down every word spoken", "Only listening to the chairperson", "Listening only during votes", "Listening means ensuring you understand what is being said — not just hearing it."],
    ["How should notes be taken during the meeting?", "Write only the main points and decisions, in your own words", "Transcribe everything word for word", "Only record the jokes", "Wait until after the meeting to write everything", "Write down only the main points and the decisions taken — using your own words makes minutes more accurate and complete."],
    ["What deserves special attention when taking notes?", "Decisions — ask for them to be repeated if necessary", "The seating arrangement", "The weather on the day", "Members' clothing", "Pay special attention to decisions; if necessary, ask for the decisions to be repeated."],
    ["What should the note taker do when something is unclear?", "Stop the meeting and ask for clarification", "Guess and hope for the best", "Leave a blank space in the minutes", "Ask a friend after the meeting", "Do not hesitate to stop the meeting if you are not clear about any decisions or issues being discussed."],
    ["Where should minutes be written?", "Neatly in a dedicated minute book or file, kept safe and available", "On scraps of paper", "On a whiteboard that gets erased", "Only in the note taker's memory", "The minutes should be written neatly in a special minute book or file — kept safely and always available for consultation."],
  ],
  /* 24 · What the minutes must contain */
  [
    ["What belongs in the minutes' header?", "Nature of the meeting, date, time and venue — and who took the minutes", "Only the year of the meeting", "The chairperson's biography", "The organisation's full financial history", "The minutes include the nature of meeting, date, time, venue and the name of the person taking the minutes."],
    ["What attendance information do minutes record?", "Those present, visitors, apologies and absentees", "Only the number of chairs used", "Just the chairperson's name", "Only members who spoke", "Minutes record the names of those present, visitors, apologies and absentees — and the time the meeting was called to order."],
    ["How are motions and resolutions recorded?", "Verbatim, with mover and seconder, and read back to confirm accuracy", "As a rough summary from memory", "Only if they passed unanimously", "They are not recorded at all", "Motions and resolutions should be recorded verbatim and read back during the meeting to ensure accurate transcription."],
    ["How do minutes separate fact from opinion?", "Attribute opinions to their source — 'Jane suggested that…'", "Present all opinions as facts", "Delete all opinions entirely", "Put opinions in capital letters", "Facts are objective; opinions are personal views — attribute opinions to their source, e.g. 'Jane suggested that...' or 'The group concluded that...'."],
    ["What closes off the minutes?", "Time of adjournment and the next meeting's date, time and location", "A blank page for doodles", "The venue's invoice", "A list of future resolutions", "Minutes end with the time of adjournment and the next meeting's date, time and location."],
  ],
  /* 25 · After the meeting — close the loop */
  [
    ["When should minutes be distributed?", "Within a reasonable time — ideally before the next meeting", "A year after the meeting", "Never — they stay with the note taker", "Only when a dispute arises", "Distributing the minutes before the next meeting reminds people of assignments and deadlines, and of when and where the next meeting is."],
    ["How are the previous minutes approved?", "The group approves them as accurate — as read or as amended", "The chairperson approves them alone", "The venue manager signs them off", "Approval is never needed", "Corrections or additions are recorded in the next meeting's minutes, and the group approves them as accurate, as read or as amended."],
    ["What does following up with people involve?", "Thanking them and making sure they understand their assignments", "Checking their personal diaries", "Reassigning all tasks to new people", "Sending daily reminders about everything", "Follow up with people — thank them for their input and make sure they understand assignments and have what they need."],
    ["In what format must decisions be communicated?", "The format and time frame required by the meeting type and organisation", "Any format, whenever convenient", "Only by word of mouth", "Only in the annual report", "Records of discussion go to interested parties in a format and time frame meeting the requirements — contractual, technical review or project specific."],
    ["What comes after the loop is closed?", "Start getting ready for the next meeting", "The organisation stops meeting", "The minutes are destroyed", "The chairperson resigns", "Now you're done — you can start getting ready for the next meeting."],
  ],
  /* 26 · The decision meeting life cycle */
  [
    ["What are the three stages of the decision meeting cycle?", "Pre-meeting, meeting, and post-meeting", "Planning, lunch, and closing", "Voting, vetoing, and archiving", "Opening, arguing, and adjourning", "Decision meetings are part of a continuous cycle of pre-meeting, meeting and post-meeting activities."],
    ["What happens in the pre-meeting stage?", "Creating the agenda, identifying invitees and roles, and preparing participants", "Implementing the decisions", "Distributing the final minutes", "Electing new leadership", "The pre-meeting includes creating an agenda, identifying people to be invited and their roles, preparing participants, and background information."],
    ["What happens in the post-meeting stage?", "Dissemination, monitoring implementation, and clarifying ambiguous details", "The original decisions are re-voted", "The agenda for the same meeting is written", "Nothing — the cycle ends at the meeting", "Post-meeting activities include dissemination, monitoring implementation of the decisions and clarification of ambiguous decision details."],
    ["Who often carries out post-meeting activities?", "Implementers who were not necessarily present in the meeting", "Only the chairperson", "The venue staff", "Nobody — decisions implement themselves", "People working in the post-meeting stage are implementers, most probably different from the decision makers in the meeting."],
    ["Why must decisions be periodically reviewed?", "It is not enough to simply make a decision and move on", "Reviews replace the need for minutes", "Reviewing cancels all previous decisions", "Only new members may review decisions", "As Russo points out, we must periodically review our decisions — otherwise we waste good opportunities for improvement."],
  ],
  /* 27 · Four aspects of post-meeting support */
  [
    ["What are the four key aspects of post-meeting support?", "Implementation plan, follow-up of activities, interaction support, and awareness", "Voting, minutes, refreshments, and venue", "Agenda, quorum, motions, and amendments", "Budget, staffing, marketing, and sales", "Post-meeting support covers the decision implementation plan, follow-up of implementation activities, interaction between decision makers and implementers, and awareness for external members."],
    ["What does the implementation plan aspect provide?", "A drafted, published execution plan that can change during execution and generate tasks", "A guest list for the next meeting", "A word-for-word transcript of the meeting", "The venue booking for next year", "Post-meeting support should let you rapidly draft and publish an execution plan, change it during execution, generate tasks and record completed ones."],
    ["Why formally link each meeting outcome to its implementation?", "So decisions stop getting lost or forgotten on the way to implementation", "To create extra paperwork", "To slow down implementation deliberately", "To keep outcomes secret", "Many decisions get lost between the meeting and implementation — a formal link with tracked working steps prevents that."],
    ["What is the 'means of interaction' aspect?", "A structured, persistent channel between decision makers and implementers", "A suggestion box at reception", "A rule against asking questions", "An annual social event", "A direct communication channel — an extension of the meeting — lets implementers resolve ambiguities in line with the decision's intent."],
    ["What does the awareness aspect do?", "Gives filtered progress information to people affected by the decision", "Hides all information from outsiders", "Replaces the minutes entirely", "Advertises the organisation to the public", "Awareness provides filtered information and notifications to interested people — avoiding time-consuming informal requests."],
  ],
  /* 28 · Self-assessment */
  [
    ["What are the main assessment outcomes for Unit Standard 114051?", "Knowledge of meetings, preparing, chairing, and post-meeting follow-up", "Hardware repair, software installation, network design, and coding", "Report writing, budgeting, marketing, and sales", "Storage management, security, backups, and recovery", "The four specific outcomes: demonstrate knowledge of meeting types, prepare, chair, and conduct post-meeting follow-up."],
    ["If you don't feel confident about any area, what should you do?", "Write it down as a goal and make arrangements with your facilitator", "Skip it and hope it isn't assessed", "Only revise the areas you already know", "Wait for the knowledge to arrive by itself", "Think about any point you could not tick, write it down as a goal, and arrange with your facilitator to become competent."],
    ["How should you respond to the checklist items?", "Honestly — tick only what you can genuinely do", "Tick everything to finish faster", "Leave the checklist blank", "Ask a friend to tick for you", "You are now ready to go through a check list — be honest with yourself."],
    ["What should you do with the goals you write down?", "Decide on a plan of action and review the goals regularly", "File them away and forget them", "Hand them to another learner", "Replace them with easier goals", "Decide on a plan of action to achieve these goals, and regularly review these goals."],
    ["How often should you review your learning progress in this unit?", "Regularly, until you are competent in every area", "Only once, at the very end", "Never — progress reviews are optional", "Only when the facilitator forces you", "Regular review of your progress helps ensure thorough understanding and identifies areas needing reinforcement."],
  ],
];

const file = "src/data/content.ts";
let src = readFileSync(file, "utf8");

// locate unit 114051's lesson array
const unitStart = src.indexOf('"114051": {');
const lessonStart = src.indexOf("lesson: [", unitStart);
if (unitStart < 0 || lessonStart < 0) throw new Error("unit 114051 lesson array not found");

// find the matching close bracket of the lesson array with a string-aware scanner
function scan(from, openCh, closeCh) {
  let depth = 0, inStr = false, esc = false;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === openCh) depth++;
    else if (c === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error("unbalanced");
}
const lessonOpen = src.indexOf("[", lessonStart);
const lessonClose = scan(lessonOpen, "[", "]");

// collect the 28 top-level section objects inside the lesson array
const sections = [];
let i = lessonOpen + 1;
while (i < lessonClose) {
  const braceAt = src.indexOf("{", i);
  if (braceAt < 0 || braceAt > lessonClose) break;
  const end = scan(braceAt, "{", "}");
  sections.push([braceAt, end]);
  i = end + 1;
}
console.log(`found ${sections.length} lesson sections`);
if (sections.length !== Q.length) throw new Error(`expected ${Q.length} sections, found ${sections.length}`);

const esc = (s) => JSON.stringify(s);
function quizText(set, indent) {
  const p = " ".repeat(indent);
  const lines = [`${p}slideQuiz: [`];
  for (const [q, correct, d1, d2, d3, explain] of set) {
    lines.push(`${p}  {`);
    lines.push(`${p}    q: ${esc(q)},`);
    lines.push(`${p}    options: [`);
    for (const o of [correct, d1, d2, d3]) lines.push(`${p}      ${esc(o)},`);
    lines.push(`${p}    ],`);
    lines.push(`${p}    answer: 0,`);
    lines.push(`${p}    explain: ${esc(explain)},`);
    lines.push(`${p}  },`);
    }
  lines.push(`${p}],`);
  return lines.join("\n");
}

// rewrite sections from last to first so offsets stay valid
for (let s = sections.length - 1; s >= 0; s--) {
  let [start, end] = sections[s];
  let body = src.slice(start, end + 1);
  // strip an existing slideQuiz property (string-aware bracket match inside body)
  const sqAt = body.indexOf("slideQuiz: [");
  if (sqAt >= 0) {
    const local = body.slice(sqAt);
    let depth = 0, inStr = false, escd = false, closeIdx = -1;
    for (let k = local.indexOf("["); k < local.length; k++) {
      const c = local[k];
      if (inStr) {
        if (escd) escd = false;
        else if (c === "\\") escd = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "[") depth++;
      else if (c === "]") {
        depth--;
        if (depth === 0) { closeIdx = k; break; }
      }
    }
    let cut = sqAt + closeIdx + 1;
    if (local[closeIdx + 1] === ",") cut++;
    // remove trailing newline+indent before slideQuiz
    let cutStart = sqAt;
    while (cutStart > 0 && (body[cutStart - 1] === " " || body[cutStart - 1] === "\n")) cutStart--;
    body = body.slice(0, cutStart) + body.slice(cut);
  }
  // insert the new quiz before the section's closing brace
  const closeBrace = body.lastIndexOf("}");
  let before = body.slice(0, closeBrace).replace(/\s+$/, "");
  if (!before.endsWith(",")) before += ",";
  body = before + "\n" + quizText(Q[s], 8) + "\n      }";
  src = src.slice(0, start) + body + src.slice(end + 1);
}

writeFileSync(file, src);
console.log("done — every slide now has a 5-question gate quiz");
