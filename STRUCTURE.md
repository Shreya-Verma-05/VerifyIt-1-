# VerifyIt Project Structure

```
VerifyIt/
├── 📁 src/                    # Backend source code
│   ├── server.js              # Main Express server
│   └── analysis.js            # AI analysis engine
│
├── 📁 public/                 # Frontend static files
│   ├── index.html             # Main HTML page  
│   ├── style.css              # Stylesheets
│   ├── script.js              # Client-side JavaScript
│   └── 📁 assets/             # Static assets
│       ├── Logo.png           # VerifyIt logo
│       ├── Security.webp      # Security illustration
│       └── LoadingImage.gif   # Loading animation
│
├── 📁 config/                 # Configuration files
│   └── .env                   # Environment variables
│
├── 📁 node_modules/           # NPM dependencies (auto-generated)
│
├── package.json               # Project configuration & dependencies
├── package-lock.json          # Dependency lock file
├── README.md                  # Project documentation
└── .gitignore                 # Git ignore rules
```

## Directory Structure Explained

### 🖥️ **src/** - Backend Code
Contains all server-side logic and business intelligence:
- **server.js** - Express server, API routes, middleware
- **analysis.js** - Advanced text analysis engine with ML-like capabilities

### 🎨 **public/** - Frontend Code  
Contains client-side files served to browsers:
- **index.html** - Main application interface
- **style.css** - Modern glassmorphism styling
- **script.js** - Frontend logic and API communication
- **assets/** - Images, icons, and static resources

### ⚙️ **config/** - Configuration
Environment and configuration files:
- **.env** - API keys, port settings, environment variables

## Development Commands

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Install dependencies
npm install
```

## File Organization Benefits

✅ **Clear Separation** - Frontend and backend code clearly separated  
✅ **Scalable Structure** - Easy to add new features and modules  
✅ **Professional Layout** - Industry-standard Node.js project structure  
✅ **Asset Management** - Centralized static file organization  
✅ **Configuration Security** - Environment files properly isolated  
✅ **Development Friendly** - Easy navigation and maintenance

This structure follows Node.js best practices and makes the project ready for team collaboration and deployment.