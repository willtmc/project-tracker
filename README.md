# Project Tracker

A modern Electron application for tracking and managing projects locally on your computer.

## Features

- **Modern UI with Tailwind CSS**: Clean, responsive interface with dark mode support
- **Project Management**: Create, edit, and organize projects
- **Multiple Views**: Toggle between grid and list views
- **Project Status**: Track projects as Active, Waiting, Someday, or Archived
- **Task Tracking**: Add tasks to projects and track completion
- **Project Formulation**: Ensure projects are well-defined with clear end states
- **Dark Mode**: Toggle between light and dark themes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/project-tracker.git
   cd project-tracker
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the application with Tailwind CSS:
   ```
   npm run start:tailwind
   ```

### Development

For development with hot reloading:

```
npm run dev:tailwind
```

This will start the application in development mode and watch for changes to Tailwind CSS files.

## Building for Production

To build the application for production:

```
npm run build
```

This will create distributable packages in the `dist` directory.

## Tailwind CSS

This project uses Tailwind CSS for styling. The main Tailwind CSS file is located at `src/renderer/tailwind.css`.

To build the CSS without starting the application:

```
npm run build:css
```

## Project Structure

- `src/`: Source code
  - `main.js`: Main process code
  - `preload.js`: Preload script for secure IPC communication
  - `renderer/`: Renderer process code
    - `index-tailwind.html`: Main HTML file with Tailwind CSS
    - `renderer-tailwind.js`: Main renderer process JavaScript
    - `project-template-tailwind.js`: Project item template
    - `tailwind.css`: Tailwind CSS source file
    - `styles.css`: Compiled CSS (generated from tailwind.css)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
