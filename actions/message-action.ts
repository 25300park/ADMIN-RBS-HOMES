'use server'

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { revalidatePath } from "next/cache";
import { sendEmail, getMessageEmailTemplate } from "@/lib/email";

// ==================== 메시지 템플릿 관련 ====================

/**
 * 메시지 템플릿 생성
 */
export async function createMessageTemplate(data: {
  name: string;
  title: string;
  content: string;
  description?: string;
  type?: number;
}) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await prisma.messageTemplate.create({
      data: {
        name: data.name,
        title: data.title,
        content: data.content,
        description: data.description,
        type: data.type || 0,
        createdBy: parseInt(session.user.id),
      },
    });

    revalidatePath("/messages/templates");

    return { success: true, template };
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 메시지 템플릿 목록 조회
 */
export async function getMessageTemplates() {
  try {
    const templates = await prisma.messageTemplate.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        type: true,
        content: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, templates };
  } catch (error) {
    console.error("Error fetching templates:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 메시지 템플릿 삭제 (소프트 삭제)
 */
export async function deleteMessageTemplate(id: number) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // 템플릿이 존재하는지 확인
    const template = await prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    // 소프트 삭제 (isActive를 false로 변경)
    await prisma.messageTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/messages/templates");

    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 메시지 템플릿 업데이트
 */
export async function updateMessageTemplate(
  id: number,
  data: {
    name?: string;
    title?: string;
    content?: string;
    description?: string;
    type?: number;
  }
) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // 템플릿이 존재하는지 확인
    const template = await prisma.messageTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template not found" };
    }

    const updatedTemplate = await prisma.messageTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/messages/templates");

    return { success: true, template: updatedTemplate };
  } catch (error) {
    console.error("Error updating template:", error);
    return { success: false, error: String(error) };
  }
}

// ==================== 메시지 그룹 관련 ====================

/**
 * 메시지 그룹 생성
 */
export async function createMessageGroup(data: {
  name: string;
  description?: string;
  memberIds: number[];
}) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    const group = await prisma.messageGroup.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: userId,
        members: {
          createMany: {
            data: [
              // 생성자 자동 추가
              { userId },
              // 선택된 멤버들 추가
              ...data.memberIds.map(id => ({ userId: id })),
            ],
            skipDuplicates: true,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return { success: true, group };
  } catch (error) {
    console.error("Error creating group:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 사용자의 메시지 그룹 목록 조회
 */
export async function getUserMessageGroups() {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    const groups = await prisma.messageGroup.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, groups };
  } catch (error) {
    console.error("Error fetching groups:", error);
    return { success: false, error: String(error) };
  }
}

// ==================== 메시지 관련 ====================

/**
 * 1:1 메시지 발송 (type=4일 때 이메일도 함께 전송)
 */
export async function sendDirectMessage(data: {
  recipientId: number;
  title: string;
  content: string;
  type?: number; // 0: 일반, 4: 이메일 포함
  unitId?: number;
  priority?: number;
  templateId?: number;
}) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const senderId = parseInt(session.user.id);
    const messageType = data.type || 0;
    const shouldSendEmail = messageType === 4; // type=4일 때만 이메일 발송

    // 메시지 생성
    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId: data.recipientId,
        title: data.title,
        content: data.content,
        type: messageType,
        unitId: data.unitId,
        priority: data.priority || 0,
        templateId: data.templateId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 수신자에게 알림 생성
    await prisma.notification.create({
      data: {
        messageId: message.id,
        userId: data.recipientId,
        type: messageType,
      },
    });

    // 이메일 발송 (type=4인 경우만)
    if (shouldSendEmail && message.recipient?.email) {
      try {
        const emailTemplate = getMessageEmailTemplate(
          message.sender?.name || "RBS HOMES",
          message.title,
          message.content,
          message.recipient?.name || "User"
        );

        await sendEmail({
          to: message.recipient.email,
          subject: `[RBS HOMES] ${message.title}`,
          html: emailTemplate,
        });

        console.log(`Email sent successfully to ${message.recipient.email}`);
      } catch (emailError) {
        console.error("Failed to send email, but message was created:", emailError);
        // 이메일 전송 실패해도 쪽지는 생성됨
      }
    }

    revalidatePath("/messages");

    return { success: true, message };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 전체 공지 메시지 발송 (type=4일 때 이메일도 함께 전송)
 */
export async function sendBroadcastMessage(data: {
  title: string;
  content: string;
  type?: number; // 0: 일반, 4: 이메일 포함
  priority?: number;
  templateId?: number;
}) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const senderId = parseInt(session.user.id);
    const messageType = data.type || 0;
    const shouldSendEmail = messageType === 4; // type=4일 때만 이메일 발송

    // 메시지 생성
    const message = await prisma.message.create({
      data: {
        senderId,
        title: data.title,
        content: data.content,
        type: messageType,
        priority: data.priority || 0,
        templateId: data.templateId,
      },
    });

    // 모든 사용자(자신 제외)에게 알림 생성
    const allUsers = await prisma.user.findMany({
      where: { 
        status: -1,
        id: { not: senderId }
      },
      select: { id: true, email: true, name: true },
    });

    if (allUsers.length > 0) {
      await prisma.notification.createMany({
        data: allUsers.map(u => ({
          messageId: message.id,
          userId: u.id,
          type: messageType,
        })),
        skipDuplicates: true,
      });

      // 이메일 대량 발송 (type=4인 경우만)
      if (shouldSendEmail) {
        try {
          const sender = await prisma.user.findUnique({
            where: { id: senderId },
            select: { name: true },
          });

          const emailTemplate = getMessageEmailTemplate(
            sender?.name || "RBS HOMES",
            data.title,
            data.content,
            "User"
          );

          // 모든 사용자에게 이메일 발송 (병렬 처리)
          await Promise.allSettled(
            allUsers.map(user =>
              sendEmail({
                to: user.email || "",
                subject: `[RBS HOMES] ${data.title}`,
                html: emailTemplate,
              }).catch((err: any) => {
                console.error(`Failed to send email to ${user.email}:`, err);
              })
            )
          );

          console.log(`Broadcast emails sent to ${allUsers.length} users`);
        } catch (emailError) {
          console.error("Failed to send broadcast emails:", emailError);
        }
      }
    }

    revalidatePath("/messages");

    return { success: true, message };
  } catch (error) {
    console.error("Error sending broadcast message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 특정 그룹에 메시지 발송 (type=4일 때 이메일도 함께 전송)
 */
export async function sendToGroup(data: {
  groupId: number;
  title: string;
  content: string;
  type?: number; // 0: 일반, 4: 이메일 포함
  priority?: number;
  templateId?: number;
}) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);
    const messageType = data.type || 0;
    const shouldSendEmail = messageType === 4; // type=4일 때만 이메일 발송

    // 그룹 존재 확인
    const group = await prisma.messageGroup.findUnique({
      where: { id: data.groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    if (!group) {
      return { success: false, error: "Group not found" };
    }

    // 그룹 멤버 확인
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) {
      return { success: false, error: "Not a member of this group" };
    }

    // 메시지 생성
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        groupId: data.groupId,
        title: data.title,
        content: data.content,
        type: messageType,
        priority: data.priority || 0,
        templateId: data.templateId,
      },
    });

    // 그룹 멤버 모두에게 알림 생성 (발신자 제외)
    const otherMembers = group.members.filter(m => m.userId !== userId);
    
    if (otherMembers.length > 0) {
      await prisma.notification.createMany({
        data: otherMembers.map(m => ({
          messageId: message.id,
          userId: m.userId,
          type: messageType,
        })),
        skipDuplicates: true,
      });

      // 이메일 발송 (type=4인 경우만)
      if (shouldSendEmail) {
        try {
          const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });

          const emailTemplate = getMessageEmailTemplate(
            sender?.name || "RBS HOMES",
            data.title,
            data.content,
            "Group Member"
          );

          // 각 그룹 멤버에게 이메일 발송
          await Promise.allSettled(
            otherMembers.map(member =>
              sendEmail({
                to: member.user.email || "",
                subject: `[RBS HOMES] ${data.title}`,
                html: emailTemplate,
              }).catch((err: any) => {
                console.error(`Failed to send email to ${member.user.email}:`, err);
              })
            )
          );

          console.log(`Group emails sent to ${otherMembers.length} members`);
        } catch (emailError) {
          console.error("Failed to send group emails:", emailError);
        }
      }
    }

    revalidatePath("/messages");

    return { success: true, message };
  } catch (error) {
    console.error("Error sending group message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 받은 메시지 목록 조회
 */
export async function getReceivedMessages(page: number = 1, limit: number = 20) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { recipientId: userId },
            {
              group: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
          status: { not: 2 },
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({
        where: {
          OR: [
            { recipientId: userId },
            {
              group: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
          status: { not: 2 },
        },
      }),
    ]);

    return { success: true, messages, total };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 발송 메시지 목록 조회
 */
export async function getSentMessages(page: number = 1, limit: number = 20) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          senderId: userId,
          status: { not: 2 },
        },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({
        where: {
          senderId: userId,
          status: { not: 2 },
        },
      }),
    ]);

    return { success: true, messages, total };
  } catch (error) {
    console.error("Error fetching sent messages:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 메시지 삭제 (알림도 함께 삭제)
 */
export async function deleteMessage(messageId: number) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    // 메시지가 존재하는지 확인
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, recipientId: true },
    });

    if (!message) {
      return { success: false, error: "Message not found" };
    }

    // 자신이 보낸 메시지이거나 받은 메시지인 경우만 삭제 가능
    if (message.senderId !== userId && message.recipientId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 관련된 알림 삭제
    await prisma.notification.deleteMany({
      where: { messageId },
    });

    // 메시지 삭제 (소프트 삭제)
    await prisma.message.update({
      where: { id: messageId },
      data: { status: 2 }, // 2 = 삭제됨
    });

    revalidatePath("/messages");

    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 여러 메시지 일괄 삭제 (알림도 함께 삭제)
 */
export async function deleteMultipleMessages(messageIds: number[]) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    if (!messageIds || messageIds.length === 0) {
      return { success: false, error: "No messages selected" };
    }

    // 메시지들이 존재하는지 확인하고 권한 확인
    const messages = await prisma.message.findMany({
      where: { id: { in: messageIds } },
      select: { id: true, senderId: true, recipientId: true },
    });

    if (messages.length === 0) {
      return { success: false, error: "Messages not found" };
    }

    // 모든 메시지에 대한 권한 확인
    const unauthorizedMessages = messages.filter(
      (msg) => msg.senderId !== userId && msg.recipientId !== userId
    );

    if (unauthorizedMessages.length > 0) {
      return {
        success: false,
        error: `Unauthorized to delete ${unauthorizedMessages.length} message(s)`,
      };
    }

    // 관련된 모든 알림 삭제
    await prisma.notification.deleteMany({
      where: { messageId: { in: messageIds } },
    });

    // 메시지들 일괄 삭제 (소프트 삭제)
    await prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { status: 2 }, // 2 = 삭제됨
    });

    revalidatePath("/messages");

    return {
      success: true,
      deletedCount: messages.length,
    };
  } catch (error) {
    console.error("Error deleting multiple messages:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * 모든 메시지 조회 (Notification 기반 읽음 상태)
 */
export async function getAllMessages(page: number = 1, limit: number = 20) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          notifications: {
            where: { userId },
            select: {
              isRead: true,
              readAt: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({
        where: {
        },
      }),
    ]);

    // 읽음 상태를 Notification 기반으로 변환
    const transformedMessages = messages.map(msg => {
      const notification = msg.notifications?.[0];
      return {
        ...msg,
        isRead: notification?.isRead || false,
        readAt: notification?.readAt || null,
        notifications: undefined, // 응답에서 제거
      };
    });

    return { success: true, messages: transformedMessages, total };
  } catch (error) {
    console.error("Error fetching all messages:", error);
    return { success: false, error: String(error), messages: [], total: 0 };
  }
}

/**
 * 메시지 읽음 처리
 */
export async function markMessageAsRead(messageId: number) {
  try {
    const session: any = await getServerSession(authOptions as any);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = parseInt(session.user.id);

    // 메시지 읽음 처리
    const message = await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 1, // 읽음
        readAt: new Date(),
      },
    });

    // 알림 읽음 처리
    await prisma.notification.update({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/messages");

    return { success: true, message };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error: String(error) };
  }
}

// ==================== 사용자 검색 ====================

/**
 * 사용자 검색 (이름, 이메일로 검색)
 */
export async function searchUsers(keyword: string, limit: number = 8) {
  try {
    if (!keyword || keyword.trim().length === 0) {
      return { success: true, users: [] };
    }
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { email: { contains: keyword } },
        ],
        status: -1,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: limit,
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: String(error), users: [] };
  }
}