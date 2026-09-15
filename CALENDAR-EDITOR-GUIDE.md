# Training Calendar Editor Guide

## Overview
The Training Calendar Editor allows you to manually edit every aspect of the training calendar for the IT Systems Support programme. You can modify unit standards, dates, times, NQF levels, and credits directly in an interactive web interface.

## Accessing the Calendar Editor

Open the calendar editor at:
```
http://localhost:5175/?edit-calendar
```

This bypasses authentication and provides direct access to the calendar editing interface.

## Features

### 1. **Interactive Editing**
- **Click any cell** to edit its contents
- All columns are fully editable:
  - **Unit Standard** (e.g., "114051", "8252")
  - **Title** (Full unit standard title)
  - **Dates** (Training dates, e.g., "17 Jul 2026" or "21, 28 Aug 2026")
  - **Time** (Session times, e.g., "09h00 - 14h00")
  - **NQF** (NQF Level, numeric)
  - **Credits** (Credit value, numeric)

### 2. **Visual Feedback**
- **Dates highlighted in red** - Making them stand out for easy visibility and editing
- **Yellow border** around active cells - Indicates which cell is being edited
- **Input field** appears when you click a cell - Ready for text modification

### 3. **Editing Workflow**
1. Click any cell to start editing
2. Type your changes directly in the input field
3. Press **Enter** or click elsewhere to save the change to the local state
4. Make as many changes as needed
5. Click the **💾 Save Changes** button to save all changes to the file

### 4. **Save Options**

#### Save Changes Button (Blue)
- **Location**: Top right corner
- **Function**: Saves all your edits to the `src/data/courses/it-systems-support.ts` file
- **Status**: Shows confirmation message when successful
- **Available at**: Both top and bottom of the page

#### Download Backup Button (Green)
- **Location**: Top right corner (next to Save Changes)
- **Function**: Downloads a JSON backup of your current calendar data
- **File name**: `calendar-backup.json`
- **Purpose**: Create a safety backup before making major changes

### 5. **Modules Included**

The calendar editor displays all 6 modules:
1. **Personal Development** - 9 unit standards
2. **Client Server Networking** - 3 unit standards
3. **Network, Concept, Architecture** - 4 unit standards
4. **Design a LAN for Developmental Office** - 3 unit standards
5. **Configure, Operate & Administer Server** - 4 unit standards
6. **Database Access** - 3 unit standards

Each module displays its unit standards in a sortable table format.

## Tips for Editing

### Editing Dates
- Use formats like: "17 Jul 2026" or "21, 28 Aug 2026" or "29 Jan, 5 Feb 2027"
- Multiple dates should be comma-separated (e.g., "3, 4 Sep 2026")
- Dates with ranges work too (e.g., "25 Sep, 2 Oct 2026")

### Editing Times
- Standard format: "09h00 - 14h00"
- Alternative format: "12h00 - 16h00"
- Keep the dash and space consistent for readability

### Editing Credits
- Numeric values only (0-99)
- Represents the credit value for the unit standard

### Editing NQF Levels
- Numeric values only (typically 4-6)
- Represents the NQF qualification level

## Verification

After saving changes:
1. The calendar file is updated in real-time
2. Check the confirmation message
3. Reload the application to verify changes are persisted
4. All dates should appear in chronological order across modules

## Keyboard Shortcuts

- **Enter** - Save the current cell edit and move focus
- **Escape** - Cancel editing without saving the cell
- **Tab** - Move to next cell (standard behavior)

## File Location

All changes are saved to:
```
src/data/courses/it-systems-support.ts
```

This file contains the master calendar data that powers the entire ITSS Learn application.

## Troubleshooting

### Changes not saving?
- Ensure the file has write permissions
- Check browser console for error messages
- Try downloading a backup before attempting major edits

### Calendar not showing after save?
- Refresh the application page (F5)
- Clear browser cache if needed
- Restart the dev server

### Date format issues?
- Use consistent date formats across the calendar
- Dates should include the year (e.g., "2026")
- Month abbreviations (Jan, Feb, Mar, etc.) are supported

## Best Practices

1. **Make a backup** - Click "Download Backup" before making changes
2. **Edit carefully** - Double-check dates for chronological order
3. **Test after saving** - Reload the app to verify changes
4. **Commit changes** - Use Git to version control your changes after saving

## Example Calendar Entry

| Unit Standard | Title | Dates | Time | NQF | Credits |
|---|---|---|---|---|---|
| 114051 | Conduct a technical practitioners meeting | 3, 4 Sep 2026 | 09h00 - 14h00 | 5 | 4 |

## Support

For issues or questions:
1. Check the browser console (F12) for error messages
2. Ensure the dev server is running
3. Try refreshing the page
4. Verify file permissions in the project directory
