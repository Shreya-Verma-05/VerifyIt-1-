const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: path.join(__dirname, '../config/.env') });

// Import analysis module
const { 
    analyzeTextWithAI, 
    performFallbackAnalysis, 
    generateRecommendations 
} = require('./analysis');
const {
    initializeDatabase,
    getSubscriberByEmail,
    createSubscriber,
    reactivateSubscriber,
    getActiveSubscribers,
    incrementAlertsForSubscribers,
    getAlertState,
    updateAlertState,
    getStorageMode
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const HIGH_RISK_THRESHOLD = Number(process.env.HIGH_RISK_THRESHOLD) || 25;
const FRAUD_ALERT_COOLDOWN = Number(process.env.FRAUD_ALERT_COOLDOWN) || 3600000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Advanced AI-like analysis system configuration
const AI_SYSTEM_VERSION = '3.0';

function isValidEmailAddress(value) {
    return typeof value === 'string' && /^\S+@\S+\.\S+$/.test(value.trim());
}

function getMailerFromAddress() {
    const senderName = process.env.EMAIL_FROM_NAME || 'VerifyIt';
    const preferred = process.env.EMAIL_FROM_ADDRESS;
    const fallback = process.env.EMAIL_USER;
    const finalAddress = isValidEmailAddress(preferred) ? preferred.trim() : fallback;
    return `${senderName} <${finalAddress}>`;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildFraudAlertEmail({ text, result }) {
    const excerpt = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 350);
    const safeExcerpt = escapeHtml(excerpt);
    const safeScore = typeof result.score === 'number' ? Math.max(0, Math.min(100, Math.round(result.score))) : null;
    const safeVerdict = result.verdict || 'HIGHLY SUSPICIOUS';
    const safeTimestamp = result.timestamp || new Date().toISOString();

    const indicators = Array.isArray(result.indicators) ? result.indicators.slice(0, 5) : [];
    const recommendations = Array.isArray(result.recommendations) ? result.recommendations.slice(0, 4) : [];

    const riskColor = safeScore !== null && safeScore <= 25 ? '#dc2626' : '#f97316';
    const riskBadge = safeScore !== null && safeScore <= 25 ? 'CRITICAL RISK' : 'HIGH RISK';

    const indicatorsHtml = indicators.length > 0
        ? `<ul style="margin:0;padding-left:18px;color:#374151;line-height:1.6;">${indicators.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '<p style="margin:0;color:#6b7280;">No additional indicators were available.</p>';

    const recommendationsHtml = recommendations.length > 0
        ? `<ul style="margin:0;padding-left:18px;color:#374151;line-height:1.6;">${recommendations.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '<ul style="margin:0;padding-left:18px;color:#374151;line-height:1.6;"><li>Avoid clicking links or downloading files from this message.</li><li>Verify the claim through official channels before responding.</li><li>Report suspicious content to your security/admin team.</li></ul>';

    const plainText = [
        '🚨 VerifyIt High-Risk Fraud Alert',
        '',
        `Risk Level: ${riskBadge}`,
        `Risk Score: ${safeScore !== null ? `${safeScore}/100` : 'N/A'}`,
        `Verdict: ${safeVerdict}`,
        `Detected At (UTC): ${safeTimestamp}`,
        '',
        'Content Excerpt:',
        `${excerpt}${excerpt.length >= 350 ? '...' : ''}`,
        '',
        indicators.length > 0 ? `Indicators:\n- ${indicators.join('\n- ')}` : 'Indicators: No additional indicators available.',
        '',
        recommendations.length > 0
            ? `Recommended Actions:\n- ${recommendations.join('\n- ')}`
            : 'Recommended Actions:\n- Avoid clicking suspicious links\n- Verify through trusted sources\n- Report the message if needed',
        '',
        'Sent by VerifyIt Security Alerts'
    ].join('\n');

    const html = `
        <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                            <tr>
                                <td style="background:linear-gradient(120deg,#4f46e5 0%,#7c3aed 100%);padding:22px 28px;color:#ffffff;">
                                    <div style="font-size:13px;opacity:0.95;letter-spacing:0.4px;">VERIFYIT SECURITY ALERT</div>
                                    <h1 style="margin:8px 0 6px 0;font-size:24px;line-height:1.2;">High-Risk Content Detected</h1>
                                    <p style="margin:0;font-size:14px;opacity:0.95;">An automated analysis has flagged potentially fraudulent content.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:24px 28px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
                                        <tr>
                                            <td style="padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa;">
                                                <div style="display:inline-block;background:${riskColor};color:#ffffff;font-size:12px;font-weight:700;padding:6px 10px;border-radius:999px;letter-spacing:0.3px;">${riskBadge}</div>
                                                <div style="margin-top:12px;color:#111827;font-size:16px;font-weight:700;">Risk Score: ${safeScore !== null ? `${safeScore}/100` : 'N/A'}</div>
                                                <div style="margin-top:5px;color:#374151;font-size:14px;">Verdict: <strong>${escapeHtml(safeVerdict)}</strong></div>
                                                <div style="margin-top:5px;color:#6b7280;font-size:12px;">Detected at (UTC): ${escapeHtml(safeTimestamp)}</div>
                                            </td>
                                        </tr>
                                    </table>

                                    <h2 style="margin:0 0 8px 0;font-size:16px;color:#111827;">Message Excerpt</h2>
                                    <div style="margin:0 0 16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;color:#374151;font-size:14px;line-height:1.6;">
                                        ${safeExcerpt}${excerpt.length >= 350 ? '...' : ''}
                                    </div>

                                    <h2 style="margin:0 0 8px 0;font-size:16px;color:#111827;">Detected Indicators</h2>
                                    <div style="margin:0 0 16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">${indicatorsHtml}</div>

                                    <h2 style="margin:0 0 8px 0;font-size:16px;color:#111827;">Recommended Actions</h2>
                                    <div style="margin:0 0 18px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">${recommendationsHtml}</div>

                                    <div style="padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412;font-size:13px;line-height:1.5;">
                                        Do not share account details, OTPs, or payment information based on suspicious messages. Confirm requests through trusted and official channels.
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:16px 28px;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.6;border-top:1px solid #e5e7eb;">
                                    This alert was generated automatically by VerifyIt. If this looks unexpected, review your newsletter subscriptions and security settings.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
    `;

    return {
        text: plainText,
        html
    };
}

function buildFraudAlertSignature(text) {
    const normalized = (text || '').trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function shouldTriggerFraudAlert(result) {
    if (!result) return false;
    if (result.verdict === 'HIGHLY SUSPICIOUS') return true;
    if (typeof result.score === 'number' && result.score <= HIGH_RISK_THRESHOLD) return true;
    return false;
}

async function sendFraudAlertsToSubscribers({ text, result, bypassCooldown = false, bypassDuplicate = false }) {
    const status = {
        attempted: false,
        sent: false,
        recipientsCount: 0,
        reason: null,
        detail: null
    };

    if (process.env.NEWSLETTER_ENABLED !== 'true') {
        status.reason = 'newsletter-disabled';
        return status;
    }

    if (!mailTransporter) {
        status.reason = 'email-transporter-not-configured';
        return status;
    }

    const activeSubscribers = await getActiveSubscribers();

    if (activeSubscribers.length === 0) {
        status.reason = 'no-active-subscribers';
        return status;
    }

    const nowMs = Date.now();
    const alertState = await getAlertState();
    const lastAlertMs = alertState.lastFraudAlertAt ? Date.parse(alertState.lastFraudAlertAt) : 0;
    if (!bypassCooldown && lastAlertMs && nowMs - lastAlertMs < FRAUD_ALERT_COOLDOWN) {
        status.reason = 'cooldown-active';
        return status;
    }

    const signature = buildFraudAlertSignature(text);
    if (!bypassDuplicate && alertState.lastFraudAlertSignature && alertState.lastFraudAlertSignature === signature) {
        status.reason = 'duplicate-alert';
        return status;
    }

    status.attempted = true;

    const subject = `🚨 VerifyIt Fraud Alert: High-Risk Content Detected`;
    const emailBody = buildFraudAlertEmail({ text, result });

    const sendResults = await Promise.allSettled(
        activeSubscribers.map(subscriber => {
            const mailOptions = {
                from: getMailerFromAddress(),
                to: subscriber.email,
                subject,
                text: emailBody.text,
                html: emailBody.html
            };

            return mailTransporter.sendMail(mailOptions);
        })
    );

    const successfulRecipients = [];
    const failedRecipientErrors = [];
    sendResults.forEach((item, index) => {
        if (item.status === 'fulfilled') {
            successfulRecipients.push(activeSubscribers[index].email.toLowerCase());
        } else {
            failedRecipientErrors.push({
                email: activeSubscribers[index].email,
                error: item.reason && item.reason.message ? item.reason.message : 'unknown-send-error'
            });
        }
    });

    if (successfulRecipients.length === 0) {
        status.reason = 'all-sends-failed';
        status.detail = failedRecipientErrors.slice(0, 3);
        console.error('Fraud alert send failures:', failedRecipientErrors);
        return status;
    }

    if (failedRecipientErrors.length > 0) {
        console.warn('Some fraud alerts failed to send:', failedRecipientErrors);
    }

    await incrementAlertsForSubscribers(successfulRecipients);
    await updateAlertState({
        lastFraudAlertAt: new Date(nowMs),
        lastFraudAlertSignature: signature
    });

    status.sent = true;
    status.recipientsCount = successfulRecipients.length;
    status.reason = null;
    return status;
}

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

        if (shouldTriggerFraudAlert(result)) {
            try {
                result.fraudAlert = await sendFraudAlertsToSubscribers({ text, result });
            } catch (alertError) {
                console.error('Fraud alert sending error:', alertError);
                result.fraudAlert = {
                    attempted: true,
                    sent: false,
                    recipientsCount: 0,
                    reason: 'alert-processing-error'
                };
            }
        }
        
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
    const model = process.env.GEMINI_MODEL || process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash';
    const keyConfigured = Boolean(process.env.GEMINI_API_KEY);

    const result = {
        geminiSdkEnabled: sdkEnabled,
        geminiApiKeyConfigured: keyConfigured,
        gcpProject: project,
        gcpLocation: location,
        geminiModel: model
    };

    if (keyConfigured) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
            const payload = {
                contents: [{ parts: [{ text: 'Respond with OK' }] }],
                generationConfig: { temperature: 0, maxOutputTokens: 8 }
            };

            let response;
            if (typeof fetch === 'function') {
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    return res.json({ ok: true, mode: 'gemini-api-key', message: 'Gemini API key is active', ...result });
                }

                const body = await response.text();
                return res.status(502).json({ ok: false, mode: 'gemini-api-key', error: 'Gemini API key configured but request failed', status: response.status, detail: body, ...result });
            }

            return res.json({ ok: true, mode: 'gemini-api-key', note: 'Key configured (runtime fetch unavailable for validation)', ...result });
        } catch (error) {
            return res.status(502).json({ ok: false, mode: 'gemini-api-key', error: 'Gemini API validation failed', detail: error.message, ...result });
        }
    }

    if (!sdkEnabled) {
        return res.json({ ok: true, mode: 'local-fallback', note: 'Gemini API key not configured; using local analysis fallback', ...result });
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

// Newsletter subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body || {};

        // Basic validation
        if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
            return res.status(400).json({ error: 'A valid email address is required' });
        }

        const normalized = email.trim().toLowerCase();
        const existing = await getSubscriberByEmail(normalized);

        if (existing && existing.active) {
            return res.status(409).json({ error: 'Email already subscribed' });
        }

        if (existing) {
            await reactivateSubscriber(normalized);
        } else {
            await createSubscriber(normalized);
        }

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
            from: getMailerFromAddress(),
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
                from: getMailerFromAddress(),
                to: recipient,
                subject: subject || 'VerifyIt - Test Alert',
                text: text || 'This is a test alert from VerifyIt to verify email sending functionality.',
                html: html || `<p>This is a <strong>test alert</strong> from VerifyIt to verify email sending functionality.</p>`
            };
            const info = await testTransporter.sendMail(mailOptions);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('Fallback Ethereal preview URL:', previewUrl);
            return res.json({
                message: 'Fallback: test email sent via Ethereal (preview only)',
                previewUrl,
                info: info,
                warning: 'Primary email provider failed',
                originalError: error.message
            });
        } catch (ethError) {
            console.error('Ethereal fallback failed:', ethError);
            return res.status(500).json({ error: 'Failed to send test email', detail: error.message });
        }
    }
});

// High-risk alert testing endpoint (bypasses cooldown/duplicate protections)
app.post('/api/newsletter/test-high-risk', async (req, res) => {
    try {
        const { text, email } = req.body || {};

        if (email && (!isValidEmailAddress(email))) {
            return res.status(400).json({ error: 'Invalid email for test subscription' });
        }

        if (email) {
            const normalized = email.trim().toLowerCase();
            const existing = await getSubscriberByEmail(normalized);
            if (existing) {
                if (!existing.active) {
                    await reactivateSubscriber(normalized);
                }
            } else {
                await createSubscriber(normalized);
            }
        }

        const sampleText = typeof text === 'string' && text.trim().length > 0
            ? text.trim()
            : 'URGENT! Limited time offer! Click now to get free money and guaranteed returns.';

        const testResult = {
            score: 10,
            verdict: 'HIGHLY SUSPICIOUS'
        };

        const fraudAlert = await sendFraudAlertsToSubscribers({
            text: sampleText,
            result: testResult,
            bypassCooldown: true,
            bypassDuplicate: true
        });

        return res.json({
            message: 'High-risk alert test executed',
            fraudAlert
        });
    } catch (error) {
        console.error('High-risk alert test error:', error);
        return res.status(500).json({ error: 'Failed to run high-risk alert test', detail: error.message });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            const storageMode = getStorageMode();
            const storageLabel = storageMode === 'postgres'
                ? 'Neon PostgreSQL + Drizzle ORM'
                : 'Local JSON fallback (data/subscribers.json)';

            console.log(`🚀 VerifyIt server running on http://localhost:${PORT}`);
            console.log(`🤖 AI Analysis: Enabled (Advanced Pattern Recognition v${AI_SYSTEM_VERSION})`);
            console.log(`🗄️ Newsletter storage: ${storageLabel}`);
            console.log(`📁 Serving frontend from: ${path.join(__dirname, '../public')}`);
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;