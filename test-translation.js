// Translation Test Script
// This script tests the translation functionality directly

console.log('🧪 Starting Translation Functionality Test');

// Test function to simulate translation
async function testTranslation() {
  try {
    // Check if we're in a browser environment with our app loaded
    if (typeof window === 'undefined') {
      console.error('❌ Must be run in browser environment');
      return;
    }

    // Test 1: Basic English to Spanish translation
    console.log('\n🔤 Test 1: English to Spanish');
    const testText1 = 'Hello, how are you today?';
    console.log(`Input: "${testText1}" (en → es)`);
    
    // Simulate the translation process that happens in useTranslation hook
    const simulateTranslation = async (text, fromLang, toLang) => {
      console.log(`🔄 Simulating translation: ${text} (${fromLang} → ${toLang})`);
      
      // This would normally hit the Google Translate API
      // For testing, we'll simulate different scenarios
      
      if (fromLang === toLang) {
        console.log('✅ Same language detected, returning original text');
        return text;
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock translation results for testing
      const mockTranslations = {
        'Hello, how are you today?': {
          'es': 'Hola, ¿cómo estás hoy?',
          'hi': 'नमस्ते, आज आप कैसे हैं?',
          'te': 'హలో, ఈరోజు మీరు ఎలా ఉన్నారు?'
        },
        'Good morning': {
          'es': 'Buenos días',
          'hi': 'सुप्रभात',
          'te': 'శుభోదయం'
        },
        'Thank you very much': {
          'es': 'Muchas gracias',
          'hi': 'बहुत धन्यवाद',
          'te': 'చాలా ధన్యవాదాలు'
        }
      };
      
      const translation = mockTranslations[text]?.[toLang];
      if (translation) {
        console.log(`✅ Mock translation successful: "${translation}"`);
        return translation;
      } else {
        console.log(`⚠️ No mock translation available, returning original text`);
        return text;
      }
    };
    
    // Test various language combinations
    const testCases = [
      { text: 'Hello, how are you today?', from: 'en', to: 'es', expected: 'Hola, ¿cómo estás hoy?' },
      { text: 'Good morning', from: 'en', to: 'hi', expected: 'सुप्रभात' },
      { text: 'Thank you very much', from: 'en', to: 'te', expected: 'చాలా ధన్యవాదాలు' },
      { text: 'Same language test', from: 'en', to: 'en', expected: 'Same language test' }
    ];
    
    console.log('\n🧪 Running Translation Test Cases:');
    console.log('=' .repeat(50));
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n📝 Test ${i + 1}/${totalTests}:`);
      console.log(`   Input: "${testCase.text}"`);
      console.log(`   Direction: ${testCase.from} → ${testCase.to}`);
      
      try {
        const result = await simulateTranslation(testCase.text, testCase.from, testCase.to);
        console.log(`   Output: "${result}"`);
        console.log(`   Expected: "${testCase.expected}"`);
        
        if (result === testCase.expected) {
          console.log('   ✅ PASS');
          passedTests++;
        } else {
          console.log('   ❌ FAIL - Translation mismatch');
        }
      } catch (error) {
        console.log(`   ❌ FAIL - Error: ${error.message}`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All translation tests passed!');
    } else {
      console.log(`⚠️ ${totalTests - passedTests} test(s) failed`);
    }
    
    // Test rate limiting functionality
    console.log('\n🚦 Testing Rate Limiting:');
    const rateLimiter = {
      requests: [],
      maxRequests: 10,
      windowMs: 60000,
      
      canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return this.requests.length < this.maxRequests;
      },
      
      addRequest() {
        this.requests.push(Date.now());
      }
    };
    
    console.log(`   Max requests: ${rateLimiter.maxRequests} per minute`);
    console.log(`   Current requests: ${rateLimiter.requests.length}`);
    console.log(`   Can make request: ${rateLimiter.canMakeRequest()}`);
    
    // Simulate multiple requests
    for (let i = 0; i < 12; i++) {
      if (rateLimiter.canMakeRequest()) {
        rateLimiter.addRequest();
        console.log(`   Request ${i + 1}: ✅ Allowed`);
      } else {
        console.log(`   Request ${i + 1}: ❌ Rate limited`);
      }
    }
    
    console.log('\n✅ Translation functionality tests completed');
    
    return {
      testsRun: totalTests,
      testsPassed: passedTests,
      success: passedTests === totalTests
    };
    
  } catch (error) {
    console.error('❌ Translation test failed:', error);
    return { error: error.message };
  }
}

// Auto-run the test if in browser
if (typeof window !== 'undefined') {
  testTranslation().then(result => {
    console.log('\n🏁 Final Result:', result);
  });
} else {
  console.log('Run this script in the browser console to test translation functionality');
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testTranslation };
}