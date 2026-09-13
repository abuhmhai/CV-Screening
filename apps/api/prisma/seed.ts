import {
  ApplicationStatus,
  CompanyMemberRole,
  ConnectionStatus,
  ConversationType,
  PostVisibility,
  PrismaClient,
  ReactionTargetType,
  ReactionType,
  SkillLevel,
  UserRole,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// All seeded accounts share this password (also usable via password login).
const SEED_PASSWORD = "Password123!";
const SEED_PASSWORD_HASH = bcrypt.hashSync(SEED_PASSWORD, 10);

async function main() {
  await prisma.$transaction([
    prisma.offer.deleteMany(),
    prisma.savedJob.deleteMany(),
    prisma.jobAlert.deleteMany(),
    prisma.companyFollower.deleteMany(),
    prisma.generatedCv.deleteMany(),
    prisma.certification.deleteMany(),
    prisma.project.deleteMany(),
    prisma.moderationReport.deleteMany(),
    prisma.privacySettings.deleteMany(),
    prisma.externalJob.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversationParticipant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.reaction.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.applicationStatusHistory.deleteMany(),
    prisma.aiScreeningResult.deleteMany(),
    prisma.application.deleteMany(),
    prisma.job.deleteMany(),
    prisma.companyMember.deleteMany(),
    prisma.company.deleteMany(),
    prisma.skillEndorsement.deleteMany(),
    prisma.userSkill.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.cvFile.deleteMany(),
    prisma.education.deleteMany(),
    prisma.workExperience.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.connection.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const candidateSeeds = [
    { email: "linh.nguyen@example.com", name: "Linh Nguyen", location: "Ho Chi Minh City" },
    { email: "huy.tran@example.com", name: "Huy Tran", location: "Da Nang" },
    { email: "mai.pham@example.com", name: "Mai Pham", location: "Hanoi" },
    { email: "quang.le@example.com", name: "Quang Le", location: "Can Tho" },
    { email: "anh.vo@example.com", name: "Anh Vo", location: "Hue" },
  ];

  const recruiterSeeds = [
    { email: "thu.hr@example.com", name: "Thu Do", location: "Ho Chi Minh City" },
    { email: "khanh.talent@example.com", name: "Khanh Bui", location: "Hanoi" },
    { email: "minh.recruiter@example.com", name: "Minh Hoang", location: "Da Nang" },
  ];

  const candidates = [];
  for (const seed of candidateSeeds) {
    const user = await prisma.user.create({
      data: {
        email: seed.email,
        passwordHash: SEED_PASSWORD_HASH,
        role: UserRole.CANDIDATE,
        isVerified: true,
      },
    });
    candidates.push({ ...seed, id: user.id });
  }

  const recruiters = [];
  for (const seed of recruiterSeeds) {
    const user = await prisma.user.create({
      data: {
        email: seed.email,
        passwordHash: SEED_PASSWORD_HASH,
        role: UserRole.RECRUITER,
        isVerified: true,
      },
    });
    recruiters.push({ ...seed, id: user.id });
  }

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: SEED_PASSWORD_HASH,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  for (const [idx, candidate] of candidates.entries()) {
    await prisma.userProfile.create({
      data: {
        userId: candidate.id,
        fullName: candidate.name,
        headline: `Software Engineer ${idx + 1}`,
        about: "Passionate engineer with interest in AI-powered recruiting products.",
        avatarUrl: `https://cdn.example.com/avatars/candidate-${idx + 1}.png`,
        coverUrl: `https://cdn.example.com/covers/candidate-${idx + 1}.jpg`,
        location: candidate.location,
        profileCompleteness: 72 + idx * 5,
      },
    });

    await prisma.workExperience.create({
      data: {
        userId: candidate.id,
        company: idx % 2 === 0 ? "FPT Software" : "VNG",
        position: idx % 2 === 0 ? "Backend Developer" : "Frontend Developer",
        startDate: new Date(`${2018 + idx}-01-01T00:00:00.000Z`),
        endDate: idx >= 3 ? null : new Date(`${2020 + idx}-12-31T00:00:00.000Z`),
        isCurrent: idx >= 3,
        description: "Built scalable product features and collaborated cross-functionally.",
      },
    });

    await prisma.education.create({
      data: {
        userId: candidate.id,
        school: idx % 2 === 0 ? "HCMUT" : "HUST",
        degree: "Bachelor",
        major: "Computer Science",
        gpa: (3.1 + idx * 0.1).toFixed(2),
        startYear: 2015 + idx,
        endYear: 2019 + idx,
      },
    });
  }

  for (const recruiter of recruiters) {
    await prisma.userProfile.create({
      data: {
        userId: recruiter.id,
        fullName: recruiter.name,
        headline: "Senior Technical Recruiter",
        about: "Specialized in hiring engineering and product roles.",
        location: recruiter.location,
        profileCompleteness: 88,
      },
    });
  }

  await prisma.userProfile.create({
    data: {
      userId: admin.id,
      fullName: "System Admin",
      headline: "Platform Administrator",
      about: "Maintains operations and moderation quality.",
      location: "Ho Chi Minh City",
      profileCompleteness: 90,
    },
  });

  const skillSeeds = [
    { name: "TypeScript", category: "Programming" },
    { name: "Node.js", category: "Backend" },
    { name: "NestJS", category: "Backend" },
    { name: "React", category: "Frontend" },
    { name: "Next.js", category: "Frontend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Redis", category: "Database" },
    { name: "Docker", category: "DevOps" },
    { name: "FastAPI", category: "Backend" },
    { name: "Python", category: "Programming" },
    { name: "Machine Learning", category: "AI" },
    { name: "Communication", category: "Soft Skill" },
  ];

  const skills = [];
  for (const seed of skillSeeds) {
    const skill = await prisma.skill.create({ data: seed });
    skills.push(skill);
  }

  for (const [idx, candidate] of candidates.entries()) {
    const candidateSkillIds = [
      skills[idx % skills.length].id,
      skills[(idx + 1) % skills.length].id,
      skills[(idx + 4) % skills.length].id,
      skills[(idx + 7) % skills.length].id,
    ];

    for (const [sIdx, skillId] of candidateSkillIds.entries()) {
      const yearsForSkill = Number((1.5 + idx + sIdx * 0.5).toFixed(1));
      await prisma.userSkill.create({
        data: {
          userId: candidate.id,
          skillId,
          // Keep level consistent with years of experience to avoid
          // contradictions like "3 years but BEGINNER".
          level:
            yearsForSkill >= 6
              ? SkillLevel.EXPERT
              : yearsForSkill >= 4
                ? SkillLevel.ADVANCED
                : yearsForSkill >= 2
                  ? SkillLevel.INTERMEDIATE
                  : SkillLevel.BEGINNER,
          yearsExp: yearsForSkill.toFixed(1),
        },
      });
    }
  }

  for (const [idx, candidate] of candidates.entries()) {
    await prisma.skillEndorsement.create({
      data: {
        endorserId: recruiters[idx % recruiters.length].id,
        userId: candidate.id,
        skillId: skills[idx % skills.length].id,
      },
    });
  }

  const cvFiles = [];
  for (const [idx, candidate] of candidates.entries()) {
    const cv = await prisma.cvFile.create({
      data: {
        userId: candidate.id,
        fileUrl: `https://minio.local/cv-files/${candidate.id}/cv-${idx + 1}.pdf`,
        fileName: `${candidate.name.toLowerCase().replace(/\s+/g, "-")}-cv.pdf`,
        fileSize: BigInt(300_000 + idx * 45_000),
        isPrimary: true,
      },
    });
    cvFiles.push(cv);
  }

  const companies = [
    await prisma.company.create({
      data: {
        name: "TechNova Vietnam",
        slug: "technova-vietnam",
        logoUrl: "https://cdn.example.com/company/technova.png",
        coverUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=80",
        website: "https://technova.vn",
        industry: "SaaS",
        sizeRange: "51-200",
        foundedYear: 2017,
        address: "Quận 1, TP. Hồ Chí Minh",
        description: "Builds recruiting automation platforms for SEA market.",
      },
    }),
    await prisma.company.create({
      data: {
        name: "Astra Fintech",
        slug: "astra-fintech",
        logoUrl: "https://cdn.example.com/company/astra.png",
        coverUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&q=80",
        website: "https://astra.finance",
        industry: "Fintech",
        sizeRange: "201-500",
        foundedYear: 2015,
        address: "Quận Ba Đình, Hà Nội",
        description: "Digital banking infrastructure with data-driven hiring.",
      },
    }),
  ];

  await prisma.companyMember.createMany({
    data: [
      { companyId: companies[0].id, userId: recruiters[0].id, role: CompanyMemberRole.OWNER },
      { companyId: companies[0].id, userId: recruiters[1].id, role: CompanyMemberRole.RECRUITER },
      { companyId: companies[1].id, userId: recruiters[2].id, role: CompanyMemberRole.OWNER },
      { companyId: companies[1].id, userId: recruiters[1].id, role: CompanyMemberRole.ADMIN },
    ],
  });

  const jobTemplates = [
    "Backend Engineer",
    "Frontend Engineer",
    "Fullstack Developer",
    "Data Engineer",
    "ML Engineer",
    "QA Automation Engineer",
    "DevOps Engineer",
    "Product Analyst",
    "Technical Recruiter",
    "Platform Engineer",
  ];

  const jobs = [];
  for (let i = 0; i < 10; i += 1) {
    const company = companies[i % companies.length];
    const recruiter = recruiters[i % recruiters.length];

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        createdBy: recruiter.id,
        title: jobTemplates[i],
        description: `We are hiring a ${jobTemplates[i]} to join our fast-growing product team.`,
        jobType: i % 3 === 0 ? "FULL_TIME" : i % 3 === 1 ? "HYBRID" : "REMOTE",
        level: i % 2 === 0 ? "MID" : "SENIOR",
        experienceLevel: i % 2 === 0 ? "2-5 years" : "5+ years",
        category: ["Engineering", "Data", "Design", "Product", "Marketing"][i % 5],
        isRemote: i % 3 === 2,
        minSalary: 20_000_000 + i * 2_000_000,
        maxSalary: 35_000_000 + i * 3_000_000,
        salaryCurrency: "VND",
        location: i % 2 === 0 ? "Ho Chi Minh City" : "Hanoi",
        requiredSkills: [
          skillSeeds[i % skillSeeds.length].name,
          skillSeeds[(i + 2) % skillSeeds.length].name,
          skillSeeds[(i + 4) % skillSeeds.length].name,
        ],
        slug: `${jobTemplates[i].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}-${i}`,
        status: i < 8 ? "ACTIVE" : "DRAFT",
        publishedAt: i < 8 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : null,
        expiresAt: new Date(Date.now() + (14 + i) * 24 * 60 * 60 * 1000),
      },
    });
    jobs.push(job);
  }

  const applications = [];
  const statusPlan: ApplicationStatus[] = [
    ApplicationStatus.AI_SCREENING,
    ApplicationStatus.HR_REVIEW,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.REJECTED,
  ];

  for (let cIdx = 0; cIdx < candidates.length; cIdx += 1) {
    for (let offset = 0; offset < 4; offset += 1) {
      const job = jobs[(cIdx * 2 + offset) % jobs.length];
      const appStatus = statusPlan[(cIdx + offset) % statusPlan.length];

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidates[cIdx].id,
          cvFileId: cvFiles[cIdx].id,
          coverLetter: `I am excited to apply for ${job.title} and contribute immediately.`,
          status: appStatus,
          appliedAt: new Date(Date.now() - (cIdx * 4 + offset + 1) * 24 * 60 * 60 * 1000),
        },
      });
      applications.push(application);
    }
  }

  for (const [idx, application] of applications.entries()) {
    const overall = 58 + ((idx * 7) % 38);
    const skillScore = Math.min(100, overall + 3);
    const experienceScore = Math.max(45, overall - 5);
    const educationScore = Math.max(50, overall - 8);
    const otherScore = Math.max(40, overall - 10);

    await prisma.aiScreeningResult.create({
      data: {
        applicationId: application.id,
        overallScore: overall.toFixed(2),
        skillScore: skillScore.toFixed(2),
        experienceScore: experienceScore.toFixed(2),
        educationScore: educationScore.toFixed(2),
        otherScore: otherScore.toFixed(2),
        grade: overall >= 85 ? "A" : overall >= 70 ? "B" : "C",
        matchedSkills: [
          skillSeeds[idx % skillSeeds.length].name,
          skillSeeds[(idx + 3) % skillSeeds.length].name,
        ],
        missingSkills: [skillSeeds[(idx + 5) % skillSeeds.length].name],
        strengths: [
          "Solid project portfolio",
          "Good communication and teamwork mindset",
        ],
        concerns: overall < 70 ? ["Needs mentorship on production-scale systems"] : [],
        explanation: "Score combines skills (40%), experience (30%), education (20%), and other signals (10%).",
        modelVersion: "cv-screener-v1.0.0",
        processingTimeMs: 350 + idx * 12,
      },
    });

    const changedBy = recruiters[idx % recruiters.length].id;
    const baseTime = new Date(Date.now() - (idx + 2) * 12 * 60 * 60 * 1000);

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.AI_SCREENING,
        changedBy,
        note: "Queued for AI screening.",
        changedAt: baseTime,
      },
    });

    if (application.status !== ApplicationStatus.AI_SCREENING) {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: ApplicationStatus.AI_SCREENING,
          toStatus: application.status,
          changedBy,
          note: `Advanced to ${application.status}.`,
          changedAt: new Date(baseTime.getTime() + 60 * 60 * 1000),
        },
      });
    }
  }

  const posts = [];
  posts.push(
    await prisma.post.create({
      data: {
        authorId: candidates[0].id,
        content: "Excited to share I just completed a production-ready AI screening pipeline demo!",
        mediaUrls: ["https://cdn.example.com/posts/demo-1.png"],
        visibility: PostVisibility.PUBLIC,
        likeCount: 12,
        commentCount: 2,
      },
    }),
  );
  posts.push(
    await prisma.post.create({
      data: {
        authorId: recruiters[0].id,
        companyId: companies[0].id,
        content: "We are hiring backend and ML engineers this month. Reach out if interested.",
        visibility: PostVisibility.PUBLIC,
        likeCount: 19,
        commentCount: 3,
      },
    }),
  );

  const comment = await prisma.comment.create({
    data: {
      postId: posts[1].id,
      authorId: candidates[1].id,
      content: "I have applied and would love to connect.",
    },
  });

  await prisma.comment.create({
    data: {
      postId: posts[1].id,
      parentId: comment.id,
      authorId: recruiters[0].id,
      content: "Great, we will review your application soon.",
    },
  });

  await prisma.reaction.createMany({
    data: [
      {
        userId: candidates[2].id,
        targetType: ReactionTargetType.POST,
        targetId: posts[0].id,
        reactionType: ReactionType.CELEBRATE,
      },
      {
        userId: recruiters[1].id,
        targetType: ReactionTargetType.POST,
        targetId: posts[0].id,
        reactionType: ReactionType.SUPPORT,
      },
      {
        userId: candidates[3].id,
        targetType: ReactionTargetType.COMMENT,
        targetId: comment.id,
        reactionType: ReactionType.LIKE,
      },
    ],
  });

  await prisma.connection.createMany({
    data: [
      {
        requesterId: candidates[0].id,
        addresseeId: candidates[1].id,
        status: ConnectionStatus.ACCEPTED,
      },
      {
        requesterId: candidates[0].id,
        addresseeId: recruiters[0].id,
        status: ConnectionStatus.PENDING,
      },
      {
        requesterId: candidates[2].id,
        addresseeId: recruiters[2].id,
        status: ConnectionStatus.ACCEPTED,
      },
    ],
  });

  const directConversation = await prisma.conversation.create({
    data: { type: ConversationType.DIRECT },
  });

  await prisma.conversationParticipant.createMany({
    data: [
      { conversationId: directConversation.id, userId: candidates[0].id, lastReadAt: new Date() },
      { conversationId: directConversation.id, userId: recruiters[0].id, lastReadAt: new Date() },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: directConversation.id,
        senderId: candidates[0].id,
        content: "Hi, I just applied for Backend Engineer role. Looking forward to your feedback.",
        isRead: true,
      },
      {
        conversationId: directConversation.id,
        senderId: recruiters[0].id,
        content: "Thanks for applying. Your profile is in our AI screening queue now.",
        isRead: false,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: candidates[0].id,
        type: "APPLICATION_STATUS",
        title: "Application moved to HR Review",
        body: "Your Backend Engineer application has passed AI screening.",
        data: { status: "HR_REVIEW" },
        isRead: false,
      },
      {
        userId: recruiters[0].id,
        type: "NEW_APPLICATION",
        title: "New candidate applied",
        body: "A new application was submitted for Backend Engineer.",
        data: { jobTitle: "Backend Engineer" },
        isRead: false,
      },
    ],
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
