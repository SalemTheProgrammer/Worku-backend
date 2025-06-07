import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationResponseDto } from './dto/notification.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4000'], // Angular Frontend and SSR Frontend
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedClients = new Map<string, { socket: Socket; companyId: string }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization;
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      const payload = this.jwtService.verify(cleanToken, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.role !== 'company') {
        this.logger.warn(`Client ${client.id} attempted to connect with invalid role: ${payload.role}`);
        client.disconnect();
        return;
      }

      const companyId = payload.userId;
      this.connectedClients.set(client.id, { socket: client, companyId });
      
      // Join company-specific room
      client.join(`company:${companyId}`);
      
      this.logger.log(`Company ${companyId} connected with socket ${client.id}`);
      
      // Send connection confirmation
      client.emit('connected', { message: 'Successfully connected to notifications' });
      
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      this.logger.log(`Company ${clientInfo.companyId} disconnected (socket: ${client.id})`);
      this.connectedClients.delete(client.id);
    }
  }

  @SubscribeMessage('joinCompanyRoom')
  handleJoinCompanyRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { companyId: string }) {
    const clientInfo = this.connectedClients.get(client.id);
    
    if (!clientInfo || clientInfo.companyId !== data.companyId) {
      client.emit('error', { message: 'Unauthorized to join this room' });
      return;
    }

    client.join(`company:${data.companyId}`);
    client.emit('joinedRoom', { room: `company:${data.companyId}` });
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(@ConnectedSocket() client: Socket, @MessageBody() data: { notificationId: string }) {
    const clientInfo = this.connectedClients.get(client.id);
    
    if (!clientInfo) {
      client.emit('error', { message: 'Client not authenticated' });
      return;
    }

    // Emit to the specific client that the notification was marked as read
    client.emit('notificationRead', { notificationId: data.notificationId });
    
    // Also emit to all clients in the company room to update badge counts
    this.server.to(`company:${clientInfo.companyId}`).emit('notificationStatusChanged', {
      notificationId: data.notificationId,
      status: 'READ'
    });
  }

  @SubscribeMessage('getOnlineStatus')
  handleGetOnlineStatus(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    
    if (!clientInfo) {
      client.emit('error', { message: 'Client not authenticated' });
      return;
    }

    client.emit('onlineStatus', { 
      isOnline: true,
      companyId: clientInfo.companyId,
      connectedAt: new Date().toISOString()
    });
  }

  // Method to send notification to a specific company
  sendNotificationToCompany(companyId: string, notification: NotificationResponseDto) {
    const room = `company:${companyId}`;
    this.server.to(room).emit('newNotification', notification);
    this.logger.log(`Sent notification to company ${companyId} in room ${room}`);
  }

  // Method to send notification status update to a company
  sendNotificationStatusUpdate(companyId: string, notificationId: string, status: string) {
    const room = `company:${companyId}`;
    this.server.to(room).emit('notificationStatusChanged', {
      notificationId,
      status
    });
  }

  // Method to send badge count update to a company
  sendBadgeCountUpdate(companyId: string, count: number) {
    const room = `company:${companyId}`;
    this.server.to(room).emit('badgeCountUpdated', { unreadCount: count });
    this.logger.log(`Updated badge count for company ${companyId}: ${count}`);
  }

  // Method to check if a company is online
  isCompanyOnline(companyId: string): boolean {
    for (const [, clientInfo] of this.connectedClients) {
      if (clientInfo.companyId === companyId) {
        return true;
      }
    }
    return false;
  }

  // Method to get connected clients count for a company
  getCompanyConnectionsCount(companyId: string): number {
    let count = 0;
    for (const [, clientInfo] of this.connectedClients) {
      if (clientInfo.companyId === companyId) {
        count++;
      }
    }
    return count;
  }
}