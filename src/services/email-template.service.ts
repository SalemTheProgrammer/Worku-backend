import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateService {
  constructor(private configService: ConfigService) {}

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(process.cwd(), 'src', 'email-templates', `${templateName}.template.html`);
    return fs.promises.readFile(templatePath, 'utf8');
  }

  async generateInviteUserEmail(params: {
    platformLogo: string;
    companyName: string;
    companyLogo?: string;
    userName: string;
    userEmail: string;
    loginUrl: string;
  }): Promise<string> {
    const template = await this.loadTemplate('invite-user');
    const compiledTemplate = Handlebars.compile(template);

    return compiledTemplate({
      ...params,
      currentYear: new Date().getFullYear(),
      platformLogo: this.configService.get('platform.logoUrl'),
      loginUrl: this.configService.get('platform.url') + '/login'
    });
  }
}