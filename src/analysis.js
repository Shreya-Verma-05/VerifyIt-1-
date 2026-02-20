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
            { pattern: /one trick|secret trick|rich overnight|overnight success|no experience needed|no experience required|click now/gi, weight: 28, name: 'classic scam hook' },
            { pattern: /made me rich|made \w+ rich|passive income in \d+|earn while you sleep/gi, weight: 24, name: 'unrealistic earnings claim' },
            { pattern: /doctors hate|they don't want|hidden truth|conspiracy/gi, weight: 22, name: 'conspiracy language' },
            { pattern: /hidden evidence|covering up|cover-up|shocking proof|before it's removed|share immediately|government is covering up/gi, weight: 28, name: 'cover-up narrative' },
            { pattern: /you must act now|save your family|life-saving supplement|being banned|order today|you'?ll regret it|testimonials prove/gi, weight: 30, name: 'fear-pressure sales pitch' },
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
            { pattern: /save your family|you'?ll regret it|act now|share immediately|life-saving|before it'?s removed/gi, weight: 16, name: 'coercive urgency' },
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
    
    // Calculate final score with trustworthiness-emphasized weights
    let finalScore = Math.round(
        (credibilityScore * 0.40) +
        ((100 - suspiciousScore) * 0.28) +
        ((100 - emotionalScore) * 0.15) +
        (structureScore * 0.10) +
        (sourceScore * 0.07)
    );

    // Strong override rules for obvious scammy patterns so results are unambiguous
    try {
        const t = text;
        const hasFinancialScam = /free money|get rich|make \$[\d,]+|easy money|double your money|make \$\d+/i.test(t);
        const hasUrgency = /urgent|act now|limited time|hurry|immediate|don't miss|act fast/i.test(t);
        const hasDoctorsHate = /doctors hate|doctors don't want|doctors hate this/i.test(t);
        const hasClassicHook = /one trick|secret trick|rich overnight|overnight success|no experience needed|no experience required|made me rich|click now/i.test(t);
        const hasCoverupNarrative = /hidden evidence|covering up|cover-up|shocking proof|before it's removed|government is covering up/i.test(t);
        const hasFamilyPressurePitch = /you must act now|save your family|life-saving supplement|being banned|order today|you'?ll regret it|testimonials prove|miraculous/i.test(t);
        const exclamations = (t.match(/!/g) || []).length;

        // If text contains both financial scam language and urgency, force a very low score
        if (hasFinancialScam && hasUrgency) {
            finalScore = Math.min(finalScore, 15);
        }

        // If sensational language + doctors-hate pattern + exclamations, mark extremely suspicious
        if (hasDoctorsHate && (exclamations >= 2 || hasUrgency)) {
            finalScore = Math.min(finalScore, 10);
        }

        // Common social-media scam hooks should score as high-risk even if short text
        if (hasClassicHook && (hasUrgency || /secret|rich|profit|money/i.test(t))) {
            finalScore = Math.min(finalScore, 15);
        }

        // Conspiracy + sensational suppression narrative is commonly fraudulent
        if (hasCoverupNarrative && (/scientists|government|cure|shocking|share immediately/i.test(t))) {
            finalScore = Math.min(finalScore, 15);
        }

        // Family pressure + miracle supplement sales pitch should be marked high risk
        if (hasFamilyPressurePitch && (hasUrgency || /miraculous|supplement|banned|regret/i.test(t))) {
            finalScore = Math.min(finalScore, 12);
        }

        // If many exclamations and hyperbole present, reduce score further
        if (exclamations >= 4 || /guaranteed|100%|never fails|secret trick|one trick|miracle/i.test(t)) {
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
        credibilityScore,
        suspiciousScore,
        emotionalScore,
        structureScore,
        sourceScore,
        indicators: indicators,
        recommendations: generateRecommendations(verdict),
        aiProvider: 'local-heuristic',
        aiModel: 'verifyit-v3-local'
    };
}

function toBoundedNumber(value, defaultValue = 50, min = 0, max = 100) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return defaultValue;
    return Math.max(min, Math.min(max, Math.round(parsed)));
}

function getVerdictFromScore(score) {
    if (score < 35) return 'HIGHLY SUSPICIOUS';
    if (score > 70) return 'LIKELY LEGITIMATE';
    return 'PROCEED WITH CAUTION';
}

function normalizeAnalysisResult(baseResult, provider, model) {
    const candidateScore = Number(baseResult.score);
    const candidateCredibility = Number(baseResult.credibilityScore);
    let score = Number.isFinite(candidateScore)
        ? toBoundedNumber(candidateScore, 50)
        : (Number.isFinite(candidateCredibility) ? toBoundedNumber(candidateCredibility, 50) : 50);

    const verdict = baseResult.verdict || getVerdictFromScore(score);

    if (verdict === 'HIGHLY SUSPICIOUS' && score > 65) {
        score = 100 - score;
    }
    if (verdict === 'LIKELY LEGITIMATE' && score < 35) {
        score = 100 - score;
    }
    const analysis = typeof baseResult.analysis === 'string' && baseResult.analysis.trim()
        ? baseResult.analysis.trim()
        : 'Automated analysis completed.';

    const suspiciousScore = toBoundedNumber(
        baseResult.suspiciousScore,
        Math.max(0, 100 - score)
    );
    const credibilityScore = toBoundedNumber(
        baseResult.credibilityScore,
        score
    );
    const emotionalScore = toBoundedNumber(
        baseResult.emotionalScore,
        Math.min(100, Math.max(0, suspiciousScore))
    );
    const structureScore = toBoundedNumber(baseResult.structureScore, 55);
    const sourceScore = toBoundedNumber(baseResult.sourceScore, 50);

    const indicators = Array.isArray(baseResult.indicators) && baseResult.indicators.length > 0
        ? baseResult.indicators
        : extractKeyFindings(analysis);

    return {
        score,
        verdict,
        analysis,
        credibilityScore,
        suspiciousScore,
        emotionalScore,
        structureScore,
        sourceScore,
        indicators,
        recommendations: generateRecommendations(verdict),
        aiProvider: provider,
        aiModel: model
    };
}

function extractGeminiText(responseJson) {
    if (!responseJson || !Array.isArray(responseJson.candidates) || !responseJson.candidates[0]) {
        return '';
    }

    const candidate = responseJson.candidates[0];
    const parts = candidate.content && Array.isArray(candidate.content.parts)
        ? candidate.content.parts
        : [];

    return parts
        .map(part => (typeof part.text === 'string' ? part.text : ''))
        .join('\n')
        .trim();
}

function isAllowedVerdict(verdict) {
    return verdict === 'HIGHLY SUSPICIOUS' || verdict === 'PROCEED WITH CAUTION' || verdict === 'LIKELY LEGITIMATE';
}

function isGeminiResultUsable(result) {
    if (!result || !isAllowedVerdict(result.verdict)) return false;
    if (!Array.isArray(result.indicators) || result.indicators.length === 0) return false;
    if (typeof result.analysis !== 'string' || result.analysis.trim().length < 20) return false;

    const trimmed = result.analysis.trim();
    if (trimmed.startsWith('{') && trimmed.includes('"score"')) return false;

    return true;
}

function mergeLocalAndGemini(localResult, geminiResult, geminiModel) {
    const baseMergedScore = toBoundedNumber((localResult.score * 0.35) + (geminiResult.score * 0.65), localResult.score);
    const mergedSuspicious = toBoundedNumber((localResult.suspiciousScore * 0.3) + (geminiResult.suspiciousScore * 0.7), localResult.suspiciousScore);
    const mergedCredibility = toBoundedNumber((localResult.credibilityScore * 0.3) + (geminiResult.credibilityScore * 0.7), localResult.credibilityScore);
    const mergedEmotional = toBoundedNumber((localResult.emotionalScore * 0.3) + (geminiResult.emotionalScore * 0.7), localResult.emotionalScore);
    const mergedStructure = toBoundedNumber((localResult.structureScore * 0.4) + (geminiResult.structureScore * 0.6), localResult.structureScore);
    const mergedSource = toBoundedNumber((localResult.sourceScore * 0.4) + (geminiResult.sourceScore * 0.6), localResult.sourceScore);
    const trustworthinessComposite = toBoundedNumber(
        (mergedCredibility * 0.7) +
        (mergedSource * 0.2) +
        (mergedStructure * 0.1),
        mergedCredibility
    );
    let mergedScore = toBoundedNumber((baseMergedScore * 0.60) + (trustworthinessComposite * 0.40), baseMergedScore);

    const localLooksClearlyScam =
        localResult.score <= 25 ||
        localResult.verdict === 'HIGHLY SUSPICIOUS' ||
        localResult.suspiciousScore >= 75;
    const localLooksClearlyLegit =
        localResult.score >= 80 ||
        localResult.verdict === 'LIKELY LEGITIMATE' ||
        localResult.credibilityScore >= 75;

    if (localLooksClearlyScam && geminiResult.score >= 75) {
        mergedScore = Math.min(mergedScore, 30);
    }

    if (localLooksClearlyLegit && geminiResult.score <= 25) {
        mergedScore = Math.max(mergedScore, 70);
    }

    const verdict = getVerdictFromScore(mergedScore);

    return {
        score: mergedScore,
        verdict,
        analysis: geminiResult.analysis,
        credibilityScore: mergedCredibility,
        suspiciousScore: mergedSuspicious,
        emotionalScore: mergedEmotional,
        structureScore: mergedStructure,
        sourceScore: mergedSource,
        indicators: geminiResult.indicators,
        recommendations: generateRecommendations(verdict),
        aiProvider: 'gemini-api',
        aiModel: geminiModel
    };
}

async function postJson(url, payload) {
    if (typeof fetch === 'function') {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return {
            ok: response.ok,
            status: response.status,
            text: await response.text()
        };
    }

    const https = require('https');
    const { URL } = require('url');
    const urlObj = new URL(url);
    const body = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
        const request = https.request({
            hostname: urlObj.hostname,
            port: urlObj.port || 443,
            path: `${urlObj.pathname}${urlObj.search || ''}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                resolve({
                    ok: response.statusCode >= 200 && response.statusCode < 300,
                    status: response.statusCode,
                    text: data
                });
            });
        });

        request.on('error', reject);
        request.write(body);
        request.end();
    });
}

async function analyzeTextWithAI(text) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash';
    const localBaseline = performAdvancedAnalysis(text);

    if (geminiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
            const prompt = [
                'You are a misinformation and scam detector.',
                'Analyze the text and respond ONLY as valid JSON.',
                'Required keys: score, verdict, analysis, credibilityScore, suspiciousScore, emotionalScore, structureScore, sourceScore, indicators.',
                'All score fields must be integers from 0 to 100.',
                'verdict must be one of: HIGHLY SUSPICIOUS, PROCEED WITH CAUTION, LIKELY LEGITIMATE.',
                'indicators must be an array of at most 6 short strings.',
                'analysis must be at most 220 characters.',
                'Return pure JSON only. No markdown, no code fences, no extra text.',
                'Text to analyze:',
                text
            ].join('\n');

            const payload = {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.9,
                    maxOutputTokens: 900,
                    responseMimeType: 'application/json'
                }
            };

            const response = await postJson(url, payload);

            if (!response.ok) {
                console.warn('Gemini API non-OK response:', response.status, response.text);
            } else {
                let responseJson = null;
                try {
                    responseJson = JSON.parse(response.text);
                } catch (jsonError) {
                    console.warn('Gemini raw response could not be parsed as JSON:', jsonError.message);
                }

                const generatedText = extractGeminiText(responseJson);
                if (generatedText) {
                    const parsed = parseAIResponseText(generatedText, text);
                    const normalized = normalizeAnalysisResult(parsed, 'gemini-api', geminiModel);

                    if (isGeminiResultUsable(normalized)) {
                        return mergeLocalAndGemini(localBaseline, normalized, geminiModel);
                    }

                    console.warn('Gemini output did not pass validation; using local fallback.');
                }
            }
        } catch (error) {
            console.warn('Gemini API call failed, switching to local analysis:', error && error.message ? error.message : error);
        }

        return {
            ...localBaseline,
            aiProvider: 'gemini-api+local-fallback',
            aiModel: geminiModel
        };
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
        return localBaseline;
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
    let parsedJson = null;

    try {
        parsedJson = JSON.parse(aiText);
    } catch (error) {
        parsedJson = null;
    }

    const jsonBlock = aiText.match(/```json\s*([\s\S]*?)```/i);

    if (!parsedJson && jsonBlock && jsonBlock[1]) {
        try {
            parsedJson = JSON.parse(jsonBlock[1]);
        } catch (error) {
            parsedJson = null;
        }
    }

    if (!parsedJson) {
        const openBraceIndex = aiText.indexOf('{');
        const closeBraceIndex = aiText.lastIndexOf('}');
        if (openBraceIndex !== -1 && closeBraceIndex > openBraceIndex) {
            try {
                parsedJson = JSON.parse(aiText.slice(openBraceIndex, closeBraceIndex + 1));
            } catch (error) {
                parsedJson = null;
            }
        }
    }

    const scoreMatches = [...aiText.matchAll(/(?:"score"|\bscore\b|rating)\s*[:=]\s*(\d{1,3})/gi)];
    const fallbackScore = scoreMatches.length > 0
        ? parseInt(scoreMatches[scoreMatches.length - 1][1], 10)
        : 50;
    const score = toBoundedNumber(parsedJson && parsedJson.score, fallbackScore);

    let verdict = parsedJson && parsedJson.verdict;
    if (!verdict) {
        const lowered = aiText.toLowerCase();
        if (lowered.includes('highly suspicious') || lowered.includes('misleading') || lowered.includes('scam')) {
            verdict = 'HIGHLY SUSPICIOUS';
        } else if (lowered.includes('likely legitimate') || lowered.includes('credible')) {
            verdict = 'LIKELY LEGITIMATE';
        } else {
            verdict = getVerdictFromScore(score);
        }
    }

    const analysis = parsedJson && typeof parsedJson.analysis === 'string'
        ? parsedJson.analysis
        : aiText;

    return {
        score,
        verdict,
        analysis,
        credibilityScore: toBoundedNumber(parsedJson && parsedJson.credibilityScore, score),
        suspiciousScore: toBoundedNumber(parsedJson && parsedJson.suspiciousScore, Math.max(0, 100 - score)),
        emotionalScore: toBoundedNumber(parsedJson && parsedJson.emotionalScore, 50),
        structureScore: toBoundedNumber(parsedJson && parsedJson.structureScore, 55),
        sourceScore: toBoundedNumber(parsedJson && parsedJson.sourceScore, 50),
        indicators: Array.isArray(parsedJson && parsedJson.indicators) && parsedJson.indicators.length > 0
            ? parsedJson.indicators.slice(0, 6)
            : extractKeyFindings(analysis),
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