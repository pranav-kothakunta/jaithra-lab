import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // For now, just acknowledge the email setup
    // In production, this would store in database
    console.log(`Admin email set to: ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Admin email linked successfully',
      email,
    });
  } catch (error: any) {
    console.error('Setup admin email error:', error);
    return NextResponse.json({ error: 'Failed to setup admin email' }, { status: 500 });
  }
}
