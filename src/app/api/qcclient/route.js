import { PrismaClient } from '../../../generated/prisma';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const batches = await prisma.batch.findMany({
      where: {
        organizationId: Number(organizationId),
      },
      select: {
        id: true,
        batchname: true,
        organizationId: true,
      },
    });

    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        const images = await prisma.imagecollections.findMany({
          where: {
            batchname: batch.batchname,
            imagestatus: true,
          },
          select: {
            id: true,
            filename: true,
            image: true,
            organizationId: true,
            assigned: true,
            completed: true,
            imagestatus: true,
            userid: true,
          },
        });

        if (images.length === 0) return null;

        const imageFilenames = images.map(img => img.image.split('/').pop());

        const existingSubmissions = await prisma.qcFormSubmission.findMany({
          where: {
            image_name: {
              in: imageFilenames,
            },
          },
          select: {
            image_name: true,
          },
        });

        const existingSet = new Set(existingSubmissions.map(sub => sub.image_name));

        const allImagesExist = imageFilenames.every(name => existingSet.has(name));
        if (allImagesExist) return null;

        return {
          id: batch.id,
          batchname: batch.batchname,
          totalImages: imageFilenames.length,
          submittedImagesCount: existingSet.size,
          pendingImagesCount: imageFilenames.length - existingSet.size,
          imagecollection: images.map((img) => ({
            id: img.id,
            filename: img.filename.split('/').pop(), 
            image: img.image,
            extractedImageName: img.image.split('/').pop(), 
            organizationId: img.organizationId,
            assigned: img.assigned,
            completed: img.completed,
            imagestatus: img.imagestatus,
            userid: img.userid,
            isSubmitted: existingSet.has(img.image.split('/').pop()), 
          })),
        };
      })
    );

    const filteredBatches = enrichedBatches.filter(Boolean);

    return NextResponse.json(filteredBatches, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
