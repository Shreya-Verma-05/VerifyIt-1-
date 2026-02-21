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

function detectAnalysisMode(input) {
    const raw = String(input || '').trim();
    if (!raw) return 'text';

    const onlyPhoneCharacters = /^[+\d\s().-]{7,24}$/.test(raw);
    const digitCount = (raw.match(/\d/g) || []).length;
    const looksLikeStandalonePhone = onlyPhoneCharacters && digitCount >= 8 && digitCount <= 15;

    if (looksLikeStandalonePhone) {
        return 'phone';
    }

    const hasPhoneToken = /(\+?\d[\d\s().-]{7,}\d)|\b(call|whatsapp|missed call|otp|verification code|kyc|upi|bank alert|bank|sim|telecom)\b/i.test(raw);
    const hasScamToken = /\b(urgent|blocked|suspend|suspended|prize|lottery|reward|refund|claim|click|link|verify now|account locked|pay now|remote access|screen share)\b/i.test(raw);
    const looksLikeSmsLength = raw.length <= 280;

    if (hasPhoneToken && looksLikeSmsLength) {
        return 'phone';
    }

    if (hasPhoneToken && hasScamToken) {
        return 'phone';
    }

    return 'text';
}

class PhoneSpamAnalyzer {
    constructor(text) {
        this.originalText = String(text || '');
        this.text = this.originalText.toLowerCase();
    }

    calculateSuspicionScore() {
        const suspiciousPatterns = [
            { pattern: /\b(otp|one.?time password|verification code|share code|cvv|pin)\b/gi, weight: 22 },
            { pattern: /\b(kyc|aadhaar|pan|account (?:blocked|suspended|frozen)|sim blocked)\b/gi, weight: 18 },
            { pattern: /\b(upi|paytm|gpay|phonepe|bank alert|refund|claim now|reward points)\b/gi, weight: 16 },
            { pattern: /\b(urgent|immediately|within \d+ (?:minutes?|hours?)|final warning|last chance)\b/gi, weight: 18 },
            { pattern: /\b(click|tap|install|download|apk|remote access|screen share|anydesk|teamviewer)\b/gi, weight: 20 },
            { pattern: /\b(lottery|winner|won|prize|jackpot|gift|cashback|guaranteed)\b/gi, weight: 16 },
            { pattern: /https?:\/\/\S+|bit\.ly|tinyurl|shorturl|wa\.me/gi, weight: 18 },
            { pattern: /\b(call now|missed call|whatsapp now|contact support)\b/gi, weight: 10 }
        ];

        let total = 0;
        suspiciousPatterns.forEach(({ pattern, weight }) => {
            const matches = this.text.match(pattern);
            if (matches) {
                total += Math.min(weight * matches.length, weight * 3);
            }
        });

        const phoneNumberMatches = this.originalText.match(/\+?\d[\d\s().-]{7,}\d/g) || [];
        if (phoneNumberMatches.length >= 2) total += 8;

        const exclamations = (this.originalText.match(/!/g) || []).length;
        if (exclamations >= 2) total += 8;

        const capsRatio = (this.originalText.match(/[A-Z]/g) || []).length / Math.max(this.originalText.length, 1);
        if (capsRatio > 0.12) total += 10;

        return Math.min(100, Math.round(total));
    }

    calculateCredibilityScore() {
        let score = 24;

        if (/\b(customer care|official|support center|toll free|working hours)\b/i.test(this.originalText)) {
            score += 16;
        }

        if (/\b(never share otp|do not share pin|fraud awareness|security notice)\b/i.test(this.originalText)) {
            score += 30;
        }

        if (/\b(gov\.in|nic\.in|bank\.com|official app|verified business)\b/i.test(this.originalText)) {
            score += 14;
        }

        if (/\b(win|prize|lottery|guaranteed|urgent)\b/i.test(this.originalText)) {
            score -= 20;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    calculateEmotionalManipulation() {
        let score = 0;
        const pressurePatterns = [
            /\b(final warning|immediately|urgent|suspended|blocked)\b/gi,
            /\b(act now|limited time|last chance|before midnight)\b/gi,
            /\b(your account|your sim|your bank)\b/gi
        ];

        pressurePatterns.forEach((pattern) => {
            const matches = this.text.match(pattern);
            if (matches) score += Math.min(20, matches.length * 8);
        });

        return Math.min(100, score);
    }

    analyzeStructure() {
        let score = 45;
        const hasCompleteSentences = /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/.test(this.originalText);
        const hasLink = /https?:\/\/\S+/i.test(this.originalText);
        const hasSecurityAdvisory = /never share otp|do not share pin|security/i.test(this.originalText);

        if (hasCompleteSentences) score += 10;
        if (hasSecurityAdvisory) score += 20;
        if (hasLink && /bit\.ly|tinyurl|shorturl/i.test(this.originalText)) score -= 12;

        return Math.max(0, Math.min(100, score));
    }

    analyzeSourceCredibility() {
        let score = 28;
        if (/\b(official|verified|helpline|customer care|website)\b/i.test(this.originalText)) score += 18;
        if (/\b(gov\.in|nic\.in|\.[a-z]{2,3}\/help)\b/i.test(this.originalText)) score += 14;
        if (/bit\.ly|tinyurl|shorturl|wa\.me/i.test(this.originalText)) score -= 12;
        if (/\b(unknown|random|forwarded)\b/i.test(this.originalText)) score -= 10;
        return Math.max(0, Math.min(100, score));
    }

    generateIndicators(suspiciousScore, credibilityScore, emotionalScore) {
        const indicators = [];

        if (suspiciousScore >= 60) indicators.push('⚠ High phone scam pattern match');
        if (/\b(otp|pin|cvv)\b/i.test(this.originalText)) indicators.push('⚠ Sensitive credential request detected');
        if (/https?:\/\/\S+|bit\.ly|tinyurl|shorturl/i.test(this.originalText)) indicators.push('⚠ Link-based redirection pattern found');
        if (/\b(urgent|final warning|blocked|suspended)\b/i.test(this.originalText)) indicators.push('⚠ Fear/urgency pressure language found');
        if (credibilityScore >= 60) indicators.push('✓ Contains consumer safety style language');
        if (emotionalScore < 25 && suspiciousScore < 35) indicators.push('✓ Low manipulation tone in phone content');

        return indicators.length > 0 ? indicators.slice(0, 6) : ['ℹ Phone-content analysis completed'];
    }

    generateDetailedAnalysis(score, verdict) {
        if (verdict === 'HIGHLY SUSPICIOUS') {
            return 'This phone-related content matches common call/SMS scam patterns (urgency, credential requests, or suspicious links). Avoid responding or sharing sensitive details.';
        }
        if (verdict === 'LIKELY LEGITIMATE') {
            return 'This phone-related content shows lower-risk traits and fewer scam indicators, but still verify the sender using official channels before taking action.';
        }
        return 'This phone-related content has mixed signals. Verify through official customer-care numbers or the provider’s official app/website before acting.';
    }
}

function performPhoneAdvancedAnalysis(text) {
    const analyzer = new PhoneSpamAnalyzer(text);
    const suspiciousScore = analyzer.calculateSuspicionScore();
    const credibilityScore = analyzer.calculateCredibilityScore();
    const emotionalScore = analyzer.calculateEmotionalManipulation();
    const structureScore = analyzer.analyzeStructure();
    const sourceScore = analyzer.analyzeSourceCredibility();

    let finalScore = Math.round(
        (credibilityScore * 0.34) +
        ((100 - suspiciousScore) * 0.36) +
        ((100 - emotionalScore) * 0.14) +
        (structureScore * 0.08) +
        (sourceScore * 0.08)
    );

    const hasCredentialRequest = /\b(otp|pin|cvv|password|verification code)\b/i.test(text);
    const hasUrgency = /\b(urgent|immediately|final warning|last chance|blocked|suspended)\b/i.test(text);
    const hasShortLink = /bit\.ly|tinyurl|shorturl|wa\.me/i.test(text);
    const hasPrizeHook = /\b(lottery|prize|winner|reward|cashback)\b/i.test(text);
    const hasRemoteAccess = /\b(anydesk|teamviewer|screen share|remote access)\b/i.test(text);

    if ((hasCredentialRequest && hasUrgency) || (hasShortLink && hasUrgency)) {
        finalScore = Math.min(finalScore, 15);
    }
    if (hasPrizeHook && (hasShortLink || hasUrgency)) {
        finalScore = Math.min(finalScore, 18);
    }
    if (hasRemoteAccess) {
        finalScore = Math.min(finalScore, 10);
    }

    let verdict = 'PROCEED WITH CAUTION';
    if (finalScore < 35) verdict = 'HIGHLY SUSPICIOUS';
    else if (finalScore > 72) verdict = 'LIKELY LEGITIMATE';

    return {
        score: Math.max(0, Math.min(100, finalScore)),
        verdict,
        analysis: analyzer.generateDetailedAnalysis(finalScore, verdict),
        credibilityScore,
        suspiciousScore,
        emotionalScore,
        structureScore,
        sourceScore,
        indicators: analyzer.generateIndicators(suspiciousScore, credibilityScore, emotionalScore),
        recommendations: generateRecommendations(verdict, 'phone'),
        aiProvider: 'local-heuristic',
        aiModel: 'verifyit-v3-local-phone',
        contentType: 'phone'
    };
}

// Advanced AI-like analysis system
function performTextAdvancedAnalysis(text) {
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
        aiModel: 'verifyit-v3-local',
        contentType: 'text'
    };
}

function performAdvancedAnalysis(text) {
    const mode = detectAnalysisMode(text);
    if (mode === 'phone') {
        return performPhoneAdvancedAnalysis(text);
    }
    return performTextAdvancedAnalysis(text);
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

    const contentType = baseResult && typeof baseResult.contentType === 'string'
        ? baseResult.contentType.toLowerCase()
        : 'text';

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
        recommendations: generateRecommendations(verdict, contentType),
        aiProvider: provider,
        aiModel: model,
        contentType: contentType === 'phone' ? 'phone' : 'text'
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
        recommendations: generateRecommendations(verdict, localResult.contentType || geminiResult.contentType || 'text'),
        aiProvider: 'gemini-api',
        aiModel: geminiModel,
        contentType: localResult.contentType || geminiResult.contentType || 'text'
    };
}

function buildGeminiPromptForMode(text, mode) {
    const modeLine = mode === 'phone'
        ? 'Mode: PHONE SPAM ANALYSIS (calls/SMS/number-based scam detection).'
        : 'Mode: TEXT MISINFORMATION/SPAM ANALYSIS.';

    return [
        'You are a fraud, misinformation, and spam detector.',
        modeLine,
        'Analyze the content and respond ONLY as valid JSON.',
        'Required keys: score, verdict, analysis, credibilityScore, suspiciousScore, emotionalScore, structureScore, sourceScore, indicators, contentType.',
        'All score fields must be integers from 0 to 100.',
        'verdict must be one of: HIGHLY SUSPICIOUS, PROCEED WITH CAUTION, LIKELY LEGITIMATE.',
        'contentType must be either "text" or "phone".',
        'indicators must be an array of at most 6 short strings.',
        'analysis must be at most 220 characters.',
        'Scoring rule: lower score means riskier/suspicious; higher score means more trustworthy.',
        'Return pure JSON only. No markdown, no code fences, no extra text.',
        'Content to analyze:',
        text
    ].join('\n');
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
    const mode = localBaseline.contentType === 'phone' ? 'phone' : 'text';

    if (geminiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiKey)}`;
            const prompt = buildGeminiPromptForMode(text, mode);

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

function generateRecommendations(verdict, contentType = 'text') {
    if (contentType === 'phone') {
        switch (verdict) {
            case 'HIGHLY SUSPICIOUS':
                return [
                    'Do not call back or reply to this number/content',
                    'Never share OTP, PIN, CVV, or screen access',
                    'Block/report the number in your phone and carrier app',
                    'Verify claims only via official website/app numbers'
                ];
            case 'LIKELY LEGITIMATE':
                return [
                    'Message seems lower-risk, but verify sender identity first',
                    'Use official saved numbers for any sensitive actions',
                    'Avoid clicking shortened links from unknown sources',
                    'Keep fraud alerts enabled in your banking/UPI apps'
                ];
            default:
                return [
                    'Treat as unverified and confirm via official channels',
                    'Do not share credentials or install remote-access apps',
                    'Check number reputation in trusted spam-report tools',
                    'If financial, contact provider from its official app/site'
                ];
        }
    }

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

    const resolvedContentType = parsedJson && typeof parsedJson.contentType === 'string' && parsedJson.contentType.toLowerCase() === 'phone'
        ? 'phone'
        : detectAnalysisMode(originalText);

    return {
        score,
        verdict,
        analysis,
        credibilityScore: toBoundedNumber(parsedJson && parsedJson.credibilityScore, score),
        suspiciousScore: toBoundedNumber(parsedJson && parsedJson.suspiciousScore, Math.max(0, 100 - score)),
        emotionalScore: toBoundedNumber(parsedJson && parsedJson.emotionalScore, 50),
        structureScore: toBoundedNumber(parsedJson && parsedJson.structureScore, 55),
        sourceScore: toBoundedNumber(parsedJson && parsedJson.sourceScore, 50),
        contentType: resolvedContentType,
        indicators: Array.isArray(parsedJson && parsedJson.indicators) && parsedJson.indicators.length > 0
            ? parsedJson.indicators.slice(0, 6)
            : extractKeyFindings(analysis),
        recommendations: generateRecommendations(verdict, resolvedContentType)
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