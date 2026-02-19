// Trading Analysis Platform - Main JavaScript File

// DOM Elements
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('header nav a');
const runAnalysisBtn = document.getElementById('run-analysis');
const fetchMarketDataBtn = document.getElementById('fetch-market-data');
const fetchNewsBtn = document.getElementById('fetch-news');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadInitialData();
    initializeChart();
});

// Set up navigation between sections
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = document.querySelector(this.getAttribute('href'));
            sections.forEach(section => section.classList.remove('active'));
            targetSection.classList.add('active');
        });
    });
}

// Load initial data when page loads
async function loadInitialData() {
    try {
        // Load account information
        await loadAccountInfo();
        
        // Load pricing data
        await loadPricingData();
        
        // Load news feed
        await loadNewsFeed();
        
        // Load market instruments
        await loadMarketInstruments();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Load account information
async function loadAccountInfo() {
    try {
        const response = await fetch('/api/account');
        const data = await response.json();
        
        const accountInfoDiv = document.getElementById('account-info');
        if (data.account) {
            accountInfoDiv.innerHTML = `
                <p><strong>Account ID:</strong> ${data.account.id}</p>
                <p><strong>Account Name:</strong> ${data.account.alias || 'N/A'}</p>
                <p><strong>Balance:</strong> ${data.account.balance} ${data.account.currency}</p>
                <p><strong>Margin Used:</strong> ${data.account.marginUsed}</p>
                <p><strong>Margin Available:</strong> ${data.account.marginAvailable}</p>
                <p><strong>Open Trades:</strong> ${data.account.openTradeCount}</p>
                <p><strong>Unrealized P/L:</strong> <span class="${data.account.unrealizedPL >= 0 ? 'positive' : 'negative'}">${data.account.unrealizedPL}</span></p>
            `;
        } else {
            accountInfoDiv.innerHTML = '<p>Unable to load account information</p>';
        }
    } catch (error) {
        console.error('Error loading account info:', error);
        document.getElementById('account-info').innerHTML = '<p>Error loading account information</p>';
    }
}

// Load pricing data
async function loadPricingData() {
    try {
        const response = await fetch('/api/pricing?instruments=EUR_USD,GBP_USD,USD_JPY,USD_CAD,AUD_USD');
        const data = await response.json();
        
        const pricingDataDiv = document.getElementById('pricing-data');
        if (data.prices) {
            let pricingHTML = '<ul>';
            data.prices.forEach(price => {
                const bid = parseFloat(price.bids[0].price);
                const ask = parseFloat(price.asks[0].price);
                const spread = (ask - bid).toFixed(5);
                
                pricingHTML += `
                    <li>
                        <strong>${price.instrument}</strong>: 
                        Bid ${bid}, Ask ${ask}, Spread ${spread}
                    </li>
                `;
            });
            pricingHTML += '</ul>';
            pricingDataDiv.innerHTML = pricingHTML;
        } else {
            pricingDataDiv.innerHTML = '<p>Unable to load pricing data</p>';
        }
    } catch (error) {
        console.error('Error loading pricing data:', error);
        document.getElementById('pricing-data').innerHTML = '<p>Error loading pricing data</p>';
    }
}

// Load news feed
async function loadNewsFeed() {
    try {
        const response = await fetch('/api/news');
        const data = await response.json();
        
        const newsFeedDiv = document.getElementById('news-feed');
        if (data.articles) {
            let newsHTML = '<ul>';
            data.articles.slice(0, 5).forEach(article => {
                newsHTML += `
                    <li>
                        <h4>${article.title}</h4>
                        <p>${article.description}</p>
                        <small>Source: ${article.source} | ${new Date(article.publishedAt).toLocaleString()}</small>
                    </li>
                `;
            });
            newsHTML += '</ul>';
            newsFeedDiv.innerHTML = newsHTML;
        } else {
            newsFeedDiv.innerHTML = '<p>Unable to load news feed</p>';
        }
    } catch (error) {
        console.error('Error loading news feed:', error);
        document.getElementById('news-feed').innerHTML = '<p>Error loading news feed</p>';
    }
}

// Load market instruments
async function loadMarketInstruments() {
    try {
        const response = await fetch('/api/instruments');
        const data = await response.json();
        
        // This would populate a dropdown or table with available instruments
        // For now, just log the instruments
        console.log('Available instruments:', data);
    } catch (error) {
        console.error('Error loading market instruments:', error);
    }
}

// Initialize chart
let priceChart;
function initializeChart() {
    const ctx = document.getElementById('price-chart');
    if (ctx) {
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Price Chart'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }
}

// Update chart with new data
function updateChart(labels, data) {
    if (priceChart) {
        priceChart.data.labels = labels;
        priceChart.data.datasets[0].data = data;
        priceChart.update();
    }
}

// Event Listeners
runAnalysisBtn.addEventListener('click', runAIAnalysis);
fetchMarketDataBtn.addEventListener('click', fetchMarketData);
fetchNewsBtn.addEventListener('click', loadNewsFeed);

// Run AI Analysis
async function runAIAnalysis() {
    const analysisType = document.getElementById('analysis-type').value;
    const instrument = document.getElementById('instrument-input').value.toUpperCase();
    const analysisStepsDiv = document.getElementById('analysis-steps');
    
    // Show loading state
    analysisStepsDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Initiating AI analysis...</p>';
    
    try {
        // Step 1: Fetch market data
        analysisStepsDiv.innerHTML += '<p><i class="fas fa-check-circle positive"></i> Step 1: Retrieving market data for ' + instrument + '</p>';
        const marketResponse = await fetch(`/api/candles/${instrument}?granularity=M15&count=500`);
        const marketData = await marketResponse.json();
        
        // Step 2: Fetch news data
        analysisStepsDiv.innerHTML += '<p><i class="fas fa-check-circle positive"></i> Step 2: Gathering relevant news and sentiment</p>';
        const newsResponse = await fetch('/api/news');
        const newsData = await newsResponse.json();
        
        // Step 3: Perform technical analysis
        analysisStepsDiv.innerHTML += '<p><i class="fas fa-check-circle positive"></i> Step 3: Performing technical analysis</p>';
        const technicalAnalysis = performTechnicalAnalysis(marketData);
        
        // Step 4: Perform sentiment analysis
        analysisStepsDiv.innerHTML += '<p><i class="fas fa-check-circle positive"></i> Step 4: Analyzing market sentiment</p>';
        const sentimentAnalysis = performSentimentAnalysis(newsData, instrument);
        
        // Step 5: Generate AI recommendation
        analysisStepsDiv.innerHTML += '<p><i class="fas fa-check-circle positive"></i> Step 5: Generating AI trading recommendation</p>';
        const recommendation = generateRecommendation(technicalAnalysis, sentimentAnalysis, instrument);
        
        // Display recommendation
        analysisStepsDiv.innerHTML += `
            <div class="card" style="margin-top: 1rem;">
                <h3>AI Trading Recommendation for ${instrument}</h3>
                <p><strong>Signal:</strong> <span class="signal-${recommendation.action}">${recommendation.action.toUpperCase()}</span></p>
                <p><strong>Confidence:</strong> ${recommendation.confidence}%</p>
                <p><strong>Reasoning:</strong> ${recommendation.reasoning}</p>
                <p><strong>Risk Level:</strong> ${recommendation.riskLevel}</p>
            </div>
        `;
        
        // Update trading signals panel
        updateTradingSignals(recommendation, instrument);
        
        // Update AI analysis panel
        updateAIAnalysisPanel(recommendation, technicalAnalysis, sentimentAnalysis);
        
    } catch (error) {
        console.error('Error during AI analysis:', error);
        analysisStepsDiv.innerHTML += `<p class="negative">Error: ${error.message}</p>`;
    }
}

// Perform technical analysis
function performTechnicalAnalysis(marketData) {
    // This is a simplified technical analysis
    // In a real implementation, this would include complex algorithms
    
    if (!marketData.candles) {
        return { trend: 'unknown', support: null, resistance: null, rsi: null };
    }
    
    const candles = marketData.candles;
    const closingPrices = candles.map(candle => parseFloat(candle.mid.c)).filter(price => !isNaN(price));
    
    if (closingPrices.length < 2) {
        return { trend: 'unknown', support: null, resistance: null, rsi: null };
    }
    
    // Calculate simple trend based on last few prices
    const recentPrices = closingPrices.slice(-10);
    const oldestPrice = recentPrices[0];
    const newestPrice = recentPrices[recentPrices.length - 1];
    
    let trend;
    if (newestPrice > oldestPrice * 1.005) {
        trend = 'bullish';
    } else if (newestPrice < oldestPrice * 0.995) {
        trend = 'bearish';
    } else {
        trend = 'neutral';
    }
    
    // Find approximate support and resistance
    const support = Math.min(...closingPrices);
    const resistance = Math.max(...closingPrices);
    
    // Calculate RSI (simplified)
    let rsi = null;
    if (closingPrices.length >= 14) {
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < closingPrices.length; i++) {
            const change = closingPrices[i] - closingPrices[i-1];
            if (change > 0) {
                gains.push(change);
                losses.push(0);
            } else {
                gains.push(0);
                losses.push(Math.abs(change));
            }
        }
        
        const avgGain = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
        const avgLoss = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
        
        if (avgLoss !== 0) {
            const rs = avgGain / avgLoss;
            rsi = 100 - (100 / (1 + rs));
        }
    }
    
    return {
        trend,
        support,
        resistance,
        rsi,
        priceLevels: closingPrices
    };
}

// Perform sentiment analysis
function performSentimentAnalysis(newsData, instrument) {
    // This is a simplified sentiment analysis
    // In a real implementation, this would use NLP models
    
    if (!newsData.articles) {
        return { sentiment: 'neutral', relevance: 0, keyPoints: [] };
    }
    
    // Count articles related to the instrument
    const relevantArticles = newsData.articles.filter(article => {
        const lowerTitle = article.title.toLowerCase();
        const lowerDesc = article.description.toLowerCase();
        const instrumentParts = instrument.toLowerCase().split('_');
        
        // Check if any part of the instrument appears in the article
        return instrumentParts.some(part => 
            lowerTitle.includes(part) || lowerDesc.includes(part)
        );
    });
    
    // Simple sentiment scoring
    let sentimentScore = 0;
    relevantArticles.forEach(article => {
        // Keywords that indicate positive/negative sentiment
        const positiveKeywords = ['rise', 'gain', 'bullish', 'up', 'positive', 'strength', 'buy'];
        const negativeKeywords = ['fall', 'loss', 'bearish', 'down', 'negative', 'weak', 'sell'];
        
        const text = (article.title + ' ' + article.description).toLowerCase();
        
        positiveKeywords.forEach(keyword => {
            if (text.includes(keyword)) sentimentScore++;
        });
        
        negativeKeywords.forEach(keyword => {
            if (text.includes(keyword)) sentimentScore--;
        });
    });
    
    let sentiment;
    if (sentimentScore > 0) sentiment = 'positive';
    else if (sentimentScore < 0) sentiment = 'negative';
    else sentiment = 'neutral';
    
    return {
        sentiment,
        relevance: relevantArticles.length / newsData.articles.length * 100,
        keyPoints: relevantArticles.slice(0, 3).map(a => a.title),
        totalRelevant: relevantArticles.length
    };
}

// Generate trading recommendation
function generateRecommendation(technicalAnalysis, sentimentAnalysis, instrument) {
    // Combine technical and sentiment analysis to generate a recommendation
    let action;
    let confidence = 50; // Base confidence
    let riskLevel = 'medium';
    let reasoning = '';
    
    // Determine action based on technical and sentiment analysis
    if (technicalAnalysis.trend === 'bullish' && sentimentAnalysis.sentiment === 'positive') {
        action = 'buy';
        reasoning = `Technical analysis shows bullish trend with positive market sentiment. Support at ${technicalAnalysis.support.toFixed(5)}, resistance at ${technicalAnalysis.resistance.toFixed(5)}.`;
        confidence += 20;
    } else if (technicalAnalysis.trend === 'bearish' && sentimentAnalysis.sentiment === 'negative') {
        action = 'sell';
        reasoning = `Technical analysis shows bearish trend with negative market sentiment. Support at ${technicalAnalysis.support.toFixed(5)}, resistance at ${technicalAnalysis.resistance.toFixed(5)}.`;
        confidence += 20;
    } else if (technicalAnalysis.trend === 'bullish' && sentimentAnalysis.sentiment === 'neutral') {
        action = 'buy';
        reasoning = `Technical analysis shows bullish trend but sentiment is neutral. Consider with caution. Support at ${technicalAnalysis.support.toFixed(5)}, resistance at ${technicalAnalysis.resistance.toFixed(5)}.`;
        confidence += 10;
    } else if (technicalAnalysis.trend === 'bearish' && sentimentAnalysis.sentiment === 'neutral') {
        action = 'sell';
        reasoning = `Technical analysis shows bearish trend but sentiment is neutral. Consider with caution. Support at ${technicalAnalysis.support.toFixed(5)}, resistance at ${technicalAnalysis.resistance.toFixed(5)}.`;
        confidence += 10;
    } else if (technicalAnalysis.trend === 'neutral' && sentimentAnalysis.sentiment === 'positive') {
        action = 'buy';
        reasoning = `Market sentiment is positive but technical trend is neutral. Wait for stronger technical signals. Support at ${technicalAnalysis.support.toFixed(5)}, resistance at ${technicalAnalysis.resistance.toFixed(5)}.`;
        confidence -= 10;
    } else if (technicalAnalysis.trend === 'neutral' && sentimentAnalysis.sentiment === 'negative') {
        action = 'sell';
        reasoning = `Market sentiment is negative but technical trend is neutral. Wait for stronger technical signals. Support at ${technicalAnalysis.support.toFixed(5)}, resistance at ${technicalAnalysis.resistance.toFixed(5)}.`;
        confidence -= 10;
    } else {
        action = 'hold';
        reasoning = `Both technical and sentiment analysis are mixed. No clear signal identified. Support at ${technicalAnalysis.support.toFixed(5)}, resistance at ${technicalAnalysis.resistance.toFixed(5)}.`;
        confidence -= 20;
    }
    
    // Adjust confidence based on RSI
    if (technicalAnalysis.rsi !== null) {
        if ((action === 'buy' && technicalAnalysis.rsi < 30) || 
            (action === 'sell' && technicalAnalysis.rsi > 70)) {
            // Overbought/oversold conditions might reduce confidence
            confidence -= 10;
            reasoning += ` RSI at ${technicalAnalysis.rsi.toFixed(2)} suggests potential overbought/oversold condition.`;
        } else if ((action === 'buy' && technicalAnalysis.rsi > 30 && technicalAnalysis.rsi < 70) || 
                   (action === 'sell' && technicalAnalysis.rsi > 30 && technicalAnalysis.rsi < 70)) {
            // Healthy RSI values increase confidence
            confidence += 5;
            reasoning += ` RSI at ${technicalAnalysis.rsi.toFixed(2)} confirms healthy momentum.`;
        }
    }
    
    // Adjust confidence based on sentiment relevance
    confidence += (sentimentAnalysis.relevance * 0.2);
    
    // Ensure confidence is between 10 and 100
    confidence = Math.min(100, Math.max(10, confidence));
    
    // Determine risk level based on confidence
    if (confidence > 80) riskLevel = 'low';
    else if (confidence < 60) riskLevel = 'high';
    
    return {
        action,
        confidence: Math.round(confidence),
        riskLevel,
        reasoning
    };
}

// Update trading signals panel
function updateTradingSignals(recommendation, instrument) {
    const signalsDiv = document.getElementById('trading-signals');
    signalsDiv.innerHTML = `
        <div class="signal-${recommendation.action}">
            <p><strong>NEW SIGNAL</strong></p>
            <p><strong>Instrument:</strong> ${instrument}</p>
            <p><strong>Action:</strong> ${recommendation.action.toUpperCase()}</p>
            <p><strong>Confidence:</strong> ${recommendation.confidence}%</p>
            <p><strong>Risk:</strong> ${recommendation.riskLevel}</p>
        </div>
    `;
}

// Update AI analysis panel
function updateAIAnalysisPanel(recommendation, technicalAnalysis, sentimentAnalysis) {
    const aiAnalysisDiv = document.getElementById('ai-analysis');
    aiAnalysisDiv.innerHTML = `
        <h3>Latest AI Analysis Result</h3>
        <div class="signal-${recommendation.action}" style="padding: 1rem; margin: 1rem 0;">
            <p><strong>Recommended Action:</strong> ${recommendation.action.toUpperCase()}</p>
            <p><strong>Confidence Level:</strong> ${recommendation.confidence}%</p>
            <p><strong>Risk Assessment:</strong> ${recommendation.riskLevel} risk</p>
        </div>
        <div class="card" style="margin-top: 1rem;">
            <h4>Technical Analysis</h4>
            <p><strong>Trend:</strong> ${technicalAnalysis.trend}</p>
            <p><strong>Support Level:</strong> ${technicalAnalysis.support ? technicalAnalysis.support.toFixed(5) : 'N/A'}</p>
            <p><strong>Resistance Level:</strong> ${technicalAnalysis.resistance ? technicalAnalysis.resistance.toFixed(5) : 'N/A'}</p>
            <p><strong>RSI:</strong> ${technicalAnalysis.rsi ? technicalAnalysis.rsi.toFixed(2) : 'N/A'}</p>
        </div>
        <div class="card" style="margin-top: 1rem;">
            <h4>Sentiment Analysis</h4>
            <p><strong>Market Sentiment:</strong> ${sentimentAnalysis.sentiment}</p>
            <p><strong>Relevance Score:</strong> ${sentimentAnalysis.relevance.toFixed(2)}%</p>
            <p><strong>Relevant Articles:</strong> ${sentimentAnalysis.totalRelevant}</p>
        </div>
    `;
}

// Fetch market data for specific instrument
async function fetchMarketData() {
    const symbolInput = document.getElementById('symbol-search');
    const symbol = symbolInput.value.trim().toUpperCase() || 'EUR_USD';
    
    try {
        const response = await fetch(`/api/pricing?instruments=${symbol}`);
        const data = await response.json();
        
        const tbody = document.getElementById('market-tbody');
        if (data.prices) {
            tbody.innerHTML = '';
            data.prices.forEach(price => {
                const bid = parseFloat(price.bids[0].price);
                const ask = parseFloat(price.asks[0].price);
                const spread = (ask - bid).toFixed(5);
                
                // Determine direction indicator
                let direction = 'neutral';
                if (price.closeoutBid !== undefined) {
                    // Simplified direction logic
                    direction = 'positive'; // In real implementation, compare with previous price
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${price.instrument}</td>
                    <td>${bid}</td>
                    <td>${ask}</td>
                    <td>${spread}</td>
                    <td><span class="positive">▲</span></td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5">No data available</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching market data:', error);
        document.getElementById('market-tbody').innerHTML = '<tr><td colspan="5">Error loading data</td></tr>';
    }
}

// Update the page title when clicking on nav links
document.querySelectorAll('header nav a').forEach(link => {
    link.addEventListener('click', function() {
        document.title = `Trading Platform - ${this.textContent}`;
    });
});