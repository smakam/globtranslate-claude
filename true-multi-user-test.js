const { chromium } = require('@playwright/test');

async function runTrueMultiUserE2ETest() {
  console.log('🚀 TRUE Multi-User E2E Test - Separate Browser Instances');
  
  let browser1, browser2;
  
  try {
    // Launch TWO completely separate browser contexts with persistent storage
    console.log('🌐 Launching separate browser contexts...');
    browser1 = await chromium.launchPersistentContext('/tmp/browser1-globtranslate', { 
      headless: false,
      viewport: { width: 1200, height: 800 }
    });
    browser2 = await chromium.launchPersistentContext('/tmp/browser2-globtranslate', { 
      headless: false,
      viewport: { width: 1200, height: 800 }
    });
    
    const page1 = browser1.pages()[0] || await browser1.newPage();
    const page2 = browser2.pages()[0] || await browser2.newPage();
    
    console.log('✅ Two separate browser instances launched');
    
    // Navigate both to production
    await Promise.all([
      page1.goto('https://trans-claude.web.app'),
      page2.goto('https://trans-claude.web.app')
    ]);
    
    console.log('🌍 Both browsers navigated to production');
    
    // Wait for apps to load
    await Promise.all([
      page1.waitForTimeout(5000),
      page2.waitForTimeout(5000)
    ]);
    
    // Check if we get different users or onboarding screens
    const page1Content = await page1.textContent('body');
    const page2Content = await page2.textContent('body');
    
    console.log('📋 User 1 Status:', page1Content.includes('Welcome back') ? 'Returning User' : 'New User');
    console.log('📋 User 2 Status:', page2Content.includes('Welcome back') ? 'Returning User' : 'New User');
    
    // Take screenshots of both users
    await page1.screenshot({ path: 'separate-user1.png', fullPage: true });
    await page2.screenshot({ path: 'separate-user2.png', fullPage: true });
    
    console.log('📸 Screenshots taken of both separate user sessions');
    
    // Test Speech Recognition on User 1
    console.log('🎤 Testing Speech Recognition on User 1...');
    
    const speechTest1 = await page1.evaluate(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return { error: 'Speech Recognition not supported' };
      }
      
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        return {
          supported: true,
          configured: true,
          language: recognition.lang,
          continuous: recognition.continuous,
          interimResults: recognition.interimResults
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🎤 User 1 Speech Test Result:', speechTest1);
    
    // Test Speech Recognition on User 2
    const speechTest2 = await page2.evaluate(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return { error: 'Speech Recognition not supported' };
      }
      
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';
        
        return {
          supported: true,
          configured: true,
          language: recognition.lang,
          continuous: recognition.continuous,
          interimResults: recognition.interimResults
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('🎤 User 2 Speech Test Result:', speechTest2);
    
    // Test microphone permissions (will require user interaction)
    console.log('🔒 Testing microphone permissions...');
    
    const micTest1 = await page1.evaluate(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
        return { microphoneAccess: 'granted' };
      } catch (error) {
        return { microphoneAccess: 'denied_or_unavailable', error: error.name };
      }
    });
    
    console.log('🎙️ User 1 Microphone Test:', micTest1);
    
    // If we have chat interfaces, try to extract usernames
    let user1Username = 'unknown';
    let user2Username = 'unknown';
    
    try {
      const user1Welcome = await page1.$eval('text="Welcome back,"', el => el.nextElementSibling?.textContent);
      if (user1Welcome) user1Username = user1Welcome.trim();
    } catch (e) {}
    
    try {
      const user2Welcome = await page2.$eval('text="Welcome back,"', el => el.nextElementSibling?.textContent);
      if (user2Welcome) user2Username = user2Welcome.trim();
    } catch (e) {}
    
    console.log(`👤 User 1 Username: ${user1Username}`);
    console.log(`👤 User 2 Username: ${user2Username}`);
    
    // Test if users can attempt to connect to each other
    if (user1Username !== 'unknown' && user2Username !== 'unknown' && user1Username !== user2Username) {
      console.log('🔗 Testing cross-user connection...');
      
      // Try User 1 connecting to User 2
      try {
        const connectInput1 = await page1.$('input[placeholder*="username"]');
        if (connectInput1) {
          await page1.fill('input[placeholder*="username"]', user2Username);
          await page1.click('button:has-text("Connect")');
          await page1.waitForTimeout(3000);
          
          const connectionResult1 = await page1.textContent('body');
          console.log(`📞 User 1 → User 2 connection: ${connectionResult1.includes('Connected') ? 'SUCCESS' : 'PENDING/FAILED'}`);
        }
      } catch (error) {
        console.log(`❌ User 1 connection test failed: ${error.message}`);
      }
    } else {
      console.log('⚠️ Cannot test cross-connection - users are same or unknown');
    }
    
    // Keep browsers open for 15 seconds for manual inspection
    console.log('🔍 Keeping browsers open for 15 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    return {
      success: true,
      user1: { username: user1Username, speechSupported: speechTest1.supported },
      user2: { username: user2Username, speechSupported: speechTest2.supported },
      trueMultiUser: user1Username !== user2Username,
      speechTesting: {
        user1: speechTest1,
        user2: speechTest2,
        microphoneTest: micTest1
      }
    };
    
  } catch (error) {
    console.error('❌ Multi-user test failed:', error);
    return { error: error.message };
  } finally {
    if (browser1) await browser1.close();
    if (browser2) await browser2.close();
    console.log('🏁 Both browsers closed');
  }
}

// Export for use
module.exports = { runTrueMultiUserE2ETest };

// Run if called directly
if (require.main === module) {
  runTrueMultiUserE2ETest()
    .then(result => {
      console.log('\n📊 TRUE Multi-User Test Results:', result);
      if (result.trueMultiUser) {
        console.log('🎉 SUCCESS: True multi-user session achieved!');
      } else {
        console.log('⚠️ LIMITATION: Same user in both sessions');
      }
    })
    .catch(console.error);
}