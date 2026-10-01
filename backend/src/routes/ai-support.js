const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock database
const supportTickets = [];
const codeIssues = [];

// Detect language from text
function detectLanguage(text) {
  const georgianPattern = /[\u10A0-\u10FF]/g;
  const russianPattern = /[\u0400-\u04FF]/g;
  
  const georgianMatches = (text.match(georgianPattern) || []).length;
  const russianMatches = (text.match(russianPattern) || []).length;
  
  if (georgianMatches > russianMatches && georgianMatches > 0) return 'ka';
  if (russianMatches > georgianMatches && russianMatches > 0) return 'ru';
  return 'en';
}

// Get AI response from OpenAI
async function getAIResponse(userMessage, language) {
  try {
    const languageNames = {
      en: 'English',
      ka: 'Georgian',
      ru: 'Russian'
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return 'I apologize, but the AI support system is not properly configured. Please contact support.';
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful 24/7 support assistant for an equipment rental marketplace. 
            You help users with booking issues, payment problems, and general questions about the platform.
            Always respond in ${languageNames[language]} language.
            Be concise, friendly, and professional.
            Keep responses under 150 words.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    
    // Fallback responses based on language
    const fallbackResponses = {
      en: 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again in a moment. In the meantime, you can contact our support team at nkotomanidi@gmail.com',
      ka: 'ნაპირებმა, მე ამ მომენტში AI სერვისთან დაკავშირებაში ვერ ვხვდები. გთხოვთ ცოტა ხანში ხელახლა სცადოთ. იმ დროს შეგიძლიათ დაუკავშირდეთ ჩვენს დახმარების ჯამს nkotomanidi@gmail.com-ზე',
      ru: 'Извините, но в данный момент я не могу подключиться к сервису ИИ. Пожалуйста, попробуйте снова через несколько секунд. Тем временем вы можете связаться с нашей командой поддержки по адресу nkotomanidi@gmail.com'
    };
    
    return fallbackResponses[language] || fallbackResponses.en;
  }
}

// Analyze user message for code issues
function analyzeForCodeIssues(message) {
  const codeKeywords = [
    'error', 'bug', 'crash', 'not working', 'broken',
    'fail', 'exception', 'undefined', 'null', 'timeout', 'fix',
    'ошибка', 'баг', 'крах', 'не работает', 'сломан',
    'შეცდომა', 'ბაგი', 'ჩავარდა', 'არ მუშაობს', 'გატეხილი'
  ];

  const hasCodeIssue = codeKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );

  return hasCodeIssue;
}

// Attempt to fix code issues
async function attemptCodeFix(userMessage, language) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert code debugger for a React/Node.js equipment rental marketplace.
            When given a bug report or issue, analyze it and provide a fix.
            Return response in JSON format ONLY:
            {
              "hasIssue": true/false,
              "issueType": "string",
              "fixedCode": "code snippet or explanation",
              "explanation": "what was wrong and what you fixed"
            }`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const content = response.data.choices[0].message.content;
    try {
      return JSON.parse(content);
    } catch {
      return {
        hasIssue: true,
        issueType: 'code_analysis',
        fixedCode: null,
        explanation: content
      };
    }
  } catch (error) {
    console.error('Code fix error:', error.response?.data || error.message);
    return null;
  }
}

// POST /api/ai-support/chat - Send message to AI support
router.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);

    // Detect language
    const language = detectLanguage(message);
    console.log('Detected language:', language);

    // Check if it's a code issue
    const hasCodeIssue = analyzeForCodeIssues(message);
    console.log('Has code issue:', hasCodeIssue);

    let aiResponse;
    let codeFixResult = null;

    // If code issue detected, attempt fix
    if (hasCodeIssue) {
      console.log('Attempting code fix...');
      codeFixResult = await attemptCodeFix(message, language);
    }

    // Get general AI response
    console.log('Getting AI response...');
    aiResponse = await getAIResponse(message, language);
    console.log('AI Response:', aiResponse);

    // Create ticket
    const ticket = {
      id: Date.now(),
      userId: userId || 1,
      language,
      userMessage: message,
      aiResponse: aiResponse || 'Unable to generate response at this time.',
      hasCodeIssue,
      codeFixResult,
      status: 'resolved',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If code fix was suggested, mark for admin review
    if (codeFixResult && codeFixResult.hasIssue) {
      ticket.status = 'needs_review';
      codeIssues.push(codeFixResult);
    }

    supportTickets.push(ticket);

    res.json({
      ticketId: ticket.id,
      language,
      userMessage: message,
      aiResponse: ticket.aiResponse,
      hasCodeIssue,
      codeFixResult: codeFixResult || null,
      suggestedAction: hasCodeIssue ? 'code_analysis_performed' : 'general_support'
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai-support/tickets - Get all support tickets
router.get('/tickets', (req, res) => {
  const userId = req.user?.id || 1;
  const userTickets = supportTickets.filter((t) => t.userId === userId);
  res.json(userTickets);
});

// GET /api/ai-support/tickets/:id - Get ticket details
router.get('/tickets/:id', (req, res) => {
  const ticket = supportTickets.find((t) => t.id == req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(ticket);
});

// POST /api/ai-support/tickets/:id/apply-fix - Apply code fix
router.post('/tickets/:id/apply-fix', async (req, res) => {
  try {
    const { filePath, newCode } = req.body;

    if (!filePath || !newCode) {
      return res.status(400).json({ error: 'File path and code are required' });
    }

    // Write to file
    const fullPath = path.join(process.cwd(), filePath);
    fs.writeFileSync(fullPath, newCode, 'utf8');

    const ticket = supportTickets.find((t) => t.id == req.params.id);
    if (ticket) {
      ticket.status = 'fix_applied';
      ticket.fixAppliedAt = new Date();
    }

    res.json({
      success: true,
      message: 'Code fix applied successfully',
      filePath,
      appliedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai-support/admin/issues - Get all code issues (admin only)
router.get('/admin/issues', (req, res) => {
  res.json(codeIssues);
});

// POST /api/ai-support/admin/issues/:id/approve - Approve and apply fix (admin only)
router.post('/admin/issues/:id/approve', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const issue = codeIssues[req.params.id];
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Write fix to file
    const fullPath = path.join(process.cwd(), filePath);
    fs.writeFileSync(fullPath, issue.fixedCode, 'utf8');

    res.json({
      success: true,
      message: 'Fix approved and applied',
      filePath,
      appliedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai-support/admin/issues/:id/reject - Reject fix (admin only)
router.post('/admin/issues/:id/reject', (req, res) => {
  const { reason } = req.body;
  const issue = codeIssues[req.params.id];

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  codeIssues.splice(req.params.id, 1);

  res.json({
    success: true,
    message: 'Fix rejected',
    reason: reason || 'No reason provided'
  });
});

module.exports = router;