import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { NeuroLink } from 'neurolink';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize NeuroLink SDK
const neurolink = new NeuroLink();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper function to log requests
const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

app.use(logRequest);

// Root endpoint - serve demo page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NeuroLink AI Demo - All 5 Providers</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .section { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .output { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; margin-top: 10px; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; }
        .loading { background: #fff3cd; border: 1px solid #ffeaa7; }
        textarea { width: 100%; height: 80px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        select { width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
        .provider-badge { display: inline-block; margin: 3px; padding: 5px 10px; background: #e9ecef; border-radius: 15px; font-size: 12px; }
        .provider-badge.active { background: #28a745; color: white; }
        h1 { color: #2c3e50; }
        .header-container { display: flex; align-items: center; }
        .logo { font-size: 32px; margin-right: 15px; }
        .highlight { font-weight: bold; color: #007bff; }
      </style>
    </head>
    <body>
      <div class="header-container">
        <div class="logo">🧠</div>
        <div>
          <h1>NeuroLink AI Toolkit Demo</h1>
          <p>This demo showcases the NeuroLink AI toolkit with real API integrations for <span class="highlight">all 5 major AI providers</span>.</p>
        </div>
      </div>

      <div class="container">
        <div class="section">
          <h3>🚀 Multi-Provider Testing</h3>
          <p>Test all five AI providers with custom prompts:</p>

          <select id="provider">
            <option value="openai">OpenAI (GPT-4o)</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="bedrock">AWS Bedrock (Claude via ARN)</option>
            <option value="vertex">Google Vertex AI (Gemini)</option>
            <option value="azure">Azure OpenAI (GPT-4o-mini)</option>
            <option value="auto">Auto (Best Available)</option>
          </select>

          <textarea id="prompt" placeholder="Enter your prompt here...">Write a creative short story about an AI helping humans solve climate change.</textarea>

          <div>
            <button class="btn" onclick="testProvider(false)">Generate Text</button>
            <button class="btn" onclick="testProvider(true)">Stream Response</button>
            <button class="btn" onclick="testFallback()">Test Fallback</button>
          </div>

          <div id="status"></div>
          <div id="output" class="output"></div>
        </div>

        <div class="section">
          <h3>🔧 Provider Status</h3>
          <p>Check which providers are currently available:</p>
          <button class="btn" onclick="checkProviders()">Check All Providers</button>
          <div id="provider-status" class="output"></div>
          <div id="provider-badges"></div>
        </div>
      </div>

      <div class="container">
        <div class="section">
          <h3>📊 Performance Comparison</h3>
          <p>Compare response times across all five providers:</p>
          <button class="btn" onclick="runBenchmark()">Run Benchmark</button>
          <div id="benchmark-results" class="output"></div>
        </div>

        <div class="section">
          <h3>🎯 Schema Validation</h3>
          <p>Test structured output generation:</p>
          <button class="btn" onclick="testSchema()">Generate Structured Data</button>
          <div id="schema-output" class="output"></div>
        </div>
      </div>

      <script>
        function setStatus(message, type = 'info') {
          const status = document.getElementById('status');
          status.className = 'status ' + type;
          status.textContent = message;
        }

        function setOutput(content, elementId = 'output') {
          document.getElementById(elementId).textContent = content;
        }

        async function testProvider(streaming = false) {
          const provider = document.getElementById('provider').value;
          const prompt = document.getElementById('prompt').value;

          if (!prompt.trim()) {
            setStatus('Please enter a prompt', 'error');
            return;
          }

          setStatus('Generating response...', 'loading');
          setOutput('');

          try {
            const endpoint = streaming ? '/api/stream' : '/api/generate';
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider, prompt })
            });

            if (streaming) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let content = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                content += chunk;
                setOutput(content);
              }
              setStatus('Streaming completed successfully', 'success');
            } else {
              const data = await response.json();
              if (data.success) {
                setOutput(data.content);

                if (data.usage) {
                  const usageInfo = "\\n\\n--- Metrics ---\\nProvider: " + data.provider + "\\nModel: " + (data.model || 'default') + "\\nResponse Time: " + data.responseTime + "ms\\nPrompt Tokens: " + (data.usage.promptTokens || 'N/A') + "\\nCompletion Tokens: " + (data.usage.completionTokens || 'N/A') + "\\nTotal Tokens: " + (data.usage.totalTokens || 'N/A');
                  setOutput(data.content + usageInfo);
                }

                setStatus('Generated successfully using ' + data.provider, 'success');
              } else {
                setStatus('Error: ' + data.error, 'error');
                setOutput('');
              }
            }
          } catch (error) {
            setStatus('Request failed: ' + error.message, 'error');
            setOutput('');
          }
        }

        async function testFallback() {
          setStatus('Testing fallback mechanism...', 'loading');

          try {
            const response = await fetch('/api/test-fallback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: document.getElementById('prompt').value })
            });

            const data = await response.json();
            setOutput(JSON.stringify(data, null, 2));
            setStatus('Fallback test completed', 'success');
          } catch (error) {
            setStatus('Fallback test failed: ' + error.message, 'error');
          }
        }

        async function checkProviders() {
          try {
            const response = await fetch('/api/status');
            const data = await response.json();
            document.getElementById('provider-status').textContent = JSON.stringify(data, null, 2);

            const badgesContainer = document.getElementById('provider-badges');
            badgesContainer.innerHTML = '';

            Object.entries(data.providers).forEach(([name, info]) => {
              const badge = document.createElement('span');
              badge.className = 'provider-badge ' + (info.available ? 'active' : '');
              badge.textContent = name + (info.available ? ' ✓' : ' ✗');
              badgesContainer.appendChild(badge);
            });
          } catch (error) {
            document.getElementById('provider-status').textContent = 'Error: ' + error.message;
          }
        }

        async function runBenchmark() {
          document.getElementById('benchmark-results').textContent = 'Running benchmark...';

          try {
            const response = await fetch('/api/benchmark', { method: 'POST' });
            const data = await response.json();
            document.getElementById('benchmark-results').textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            document.getElementById('benchmark-results').textContent = 'Error: ' + error.message;
          }
        }

        async function testSchema() {
          document.getElementById('schema-output').textContent = 'Generating structured data...';

          try {
            const response = await fetch('/api/schema', { method: 'POST' });
            const data = await response.json();
            document.getElementById('schema-output').textContent = JSON.stringify(data.structuredData, null, 2);
          } catch (error) {
            document.getElementById('schema-output').textContent = 'Error: ' + error.message;
          }
        }

        // Load initial provider status
        checkProviders();
      </script>
    </body>
    </html>
  `);
});

// API endpoint to check provider status
app.get('/api/status', async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    providers: {},
    bestProvider: null,
    configuration: {
      defaultProvider: process.env.DEFAULT_PROVIDER || 'openai',
      streamingEnabled: process.env.ENABLE_STREAMING === 'true',
      fallbackEnabled: process.env.ENABLE_FALLBACK === 'true'
    }
  };

  // Test all 5 providers
  const providers = ['openai', 'anthropic', 'bedrock', 'vertex', 'azure'];

  for (const providerName of providers) {
    try {
      // Test with a minimal prompt to check availability
      await neurolink.generateText({
        prompt: 'test',
        provider: providerName,
        maxTokens: 1
      });

      status.providers[providerName] = {
        available: true,
        model: getModelForProvider(providerName),
        configured: isProviderConfigured(providerName)
      };
    } catch (error) {
      status.providers[providerName] = {
        available: false,
        error: error.message,
        configured: isProviderConfigured(providerName)
      };
    }
  }

  try {
    status.bestProvider = await neurolink.getBestProvider();
  } catch (error) {
    status.bestProvider = { error: error.message };
  }

  res.json(status);
});

// API endpoint for text generation
app.post('/api/generate', async (req, res) => {
  const { provider = 'auto', prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  try {
    console.log(`[Generate] Using provider: ${provider}, prompt length: ${prompt.length}`);

    const startTime = Date.now();
    const result = await neurolink.generateText({
      prompt,
      provider: provider === 'auto' ? undefined : provider,
      maxTokens: 500,
      temperature: 0.7
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (!result || !result.content) {
      throw new Error('Provider returned null or invalid response');
    }

    console.log(`[Generate] Success in ${responseTime}ms`);

    res.json({
      success: true,
      content: result.content,
      provider: result.provider || provider,
      model: result.model,
      responseTime: responseTime,
      usage: result.usage
    });

  } catch (error) {
    console.error(`[Generate] Error:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      provider
    });
  }
});

// API endpoint for streaming text generation
app.post('/api/stream', async (req, res) => {
  const { provider = 'auto', prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  try {
    console.log(`[Stream] Using provider: ${provider}, prompt length: ${prompt.length}`);

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const stream = await neurolink.generateTextStream({
      prompt,
      provider: provider === 'auto' ? undefined : provider,
      maxTokens: 500,
      temperature: 0.7
    });

    for await (const chunk of stream) {
      res.write(chunk.content);
    }

    res.end();
    console.log(`[Stream] Completed successfully`);

  } catch (error) {
    console.error(`[Stream] Error:`, error.message);
    res.write(`Error: ${error.message}`);
    res.end();
  }
});

// API endpoint to test fallback mechanism
app.post('/api/test-fallback', async (req, res) => {
  const { prompt } = req.body;
  const results = {
    timestamp: new Date().toISOString(),
    prompt: prompt.substring(0, 100) + '...',
    attempts: [],
    success: false,
    finalResult: null
  };

  const providers = ['openai', 'anthropic', 'bedrock', 'vertex', 'azure'];

  for (const providerName of providers) {
    try {
      console.log(`[Fallback] Trying provider: ${providerName}`);
      const startTime = Date.now();

      const result = await neurolink.generateText({
        prompt,
        provider: providerName,
        maxTokens: 100,
        temperature: 0.7
      });

      const endTime = Date.now();

      results.attempts.push({
        provider: providerName,
        status: 'success',
        responseTime: endTime - startTime,
        model: result.model
      });

      results.success = true;
      results.finalResult = {
        provider: providerName,
        content: result.content,
        usage: result.usage
      };

      console.log(`[Fallback] Success with ${providerName}`);
      break;

    } catch (error) {
      console.log(`[Fallback] Failed with ${providerName}: ${error.message}`);
      results.attempts.push({
        provider: providerName,
        status: 'failed',
        error: error.message
      });
    }
  }

  res.json(results);
});

// API endpoint for performance benchmark
app.post('/api/benchmark', async (req, res) => {
  const testPrompt = "Write a haiku about artificial intelligence.";
  const results = {
    timestamp: new Date().toISOString(),
    prompt: testPrompt,
    results: {}
  };

  const providers = ['openai', 'anthropic', 'bedrock', 'vertex', 'azure'];

  for (const providerName of providers) {
    try {
      console.log(`[Benchmark] Testing ${providerName}`);

      const startTime = Date.now();
      const result = await neurolink.generateText({
        prompt: testPrompt,
        provider: providerName,
        maxTokens: 100,
        temperature: 0.7
      });
      const endTime = Date.now();

      results.results[providerName] = {
        success: true,
        responseTime: endTime - startTime,
        model: result.model,
        usage: result.usage,
        contentLength: result.content.length
      };

    } catch (error) {
      results.results[providerName] = {
        success: false,
        error: error.message
      };
    }
  }

  res.json(results);
});

// API endpoint for schema validation testing
app.post('/api/schema', async (req, res) => {
  try {
    const result = await neurolink.generateText({
      prompt: "Generate a user profile for a fictional character including name, age, occupation, and hobbies.",
      maxTokens: 200,
      temperature: 0.7,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          occupation: { type: 'string' },
          hobbies: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'age', 'occupation', 'hobbies']
      }
    });

    console.log(`[Schema] Success with provider: ${result.provider}`);

    res.json({
      success: true,
      structuredData: result.object || JSON.parse(result.content),
      rawText: result.content,
      provider: result.provider,
      usage: result.usage
    });

  } catch (error) {
    console.error('[Schema] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper functions
function getModelForProvider(provider) {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_MODEL || 'gpt-4o';
    case 'anthropic':
      return 'claude-3-sonnet-20240229';
    case 'bedrock':
      return process.env.BEDROCK_MODEL || 'arn:aws:bedrock:us-east-2:225681119357:inference-profile/us.anthropic.claude-3-7-sonnet-20250219-v1:0';
    case 'vertex':
      return process.env.VERTEX_MODEL || 'gemini-1.5-pro';
    case 'azure':
      return process.env.AZURE_MODEL || 'gpt-4o-mini';
    default:
      return 'gpt-4o';
  }
}

function isProviderConfigured(provider) {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'bedrock':
      return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    case 'vertex':
      return !!(process.env.GOOGLE_VERTEX_PROJECT || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_AUTH_CLIENT_EMAIL);
    case 'azure':
      return !!(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT);
    default:
      return false;
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('[Server Error]:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🧠 NeuroLink Demo Server running at http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  GET  /           - Demo web interface');
  console.log('  GET  /api/status - Provider status check');
  console.log('  POST /api/generate - Text generation');
  console.log('  POST /api/stream - Streaming text generation');
  console.log('  POST /api/test-fallback - Test fallback mechanism');
  console.log('  POST /api/benchmark - Performance benchmark');
  console.log('  POST /api/schema - Schema validation test');
  console.log('');
  console.log('🔧 Configuration check:');
  console.log(`  OpenAI: ${isProviderConfigured('openai') ? '✅ Configured' : '❌ Missing API key'}`);
  console.log(`  Anthropic: ${isProviderConfigured('anthropic') ? '✅ Configured' : '❌ Missing API key'}`);
  console.log(`  Bedrock: ${isProviderConfigured('bedrock') ? '✅ Configured' : '❌ Missing AWS credentials'}`);
  console.log(`  Vertex AI: ${isProviderConfigured('vertex') ? '✅ Configured' : '❌ Missing Google credentials'}`);
  console.log(`  Azure: ${isProviderConfigured('azure') ? '✅ Configured' : '❌ Missing Azure credentials'}`);
});
