// Configuration
const API_BASE_URL = window.location.origin;

// DOM Elements
const Submit = document.querySelector("#Submit");
const First = document.querySelector("#First");
const Result = document.querySelector("#FinalResult");
const Loader = document.querySelector("#Loader");
const textarea = document.querySelector("#myTextarea");
const charCount = document.querySelector("#charCount");
const newVerificationBtn = document.querySelector("#newVerification");
const shareResultsBtn = document.querySelector("#shareResults");
const newsletterForm = document.querySelector("#newsletterForm");
const subscriberEmail = document.querySelector("#subscriberEmail");
const subscriptionResult = document.querySelector("#subscriptionResult");

// Chart instance
let scoreChart = null;

// Character counter functionality
function updateCharCount() {
    if (textarea && charCount) {
        const count = textarea.value.length;
        charCount.textContent = count.toLocaleString();
        
        // Change color based on length
        if (count > 5000) {
            charCount.style.color = '#e53e3e';
        } else if (count > 3000) {
            charCount.style.color = '#dd6b20';
        } else {
            charCount.style.color = '#a0aec0';
        }
    }
}

// Loading step animation
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.step');
    let currentStep = 0;
    
    const interval = setInterval(() => {
        if (currentStep > 0) {
            steps[currentStep - 1].classList.remove('active');
            steps[currentStep - 1].classList.add('completed');
        }
        
        if (currentStep < steps.length) {
            steps[currentStep].classList.add('active');
            currentStep++;
        } else {
            clearInterval(interval);
        }
    }, 1000);
    
    return interval;
}

// Reset loading steps
function resetLoadingSteps() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index === 0) step.classList.add('active');
    });
}

// Create circular score chart
function createScoreChart(score) {
    const canvas = document.getElementById('scoreChart');
    if (!canvas) return;

    if (typeof Chart !== 'function') {
        console.warn('Chart.js unavailable. Falling back to text-only score rendering.');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (scoreChart) {
        scoreChart.destroy();
    }
    
    // Determine color based on score
    let color, bgColor;
    if (score >= 70) {
        color = '#48bb78'; // green
        bgColor = '#c6f6d5';
    } else if (score >= 40) {
        color = '#ed8936'; // orange
        bgColor = '#fbd38d';
    } else {
        color = '#f56565'; // red
        bgColor = '#fed7d7';
    }
    
    scoreChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [color, bgColor],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            animation: {
                animateRotate: true,
                duration: 1500,
                easing: 'easeOutCubic'
            }
        }
    });
}

// Animate progress bar
function animateProgressBar(elementId, targetPercentage) {
    const bar = document.getElementById(elementId);
    const valueSpan = document.getElementById(elementId.replace('Bar', 'Score'));
    
    if (!bar || !valueSpan) return;
    
    let currentPercentage = 0;
    const increment = targetPercentage / 50; // 50 steps for smooth animation
    
    const animation = setInterval(() => {
        currentPercentage += increment;
        if (currentPercentage >= targetPercentage) {
            currentPercentage = targetPercentage;
            clearInterval(animation);
        }
        
        bar.style.width = `${currentPercentage}%`;
        valueSpan.textContent = `${Math.round(currentPercentage)}%`;
    }, 30);
}

// Display indicators
function displayIndicators(indicators) {
    const container = document.getElementById('indicatorsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    indicators.forEach((indicator, index) => {
        const item = document.createElement('div');
        item.className = 'indicator-item';
        
        // Determine indicator type for styling
        if (indicator.includes('✅')) {
            item.classList.add('positive');
        } else if (indicator.includes('⚠️')) {
            item.classList.add('warning');
        } else if (indicator.includes('🚨')) {
            item.classList.add('negative');
        }
        
        item.innerHTML = `
            <span class="indicator-text">${indicator}</span>
        `;
        
        // Staggered animation
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in-scale');
        
        container.appendChild(item);
    });
}

// Display recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    recommendations.forEach((recommendation, index) => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        
        item.innerHTML = `
            <span class="recommendation-text">${recommendation}</span>
        `;
        
        // Staggered animation
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in-scale');
        
        container.appendChild(item);
    });
}

function getContentTypeLabel(contentType) {
    if (typeof contentType === 'string' && contentType.toLowerCase() === 'phone') {
        return 'Phone/SMS';
    }
    return 'Text';
}

// Update verdict display
function updateVerdictDisplay(verdict, analysis, contentType) {
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictText = document.getElementById('verdictText');
    const verdictDescription = document.getElementById('verdictDescription');
    const scoreLabel = document.getElementById('scoreLabel');
    
    if (!verdictIcon || !verdictText || !verdictDescription) return;
    
    // Map verdict to display data
    const verdictMap = {
        'HIGHLY SUSPICIOUS': {
            icon: '🚨',
            color: '#f56565',
            title: 'High Risk Content',
            description: 'This content shows multiple warning signs and should be treated with extreme caution.'
        },
        'PROCEED WITH CAUTION': {
            icon: '⚠️',
            color: '#ed8936',
            title: 'Proceed With Caution',
            description: 'This content has mixed signals and requires additional verification.'
        },
        'LIKELY LEGITIMATE': {
            icon: '✅',
            color: '#48bb78',
            title: 'Likely Trustworthy',
            description: 'This content appears credible but should still be verified for important claims.'
        }
    };
    
    const verdictData = verdictMap[verdict] || verdictMap['PROCEED WITH CAUTION'];
    
    verdictIcon.textContent = verdictData.icon;
    verdictIcon.style.color = verdictData.color;
    verdictText.textContent = verdictData.title;
    verdictText.style.color = verdictData.color;
    const typeLabel = getContentTypeLabel(contentType);
    const description = analysis || verdictData.description;
    verdictDescription.textContent = `[Detected: ${typeLabel}] ${description}`;

    if (scoreLabel) {
        const normalizedType = typeof contentType === 'string' ? contentType.toLowerCase() : 'text';
        scoreLabel.textContent = normalizedType === 'phone' ? 'Safety Score' : 'Credibility';
    }
}

// Update score display
function updateScoreDisplay(score) {
    const scoreNumber = document.getElementById('scoreNumber');
    if (!scoreNumber) return;
    
    // Animate score counting up
    let currentScore = 0;
    const increment = score / 60; // 60 steps for smooth counting
    
    const countAnimation = setInterval(() => {
        currentScore += increment;
        if (currentScore >= score) {
            currentScore = score;
            clearInterval(countAnimation);
        }
        scoreNumber.textContent = Math.round(currentScore);
    }, 25);
}

// API call function
async function callVerificationAPI(text) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text.trim() })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result || typeof result.score !== 'number') {
            throw new Error('Invalid response format from server');
        }
        
        return result;
        
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Display visual results
function displayVisualResults(result) {
    setTimeout(() => {
        // Update main score chart and display
        createScoreChart(result.score);
        updateScoreDisplay(result.score);
        
        // Update verdict
        updateVerdictDisplay(result.verdict, result.analysis, result.contentType);
        
        // Calculate and display metrics
        const trustScore = result.credibilityScore || Math.max(0, result.score);
        const riskScore = result.suspiciousScore || Math.max(0, 100 - result.score);
        const emotionScore = result.emotionalScore || Math.min(100, Math.max(0, 100 - result.score + 20));
        const qualityScore = result.structureScore || Math.max(0, result.score - 10);
        
        // Animate progress bars with delays
        setTimeout(() => animateProgressBar('trustBar', trustScore), 200);
        setTimeout(() => animateProgressBar('riskBar', riskScore), 400);
        setTimeout(() => animateProgressBar('emotionBar', emotionScore), 600);
        setTimeout(() => animateProgressBar('qualityBar', qualityScore), 800);
        
        // Display indicators and recommendations
        setTimeout(() => {
            displayIndicators(result.indicators || []);
            displayRecommendations(result.recommendations || []);
        }, 1000);
        
    }, 100);
}

// Main verification function
async function performVerification() {
    if (!textarea.value.trim()) {
        alert('Please enter some text to verify!');
        return;
    }
    
    if (textarea.value.length > 10000) {
        alert('Text is too long! Please limit to 10,000 characters.');
        return;
    }
    
    try {
        // Disable submit button and show loading
        Submit.disabled = true;
        resetLoadingSteps();
        Loader.classList.remove('hidden');
        
        // Start loading animation
        const loadingInterval = animateLoadingSteps();
        
        // Make real API call to backend
        const result = await callVerificationAPI(textarea.value.trim());
        
        // Clear loading interval
        clearInterval(loadingInterval);
        
        // Display visual results
        displayVisualResults(result);
        
        // Hide loader and switch views
        Loader.classList.add('hidden');
        First.classList.add('hidden');
        Result.classList.remove('hidden');
        
        // Re-enable submit button
        Submit.disabled = false;
        
        // Smooth scroll to results
        setTimeout(() => {
            Result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        console.log('Verification completed:', { 
            score: result.score, 
            verdict: result.verdict,
            textLength: result.textLength 
        });
        
    } catch (error) {
        console.error('Verification error:', error);
        
        // Hide loader
        Loader.classList.add('hidden');
        
        // Show user-friendly error message
        let errorMessage = 'Sorry, there was an error during verification. Please try again.';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to verification service. Please check your internet connection and try again.';
        } else if (error.message.includes('too long')) {
            errorMessage = 'Your text is too long. Please shorten it to under 10,000 characters.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
        
        // Re-enable submit button
        Submit.disabled = false;
    }
}

// Reset to new verification
function resetVerification() {
    textarea.value = '';
    updateCharCount();
    Result.classList.add('hidden');
    First.classList.remove('hidden');
    
    // Destroy chart
    if (scoreChart) {
        scoreChart.destroy();
        scoreChart = null;
    }
    
    // Smooth scroll back to input
    setTimeout(() => {
        textarea.focus();
        First.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Share results function
function shareResults() {
    const scoreNumber = document.getElementById('scoreNumber');
    const verdictText = document.getElementById('verdictText');
    
    if (!scoreNumber || !verdictText) return;
    
    const shareText = `I just analyzed some content using VerifyIt!\nCredibility Score: ${scoreNumber.textContent}/100\nVerdict: ${verdictText.textContent}\n\nTry it yourself: ${window.location.origin}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'VerifyIt Analysis Results',
            text: shareText
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard!');
        }).catch(() => {
            alert('Unable to share results. Please copy manually.');
        });
    }
}

// Newsletter subscription function
async function subscribeToNewsletter(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email.trim() })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Subscription failed');
        }
        
        return result;
        
    } catch (error) {
        console.error('Newsletter subscription failed:', error);
        throw error;
    }
}

// Handle newsletter form submission
function handleNewsletterSubmission(event) {
    event.preventDefault();
    
    const email = subscriberEmail.value.trim();
    
    if (!email) {
        showSubscriptionResult('Please enter your email address', 'error');
        return;
    }
    
    // Disable form while processing
    const submitBtn = newsletterForm.querySelector('.subscribe-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Subscribing...</span>';
    
    subscribeToNewsletter(email)
        .then(result => {
            showSubscriptionResult(result.message, 'success');
            subscriberEmail.value = '';
            
            // Hide form after successful subscription
            setTimeout(() => {
                newsletterForm.style.display = 'none';
                const successMessage = document.createElement('div');
                successMessage.className = 'subscription-success';
                successMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <h4>You're all set!</h4>
                    <p>We'll keep you informed about security threats</p>
                `;
                newsletterForm.parentNode.appendChild(successMessage);
            }, 2000);
        })
        .catch(error => {
            showSubscriptionResult(error.message, 'error');
        })
        .finally(() => {
            // Re-enable form
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
}

// Show subscription result message
function showSubscriptionResult(message, type) {
    if (!subscriptionResult) return;
    
    subscriptionResult.textContent = message;
    subscriptionResult.className = `subscription-result ${type}`;
    subscriptionResult.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        subscriptionResult.classList.add('hidden');
    }, 5000);
}

// Event listeners
if (Submit) {
    Submit.addEventListener('click', performVerification);
}

if (newVerificationBtn) {
    newVerificationBtn.addEventListener('click', resetVerification);
}

if (shareResultsBtn) {
    shareResultsBtn.addEventListener('click', shareResults);
}

if (newsletterForm) {
    newsletterForm.addEventListener('submit', handleNewsletterSubmission);
}

if (textarea) {
    textarea.addEventListener('input', updateCharCount);
    updateCharCount(); // Initial count
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to verify
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !Submit.disabled) {
        e.preventDefault();
        performVerification();
    }
    
    // Escape to cancel/reset
    if (e.key === 'Escape') {
        if (!Loader.classList.contains('hidden')) {
            Loader.classList.add('hidden');
            Submit.disabled = false;
        } else if (!Result.classList.contains('hidden')) {
            resetVerification();
        }
    }
});

// Auto-focus textarea when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (textarea) {
        setTimeout(() => textarea.focus(), 500);
    }
});

console.log('VerifyIt Visual Dashboard initialized successfully! 🚀📊');