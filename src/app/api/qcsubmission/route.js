import { PrismaClient } from '../../../generated/prisma';
import { logUserAction } from '../services/logservice';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');
    const role = request.headers.get('x-role');

    if (!organizationId || !userId || !role) {
      return new Response(
        JSON.stringify({ error: 'Required headers missing (x-organization-id, x-user-id, x-role)' }, null, 2),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const parsedOrganizationId = parseInt(organizationId, 10);
    if (isNaN(parsedOrganizationId)) {
      return new Response(
        JSON.stringify({ error: 'Organization ID must be a valid integer' }, null, 2),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { image_name, batch_name, level, user_id, fields } = body;

    if (
      !image_name ||
      !batch_name ||
      !level ||
      !user_id ||
      !fields ||
      typeof fields !== 'object'
    ) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid fields in request body' }, null, 2),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const levelString = level;
    const fieldEntries = Object.entries(fields);

    for (const [field_name, field_value] of fieldEntries) {
      await prisma.qcFormSubmission.updateMany({
        where: {
          field_name,
          batch_name,
          image_name,
          level: levelString,
          userid: user_id,
          organizationid: parsedOrganizationId,
          isactive: true,
        },
        data: {
          isactive: false,
        },
      });

      await prisma.qcFormSubmission.create({
        data: {
          image_name,
          batch_name,
          level: levelString,
          userid: user_id,
          field_name,
          field_value,
          organizationid: parsedOrganizationId,
          isactive: true,
        },
      });
    }

    await logUserAction({
      userid: userId,
      organizationid: parsedOrganizationId,
      role,
      action: `Submitted QC form for image '${image_name}' in batch '${batch_name}' at level ${levelString}, updated ${fieldEntries.length} field(s)`,
    });

    const images = await prisma.imagecollections.findMany({
      where: {
        batchname: batch_name,
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

    const combinedImagePath = `${batch_name}/${image_name}`;
    const filteredImage = images.find((img) => {
      const imagePath = img.image.replace(/^\/uploads\//, '');
      return imagePath === combinedImagePath;
    });

    const activeTemplates = await prisma.template.findMany({
      where: {
        isActive: true,
        isDelete: false,
        organizationId: parsedOrganizationId,
      },
      select: {
        id: true,
      },
    });

    const templateIds = activeTemplates.map(template => template.id);

    const qcSubmissions = await prisma.qcFormSubmission.findMany({
      where: {
        batch_name,
        image_name,
        organizationid: parsedOrganizationId,
        isactive: true,
      },
      select: {
        level: true,
      },
    });

    const levels = [...new Set(qcSubmissions.map(submission => parseInt(submission.level, 10)))];
    const allTemplatesPresent = templateIds.every(templateId => levels.includes(templateId));

    await prisma.imagecollections.updateMany({
      where: {
        batchname: batch_name,
        image: `/uploads/${batch_name}/${image_name}`,
      },
      data: {
        qcimagestatus: allTemplatesPresent, // true or false
      },
    });

    return new Response(
      JSON.stringify({ message: 'QC form submission updated successfully' }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in QC form submission:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
