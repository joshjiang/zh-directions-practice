/**
 * Service for grading user's Chinese directions using backend API
 */

/**
 * Sends user directions to backend for LLM grading
 * @param {string} userDirections - The user's written directions in Chinese
 * @param {object} context - Map context including buildings, start, and end positions
 * @returns {Promise<{score: number, feedback: string}>}
 */
export const gradeDirections = async (userDirections, context) => {
  try {
    const response = await fetch('http://localhost:3001/api/grade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userDirections,
        context
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling grading API:', error);
    return {
      score: 0,
      feedback: `<p><strong>Error:</strong> Unable to connect to grading service.</p>
                 <p>Make sure the backend server is running on port 3001.</p>
                 <p>Error details: ${error.message}</p>`
    };
  }
};
