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

    const orgId = Number(organizationId);

    const batches = await prisma.batch.findMany({
      where: { organizationId: orgId },
      select: { id: true, batchname: true },
    });

    const completedBatches = [];
    const incompleteBatches = [];

    await Promise.all(
      batches.map(async (batch) => {
        const images = await prisma.imagecollections.findMany({
          where: {
            batchname: batch.batchname,           
          },
          select: {
            id: true,
            filename: true,
            image: true,
            organizationId: true,
            assigned: true,
            completed: true,
            imagestatus: true,
            qcimagestatus: true,
            userid: true,
          },
        });

        if (images.length === 0) return;

    const completedImages = images.filter(img => img.qcimagestatus === true);
    const incompleteImages = images.filter(img => !img.qcimagestatus);

    const batchData = {
      id: batch.id,
      batchname: batch.batchname,
      totalImages: images.length,
      submittedImagesCount: completedImages.length,
      pendingImagesCount: incompleteImages.length,
      imagecollection: images.map((img) => ({
              id: img.id,
              filename: img.filename.split('/').pop(),
              image: img.image,
            completed: img.completed ? JSON.parse(img.completed) : [],
            })),
    };

    if (incompleteImages.length === 0) {
      completedBatches.push(batchData);
    } else {
      incompleteBatches.push(batchData);
    }
    })
  );
    const completedBatchesCount = completedBatches.length;
    const incompleteBatchesCount= incompleteBatches.length;
    
    return NextResponse.json(
      {
        completedBatches,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
