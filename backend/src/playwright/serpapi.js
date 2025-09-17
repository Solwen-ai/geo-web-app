import { getJson } from "serpapi";
import 'dotenv/config';

getJson(
  {
    // q: '請問在台灣有哪些券商提供線上交易平台？',
    // q: '請問有哪些台灣的券商提供外匯交易服務？',
    q: '請問在台灣有哪些券商提供線上交易平台？',
    api_key: process.env.SERPAPI_KEY,

    engine: 'google',
    // location_requested: 'Taipei, Taiwan',
    // location_used: 'Taipei,Taiwan',
    location: 'Taiwan',
    google_domain: 'google.com.tw',
    hl: 'zh-tw',
    gl: 'tw',
  },
  async json => {
    console.log('****json\n\n', json.ai_overview);
    if (json.ai_overview && json.ai_overview.page_token) {
      // Make second API call for pagination with retry mechanism
      const result = await getJson({
        engine: 'google_ai_overview',
        api_key: process.env.SERPAPI_KEY,
        page_token: json.ai_overview.page_token,
      });

      // console.log('****aio result\n\n', result);
      console.log(
        '****aio result\n\n',
        JSON.stringify(result.ai_overview.text_blocks)
      );
      console.log(
        '****aio markdown\n\n',
        convertToMarkdown(result.ai_overview)
      );
      console.log('****result.references\n\n', result.ai_overview.references);
    }
  }
);

function convertToMarkdown(aiOverview) {
  if (!aiOverview || !aiOverview.text_blocks) {
    return 'No AI overview available';
  }

  let markdown = '';

  for (const block of aiOverview.text_blocks) {
    switch (block.type) {
      case 'heading':
        markdown += `## ${block.snippet}\n\n`;
        break;

      case 'paragraph':
        markdown += `${block.snippet}\n\n`;
        break;

      case 'list':
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
              markdown += '\n';
            }
          }
        }
        break;

      case 'expandable':
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
