import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  // 邮件发送器实例
  transporter: Transporter;

  constructor() {
    // 创建邮件发送器，配置 SMTP 服务器信息
    this.transporter = createTransport({
      host: 'smtp.qq.com', // QQ 邮箱 SMTP 服务器地址
      port: 587, // SMTP 端口
      secure: false, // 使用 TLS
      auth: {
        user: process.env.EMAIL_USER, // 从环境变量中获取发件人邮箱
        pass: process.env.EMAIL_PASS, // 从环境变量中获取邮箱授权码
      },
    });
  }

  // 发送邮件的方法
  async sendMail({ to, subject, html }) {
    // 使用 transporter 发送邮件
    await this.transporter.sendMail({
      from: {
        name: '聊天室', // 发件人名称
        address: process.env.EMAIL_USER, // 从环境变量中获取发件人邮箱
      },
      to, // 收件人邮箱
      subject, // 邮件主题
      html, // 邮件 HTML 内容
    });
  }
}
