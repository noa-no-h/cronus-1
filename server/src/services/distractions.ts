import { ActiveWindowDetails } from '@shared/types';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { isVeryLikelyProductive } from 'shared/distractionRules';
import { z } from 'zod';

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI();

// Define our schema using Zod
const DistractionAnalysisSchema = z.object({
  distractionStatus: z.enum(['yes', 'no', 'maybe']),
  motivationalMessage: z.string(),
});

export type DistractionStatus = z.infer<typeof DistractionAnalysisSchema>['distractionStatus'];

// Updated result type: motivationalText will now always be a string,
// potentially empty if not a distraction or if the LLM deems it so.
export type DistractionDeterminationResult = {
  isDistraction: DistractionStatus;
  motivationalText?: string;
};

type UserGoals = {
  weeklyGoal: string;
  dailyGoal: string;
  lifeGoal: string;
};

// Combined function to get distraction status and motivational text
const getDistractionAnalysis = async (
  userGoals: UserGoals,
  activeWindowDetails: ActiveWindowDetails
): Promise<DistractionDeterminationResult> => {
  const { ownerName, title, url, content, type, browser } = activeWindowDetails;
  const { weeklyGoal, dailyGoal, lifeGoal } = userGoals;

  if (isVeryLikelyProductive(activeWindowDetails)) {
    console.log(
      'Very likely productive, skipping analysis',
      activeWindowDetails.url || activeWindowDetails.title
    );

    return {
      isDistraction: 'no',
    };
  }

  // Truncate URL to keep prompt manageable
  const MAX_URL_LENGTH = 150;
  const truncatedUrl =
    url && url.length > MAX_URL_LENGTH ? `${url.slice(0, MAX_URL_LENGTH)}...` : url;

  const activityDetails = [
    ownerName && `Owner Name: ${ownerName}`,
    title && `Title: ${title}`,
    truncatedUrl && `URL: ${truncatedUrl}`,
    content && content.trim() !== '' && `Content Snippet: ${content.slice(0, 100)}...`,
    type && `Window Type: ${type}`,
    browser && `Browser Name: ${browser}`,
  ]
    .filter(Boolean)
    .join('\n    '); // Filter out null/undefined and join

  try {
    const response = await openai.responses.parse({
      model: 'gpt-4o-2024-08-06', // Using the latest model that supports Structured Outputs
      input: [
        {
          role: 'system',
          content:
            'You are an AI assistant helping users stay focused on their goals by analyzing their current activities.',
        },
        {
          role: 'user',
          content: `
            Analyze if the user's current activity is a distraction based on their goals.

            User Goals:
            - Life Goal (5-year vision): "${lifeGoal || 'Not set'}"
            - Weekly Goal: "${weeklyGoal || 'Not set'}"
            - Daily Goal: "${dailyGoal || 'Not set'}"

            User's Current Activity Details:
            ${activityDetails}

            Determine:
            1. If this activity is a distraction ("yes", "no", or "maybe")
            2. A concise, motivational message that either:
               - For distractions: Gently reminds them of their goals
               - For productive activities: Provides positive reinforcement
               - For unclear cases: Helps them reflect on the activity's value
          `,
        },
      ],
      text: {
        format: zodTextFormat(DistractionAnalysisSchema, 'distraction_analysis'),
      },
    });

    // If we don't get a parsed output, return a default response
    if (!response.output_parsed) {
      console.warn('No parsed output from OpenAI response');
      return {
        isDistraction: 'maybe',
        motivationalText: 'Unable to analyze this activity at the moment.',
      };
    }

    // Handle potential refusal
    if ('refusal' in response.output_parsed) {
      console.warn('Model refused to analyze activity:', response.output_parsed.refusal);
      return {
        isDistraction: 'maybe',
        motivationalText: 'Unable to analyze this activity at the moment.',
      };
    }

    // Map the response to our result type
    return {
      isDistraction: response.output_parsed.distractionStatus,
      motivationalText: response.output_parsed.motivationalMessage,
    };
  } catch (error) {
    console.error('Error analyzing distraction status:', error);
    return {
      isDistraction: 'maybe',
      motivationalText: 'Error analyzing activity. Please try again later.',
    };
  }
};

// determineDistraction now just wraps getDistractionAnalysis
export const determineDistraction = async (
  userGoals: UserGoals,
  activeWindowDetails: ActiveWindowDetails
): Promise<DistractionDeterminationResult> => {
  return getDistractionAnalysis(userGoals, activeWindowDetails);
};

// generateMotivationalText is now fully integrated and no longer exported separately.
