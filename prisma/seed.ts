import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Categories
  console.log('Creating categories...');
  const categories = [
    { name: 'Financial Audit', slug: 'financial-audit', description: 'Agents for financial auditing and accounting', orderIndex: 1 },
    { name: 'Compliance', slug: 'compliance', description: 'Regulatory compliance and standards checking', orderIndex: 2 },
    { name: 'Risk Assessment', slug: 'risk-assessment', description: 'Risk analysis and management agents', orderIndex: 3 },
    { name: 'Internal Controls', slug: 'internal-controls', description: 'Internal control testing and evaluation', orderIndex: 4 },
    { name: 'Data Analysis', slug: 'data-analysis', description: 'Data analytics and visualization agents', orderIndex: 5 },
    { name: 'Report Generation', slug: 'report-generation', description: 'Automated report generation and documentation', orderIndex: 6 },
    { name: 'Process Automation', slug: 'process-automation', description: 'Workflow and process automation agents', orderIndex: 7 },
    { name: 'Document Review', slug: 'document-review', description: 'Document analysis and review agents', orderIndex: 8 },
    { name: 'Other', slug: 'other', description: 'Miscellaneous audit agents', orderIndex: 999 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log(`✅ Created ${categories.length} categories`);

  // Seed Tags (formerly platforms)
  console.log('Creating tags...');
  const tags = [
    { name: 'OpenAI', slug: 'openai', description: 'OpenAI GPT models and assistants', color: '#10a37f' },
    { name: 'Claude', slug: 'claude', description: 'Anthropic Claude AI', color: '#cc785c' },
    { name: 'Google Gemini', slug: 'gemini', description: 'Google Gemini AI models', color: '#4285f4' },
    { name: 'LangChain', slug: 'langchain', description: 'LangChain framework agents', color: '#1c3c3c' },
    { name: 'GitHub Copilot', slug: 'copilot', description: 'GitHub Copilot extensions', color: '#000000' },
    { name: 'Python', slug: 'python', description: 'Python-based agents', color: '#3776ab' },
    { name: 'JavaScript', slug: 'javascript', description: 'JavaScript/Node.js agents', color: '#f7df1e' },
    { name: 'API Integration', slug: 'api-integration', description: 'Agents that integrate with external APIs', color: '#61dafb' },
    { name: 'Data Processing', slug: 'data-processing', description: 'Data processing and transformation', color: '#ff6b6b' },
    { name: 'Automation', slug: 'automation', description: 'Workflow automation agents', color: '#51cf66' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log(`✅ Created ${tags.length} tags`);

  // Seed Statuses
  console.log('Creating statuses...');
  const statuses = [
    { name: 'Submitted', slug: 'submitted', description: 'Agent has been submitted', color: 'blue', orderIndex: 1 },
    { name: 'AI Team Review', slug: 'ai-team-review', description: 'Agent is being reviewed by AI team', color: 'yellow', orderIndex: 2 },
    { name: 'Pending Council Review', slug: 'pending-council-review', description: 'Awaiting council review', color: 'orange', orderIndex: 3 },
    { name: 'In Development', slug: 'in-development', description: 'Agent is in development', color: 'purple', orderIndex: 4 },
    { name: 'Live', slug: 'live', description: 'Agent is live and ready for use', color: 'green', orderIndex: 5 },
    { name: 'On Hold', slug: 'on-hold', description: 'Agent development is on hold', color: 'gray', orderIndex: 6 },
    { name: 'Cancelled', slug: 'cancelled', description: 'Agent has been cancelled', color: 'red', orderIndex: 7 },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { slug: status.slug },
      update: {},
      create: status,
    });
  }

  console.log(`✅ Created ${statuses.length} statuses`);

  // Seed Phases
  console.log('Creating phases...');
  const phases = [
    { name: 'Scoping/Planning', slug: 'scoping-planning', description: 'Scoping and planning phase', color: 'blue', orderIndex: 1 },
    { name: 'Fieldwork', slug: 'fieldwork', description: 'Fieldwork phase', color: 'green', orderIndex: 2 },
    { name: 'Reporting', slug: 'reporting', description: 'Reporting phase', color: 'purple', orderIndex: 3 },
    { name: 'WrapUp', slug: 'wrapup', description: 'Wrap up phase', color: 'orange', orderIndex: 4 },
    { name: 'SOX', slug: 'sox', description: 'SOX compliance phase', color: 'red', orderIndex: 5 },
    { name: 'Admin/Other', slug: 'admin-other', description: 'Administrative and other tasks', color: 'gray', orderIndex: 6 },
    { name: 'Audit Operations', slug: 'audit-operations', description: 'Audit operations', color: 'cyan', orderIndex: 7 },
  ];

  for (const phase of phases) {
    await prisma.phase.upsert({
      where: { slug: phase.slug },
      update: {},
      create: phase,
    });
  }

  console.log(`✅ Created ${phases.length} phases`);

  // Seed Benefits
  console.log('Creating benefits...');
  const benefits = [
    { name: 'Low', slug: 'low', description: 'Low benefit impact', color: 'gray', orderIndex: 1 },
    { name: 'Moderate', slug: 'moderate', description: 'Moderate benefit impact', color: 'yellow', orderIndex: 2 },
    { name: 'High', slug: 'high', description: 'High benefit impact', color: 'orange', orderIndex: 3 },
    { name: 'Transformational', slug: 'transformational', description: 'Transformational benefit impact', color: 'green', orderIndex: 4 },
  ];

  for (const benefit of benefits) {
    await prisma.benefit.upsert({
      where: { slug: benefit.slug },
      update: {},
      create: benefit,
    });
  }

  console.log(`✅ Created ${benefits.length} benefits`);

  // Seed OpsStatuses
  console.log('Creating ops statuses...');
  const opsStatuses = [
    { name: 'Idea', slug: 'idea', description: 'Conceptual idea stage', color: 'gray', orderIndex: 1 },
    { name: 'Individual Use', slug: 'individual-use', description: 'Used by individuals', color: 'blue', orderIndex: 2 },
    { name: 'Portfolio Use', slug: 'portfolio-use', description: 'Used across portfolio', color: 'purple', orderIndex: 3 },
    { name: 'Department Wide Use', slug: 'department-wide-use', description: 'Used department-wide', color: 'green', orderIndex: 4 },
  ];

  for (const opsStatus of opsStatuses) {
    await prisma.opsStatus.upsert({
      where: { slug: opsStatus.slug },
      update: {},
      create: opsStatus,
    });
  }

  console.log(`✅ Created ${opsStatuses.length} ops statuses`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
