import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, type } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send email using Resend
    try {
      const data = await resend.emails.send({
        from: 'HarvestHub <onboarding@resend.dev>', // Use your verified domain later
        to: [to],
        subject: subject,
        html: html,
      });

      console.log('✅ Email sent successfully:', {
        to,
        subject,
        type,
        emailId: data.id,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        data: { to, subject, type, emailId: data.id }
      });
    } catch (emailError: any) {
      console.error('❌ Resend API Error:', emailError);
      
      // Log the notification even if email fails
      console.log('📧 Email Notification (failed to send):', {
        to,
        subject,
        type,
        error: emailError.message,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        message: 'Failed to send email',
        error: emailError.message,
        data: { to, subject, type }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error processing notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification', details: error.message },
      { status: 500 }
    );
  }
}
