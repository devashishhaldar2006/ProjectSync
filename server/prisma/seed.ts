import { PrismaClient, Role, TaskPriority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing data in reverse order of foreign key dependency
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing records.');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users (1 Admin, 2 PMs, 4 Developers)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@velozity.com',
      passwordHash,
      name: 'Arthur Pendelton (Admin)',
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const pmSarah = await prisma.user.create({
    data: {
      email: 'pm.sarah@velozity.com',
      passwordHash,
      name: 'Sarah Connor (PM)',
      role: Role.PROJECT_MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const pmMarcus = await prisma.user.create({
    data: {
      email: 'pm.marcus@velozity.com',
      passwordHash,
      name: 'Marcus Vance (PM)',
      role: Role.PROJECT_MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const devRavi = await prisma.user.create({
    data: {
      email: 'dev.ravi@velozity.com',
      passwordHash,
      name: 'Ravi Kumar',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const devElena = await prisma.user.create({
    data: {
      email: 'dev.elena@velozity.com',
      passwordHash,
      name: 'Elena Rostova',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const devAlex = await prisma.user.create({
    data: {
      email: 'dev.alex@velozity.com',
      passwordHash,
      name: 'Alex Chen',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  const devPriya = await prisma.user.create({
    data: {
      email: 'dev.priya@velozity.com',
      passwordHash,
      name: 'Priya Patel',
      role: Role.DEVELOPER,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('Created 1 Admin, 2 Project Managers, 4 Developers.');

  // 2. Create Clients
  const clientApex = await prisma.client.create({
    data: {
      name: 'Apex Financial Services',
      email: 'contact@apexfin.com',
      company: 'Apex Holdings LLC',
    },
  });

  const clientPulse = await prisma.client.create({
    data: {
      name: 'Pulse Health Systems',
      email: 'tech@pulsehealth.org',
      company: 'Pulse Healthcare Inc.',
    },
  });

  const clientNova = await prisma.client.create({
    data: {
      name: 'Nova Retail Group',
      email: 'digital@novaretail.io',
      company: 'Nova Omnichannel Ltd.',
    },
  });

  console.log('Created 3 Clients.');

  // 3. Create Projects (At least 3 projects)
  const projFintech = await prisma.project.create({
    data: {
      name: 'FinTech Mobile Banking Overhaul',
      description: 'Next-generation biometric auth, microservice ledger, and real-time transaction streaming.',
      clientId: clientApex.id,
      managerId: pmSarah.id,
      status: 'ACTIVE',
    },
  });

  const projHealth = await prisma.project.create({
    data: {
      name: 'HealthCare Patient Portal v2',
      description: 'HIPAA-compliant telemedicine dashboard, encrypted records, and doctor-patient live chat.',
      clientId: clientPulse.id,
      managerId: pmSarah.id,
      status: 'ACTIVE',
    },
  });

  const projCloud = await prisma.project.create({
    data: {
      name: 'E-Commerce Cloud Migration',
      description: 'Multi-region AWS ECS Kubernetes deployment with zero downtime catalog sync.',
      clientId: clientNova.id,
      managerId: pmMarcus.id,
      status: 'ACTIVE',
    },
  });

  console.log('Created 3 Projects.');

  // 4. Create Tasks (at least 5+ tasks each, with at least 2 tasks already overdue)
  const now = new Date();
  const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const past5Days = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const future2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const future5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const future10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // --- Project 1 Tasks (FinTech - PM Sarah) ---
  const t1 = await prisma.task.create({
    data: {
      title: 'Biometric FaceID / TouchID Handshake',
      description: 'Implement secure WebAuthn and enclave crypto token storage on iOS/Android.',
      projectId: projFintech.id,
      assignedToId: devRavi.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: future2Days,
      isOverdue: false,
    },
  });

  // Overdue Task 1
  const t2 = await prisma.task.create({
    data: {
      title: 'Automated AML Transaction Auditing Engine',
      description: 'Stream suspicious activity triggers into compliance ledger for legal oversight.',
      projectId: projFintech.id,
      assignedToId: devElena.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.CRITICAL,
      dueDate: past3Days,
      isOverdue: true,
    },
  });

  const t3 = await prisma.task.create({
    data: {
      title: 'Real-Time Kafka Transaction Pipeline',
      description: 'Setup consumer consumer-group failovers with Avro schema registry validation.',
      projectId: projFintech.id,
      assignedToId: devRavi.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: future5Days,
      isOverdue: false,
    },
  });

  const t4 = await prisma.task.create({
    data: {
      title: 'Multi-Currency Wallet Balance Cache',
      description: 'Redis cluster cache invalidation on ledger write operations.',
      projectId: projFintech.id,
      assignedToId: devAlex.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: past5Days,
      isOverdue: false,
    },
  });

  const t5 = await prisma.task.create({
    data: {
      title: 'Security Penetration Testing Remediation',
      description: 'Patch OAuth2 PKCE replay vulnerability discovered in preliminary audit.',
      projectId: projFintech.id,
      assignedToId: devPriya.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: future10Days,
      isOverdue: false,
    },
  });

  const t6 = await prisma.task.create({
    data: {
      title: 'Push Notification Dispatcher via APNS & FCM',
      description: 'Reliable payment confirmation notifications with retry queue.',
      projectId: projFintech.id,
      assignedToId: devElena.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: future5Days,
      isOverdue: false,
    },
  });

  // --- Project 2 Tasks (Healthcare - PM Sarah) ---
  // Overdue Task 2
  const t7 = await prisma.task.create({
    data: {
      title: 'HIPAA Audit Trail Encryption Key Rotation',
      description: 'Enforce annual HSM master key rotation protocol for electronic health records.',
      projectId: projHealth.id,
      assignedToId: devAlex.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: past5Days,
      isOverdue: true,
    },
  });

  const t8 = await prisma.task.create({
    data: {
      title: 'WebRTC Telehealth Consultation Stream',
      description: 'End-to-end encrypted video bridge between doctor and patient with screen share.',
      projectId: projHealth.id,
      assignedToId: devRavi.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: future2Days,
      isOverdue: false,
    },
  });

  const t9 = await prisma.task.create({
    data: {
      title: 'EHR FHIR API Gateway Integration',
      description: 'Map external hospital HL7 FHIR protocols into unified JSON format.',
      projectId: projHealth.id,
      assignedToId: devPriya.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: future5Days,
      isOverdue: false,
    },
  });

  const t10 = await prisma.task.create({
    data: {
      title: 'Prescription Digital Signature Module',
      description: 'Implement e-prescribing standard compliance with qualified digital certificates.',
      projectId: projHealth.id,
      assignedToId: devElena.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: future10Days,
      isOverdue: false,
    },
  });

  const t11 = await prisma.task.create({
    data: {
      title: 'Emergency Contact SMS Broadcast',
      description: 'Twilio webhook for high-priority vitals anomaly alerts.',
      projectId: projHealth.id,
      assignedToId: devAlex.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: past3Days,
      isOverdue: false,
    },
  });

  // --- Project 3 Tasks (Cloud Migration - PM Marcus) ---
  const t12 = await prisma.task.create({
    data: {
      title: 'Terraform AWS EKS Multi-AZ Cluster',
      description: 'Provision production Kubernetes infrastructure with Karpenter autoscaling.',
      projectId: projCloud.id,
      assignedToId: devPriya.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: future2Days,
      isOverdue: false,
    },
  });

  // Overdue Task 3
  const t13 = await prisma.task.create({
    data: {
      title: 'Legacy MySQL to Aurora Postgres ETL Script',
      description: 'Zero downtime CDC streaming of 40M product SKU catalog rows.',
      projectId: projCloud.id,
      assignedToId: devAlex.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: past3Days,
      isOverdue: true,
    },
  });

  const t14 = await prisma.task.create({
    data: {
      title: 'Cloudflare Edge Caching & WAF Rules',
      description: 'Setup dynamic origin routing and rate limits against malicious scrapers.',
      projectId: projCloud.id,
      assignedToId: devElena.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: future5Days,
      isOverdue: false,
    },
  });

  const t15 = await prisma.task.create({
    data: {
      title: 'Prometheus & Grafana Observability Dashboards',
      description: 'Setup alerting rules for p99 latency spikes and container OOM kills.',
      projectId: projCloud.id,
      assignedToId: devRavi.id,
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: past5Days,
      isOverdue: false,
    },
  });

  const t16 = await prisma.task.create({
    data: {
      title: 'Canary Deployment Pipeline with ArgoCD',
      description: 'Automated 10% traffic routing with instant rollback on HTTP 5xx errors.',
      projectId: projCloud.id,
      assignedToId: devPriya.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: future10Days,
      isOverdue: false,
    },
  });

  console.log('Created 16 comprehensive tasks across 3 projects (with 3 overdue tasks).');

  // 5. Pre-existing Activity Log Entries (so feed is not empty on first load)
  const activities = [
    {
      taskId: t3.id,
      projectId: projFintech.id,
      userId: devRavi.id,
      action: 'STATUS_CHANGED' as const,
      details: {
        taskNumber: t3.taskNumber,
        taskTitle: t3.title,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'IN_REVIEW',
      },
      createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 mins ago
    },
    {
      taskId: t1.id,
      projectId: projFintech.id,
      userId: devRavi.id,
      action: 'STATUS_CHANGED' as const,
      details: {
        taskNumber: t1.taskNumber,
        taskTitle: t1.title,
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
      },
      createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
    },
    {
      taskId: t2.id,
      projectId: projFintech.id,
      userId: admin.id,
      action: 'OVERDUE_FLAGGED' as const,
      details: {
        taskNumber: t2.taskNumber,
        taskTitle: t2.title,
        dueDate: past3Days.toISOString(),
      },
      createdAt: new Date(now.getTime() - 45 * 60 * 1000),
    },
    {
      taskId: t10.id,
      projectId: projHealth.id,
      userId: devElena.id,
      action: 'STATUS_CHANGED' as const,
      details: {
        taskNumber: t10.taskNumber,
        taskTitle: t10.title,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'IN_REVIEW',
      },
      createdAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
    {
      taskId: t7.id,
      projectId: projHealth.id,
      userId: admin.id,
      action: 'OVERDUE_FLAGGED' as const,
      details: {
        taskNumber: t7.taskNumber,
        taskTitle: t7.title,
        dueDate: past5Days.toISOString(),
      },
      createdAt: new Date(now.getTime() - 120 * 60 * 1000),
    },
    {
      taskId: t14.id,
      projectId: projCloud.id,
      userId: devElena.id,
      action: 'STATUS_CHANGED' as const,
      details: {
        taskNumber: t14.taskNumber,
        taskTitle: t14.title,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'IN_REVIEW',
      },
      createdAt: new Date(now.getTime() - 180 * 60 * 1000),
    },
    {
      taskId: t12.id,
      projectId: projCloud.id,
      userId: devPriya.id,
      action: 'STATUS_CHANGED' as const,
      details: {
        taskNumber: t12.taskNumber,
        taskTitle: t12.title,
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
      },
      createdAt: new Date(now.getTime() - 240 * 60 * 1000),
    },
    {
      taskId: t4.id,
      projectId: projFintech.id,
      userId: devAlex.id,
      action: 'STATUS_CHANGED' as const,
      details: {
        taskNumber: t4.taskNumber,
        taskTitle: t4.title,
        fromStatus: 'IN_REVIEW',
        toStatus: 'DONE',
      },
      createdAt: new Date(now.getTime() - 360 * 60 * 1000),
    },
  ];

  for (const act of activities) {
    await prisma.activityLog.create({ data: act });
  }
  console.log(`Created ${activities.length} activity log records.`);

  // 6. Pre-existing In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: devRavi.id,
        title: 'New Task Assigned',
        message: 'Sarah Connor assigned you Task #1: "Biometric FaceID / TouchID Handshake"',
        type: 'TASK_ASSIGNED',
        referenceId: t1.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 10 * 60 * 1000),
      },
      {
        userId: pmSarah.id,
        title: 'Task Ready For Review',
        message: 'Ravi Kumar moved Task #3 ("Real-Time Kafka Transaction Pipeline") to In Review',
        type: 'TASK_REVIEW',
        referenceId: t3.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 1000),
      },
      {
        userId: pmSarah.id,
        title: 'Task Overdue',
        message: 'Task #2 ("Automated AML Transaction Auditing Engine") is past due date.',
        type: 'TASK_OVERDUE',
        referenceId: t2.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 40 * 60 * 1000),
      },
      {
        userId: devElena.id,
        title: 'Task Overdue Alert',
        message: 'Your assigned task #2 ("Automated AML Transaction Auditing Engine") has passed its due date.',
        type: 'TASK_OVERDUE',
        referenceId: t2.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 40 * 60 * 1000),
      },
    ],
  });

  console.log('Created initial notifications.');
  console.log('--- Database Seed Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
