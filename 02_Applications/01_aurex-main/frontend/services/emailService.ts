import emailjs from '@emailjs/browser';

// Email configuration from environment variables
const EMAIL_CONFIG = {
  // EmailJS Configuration
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'mandrill_service',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT || 'template_contact',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',

  // Mandrill Direct Configuration
  mandrillApiKey: import.meta.env.VITE_MANDRILL_API_KEY || '',

  // Email Settings
  fromEmail: import.meta.env.VITE_FROM_EMAIL || 'aurigraphaurex@instor.in',
  fromName: import.meta.env.VITE_FROM_NAME || 'Aurigraph Aurex',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'helpdesk@aurigraph.io',
  additionalEmails: ['helpdesk@aurigraph.io', 'yogesh@aurigraph.io'],
};

export interface EmailData {
  to_email: string;
  to_name: string;
  from_name?: string;
  from_email?: string;
  subject: string;
  message: string;
  reply_to?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  platform?: string;
}

// Initialize EmailJS
export const initializeEmailJS = () => {
  if (EMAIL_CONFIG.publicKey && EMAIL_CONFIG.publicKey !== 'your_emailjs_public_key_here') {
    emailjs.init(EMAIL_CONFIG.publicKey);
  }
};

// Direct Mandrill email sending function
const sendDirectMandrill = async (emailData: {
  to: string[];
  subject: string;
  html: string;
  from_email?: string;
  from_name?: string;
}): Promise<boolean> => {
  try {
    if (!EMAIL_CONFIG.mandrillApiKey) {
      console.warn('Mandrill API key not configured');
      return false;
    }

    const recipients = emailData.to.map(email => ({
      email: email.trim(),
      name: email === 'yogesh@aurigraph.io' ? 'Yogesh Dandawate' : 'Aurigraph Support',
      type: 'to'
    }));

    console.log('Sending email to recipients:', recipients);

    const mandrillMessage = {
      key: EMAIL_CONFIG.mandrillApiKey,
      message: {
        html: emailData.html,
        subject: emailData.subject,
        from_email: emailData.from_email || EMAIL_CONFIG.fromEmail,
        from_name: emailData.from_name || EMAIL_CONFIG.fromName,
        to: recipients,
        headers: {
          'Reply-To': emailData.from_email || EMAIL_CONFIG.fromEmail
        },
        track_opens: true,
        track_clicks: true,
        auto_text: true,
        preserve_recipients: true,  // Changed to true to ensure both recipients get the email
        merge: true,
        merge_language: 'mailchimp'
      }
    };

    const response = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify(mandrillMessage)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mandrill API error: ${response.status} - ${errorText}`);
      throw new Error(`Mandrill API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Mandrill response:', result);

    // Check if any email was sent successfully
    if (Array.isArray(result)) {
      const successCount = result.filter((msg: any) => msg.status === 'sent' || msg.status === 'queued').length;
      const rejectedEmails = result.filter((msg: any) => msg.status === 'rejected' || msg.status === 'invalid');

      console.log(`Mandrill: ${successCount} emails sent successfully`);
      if (rejectedEmails.length > 0) {
        console.warn('Mandrill rejected emails:', rejectedEmails);
      }

      // Log individual email statuses
      result.forEach((msg: any, index: number) => {
        console.log(`Email ${index + 1} (${msg.email}): ${msg.status}${msg.reject_reason ? ` - ${msg.reject_reason}` : ''}`);
      });

      return successCount > 0;
    }

    return false;
  } catch (error) {
    console.error('Direct Mandrill send error:', error);
    return false;
  }
};

// Send contact form email
export const sendContactEmail = async (formData: ContactFormData): Promise<boolean> => {
  try {
    // Try direct Mandrill first if API key is available
    if (EMAIL_CONFIG.mandrillApiKey) {
      console.log('Attempting direct Mandrill send...');
      const success = await sendContactViaMandrill(formData);
      if (success) {
        console.log('Email sent successfully via direct Mandrill');

        // Also send a backup email specifically to yogesh@aurigraph.io
        console.log('Sending backup email to yogesh@aurigraph.io...');
        await sendBackupEmailToYogesh(formData);

        return true;
      }
      console.warn('Direct Mandrill failed, trying EmailJS...');
    }

    // Try EmailJS if properly configured
    if (EMAIL_CONFIG.publicKey &&
        EMAIL_CONFIG.publicKey !== 'your_emailjs_public_key_here' &&
        EMAIL_CONFIG.publicKey !== 'your_actual_emailjs_public_key_here') {
      console.log('Attempting EmailJS send...');
      const success = await sendContactViaEmailJS(formData);
      if (success) {
        console.log('Email sent successfully via EmailJS');
        return true;
      }
      console.warn('EmailJS failed, trying alternative...');
    }

    // If both methods fail, try a simple fetch-based approach
    console.warn('Both Mandrill and EmailJS failed, trying alternative method...');
    const alternativeSuccess = await sendContactViaAlternative(formData);

    // Also try to send a notification via webhook as final backup
    if (alternativeSuccess) {
      try {
        await sendWebhookNotification(formData);
      } catch (error) {
        console.warn('Webhook notification failed:', error);
      }
    }

    return alternativeSuccess;
  } catch (error) {
    console.error('Error in sendContactEmail:', error);
    return false;
  }
};

// Send separate email to yogesh@aurigraph.io as backup
const sendBackupEmailToYogesh = async (formData: ContactFormData): Promise<boolean> => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #16a34a; border-radius: 8px; padding: 20px;">
        <h2 style="color: #16a34a; text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
          🌱 BACKUP COPY - Consultation Request
        </h2>

        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #374151; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${formData.name}</p>
          <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
          <p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
          <p><strong>Platform Interest:</strong> ${formData.platform || 'General Inquiry'}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #374151; margin-top: 0;">Subject</h3>
          <p style="font-weight: bold;">${formData.subject}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="color: #374151; margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${formData.message}</p>
        </div>

        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Backup copy sent to ensure delivery • ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `;

    return sendDirectMandrill({
      to: ['yogesh@aurigraph.io'],
      subject: `[BACKUP] Consultation Request: ${formData.subject}`,
      html: htmlContent,
      from_email: formData.email,
      from_name: formData.name
    });
  } catch (error) {
    console.error('Error sending backup email to Yogesh:', error);
    return false;
  }
};

// Send contact email via direct Mandrill
const sendContactViaMandrill = async (formData: ContactFormData): Promise<boolean> => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
        New Consultation Request
      </h2>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Contact Information</h3>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
        <p><strong>Company:</strong> ${formData.company || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
        <p><strong>Platform Interest:</strong> ${formData.platform || 'General Inquiry'}</p>
      </div>

      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Subject</h3>
        <p style="font-weight: bold; color: #1f2937;">${formData.subject}</p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Message</h3>
        <p style="white-space: pre-wrap; line-height: 1.6;">${formData.message}</p>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Submitted:</strong> ${new Date().toLocaleString()}<br>
          <strong>Source:</strong> Aurex Platform Consultation Form
        </p>
      </div>
    </div>
  `;

  return sendDirectMandrill({
    to: EMAIL_CONFIG.additionalEmails,
    subject: `Consultation Request: ${formData.subject}`,
    html: htmlContent,
    from_email: formData.email,
    from_name: formData.name
  });
};

// Send contact email via EmailJS
const sendContactViaEmailJS = async (formData: ContactFormData): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: EMAIL_CONFIG.additionalEmails.join(','),
      to_name: 'Aurigraph Support Team',
      from_name: formData.name,
      from_email: formData.email,
      reply_to: formData.email,
      subject: formData.subject,
      message: formData.message,
      company: formData.company || 'Not provided',
      phone: formData.phone || 'Not provided',
      platform: formData.platform || 'General Inquiry',
      timestamp: new Date().toLocaleString(),
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      templateParams
    );

    return response.status === 200;
  } catch (error) {
    console.error('EmailJS send error:', error);
    return false;
  }
};

// Alternative email method using FormSubmit service
const sendContactViaAlternative = async (formData: ContactFormData): Promise<boolean> => {
  try {
    // Use FormSubmit.co as a reliable form-to-email service
    const formData_encoded = new FormData();
    formData_encoded.append('name', formData.name);
    formData_encoded.append('email', formData.email);
    formData_encoded.append('company', formData.company || 'Not provided');
    formData_encoded.append('phone', formData.phone || 'Not provided');
    formData_encoded.append('platform', formData.platform || 'General Inquiry');
    formData_encoded.append('subject', formData.subject);
    formData_encoded.append('message', formData.message);
    formData_encoded.append('_subject', `Consultation Request: ${formData.subject}`);
    formData_encoded.append('_cc', 'yogesh@aurigraph.io');  // Ensure yogesh gets a copy
    formData_encoded.append('_template', 'table');
    formData_encoded.append('_captcha', 'false');
    formData_encoded.append('_next', 'https://aurigraph.io/thank-you');  // Optional: redirect after submission

    console.log('Sending via FormSubmit to helpdesk@aurigraph.io with CC to yogesh@aurigraph.io');

    const response = await fetch('https://formsubmit.co/helpdesk@aurigraph.io', {
      method: 'POST',
      body: formData_encoded
    });

    if (response.ok) {
      console.log('Email sent successfully via FormSubmit');
      return true;
    } else {
      console.error('FormSubmit error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Alternative email method error:', error);
    return false;
  }
};

// Send webhook notification as additional backup
const sendWebhookNotification = async (formData: ContactFormData): Promise<boolean> => {
  try {
    // Send to a webhook service like Discord, Slack, or custom endpoint
    const webhookData = {
      text: `🚨 New Consultation Request - BACKUP NOTIFICATION\n\n` +
            `**Name:** ${formData.name}\n` +
            `**Email:** ${formData.email}\n` +
            `**Company:** ${formData.company || 'Not provided'}\n` +
            `**Phone:** ${formData.phone || 'Not provided'}\n` +
            `**Platform:** ${formData.platform || 'General Inquiry'}\n` +
            `**Subject:** ${formData.subject}\n\n` +
            `**Message:**\n${formData.message}\n\n` +
            `**Time:** ${new Date().toLocaleString()}\n` +
            `**Source:** Aurex Platform\n\n` +
            `⚠️ Please ensure yogesh@aurigraph.io received this consultation request!`,
      username: 'Aurex Platform',
      avatar_url: 'https://aurigraph.io/favicon.ico'
    };

    // You can replace this with your actual webhook URL (Discord, Slack, etc.)
    // For now, we'll just log it
    console.log('Webhook notification data:', webhookData);

    // Example Discord webhook (replace with your actual webhook URL):
    // const response = await fetch('YOUR_DISCORD_WEBHOOK_URL', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(webhookData)
    // });
    // return response.ok;

    return true; // Return true for now since we're just logging
  } catch (error) {
    console.error('Webhook notification error:', error);
    return false;
  }
};

// Fallback email method using mailto or direct submission
const sendEmailFallback = async (formData: ContactFormData): Promise<boolean> => {
  try {
    // Create a formatted email body
    const emailBody = `
New Consultation Request

Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company || 'Not provided'}
Phone: ${formData.phone || 'Not provided'}
Platform: ${formData.platform || 'General Inquiry'}
Subject: ${formData.subject}

Message:
${formData.message}

Submitted: ${new Date().toLocaleString()}
    `.trim();

    // Create mailto link for both recipients
    const recipients = EMAIL_CONFIG.additionalEmails.join(',');
    const subject = encodeURIComponent(`Consultation Request: ${formData.subject}`);
    const body = encodeURIComponent(emailBody);

    const mailtoLink = `mailto:${recipients}?subject=${subject}&body=${body}`;

    // Open mailto link
    window.open(mailtoLink, '_blank');

    // Return true as we've opened the email client
    return true;
  } catch (error) {
    console.error('Error with fallback email method:', error);
    return false;
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (userData: {
  name: string;
  email: string;
  platform: string;
}): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: userData.email,
      to_name: userData.name,
      from_name: EMAIL_CONFIG.fromName,
      from_email: EMAIL_CONFIG.fromEmail,
      subject: `Welcome to ${userData.platform} - Your Sustainability Journey Begins`,
      platform: userData.platform,
      support_email: EMAIL_CONFIG.supportEmail,
      timestamp: new Date().toLocaleString(),
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      'template_welcome', // You'll need to create this template
      templateParams
    );

    return response.status === 200;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

// Send assessment completion email
export const sendAssessmentCompleteEmail = async (assessmentData: {
  name: string;
  email: string;
  score: string;
  recommendations: string[];
}): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: assessmentData.email,
      to_name: assessmentData.name,
      from_name: EMAIL_CONFIG.fromName,
      from_email: EMAIL_CONFIG.fromEmail,
      subject: 'Your ESG Assessment Results - Aurigraph Aurex',
      esg_score: assessmentData.score,
      recommendations: assessmentData.recommendations.join('\n• '),
      support_email: EMAIL_CONFIG.supportEmail,
      timestamp: new Date().toLocaleString(),
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      'template_assessment', // You'll need to create this template
      templateParams
    );

    return response.status === 200;
  } catch (error) {
    console.error('Error sending assessment email:', error);
    return false;
  }
};

// Send demo request email
export const sendDemoRequestEmail = async (demoData: {
  name: string;
  email: string;
  company: string;
  platform: string;
  preferredDate?: string;
  message?: string;
}): Promise<boolean> => {
  try {
    // Check if EmailJS is properly configured
    if (!EMAIL_CONFIG.publicKey || EMAIL_CONFIG.publicKey === 'your_emailjs_public_key_here') {
      console.warn('EmailJS not configured, using fallback method for demo request');
      return sendDemoEmailFallback(demoData);
    }

    const templateParams = {
      to_email: EMAIL_CONFIG.additionalEmails.join(','), // Send to both emails
      to_name: 'Aurigraph Sales Team',
      from_name: demoData.name,
      from_email: demoData.email,
      reply_to: demoData.email,
      subject: `Demo Request for ${demoData.platform}`,
      company: demoData.company,
      platform: demoData.platform,
      preferred_date: demoData.preferredDate || 'Not specified',
      message: demoData.message || 'No additional message',
      timestamp: new Date().toLocaleString(),
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      'template_demo', // You'll need to create this template
      templateParams
    );

    return response.status === 200;
  } catch (error) {
    console.error('Error sending demo request email via EmailJS:', error);
    // Fallback to alternative method
    return sendDemoEmailFallback(demoData);
  }
};

// Fallback demo email method
const sendDemoEmailFallback = async (demoData: {
  name: string;
  email: string;
  company: string;
  platform: string;
  preferredDate?: string;
  message?: string;
}): Promise<boolean> => {
  try {
    // Create a formatted email body
    const emailBody = `
New Demo Request

Name: ${demoData.name}
Email: ${demoData.email}
Company: ${demoData.company}
Platform: ${demoData.platform}
Preferred Date: ${demoData.preferredDate || 'Not specified'}

Message:
${demoData.message || 'No additional message'}

Submitted: ${new Date().toLocaleString()}
    `.trim();

    // Create mailto link for both recipients
    const recipients = EMAIL_CONFIG.additionalEmails.join(',');
    const subject = encodeURIComponent(`Demo Request for ${demoData.platform}`);
    const body = encodeURIComponent(emailBody);

    const mailtoLink = `mailto:${recipients}?subject=${subject}&body=${body}`;

    // Open mailto link
    window.open(mailtoLink, '_blank');

    // Return true as we've opened the email client
    return true;
  } catch (error) {
    console.error('Error with fallback demo email method:', error);
    return false;
  }
};



export default {
  initializeEmailJS,
  sendContactEmail,
  sendWelcomeEmail,
  sendAssessmentCompleteEmail,
  sendDemoRequestEmail,
};
