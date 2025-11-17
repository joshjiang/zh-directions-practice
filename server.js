import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/grade', async (req, res) => {
  const { userDirections, context } = req.body;

  try {
    // Helper function to describe position
    const describePosition = (pos) => {
      const { buildings } = context;
      if (pos.type === 'building') {
        return `in ${buildings[pos.row][pos.col]} (building at row ${pos.row}, col ${pos.col})`;
      } else if (pos.type === 'vertical-street') {
        return `on the street between columns ${pos.col} and ${pos.col + 1}, at row ${pos.row}`;
      } else if (pos.type === 'horizontal-street') {
        return `on the street between rows ${pos.row} and ${pos.row + 1}, at column ${pos.col}`;
      } else if (pos.type === 'intersection') {
        return `at the intersection of row ${pos.row} and column ${pos.col}`;
      }
      return `position row ${pos.row}, col ${pos.col}`;
    };

    const formatGrid = (buildings) => {
      let output = '';
      for (let row = 0; row < buildings.length; row++) {
        output += `Row ${row}: ${buildings[row].join(' | ')}\n`;
      }
      return output;
    };

    const startDesc = describePosition(context.startPos);
    const endDesc = describePosition(context.endPos);
    const facingDirection = context.direction || 'north';

    const prompt = `You are a Chinese language tutor helping an English speaker practice giving directions in Chinese.

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. RELATIVE DIRECTIONS ARE VALID:
   - "往前走" (go forward), "一直往前走" (go straight forward) are CORRECT and DO NOT need absolute directions like "往南走"
   - Students should use relative directions (forward/left/right) based on their current facing direction
   - Only correct if they use wrong Chinese grammar, NOT if they use relative instead of absolute directions

2. MAP COORDINATE SYSTEM:
   Row 0 = NORTH (top), Row 4 = SOUTH (bottom)
   Col 0 = WEST (left), Col 4 = EAST (right)

3. SPATIAL REASONING - LEFT vs RIGHT:
   Think of yourself standing in the position, facing the direction specified:
   - Facing NORTH (↑): left is WEST (col decreases), right is EAST (col increases)
   - Facing SOUTH (↓): left is EAST (col increases), right is WEST (col decreases)
   - Facing EAST (→): left is NORTH (row decreases), right is SOUTH (row increases)
   - Facing WEST (←): left is SOUTH (row increases), right is NORTH (row decreases)

4. CONCRETE EXAMPLE:
   Position: Row 0, Col 2, Facing SOUTH (↓)
   Map row 1: [A, B, C, D, E] where B is at col 1, C is at col 2, D is at col 3

   From your viewpoint facing south:
   - LEFT side is col 3 (D) - because facing south, left = east = higher column
   - RIGHT side is col 1 (B) - because facing south, right = west = lower column
   - FORWARD is row 1 (you move from row 0 to row 1)

5. MOVEMENT RULES:
   - Facing NORTH: forward = row--, left = col--, right = col++
   - Facing SOUTH: forward = row++, left = col++, right = col--
   - Facing EAST: forward = col++, left = row--, right = row++
   - Facing WEST: forward = col--, left = row++, right = row--

6. TURNING RULES:
   - From NORTH: left→WEST, right→EAST
   - From SOUTH: left→EAST, right→WEST
   - From EAST: left→NORTH, right→SOUTH
   - From WEST: left→SOUTH, right→NORTH

CONTEXT:
- Student starting position: ${startDesc}
- Student is initially facing: ${facingDirection}
- Destination: ${endDesc}
- Map grid (5x5 buildings with streets between them):
${formatGrid(context.buildings)}

Student's directions in Chinese:
"${userDirections}"

YOUR TASK:
1. Carefully trace the path step by step:
   - BEFORE analyzing left/right, determine: What direction are they facing RIGHT NOW?
   - Use the spatial reasoning rules above to determine what is on left vs right
   - Track facing direction changes after each turn
   - Verify the path leads to the destination

2. Translate the student's Chinese directions to English (literal translation)

3. Check Chinese grammar, vocabulary, and proper usage ONLY:
   - DO NOT penalize for using relative directions (往前/左边/右边) instead of absolute (往南/东边/西边)
   - Accept ALL valid direction-giving styles:
     * Movement commands: "往前走", "一直走", "向左拐"
     * Positional descriptions: "在你的前面", "就在前面", "在左边", "在右边"
     * Landmark-based: "过了X就是Y", "在X旁边"
     * Mixed styles: Any combination of the above
   - If the student correctly describes the destination's location relative to their position, that IS valid directions
   - "在你的前面就是X" (X is right in front of you) is COMPLETELY VALID - it tells them the destination is ahead
   - ONLY mark errors if Chinese grammar/vocabulary is actually wrong
   - Focus ONLY on: grammar errors, wrong vocabulary, sentence structure mistakes
   - Do NOT penalize for stylistic choices or lack of explicit movement verbs

4. Provide TWO separate scores from 0-100%:
   - pathScore: How intelligible/correct are the directions? Do they lead to the destination?
   - languageScore: How correct is the Chinese grammar, vocabulary, and phrasing?

5. Highlight errors with corrections in HTML format using:
   - <span class="error">错误的文字</span> for errors (with strikethrough)
   - <span class="correction">正确的文字</span> for corrections (in green)
   - <span class="annotation">explanation in English</span> for explanations

6. Generate a traced path showing each step of movement with position and facing direction

7. Provide a native speaker example showing how a Chinese native speaker would naturally give these directions

Respond ONLY with valid JSON in this exact format:
{
  "pathScore": 90,
  "languageScore": 85,
  "translation": "Go forward. After passing the bookstore, the park will be on your right.",
  "feedback": "<p>Your directions: <span class='error'>往前走</span> <span class='correction'>一直往前走</span> <span class='annotation'>(should specify 一直 for 'straight')</span></p>",
  "nativeExample": "往右转，一直往前走，过了图书馆以后右转，餐厅就在左手边。",
  "path": [
    {"type": "building", "row": 2, "col": 3, "facing": "north"},
    {"type": "vertical-street", "row": 2, "col": 3, "facing": "north"},
    {"type": "horizontal-street", "row": 1, "col": 3, "facing": "north"},
    {"type": "building", "row": 1, "col": 3, "facing": "west"}
  ]
}

The "path" array should contain each position the student reaches based on their directions, including:
- Initial starting position with facing direction
- Each position after a movement command (往前走, 一直走, etc.)
- Updated facing direction after each turn command (左转, 右转, 向左拐, 向右拐)
- Final position (may or may not be the correct destination)

Each path entry MUST have: type (building/vertical-street/horizontal-street/intersection), row, col, and facing (north/south/east/west)`;

    // Use Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a Chinese language tutor. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const result = JSON.parse(content);

    res.json({
      pathScore: result.pathScore || 0,
      languageScore: result.languageScore || 0,
      translation: result.translation || '',
      feedback: result.feedback,
      nativeExample: result.nativeExample || '',
      path: result.path || []
    });
  } catch (error) {
    console.error('Error grading directions:', error);
    res.status(500).json({
      score: 0,
      feedback: `<p><strong>Error:</strong> Unable to connect to grading service.</p>
                 <p>Error details: ${error.message}</p>
                 <p>Your submitted text: "${userDirections}"</p>`
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
