import type { WorkbookSpec } from "../types";

/** Structured learner workbook for US 114074, using the approved Eruditio
 * workbook shell rather than the plain PDF text reconstruction. */
export const WORKBOOK_114074: WorkbookSpec = {
  title: "DEMONSTRATE AN UNDERSTANDING OF DIFFERENT COMPUTER NETWORK ARCHITECTURES AND STANDARDS",
  outcomes: [
    { id: "network-types", specificOutcome: 1, title: "Describe computer network types and standards.", learningOutcomes: ["The description distinguishes types of networks.", "The description compares network topologies.", "The description outlines and distinguishes features of node addressing methods.", "The description outlines the standards for industry network architectures."], questions: [{ id: "network-types", task: 1, text: "Describe computer network types and standards.", marks: 10 }] },
    { id: "channel-use", specificOutcome: 2, title: "Explain channel utilisation techniques and their features.", learningOutcomes: ["The explanation outlines channel utilisation techniques and their features.", "The explanation compares the principles of access protocols.", "The explanation identifies the purpose of LAN components.", "The explanation illustrates network configurations and installation issues."], questions: [{ id: "channel-use", task: 2, text: "There exist two LAN transmission options, Baseband and Broadband. Distinguish between the two.", marks: 10 }] },
    { id: "lan-architectures", specificOutcome: 3, title: "Explain LAN architectures.", learningOutcomes: ["The explanation identifies switching techniques.", "The explanation compares switching techniques.", "The explanation outlines WAN management issues."], questions: [{ id: "lan-architectures", task: 3, text: "Explain LAN architectures.", marks: 10 }] },
  ],
};
