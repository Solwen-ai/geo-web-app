import { getJson } from "serpapi";
import { AiOverview, OutputRecord } from "./types";
import { brandNames, competitorBrands } from "./params";

// Convert ai_overview text_blocks to markdown format
function convertToMarkdown(aiOverview: AiOverview): string {
  if (!aiOverview || !aiOverview.text_blocks) {
    return "No AI overview available";
  }

  let markdown = "";
  
  for (const block of aiOverview.text_blocks) {
    switch (block.type) {
      case "heading":
        markdown += `## ${block.snippet}\n\n`;
        break;
        
      case "paragraph":
        markdown += `${block.snippet}\n\n`;
        break;
        
      case "list":
        if (block.list && Array.isArray(block.list)) {
          for (const item of block.list) {
            if (item.title) {
              markdown += `## ${item.title}\n`;
            }
            if (item.snippet) {
              markdown += `${item.snippet}\n\n`;
            }
            // Handle nested lists
            if (item.list && Array.isArray(item.list)) {
              for (const nestedItem of item.list) {
                if (nestedItem.snippet) {
                  markdown += `  - ${nestedItem.snippet}\n`;
                }
              }
              markdown += "\n";
            }
          }
        }
        break;
        
      case "expandable":
        if (block.text_blocks) {
          markdown += convertToMarkdown({ text_blocks: block.text_blocks });
        }
        break;
        
      default:
        if (block.snippet) {
          markdown += `${block.snippet}\n\n`;
        }
        break;
    }
  }
  
  return markdown.trim();
}

// Function to count how many brand names exist in the AI overview text
function checkBrandExistenceInText(text: string, brandNames: string[]): number {
  if (!text || !brandNames || brandNames.length === 0) {
    return 0;
  }
  
  const lowerText = text.toLowerCase();
  return brandNames.reduce((count, brand) => {
    const lowerBrand = brand.toLowerCase().trim();
    return lowerBrand && lowerText.includes(lowerBrand) ? count + 1 : count;
  }, 0);
}

// Function to calculate aioBrandCompare
// Returns true if total count of brandNames and competitorBrands >= 2, otherwise false
function calculateAioBrandCompare(aiOverviewText: string): boolean {
  if (!aiOverviewText) {
    return false;
  }
  
  // for own brand, we only need to check if it exists
  const brandNamesCount = checkBrandExistenceInText(aiOverviewText, brandNames) > 0 ? 1 : 0;
  const competitorBrandsCount = checkBrandExistenceInText(aiOverviewText, competitorBrands);
  const matchCount = brandNamesCount + competitorBrandsCount;
  
  return matchCount >= 2;
}

// Function to calculate aioBrandExist
// Returns true if any of brandNames exists in result.ai_overview, otherwise false
function calculateAioBrandExist(aiOverviewText: string): boolean {
  if (!aiOverviewText) {
    return false;
  }
  
  return checkBrandExistenceInText(aiOverviewText, brandNames) > 0;
}

// Make SerpAPI call with pagination handling
async function getSerpApiResult(query: string): Promise<{ ai_overview?: AiOverview; error?: string }> {
  try {
    const json = await getJson({
      q: query,
      api_key: process.env.SERPAPI_KEY,
      location_requested: "Taipei, Taiwan",
      location_used: "Taipei,Taiwan",
      google_domain: "google.com.tw",
      hl: "zh-tw",
      gl: "tw"
    });
    
    if (json.error) {
      throw new Error(`SerpAPI error: ${json.error}`);
    }
    
    // Check if ai_overview needs pagination
    if (json.ai_overview && json.ai_overview.page_token) {
      // Make second API call for pagination
      const paginationJson = await getJson({
        engine: "google_ai_overview",
        api_key: process.env.SERPAPI_KEY,
        page_token: json.ai_overview.page_token
      });
      
      if (paginationJson.error) {
        throw new Error(`SerpAPI pagination error: ${paginationJson.error}`);
      }
      
      return paginationJson;
    }
    
    return json;
  } catch (error) {
    throw error;
  }
}

const searchAndCopyGoogle = async ({
  question,
  outputRecord,
}: {
  question: string;
  outputRecord: OutputRecord;
}) => {
  try {
    console.log(`🔍 Searching Google Taiwan for: ${question}`);
    
    const result = await getSerpApiResult(question);
    
    if (result.ai_overview) {
      const markdownContent = convertToMarkdown(result.ai_overview);
      outputRecord.aio = markdownContent;
      outputRecord.aioBrandCompare = calculateAioBrandCompare(markdownContent);
      outputRecord.aioBrandExist = calculateAioBrandExist(markdownContent);
      
      console.log("✅ Found AI overview from Google");
    } else {
      outputRecord.aio = "No AI overview found";
      outputRecord.aioBrandCompare = false;
      outputRecord.aioBrandExist = false;
      console.log("⚠️ No AI overview available");
    }
    
  } catch (error) {
    console.error("❌ Error in Google search:", error.message);
    outputRecord.aio = "Error during Google search";
  }
};

export default searchAndCopyGoogle; 