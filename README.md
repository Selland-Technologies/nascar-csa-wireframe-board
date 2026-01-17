# NASCAR Credential Scanning Application - Wireframe Board

Interactive wireframe documentation tool for the NASCAR CSA project with real-time team collaboration via GitHub.

## 🌐 Live URL
**Access the app here:** `https://YOUR-USERNAME.github.io/nascar-wireframe-board/`

(Replace `YOUR-USERNAME` with your actual GitHub username after setup)

---

## 📋 Features

- ✅ Interactive wireframe mockups for all 12 app screens
- ✅ Add API endpoint documentation cards
- ✅ Drag & drop cards to position them
- ✅ Draw arrows from cards to specific UI elements
- ✅ Expandable/collapsible card details
- ✅ Status tracking (Available/In Progress/Not Available)
- ✅ Real-time sync with GitHub
- ✅ Team collaboration - all members see the same data

---

## 🚀 Initial Setup (Repository Owner Only)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Repository settings:
   - **Repository name:** `nascar-wireframe-board`
   - **Visibility:** Private (recommended) or Public
   - **Initialize:** ✅ Check "Add a README file"
4. Click **"Create repository"**

### Step 2: Add Project Files

1. In your new repository, click **"Add file"** → **"Create new file"**
2. Name it: `index.html`
3. Copy and paste this code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NASCAR CSA - Wireframe Board</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" src="app.jsx"></script>
</body>
</html>
```

4. Click **"Commit new file"**

5. Create another file: `app.jsx`
6. Copy the entire React component code from the artifact and paste it
7. Click **"Commit new file"**

### Step 3: Enable GitHub Pages

1. Go to repository **Settings**
2. Scroll down to **"Pages"** section (left sidebar)
3. Under **"Source"**:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **"Save"**
5. Wait 2-3 minutes for deployment
6. Your site will be available at: `https://YOUR-USERNAME.github.io/nascar-wireframe-board/`

### Step 4: Add Team Members

1. Go to repository **Settings** → **Collaborators**
2. Click **"Add people"**
3. Enter each team member's GitHub username
4. They'll receive an invitation email

---

## 👥 Team Member Setup (Everyone on the Team)

### Step 1: Accept Repository Invitation

1. Check your email for GitHub repository invitation
2. Click **"Accept invitation"**
3. You now have access to the repository

### Step 2: Create Personal Access Token

1. Go to GitHub **Settings** (your profile, not repository)
2. Scroll to bottom → Click **"Developer settings"**
3. Click **"Personal access tokens"** → **"Tokens (classic)"**
4. Click **"Generate new token (classic)"**
5. Settings:
   - **Note:** `NASCAR Wireframe App`
   - **Expiration:** 90 days (or your preference)
   - **Scopes:** ✅ Check **`repo`** (full control of private repositories)
6. Click **"Generate token"**
7. **IMPORTANT:** Copy the token immediately (looks like `ghp_xxxxxxxxxxxx`)
   - You won't be able to see it again!
   - Save it somewhere secure

### Step 3: Open the App

1. Go to: `https://YOUR-USERNAME.github.io/nascar-wireframe-board/`
   - Replace `YOUR-USERNAME` with the repository owner's username

### Step 4: Connect to GitHub

1. Click **"GitHub Setup"** button (top-right corner)
2. Fill in the form:
   - **GitHub Personal Access Token:** Paste your token from Step 2
   - **Repository Owner:** The GitHub username of the repository owner
   - **Repository Name:** `nascar-wireframe-board`
   - **File Path:** `api-cards.json` (leave as default)
3. Click **"Save & Connect"**
4. You're all set! 🎉

---

## 📖 How to Use the App

### Adding API Cards

1. **Click on any wireframe screen** (e.g., "Login", "Selection", etc.)
2. Fill in the form:
   - **HTTP Method:** GET, POST, PUT, DELETE, PATCH
   - **Status:** Available (green), In Progress (orange), Not Available (red)
   - **API Endpoint URL:** e.g., `/api/v1/auth/login`
   - **Payload:** Request body in JSON format
   - **Response:** Expected response in JSON format
3. Click **"Add Card"**
4. Card appears and automatically syncs to GitHub

### Positioning Cards

1. **Click and drag** any card to move it
2. Position it near the relevant wireframe screen
3. Release to save the new position

### Drawing Arrows to UI Elements

1. Click the **arrow button** (→) on any card
2. Move your mouse to the specific UI element you want to point to
3. **Click** to place the arrow endpoint
4. A red dashed arrow connects the card to that element
5. To remove: Click the **X button** on the card

### Expanding/Collapsing Cards

- **Collapsed:** Shows endpoint and status only (compact view)
- Click **▼ button** or **"Click to view details"** to expand
- Click **▲ button** to collapse
- Expanded view shows Payload and Response JSON

### Editing Cards

1. Click the **pencil icon** on any card
2. Update any fields
3. Click **"Update"**
4. Changes sync automatically

### Deleting Cards

1. Click the **trash icon** on any card
2. Card is removed and syncs to GitHub

---

## 🔄 Auto-Sync Behavior

- **Auto-saves:** Every change (add/edit/delete/move) saves to GitHub automatically
- **Auto-refresh:** App checks for updates every 30 seconds
- **Manual refresh:** Click the **"Refresh"** button anytime
- **Sync status:** Shows in the header (Last sync time, "Syncing...", "✓ Saved")

---

## 🎯 Best Practices

1. **Collapse cards** when not actively working on them to save screen space
2. **Use arrows** to clearly show which API endpoint powers which UI element
3. **Update status** regularly:
   - Green (Available) = API is implemented and working
   - Orange (In Progress) = API is being developed
   - Red (Not Available) = API is not yet started
4. **Be specific** in endpoint URLs (e.g., `/api/v1/scan` not just `/scan`)
5. **Include examples** in Payload/Response for clarity

---

## 🔐 Security Notes

- ✅ Your Personal Access Token is stored in browser localStorage only
- ✅ Never share your token with others
- ✅ Each team member needs their own token
- ✅ Tokens can be regenerated if compromised
- ✅ Set token expiration dates for security

---

## 🐛 Troubleshooting

### "Sync failed" or "Save failed"
- Check your GitHub token is still valid
- Verify you have write access to the repository
- Try clicking "Refresh" button
- Re-enter your token in GitHub Setup

### Cards not appearing for team members
- Make sure they've clicked "Refresh" button
- Check they're connected to the same repository
- Verify the `api-cards.json` file exists in the repo

### Can't draw arrows
- Make sure you click the arrow button first
- Click once on the target location
- Try zooming in for more precision

### App not loading
- Clear browser cache and refresh
- Check GitHub Pages is enabled in repository settings
- Wait 2-3 minutes after enabling GitHub Pages

---

## 📞 Support

If you encounter any issues:
1. Check this README first
2. Verify your GitHub token and repository access
3. Contact the repository owner
4. Check GitHub repository Issues tab

---

## 📄 File Structure

```
nascar-wireframe-board/
├── index.html          # Main HTML file
├── app.jsx            # React application code
├── api-cards.json     # Auto-generated data file (don't edit manually)
└── README.md          # This file
```

---

## 🎨 Wireframe Screens Included

1. Login
2. Selection (with event/criteria options)
3. Scan (camera scan)
4. Scan Results (Valid)
5. Scan Results (Invalid)
6. Scan w/ no criteria (direct scan)
7. Toast message (sync notification)
8. Scan w/ no criteria (results)
9. Verify using name (input)
10. Verify using name (search results)
11. Verify using name (detail view)
12. Error Message (credential not found)

---

## 📝 License

Internal project for NASCAR CSA development team.

---

**Happy Documenting! 🏁**