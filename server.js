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

MAP ORIENTATION:
- Row 0 is at the NORTH (top)
- Row 4 is at the SOUTH (bottom)
- Column 0 is at the WEST (left)
- Column 4 is at the EAST (right)

MOVEMENT RULES (based on current facing direction):
- When facing NORTH: forward decreases row, left decreases column, right increases column
- When facing SOUTH: forward increases row, left increases column, right decreases column
- When facing EAST: forward increases column, left decreases row, right increases row
- When facing WEST: forward decreases column, left increases row, right decreases row

TURNING RULES (how facing direction changes):
- From NORTH: turn left → face WEST, turn right → face EAST
- From SOUTH: turn left → face EAST, turn right → face WEST
- From EAST: turn left → face NORTH, turn right → face SOUTH
- From WEST: turn left → face SOUTH, turn right → face NORTH

IMPORTANT: After each turn (左转/右转/向左拐/向右拐), the student's facing direction CHANGES. You must update which direction they are facing and recalculate what is on their left/right based on the NEW facing direction.

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
   - Track the current facing direction after each turn
   - After a turn, recalculate what is left/right based on the NEW facing direction
   - Verify the path leads to the destination
2. Check Chinese grammar, vocabulary, and proper usage of direction phrases
3. Provide a score from 0-100%
4. Highlight errors with corrections in HTML format using:
   - <span class="error">错误的文字</span> for errors (with strikethrough)
   - <span class="correction">正确的文字</span> for corrections (in green)
   - <span class="annotation">explanation in English</span> for explanations

Respond ONLY with valid JSON in this exact format:
{
  "score": 85,
  "feedback": "<p>Your directions: <span class='error'>往前走</span> <span class='correction'>一直往前走</span> <span class='annotation'>(should specify 一直 for 'straight')</span></p>"
}`;

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
    const content = data.choices[0].message.content;

    // Parse the JSON response
    const result = JSON.parse(content);

    res.json({
      score: result.score,
      feedback: result.feedback
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
