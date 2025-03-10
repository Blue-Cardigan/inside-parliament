# Inside Parliament - UK House of Commons

A 3D virtual environment of the UK House of Commons built with Three.js. This application allows users to explore the House of Commons chamber in a first-person view and interact with Members of Parliament.

## Features

- Realistic 3D representation of the House of Commons chamber
- First-person navigation using WASD/arrow keys
- Interactive MPs that provide information when clicked
- Minimap for easy navigation
- MP data loaded from a JSON file (can be replaced with a database in the future)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Controls

- **W/Up Arrow**: Move forward
- **S/Down Arrow**: Move backward
- **A/Left Arrow**: Move left
- **D/Right Arrow**: Move right
- **Mouse**: Look around
- **Click**: Interact with MPs or lock/unlock mouse controls
- **Minimap**: Click on the minimap to see locations

## MP Data

MP data is currently stored in `src/data/mps.json`. This file contains information about each MP, including:

- Name
- Party
- Constituency
- Position
- Biography
- Seat position in the chamber

In a future version, this could be replaced with a database connection.

## Project Structure

- `index.html`: Main HTML file
- `src/main.js`: Main application file
- `src/mp-loader.js`: Module for loading MP data
- `src/minimap.js`: Module for the minimap functionality
- `src/commons-model.js`: Module for creating the House of Commons 3D model
- `src/data/mps.json`: MP data

## Future Improvements

- Add more detailed MP models with actual photos
- Implement speech functionality for MPs
- Add more interactive elements like voting simulations
- Connect to a real-time database for MP information
- Add more detailed architectural elements to the chamber

## License

MIT 