#!/usr/bin/env node

/**
 * NeuroLink Comprehensive Demo Video Creator
 * Creates videos showing different use cases for the NeuroLink SDK
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:9876';
const VIDEOS_DIR = './videos';
const DELAY_BETWEEN_ACTIONS = 3000; // 3 seconds for better visibility

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

async function createVideo(name, actions) {
  console.log(`🎬 Creating video: ${name}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 800
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  try {
    // Navigate to demo
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(DELAY_BETWEEN_ACTIONS);

    // Execute the provided actions
    for (const action of actions) {
      console.log(`  ▶️ ${action.description}`);
      await action.execute(page);
      await page.waitForTimeout(DELAY_BETWEEN_ACTIONS);
    }

    // Wait a bit before ending
    await page.waitForTimeout(4000);

  } catch (error) {
    console.error(`❌ Error in video ${name}:`, error);
  } finally {
    await context.close();
    await browser.close();

    // Rename the video file to proper name
    const videoFiles = fs.readdirSync(VIDEOS_DIR).filter(f => f.endsWith('.webm'));
    if (videoFiles.length > 0) {
      const latestVideo = videoFiles[videoFiles.length - 1];
      const newName = `${name}.webm`;
      fs.renameSync(path.join(VIDEOS_DIR, latestVideo), path.join(VIDEOS_DIR, newName));
      console.log(`✅ Video saved as: ${newName}`);
    }
  }
}

// 1. Basic Examples - Core SDK functionality
const basicExamplesActions = [
  {
    description: "Show main interface and provider selection",
    execute: async (page) => {
      await page.waitForSelector('#provider', { timeout: 5000 });
      await page.hover('h1');
      await page.waitForTimeout(1000);

      // Show provider options
      await page.click('#provider');
      await page.waitForTimeout(1000);
      await page.selectOption('#provider', 'auto');
    }
  },
  {
    description: "Demo simple text generation",
    execute: async (page) => {
      await page.fill('#prompt', 'Write a creative short story about an AI helping humans solve climate change.');
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Demo streaming response",
    execute: async (page) => {
      await page.fill('#prompt', 'Write a haiku about artificial intelligence and humanity working together.');
      await page.click('button:text("Stream Response")');
      await page.waitForTimeout(8000); // Watch streaming happen
    }
  },
  {
    description: "Check provider status",
    execute: async (page) => {
      await page.click('button:text("Check All Providers")');
      await page.waitForSelector('#provider-status:not(:empty)', { timeout: 10000 });
    }
  }
];

// 2. Business Use Cases - Professional applications
const businessUseCasesActions = [
  {
    description: "Generate marketing email",
    execute: async (page) => {
      await page.fill('#prompt', `Write a professional marketing email for launching our new AI-powered project management tool "TaskGenius". The email should be engaging, highlight key benefits like automated task prioritization and team collaboration features, and include a clear call-to-action. Target audience: busy project managers and team leads.`);
      await page.selectOption('#provider', 'openai');
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Analyze business data",
    execute: async (page) => {
      await page.fill('#prompt', `Analyze this quarterly sales data and provide insights:
Q1 Revenue: $245,000 (15% increase from Q4)
Q2 Revenue: $289,000 (18% increase from Q1)
Q3 Revenue: $312,000 (8% increase from Q2)
Customer Acquisition: Q1: 450, Q2: 523, Q3: 578
Churn Rate: Q1: 5.2%, Q2: 4.1%, Q3: 3.8%

Please provide actionable insights and recommendations for Q4 strategy.`);
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Create executive summary",
    execute: async (page) => {
      await page.fill('#prompt', `Create an executive summary for this project proposal:

Project: AI-Driven Customer Support Enhancement
Timeline: 6 months
Budget: $180,000
Team: 5 engineers, 2 data scientists, 1 product manager

Objectives:
- Reduce average response time from 4 hours to 30 minutes
- Increase customer satisfaction scores by 25%
- Automate 70% of routine inquiries
- Integrate with existing CRM and ticketing systems

Expected ROI: 300% within first year through reduced support costs and improved customer retention.

Make it concise, compelling, and suitable for C-level executives.`);
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  }
];

// 3. Creative Tools - Content creation and writing
const creativeToolsActions = [
  {
    description: "Generate creative story",
    execute: async (page) => {
      await page.fill('#prompt', `Write an engaging short story (500 words) about a time traveler who discovers they can only visit moments when someone is making a life-changing decision. The story should be emotionally resonant and have an unexpected twist ending. Include vivid descriptions and dialogue.`);
      await page.selectOption('#provider', 'auto');
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Translate content",
    execute: async (page) => {
      await page.fill('#prompt', `Translate this business text to Spanish, maintaining professional tone:

"Welcome to the future of artificial intelligence! Our innovative platform makes advanced AI capabilities accessible to businesses of all sizes. From automated customer service to predictive analytics, we're democratizing AI technology. Join thousands of companies already transforming their operations with our cutting-edge solutions."`);
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Generate content ideas",
    execute: async (page) => {
      await page.fill('#prompt', `Generate 10 creative blog post ideas for a sustainable technology company. Each idea should include:
- Catchy title
- Brief description (2-3 sentences)
- Target audience
- Potential keywords

Focus on topics like renewable energy, green tech innovations, sustainable manufacturing, and environmental impact of technology.`);
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  }
];

// 4. Developer Tools - Code and technical content
const developerToolsActions = [
  {
    description: "Generate React component code",
    execute: async (page) => {
      await page.fill('#prompt', `Create a React component called "UserProfileCard" with the following requirements:
- Display user avatar, name, email, role, and status indicator
- Include hover effects and responsive design
- Use TypeScript with proper interfaces
- Include loading state and error handling
- Style with CSS modules or styled-components
- Add accessibility features (ARIA labels, keyboard navigation)

Include the complete component code with TypeScript interfaces and styling.`);
      await page.selectOption('#provider', 'openai');
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Generate API documentation",
    execute: async (page) => {
      await page.fill('#prompt', `Create comprehensive API documentation for a blog management system with these endpoints:

POST /api/posts - Create new blog post
GET /api/posts - List all posts (with pagination)
GET /api/posts/:id - Get specific post
PUT /api/posts/:id - Update post
DELETE /api/posts/:id - Delete post
GET /api/posts/search - Search posts

Include:
- Request/response schemas
- Authentication requirements
- Error codes and messages
- Example requests using curl
- Rate limiting information
- OpenAPI/Swagger format`);
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Debug error analysis",
    execute: async (page) => {
      await page.fill('#prompt', `Analyze this JavaScript error and provide debugging solution:

Error: TypeError: Cannot read properties of undefined (reading 'map')
    at UserList.render (UserList.jsx:25:12)
    at processChild (react-dom/cjs/react-dom-server.node.development.js:3353:14)
    at resolve (react-dom/cjs/react-dom-server.node.development.js:3270:5)

Code context:
const UserList = ({ users }) => {
  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};

Provide:
1. Root cause analysis
2. Multiple solution approaches
3. Prevention strategies
4. Code examples with fixes`);
      await page.click('button:text("Generate Text")');
      await page.waitForSelector('#output:not(:empty)', { timeout: 15000 });
    }
  }
];

// 5. Performance & Monitoring - SDK capabilities demonstration
const monitoringActions = [
  {
    description: "Run performance benchmark",
    execute: async (page) => {
      await page.click('button:text("Run Benchmark")');
      await page.waitForSelector('#benchmark-results:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Test provider fallback mechanism",
    execute: async (page) => {
      await page.fill('#prompt', 'Test the multi-provider fallback system with a sample query.');
      await page.click('button:text("Test Fallback")');
      await page.waitForTimeout(8000);
    }
  },
  {
    description: "Generate structured data",
    execute: async (page) => {
      await page.click('button:text("Generate Structured Data")');
      await page.waitForSelector('#schema-output:not(:empty)', { timeout: 15000 });
    }
  },
  {
    description: "Check provider status and configuration",
    execute: async (page) => {
      await page.click('button:text("Check All Providers")');
      await page.waitForSelector('#provider-status:not(:empty)', { timeout: 10000 });
    }
  }
];

// Main execution
async function createAllVideos() {
  console.log('🎬 Starting NeuroLink Comprehensive Demo Video Creation...\n');

  const videos = [
    { name: 'basic-examples', actions: basicExamplesActions },
    { name: 'business-use-cases', actions: businessUseCasesActions },
    { name: 'creative-tools', actions: creativeToolsActions },
    { name: 'developer-tools', actions: developerToolsActions },
    { name: 'monitoring-analytics', actions: monitoringActions }
  ];

  for (const video of videos) {
    await createVideo(video.name, video.actions);
    // Wait between videos
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n🎉 All comprehensive demo videos created successfully!');
  console.log(`📂 Videos saved in: ${VIDEOS_DIR}`);
  console.log('\n📋 Created videos:');
  console.log('- basic-examples.webm - Core SDK functionality');
  console.log('- business-use-cases.webm - Professional applications');
  console.log('- creative-tools.webm - Content creation and writing');
  console.log('- developer-tools.webm - Code generation and debugging');
  console.log('- monitoring-analytics.webm - Performance and provider management');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      console.log('✅ Demo server is running');
      return true;
    }
  } catch (error) {
    console.error('❌ Demo server is not running. Please start it first:');
    console.error('   cd neurolink-demo && node server.js');
    return false;
  }
}

// Run the video creation
if (await checkServer()) {
  await createAllVideos();
} else {
  process.exit(1);
}
