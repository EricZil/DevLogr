import { VercelRequest, VercelResponse } from '@vercel/node';
import { getVercelDomainService } from '../src/services/vercel-domain.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, domain } = req.body;
    
    console.log('[TestVercel] Request:', { action, domain });
    
    const vercelService = getVercelDomainService();
    
    switch (action) {
      case 'add':
        if (!domain) {
          return res.status(400).json({ error: 'Domain is required' });
        }
        const addResult = await vercelService.addDomainToProject(domain);
        return res.json({ action: 'add', result: addResult });
        
      case 'list':
        const listResult = await vercelService.getProjectDomains();
        return res.json({ action: 'list', result: listResult });
        
      case 'verify':
        if (!domain) {
          return res.status(400).json({ error: 'Domain is required' });
        }
        const verifyResult = await vercelService.verifyDomainOnProject(domain);
        return res.json({ action: 'verify', result: verifyResult });
        
      case 'check':
        if (!domain) {
          return res.status(400).json({ error: 'Domain is required' });
        }
        const checkResult = await vercelService.isDomainInProject(domain);
        return res.json({ action: 'check', result: checkResult });
        
      default:
        return res.status(400).json({ error: 'Invalid action. Use: add, list, verify, check' });
    }
    
  } catch (error) {
    console.error('[TestVercel] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}