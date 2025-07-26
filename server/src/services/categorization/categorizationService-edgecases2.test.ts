import { afterEach, beforeEach, describe, jest, mock, test } from 'bun:test';
import { ActiveWindowDetails } from '../../../../shared/types';
import { assertCategorization } from './testUtils';

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

// Use mock.module to replace the actual models with our mocks
mock.module('../../models/activeWindowEvent', () => ({
  ActiveWindowEventModel: mockActiveWindowEventModel,
}));
mock.module('../../models/category', () => ({
  CategoryModel: mockCategoryModel,
}));
mock.module('../../models/user', () => ({
  UserModel: mockUserModel,
}));

// Import the service AFTER mocks are set up
const { categorizeActivity } = await import('./categorizationService');
const { ActiveWindowEventModel } = await import('../../models/activeWindowEvent');
const { CategoryModel } = await import('../../models/category');
const { UserModel } = await import('../../models/user');

describe('categorizationService edge cases for Noah', () => {
  const mockUserId = '68813203fe67354fd3c7ed69';

  const noahUser = {
    _id: mockUserId,
    name: 'Noah Glanz',
    userProjectsAndGoals:
      'Juristische Arbeit, Schriftsatzerstellung, Recherche u.ä. Daneben Lernen für das juristische Referendariat. Außerdem Kommunikation mit Gästen in mehreren Airbnb/Booking.com-Wohnungen (Nebenjob).',
  };

  const noahCategories = [
    {
      _id: '6881329948a884740ed087c3',
      userId: mockUserId,
      name: 'Juristische Arbeit',
      description:
        'Arbeiten an juristischen Dokumenten, Schriftsatzerstellung und rechtliche Recherchen.',
      isProductive: true,
    },
    {
      _id: '6881329948a884740ed087c4',
      userId: mockUserId,
      name: 'Lernen für das Referendariat',
      description: 'Vorbereitung und Lernen für das juristische Referendariat.',
      isProductive: true,
    },
    {
      _id: '6881329948a884740ed087c5',
      userId: mockUserId,
      name: 'Planung & Reflexion',
      description: 'Journaling, Reflexion über Ziele oder Überprüfung persönlicher Pläne.',
      isProductive: true,
    },
    {
      _id: '6881329948a884740ed087c6',
      userId: mockUserId,
      name: 'Distraction',
      description: 'Scrolling social media, browsing unrelated content, or idle clicking',
      isProductive: false,
    },
    {
      _id: '6881e734b113c0f5ca6bf806',
      userId: mockUserId,
      name: 'Airbnb & Booking.com Verwaltung',
      description:
        'Kommunikation mit Gästen, Reinigungskräften etc. Verwaltung der Wohnungen über Hospitable.com',
      isProductive: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (ActiveWindowEventModel.findOne as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(noahUser),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(noahCategories),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should categorize searching for a washing machine for an Airbnb as productive', async () => {
    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Safari',
      title: 'Waschmaschinen online bestellen: Top Angebote',
      url: 'https://www.mediamarkt.de/de/category/waschmaschinen-3.html',
      content:
        'BON: mediamarkt.de @ Uni v juris beck-online # MyElsewhere v Claude • Effie Maakt | Hospitable.com = Guest Happiness Manual / Help List - Google Docs + Waschmaschinen online bestellen: Top Angebote',
      type: 'browser',
      browser: 'safari',
    };

    const result = await categorizeActivity(mockUserId, activeWindow);
    assertCategorization({
      testName: 'Washing machine test',
      result,
      allCategories: noahCategories,
      expectedCategoryName: 'Airbnb & Booking.com Verwaltung',
    });
  }, 30000);

  test('should categorize hospitable.com dashboard as productive', async () => {
    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Safari',
      title: 'Properties: All ',
      url: 'https://my.hospitable.com/properties/segments/default',
      content:
        'hospitable Inbox Properties Calendar Guest Experience 14 Operations Direct Properties New Properties Muted Properties Room Types All Entire Home Shared Room Private Room Tag • Properties: All | Hospitable.com All Group identical listings into a property on Hospitable by merging them, or configure parent-child relationships between your properties.',
      type: 'browser',
      browser: 'safari',
    };

    const result = await categorizeActivity(mockUserId, activeWindow);
    assertCategorization({
      testName: 'Hospitable test',
      result,
      allCategories: noahCategories,
      expectedCategoryName: 'Airbnb & Booking.com Verwaltung',
    });
  }, 30000);

  test('should categorize Pinterest browsing for a designer as productive', async () => {
    const designerUser = {
      ...noahUser,
      userProjectsAndGoals:
        'Im a medical student, studying for the MCAT. I also have a side-hustle where I do brand design for small businesses.',
    };
    const designerCategories = [
      {
        _id: 'cat1',
        userId: mockUserId,
        name: 'Medical Studies',
        description: 'Studying for medical school, attending lectures, reading textbooks.',
        isProductive: true,
      },
      {
        _id: 'cat2',
        userId: mockUserId,
        name: 'Brand Design Work',
        description: 'Creating logos, design research, and working on client brand identities.',
        isProductive: true,
      },
      {
        _id: 'cat3',
        userId: mockUserId,
        name: 'MCAT Prep',
        description: 'Focused study sessions for the MCAT exam.',
        isProductive: true,
      },
      {
        _id: 'cat4',
        userId: mockUserId,
        name: 'Client Communication',
        description: 'Emails, calls, and meetings with design clients.',
        isProductive: true,
      },
      {
        _id: 'cat5',
        userId: mockUserId,
        name: 'Distraction',
        description: 'Unrelated browsing, social media, etc.',
        isProductive: false,
      },
      {
        _id: 'cat6',
        userId: mockUserId,
        name: 'Social Media',
        description: 'Personal social media use on Instagram, Twitter, etc.',
        isProductive: false,
      },
    ];

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(designerUser),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(designerCategories),
    });

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Safari',
      title: 'Minimalist Cafe Aesthetic | Pinterest',
      url: 'https://www.pinterest.com/search/pins/?q=minimalist%20cafe%20aesthetic',
      content: 'Pins on minimalist cafe design, branding, and decor.',
      type: 'browser',
      browser: 'safari',
    };

    const result = await categorizeActivity(mockUserId, activeWindow);
    assertCategorization({
      testName: 'Designer Pinterest test',
      result,
      allCategories: designerCategories,
      expectedCategoryName: 'Brand Design Work',
    });
  }, 30000);

  test('should categorize reading a scientific paper for an architect as productive', async () => {
    const architectUser = {
      ...noahUser,
      userProjectsAndGoals:
        "I'm an architect designing sustainable, eco-friendly buildings. I also write a weekly newsletter about the future of cities.",
    };
    const architectCategories = [
      {
        _id: 'arc1',
        userId: mockUserId,
        name: 'Architectural Design',
        description:
          'Creative work, drafting, modeling, and working on sustainable building designs.',
        isProductive: true,
      },
      {
        _id: 'arc2',
        userId: mockUserId,
        name: 'Newsletter Writing',
        description: 'Writing and editing content for the "Future of Cities" newsletter.',
        isProductive: true,
      },
      {
        _id: 'arc3',
        userId: mockUserId,
        name: 'Client Meetings',
        description: 'Calls, video conferences, and in-person meetings with clients.',
        isProductive: true,
      },
      {
        _id: 'arc4',
        userId: mockUserId,
        name: 'Building Code Research',
        description: 'Researching and reviewing local and national building codes.',
        isProductive: true,
      },
      {
        _id: 'arc5',
        userId: mockUserId,
        name: 'Distraction',
        description: 'Unrelated browsing, news, etc.',
        isProductive: false,
      },
    ];

    (UserModel.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(architectUser),
    });
    (CategoryModel.find as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(architectCategories),
    });

    const activeWindow: Pick<
      ActiveWindowDetails,
      'ownerName' | 'title' | 'url' | 'content' | 'type' | 'browser'
    > = {
      ownerName: 'Safari',
      title: 'Advancements in Solar Panel Efficiency | MIT Technology Review',
      url: 'https://www.technologyreview.com/2023/10/25/1082202/breakthrough-could-push-solar-panels-past-the-limits-of-silicon/',
      content:
        'A new perovskite-based solar cell has achieved record efficiency, paving the way for more powerful and sustainable energy solutions.',
      type: 'browser',
      browser: 'safari',
    };

    const result = await categorizeActivity(mockUserId, activeWindow);
    assertCategorization({
      testName: 'Architect paper test',
      result,
      allCategories: architectCategories,
      expectedCategoryName: 'Architectural Design',
    });
  }, 30000);
});
