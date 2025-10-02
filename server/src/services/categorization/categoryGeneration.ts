import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const openai = new OpenAI(); // Ensure OPENAI_API_KEY is set

export const SuggestedCategorySchema = z.object({
  name: z.string(),
  description: z.string(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  isProductive: z.boolean(),
  emoji: z.string().describe('A single emoji to represent the category.'),
});

export const SuggestedCategoriesSchema = z.object({
  categories: z.array(SuggestedCategorySchema),
});

function _buildOpenAICategorySuggestionPromptInput(userProjectsAndGoals: string) {
  return [
    {
      role: 'system' as const,
      content: `You are an AI assistant that helps users create personalized productivity categories based on their goals.

You will be given a user's goals and a list of template categories.
Your task is to generate a list of 3-5 relevant categories tailored to the user's specific goals. For each category, you must suggest a name, description, color, a boolean for isProductive, and a single emoji.

IMPORTANT: Prefer using the provided template categories when they broadly cover an activity. Only create a new category if no template is a good fit.

Instructions details:
- If a user's goal is to "build the windows version of the app", the existing "Coding" category is a better choice than creating a new, highly specific "Windows Development" category.
- No need to only use the default categories. For ex. if someone says they have drawing as a hobby, they might need a "Drawing" category (in that case we dont use the "Design" category).
- If a user is a "CPA", they might need new categories like "Bookkeeping", "Tax", and "Consulting", since these are not in the template list.
- Don't litterally use XYZ but fill in the name of the specific company, project, client, etc.
- We already add a "Distraction" and a "Friends & Social" category, so no need to add them as part of your 3-5 categories.

Here are some good default categories that work for many people:
- name: Work Communication, description: Responding to emails, Slack, Notion, meetings or async updates, emoji: 💬, isProductive: true
- name: Contracting for XYZ, description: Working on a project for Contractor work for XYZ including meetings, emails, etc. related to that project
- name: Planning & Reflection, description: Journaling, reflecting on goals, or reviewing personal plans, emoji: 📝, isProductive: true

- name: Coding, description: Writing or reviewing code, debugging, working in IDEs or terminals, emoji: 💼, isProductive: true
- name: Design, description: Working in design tools like Figma or Illustrator on UX/UI or visual assets, emoji: 🎨
- name: Product Management, description: Planning features, writing specs, managing tickets, reviewing user feedback, emoji: 📈, isProductive: true
- name: Fundraising, description: Pitching to investors, refining decks, writing emails or grant applications, emoji: 💰, isProductive: true
- name: Growth & Marketing, description: Working on campaigns, analytics, user acquisition, SEO or outreach, emoji: 🚀, isProductive: true
- name: Dating, description: Using dating apps, messaging, browsing profiles, or going on dates, emoji: ❤️, isProductive: false
- name: Eating & Shopping, description: Eating meals, cooking, groceries, or online/in-person shopping, emoji: 🍔, isProductive: false
- name: Sport & Health, description: Exercising, walking, gym, sports, wellness, etc., emoji: 💪, isProductive: true
- name: Commuting, description: Traveling to or from work, errands, or social events, emoji: 🚗, isProductive: false

For the color, use Notion-style color like #3B82F6, #A855F7, #F97316, #CA8A04, #10B981, #06B6D4, #6B7280, #8B5CF6, #D946EF, #F59E0B, #22C5E, etc. (Don't use #EC4899)

Respond with a list of suggested categories in the format requested.`,
    },
    {
      role: 'user' as const,
      content: `
USER'S PROJECTS AND GOALS:
${userProjectsAndGoals}

TASK:
Generate a list of 3-5 personalized categories based on the user's goals.
`,
    },
  ];
}

export async function getOpenAICategorySuggestion(
  userProjectsAndGoals: string
): Promise<z.infer<typeof SuggestedCategoriesSchema> | null> {
  const promptInput = _buildOpenAICategorySuggestionPromptInput(userProjectsAndGoals);
  try {
    const response = await openai.responses.parse({
      model: 'gpt-5-nano',
      temperature: 0,
      input: promptInput,
      text: {
        format: zodTextFormat(SuggestedCategoriesSchema, 'suggested_categories'),
      },
    });

    if (!response.output_parsed || 'refusal' in response.output_parsed) {
      console.warn('OpenAI response issue or refusal selecting category:', response.output_parsed);
      return null;
    }

    const distractionCategory = {
      name: 'Distraction',
      description: 'Scrolling social media, browsing unrelated content, or idle clicking',
      color: '#EC4899',
      emoji: '🎮',
      isProductive: false,
    };

    const friendsAndSocialCategory = {
      name: 'Friends & Social',
      description: 'Spending time with friends or socializing in person or online',
      color: '#A855F7',
      emoji: '🎉',
      isProductive: false,
    };

    // Filter out any "Distraction" category that might have been generated by the LLM
    const filteredCategories = response.output_parsed.categories.filter(
      (category) => category.name.toLowerCase() !== 'distraction'
    );

    // Add our standardized "Distraction" category
    const finalCategories = {
      categories: [...filteredCategories, distractionCategory, friendsAndSocialCategory],
    };

    return finalCategories;
  } catch (error) {
    console.error('Error getting OpenAI category choice:', error);
    return null;
  }
}
