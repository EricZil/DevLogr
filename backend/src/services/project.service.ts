import { prisma } from "../lib/prisma";
import { AppError } from "../lib/error-handler";
import { z } from "zod";
import { promisify } from "util";
import dns from "dns";
import fetch from "node-fetch";

const dnsLookupAsync = promisify(dns.lookup);
const dnsResolveAsync = promisify(dns.resolve);

interface DomainVerificationResult {
  isVerified: boolean;
  status: 'verified' | 'pending' | 'failed' | 'invalid';
  message: string;
  details: {
    dnsResolved: boolean;
    pointsToProxy: boolean;
    hasCloudflare: boolean;
    sslAvailable: boolean;
    lastChecked: Date;
  };
}

interface DomainConfigInstructions {
  type: 'CNAME' | 'A_RECORD';
  name: string;
  value: string;
  ttl: number;
  description: string;
}


function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

async function isSlugAvailable(
  slug: string,
  excludeProjectId?: string
): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: {
      slug,
      ...(excludeProjectId && { id: { not: excludeProjectId } }),
    },
  });
  return !existing;
}

async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) {
    throw new AppError(
      "Project not found or access denied",
      404,
      "PROJECT_NOT_FOUND"
    );
  }
  return project;
}

async function verifyCustomDomainWithExternalDNS(domain: string): Promise<{
  dnsResolved: boolean;
  pointsToProxy: boolean;
  hasCloudflare: boolean;
  sslAvailable: boolean;
  lastChecked: Date;
} | null> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  
  try {
    const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' },
      timeout: 5000
    });
    
    if (!dnsResponse.ok) {
      throw new Error('External DNS lookup failed');
    }
    
    const dnsData = await dnsResponse.json() as any;
    const hasARecord = dnsData.Answer && dnsData.Answer.length > 0;
    
    const cnameResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=CNAME`, {
      headers: { 'Accept': 'application/dns-json' },
      timeout: 5000
    });
    
    let pointsToProxy = false;
    if (cnameResponse.ok) {
      const cnameData = await cnameResponse.json() as any;
      if (cnameData.Answer) {
        pointsToProxy = cnameData.Answer.some((record: any) =>
          record.data && (record.data.includes('devlogr.space') || record.data.includes('proxy.devlogr.space'))
        );
      }
    }
    
    let hasCloudflare = false;
    if (hasARecord && dnsData.Answer) {
      const cloudflareIpRanges = [
        '104.16.', '104.17.', '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.',
        '104.24.', '104.25.', '104.26.', '104.27.', '104.28.', '104.29.', '104.30.', '104.31.',
        '172.64.', '172.65.', '172.66.', '172.67.', '172.68.', '172.69.', '172.70.', '172.71.'
      ];
      hasCloudflare = dnsData.Answer.some((record: any) =>
        record.data && cloudflareIpRanges.some(range => record.data.startsWith(range))
      );
    }
    
    return {
      dnsResolved: hasARecord,
      pointsToProxy,
      hasCloudflare,
      sslAvailable: pointsToProxy || hasCloudflare,
      lastChecked: new Date()
    };
    
  } catch (error) {
    console.log('External DNS lookup failed, falling back to Node.js DNS:', error);
    return null;
  }
}

async function verifyCustomDomain(domain: string): Promise<DomainVerificationResult> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
    if (!domainRegex.test(cleanDomain)) {
      return {
        isVerified: false,
        status: 'invalid',
        message: 'Invalid domain format',
        details: {
          dnsResolved: false,
          pointsToProxy: false,
          hasCloudflare: false,
          sslAvailable: false,
          lastChecked: new Date()
        }
      };
    }

    let details = await verifyCustomDomainWithExternalDNS(cleanDomain);
    
    if (!details) {
      details = {
        dnsResolved: false,
        pointsToProxy: false,
        hasCloudflare: false,
        sslAvailable: false,
        lastChecked: new Date()
      };

      try {
        const result = await dnsLookupAsync(cleanDomain);
        details.dnsResolved = true;

        try {
          const proxyResult = await dnsLookupAsync('proxy.devlogr.space');
          details.pointsToProxy = result.address === proxyResult.address;
        } catch {
          const cloudflareIpRanges = [
            '104.16.', '104.17.', '104.18.', '104.19.', '104.20.', '104.21.', '104.22.', '104.23.',
            '104.24.', '104.25.', '104.26.', '104.27.', '104.28.', '104.29.', '104.30.', '104.31.',
            '172.64.', '172.65.', '172.66.', '172.67.', '172.68.', '172.69.', '172.70.', '172.71.'
          ];
          details.hasCloudflare = cloudflareIpRanges.some(range => result.address.startsWith(range));
        }

        try {
          const cnameRecords = await dnsResolveAsync(cleanDomain, 'CNAME');
          if (cnameRecords.some(record => record.includes('devlogr.space') || record.includes('proxy.devlogr.space'))) {
            details.pointsToProxy = true;
          }
        } catch {
        }

        if (details.pointsToProxy || details.hasCloudflare) {
          details.sslAvailable = true;
        }

      } catch (dnsError) {
        console.log('DNS lookup failed for domain:', cleanDomain, dnsError);
        details.dnsResolved = false;
      }
    }

    const isVerified = details.pointsToProxy || details.hasCloudflare;
    let status: 'verified' | 'pending' | 'failed' | 'invalid' = 'failed';
    let message = '';

    if (isVerified) {
      status = 'verified';
      message = 'Domain verified successfully! SSL certificate will be automatically provisioned.';
    } else if (details.dnsResolved) {
      status = 'pending';
      message = 'Domain resolves but is not pointing to our servers. Please update your DNS settings.';
    } else {
      status = 'failed';
      message = 'Domain does not resolve. Please check your DNS configuration.';
    }

    return {
      isVerified,
      status,
      message,
      details
    };

  } catch (error) {
    console.error('Domain verification error:', error);
    return {
      isVerified: false,
      status: 'failed',
      message: 'Failed to verify domain due to technical error',
      details: {
        dnsResolved: false,
        pointsToProxy: false,
        hasCloudflare: false,
        sslAvailable: false,
        lastChecked: new Date()
      }
    };
  }
}

function getDomainConfigInstructions(domain: string): DomainConfigInstructions[] {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  
  return [
    {
      type: 'CNAME',
      name: cleanDomain,
      value: 'proxy.devlogr.space',
      ttl: 300,
      description: 'CNAME record pointing your domain to our proxy server'
    },
    {
      type: 'A_RECORD',
      name: cleanDomain,
      value: '104.16.0.1',
      ttl: 300,
      description: 'Alternative A record if CNAME is not supported'
    }
  ];
}

async function isDomainAvailable(domain: string, excludeProjectId?: string): Promise<boolean> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  
  const existingProject = await prisma.project.findFirst({
    where: {
      customDomain: cleanDomain,
      ...(excludeProjectId && { id: { not: excludeProjectId } })
    }
  });

  return !existingProject;
}

const createProjectSchema = z.object({
  name: z.string()
    .trim()
    .min(3, "Project name must be at least 3 characters")
    .max(60, "Project name must be less than 60 characters")
    .refine(name => !/[<>:"\/\\|?*\x00-\x1f]/.test(name), "Project name contains invalid characters")
    .refine(name => !['admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'test', 'staging', 'dev', 'dashboard', 'support', 'help', 'docs', 'blog'].includes(name.toLowerCase()), "This name is reserved"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PUBLIC"),
  allowIssues: z.boolean().default(true),
  allowFeedback: z.boolean().default(true),
  tags: z.array(z.string().trim().min(1).max(20))
    .max(10, "Maximum 10 tags allowed")
    .optional()
    .refine(tags => !tags || new Set(tags).size === tags.length, "Duplicate tags are not allowed"),
  customDomain: z.string()
    .optional()
    .refine(domain => {
      if (!domain) return true;
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
      return domainRegex.test(cleanDomain) && cleanDomain.length <= 253;
    }, "Invalid domain format"),
});

const updateBasicInfoSchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    slug: z.string().optional(),
    progress: z.number().int().min(0).max(100).optional(),
    allowIssues: z.boolean().optional(),
    allowFeedback: z.boolean().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
});

const updateTimelineSchema = z.object({
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
}).refine(data => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
}, { message: "Start date cannot be after end date" });

export async function getProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      status: true,
      visibility: true,
      progress: true,
      banner: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: { id: true, name: true, username: true, avatar: true },
      },
      _count: { select: { updates: true, milestones: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createProject(userId: string, projectData: any) {
  const { name, description, visibility, allowIssues, allowFeedback, tags, customDomain } =
    createProjectSchema.parse(projectData);

  let slug = generateSlug(name);
  let counter = 1;
  while (!(await isSlugAvailable(slug))) {
    slug = `${generateSlug(name)}-${counter}`;
    counter++;
  }

  const project = await prisma.project.create({
    data: {
      userId,
      title: name,
      description: description || null,
      slug,
      visibility,
      allowIssues,
      allowFeedback,
      customDomain: customDomain || null,
      domainVerified: false,
      sslEnabled: false,
      startDate: new Date(),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      visibility: true,
      customDomain: true,
      domainVerified: true,
    },
  });

  if (tags && tags.length > 0) {
    for (const tagName of tags) {
      let tag = await prisma.tag.findUnique({
        where: { name: tagName.trim().toLowerCase() },
      });
      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: tagName.trim().toLowerCase() },
        });
      }
      await prisma.projectTag.create({
        data: { projectId: project.id, tagId: tag.id },
      });
    }
  }

  return project;
}

export async function getProjectBasicInfo(projectId: string, userId: string) {
    return verifyProjectOwnership(projectId, userId);
}

export async function getProjectTags(projectId: string, userId: string) {
    await verifyProjectOwnership(projectId, userId);
    const projectTags = await prisma.projectTag.findMany({
        where: { projectId },
        include: { tag: true }
    });
    return projectTags.map((pt: any) => pt.tag);
}

export async function updateProjectBasicInfo(
  projectId: string,
  userId: string,
  projectData: any
) {
  const existingProject = await verifyProjectOwnership(projectId, userId);
  const { title, description, slug, progress, allowIssues, allowFeedback } =
    updateBasicInfoSchema.parse(projectData);

  let finalSlug = existingProject.slug;
  if (slug && slug !== existingProject.slug) {
    const slugAvailable = await isSlugAvailable(slug, projectId);
    if (!slugAvailable) {
      throw new AppError("Slug already taken", 400, "SLUG_TAKEN");
    }
    finalSlug = slug;
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { title, description, slug: finalSlug, progress, allowIssues, allowFeedback },
  });
}

export async function updateProjectStatus(
  projectId: string,
  userId: string,
  statusData: any
) {
  await verifyProjectOwnership(projectId, userId);
  const validatedData = updateStatusSchema.parse(statusData);
  return prisma.project.update({
    where: { id: projectId },
    data: validatedData,
  });
}

export async function updateProjectTimeline(
  projectId: string,
  userId: string,
  timelineData: any
) {
  await verifyProjectOwnership(projectId, userId);
  const { startDate, endDate } = updateTimelineSchema.parse(timelineData);
  return prisma.project.update({
    where: { id: projectId },
    data: { 
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
     },
  });
}

export async function addTagToProject(
  projectId: string,
  userId: string,
  tagName: string
) {
  await verifyProjectOwnership(projectId, userId);
  if (!tagName || !tagName.trim()) {
    throw new AppError("Tag name is required", 400, "MISSING_TAG_NAME");
  }
  const trimmedTagName = tagName.trim().toLowerCase();
  let tag = await prisma.tag.findUnique({ where: { name: trimmedTagName } });
  if (!tag) {
    tag = await prisma.tag.create({ data: { name: trimmedTagName } });
  }
  const existingProjectTag = await prisma.projectTag.findFirst({
    where: { projectId, tagId: tag.id },
  });
  if (existingProjectTag) {
    throw new AppError("Tag already added to project", 400, "TAG_ALREADY_EXISTS");
  }
  await prisma.projectTag.create({
    data: { projectId, tagId: tag.id },
  });
  return tag;
}

export async function removeTagFromProject(
  projectId: string,
  userId: string,
  tagId: string
) {
  await verifyProjectOwnership(projectId, userId);
  const deleted = await prisma.projectTag.deleteMany({
    where: { projectId, tagId },
  });
  if (deleted.count === 0) {
    throw new AppError("Tag not found on project", 404, "TAG_NOT_FOUND");
  }
  return { message: "Tag removed successfully" };
}

export async function getPublicProjectBySlug(slug: string) {
  if (!slug) {
    throw new AppError("Slug parameter is required", 400, "MISSING_SLUG");
  }
  const project = await prisma.project.findUnique({
    where: { slug, visibility: "PUBLIC" },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      status: true,
      visibility: true,
      progress: true,
      banner: true,
      theme: true,
      allowIssues: true,
      allowFeedback: true,
      startDate: true,
      endDate: true,
      user: { select: { name: true, username: true, avatar: true } },
      tags: { select: { tag: { select: { name: true } } } },
      milestones: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          completedAt: true,
          progress: true,
          tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              dueDate: true,
              completedAt: true,
              estimatedHours: true,
              subtasks: {
                select: {
                  id: true,
                  title: true,
                  completed: true,
                }
              },
              _count: { select: { comments: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      updates: {
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          images: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      feedback: {
        select: {
          id: true,
          message: true,
          rating: true,
          category: true,
          submitterName: true,
          submitterEmail: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!project) {
    console.log('No public project found:', slug);
    
    const anyProject = await prisma.project.findUnique({ where: { slug } });
    if (anyProject) {
      console.log('Project exists:', anyProject.visibility);
    } else {
      console.log('No project found with slug:', slug);
    }
    
    throw new AppError("Project not found or not public", 404, "PROJECT_NOT_FOUND");
  }
  
  console.log('public project:', { id: project.id, title: project.title, slug: project.slug });

  const processedProject = {
    ...project,
    updates: project.updates.map(update => ({
      ...update,
      images: update.images ? 
        (() => {
          try {
            return JSON.parse(update.images);
          } catch {
            return [];
          }
        })() : []
    }))
  };

  return processedProject;
}

export async function getPublicProjectByDomain(domain: string) {
  if (!domain) {
    throw new AppError("Domain parameter is required", 400, "MISSING_DOMAIN");
  }
  const project = await prisma.project.findFirst({
    where: { 
      customDomain: domain, 
      domainVerified: true,
      visibility: "PUBLIC" 
    },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      status: true,
      visibility: true,
      progress: true,
      banner: true,
      theme: true,
      allowIssues: true,
      allowFeedback: true,
      customDomain: true,
      domainVerified: true,
      startDate: true,
      endDate: true,
      user: { select: { name: true, username: true, avatar: true } },
      tags: { select: { tag: { select: { name: true } } } },
      milestones: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          completedAt: true,
          progress: true,
          tasks: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              dueDate: true,
              completedAt: true,
              estimatedHours: true,
              subtasks: {
                select: {
                  id: true,
                  title: true,
                  completed: true,
                }
              },
              _count: { select: { comments: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      updates: {
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          images: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      feedback: {
        select: {
          id: true,
          message: true,
          rating: true,
          category: true,
          submitterName: true,
          submitterEmail: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!project) {
    throw new AppError("Project not found, domain not verified, or not public", 404, "PROJECT_NOT_FOUND");
  }

  const processedProject = {
    ...project,
    updates: project.updates.map(update => ({
      ...update,
      images: update.images ? 
        (() => {
          try {
            return JSON.parse(update.images);
          } catch {
            return [];
          }
        })() : []
    }))
  };

  return processedProject;
}

export async function checkSlugAvailability(slug: string) {
  try {
    const available = await isSlugAvailable(slug);
    return {
      success: true,
      data: { available }
    };
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return {
      success: false,
      message: 'Failed to check slug availability'
    };
  }
}

export async function verifyProjectDomain(projectId: string, userId: string) {
  try {
    const project = await verifyProjectOwnership(projectId, userId);
    
    if (!project.customDomain) {
      throw new AppError(
        "No custom domain configured for this project",
        400,
        "NO_CUSTOM_DOMAIN"
      );
    }

    if (project.domainVerified) {
      return {
        success: true,
        data: { 
          verified: true, 
          message: "Domain already verified",
          status: 'verified' as const,
          details: {
            dnsResolved: true,
            pointsToProxy: true,
            hasCloudflare: true,
            sslAvailable: true,
            lastChecked: new Date()
          }
        }
      };
    }

    const verificationResult = await verifyCustomDomain(project.customDomain);
    
    if (verificationResult.isVerified) {
      await prisma.project.update({
        where: { id: projectId },
        data: { 
          domainVerified: true,
          sslEnabled: verificationResult.details.sslAvailable
        }
      });

      return {
        success: true,
        data: { 
          verified: true, 
          message: verificationResult.message,
          status: verificationResult.status,
          details: verificationResult.details
        }
      };
    } else {
      return {
        success: true,
        data: { 
          verified: false, 
          message: verificationResult.message,
          status: verificationResult.status,
          details: verificationResult.details,
          instructions: getDomainConfigInstructions(project.customDomain)
        }
      };
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error verifying domain:', error);
    throw new AppError(
      "Failed to verify domain",
      500,
      "DOMAIN_VERIFICATION_ERROR"
    );
  }
}

export async function getDomainVerificationStatus(projectId: string, userId: string) {
  try {
    const project = await verifyProjectOwnership(projectId, userId);
    
    let verificationDetails = null;
    let instructions = null;
    
    if (project.customDomain) {
      const verificationResult = await verifyCustomDomain(project.customDomain);
      verificationDetails = verificationResult.details;
      
      if (!verificationResult.isVerified) {
        instructions = getDomainConfigInstructions(project.customDomain);
      }
    }
    
    return {
      success: true,
      data: {
        customDomain: project.customDomain,
        domainVerified: project.domainVerified,
        sslEnabled: project.sslEnabled,
        hasCustomDomain: !!project.customDomain,
        verificationDetails,
        instructions,
        publicUrl: project.customDomain && project.domainVerified 
          ? `https://${project.customDomain}` 
          : `https://${project.slug}.devlogr.space`
      }
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error getting domain status:', error);
    throw new AppError(
      "Failed to get domain verification status",
      500,
      "DOMAIN_STATUS_ERROR"
    );
  }
}

export async function checkDomainAvailability(domain: string) {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
    if (!domainRegex.test(cleanDomain)) {
      return {
        success: true,
        data: { 
          available: false, 
          reason: 'Invalid domain format',
          suggestions: []
        }
      };
    }

    const isAvailable = await isDomainAvailable(cleanDomain);
    
    if (!isAvailable) {
      return {
        success: true,
        data: { 
          available: false, 
          reason: 'Domain is already in use by another project',
          suggestions: [
            `blog.${cleanDomain}`,
            `app.${cleanDomain}`,
            `www.${cleanDomain}`
          ]
        }
      };
    }

    const verificationResult = await verifyCustomDomain(cleanDomain);
    
    return {
      success: true,
      data: {
        available: true,
        domain: cleanDomain,
        currentStatus: verificationResult.status,
        message: verificationResult.message,
        requiresSetup: !verificationResult.isVerified,
        instructions: getDomainConfigInstructions(cleanDomain)
      }
    };
  } catch (error) {
    console.error('Error checking domain availability:', error);
    return {
      success: false,
      message: 'Failed to check domain availability'
    };
  }
} 