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

    const parsedOrgId = Number(organizationId);

    // Step 1: Get all active batches
    const batches = await prisma.batch.findMany({
      where: { organizationId: parsedOrgId },
      select: { batchname: true },
      distinct: ['batchname'],
    });

    const totalbatch = batches.length;
    let finishedbatchcount = 0;

    // Step 2 & 3: Check images and qcimagestatus per batch
    for (const { batchname } of batches) {
      const images = await prisma.imagecollections.findMany({
        where: {
          batchname,
          organizationId: parsedOrgId,
        },
        select: {
          qcimagestatus: true,
        },
      });

      if (images.length === 0) continue;

      const allQcPassed = images.every(img => img.qcimagestatus === true);
      if (allQcPassed) {
        finishedbatchcount++;
      }
    }

    // Step 4: Calculate pending
    const pendingbatchescount = totalbatch - finishedbatchcount;

    // Total template count
    const totaltemplate = await prisma.template.count({
      where: {
        organizationId: parsedOrgId,
        isDelete: false,
      },
    });

    // Monthly Chart Data
    const rawChartData = await prisma.$queryRaw`
      SELECT
        EXTRACT(YEAR FROM "updatedat")::INT AS year,
        TO_CHAR("updatedat", 'Mon') AS month,
        EXTRACT(MONTH FROM "updatedat")::INT AS month_num,
        COUNT(*) FILTER (WHERE "imagestatus" = true) AS finished,
        COUNT(*) FILTER (WHERE "imagestatus" = false OR "imagestatus" IS NULL) AS pending
      FROM imagecollections
      WHERE "organizationId" = ${parsedOrgId}
      GROUP BY year, month, month_num
      ORDER BY year, month_num;
    `;

    // Format chart data
    const staticData = {};
    for (const row of rawChartData) {
      const { year, month, finished, pending } = row;
      if (!staticData[year]) staticData[year] = [];
      staticData[year].push({
        name: month,
        finished: Number(finished),
        pending: Number(pending),
      });
    }

    // Ensure months are ordered
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (const year in staticData) {
      staticData[year].sort(
        (a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name)
      );
    }

    // Final Response
    return NextResponse.json(
      {
        totalbatch,
        finishedbatchcount,
        pendingbatchescount,
        totaltemplate,
        chart: staticData,
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
