const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

// Import analysis module
const { 
    analyzeTextWithAI, 
    performFallbackAnalysis, 
    generateRecommendations 
} = require('./analysis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Advanced AI-like analysis system configuration
const AI_SYSTEM_VERSION = '3.0';

// API Routes
app.post('/api/verify', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                error: 'Text content is required for verification'
            });
        }
        
        if (text.length > 10000) {
            return res.status(400).json({
                error: 'Text content too long. Please limit to 10,000 characters.'
            });
        }
        
        let result;
        
        // Use advanced AI-like analysis system
        result = await analyzeTextWithAI(text);
        
        // Add metadata
        result.timestamp = new Date().toISOString();
        result.textLength = text.length;
        result.analysisVersion = AI_SYSTEM_VERSION;
        
        res.json(result);
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            error: 'Internal server error during verification',
            message: 'Please try again later'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: AI_SYSTEM_VERSION,
        aiEnabled: true,
        analysisType: 'Advanced Pattern Recognition'
    });
});

// AI / Gemini SDK status endpoint
app.get('/api/ai-status', async (req, res) => {
    const sdkEnabled = process.env.GEMINI_SDK_ENABLED === 'true';
    const project = process.env.GCP_PROJECT || null;
    const location = process.env.GCP_LOCATION || null;
    const model = process.env.GEMINI_MODEL || null;

    const result = {
        geminiSdkEnabled: sdkEnabled,
        gcpProject: project,
        gcpLocation: location,
        geminiModel: model
    };

    if (!sdkEnabled) {
        return res.json({ ok: true, note: 'Gemini SDK not enabled', ...result });
    }

    try {
        const {PredictionServiceClient} = require('@google-cloud/aiplatform').v1;
        const client = new PredictionServiceClient();

        if (!project || !location || !model) {
            return res.status(400).json({ ok: false, error: 'GCP_PROJECT, GCP_LOCATION or GEMINI_MODEL missing', ...result });
        }

        const name = `projects/${project}/locations/${location}/endpoints/${model}`;

        // Try a lightweight getEndpoint call to validate IAM/endpoint existence
        try {
            const [endpoint] = await client.getEndpoint({ name });
            return res.json({ ok: true, message: 'Gemini SDK reachable', endpoint: endpoint, ...result });
        } catch (innerErr) {
            return res.status(502).json({ ok: false, error: 'Failed to fetch endpoint', detail: innerErr.message, ...result });
        }

    } catch (err) {
        return res.status(500).json({ ok: false, error: 'Gemini SDK initialization failed', detail: err.message });
    }
});

// Newsletter subscription endpoint - saves to data/subscribers.json
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body || {};

        // Basic validation
        if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }

        const subscribersPath = path.join(__dirname, '../data/subscribers.json');

        // Read existing subscribers file (create default structure if missing)
        let fileData = { subscribers: [], lastUpdated: new Date().toISOString(), totalSubscribers: 0 };
        try {
            const raw = await fs.promises.readFile(subscribersPath, 'utf8');
            fileData = JSON.parse(raw || JSON.stringify(fileData));
        } catch (err) {
            // If file missing or invalid, we'll create it below
            console.warn('subscribers.json read error, will recreate:', err.message);
        }

        const normalized = email.trim().toLowerCase();
        const existing = (fileData.subscribers || []).find(s => s.email && s.email.toLowerCase() === normalized);

        if (existing && existing.active) {
            return res.status(409).json({ error: 'Email already subscribed' });
        }

        const now = new Date().toISOString();

        if (existing) {
            existing.active = true;
            existing.subscribedAt = now;
        } else {
            fileData.subscribers = fileData.subscribers || [];
            fileData.subscribers.push({
                email: normalized,
                subscribedAt: now,
                active: true,
                alertsReceived: 0
            });
        }

        fileData.lastUpdated = now;
        fileData.totalSubscribers = (fileData.subscribers || []).length;

        await fs.promises.writeFile(subscribersPath, JSON.stringify(fileData, null, 2), 'utf8');

        res.json({ message: 'Subscription successful' });
    } catch (error) {
        console.error('Newsletter subscribe error:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Create mail transporter from env config
let mailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_SERVICE) {
    mailTransporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

// Test send email endpoint
app.post('/api/newsletter/send-test', async (req, res) => {
    try {
        if (!process.env.NEWSLETTER_ENABLED || process.env.NEWSLETTER_ENABLED !== 'true') {
            return res.status(403).json({ error: 'Newsletter/email sending is disabled in configuration' });
        }

        const { to, subject, text, html } = req.body || {};
        const recipient = to && typeof to === 'string' ? to : process.env.EMAIL_USER;

        const mailOptions = {
            from: `${process.env.EMAIL_FROM_NAME || 'VerifyIt'} <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
            to: recipient,
            subject: subject || 'VerifyIt - Test Alert',
            text: text || 'This is a test alert from VerifyIt to verify email sending functionality.',
            html: html || `<p>This is a <strong>test alert</strong> from VerifyIt to verify email sending functionality.</p>`
        };

        // Try to send with configured transporter if available
        if (mailTransporter) {
            const info = await mailTransporter.sendMail(mailOptions);
            console.log('Test email sent:', info && info.response ? info.response : info);
            return res.json({ message: 'Test email sent', info: info });
        }

        // Fallback: create an Ethereal test account (preview-only) so developers can verify flow
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });

        const info = await testTransporter.sendMail(mailOptions);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Test email sent via Ethereal. Preview URL:', previewUrl);
        return res.json({ message: 'Test email sent via Ethereal (preview only)', previewUrl, info: info });

    } catch (error) {
        console.error('Send test email error:', error);
        // If auth failed and we didn't already fallback, attempt Ethereal to provide a preview
        try {
            const testAccount = await nodemailer.createTestAccount();
            const testTransporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            const { to, subject, text, html } = req.body || {};
            const recipient = to && typeof to === 'string' ? to : process.env.EMAIL_USER;
            const mailOptions = {
                from: `${process.env.EMAIL_FROM_NAME || 'VerifyIt'} <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
                to: recipient,
                subject: subject || 'VerifyIt - Test Alert',
                text: text || 'This is a test alert from VerifyIt to verify email sending functionality.',
                html: html || `<p>This is a <strong>test alert</strong> from VerifyIt to verify email sending functionality.</p>`
            };
            const info = await testTransporter.sendMail(mailOptions);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('Fallback Ethereal preview URL:', previewUrl);
            return res.json({ message: 'Fallback: test email sent via Ethereal (preview only)', previewUrl, info: info });
        } catch (ethError) {
            console.error('Ethereal fallback failed:', ethError);
            return res.status(500).json({ error: 'Failed to send test email', detail: error.message });
        }
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 VerifyIt server running on http://localhost:${PORT}`);
    console.log(`🤖 AI Analysis: Enabled (Advanced Pattern Recognition v${AI_SYSTEM_VERSION})`);
    console.log(`📁 Serving frontend from: ${path.join(__dirname, '../public')}`);
});

module.exports = app;