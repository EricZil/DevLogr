interface VercelDomainConfig {
  bearerToken: string;
  teamId?: string;
  frontendProjectId: string;
}

export class VercelDomainService {
  private vercel: any;
  private config: VercelDomainConfig;
  private initialized: boolean = false;

  constructor(config: VercelDomainConfig) {
    this.config = config;
  }
    private async initializeVercel() {
      if (!this.initialized) {
        const { Vercel } = await import("@vercel/sdk");
        this.vercel = new Vercel({
          bearerToken: this.config.bearerToken,
        });
        this.initialized = true;
      }
  }
  
  async addDomainToProject(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeVercel();
      console.log(`[VercelDomainService] Adding domain ${domain} to project ${this.config.frontendProjectId}`);

      const result = await this.vercel.projects.addProjectDomain({
        idOrName: this.config.frontendProjectId,
        teamId: this.config.teamId,
        requestBody: {
          name: domain,
          gitBranch: null,
          redirect: null,
          redirectStatusCode: null,
        },
      });

      console.log(`[VercelDomainService] Successfully added domain ${domain} to project`);
      return { success: true };

    } catch (error) {
      console.error(`[VercelDomainService] Error adding domain ${domain}:`, error);
      return {
        success: false,
        error: `Error adding domain: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async removeDomainFromProject(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[VercelDomainService] Removing domain ${domain} from project ${this.config.frontendProjectId}`);

      const result = await this.vercel.projects.removeProjectDomain({
        idOrName: this.config.frontendProjectId,
        domain: domain,
        teamId: this.config.teamId,
      });

      console.log(`[VercelDomainService] Successfully removed domain ${domain} from project`);
      return { success: true };

    } catch (error) {
      console.error(`[VercelDomainService] Error removing domain ${domain}:`, error);
      return {
        success: false,
        error: `Error removing domain: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async verifyDomainOnProject(domain: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initializeVercel();
      console.log(`[VercelDomainService] Verifying domain ${domain} on project ${this.config.frontendProjectId}`);

      const result = await this.vercel.projects.verifyProjectDomain({
        idOrName: this.config.frontendProjectId,
        domain: domain,
        teamId: this.config.teamId,
      });

      console.log(`[VercelDomainService] Successfully verified domain ${domain} on project`);
      return { success: true };

    } catch (error) {
      console.error(`[VercelDomainService] Error verifying domain ${domain}:`, error);
      return {
        success: false,
        error: `Error verifying domain: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getProjectDomains(): Promise<{ success: boolean; domains?: any[]; error?: string }> {
    try {
      await this.initializeVercel();
      console.log(`[VercelDomainService] Getting domains for project ${this.config.frontendProjectId}`);

      const result = await this.vercel.projects.getProjectDomains({
        idOrName: this.config.frontendProjectId,
        teamId: this.config.teamId,
      });

      console.log(`[VercelDomainService] Successfully retrieved project domains`);
      return { success: true, domains: result.domains };

    } catch (error) {
      console.error(`[VercelDomainService] Error getting project domains:`, error);
      return {
        success: false,
        error: `Error getting project domains: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async isDomainInProject(domain: string): Promise<{ exists: boolean; error?: string }> {
    try {
      await this.initializeVercel();
      const result = await this.getProjectDomains();
      
      if (!result.success || !result.domains) {
        return { exists: false, error: result.error };
      }

      const exists = result.domains.some(d => d.name === domain);
      return { exists };

    } catch (error) {
      console.error(`[VercelDomainService] Error checking if domain exists:`, error);
      return {
        exists: false,
        error: `Error checking domain existence: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

let vercelDomainService: VercelDomainService | null = null;

export function getVercelDomainService(): VercelDomainService {
  if (!vercelDomainService) {
    const bearerToken = process.env.VERCEL_API_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;
    const frontendProjectId = process.env.VERCEL_FRONTEND_PROJECT_ID;

    if (!bearerToken) {
      throw new Error('VERCEL_API_TOKEN environment variable is required');
    }

    if (!frontendProjectId) {
      throw new Error('VERCEL_FRONTEND_PROJECT_ID environment variable is required');
    }

    vercelDomainService = new VercelDomainService({
      bearerToken,
      teamId,
      frontendProjectId,
    });
  }

  return vercelDomainService;
}