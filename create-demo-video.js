const { chromium } = require('@playwright/test');

async function createDemoVideo() {
  console.log('🎬 Starting GlobalTranslate 90-Second Demo Video Creation');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });
  
  // Create a context with video recording enabled
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './demo-videos/',
      size: { width: 1920, height: 1080 }
    }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📹 Video recording started...');
    
    // === SCENE 1: App Introduction (0-10s) ===
    console.log('🎬 Scene 1: App Introduction');
    await page.goto('https://trans-claude.web.app', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForTimeout(5000);
    
    // === SCENE 2: User 1 Onboarding (10-25s) ===
    console.log('🎬 Scene 2: User 1 Onboarding - English Speaker');
    
    // Check if we need onboarding or if user is already logged in
    await page.waitForSelector('body', { timeout: 10000 });
    
    const isOnboarding = await page.$('input[placeholder*="Username"], input[type="text"]');
    
    if (isOnboarding) {
      console.log('👤 Setting up new user...');
      await page.fill('input[type="text"]', 'VideoDemo_User');
      
      const languageSelect = await page.$('select');
      if (languageSelect) {
        await page.selectOption('select', 'en');
      }
      
      await page.click('button:has-text("Get Started")');
      await page.waitForTimeout(3000);
    }
    
    // Wait for home screen or chat interface
    try {
      await page.waitForSelector('h1:has-text("GlobalTranslate"), h2:has-text("Start Your Conversation"), textarea', { timeout: 8000 });
    } catch (e) {
      console.log('⚠️ Continuing with current page state...');
    }
    await page.waitForTimeout(2000);
    
    // === SCENE 3: Connection Setup (25-35s) ===
    console.log('🎬 Scene 3: Connection Setup');
    
    // Try to connect to testuser_hindi or use existing connection
    const connectInput = await page.$('input[placeholder*="username"]');
    if (connectInput) {
      console.log('🔗 Connecting to testuser_hindi...');
      await page.fill('input[placeholder*="username"]', 'testuser_hindi');
      await page.waitForTimeout(1500);
      await page.click('button:has-text("Connect")');
      await page.waitForTimeout(4000);
    } else {
      // Use recent conversations if available
      const recentButton = await page.$('button:has-text("testuser_hindi")');
      if (recentButton) {
        console.log('🔗 Using recent conversation...');
        await page.click('button:has-text("testuser_hindi")');
        await page.waitForTimeout(3000);
      }
    }
    
    // === SCENE 4: Chat Interface (35-45s) ===
    console.log('🎬 Scene 4: Chat Interface Setup');
    
    // Wait for chat interface to load
    await page.waitForSelector('textarea, input[placeholder*="message"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // === SCENE 5: First Message with Translation (45-60s) ===
    console.log('🎬 Scene 5: Live Translation Demo - Message 1');
    
    const messageInput = await page.$('textarea, input[placeholder*="message"]');
    if (messageInput) {
      await page.fill('textarea, input[placeholder*="message"]', 
        'Hello! This is GlobalTranslate - breaking language barriers with real-time translation!');
      await page.waitForTimeout(2000);
      await page.press('textarea, input[placeholder*="message"]', 'Enter');
      await page.waitForTimeout(4000); // Wait for translation to appear
    }
    
    // === SCENE 6: Second Message (60-75s) ===
    console.log('🎬 Scene 6: Second Translation Demo');
    
    if (messageInput) {
      await page.fill('textarea, input[placeholder*="message"]', 
        'I can type in English and my friend sees it instantly translated to Hindi!');
      await page.waitForTimeout(2000);
      await page.press('textarea, input[placeholder*="message"]', 'Enter');
      await page.waitForTimeout(4000);
    }
    
    // === SCENE 7: Voice Feature Demo (75-90s) ===
    console.log('🎬 Scene 7: Voice Recognition Demo');
    
    // Click voice input button
    const voiceButton = await page.$('button[title*="voice"], button:has-text("Start voice input")');
    if (voiceButton) {
      await page.click('button[title*="voice"], button:has-text("Start voice input")');
      await page.waitForTimeout(3000);
      
      // Show listening state
      await page.waitForTimeout(2000);
      
      // Type a message to simulate voice input being converted
      await page.fill('textarea, input[placeholder*="message"]', 
        'Voice recognition is now active - speak and see instant translation!');
      await page.waitForTimeout(2000);
      await page.press('textarea, input[placeholder*="message"]', 'Enter');
      await page.waitForTimeout(3000);
    }
    
    // === SCENE 8: Final Feature Showcase (85-90s) ===
    console.log('🎬 Scene 8: Feature Showcase');
    
    // Scroll to show full conversation
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);
    
    console.log('🎬 Demo sequence completed!');
    
    // Keep the page open for a moment to ensure video completes
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ Error during video recording:', error);
  } finally {
    // Close context to finalize video recording
    await context.close();
    await browser.close();
    
    console.log('📹 Video recording completed!');
    console.log('📁 Video saved to: ./demo-videos/');
    console.log('🎬 Demo video creation finished!');
  }
}

// Run the demo video creation
if (require.main === module) {
  createDemoVideo()
    .then(() => {
      console.log('✅ Demo video created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo video creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createDemoVideo };