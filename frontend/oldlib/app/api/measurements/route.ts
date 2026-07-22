import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bodyMeasurements } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      userId,
      chestInches,
      waistInches,
      hipsInches,
      inseamInches,
      sleeveLengthInches,
      heightInches,
      recommendedSize,
      confidencePercent,
      rawLandmarks,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const [measurement] = await db.insert(bodyMeasurements).values({
      userId,
      chestInches,
      waistInches,
      hipsInches,
      inseamInches,
      sleeveLengthInches,
      heightInches,
      recommendedSize,
      confidencePercent,
      rawLandmarks,
    }).returning();

    return NextResponse.json({
      success: true,
      measurement,
    });
  } catch (error) {
    console.error('Error saving measurement:', error);
    return NextResponse.json(
      { error: 'Failed to save measurement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const measurements = await db.query.bodyMeasurements.findMany({
      where: (measurements, { eq }) => eq(measurements.userId, userId),
      orderBy: (measurements, { desc }) => [desc(measurements.createdAt)],
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}
