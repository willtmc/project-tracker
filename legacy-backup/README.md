# WTM Project Tracker

A comprehensive project tracking system designed to monitor task progress, generate reports, and track project status changes across different categories.

## Features

- **Project Status Tracking**: Monitors projects across Active, Waiting, Archived, and Someday categories
- **Task Completion Tracking**: Tracks individual tasks within projects and calculates completion percentages
- **Daily Reports**: Generates detailed daily reports with project status changes and completion statistics
- **Email Notifications**: Sends beautifully formatted HTML emails with project updates
- **Project Movement Detection**: Tracks when projects move between different status folders

## Project Structure

The WTM Project Tracker organizes projects into four main categories:

1. **Active Projects**: Current projects in the WTM Projects folder
2. **Waiting Projects**: Projects waiting on dependencies from others in the WTM Projects Waiting folder
3. **Archived Projects**: Completed projects in the WTM Projects Archive folder
4. **Someday Projects**: Future ideas or non-active projects in the WTM Projects Someday folder

## Setup

1. Clone this repository
2. Create a `config.ini` file with your email configuration:

```ini
[email]
smtp_server = smtp.example.com
smtp_port = 587
smtp_username = your_email@example.com
smtp_password = your_password
```

3. Update the `BASE_DIR` constant in `project-tracker.py` to point to your project directory

## Usage

### Running Daily Reports

```bash
./run-daily-report.sh
```

### Running Weekly Reports

```bash
./run-weekly-report.sh
```

## Email Format

The system sends beautifully formatted HTML emails inspired by Gwern's website design, featuring:

- Clean typography with proper spacing
- Visual hierarchy with section cards
- Color-coded progress indicators
- Enhanced readability with summary boxes
- Responsive design for various screen sizes

## License

MIT
