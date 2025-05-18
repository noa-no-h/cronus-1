import { Button } from '@/components/ui/button';
import { JSX } from 'react';

export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  content: JSX.Element;
}

// Notes on what to write about in the future (don't delete this)
// - the insights of hiring contributors https://philipwalton.com/articles/how-to-find-qualified-developers/ 
// - mention passive sourcing

export const blogPosts: BlogPostMetadata[] = [
  {
    slug: 'best-engineering-recruiting-resources',
    title: 'Essential Resources for Engineering Recruiting and Sourcing',
    description: 'Unlock the secrets of elite technical recruiting with these game-changing resources and strategies',
    date: '2024-03-19',
    author: 'Team',
    content: <>
      <h2>Introduction</h2>
      <p>
        Building a strong engineering team requires more than just good intentions—it requires 
        a systematic approach and proven methodologies. We've curated some of the most valuable 
        resources that can help you develop and refine your technical recruiting strategy.
      </p>

      <h2>Startup Hiring 101: The Gem Founder's Guide</h2>
      <p>
        One of the most comprehensive resources for early-stage startups is the 
        <a href="https://www.notion.so/Startup-Hiring-101-A-Founder-s-Guide-946dad6dd9fd433abdd12338a83e931f" 
        target="_blank" rel="noopener noreferrer"> Startup Hiring 101 guide</a> by Steve Bartel, 
        CEO of Gem. This guide is particularly valuable for:
      </p>
      <ul>
        <li>Founders and founding teams new to hiring</li>
        <li>Hiring managers at fast-growing startups</li>
        <li>Teams that have raised funding and are ready to scale</li>
      </ul>
      <p>
        The guide provides practical, actionable advice on:
      </p>
      <ul>
        <li>Leveraging your network effectively for candidate sourcing</li>
        <li>Conducting effective pre-sell conversations</li>
        <li>Structuring interviews and debriefs</li>
        <li>Closing candidates successfully</li>
      </ul>

      <h2>The A Method for Hiring</h2>
      <p>
        "Who: The A Method for Hiring" presents a systematic approach to hiring that has been 
        validated through extensive research, including:
      </p>
      <ul>
        <li>1,300 hours of interviews with hundreds of executives</li>
        <li>Conversations with 20 billionaires and Fortune 500 CEOs</li>
        <li>A proven 90% success rate in hiring</li>
      </ul>
      <p>
        This method, developed by ghSMART, has been endorsed by leaders of companies like 
        Citadel Investment Group, H.J. Heinz Corporation, and The Blackstone Group. It offers 
        a simple 4-step process for hiring the right people, helping organizations avoid costly 
        hiring mistakes that can cost up to $1.5M per misfire.
      </p>
      <p>
        You can learn more about this methodology at <a href="https://whothebook.com/" 
        target="_blank" rel="noopener noreferrer">whothebook.com</a>.
      </p>

      <h2>Essential Blog Posts from Industry Leaders</h2>
      <p>
        Some of the most valuable insights come from founders and engineering leaders who have 
        built successful teams from scratch. Here are two must-read articles on engineering sourcing:
      </p>

      <h3>Plaid's Outbound Sourcing Playbook</h3>
      <p>
        Zach Perret, co-founder of Plaid, shares his experience of sending over 2,000 outbound 
        sourcing emails personally. His <a href="https://zachperret.com/sourcing/" 
        target="_blank" rel="noopener noreferrer">detailed guide</a> covers:
      </p>
      <ul>
        <li>Best channels for identifying candidates (LinkedIn, GitHub, AngelList)</li>
        <li>Effective email outreach strategies</li>
        <li>The importance of personalization and follow-ups</li>
        <li>Why founders and engineering managers should be involved in sourcing</li>
      </ul>
      <p>
        A key insight from Perret is that outbound sourcing, when done correctly, can generate 
        a consistent, high-quality candidate pool to serve as the baseline for your recruiting pipeline.
      </p>

      <h3>The Science of Sourcing</h3>
      <p>
        Jocelyn Goldfein, former engineering leader at Facebook, VMware and current Managing Director at Zetta Venture Partners, provides a 
        comprehensive <a href="https://jocelyngoldfein.com/how-to-hire-engineers-step-1-sourcing-f388fddc63fd" 
        target="_blank" rel="noopener noreferrer">framework for understanding sourcing</a>. Her article offers:
      </p>
      <ul>
        <li>A clear explanation of the "qualified vs. available" candidate pool challenge</li>
        <li>Why referrals are the most effective sourcing technique</li>
        <li>How to maximize your network for sourcing</li>
        <li>The mathematics of passive sourcing and why timing matters</li>
      </ul>
      <p>
        Goldfein emphasizes that recruiting is worth a significant share of your time and effort 
        because building a better team is more than a competitive advantage—it's a matter of 
        survival for small companies.
      </p>

      <a href="/login" className="flex justify-center no-underline">
        <Button className="text-center mt-8">
          Start sourcing better engineers today
        </Button>
      </a>
    </>,
  },
  {
    slug: 'finding-good-sourcing-repos',
    title: 'Finding the Best GitHub Repositories for Technical Sourcing',
    description: 'Master the art of discovering hidden engineering talent through strategic repository hunting',
    date: '2024-03-19',
    author: 'Team',
    content: <>
      <h2>Introduction</h2>
      <p>
        When it comes to technical sourcing, finding the right GitHub repositories is crucial. 
        The repository you choose will determine the quality and relevance of the developers 
        you'll discover. Here's our guide on how to find the perfect repositories for your 
        sourcing needs.
      </p>

      <h2>Using AI-Powered Search</h2>
      <p>
        One powerful approach is using AI-powered search engines like Exa.ai. Let's walk through 
        an example: suppose you're working on a benchmarking and evaluation platform. You could 
        search for:
      </p>
      <blockquote className="bg-gray-50 dark:bg-gray-800 p-4 my-4 border-l-4 border-gray-200 dark:border-gray-700">
        "ai evaluation platform github project with tons of github stars"
      </blockquote>
      <p>
        i.e. <a href="https://search.exa.ai/search?q=ai+evaluation+platform+github+project+with+tons+of+github+stars" target="_blank" rel="noopener noreferrer">
          https://search.exa.ai/search?q=ai+evaluation+platform+github+project+with+tons+of+github+stars
        </a>
      </p>
      <p>
        This search will help you discover popular repositories in your domain, complete with 
        their star counts and contributor information.
      </p>

      <h2>GitHub's Advanced Search</h2>
      <p>
        GitHub's native search is another powerful tool, especially when you want to filter by 
        specific programming languages. For instance, if you're building a knowledge management 
        application like Remnote, you might search for:
      </p>
      <p>   
        <a href="https://github.com/search?q=knowledge+management+language%3ATypeScript&type=repositories&l=TypeScript&s=stars&o=desc" target="_blank" rel="noopener noreferrer">
          https://github.com/search?q=knowledge+management+language%3ATypeScript&type=repositories&l=TypeScript&s=stars&o=desc
        </a>
      </p>
      <p>
        This search query specifically targets TypeScript projects in the knowledge management 
        space, sorted by stars to find the most popular ones.
      </p>

      <h2>Tips for Evaluating Repositories</h2>
      <ul>
        <li>Look for repositories with active maintenance (recent commits)</li>
        <li>Check the number of contributors - larger teams often mean more potential candidates</li>
        <li>Review the quality of documentation - well-documented projects often attract skilled developers</li>
        <li>Examine the complexity of the codebase - this can indicate the expertise level of contributors</li>
      </ul>

      <h2>Next Steps</h2>
      <p>
        Once you've found promising repositories, you can use our tool to analyze the contributors, 
        filtering by criteria like:
      </p>
      <ul>
        <li>Programming language expertise</li>
        <li>Contribution frequency</li>
        <li>Account age and activity</li>
        <li>Number of followers</li>
      </ul>
      <p>
        This targeted approach helps you find developers who not only have the technical skills 
        you need but are also actively engaged in projects similar to yours.
      </p>
      <a href="/login" className="flex justify-center no-underline">
        <Button className="text-center mt-8">
            Start sourcing the best engineers
        </Button>
      </a>
    </>,
  },
  {
    // tutorial post on how to use the tool to source engineers
    slug: 'how-to-use-githire',
    title: 'How to Use GitHire to Source Engineers',
    description: 'Transform your hiring pipeline with our battle-tested strategies for finding exceptional engineers',
    date: '2024-03-19',
    author: 'Team',
    content: <>
      <h2>Introduction</h2>
      <p>
        GitHire helps you find and connect with talented engineers through their open source contributions. 
        Here's a quick guide on how to integrate it into your hiring pipeline.
      </p>

      <h2>1. Find Relevant Repositories</h2>
      <p>
        Start by identifying GitHub repositories that align with your technical needs. Check out our guide on <a href="/blog/finding-good-sourcing-repos">finding the best GitHub repositories for technical sourcing</a> for 
        detailed strategies. The key is to find repositories that:
      </p>
      <ul>
        <li>Use similar technologies to your stack</li>
        <li>Solve problems in your domain</li>
        <li>Have active maintenance and contributions</li>
      </ul>

      <h2>2. Use GitHire to Identify Candidates</h2>
      <p>
        Once you have your target repositories:
      </p>
      <ul>
        <li>Enter the repository URLs into GitHire</li>
        <li>Filter contributors by contribution frequency, impact, and expertise</li>
        <li>Review their other open source work and activity patterns</li>
        <li>Export the filtered list as a CSV for your outreach campaign</li>
      </ul>

      <h2>3. Multi-Channel Outreach</h2>
      <p>
        For better response rates, use a multi-channel approach:
      </p>
      <ul>
        <li>Import the CSV into your email sequencing tool (like Gem.com)</li>
        <li>If the candidate is active on X/Twitter, send a friendly DM (especially effective if you have mutual connections)</li>
        <li>Consider GitHub interactions (starring their repositories or commenting on issues) to warm up the conversation</li>
      </ul>

      <h2>4. Personalize Your Outreach</h2>
      <p>
        Create personalized email sequences that show you've done your homework:
      </p>
      <ul>
        <li>Reference their specific open source activity</li>
        <li>Mention what you like about their work, writing, or something else that connects the two of you</li>
        <li>Connect their work to the problems you're solving</li>
        <li>Keep the initial message brief but personal</li>
      </ul>

      <p>
        Example template:
      </p>
      <blockquote className="bg-gray-50 dark:bg-gray-800 p-4 my-4 border-l-4 border-gray-200 dark:border-gray-700">
        Hi [Name],<br/><br/>
        I noticed your contributions to [Repository], particularly your work on [specific feature/fix]. 
        Your approach to [technical challenge] caught my attention.<br/><br/>
        We're tackling similar challenges at [Company], specifically [brief problem description]. 
        Would you be open to a quick chat about what we're building?<br/><br/>
        Best,<br/>
        [Your name]
      </blockquote>

      <h2>Next Steps</h2>
      <p>
        Ready to start sourcing? Sign up for GitHire to access our repository analysis tools and start 
        building your candidate pipeline.
      </p>

      <a href="/login" className="flex justify-center no-underline">
        <Button className="text-center mt-8">
          Start sourcing engineers with GitHire
        </Button>
      </a>
    </>,
  },
  {
    // What to look for when sourcing engineers for your startup
    slug: 'what-to-look-for-when-sourcing-engineers-for-your-startup',
    title: 'What to Look for When Sourcing Engineers for Your Startup',
    description: 'Discover the unconventional traits that separate 10x engineers from the rest - and how to spot them',
    date: '2024-03-19',
    author: 'Team',
    content: <>
      <h2>Introduction</h2>
      <p>
        When building a startup, the quality of your early engineering hires can make or break your company. 
        Here's what to look for when sourcing engineers for your startup.
      </p>

      <h2>Focus on Undiscovered Talent</h2>
      <p>
        Peter Thiel, co-founder of PayPal and Palantir, emphasizes that startups must focus on hiring undiscovered 
        talent rather than proven individuals. This approach is not just a preference—it's a necessity, as larger 
        companies can easily outbid startups for known talent.
      </p>
      <p>
        This means we neglect traditional signals like Ivy League degrees and previous experience in very successful companies. Open source contributions are a good signal because they are not indexed on traditional platforms like LinkedIn or Wellfound. You can use tools like GitHire to find these candidates.
      </p>
      <a href="/login" className="flex justify-center no-underline">
        <Button className="text-center">
            Start sourcing the best engineers
        </Button>
      </a>
      <p>
        Instead, we focus on the following:
      </p>
      <ul>
        <li>Potential skill rather than existing skill</li>
        <li>Intelligence and learning ability over specific training</li>
        <li>Unique perspectives and approaches to problem-solving</li>
      </ul>
      <p>
        This strategy allows startups to build differentiated teams without paying exorbitant compensation packages 
        that larger companies can offer.
      </p>
      <p>
        Source: <a href="https://podcastnotes.org/starting-greatness-with-mike-maples/keith-rabois-starting-greatness-mike-maples-peter-thiel-jack-dorsey/" 
        target="_blank" rel="noopener noreferrer">Starting Greatness Podcast with Keith Rabois</a>
      </p>

      <h2>Hire for Problem-Obsession</h2>
      <blockquote className="bg-gray-50 dark:bg-gray-800 p-4 my-4 border-l-4 border-gray-200 dark:border-gray-700">
        In the beginning, you don't need the absolute top tier of engineering talent. You need people who are extremely 
        dedicated and who are going to just love, love, love the problem that they're solving and want to pursue it to 
        its end.<br/>—Fred Luddy, Founder of ServiceNow ($230B)
      </blockquote>
      <p>
        Look for engineers who are genuinely passionate about your problem space. These individuals will:
      </p>
      <ul>
        <li>Go the extra mile to understand the problem deeply</li>
        <li>Stay motivated through challenging times</li>
        <li>Think creatively about solutions</li>
        <li>Take ownership of their work</li>
      </ul>

      <h2>Value Autonomy and Independence</h2>
      <p>
        In a startup environment, you need engineers who can operate with high autonomy. As the famous saying goes: 
        "We hire people to tell us what to do, not the other way around."
      </p>
      <p>
        Look for candidates who demonstrate:
      </p>
      <ul>
        <li>Strong initiative and self-direction</li>
        <li>Ability to invent structure where none exists</li>
        <li>Experience adapting to ambiguous situations</li>
      </ul>
      <p>
        During interviews, ask candidates to share examples of times when they had to create structure 
        or processes from scratch. Their ability to navigate uncertainty is crucial for startup success.
      </p>

      <h2>Seek Deep Curiosity</h2>
      <p>
        The best engineers are deeply curious about technology and don't stop at surface-level solutions. 
        They immerse themselves in understanding how things work, often contributing back to the community 
        through open source contributions or bug fixes in the frameworks they use.
      </p>
      <p>
        To test for curiosity, ask candidates about the most interesting developments in software engineering. 
        Strong candidates should be able to discuss topics like:
      </p>
      <ul>
        <li>Current API design trends and tradeoffs</li>
        <li>Emerging technologies and their potential impact</li>
        <li>Infrastructure and scalability challenges</li>
        <li>New tools and frameworks in their domain</li>
      </ul>

      <h2>Don't Underestimate Communication Skills</h2>
      <p>
        Even the most technically brilliant engineers need strong communication skills to succeed in a startup 
        environment. This becomes especially crucial as your team grows and collaboration becomes more complex.
      </p>
      <p>
        One effective way to evaluate communication skills is to include a writing exercise in your hiring process. 
        Ask candidates to write detailed responses about technical topics they're familiar with. This helps assess:
      </p>
      <ul>
        <li>Clarity of thought and expression</li>
        <li>Ability to explain complex concepts</li>
        <li>Written communication effectiveness</li>
        <li>Attention to detail</li>
      </ul>

      <h2>Look for the Joy of Coding</h2>
      <p>
        Exceptional developers often code for the sheer joy of it, driven by curiosity and the desire to solve 
        interesting problems. This is why using tools like <a href="/login" target="_blank" rel="noopener noreferrer">GitHire</a> can 
        be particularly effective—the best engineers often have impressive open source contributions that demonstrate 
        their passion for coding beyond their day job.
      </p>
      <p>
        Look for candidates who:
      </p>
      <ul>
        <li>Maintain personal projects</li>
        <li>Contribute to open source</li>
        <li>Write about technical topics</li>
        <li>Build tools to solve their own problems</li>
      </ul>
      <a href="/login" className="flex justify-center no-underline">
        <Button className="text-center mt-8">
            Start sourcing the best engineers
        </Button>
      </a>
    </>,
  }
];

export const getBlogPostBySlug = (slug: string) => {
  return blogPosts.find(post => post.slug === slug);
}; 