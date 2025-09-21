const { chromium } = require('@playwright/test');

async function create2UserDemo() {
  console.log('🎬 Starting 2-Minute Two-User GlobalTranslate Demo');
  
  // Launch browser with two contexts for true multi-user simulation
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  
  // Create two separate browser contexts for isolation
  const context1 = await browser.newContext({
    viewport: { width: 960, height: 720 },
    recordVideo: {
      dir: './demo-videos/',
      size: { width: 960, height: 720 }
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 User1Browser',
    permissions: ['microphone']
  });
  
  const context2 = await browser.newContext({
    viewport: { width: 960, height: 720 },
    recordVideo: {
      dir: './demo-videos/',
      size: { width: 960, height: 720 }
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 User2Browser',
    permissions: ['microphone']
  });
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  try {
    console.log('📹 Video recording started for both users...');
    
    // === SCENE 1: Dual User Setup (0-20s) ===
    console.log('🎬 Scene 1: Dual User Login & Onboarding');
    
    // Both users navigate to app simultaneously
    await Promise.all([
      page1.goto('https://trans-claude.web.app', { waitUntil: 'domcontentloaded', timeout: 15000 }),
      page2.goto('https://trans-claude.web.app', { waitUntil: 'domcontentloaded', timeout: 15000 })
    ]);
    
    await page1.waitForTimeout(3000);
    
    // User 1: English Speaker Setup
    console.log('👤 Setting up User 1 (Alice - English)');
    const onboarding1 = await page1.$('input[type="text"]');
    if (onboarding1) {
      await page1.fill('input[type="text"]', 'Alice_Demo');
      await page1.selectOption('select', 'en');
      await page1.waitForTimeout(1000);
      await page1.click('button:has-text("Get Started")');
      await page1.waitForTimeout(3000);
    }
    
    // User 2: Hindi Speaker Setup
    console.log('👤 Setting up User 2 (Raj - Hindi)');
    const onboarding2 = await page2.$('input[type="text"]');
    if (onboarding2) {
      await page2.fill('input[type="text"]', 'Raj_Demo');
      await page2.selectOption('select', 'hi');
      await page2.waitForTimeout(1000);
      await page2.click('button:has-text("Get Started")');
      await page2.waitForTimeout(3000);
    }
    
    // === SCENE 2: User Connection (20-35s) ===
    console.log('🎬 Scene 2: User Connection');
    
    // User 1 connects to User 2
    console.log('🔗 User 1 connecting to User 2...');
    const connectInput1 = await page1.$('input[placeholder*="username"]');
    if (connectInput1) {
      await page1.fill('input[placeholder*="username"]', 'Raj_Demo');
      await page1.waitForTimeout(1500);
      await page1.click('button:has-text("Connect")');
      await page1.waitForTimeout(4000);
    } else {
      // Try recent connections
      const recentButton = await page1.$('button:has-text("Raj_Demo")');
      if (recentButton) {
        await page1.click('button:has-text("Raj_Demo")');
        await page1.waitForTimeout(3000);
      }
    }
    
    // User 2 connects to User 1
    console.log('🔗 User 2 connecting to User 1...');
    const connectInput2 = await page2.$('input[placeholder*="username"]');
    if (connectInput2) {
      await page2.fill('input[placeholder*="username"]', 'Alice_Demo');
      await page2.waitForTimeout(1500);
      await page2.click('button:has-text("Connect")');
      await page2.waitForTimeout(4000);
    } else {
      // Try recent connections
      const recentButton2 = await page2.$('button:has-text("Alice_Demo")');
      if (recentButton2) {
        await page2.click('button:has-text("Alice_Demo")');
        await page2.waitForTimeout(3000);
      }
    }
    
    // === SCENE 3: Text Translation Demo (35-75s) ===
    console.log('🎬 Scene 3: Live Text Translation');
    
    // User 1 sends English message
    console.log('💬 User 1 sending English message...');
    const messageInput1 = await page1.$('textarea, input[placeholder*="message"]');
    if (messageInput1) {
      await page1.fill('textarea, input[placeholder*="message"]', 
        'Hello Raj! Welcome to GlobalTranslate. This app breaks down language barriers!');
      await page1.waitForTimeout(2000);
      await page1.press('textarea, input[placeholder*="message"]', 'Enter');
      await page1.waitForTimeout(5000); // Wait for translation to appear
    }
    
    // User 2 sends Hindi message
    console.log('💬 User 2 sending Hindi message...');
    const messageInput2 = await page2.$('textarea, input[placeholder*="message"]');
    if (messageInput2) {
      await page2.fill('textarea, input[placeholder*="message"]', 
        'नमस्ते Alice! यह बहुत अच्छा ऐप है। मैं हिंदी में लिख रहा हूं।');
      await page2.waitForTimeout(2000);
      await page2.press('textarea, input[placeholder*="message"]', 'Enter');
      await page2.waitForTimeout(5000);
    }
    
    // User 1 responds
    console.log('💬 User 1 responding...');
    if (messageInput1) {
      await page1.fill('textarea, input[placeholder*="message"]', 
        'Amazing! I can read your Hindi message in English. Real-time translation is working perfectly!');
      await page1.waitForTimeout(2000);
      await page1.press('textarea, input[placeholder*="message"]', 'Enter');
      await page1.waitForTimeout(4000);
    }
    
    // === SCENE 4: Speech-to-Text Demo (75-110s) ===
    console.log('🎬 Scene 4: Speech-to-Text Functionality');
    
    // User 1 tries voice input
    console.log('🎤 User 1 testing speech input...');
    const voiceButton1 = await page1.$('button[title*="voice"], button[title*="Start voice input"]');
    if (voiceButton1) {
      await page1.click('button[title*="voice"], button[title*="Start voice input"]');
      await page1.waitForTimeout(2000);
      
      // Simulate voice input by typing (since we can't actually speak in automation)
      await page1.fill('textarea, input[placeholder*="message"]', 
        'Voice recognition is active! This text simulates speech-to-text conversion.');
      await page1.waitForTimeout(2000);
      await page1.press('textarea, input[placeholder*="message"]', 'Enter');
      await page1.waitForTimeout(3000);
    }
    
    // User 2 tries voice input
    console.log('🎤 User 2 testing speech input...');
    const voiceButton2 = await page2.$('button[title*="voice"], button[title*="Start voice input"]');
    if (voiceButton2) {
      await page2.click('button[title*="voice"], button[title*="Start voice input"]');
      await page2.waitForTimeout(2000);
      
      // Simulate Hindi voice input
      await page2.fill('textarea, input[placeholder*="message"]', 
        'आवाज़ पहचान काम कर रहा है! यह तकनीक बहुत उपयोगी है।');
      await page2.waitForTimeout(2000);
      await page2.press('textarea, input[placeholder*="message"]', 'Enter');
      await page2.waitForTimeout(3000);
    }
    
    // === SCENE 5: Final Feature Showcase (110-120s) ===
    console.log('🎬 Scene 5: Feature Showcase');
    
    // Show conversation history
    await Promise.all([
      page1.evaluate(() => window.scrollTo(0, 0)),
      page2.evaluate(() => window.scrollTo(0, 0))
    ]);
    await page1.waitForTimeout(2000);
    
    await Promise.all([
      page1.evaluate(() => window.scrollTo(0, document.body.scrollHeight)),
      page2.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    ]);
    await page1.waitForTimeout(3000);
    
    // Final message
    console.log('💬 Final demonstration message...');
    if (messageInput1) {
      await page1.fill('textarea, input[placeholder*="message"]', 
        'Demo complete! GlobalTranslate enables seamless multilingual communication. 🌍');
      await page1.waitForTimeout(2000);
      await page1.press('textarea, input[placeholder*="message"]', 'Enter');
      await page1.waitForTimeout(3000);
    }
    
    console.log('🎬 Demo sequence completed!');
    
    // Keep recording for a moment to show final state
    await page1.waitForTimeout(2000);
    
  } catch (error) {
    console.error('❌ Error during demo recording:', error);
  } finally {
    // Close contexts to finalize video recording
    await context1.close();
    await context2.close();
    await browser.close();
    
    console.log('📹 Video recording completed!');
    console.log('📁 Videos saved to: ./demo-videos/');
    console.log('🎬 Two-user demo creation finished!');
  }
}

// Run the demo video creation
if (require.main === module) {
  create2UserDemo()
    .then(() => {
      console.log('✅ Two-user demo video created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Two-user demo video creation failed:', error);
      process.exit(1);
    });
}

module.exports = { create2UserDemo };