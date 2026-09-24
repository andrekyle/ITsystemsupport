/**
 * SAQA web scraper to fetch and parse qualification information
 */

export interface SAQAUnitStandard {
  id: string;
  title: string;
  nqfLevel: number;
  credits: number;
  type: 'fundamental' | 'core' | 'elective';
  specialization?: string;
}

export interface SAQACourseInfo {
  title: string;
  saqaId: string;
  nqfLevel: number;
  credits: number;
  field: string;
  subfield: string;
  qualityAssurance: string;
  purpose: string;
  rationale: string;
  unitStandards: SAQAUnitStandard[];
}

/**
 * Parse SAQA qualification page content
 */
export function parseSAQAContent(html: string): SAQACourseInfo {
  const lines = html.split('\n');
  
  let title = '';
  let saqaId = '';
  let nqfLevel = 5;
  let credits = 0;
  let field = '';
  let subfield = '';
  let qualityAssurance = '';
  let purpose = '';
  let rationale = '';
  
  const unitStandards: SAQAUnitStandard[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract qualification title
    if (line.includes('National Certificate:') || line.includes('Diploma:') || line.includes('Certificate:')) {
      const titleMatch = line.match(/\*\*([^*]+)\*\*/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    // Extract SAQA ID
    if (line.includes('SAQA QUAL ID')) {
      const idMatch = lines[i + 1]?.match(/(\d+)/);
      if (idMatch) {
        saqaId = idMatch[1];
      }
    }
    
    // Extract NQF Level and Credits
    if (line.includes('MINIMUM CREDITS')) {
      const creditsMatch = lines[i + 1]?.match(/(\d+)/);
      if (creditsMatch) {
        credits = parseInt(creditsMatch[1], 10);
      }
    }
    
    if (line.includes('NQF LEVEL')) {
      const levelMatch = lines[i + 1]?.match(/Level (\d+)/);
      if (levelMatch) {
        nqfLevel = parseInt(levelMatch[1], 10);
      }
    }
  }
  
  return {
    title: title || 'Unknown Qualification',
    saqaId: saqaId || '',
    nqfLevel,
    credits,
    field,
    subfield,
    qualityAssurance,
    purpose: purpose.trim(),
    rationale: rationale.trim(),
    unitStandards
  };
}

/**
 * Fetch SAQA qualification information by ID
 */
export async function fetchSAQAQualification(saqaId: string): Promise<SAQACourseInfo> {
  const url = `https://allqs.saqa.org.za/showQualification.php?id=${saqaId}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch SAQA qualification: ${response.statusText}`);
    }
    
    const html = await response.text();
    return parseSAQAContent(html);
  } catch (error) {
    throw new Error(`Failed to fetch SAQA data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}