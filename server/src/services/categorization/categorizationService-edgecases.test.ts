import { afterEach, beforeEach, describe, jest, mock, test } from 'bun:test';
import mongoose from 'mongoose';
import { ActiveWindowDetails } from '../../../../shared/types';
import { assertCategorization } from './testUtils';

/*

This test file includes the following edge cases:

1. Stock portfolio as Distraction (if no Investing category exists)
2. Audiobook project negotiation as Distraction (rather than Growth & Marketing)
3. Browsing X/Twitter as Distraction (despite user goals mentioning X for outreach)
4. Brighter-related email as Brighter (rather than Other work)
5. Substack article on robotics as Work (when content is empty)

*/

// Mock Mongoose models and their methods
const mockActiveWindowEventModel = {
  findOne: jest.fn(),
};
const mockCategoryModel = {
  findById: jest.fn(),
  find: jest.fn(),
};
const mockUserModel = {
  findById: jest.fn(),
};

mock.module('../../models/activeWindowEvent', () => ({
  ActiveWindowEventModel: mockActiveWindowEventModel,
}));
mock.module('../../models/category', () => ({
  CategoryModel: mockCategoryModel,
}));
mock.module('../../models/user', () => ({
  UserModel: mockUserModel,
}));

const { categorizeActivity } = await import('./categorizationService');
const { ActiveWindowEventModel } = await import('../../models/activeWindowEvent');
const { CategoryModel } = await import('../../models/category');
const { UserModel } = await import('../../models/user');

describe('categorizeActivity edge cases', () => {
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function to create template categories
  const createTemplateCategories = (userId: string) => [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Coding',
      description: 'Writing or reviewing code, debugging, working in IDEs or terminals',
      color: '#3B82F6',
      isProductive: true,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Design',
      description: 'Working in design tools like Figma or Illustrator on UX/UI or visual assets',
      color: '#8B5CF6',
      isProductive: true,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Product Management',
      description: 'Planning features, writing specs, managing tickets, reviewing user feedback',
      color: '#10B981',
      isProductive: true,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Growth & Marketing',
      description: 'Working on campaigns, analytics, user acquisition, SEO or outreach',
      color: '#EAB308',
      isProductive: true,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Work Communication',
      description: 'Responding to emails, Slack, Notion, meetings or async updates',
      color: '#0EA5E9',
      isProductive: true,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Distraction',
      description: 'Scrolling social media, browsing unrelated content, or idle clicking',
      color: '#EC4899',
      isProductive: false,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Dating',
      description: 'Using dating apps, messaging, browsing profiles, or going on dates',
      color: '#F43F5E',
      isProductive: false,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Eating & Shopping',
      description: 'Eating meals, cooking, groceries, or online/in-person shopping',
      color: '#D97706',
      isProductive: false,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Sport & Health',
      description: 'Exercising, walking, gym, sports, wellness, etc.',
      color: '#6366F1',
      isProductive: true,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Friends & Social',
      description: 'Spending time with friends or socializing in person or online',
      color: '#A855F7',
      isProductive: false,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Planning & Reflection',
      description: 'Journaling, reflecting on goals, or reviewing personal plans',
      color: '#84CC16',
      isProductive: true,
      isDefault: false,
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      name: 'Commuting',
      description: 'Traveling to or from work, errands, or social events',
      color: '#6B7280',
      isProductive: false,
      isDefault: false,
    },
  ];

  test('should categorize viewing a stock portfolio as Distraction if no Investing category exists', async () => {
    // Arrange: Mock history check to fail, simulating the LLM pathway
    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const templateCategories = createTemplateCategories(mockUserId);

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        userProjectsAndGoals:
          "I'm working on Cronus - The ai time/distraction tracker software. I'm working on improving the app and getting the first few 1000 users. Might include going on reddit or X to post but most likely any x visit is a distraction.",
      }),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(templateCategories),
    });

    const ocrContent = `• public\nQ Search assets\nMarket closed & July 15\nSummary v\nSPY $621.04 * 0.60%\nQQQ $555.78 N 0.08%\nVXX $45.81 * 0.13%\nBitcoin $117,516.97 > 3.19%\nUST 6M —\n$38,026.42\n• -$562.40 (-1.46%) today ®\nReturn\nAllocation\nIncome\nAccount value\n1M\n3M\nAM\nYTD\nAll\nPortfolio\nAll\nOptions\nEquities\nEquities\nSANA\nCana Riotechnolodv\nLIDED\nUber\nCrunto\nRitcoin\nCrypto\nBonds\nCrypto\nPrice\n$4.20\n-$0.02 (-0.47%)\n¢01 01\n-$1.98 (-2.11%)\n$117,515.69\n+$33.77 (+0.03%)\nHoldings\n$39,907.13\n0501 60702 chares\n$919.10\n10 shares\nCost\n$32,472.09\n42 42/chare\n$906.29\n$90.63/share\n$15,890.50\n0.13522022 BTC\nopted by Bays co\n$16,228.26\nPoritolle\nInvest v\nMargin buying power $3,662.41 v\nBrokerage =\nUpdates\nMargin call warning\nYour account was recently within 10% of vour\nmargin maintenance requirement.\nResolve\nComplete your options account\nnahle antions tradina to lock in vour trading\nrebate, plus unlock dozens of educational videos\nand articles.\nFinish enabling\nPublic Premium is almost yours\nAccess in-depth analysis, enhanced trading\nfeatures. and VIP customer service\nUpgrade now\n< 1 of 4 >\nCustomize o\n1D return\n-0.47%\n-$190.03\n-2.11%\n- $19.80\nUnrealized return\n+37.80%\n+1.41%\n+$12.81\n+0.03%\n1e4C7\n-2.08%\n-$337.76`;

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Portfolio',
      title: 'Portfolio - Public.com',
      url: 'https://public.com/portfolio',
      content: ocrContent,
      type: 'browser', // changed from 'website' to 'browser' to match allowed types
      browser: null,
    };

    // Act
    const result = await categorizeActivity(mockUserId, activeWindow);

    // Assert
    assertCategorization({
      testName: 'Stock portfolio test',
      result,
      allCategories: templateCategories,
      expectedCategoryName: 'Distraction',
    });
  });

  test('should categorize audiobook project negotiation as Distraction rather than Growth & Marketing', async () => {
    // Arrange: Mock history check to fail, simulating the LLM pathway
    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const templateCategories = createTemplateCategories(mockUserId);

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        userProjectsAndGoals:
          "I'm working on Cronus - The ai time/distraction tracker software. I'm working on improving the app and getting the first few 1000 users. Might include going on reddit or X to post but most likely any x visit is a distraction.",
      }),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(templateCategories),
    });

    const audiobookContent = `Audiobook Translation Rights Inquiry v
• More "mit der Tür ins Haus" friendly
The email now focuses on gauging interest rather than making a formal request, which
should feel less overwhelming for someone who doesn't know you yet.
M Okay, but this is extremely short. I do like that you abbreviated Bol etc. Let's also mention
that I was extremely excited and immediately read the German version when it came out. In
the second paragraph, let's mention that I would it's my initiative what I want to lead the
project, which I don't think is apparent here from this text. But yeah, keep it very concise.
Revised Email to David Deutsch
Document • Version 2
Dear David,
n0S 50 0x29 BoT 1n 2021,
I've added the detail about your excitement for the German version and clarified that this is
your personal initiative that you want to lead. Still kept it concise while making your passion
and ownership clear!
ok now it sounds weirdly explicit/redundant/akward. I think that came more natural in the
first version
Revised Email to David Deutsch
Document • Version 3
Dear David
You're right - "I'd want to lead this project myself" flows much more naturally than the
redundant "This is my initiative - I want to lead the project myself." Much cleaner now!
Retry v
Claude can make mistakes. Please double-check responses.`;

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Claude',
      title: 'Audiobook Project Negotiation Challenges - Claude',
      url: 'https://claude.ai/chat/7a8acbe1-0cc3-4b5b-ae85-39cfabd97398',
      content: audiobookContent,
      type: 'browser',
      browser: 'chrome',
    };

    // Act
    const result = await categorizeActivity(mockUserId, activeWindow);

    // Assert
    assertCategorization({
      testName: 'Audiobook test',
      result,
      allCategories: templateCategories,
      expectedCategoryName: 'Distraction',
    });
  }, 30000); // Increased timeout for LLM call

  test('should categorize browsing X/Twitter as Distraction despite user goals mentioning X for outreach', async () => {
    // Arrange: Mock history check to fail, simulating the LLM pathway
    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const templateCategories = createTemplateCategories(mockUserId);

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        userProjectsAndGoals:
          "I'm working on Cronus - The ai time/distraction tracker software. I'm working on improving the app and getting the first few 1000 users. Might include going on reddit or X to post but most likely any x visit is a distraction.",
      }),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(templateCategories),
    });

    const xContent = `i Home
• Explore
Notifications
• Messages
• Grok
X Premium
Lists
Bookmarks
Jobs
¿ Communities
ty Verified Orgs
¿ Profile
More
Post
For you
Following
Al
frontier 2022
Machine Learning
Accelera
Q Search
• What's happening?
Post
Show 31 posts
Michael Truell € 0 @mntruell • Jul 15
g...
A conversation with @patrickc on old programming languages, software at
industrial scale, and Al's effect on economics/biology/Patrick's daily life.
00:15 - Why Patrick wrote his first startup in Smalltalk
03:35 - LISP chatbots
06:09 - Good ideas from esoteric programming
Show more
09210111
27:18 / 50:15
72
17 185
• 1.8K
Ill 206K
Today's News
→
Trump Denounces Epstein Files as 'Hoax' Amid Calls for
Transparency
5 hours ago • News • 236K posts
Trump Announces Coca-Cola to Use Cane Sugar in US
3 hours ago • News • 59K posts
Senate Debates Defunding NPR and PBS
7 hours ago • News • 90K posts
Show more
Norgard + @BrianNorgard • 5h
Reasonable people don't build successful companies.
• 15.
179
© 154
Ill 9.1K
Get Free Ad Credit
Upgrade to Verified Organizations to get free
ad credit & a suite of business growth tools.
Learn more
Upgrade to Premium+
Enjoy additional benefits, zero ads and the
largest reply prioritization.
Upgrade to Premium+
Your Premium subscription is
expiring!
Keep the best of X. Blue checkmark, Reply
boost, increased Grok limits and much more.
7 Renew subscription
What's happening
Politics • Trending
#EpsteinClientList
11.6K posts
..
Trending in United States
azzi fudd
...
Politics • Trending
Maurene Comey
28.8K posts
..
Show more
Who to follow
Ely Hahami &
@ElyHahami
Follow
Sarah Wang &
@sarahdingwang
Follow
Psyho
@FakePsyho
Follow
Show more
Terms of Service Privacy Policy Cookie Policy ||
Accessibility | Adsinfo | More... © 2025 X Corp.`;

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'X',
      title: 'Home / X',
      url: 'https://x.com/home',
      content: xContent,
      type: 'browser',
      browser: 'chrome',
    };

    // Act
    const result = await categorizeActivity(mockUserId, activeWindow);

    // Assert
    assertCategorization({
      testName: 'X browsing test',
      result,
      allCategories: templateCategories,
      expectedCategoryName: 'Distraction',
    });
  }, 30000); // Increased timeout for LLM call

  test('should categorize Brighter-related email as Brighter rather than Other work', async () => {
    // Arrange: Mock history check to fail, simulating the LLM pathway
    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    // Simon's actual categories
    const simonCategories = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Other work',
        description:
          'Other coding projects, misc life admin, personal email (sberensnyc@gmail.com), random chatgpt',
        color: '#22C55E',
        isProductive: true,
        isDefault: true,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Distraction',
        description:
          'Looking at tasks and work-unrelated sites like scrolling social media, playing games, random googling, substacks (except if it is directly work-related)',
        color: '#EC4899',
        isProductive: false,
        isDefault: true,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Health',
        description:
          'Function health, nucleus, one medical, circle health, exercising, gym, blood tests, cooking, food related things, forkable, doordash, chatgpt (related to health)',
        color: '#6366F1',
        isProductive: true,
        isDefault: false,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Brighter',
        description:
          'Brighter lamp company, company emails (simon@getbrighter.co), chatgpt (related to brighter), firmware, whatsapp (with feston or eric beam or ravi), digikey, mouser, notion',
        color: '#F97316',
        isProductive: true,
        isDefault: false,
      },
    ];

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        userProjectsAndGoals:
          "I have 3 main goals: 1. sell my lighting brand (Brighter) which makes the world's brightest floor lamp 2. learn ML so I can get a job at a big lab 3. Fix/improve my health so I have more energy, focus, and stamina in my work",
      }),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(simonCategories),
    });

    const emailContent = `BB Mail Chat Meet M Tradewinds <> Brighter Lamp Current Order | McMaster-Cal X 2 Simon Berens - Calendar - We X + → mail.google.com/mail/u/0/#inbox/FMfcgzQZTVmrvkwzMJbcHDDXPJMVISWQ Accounting Gmail / Compose Inbox Starred Snoozed Sent Drafts More Labels v More + Search mail Jacob Dinkins Director of Business Development 317-381-1167 - Cell jdinkins@tradewinds.net| www.tradewinds.net Book time with Jacob Dinkins: 30 minutes From: Simon Berens <simon@getbrighter.co> Sent: Tuesday, July 1, 2025 5:12 PM ..• [Message clipped] View entire message One attachment • Scanned by Gmail © por Get.Brighter.pdf 245 KB| 4 Here you go. Thanks, you too! Have a great weekend too! 4 Reply « Reply all → Forward • Active v | Ca Work Google S 5 of 872 +`;

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Google Chrome',
      title: 'Tradewinds <> Brighter Lamp - simon@getbrighter.co - Simon Berens Mail',
      url: 'https://mail.google.com/mail/u/0/#inbox/FMfcgzQZTVmrvkwzMJbcHDDXPJMVlSWQ',
      content: emailContent,
      type: 'browser',
      browser: 'chrome',
    };

    // Act
    const result = await categorizeActivity(mockUserId, activeWindow);

    // Assert
    assertCategorization({
      testName: 'Brighter email test',
      result,
      allCategories: simonCategories,
      expectedCategoryName: 'Brighter',
    });
  }, 30000); // Increased timeout for LLM call

  test('should categorize substack article on robotics as Work when content is empty', async () => {
    // Arrange: Mock history check to fail, simulating the LLM pathway
    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    const dominiqueCategories = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Work',
        description:
          'Writing/editing code, reading, documentation, work-related articles, github repos, looking at AWS, deployment setups, google docs, Figma',
        color: '#22C55E',
        isProductive: true,
        isDefault: true,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: mockUserId,
        name: 'Distraction',
        description:
          'Looking at tasks and work-unrelated sites like scrolling social media, playing games, random googling (except if it is directly work-related)',
        color: '#EC4899',
        isProductive: false,
        isDefault: true,
      },
    ];

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        userProjectsAndGoals:
          "I'm working on a chess robot. Part of the work is writing code, collecting data, but also reading papers and blog posts online. Twitter/X is not work. Writing blog posts about robots or taking notes in Notion counts as work. ",
      }),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(dominiqueCategories),
    });

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Arc',
      title: '(1) How to Pick a Problem - by Benjie Holson - General Robots',
      url: 'https://generalrobots.substack.com/p/how-to-pick-a-problem',
      content: '', // Testing with empty content
      type: 'browser',
      browser: 'arc',
    };

    // Act
    const result = await categorizeActivity(mockUserId, activeWindow);

    // Assert
    assertCategorization({
      testName: 'Substack test',
      result,
      allCategories: dominiqueCategories,
      expectedCategoryName: 'Work',
    });
  }, 30000);
});
