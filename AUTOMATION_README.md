# Automation Sign-In Feature

This feature allows you to automate sign-in processes using Selenium WebDriver with credentials stored in Excel files.

## Features

- ✅ Upload Excel files with multiple credentials
- ✅ Secure credential management (passwords are masked in UI)
- ✅ Individual credential selection and sign-in
- ✅ Real-time sign-in status feedback
- ✅ Sample Excel template generation
- ✅ Integration with existing Selenium automation scripts

## How to Use

### 1. Access the Feature
- Navigate to the sidebar in your React application
- Click on "🤖 Automation Sign-In"

### 2. Prepare Your Credentials Excel File
The Excel file should have the following columns:
- **Email** (required): User's email address
- **Password** (required): User's password
- **Name** (optional): Friendly name for the credential
- **Description** (optional): Description of the credential

### 3. Upload and Use Credentials
1. Click "Download Sample Excel" to get a template
2. Fill in your credentials in the Excel file
3. Upload the Excel file using the file input
4. Select a credential from the loaded list
5. Click "Sign In" to execute the automation

## Excel File Format

| Email | Password | Name | Description |
|-------|----------|------|-------------|
| user1@example.com | password123 | Primary Account | Main testing account |
| user2@example.com | password456 | Secondary Account | Backup account |

## API Endpoints

### POST /api/automation/signin
Executes Selenium sign-in automation with provided credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "url": "https://qa.systemisers.in/"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign-in automation completed successfully",
  "output": "Sign-in successful!"
}
```

## Technical Details

### Frontend Components
- `SignIn.tsx`: Main automation interface component
- `credentials.ts`: TypeScript types for credential management
- Updated `SideBar.tsx`: Added automation navigation option
- Updated `App.tsx`: Added automation route

### Backend Integration
- Flask API endpoint for executing Selenium scripts
- Dynamic script generation with provided credentials
- Threaded execution to prevent blocking
- Comprehensive error handling and status reporting

### Dependencies Added
- `xlsx`: For Excel file reading
- `@types/xlsx`: TypeScript definitions for Excel library

## Security Considerations

- Passwords are masked in the UI (shown as dots)
- Credentials are not stored permanently in the application
- Temporary scripts are cleaned up after execution
- No hardcoded credentials in the application

## Prerequisites

- ChromeDriver must be installed and accessible in PATH
- Selenium WebDriver Python package must be installed
- Python 3.x runtime environment

## Troubleshooting

### Common Issues
1. **ChromeDriver not found**: Ensure ChromeDriver is installed and in PATH
2. **Excel format errors**: Use the provided sample template
3. **Sign-in failures**: Verify credentials and website accessibility
4. **Timeout errors**: Check network connectivity and website response time

### Error Messages
- "Script execution timed out": Increase timeout or check ChromeDriver
- "Error reading Excel file": Verify file format and column names
- "Sign-in automation failed": Check credentials and website status

## Sample Usage Flow

1. User clicks "🤖 Automation Sign-In" in sidebar
2. Downloads sample Excel template
3. Fills in credentials (Email, Password, Name, Description)
4. Uploads Excel file to the application
5. Reviews loaded credentials in the table
6. Selects desired credential and clicks "Sign In"
7. Confirms sign-in action in modal dialog
8. System executes Selenium automation
9. Receives success/failure feedback

This feature integrates seamlessly with your existing automation infrastructure while providing a user-friendly interface for credential management and sign-in execution.
