import fs from "fs";
import path from "path";
import { RESUME_PROMPTS_DIR } from "@/lib/server-paths";

/**
 * Load and process a prompt template file
 * @param {string} promptName - Name of the prompt file (without .txt extension)
 * @param {object} variables - Variables to replace in the prompt template
 * @returns {string} - Processed prompt string
 */
export const loadPrompt = (promptName, variables = {}) => {
  try {
    // Try to load the specific prompt file
    const promptPath = path.join(RESUME_PROMPTS_DIR, `${promptName}.txt`);

    if (!fs.existsSync(promptPath)) {
      const defaultPath = path.join(RESUME_PROMPTS_DIR, "default.txt");
      if (!fs.existsSync(defaultPath)) {
        throw new Error(`Prompt file not found: ${promptName}.txt and default.txt not found`);
      }
      console.log(`Using default prompt (${promptName}.txt not found)`);
      return processPromptTemplate(fs.readFileSync(defaultPath, 'utf-8'), variables);
    }

    const promptTemplate = fs.readFileSync(promptPath, 'utf-8');
    return processPromptTemplate(promptTemplate, variables);
  } catch (error) {
    console.error(`Error loading prompt ${promptName}:`, error);
    throw error;
  }
};

/**
 * Process a prompt template by replacing variables
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {object} variables - Variables to replace
 * @returns {string} - Processed template
 */
const processPromptTemplate = (template, variables) => {
  let processed = template;
  
  // Replace all {{variable}} placeholders with actual values
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    processed = processed.replace(regex, String(value || ''));
  }
  
  return processed;
};

/**
 * Load prompt for a specific profile
 * @param {string} profileId - Profile ID (filename without .json)
 * @param {object} variables - Variables to replace in the prompt
 * @returns {string} - Processed prompt string
 */
export const loadPromptForProfile = (profileId, variables = {}) => {
  return loadPrompt(profileId, variables);
};

export default { loadPrompt, loadPromptForProfile };

