# Chinese Directions Practice App (中文方向练习)

A React single-page application designed to help English speakers practice giving directions in Chinese using HSK3 level vocabulary.

## Features

- **Interactive 5x5 Map Grid**: Displays randomly generated building locations with Chinese labels (HSK3 level)
- **Visual Start/End Markers**: Shows your starting position and destination on the map
- **Chinese Text Input**: Write directions in Chinese to get from point A to point B
- **LLM-Powered Grading**: Submit your directions to get scored and receive detailed feedback
- **Error Highlighting**: See your mistakes highlighted with corrections and explanations
- **Randomized Practice**: Each round generates a new map layout with different locations

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure LLM API

Copy the example environment file and add your API credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your LLM API key:

```env
VITE_LLM_API_ENDPOINT=https://api.openai.com/v1/chat/completions
VITE_LLM_API_KEY=your-actual-api-key-here
```

**Supported LLM Providers:**
- OpenAI (GPT-4, GPT-3.5)
- Anthropic Claude
- Any OpenAI-compatible API
- Local LLMs (e.g., Ollama)

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## How to Use

1. **View the Map**: A 5x5 grid shows various Chinese building locations
2. **Identify Start/End**: Look for the 👤 (your location) and 📍 (destination) icons
3. **Write Directions**: In the text box, write directions in Chinese to navigate from start to end
4. **Submit**: Click the submit button to get your directions graded
5. **Review Feedback**: See your score and detailed corrections with explanations
6. **Next Round**: Click "Next Round" to practice with a new random map

## Example Direction Phrases (HSK3 Level)

- 往前走 (wǎng qián zǒu) - go forward
- 向右拐 (xiàng yòu guǎi) - turn right
- 向左拐 (xiàng zuǒ guǎi) - turn left
- 一直走 (yìzhí zǒu) - go straight
- 到路口 (dào lùkǒu) - reach the intersection
- 在...旁边 (zài... pángbiān) - next to...
- 过马路 (guò mǎlù) - cross the street

## Project Structure

```
src/
├── components/
│   ├── Map.jsx              # 5x5 grid map component
│   ├── Map.css
│   ├── DirectionsForm.jsx   # Text input form
│   ├── DirectionsForm.css
│   ├── Results.jsx          # Score and feedback display
│   └── Results.css
├── data/
│   └── buildings.js         # HSK3 location data and randomization logic
├── services/
│   └── llmService.js        # LLM API integration for grading
├── App.jsx                  # Main application component
└── App.css
```

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **CSS3**: Styling
- **LLM API**: Intelligent grading and feedback

## Contributing

Feel free to submit issues or pull requests to improve the app!

## License

MIT
