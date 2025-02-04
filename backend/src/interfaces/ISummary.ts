export interface ISummary {
    summary: string;
    AILength: number // options: {0 = short, 1 = medium, 2 = long}
    AITone: number, // options: {0 = formal, 1 = conversational, 2 = technical, 3 = analytical}
    AIFormat: number, // options: {0 = highlights, 1 = bullets, 2 = analysis, 3 = quotes}
    AIJargonAllowed: number, // options: {0 = True, 1 = False}
};
