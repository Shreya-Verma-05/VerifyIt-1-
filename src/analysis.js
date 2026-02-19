// Advanced AI-like Text Analysis System
// VerifyIt Analysis Engine v3.0

class TextAnalyzer {
    constructor(text) {
        this.text = text.toLowerCase();
        this.originalText = text;
        this.sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        this.words = text.toLowerCase().match(/\b\w+\b/g) || [];
        this.wordCount = this.words.length;
    }
    
    calculateSuspicionScore() {
        // Increase weights for high-risk scammy patterns so clear scams score lower
        const suspiciousPatterns = [
            { pattern: /urgent|act now|limited time|hurry|immediate/gi, weight: 20, name: 'urgency' },
            { pattern: /miracle|guaranteed|100%|never fails|secret|amazing/gi, weight: 15, name: 'hyperbole' },
            { pattern: /free money|get rich|make \$[\d,]+|easy money/gi, weight: 30, name: 'financial scam' },
            { pattern: /doctors hate|they don't want|hidden truth|conspiracy/gi, weight: 22, name: 'conspiracy language' },
            { pattern: /click here|call now|act fast|don't miss|limited offer/gi, weight: 18, name: 'call to action' },
            { pattern: /shocking|unbelievable|incredible|amazing|breakthrough/gi, weight: 12, name: 'sensational language' },
            { pattern: /\b(bitcoin|crypto|investment|profit|roi)\b/gi, weight: 16, name: 'investment terms' }
        ];
        
        let totalScore = 0;
        let matchedPatterns = 0;
        
        suspiciousPatterns.forEach(({ pattern, weight, name }) => {
            const matches = this.text.match(pattern);
            if (matches) {
                totalScore += Math.min(weight * matches.length, weight * 2);
                matchedPatterns++;
            }
        });
        
        // Penalty for excessive capitalization (stricter)
        const capsRatio = (this.originalText.match(/[A-Z]/g) || []).length / Math.max(this.originalText.length, 1);
        if (capsRatio > 0.10) totalScore += 15;

        // Penalty for exclamation marks: 2+ is suspicious
        const exclamationCount = (this.originalText.match(/!/g) || []).length;
        if (exclamationCount >= 2) totalScore += 12;
        if (exclamationCount > 5) totalScore += 10;
        
        return Math.min(100, totalScore);
    }
    
    calculateCredibilityScore() {
        const credibilityPatterns = [
            { pattern: /according to|research shows|study found|data indicates|statistics show/gi, weight: 15, name: 'research references' },
            { pattern: /peer.?reviewed|published in|journal|university|academic/gi, weight: 20, name: 'academic sources' },
            { pattern: /expert|professor|doctor|researcher|scientist/gi, weight: 12, name: 'expert mentions' },
            { pattern: /source:|references?:|citation|bibliography/gi, weight: 18, name: 'source attribution' },
            { pattern: /\b(doi:|isbn:|pmid:)\b/gi, weight: 25, name: 'academic identifiers' },
            { pattern: /methodology|sample size|confidence interval|margin of error/gi, weight: 20, name: 'research methodology' },
            { pattern: /however|although|despite|nevertheless|on the other hand/gi, weight: 8, name: 'balanced language' }
        ];
        
        let totalScore = 0;
        let matchedPatterns = 0;
        
        credibilityPatterns.forEach(({ pattern, weight, name }) => {
            const matches = this.text.match(pattern);
            if (matches) {
                totalScore += Math.min(weight * matches.length, weight * 2);
                matchedPatterns++;
            }
        });
        
        // Bonus for proper sentence structure
        const avgSentenceLength = this.wordCount / Math.max(this.sentences.length, 1);
        if (avgSentenceLength >= 12 && avgSentenceLength <= 25) totalScore += 10;
        
        // Bonus for varied vocabulary
        const uniqueWords = new Set(this.words).size;
        const vocabularyRatio = uniqueWords / this.wordCount;
        if (vocabularyRatio > 0.6) totalScore += 8;
        
        return Math.min(100, totalScore);
    }
    
    calculateEmotionalManipulation() {
        const emotionalPatterns = [
            { pattern: /fear|scared|terrified|panic|worried|anxiety|danger/gi, weight: 12, name: 'fear appeals' },
            { pattern: /angry|outraged|furious|disgusting|hate|evil/gi, weight: 10, name: 'anger induction' },
            { pattern: /you must|you need to|don't let|before it's too late/gi, weight: 15, name: 'pressure tactics' },
            { pattern: /exclusive|special|chosen|selected|privileged/gi, weight: 8, name: 'exclusivity claims' },
            { pattern: /everyone|nobody|always|never|all|every single/gi, weight: 6, name: 'absolute statements' }
        ];
        
        let totalScore = 0;
        
        emotionalPatterns.forEach(({ pattern, weight, name }) => {
            const matches = this.text.match(pattern);
            if (matches) {
                totalScore += Math.min(weight * matches.length, weight * 2);
            }
        });
        
        return Math.min(100, totalScore);
    }
    
    analyzeStructure() {
        let structureScore = 50; // Base score
        
        // Check for proper paragraphs
        const paragraphs = this.originalText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        if (paragraphs.length >= 2) structureScore += 15;
        
        // Check for logical flow indicators
        const flowIndicators = /first|second|third|finally|in conclusion|therefore|however|furthermore/gi;
        const flowMatches = this.text.match(flowIndicators);
        if (flowMatches && flowMatches.length >= 2) structureScore += 20;
        
        // Check for question marks (balanced inquiry)
        const questionCount = (this.originalText.match(/\?/g) || []).length;
        if (questionCount > 0 && questionCount <= 3) structureScore += 10;
        
        // Penalty for wall of text
        if (this.sentences.length > 20 && paragraphs.length < 3) structureScore -= 20;
        
        return Math.max(0, Math.min(100, structureScore));
    }
    
    analyzeSourceCredibility() {
        let sourceScore = 30; // Base score
        
        // Check for URLs or web references
        const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
        const urls = this.originalText.match(urlPattern);
        if (urls) sourceScore += 20;
        
        // Check for date mentions
        const datePattern = /\b(19|20)\d{2}\b|january|february|march|april|may|june|july|august|september|october|november|december/gi;
        const dates = this.text.match(datePattern);
        if (dates) sourceScore += 15;
        
        // Check for specific names and places
        const properNouns = this.originalText.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
        if (properNouns && properNouns.length >= 3) sourceScore += 15;
        
        return Math.min(100, sourceScore);
    }
    
    generateIndicators(suspiciousScore, credibilityScore, emotionalScore) {
        const indicators = [];
        
        if (credibilityScore > 30) indicators.push('✓ Contains reference patterns');
        if (credibilityScore > 50) indicators.push('✓ Shows academic or research indicators');
        if (suspiciousScore < 20) indicators.push('✓ Low suspicious language detected');
        if (emotionalScore < 30) indicators.push('✓ Balanced emotional tone');
        
        if (suspiciousScore > 40) indicators.push('⚠ High suspicious pattern density');
        if (emotionalScore > 50) indicators.push('⚠ Strong emotional manipulation detected');
        if (credibilityScore < 20) indicators.push('⚠ Lacks credible source indicators');
        if (this.wordCount < 50) indicators.push('⚠ Very short content - limited analysis');
        
        // Specific pattern indicators
        if (this.text.includes('urgent') || this.text.includes('act now')) {
            indicators.push('⚠ Urgency pressure tactics found');
        }
        if (this.text.match(/\$[\d,]+|money|profit|investment/gi)) {
            indicators.push('⚠ Financial claims present - verify carefully');
        }
        
        return indicators.length > 0 ? indicators : ['ℹ Standard content analysis completed'];
    }
    
    generateDetailedAnalysis(score, verdict) {
        const analyses = {
            'HIGHLY SUSPICIOUS': [
                `This content shows multiple red flags commonly associated with misinformation or scam content. The text contains ${this.wordCount} words with patterns suggesting potential manipulation tactics.`,
                `Key concerns include suspicious language patterns, emotional manipulation techniques, and lack of credible source attribution. The content structure and vocabulary suggest it may be designed to mislead rather than inform.`,
                `Multiple indicators point to this being potentially false or misleading information that should be thoroughly fact-checked before sharing or acting upon.`
            ],
            'LIKELY LEGITIMATE': [
                `This content appears to follow patterns typical of credible information sources. The ${this.wordCount}-word text demonstrates balanced language and appropriate sourcing indicators.`,
                `The analysis found credible reference patterns, balanced emotional tone, and proper information structure. While no content is 100% guaranteed accurate, this shows positive credibility signals.`,
                `The text demonstrates characteristics of legitimate information, but as with all content, cross-referencing with authoritative sources is recommended for important decisions.`
            ],
            'PROCEED WITH CAUTION': [
                `This content shows mixed signals that require careful evaluation. While containing ${this.wordCount} words of analysis, it displays both credible and concerning elements.`,
                `Some aspects appear legitimate while others raise caution flags. The content may contain accurate information presented in a potentially biased or incomplete manner.`,
                `Neither clearly legitimate nor obviously suspicious, this content requires additional verification through independent sources before drawing conclusions.`
            ]
        };
        
        const baseAnalysis = analyses[verdict];
        const selectedAnalysis = baseAnalysis[Math.floor(Math.random() * baseAnalysis.length)];
        
        // Add specific details based on analysis
        let additionalDetails = '';
        if (score < 30) {
            additionalDetails = ' Strong indicators suggest this content should be treated with significant skepticism.';
        } else if (score > 75) {
            additionalDetails = ' Multiple positive indicators support the credibility of this content.';
        } else {
            additionalDetails = ' Mixed indicators suggest a moderate approach to verification is appropriate.';
        }
        
        return selectedAnalysis + additionalDetails;
    }
}

// Advanced AI-like analysis system
function performAdvancedAnalysis(text) {
    const analysis = new TextAnalyzer(text);
    
    const suspiciousScore = analysis.calculateSuspicionScore();
    const credibilityScore = analysis.calculateCredibilityScore();
    const emotionalScore = analysis.calculateEmotionalManipulation();
    const structureScore = analysis.analyzeStructure();
    const sourceScore = analysis.analyzeSourceCredibility();
    
    // Calculate final score with adjusted weights to emphasize suspicious indicators
    let finalScore = Math.round(
        (credibilityScore * 0.25) +
        ((100 - suspiciousScore) * 0.40) +
        ((100 - emotionalScore) * 0.20) +
        (structureScore * 0.10) +
        (sourceScore * 0.05)
    );

    // Strong override rules for obvious scammy patterns so results are unambiguous
    try {
        const t = text;
        const hasFinancialScam = /free money|get rich|make \$[\d,]+|easy money|double your money|make \$\d+/i.test(t);
        const hasUrgency = /urgent|act now|limited time|hurry|immediate|don't miss|act fast/i.test(t);
        const hasDoctorsHate = /doctors hate|doctors don't want|doctors hate this/i.test(t);
        const exclamations = (t.match(/!/g) || []).length;

        // If text contains both financial scam language and urgency, force a very low score
        if (hasFinancialScam && hasUrgency) {
            finalScore = Math.min(finalScore, 15);
        }

        // If sensational language + doctors-hate pattern + exclamations, mark extremely suspicious
        if (hasDoctorsHate && (exclamations >= 2 || hasUrgency)) {
            finalScore = Math.min(finalScore, 10);
        }

        // If many exclamations and hyperbole present, reduce score further
        if (exclamations >= 4 || /guaranteed|100%|never fails|secret trick|miracle/i.test(t)) {
            finalScore = Math.min(finalScore, 20);
        }
    } catch (e) {
        // ignore override failures
    }
    
    let verdict = "PROCEED WITH CAUTION";
    if (finalScore < 35) verdict = "HIGHLY SUSPICIOUS";
    else if (finalScore > 70) verdict = "LIKELY LEGITIMATE";
    
    const indicators = analysis.generateIndicators(suspiciousScore, credibilityScore, emotionalScore);
    const detailedAnalysis = analysis.generateDetailedAnalysis(finalScore, verdict);
    
    return {
        score: Math.max(0, Math.min(100, finalScore)),
        verdict,
        analysis: detailedAnalysis,
        indicators: indicators,
        recommendations: generateRecommendations(verdict)
    };
}

// Enhanced AI-like analysis system (no external API dependency)
    async function analyzeTextWithAI(text) {
        // If Gemini API is configured, try to call it first
        const geminiUrl = process.env.GEMINI_API_URL;
        const geminiKey = process.env.GEMINI_API_KEY;

        // If Gemini SDK (Vertex AI) enabled, try SDK first
        if (process.env.GEMINI_SDK_ENABLED === 'true' && process.env.GCP_PROJECT && process.env.GCP_LOCATION && process.env.GEMINI_MODEL) {
            try {
                const {PredictionServiceClient} = require('@google-cloud/aiplatform').v1;
                const client = new PredictionServiceClient();
                const endpoint = `projects/${process.env.GCP_PROJECT}/locations/${process.env.GCP_LOCATION}/endpoints/${process.env.GEMINI_MODEL}`;
                const instances = [{ content: text }];
                const request = { endpoint, instances };
                const [response] = await client.predict(request);

                // Try to extract textual output from common fields
                let candidateText = null;
                if (response && response.predictions && response.predictions.length > 0) {
                    const p = response.predictions[0];
                    if (typeof p === 'string') candidateText = p;
                    else if (p.content) candidateText = p.content;
                    else candidateText = JSON.stringify(p);
                }

                if (candidateText) {
                    return parseAIResponseText(candidateText, text);
                }
            } catch (sdkErr) {
                console.warn('Gemini SDK call failed, falling back to HTTP/local analysis:', sdkErr && sdkErr.message ? sdkErr.message : sdkErr);
                // continue to HTTP or local fallback
            }
        }

        // If an API key is present (AI Studio), call the Google Generative API directly
        const geminiModel = process.env.GEMINI_MODEL || process.env.GEMINI_MODEL_ID || null;
        if (!process.env.GEMINI_SDK_ENABLED || process.env.GEMINI_SDK_ENABLED !== 'true') {
            if (geminiKey && geminiModel) {
                try {
                    const gaUrl = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(geminiModel)}:generateText?key=${encodeURIComponent(geminiKey)}`;
                    const payload = JSON.stringify({ prompt: text, max_output_tokens: 512, temperature: 0.2 });

                    let resp;
                    if (typeof fetch === 'function') {
                        resp = await fetch(gaUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: payload
                        });
                    } else {
                        const https = require('https');
                        const { URL } = require('url');
                        const urlObj = new URL(gaUrl);

                        resp = await new Promise((resolve, reject) => {
                            const opts = {
                                hostname: urlObj.hostname,
                                port: urlObj.port || 443,
                                path: urlObj.pathname + (urlObj.search || ''),
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
                            };

                            const req = https.request(opts, (res) => {
                                let data = '';
                                res.on('data', (chunk) => data += chunk);
                                res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: async () => data, json: async () => JSON.parse(data) }));
                            });

                            req.on('error', (err) => reject(err));
                            req.write(payload);
                            req.end();
                        });
                    }

                    if (resp && resp.ok) {
                        let json = null;
                        try { json = await resp.json(); } catch (e) { json = null; }

                        // Google generative responses often include `candidates` with `output`
                        let candidateText = null;
                        if (json) {
                            if (Array.isArray(json.candidates) && json.candidates[0] && (json.candidates[0].output || json.candidates[0].content)) candidateText = json.candidates[0].output || json.candidates[0].content;
                            else if (json.output && typeof json.output === 'string') candidateText = json.output;
                            else if (json.choices && json.choices[0] && (json.choices[0].text || json.choices[0].message)) candidateText = json.choices[0].text || json.choices[0].message;
                        }

                        if (candidateText) {
                            return parseAIResponseText(candidateText, text);
                        }
                    } else {
                        const txt = await (resp && resp.text ? resp.text() : Promise.resolve(''));
                        console.warn('Generative API non-OK:', resp && resp.status, txt);
                    }
                } catch (err) {
                    console.warn('Generative API call failed, falling back:', err && err.message ? err.message : err);
                }
            }
        }

        if (geminiUrl && geminiKey) {
            try {
                // Prefer global fetch if available
                let resp;
                const payload = JSON.stringify({ prompt: text, max_tokens: 512 });

                if (typeof fetch === 'function') {
                    resp = await fetch(geminiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${geminiKey}`
                        },
                        body: payload,
                        timeout: 20000
                    });
                } else {
                    // Fallback to native https request for Node versions without fetch
                    const https = require('https');
                    const { URL } = require('url');
                    const urlObj = new URL(geminiUrl);

                    resp = await new Promise((resolve, reject) => {
                        const opts = {
                            hostname: urlObj.hostname,
                            port: urlObj.port || 443,
                            path: urlObj.pathname + (urlObj.search || ''),
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Content-Length': Buffer.byteLength(payload),
                                'Authorization': `Bearer ${geminiKey}`
                            }
                        };

                        const req = https.request(opts, (res) => {
                            let data = '';
                            res.on('data', (chunk) => data += chunk);
                            res.on('end', () => {
                                resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: async () => data, json: async () => JSON.parse(data) });
                            });
                        });

                        req.on('error', (err) => reject(err));
                        req.write(payload);
                        req.end();
                    });
                }

                if (!resp.ok) {
                    const txt = await (resp.text ? resp.text() : Promise.resolve(''));
                    console.warn('Gemini API returned non-OK:', resp.status, txt);
                    // Fall through to local analysis
                } else {
                    // Parse response and attempt to extract text result
                    let json;
                    try { json = await resp.json(); } catch (e) { json = null; }

                    // Common Gemini/LLM response shapes vary; try to find text output
                    let candidateText = null;
                    if (json) {
                        if (typeof json.output === 'string') candidateText = json.output;
                        else if (Array.isArray(json.candidates) && json.candidates[0] && json.candidates[0].content) candidateText = json.candidates[0].content;
                        else if (json.choices && json.choices[0] && (json.choices[0].text || json.choices[0].message)) candidateText = json.choices[0].text || json.choices[0].message;
                    }

                    if (candidateText) {
                        // Parse free-form LLM text into the same result shape used by this app
                        const parsed = parseAIResponseText(candidateText, text);
                        return parsed;
                    }
                }
            } catch (err) {
                console.warn('Gemini API call failed, falling back to local analysis:', err && err.message ? err.message : err);
                // continue to fallback
            }
        }

        // Fallback: local advanced analysis
        try {
            // Simulate AI processing time to keep UX consistent
            await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
            return performAdvancedAnalysis(text);
        } catch (error) {
            console.error('Analysis Error:', error);
            throw new Error('AI analysis temporarily unavailable');
        }
}

// Fallback analysis (calls the same advanced system)
function performFallbackAnalysis(text) {
    return performAdvancedAnalysis(text);
}

function generateRecommendations(verdict) {
    switch (verdict) {
        case 'HIGHLY SUSPICIOUS':
            return [
                'Do not share this content without verification',
                'Check official sources and fact-checking websites',
                'Look for corroborating evidence from reliable outlets',
                'Be aware this may be deliberate misinformation'
            ];
        case 'LIKELY LEGITIMATE':
            return [
                'Content appears credible but verify important claims',
                'Cross-reference with additional trusted sources',
                'Check publication date for relevance',
                'Consider the source\'s reputation and expertise'
            ];
        default:
            return [
                'Exercise caution and verify key claims',
                'Look for multiple independent sources',
                'Check for potential conflicts of interest',
                'Consider seeking expert opinions on the topic'
            ];
    }
}

function extractKeyFindings(text) {
    const findings = [];
    
    // Common positive indicators
    if (text.toLowerCase().includes('credible') || text.toLowerCase().includes('reliable')) {
        findings.push('✓ Shows credible source patterns');
    }
    if (text.toLowerCase().includes('fact') || text.toLowerCase().includes('evidence')) {
        findings.push('✓ Contains verifiable claims');
    }
    
    // Common negative indicators
    if (text.toLowerCase().includes('emotional') || text.toLowerCase().includes('manipul')) {
        findings.push('⚠ Emotional manipulation detected');
    }
    if (text.toLowerCase().includes('misleading') || text.toLowerCase().includes('bias')) {
        findings.push('⚠ Potential bias or misleading content');
    }
    if (text.toLowerCase().includes('unverified') || text.toLowerCase().includes('unsupported')) {
        findings.push('⚠ Unverified claims present');
    }
    
    return findings.length > 0 ? findings : ['ℹ Analysis completed - review full report'];
}

// Fallback parser for non-JSON AI responses
function parseAIResponseText(aiText, originalText) {
    // Extract score using regex or default scoring
    const scoreMatch = aiText.match(/(?:score|rating):\s*(\d+)/i);
    let score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    
    // Determine verdict based on content keywords
    let verdict = "PROCEED WITH CAUTION";
    if (aiText.toLowerCase().includes('suspicious') || aiText.toLowerCase().includes('misleading') || score < 30) {
        verdict = "HIGHLY SUSPICIOUS";
    } else if (aiText.toLowerCase().includes('legitimate') || aiText.toLowerCase().includes('credible') || score > 75) {
        verdict = "LIKELY LEGITIMATE";
    }
    
    return {
        score: Math.min(100, Math.max(0, score)),
        verdict,
        analysis: aiText,
        indicators: extractKeyFindings(aiText),
        recommendations: generateRecommendations(verdict)
    };
}

module.exports = {
    TextAnalyzer,
    performAdvancedAnalysis,
    analyzeTextWithAI,
    performFallbackAnalysis,
    generateRecommendations,
    extractKeyFindings,
    parseAIResponseText
};