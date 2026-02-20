# VerifyIt - AI-Powered Fact Checker 🤖

A beautiful, modern web application that uses artificial intelligence to verify text content and detect misinformation, fake news, and scam messages.

![VerifyIt Preview](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-blue)

## ✨ Features

- 🎨 **Beautiful Modern UI** - Glassmorphism design with smooth animations
- 🤖 **AI-Powered Analysis** - Uses OpenAI GPT-3.5 for intelligent text verification
- 📊 **Credibility Scoring** - Get numerical scores (0-100) for content reliability
- 🔍 **Pattern Recognition** - Fallback analysis when AI is unavailable
- 📱 **Fully Responsive** - Works perfectly on desktop, tablet, and mobile
- ⚡ **Real-time Feedback** - Character counter and loading animations
- 🛡️ **Security Focused** - Input validation and error handling

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **OpenAI API Key** (optional) - [Get yours here](https://platform.openai.com/api-keys)
- **Neon PostgreSQL Database URL** - [Create Neon project](https://neon.tech/)

### Installation

1. **Clone or download this repository**
   ```powershell
   cd "C:\\Users\\Ansh\\Desktop\\VerifyIt"
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Configure environment variables**
   - Open `config/.env` file
   - Replace `your_openai_api_key_here` with your actual OpenAI API key
   - Add your Neon connection string:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
   ```
   - If you don't have an API key, the app will use pattern-based analysis

4. **Start the server**
   ```powershell
   npm start
   ```

5. **Open in browser**
   - Navigate to `http://localhost:3000`
   - Start verifying content! 🎉

## 🔧 Configuration

### OpenAI API Setup
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and generate an API key
3. Add your API key to the `.env` file:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

### Without OpenAI (Free Mode)
The application works without an OpenAI API key using intelligent pattern recognition:
- Analyzes text for suspicious patterns
- Checks for credibility indicators  
- Provides basic misinformation detection
- No external API costs

## 📁 Project Structure

```
VerifyIt/
├── server.js          # Backend server with AI integration
├── index.html         # Beautiful frontend interface
├── style.css          # Modern styling with animations
├── script.js          # Frontend JavaScript logic
├── package.json       # Dependencies and scripts
├── .env              # Environment configuration
└── README.md         # This file
```

## 🎯 How It Works

1. **Input Text** - Paste any suspicious content (news, messages, claims)
2. **AI Analysis** - Content is analyzed for:
   - Factual accuracy patterns
   - Emotional manipulation tactics
   - Source credibility indicators
   - Known misinformation patterns
3. **Get Results** - Receive:
   - Credibility score (0-100)
   - Detailed analysis
   - Specific indicators found
   - Actionable recommendations

## 🔌 API Endpoints

### POST `/api/verify`
Verify text content for credibility.

**Request:**
```json
{
  "text": "Content to verify..."
}
```

**Response:**
```json
{
  "score": 85,
  "verdict": "LIKELY LEGITIMATE",
  "analysis": "Detailed AI analysis...",
  "indicators": ["✓ Credible patterns found", "⚠ Minor concerns"],
  "recommendations": ["Cross-reference with sources"],
  "timestamp": "2026-02-18T10:30:00.000Z"
}
```

### GET `/api/health`
Check server status and configuration.

## 🛠️ Development

### Development Mode
```powershell
npm run dev
```
Uses nodemon for automatic server restarts during development.

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run install-deps` - Install all dependencies

## 🔒 Security Features

- Input validation (10,000 character limit)
- CORS protection
- Environment variable protection
- Error handling and user feedback
- No sensitive data logging

## 🎨 UI Features

- **Glassmorphism Design** - Modern frosted glass aesthetic
- **Gradient Backgrounds** - Beautiful purple-blue gradients
- **Smooth Animations** - Hover effects and transitions
- **Loading States** - Multi-step progress indicators
- **Responsive Layout** - Mobile-first design approach
- **Accessibility** - Keyboard shortcuts and focus states

## 📱 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🤝 Contributing

This project is ready for enhancement! Consider adding:
- User accounts and history
- Additional AI models
- Batch processing
- API rate limiting
- Database integration

## 📜 License

MIT License - feel free to use and modify for your projects!

---

## 🆘 Troubleshooting

### Common Issues

**Server won't start:**
- Check if port 3000 is available
- Ensure Node.js 16+ is installed
- Run `npm install` to install dependencies

**AI analysis not working:**
- Verify OpenAI API key in `.env` file
- Check internet connection
- App will fallback to pattern analysis if AI unavailable

**Frontend not loading:**
- Ensure server is running on `http://localhost:3000`
- Check browser console for errors
- Try refreshing the page

### Support

Need help? Check the console for error messages or create an issue with:
- Your operating system
- Node.js version (`node --version`)
- Error message (if any)

---

**Made with ❤️ for fighting misinformation**