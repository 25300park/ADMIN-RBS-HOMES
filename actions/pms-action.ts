"use server";

import prisma from "@/lib/prisma";
import type { SearchParams } from "@/types/table";

// ── 공통 직렬화 헬퍼 ─────────────────────────────────────────────

function serializeLease(lease: any) {
  return {
    ...lease,
    monthlyRent: Number(lease.monthlyRent),
    startDate: lease.startDate instanceof Date ? lease.startDate.toISOString() : lease.startDate,
    endDate: lease.endDate instanceof Date ? lease.endDate.toISOString() : lease.endDate,
    createdAt: lease.createdAt instanceof Date ? lease.createdAt.toISOString() : lease.createdAt,
    updatedAt: lease.updatedAt instanceof Date ? lease.updatedAt.toISOString() : lease.updatedAt,
    paymentSchedules: lease.paymentSchedules?.map(serializePayment),
    careRequests: lease.careRequests?.map(serializeCare),
  };
}

function serializePayment(p: any) {
  return {
    ...p,
    amountDue: Number(p.amountDue),
    dueDate: p.dueDate instanceof Date ? p.dueDate.toISOString() : p.dueDate,
    verifiedAt: p.verifiedAt instanceof Date ? p.verifiedAt.toISOString() : (p.verifiedAt ?? null),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

function serializeCare(c: any) {
  return {
    ...c,
    price: c.price !== null && c.price !== undefined ? Number(c.price) : null,
    preferredDate: c.preferredDate instanceof Date ? c.preferredDate.toISOString() : c.preferredDate,
    scheduledAt: c.scheduledAt instanceof Date ? c.scheduledAt.toISOString() : (c.scheduledAt ?? null),
    completedAt: c.completedAt instanceof Date ? c.completedAt.toISOString() : (c.completedAt ?? null),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  };
}

// ── Lease Actions ────────────────────────────────────────────────

export async function getLeases(params: SearchParams & { status?: string }) {
  const { page = 1, limit = 15, sort = "id", order = "desc", search, status } = params;

  const statuses = Array.isArray(status)
    ? status
    : status
    ? [status]
    : [];

  const where: any = {
    AND: [
      search
        ? {
            OR: [
              { unit: { title: { contains: search } } },
              { landlord: { name: { contains: search } } },
              { tenant: { name: { contains: search } } },
            ],
          }
        : {},
      statuses.length > 0 ? { status: { in: statuses } } : {},
    ].filter((c) => Object.keys(c).length > 0),
  };

  const [total, leases] = await Promise.all([
    prisma.leaseContract.count({ where }),
    prisma.leaseContract.findMany({
      where,
      include: {
        unit: { select: { id: true, title: true, fullAddress: true } },
        landlord: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    }),
  ]);

  return { leases: leases.map(serializeLease), total, page, limit };
}

export async function getLeaseDetail(id: number) {
  const lease = await prisma.leaseContract.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, title: true, fullAddress: true } },
      condo: { select: { id: true, condoName: true } },
      landlord: { select: { id: true, name: true, email: true, phone: true } },
      tenant: { select: { id: true, name: true, email: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      paymentSchedules: { orderBy: { dueDate: "asc" } },
      careRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lease) throw new Error("Lease not found");
  return serializeLease(lease);
}

export async function updateLeaseStatus({ id, status }: { id: number; status: string }) {
  await prisma.leaseContract.update({ where: { id }, data: { status: status as any } });
  return { success: true };
}

// ── Payment Actions ──────────────────────────────────────────────

export async function getPayments(
  params: SearchParams & { status?: string; month?: string }
) {
  const { page = 1, limit = 15, sort = "dueDate", order = "desc", status, month } = params;

  const statuses = Array.isArray(status) ? status : status ? [status] : [];

  let dateFilter: any = {};
  if (month) {
    const [y, m] = month.split("-").map(Number);
    dateFilter = {
      dueDate: {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      },
    };
  }

  const where: any = {
    AND: [
      statuses.length > 0 ? { status: { in: statuses } } : {},
      dateFilter,
    ].filter((c) => Object.keys(c).length > 0),
  };

  const [total, payments] = await Promise.all([
    prisma.paymentSchedule.count({ where }),
    prisma.paymentSchedule.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            monthlyRent: true,
            unit: { select: { title: true, fullAddress: true } },
            tenant: { select: { id: true, name: true, email: true } },
          },
        },
        verifiedBy: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    }),
  ]);

  return { payments: payments.map(serializePayment), total, page, limit };
}

export async function verifyPayment({
  id,
  verifiedById,
}: {
  id: number;
  verifiedById: number;
}) {
  await prisma.paymentSchedule.update({
    where: { id },
    data: { status: "PAID", verifiedAt: new Date(), verifiedById },
  });
  return { success: true };
}

// ── Care Actions ─────────────────────────────────────────────────

export async function getCareRequests(
  params: SearchParams & { serviceType?: string; status?: string }
) {
  const { page = 1, limit = 15, sort = "id", order = "desc", serviceType, status } = params;

  const serviceTypes = Array.isArray(serviceType) ? serviceType : serviceType ? [serviceType] : [];
  const statuses = Array.isArray(status) ? status : status ? [status] : [];

  const where: any = {
    AND: [
      serviceTypes.length > 0 ? { serviceType: { in: serviceTypes } } : {},
      statuses.length > 0 ? { status: { in: statuses } } : {},
    ].filter((c) => Object.keys(c).length > 0),
  };

  const [total, careRequests] = await Promise.all([
    prisma.careServiceRequest.count({ where }),
    prisma.careServiceRequest.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            unit: { select: { title: true, fullAddress: true } },
            tenant: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    }),
  ]);

  return { careRequests: careRequests.map(serializeCare), total, page, limit };
}

export async function updateCareRequest({
  id,
  status,
  scheduledAt,
  assignedTo,
  completedAt,
  price,
}: {
  id: number;
  status?: string;
  scheduledAt?: string;
  assignedTo?: string;
  completedAt?: string;
  price?: number;
}) {
  await prisma.careServiceRequest.update({
    where: { id },
    data: {
      ...(status !== undefined && { status: status as any }),
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(completedAt !== undefined && { completedAt: new Date(completedAt) }),
      ...(price !== undefined && { price }),
    },
  });
  return { success: true };
}

// ── Community Actions ─────────────────────────────────────────────

export async function getCommunityPosts(
  params: SearchParams & { condoId?: number }
) {
  const { page = 1, limit = 20, sort = "createdAt", order = "desc", condoId } = params;

  const where: any = condoId ? { condoId } : {};

  const [total, posts] = await Promise.all([
    prisma.communityPost.count({ where }),
    prisma.communityPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        condo: { select: { id: true, condoName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isNotice: "desc" }, { [sort]: order }],
    }),
  ]);

  return {
    posts: posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  };
}

export async function createCommunityPost(data: {
  condoId: number;
  authorId: number;
  title: string;
  body: string;
  isNotice: boolean;
}) {
  const post = await prisma.communityPost.create({ data });
  return { post: { ...post, createdAt: post.createdAt.toISOString() } };
}

export async function deleteCommunityPost(id: number) {
  await prisma.communityPost.delete({ where: { id } });
  return { success: true };
}

export async function getCondoList() {
  const condos = await prisma.condoMaster.findMany({
    select: { id: true, condoName: true },
    orderBy: { condoName: "asc" },
  });
  return condos;
}
