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

    // Step 1: Get all active template IDs
    const activeTemplates = await prisma.template.findMany({
      where: {
        isActive: true,
        isDelete: false,
        organizationId: orgId,
      },
      select: {
        id: true,
      },
    });

    const activeTemplateIds = activeTemplates.map(t => String(t.id)); // convert to string to match level column
console.log(activeTemplateIds,"active templateid")
    // Step 2: Get all batches for the org
    const batches = await prisma.batch.findMany({
      where: {
        organizationId: orgId,
      },
      select: {
        id: true,
        batchname: true,
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

        const imageNames = images.map(img => img.image.split('/').pop());

        // Step 3: Get QC submissions for these images and batch
        const submissions = await prisma.qcFormSubmission.findMany({
          where: {
            image_name: { in: imageNames },
            batch_name: batch.batchname,
            organizationid: orgId,
            isactive: true,
          },
          select: {
            image_name: true,
            level: true,
          },
        });

        // Group levels per image
        const imageToLevelsMap = {};
        submissions.forEach(sub => {
          const img = sub.image_name;
          if (!imageToLevelsMap[img]) imageToLevelsMap[img] = new Set();
          imageToLevelsMap[img].add(sub.level);
        });

        // Step 4: Filter images that have *all* active template levels submitted
        const filteredImages = images.filter(img => {
          const imgName = img.image.split('/').pop();
          const submittedLevels = imageToLevelsMap[imgName];
          if (!submittedLevels) return true; // not submitted at all → include
          const submittedLevelArray = Array.from(submittedLevels);
          return !activeTemplateIds.every(id => submittedLevelArray.includes(id)); // if all levels exist → exclude
        });

        if (filteredImages.length === 0) return null;

        return {
          id: batch.id,
          batchname: batch.batchname,
          totalImages: images.length,
          submittedImagesCount: images.length - filteredImages.length,
          pendingImagesCount: filteredImages.length,
          imagecollection: filteredImages.map(img => {
            const imgName = img.image.split('/').pop();
            return {
              id: img.id,
              filename: img.filename.split('/').pop(),
              image: img.image,
              extractedImageName: imgName,
              organizationId: img.organizationId,
              assigned: img.assigned,
              completed: img.completed,
              imagestatus: img.imagestatus,
              userid: img.userid,
              isSubmitted: imageToLevelsMap[imgName]?.size === activeTemplateIds.length
            };
          }),
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
