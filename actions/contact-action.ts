"use server";

import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import type { SearchParams } from "@/types/table";
import { authOptions } from "@/lib/auth-options";
import { ContactStatusChangeProps } from "@/types/contact";

function getWhereClause(params: SearchParams): Record<string, any> {
  const { search, status, startDate, endDate } = params;

  const statuses = Array.isArray(status)
    ? status.map(Number)
    : status
    ? [Number(status)]
    : [];

  // 날짜 필터링
  const dateFilter =
    startDate && endDate
      ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }
      : {};

  const where: Record<string, any> = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
              { message: { contains: search } },
              { user: { username: { contains: search } } },
              { user: { email: { contains: search } } },
            ],
          }
        : {},
      statuses.length > 0 ? { status: { in: statuses } } : {},
      dateFilter,
    ].filter((condition) => Object.keys(condition).length > 0),
  };

  return where;
}

export async function getContacts(params: SearchParams) {
  try {
    const { page = 1, limit = 10, sort = "id", order = "desc" } = params;
    const where = getWhereClause(params);

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sort]: order,
        },
      }),
    ]);

    return {
      contacts: contacts.map((contact) => ({
        ...contact,
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
        respondedAt: contact.respondedAt?.toISOString() || null,
      })),
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    throw new Error(
      `Failed to fetch contacts: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getContactDetail(id: number) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        admin: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    return {
      ...contact,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      respondedAt: contact.respondedAt?.toISOString() || null,
    };
  } catch (error) {
    console.error("Failed to fetch contact detail:", error);
    throw new Error(
      `Failed to fetch contact detail: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function updateContactStatus({
  id,
  status,
  response,
  responseType,
  memo,
}: ContactStatusChangeProps) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.contact.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === 2 && {
          adminId: Number(session.user.id),
          response,
          responseType,
          respondedAt: new Date(),
        }),
        ...(memo !== undefined && { memo }),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update contact status:", error);
    throw new Error(
      `Failed to update contact status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}