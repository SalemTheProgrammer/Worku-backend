import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { generateAnalysisResultsTemplate } from '../email-templates/analysis-results.template';
import { generateApplicationConfirmationTemplate } from '../email-templates/application-confirmation.template';
import { InvitationEmailData } from './interfaces/invitation-email.interface';
import { generateInterviewConfirmationEmail } from '../email-templates/interview-confirmation.template';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

interface AnalysisEmailData {
  jobTitle: string;
  companyName: string;
  score: number;
  pointsForts: string[];
  pointsAmélioration: string[];
}

@Injectable()
export class EmailService {
  private transporter: any;
  private readonly logger = new Logger(EmailService.name);
  private readonly isEmailEnabled: boolean;
  private readonly emailConfig: EmailConfig | undefined;

  constructor(
    private configService: ConfigService
  ) {
    const config = this.configService.get<EmailConfig>('email');
    this.emailConfig = config;
    this.isEmailEnabled = !!config?.host;

    if (this.isEmailEnabled && config) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: false,
        auth: {
          user: config.user,
          pass: config.password,
        },
      });
    } else {
      this.logger.warn('Email service is disabled - no SMTP configuration found');
    }
  }

  async sendApplicationConfirmation(email: string, applicationDetails: {
    jobTitle: string;
    companyName: string;
  }): Promise<void> {
    const subject = 'Confirmation de votre candidature';
    const html = generateApplicationConfirmationTemplate(applicationDetails);
    await this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.isEmailEnabled) {
      this.logger.log(`[Email Disabled] Would send email to ${to} with subject: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.emailConfig?.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      // Don't throw the error - we don't want email failures to affect the application process
    }
  }

  async sendInvitationEmail(
    to: string,
    invitationData: {
      userName: string;
      userEmail: string;
      companyName: string;
      companyLogo?: string;
      loginUrl: string;
    }
  ): Promise<void> {
    try {
      // Read the invitation template from src directory
      const templatePath = path.join(process.cwd(), 'src/email-templates/invite-user.template.html');
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);

      // Prepare template data
      const templateData = {
        ...invitationData,
        platformLogo: 'https://your-platform-logo-url.com/logo.png',
        currentYear: new Date().getFullYear()
      };

      // Generate HTML content
      const html = template(templateData);

      // Send the email
      await this.sendEmail(
        to,
        'Invitation à rejoindre une entreprise sur Worku',
        html
      );

      this.logger.log(`Invitation email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${to}: ${error.message}`);
      throw new HttpException(
        'Failed to send invitation email',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendInterviewConfirmation(
    to: string,
    data: {
      candidateName: string;
      companyName: string;
      jobTitle: string;
      date: string;
      time: string;
      type: string;
      location?: string;
      meetingLink?: string;
      notes?: string;
      confirmationLink: string;
    }
  ): Promise<void> {
    try {
      const html = generateInterviewConfirmationEmail(data);
      await this.sendEmail(
        to,
        'Interview Invitation',
        html
      );
      this.logger.log(`Interview confirmation email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send interview confirmation email: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to send interview confirmation email',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendAnalysisResults(
    email: string,
    analysisData: AnalysisEmailData
  ): Promise<void> {
    try {
      const emailHtml = generateAnalysisResultsTemplate(analysisData);
      await this.sendEmail(
        email,
        'Résultats de l\'analyse de votre candidature',
        emailHtml
      );
    } catch (error) {
      this.logger.error(`Failed to send analysis results email: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to send analysis results email',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}