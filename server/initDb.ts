import { db } from './db';
import * as schema from '@shared/schema';
import { hash } from 'bcrypt';
import { randomUUID } from 'crypto';

async function initDb() {
  try {
    console.log('Initializing database...');
    
    // Create admin user
    const hashedPassword = await hash('admin123', 10);
    const now = new Date();
    
    const [adminUser] = await db.insert(schema.users).values({
      username: 'admin',
      password: hashedPassword,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }).returning();
    
    console.log('Created admin user:', adminUser.id);
    
    // Create support agent for admin
    const [agent] = await db.insert(schema.supportAgents).values({
      userId: adminUser.id,
      isAvailable: true,
      lastActive: now
    }).returning();
    
    console.log('Created support agent:', agent.id);
    
    // Create sample clients
    const [lojaConceito] = await db.insert(schema.clients).values({
      name: 'Loja Conceito',
      category: 'E-commerce',
      logo: '',
      isActive: true,
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      chatTitle: 'Atendimento Loja Conceito',
      welcomeMessage: 'Olá! Bem-vindo à Loja Conceito. Como posso ajudar você hoje?',
      userId: adminUser.id,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    const [restaurante] = await db.insert(schema.clients).values({
      name: 'Restaurante Sabor',
      category: 'Alimentação',
      logo: '',
      isActive: true,
      primaryColor: '#10B981',
      secondaryColor: '#3B82F6',
      chatTitle: 'Atendimento Restaurante Sabor',
      welcomeMessage: 'Olá! Bem-vindo ao Restaurante Sabor. Como posso ajudar você hoje?',
      userId: adminUser.id,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    const [clinica] = await db.insert(schema.clients).values({
      name: 'Clínica Bem-Estar',
      category: 'Saúde',
      logo: '',
      isActive: true,
      primaryColor: '#8B5CF6',
      secondaryColor: '#3B82F6',
      chatTitle: 'Atendimento Clínica Bem-Estar',
      welcomeMessage: 'Olá! Bem-vindo à Clínica Bem-Estar. Como posso ajudar você hoje?',
      userId: adminUser.id,
      createdAt: now,
      updatedAt: now
    }).returning();
    
    console.log('Created sample clients');
    
    // Create sample custom responses
    await db.insert(schema.customResponses).values([
      {
        clientId: lojaConceito.id,
        keyword: 'horario',
        response: 'Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h, e aos sábados das 9h às 13h.',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: lojaConceito.id,
        keyword: 'entrega',
        response: 'Realizamos entregas para todo o Brasil. O prazo médio é de 3 a 5 dias úteis, dependendo da sua localização.',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: restaurante.id,
        keyword: 'reserva',
        response: 'Para fazer uma reserva, por favor informe a data, horário e número de pessoas. Teremos prazer em atendê-lo!',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        clientId: clinica.id,
        keyword: 'agendamento',
        response: 'Para agendar uma consulta, por favor informe a especialidade médica desejada e suas preferências de data e horário.',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
    
    console.log('Created sample custom responses');
    
    // Create sample statistics
    await db.insert(schema.statistics).values([
      {
        clientId: lojaConceito.id,
        messageCount: 243,
        userCount: 18,
        supportRequestCount: 8,
        date: now
      },
      {
        clientId: restaurante.id,
        messageCount: 187,
        userCount: 24,
        supportRequestCount: 5,
        date: now
      },
      {
        clientId: clinica.id,
        messageCount: 98,
        userCount: 12,
        supportRequestCount: 3,
        date: now
      }
    ]);
    
    console.log('Created sample statistics');
    
    // Create sample chat sessions
    const [session1] = await db.insert(schema.chatSessions).values({
      clientId: lojaConceito.id,
      sessionToken: randomUUID(),
      phoneNumber: null,
      expiresAt: null,
      createdAt: now,
      lastActive: now
    }).returning();
    
    console.log('Created sample chat session');
    
    // Create sample chat messages
    await db.insert(schema.chatMessages).values([
      {
        sessionId: session1.id,
        content: 'Olá! Bem-vindo à Loja Conceito. Como posso ajudar você hoje?',
        isUserMessage: false,
        needsSupport: false,
        timestamp: now
      },
      {
        sessionId: session1.id,
        content: 'Olá, quero saber sobre o horário de funcionamento',
        isUserMessage: true,
        needsSupport: false,
        timestamp: new Date(now.getTime() + 30000)
      },
      {
        sessionId: session1.id,
        content: 'Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h, e aos sábados das 9h às 13h.',
        isUserMessage: false,
        needsSupport: false,
        timestamp: new Date(now.getTime() + 35000)
      }
    ]);
    
    console.log('Created sample chat messages');
    
    // Create sample support chat
    const [supportChat] = await db.insert(schema.supportChats).values({
      clientId: lojaConceito.id,
      sessionId: session1.id,
      agentId: agent.id,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null
    }).returning();
    
    // Create sample support messages
    await db.insert(schema.supportMessages).values([
      {
        chatId: supportChat.id,
        senderId: null, // From client
        content: 'Preciso de ajuda para encontrar um produto específico',
        isRead: true,
        timestamp: new Date(now.getTime() + 60000)
      },
      {
        chatId: supportChat.id,
        senderId: adminUser.id, // From admin
        content: 'Olá! Ficarei feliz em ajudar. Qual produto você está procurando?',
        isRead: true,
        timestamp: new Date(now.getTime() + 65000)
      },
      {
        chatId: supportChat.id,
        senderId: null, // From client
        content: 'Estou procurando o tênis modelo Runner na cor azul',
        isRead: true,
        timestamp: new Date(now.getTime() + 90000)
      },
      {
        chatId: supportChat.id,
        senderId: adminUser.id, // From admin
        content: 'Vou verificar a disponibilidade para você. Um momento, por favor.',
        isRead: true,
        timestamp: new Date(now.getTime() + 100000)
      }
    ]);
    
    console.log('Created sample support chat and messages');
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export { initDb };